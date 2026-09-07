import type {
  Room,
  Player,
  RoomSnapshot,
  PlayerInfo,
  QuestionPayload,
  ResultsPayload,
  LeaderboardEntry,
  GameMode,
  TeamScore,
  WagerResult,
  PowerUpEffect,
  WagerPayload,
  WagerType,
  ServerEvent,
} from "./types";
import { generateRoomCode } from "./room-code";
import { randomBytes } from "crypto";

/** 32-char URL-safe random token. ~192 bits of entropy — infeasible to guess. */
function generateToken(): string {
  return randomBytes(24).toString("base64url");
}
import {
  calculateScore, getQuestionValues, competitionRanks,
  FASTEST_BONUS, POWER_UP_USES, FREEZE_SECONDS, maxWagerFor, lowestScorers,
} from "./scoring";
import { fuzzyMatch } from "../fuzzy-match";
import { sanitizeName, sanitizeEmoji } from "../sanitize";
import { broadcast, removeRoomConnections, setPrunedHandler } from "./sse-manager";
import { getQuiz } from "@/lib/quiz-store";
import type { Question } from "@/data/types";

/** Broadcast wrapper that also marks the room as active. Use this for every
 * state-changing event so the idle reaper leaves live games alone. */
function bcast(room: Room, event: ServerEvent): void {
  room.lastActivityAt = Date.now();
  broadcast(room.code, event);
}

// Persist on globalThis to survive HMR in development
const g = globalThis as typeof globalThis & {
  __quiz_rooms?: Map<string, Room>;
  __quiz_cleanup?: ReturnType<typeof setInterval>;
  __quiz_pending_disconnects?: Map<string, ReturnType<typeof setTimeout>>;
};
if (!g.__quiz_rooms) g.__quiz_rooms = new Map();
if (!g.__quiz_pending_disconnects) g.__quiz_pending_disconnects = new Map();
const rooms = g.__quiz_rooms;
const pendingDisconnects = g.__quiz_pending_disconnects;
const DISCONNECT_GRACE_MS = 120_000;

function disconnectKey(code: string, playerId: string) {
  return `${code.toUpperCase()}:${playerId}`;
}

/**
 * A player's stream came back. Cancel any pending disconnect and, if the grace
 * period had already elapsed, mark them present again.
 *
 * Restoring `connected` used to be missing entirely: only `joinRoom` ever set it
 * to true, and the play page re-opens SSE on reconnect without re-joining. So a
 * phone that locked for more than the 120s grace window came back to a room that
 * still believed it was gone — permanently excluded from team-mode answerer
 * rotation, greyed out for everyone, with no path back short of a full rejoin.
 */
export function cancelPendingDisconnect(code: string, playerId: string) {
  const key = disconnectKey(code, playerId);
  const t = pendingDisconnects.get(key);
  if (t) {
    clearTimeout(t);
    pendingDisconnects.delete(key);
  }

  const room = rooms.get(code.toUpperCase());
  if (!room) return;
  const player = room.players.get(playerId);
  if (!player || player.connected) return;

  player.connected = true;
  bcast(room, { type: "player-joined", data: { player: playerToInfo(player) } });
}

/**
 * Called when an SSE connection for a player closes. If the player has no other
 * active connections after a grace period, mark them disconnected.
 */
/*
 * A connection found dead while broadcasting gets the same treatment as one
 * the heartbeat notices — without this, the grace timer started up to a
 * heartbeat late (see `setPrunedHandler`).
 */
setPrunedHandler((code, playerId, hasOthers) => handleConnectionLost(code, playerId, hasOthers));

export function handleConnectionLost(code: string, playerId: string, hasOtherConnections: boolean) {
  if (hasOtherConnections) return; // still connected elsewhere

  const key = disconnectKey(code, playerId);
  // Already pending
  if (pendingDisconnects.has(key)) return;

  const t = setTimeout(() => {
    pendingDisconnects.delete(key);
    const room = rooms.get(code.toUpperCase());
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player) return;
    // If they already reconnected via a fresh SSE stream, connected stays true in broadcast
    player.connected = false;
    bcast(room, { type: "player-left", data: { playerId } });

    // During lobby, fully remove the player so the host isn't stuck waiting on ghosts.
    if (room.state === "lobby") {
      room.players.delete(playerId);
      bcast(room, { type: "room-state", data: getRoomSnapshot(room) });
    }
  }, DISCONNECT_GRACE_MS);

  pendingDisconnects.set(key, t);
}

// Auto-cleanup idle rooms. Previously this ran on `createdAt`, which deleted
// rooms mid-game once a session passed 2h — players saw "Room not found"
// and the host's room evaporated. Now we only reap rooms that are either
// finished or empty AND have been idle (no broadcasts) for the TTL window.
const ROOM_IDLE_TTL_MS = 2 * 60 * 60 * 1000; // 2h with no activity
const ROOM_HARD_TTL_MS = 12 * 60 * 60 * 1000; // safety net — never let a room live past 12h
if (!g.__quiz_cleanup) {
  g.__quiz_cleanup = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      const idleMs = now - (room.lastActivityAt ?? room.createdAt);
      const ageMs = now - room.createdAt;
      const isAbandoned = room.state === "finished" || room.players.size === 0;
      const idleTooLong = isAbandoned && idleMs > ROOM_IDLE_TTL_MS;
      const tooOld = ageMs > ROOM_HARD_TTL_MS;
      if (idleTooLong || tooOld) {
        if (room.questionTimer) clearTimeout(room.questionTimer);
        removeRoomConnections(code);
        rooms.delete(code);
      }
    }
  }, 60_000);
}

// --- Helpers ---

/** Fisher-Yates shuffle, returns new array */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function playerToInfo(p: Player): PlayerInfo {
  return {
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    score: p.score,
    connected: p.connected,
    eliminated: p.eliminated || undefined,
    teamIndex: p.teamIndex,
    powerUpUses: p.powerUpUses,
    usedPowerUpTypes: p.usedPowerUpTypes,
  };
}

function getLeaderboard(room: Room): LeaderboardEntry[] {
  const sorted = [...room.players.values()].sort((a, b) => b.score - a.score);
  const prev = room.previousLeaderboard ?? [];
  // Ties share a place. This was `i + 1`, which showed two players on the same
  // score as 2nd and 3rd.
  const ranks = competitionRanks(sorted);
  return sorted.map((p, i) => {
    const prevEntry = prev.find((e) => e.playerId === p.id);
    return {
      playerId: p.id,
      name: p.name,
      emoji: p.emoji,
      score: p.score,
      rank: ranks[i],
      previousRank: prevEntry?.rank,
      previousScore: prevEntry?.score,
    };
  });
}

/** Get active (non-eliminated) players */
function getActivePlayers(room: Room): Player[] {
  return [...room.players.values()].filter((p) => !p.eliminated);
}

/** Get the shuffled correct answer index for the current question */
function getShuffledCorrectIndex(room: Room): number {
  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];
  const optShuffle = room.optionShuffles[room.currentQuestionIndex];
  // optShuffle[displayIdx] = originalIdx, so find where original correct ended up
  return optShuffle.indexOf(q.correct);
}

/** Map a player's answer (display index) back to the original index */
function displayToOriginal(room: Room, displayIndex: number): number {
  const optShuffle = room.optionShuffles[room.currentQuestionIndex];
  return optShuffle[displayIndex];
}

function getQuestionPayload(room: Room): QuestionPayload {
  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];
  const optShuffle = room.optionShuffles[room.currentQuestionIndex];

  // Reorder options according to shuffle
  const shuffledOptions = optShuffle.map((origIdx) => {
    // For bluff questions, one option may have been replaced
    if (q.type === "bluff" && q.bluffAnswer && room.bluffReplacedOriginalIndex === origIdx) {
      return q.bluffAnswer;
    }
    return q.options[origIdx];
  }) as [string, string, string, string];

  const payload: QuestionPayload = {
    index: room.currentQuestionIndex,
    total: room.questionIndices.length,
    question: q.question,
    options: shuffledOptions,
    timerDuration: room.timerDuration,
    startTime: room.questionStartTime,
    serverNow: Date.now(),
    image: q.image,
    type: q.type,
    audioUrl: q.audioUrl,
    videoUrl: q.videoUrl,
    progressiveReveal: q.progressiveReveal,
    isWagerRound: room.isWagerRound || undefined,
  };

  // Team mode: include who can answer
  if (room.gameMode === "team") {
    payload.currentTeamAnswerers = [...room.currentTeamAnswerer.values()];
  }

  // Include randomly assigned power-ups
  if (room.activePowerUps.size > 0) {
    payload.roundPowerUps = [...room.activePowerUps.entries()].map(([pid, pu]) => ({
      playerId: pid,
      powerUp: pu,
    }));
  }

  return payload;
}

function getTeamScores(room: Room): TeamScore[] {
  if (room.gameMode !== "team") return [];
  const scores: TeamScore[] = [];
  for (let i = 0; i < room.teamCount; i++) {
    let total = 0;
    for (const p of room.players.values()) {
      if (p.teamIndex === i) total += p.score;
    }
    scores.push({
      teamIndex: i,
      teamName: room.teamNames[i] || `Team ${i + 1}`,
      score: total,
    });
  }
  return scores.sort((a, b) => b.score - a.score);
}

function getResultsPayload(room: Room): ResultsPayload {
  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];
  const shuffledCorrectIdx = getShuffledCorrectIndex(room);

  // Distribution in display order
  const distribution = [0, 0, 0, 0];
  const playerResults: ResultsPayload["playerResults"] = [];
  const bluffVictims: string[] = [];
  const wagerResults: WagerResult[] = [];
  const powerUpEffects: PowerUpEffect[] = [];

  // Text and year questions reuse `currentAnswer` as a 0/-1 "has answered" flag,
  // so counting it here piled every correct text answer onto option A. Only
  // multiple-choice rounds have a distribution at all.
  const hasChoices = q.type !== "fastest-finger" && q.type !== "year-guesser";

  for (const player of room.players.values()) {
    if (hasChoices && player.currentAnswer !== null
        && player.currentAnswer >= 0 && player.currentAnswer < distribution.length) {
      distribution[player.currentAnswer]++;
    }

    // Check correctness — fastest-finger uses text comparison, year-guesser uses proximity
    let correct: boolean;
    if (q.type === "fastest-finger") {
      if (!player.currentTextAnswer) {
        correct = false;
      } else {
        const accepted = q.acceptedAnswers ?? [q.options[q.correct]];
        correct = fuzzyMatch(player.currentTextAnswer, accepted);
      }
    } else if (q.type === "year-guesser") {
      if (!player.currentTextAnswer || q.correctYear == null) {
        correct = false;
      } else {
        const guessed = parseInt(player.currentTextAnswer, 10);
        correct = !isNaN(guessed) && scoreYearGuess(guessed, q.correctYear) > 0;
      }
    } else {
      const originalAnswer = player.currentAnswer !== null
        ? displayToOriginal(room, player.currentAnswer)
        : -1;
      correct = originalAnswer === q.correct;
    }

    // Check if player picked bluff answer
    if (q.type === "bluff" && room.bluffDisplayIndex !== null && player.currentAnswer === room.bluffDisplayIndex) {
      bluffVictims.push(player.name);
    }

    // Power-up effects are collected after the loop

    // Wager results
    if (room.isWagerRound && room.wagers.has(player.id)) {
      const wager = room.wagers.get(player.id)!;
      wagerResults.push({
        playerId: player.id,
        playerName: player.name,
        wager,
        won: correct,
        netPoints: correct ? wager : -wager,
      });
    }

    // Report exactly what was added to `score` when the answer came in.
    // Recomputing here silently dropped the double multiplier, the wager swing
    // and the fastest-finger bonus, so the "+points" a player saw never matched
    // the jump in their total.
    const basePts = player.lastPointsAwarded;

    playerResults.push({
      playerId: player.id,
      playerName: player.name,
      playerEmoji: player.emoji,
      correct,
      points: basePts,
      totalScore: player.score,
      streak: player.streak,
    });
  }

  // The fastest-answerer bonus is deliberately NOT applied here — see
  // `applyFastestBonus`. This function must stay free of score writes.

  // --- Power-up effects (freeze, shield, double) ---
  for (const [pid, pu] of room.activePowerUps) {
    const pr = playerResults.find((r) => r.playerId === pid);
    if (!pr) continue;
    const player = room.players.get(pid);
    if (!player) continue;
    pr.powerUp = pu;

    if (pu === "double" && pr.correct) {
      // Reporting only. The multiplier is applied once, at submit time
      // (submitAnswer / submitTextAnswer / submitYearAnswer). This block used
      // to add a *second* helping on top of that, so Double paid 3x while the
      // UI announced 2x.
      pr.powerUpEffect = "Double points!";
      powerUpEffects.push({ playerId: pid, playerName: player.name, powerUp: "double", effect: "2x points!" });
    }

    if (pu === "shield" && !pr.correct) {
      pr.powerUpEffect = "Shield saved streak!";
      powerUpEffects.push({ playerId: pid, playerName: player.name, powerUp: "shield", effect: "Streak protected!" });
    }

    if (pu === "freeze") {
      pr.powerUpEffect = "Froze the timer!";
      powerUpEffects.push({ playerId: pid, playerName: player.name, powerUp: "freeze", effect: "Timer -3s!" });
    }
  }

  const result: ResultsPayload = {
    correctAnswer: shuffledCorrectIdx,
    explanation: q.explanation,
    answerDistribution: distribution,
    playerResults,
    leaderboard: getLeaderboard(room),
  };

  // Fastest finger data
  if (q.type === "fastest-finger") {
    const accepted = q.acceptedAnswers ?? [q.options[q.correct]];
    const correctPlayers = [...room.players.values()]
      .filter(p => p.currentTextAnswer != null && fuzzyMatch(p.currentTextAnswer, accepted))
      .sort((a, b) => (a.answerTime ?? Infinity) - (b.answerTime ?? Infinity));

    if (correctPlayers.length > 0) {
      result.fastestFinger = {
        playerId: correctPlayers[0].id,
        playerName: correctPlayers[0].name,
        bonusPoints: FASTEST_BONUS,
      };
    }
    // Include the correct answer text for display
    result.correctAnswerText = q.acceptedAnswers?.[0] ?? q.options[q.correct];
  }

  // Year guesser data
  if (q.type === "year-guesser" && q.correctYear != null) {
    const yearGuesses: ResultsPayload["yearGuesses"] = [];
    for (const player of room.players.values()) {
      if (player.currentTextAnswer) {
        const guessed = parseInt(player.currentTextAnswer, 10);
        if (!isNaN(guessed)) {
          yearGuesses.push({
            playerId: player.id,
            playerName: player.name,
            guessedYear: guessed,
            correctYear: q.correctYear,
            points: scoreYearGuess(guessed, q.correctYear),
          });
        }
      }
    }
    // Sort by closest guess
    yearGuesses.sort((a, b) => {
      const diffA = Math.abs(a.guessedYear - a.correctYear);
      const diffB = Math.abs(b.guessedYear - b.correctYear);
      return diffA - diffB;
    });
    result.yearGuesses = yearGuesses;
  }

  // Bluff data
  if (q.type === "bluff" && q.bluffAnswer) {
    result.bluffAnswer = q.bluffAnswer;
    result.bluffIndex = room.bluffDisplayIndex ?? undefined;
    result.bluffVictims = bluffVictims;
  }

  // Team scores
  if (room.gameMode === "team") {
    result.teamScores = getTeamScores(room);
  }

  // Wager results
  if (room.isWagerRound && wagerResults.length > 0) {
    result.wagerResults = wagerResults;
  }

  // Power-up effects
  if (powerUpEffects.length > 0) {
    result.powerUpEffects = powerUpEffects;
  }

  // The options in display order, so the results screen doesn't depend on the
  // question payload still being around.
  const optShuffle = room.optionShuffles[room.currentQuestionIndex];
  result.options = optShuffle.map((origIdx) => q.options[origIdx]);

  return result;
}

export function getRoomSnapshot(room: Room): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    state: room.state,
    players: [...room.players.values()].map((p) => ({
      ...playerToInfo(p),
      // Whether they've locked a wager in, so the host screen can show
      // progress instead of a static row of avatars. Deliberately a boolean
      // and never the amount — the amount is the whole bluff.
      hasWagered: room.isWagerRound ? room.wagers.has(p.id) : undefined,
    })),
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.questionIndices.length,
    gameMode: room.gameMode,
  };

  if (room.gameMode === "team") {
    snapshot.teamNames = room.teamNames;
  }

  if (room.state === "question") {
    snapshot.question = getQuestionPayload(room);
    // Replay the freeze as state rather than relying on the one-shot event.
    snapshot.timerReduction = room.freezeActive ? FREEZE_SECONDS : 0;
  } else if (room.state === "results") {
    // Use cached payload — do NOT call getResultsPayload here (it mutates scores)
    // Safe to recompute now that `getResultsPayload` writes nothing. Before
    // the split, an empty cache here re-awarded the fastest bonus.
    snapshot.results = room.cachedResults ?? getResultsPayload(room);
  } else if (room.state === "finished") {
    snapshot.leaderboard = getLeaderboard(room);
  } else if (room.state === "wager") {
    snapshot.wager = getWagerPayload(room);
  }

  return snapshot;
}

function getWagerPayload(room: Room): WagerPayload {
  // No `maxWager` here: the cap is per-player and this payload is broadcast to
  // the whole room. The field used to be shipped as a literal `0`, which no
  // consumer read and which implied a room-wide limit that never existed. Each
  // client derives its own with `maxWagerFor(score)` — the same function the
  // server clamps with.
  return {
    questionIndex: room.currentQuestionIndex,
    wagerType: room.wagerType,
  };
}

// --- Setup helpers ---

function setupBluffQuestion(room: Room, questionIdx: number): void {
  const qIndex = room.questionIndices[questionIdx];
  const q = room.questions[qIndex];

  if (q.type !== "bluff" || !q.bluffAnswer) {
    room.bluffDisplayIndex = null;
    room.bluffReplacedOriginalIndex = null;
    return;
  }

  const optShuffle = room.optionShuffles[questionIdx];
  // Find wrong options in display order
  const wrongDisplayIndices = optShuffle
    .map((origIdx, displayIdx) => ({ origIdx, displayIdx }))
    .filter(({ origIdx }) => origIdx !== q.correct);

  if (wrongDisplayIndices.length === 0) return;

  // Pick a random wrong option to replace
  const pick = wrongDisplayIndices[Math.floor(Math.random() * wrongDisplayIndices.length)];
  room.bluffDisplayIndex = pick.displayIdx;
  room.bluffReplacedOriginalIndex = pick.origIdx;
}

function rotateTeamAnswerers(room: Room): void {
  if (room.gameMode !== "team") return;

  room.currentTeamAnswerer.clear();

  // Group players by team. Skip disconnected so a dropped teammate doesn't
  // stall the round — someone else on the team picks up the slack.
  const teamPlayers: Map<number, Player[]> = new Map();
  for (const p of room.players.values()) {
    if (p.teamIndex !== null && !p.eliminated && p.connected) {
      if (!teamPlayers.has(p.teamIndex)) teamPlayers.set(p.teamIndex, []);
      teamPlayers.get(p.teamIndex)!.push(p);
    }
  }

  // For each team, pick the next player based on rotation
  for (const [teamIdx, players] of teamPlayers) {
    if (players.length === 0) continue;
    const idx = room.teamRotationIndex % players.length;
    room.currentTeamAnswerer.set(teamIdx, players[idx].id);
  }

  room.teamRotationIndex++;
}

// --- Public API ---

export async function createRoom(
  hostId: string,
  quizIds: string | string[],
  questionCount?: number,
  timerDuration?: number,
  gameMode?: GameMode,
  teamCount?: number,
  eliminationInterval?: number
): Promise<Room> {
  // Support both single ID and array of IDs
  const ids = Array.isArray(quizIds) ? quizIds : [quizIds];
  if (ids.length === 0) throw new Error("No quiz selected");

  // Load all quizzes and merge questions
  const allQuestions: Question[] = [];
  for (const qid of ids) {
    const quiz = await getQuiz(qid);
    if (!quiz) throw new Error(`Quiz "${qid}" not found`);
    allQuestions.push(...quiz.questions);
  }
  if (allQuestions.length === 0) throw new Error("Quizzes have no questions");

  // Deduplicate questions by their text to prevent repeats across quizzes
  const seen = new Set<string>();
  const questions = allQuestions.filter((q) => {
    const key = q.question.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (questions.length === 0) throw new Error("No unique questions found");

  let code: string;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  // Shuffle and pick questions
  const allIndices = shuffle(questions.map((_, i) => i));
  const count = Math.max(1, Math.min(questionCount ?? 15, questions.length));
  const questionIndices = allIndices.slice(0, count);

  // Generate shuffled option orders for each selected question
  // Skip shuffling for true-false questions (only 2 options)
  const optionShuffles = questionIndices.map((qIdx) => {
    const q = questions[qIdx];
    if (q.type === "true-false") return [0, 1, 2, 3];
    return shuffle([0, 1, 2, 3]);
  });

  const DEFAULT_TEAM_NAMES = ["Alpha", "Bravo", "Charlie", "Delta"];

  const room: Room = {
    code,
    hostId,
    hostToken: generateToken(),
    state: "lobby",
    players: new Map(),
    questions,
    questionIndices,
    optionShuffles,
    currentQuestionIndex: 0,
    questionStartTime: 0,
    timerDuration: timerDuration ?? 20,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),

    gameMode: gameMode ?? "classic",
    eliminatedPlayers: new Set(),
    eliminationInterval: eliminationInterval ?? 3,

    teamCount: teamCount ?? 2,
    teamNames: DEFAULT_TEAM_NAMES.slice(0, teamCount ?? 2),
    currentTeamAnswerer: new Map(),
    teamRotationIndex: 0,

    wagers: new Map(),
    wagerInterval: 3,
    isWagerRound: false,
    wagerType: "regular" as WagerType,
    wagerCount: 0,

    questionTimer: null,

    activePowerUps: new Map(),
    freezeActive: false,

    bluffDisplayIndex: null,
    bluffReplacedOriginalIndex: null,

    previousLeaderboard: [],
    cachedResults: null,
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

/** Verify the caller is the host of this room. Returns the room on success, error otherwise. */
function verifyHost(code: string, hostId: string, hostToken: string): Room | { error: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostId || room.hostToken !== hostToken) {
    return { error: "Only the host can do that" };
  }
  return room;
}

/** Verify the caller owns this playerId in this room. Returns {room, player} or error. */
function verifyPlayer(
  code: string,
  playerId: string,
  token: string
): { room: Room; player: Player } | { error: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  const player = room.players.get(playerId);
  if (!player || player.token !== token) return { error: "Invalid session" };
  return { room, player };
}

/** Check if a given (hostId, token) pair owns this room. Used by GET /api/rooms. */
export function isHostOf(code: string, hostId: string, hostToken: string): boolean {
  const room = rooms.get(code.toUpperCase());
  if (!room) return false;
  return room.hostId === hostId && room.hostToken === hostToken;
}

/** Normalize a name for case/accent-insensitive duplicate check */
function normalizeName(name: string): string {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function joinRoom(
  code: string,
  playerId: string,
  rawName: string,
  rawEmoji: string,
  providedToken?: string
): { room: Room; player: Player } | { error: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };

  const existing = room.players.get(playerId);
  // Allow existing players to reconnect in any state; only block NEW joins after lobby.
  if (!existing && room.state !== "lobby") return { error: "Game already started" };
  if (!existing && room.players.size >= 50) return { error: "Room is full" };

  // Reconnecting must present the token issued on original join — prevents playerId hijack.
  if (existing && existing.token !== providedToken) {
    return { error: "This seat is taken by someone else" };
  }

  const name = sanitizeName(rawName);
  const emoji = sanitizeEmoji(rawEmoji);
  if (!name) return { error: "Invalid name" };

  // Check for duplicate name (case + accent insensitive)
  const normNew = normalizeName(name);
  for (const p of room.players.values()) {
    if (p.id !== playerId && normalizeName(p.name) === normNew) {
      return { error: "This name is taken" };
    }
  }

  // Reconnect or create
  let player = existing;
  if (player) {
    player.connected = true;
    player.name = name;
    player.emoji = emoji;
  } else {
    player = {
      id: playerId,
      token: generateToken(),
      name,
      emoji,
      score: 0,
      streak: 0,
      currentAnswer: null,
      answerTime: null,
      connected: true,
      eliminated: false,
      teamIndex: null,
      currentTextAnswer: null,
      lastPointsAwarded: 0,
      slowestStreak: 0,
      powerUpUses: POWER_UP_USES,
      usedPowerUpTypes: [],
    };
    room.players.set(playerId, player);
  }

  // Cancel any pending disconnect timer for this player
  cancelPendingDisconnect(room.code, playerId);

  bcast(room, { type: "player-joined", data: { player: playerToInfo(player) } });
  return { room, player };
}

export async function startGame(code: string, hostId: string, hostToken: string): Promise<{ error?: string }> {
  const verified = verifyHost(code, hostId, hostToken);
  if ("error" in verified) return verified;
  const room = verified;
  if (room.state !== "lobby") return { error: "Game already started" };
  if (room.players.size === 0) return { error: "Need at least one player" };

  // Init power-up uses for all players
  for (const p of room.players.values()) {
    p.eliminated = false;
    p.currentAnswer = null;
    p.answerTime = null;
    p.currentTextAnswer = null;
    p.slowestStreak = 0;
    p.powerUpUses = POWER_UP_USES;
    p.usedPowerUpTypes = [];
  }

  // Team mode: assign players to teams.
  // Note: do NOT call rotateTeamAnswerers here — startQuestionRound will do it for Q1,
  // otherwise the first team answerer would be advanced to index 1 instead of 0.
  if (room.gameMode === "team") {
    const playerArr = shuffle([...room.players.values()]);
    playerArr.forEach((p, i) => {
      p.teamIndex = i % room.teamCount;
    });
  }

  // Mystery multipliers removed — escalating question values replace them

  room.currentQuestionIndex = 0;
  startQuestionRound(room);

  return {};
}

export function submitAnswer(
  code: string,
  playerId: string,
  token: string,
  answerIndex: number
): { error?: string } {
  const verified = verifyPlayer(code, playerId, token);
  if ("error" in verified) return verified;
  const { room, player } = verified;
  if (room.state !== "question") return { error: "Can't answer right now" };
  if (player.currentAnswer !== null) return { error: "Already answered" };

  // Elimination: eliminated players can't answer
  if (player.eliminated) return { error: "You are eliminated" };

  // Team mode: only designated answerer can answer
  if (room.gameMode === "team") {
    const isDesignated = [...room.currentTeamAnswerer.values()].includes(playerId);
    if (!isDesignated) return { error: "Another team member answers this round" };
  }

  const now = Date.now();
  player.currentAnswer = answerIndex; // store display index
  player.answerTime = now;

  // Check correctness using the original index
  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];
  const originalIndex = displayToOriginal(room, answerIndex);
  const correct = originalIndex === q.correct;

  const elapsed = now - room.questionStartTime;
  const { points, newStreak } = calculateScore(
    correct,
    elapsed,
    room.timerDuration * 1000,
    player.streak,
    room.currentQuestionIndex
  );

  // Check active power-ups
  const activePU = room.activePowerUps.get(playerId);

  if (correct) {
    let finalPoints = points;
    // Double power-up: 2x base (capped at 2x the per-question cap)
    if (activePU === "double") {
      const { cap } = getQuestionValues(room.currentQuestionIndex);
      finalPoints = Math.min(points * 2, cap * 2);
    }
    // Wager bonus: win = +wager (flat, additive)
    const wagerBonus = (room.isWagerRound && room.wagers.has(playerId))
      ? room.wagers.get(playerId)!
      : 0;
    const awarded = finalPoints + wagerBonus;
    player.score += awarded;
    player.lastPointsAwarded = awarded;
    player.streak = newStreak;
  } else {
    // Wrong answer
    if (activePU === "shield") {
      // Shield: keep streak, still 0 points
    } else {
      player.streak = 0;
    }
    // Wager round: subtract wager
    if (room.isWagerRound && room.wagers.has(playerId)) {
      const wager = room.wagers.get(playerId)!;
      const lost = Math.min(wager, player.score);
      player.score -= lost;
      player.lastPointsAwarded = -lost;
    } else {
      player.lastPointsAwarded = 0;
    }
  }

  countAndMaybeAdvance(room, (p) => p.currentAnswer !== null);

  return {};
}

/**
 * Count who still owes an answer, tell the room, and advance if nobody does.
 *
 * This used to be three near-identical copies, one per submit function, and they
 * had silently diverged:
 *
 *   - The text and year copies never applied the team-mode filter, so in team
 *     mode only the designated teammate is *allowed* to answer but everyone was
 *     *counted* — `answered >= totalEligible` could never become true and every
 *     round hung until the raw timer expired. Any team game on a year-* quiz hit
 *     this on every single question.
 *   - None of the three skipped players whose disconnect grace period had already
 *     elapsed. Those players are certain not to answer, but still counted, so one
 *     dropped phone made every remaining round burn its full timer.
 *
 * One implementation, so the next question type cannot drift again.
 */
function countAndMaybeAdvance(room: Room, hasAnswered: (p: Player) => boolean): void {
  let answered = 0;
  let totalEligible = 0;

  for (const p of room.players.values()) {
    if (p.eliminated) continue;
    // Grace period already elapsed — they are not coming back for this round.
    if (!p.connected) continue;
    // Team mode: only the designated answerer for each team is eligible.
    if (room.gameMode === "team" && ![...room.currentTeamAnswerer.values()].includes(p.id)) continue;
    totalEligible++;
    if (hasAnswered(p)) answered++;
  }

  bcast(room, { type: "answer-count", data: { count: answered, total: totalEligible } });

  // `totalEligible === 0` would auto-advance instantly (0 >= 0). That happens if
  // everyone eligible has dropped; let the question timer close it out instead.
  if (totalEligible > 0 && answered >= totalEligible) {
    showResults(room);
  }
}

export function submitTextAnswer(
  code: string,
  playerId: string,
  token: string,
  answer: string
): { error?: string } {
  const verified = verifyPlayer(code, playerId, token);
  if ("error" in verified) return verified;
  const { room, player } = verified;
  if (room.state !== "question") return { error: "Can't answer right now" };
  if (player.currentTextAnswer !== null) return { error: "Already answered" };
  if (player.eliminated) return { error: "You are eliminated" };

  if (room.gameMode === "team") {
    const isDesignated = [...room.currentTeamAnswerer.values()].includes(playerId);
    if (!isDesignated) return { error: "Another team member answers this round" };
  }

  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];

  player.currentTextAnswer = answer.trim();
  player.answerTime = Date.now();

  // Grade with fuzzyMatch — the same function results uses. These used to
  // disagree: submit graded on an exact string match while results graded
  // fuzzily, so a near-miss ("Beatles" for "The Beatles") was announced as
  // CORRECT on screen and awarded nothing.
  const acceptedAnswers = q.acceptedAnswers ?? [q.options[q.correct]];
  const correct = fuzzyMatch(player.currentTextAnswer, acceptedAnswers);

  // Use same scoring as regular answers
  const elapsed = player.answerTime - room.questionStartTime;
  const { points, newStreak } = calculateScore(correct, elapsed, room.timerDuration * 1000, player.streak, room.currentQuestionIndex);

  const activePU = room.activePowerUps.get(playerId);

  if (correct) {
    let finalPoints = points;
    if (activePU === "double") {
      const { cap } = getQuestionValues(room.currentQuestionIndex);
      finalPoints = Math.min(points * 2, cap * 2);
    }

    // Fastest finger bonus: flat FASTEST_BONUS
    const isFirstCorrect = ![...room.players.values()].some(p => {
      if (p.id === playerId) return false;
      if (!p.currentTextAnswer) return false;
      return fuzzyMatch(p.currentTextAnswer, acceptedAnswers);
    });
    const fastestBonus = isFirstCorrect ? FASTEST_BONUS : 0;

    const awarded = finalPoints + fastestBonus;
    player.score += awarded;
    player.lastPointsAwarded = awarded;
    player.streak = newStreak;
  } else {
    if (activePU === "shield") {
      // keep streak
    } else {
      player.streak = 0;
    }
    player.lastPointsAwarded = 0;
  }

  // Set currentAnswer to a dummy value to mark as answered (for answer count tracking)
  player.currentAnswer = correct ? 0 : -1;

  countAndMaybeAdvance(room, (p) => p.currentTextAnswer !== null);

  return {};
}

function scoreYearGuess(guessedYear: number, correctYear: number): number {
  const diff = Math.abs(guessedYear - correctYear);
  if (diff === 0) return 1500;
  if (diff <= 2) return 1200;
  if (diff <= 5) return 1000;
  if (diff <= 10) return 750;
  if (diff <= 25) return 500;
  if (diff <= 50) return 250;
  return 0;
}

export function submitYearAnswer(
  code: string,
  playerId: string,
  token: string,
  year: number
): { error?: string } {
  const verified = verifyPlayer(code, playerId, token);
  if ("error" in verified) return verified;
  const { room, player } = verified;
  if (room.state !== "question") return { error: "Can't answer right now" };
  if (player.currentTextAnswer !== null) return { error: "Already answered" };
  if (player.eliminated) return { error: "You are eliminated" };

  if (room.gameMode === "team") {
    const isDesignated = [...room.currentTeamAnswerer.values()].includes(playerId);
    if (!isDesignated) return { error: "Another team member answers this round" };
  }

  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];

  if (q.type !== "year-guesser" || q.correctYear == null) {
    return { error: "Not a year-guesser question" };
  }

  player.currentTextAnswer = String(year);
  player.answerTime = Date.now();

  const points = scoreYearGuess(year, q.correctYear);
  const activePU = room.activePowerUps.get(playerId);

  let finalPoints = points;
  if (activePU === "double" && points > 0) {
    const { cap } = getQuestionValues(room.currentQuestionIndex);
    finalPoints = Math.min(points * 2, cap * 2);
  }

  player.score += finalPoints;
  player.lastPointsAwarded = finalPoints;

  if (points > 0) {
    player.streak += 1;
  } else {
    if (activePU === "shield") {
      // keep streak
    } else {
      player.streak = 0;
    }
  }

  // Mark as answered for answer count tracking
  player.currentAnswer = points > 0 ? 0 : -1;

  countAndMaybeAdvance(room, (p) => p.currentTextAnswer !== null);

  return {};
}

/**
 * Awards the fastest-correct-answerer bonus. **Mutates scores.**
 *
 * This used to live inside `getResultsPayload`, which made that function a
 * getter that silently paid out points. `getRoomSnapshot` calls
 * `room.cachedResults ?? getResultsPayload(room)` — so any player opening a
 * stream while the cache happened to be empty would have re-awarded this
 * bonus, inflating a score just by connecting. Only the cache-is-never-null
 * invariant stood between that and a corrupted leaderboard.
 *
 * Now the payout is a separate, obviously-named call that `showResults` makes
 * exactly once per round, and `getResultsPayload` is safe to call as often as
 * anyone likes.
 *
 * Requires only two correct answers, not three: with a single correct answer
 * there is nobody to be faster than.
 */
function applyFastestBonus(room: Room, results: ResultsPayload): void {
  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];
  if (!q) return;
  if (q.type === "fastest-finger" || q.type === "year-guesser") return;

  const correctAnswerers = [...room.players.values()]
    .filter((p) => !p.eliminated && p.currentAnswer !== null && p.answerTime !== null)
    .filter((p) => displayToOriginal(room, p.currentAnswer!) === q.correct)
    .sort((a, b) => a.answerTime! - b.answerTime!);

  if (correctAnswerers.length < 2) return;

  const fastest = correctAnswerers[0];
  fastest.score += FASTEST_BONUS;
  fastest.lastPointsAwarded += FASTEST_BONUS;

  const fastestResult = results.playerResults.find((r) => r.playerId === fastest.id);
  if (fastestResult) {
    fastestResult.points += FASTEST_BONUS;
    fastestResult.totalScore = fastest.score;
    fastestResult.speedBonus = FASTEST_BONUS;
  }
}

function showResults(room: Room): void {
  // Idempotent: if we've already resolved results for this round, don't recompute
  // (prevents score inflation from re-applying fastest/double bonuses).
  if (room.cachedResults) return;

  // Clear server-side timer
  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }

  // Compute while state is still "question" — an SSE client connecting during the
  // compute window sees the question branch in getRoomSnapshot, not the results
  // branch that would otherwise fall through to a second getResultsPayload call
  // and mutate scores a second time.
  const results = getResultsPayload(room);
  // The one place the bonus is paid. Ordered before the cache is set so the
  // cached payload is the one that includes it.
  applyFastestBonus(room, results);
  room.cachedResults = results;
  room.state = "results";

  // Elimination mode: check if it's time to eliminate
  if (room.gameMode === "elimination") {
    const roundNum = room.currentQuestionIndex + 1;
    if (roundNum % room.eliminationInterval === 0) {
      const activePlayers = getActivePlayers(room);
      if (activePlayers.length > 1) {
        // The lowest scorer — with ties broken at random rather than by join
        // order, which is what a stable sort over an insertion-ordered list was
        // silently doing.
        const tied = lowestScorers(activePlayers);
        const toEliminate = tied[Math.floor(Math.random() * tied.length)];
        toEliminate.eliminated = true;
        room.eliminatedPlayers.add(toEliminate.id);

        results.eliminatedThisRound = [{
          playerId: toEliminate.id,
          playerName: toEliminate.name,
          playerEmoji: toEliminate.emoji,
        }];

        bcast(room, {
          type: "player-eliminated",
          data: {
            playerId: toEliminate.id,
            playerName: toEliminate.name,
            playerEmoji: toEliminate.emoji,
          },
        });

        // Check if only 1 player left → finish
        const remaining = getActivePlayers(room);
        if (remaining.length <= 1) {
          room.state = "finished";
          bcast(room, { type: "results", data: results });
          bcast(room, { type: "finished", data: { leaderboard: getLeaderboard(room) } });
          return;
        }
      }
    }
  }

  bcast(room, { type: "results", data: results });
}

export function nextQuestion(code: string, hostId: string, hostToken: string): { error?: string } {
  const verified = verifyHost(code, hostId, hostToken);
  if ("error" in verified) return verified;
  const room = verified;
  if (room.state !== "results") return { error: "Can't continue yet" };

  if (room.currentQuestionIndex + 1 >= room.questionIndices.length) {
    room.state = "finished";
    bcast(room, { type: "finished", data: { leaderboard: getLeaderboard(room) } });
    return {};
  }

  room.currentQuestionIndex++;

  // Clear power-ups and wager state
  room.activePowerUps.clear();
  room.freezeActive = false;
  room.isWagerRound = false;
  room.wagers.clear();

  // Trigger wager phase immediately before the FINAL question.
  // After incrementing currentQuestionIndex above, it now points at the next question to play.
  // We want wager to fire when that next question is the last one.
  const isFinalQuestion = room.currentQuestionIndex === room.questionIndices.length - 1;
  if (isFinalQuestion && room.wagerCount === 0 && room.questionIndices.length >= 2) {
    room.wagerCount++;
    room.wagerType = "regular";
    room.state = "wager";
    bcast(room, { type: "wager-start", data: getWagerPayload(room) });
    scheduleWagerTimer(room);
    return {};
  }

  // Normal question flow
  startQuestionRound(room);
  return {};
}

/** Schedule a server-side timer to auto-end the question when time runs out */
function scheduleQuestionTimer(room: Room): void {
  // Clear any existing timer
  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }

  // Add 2s buffer for network latency
  const ms = (room.timerDuration + 2) * 1000;
  room.questionTimer = setTimeout(() => {
    room.questionTimer = null;
    if (room.state === "question") {
      showResults(room);
    }
  }, ms);
}

/**
 * Safety net for the wager phase.
 *
 * Every other state that waits on players has a server-side timer. `wager` had
 * none: it advanced only when every active player had submitted, so a single
 * client that never sent one wedged the room indefinitely. This is the one place
 * in the state machine that could hang with no automatic recovery.
 */
function scheduleWagerTimer(room: Room): void {
  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }
  const ms = (room.timerDuration + 10) * 1000;
  room.questionTimer = setTimeout(() => {
    room.questionTimer = null;
    if (room.state === "wager") advanceFromWager(room);
  }, ms);
}

function startQuestionRound(room: Room): void {
  // Capture leaderboard before this round (for animated transitions)
  room.previousLeaderboard = getLeaderboard(room);

  // Clear cached results from previous round
  room.cachedResults = null;

  room.questionStartTime = Date.now();
  room.state = "question";

  // Reset player answers
  for (const p of room.players.values()) {
    p.currentAnswer = null;
    p.answerTime = null;
    p.currentTextAnswer = null;
    p.lastPointsAwarded = 0;
  }

  // Power-ups: players choose their own (via choose-powerup action during question phase)
  room.activePowerUps.clear();
  room.freezeActive = false;

  // Setup bluff if needed
  setupBluffQuestion(room, room.currentQuestionIndex);

  // Team mode: rotate answerers
  if (room.gameMode === "team") {
    rotateTeamAnswerers(room);
  }

  bcast(room, { type: "question-start", data: getQuestionPayload(room) });
  scheduleQuestionTimer(room);
}

export function submitWager(
  code: string,
  playerId: string,
  token: string,
  amount: number
): { error?: string } {
  const verified = verifyPlayer(code, playerId, token);
  if ("error" in verified) return verified;
  const { room, player } = verified;
  if (room.state !== "wager") return { error: "Can't wager right now" };
  if (player.eliminated) return { error: "You are eliminated" };

  // Clamp to the shared cap. The client renders its slider from the same
  // function, so the range it offers is the range the server accepts.
  const maxWager = maxWagerFor(player.score);
  const clamped = Math.max(0, Math.min(amount, maxWager));
  room.wagers.set(playerId, clamped);

  // Advance once everyone who *can* still wager has. Players whose disconnect
  // grace period has elapsed are never going to submit; including them meant one
  // dropped phone froze the wager screen for the entire room with no recovery
  // except the host noticing and advancing by hand.
  const pending = getActivePlayers(room).filter(
    (p) => p.connected && !room.wagers.has(p.id)
  );
  if (pending.length === 0) {
    advanceFromWager(room);
  }

  return {};
}

export function advanceFromWagerAction(code: string, hostId: string, hostToken: string): { error?: string } {
  const verified = verifyHost(code, hostId, hostToken);
  if ("error" in verified) return verified;
  const room = verified;
  if (room.state !== "wager") return { error: "No wager phase" };

  advanceFromWager(room);
  return {};
}

function advanceFromWager(room: Room): void {
  room.isWagerRound = true;
  startQuestionRound(room);
}

export function disconnectPlayer(code: string, playerId: string, token: string): void {
  const room = rooms.get(code.toUpperCase());
  if (!room) return;

  const player = room.players.get(playerId);
  // Token-gated: without this, anyone holding a room code could mark other
  // players as gone (and during lobby the grace-period reaper removes them
  // from the room entirely).
  if (!player || player.token !== token) return;

  player.connected = false;
  bcast(room, { type: "player-left", data: { playerId } });
}

export function forceShowResults(code: string, hostId: string, hostToken: string): { error?: string } {
  const verified = verifyHost(code, hostId, hostToken);
  if ("error" in verified) return verified;
  const room = verified;
  if (room.state !== "question") return { error: "No active question" };

  showResults(room);
  return {};
}

export function choosePowerUp(
  code: string,
  playerId: string,
  token: string,
  powerUp: "freeze" | "shield" | "double"
): { error?: string } {
  // Runtime whitelist — TS types are erased, prevent clients from burning uses on invalid types
  if (powerUp !== "freeze" && powerUp !== "shield" && powerUp !== "double") {
    return { error: "Invalid power-up" };
  }

  const verified = verifyPlayer(code, playerId, token);
  if ("error" in verified) return verified;
  const { room, player } = verified;
  if (room.state !== "question") return { error: "Can't use power-ups right now" };
  if (player.eliminated) return { error: "You are eliminated" };
  if (player.powerUpUses <= 0) return { error: "No power-up uses remaining" };
  if (room.activePowerUps.has(playerId)) return { error: "Already used a power-up this round" };
  if (player.usedPowerUpTypes.includes(powerUp)) return { error: "Already used this power-up type" };

  // Refuse a second Freeze in the same round *before* charging for it.
  //
  // Only the first Freeze of a round actually shortens the clock — the effect
  // is guarded by `room.freezeActive` below. But the use was deducted and the
  // type marked spent before that guard ran, and the results screen then told
  // the player "Froze the timer!" regardless. So a player could spend one of
  // their three power-ups, be congratulated for it, and have changed nothing.
  // Failing here instead means they keep the use and can pick something else.
  if (powerUp === "freeze" && room.freezeActive) {
    return { error: "The timer is already frozen this round" };
  }

  // Deduct use and record
  player.powerUpUses--;
  player.usedPowerUpTypes.push(powerUp);
  room.activePowerUps.set(playerId, powerUp);

  // Freeze auto-applies immediately — cut 3s off both the client-visible
  // countdown AND the server-side auto-end timer so they end in sync.
  // `!room.freezeActive` is guaranteed by the guard above; kept as a belt-and-
  // braces check so a future caller can't double-apply the timer cut.
  if (powerUp === "freeze" && !room.freezeActive) {
    room.freezeActive = true;
    bcast(room, { type: "timer-reduced", data: { seconds: FREEZE_SECONDS } });

    if (room.questionTimer) {
      clearTimeout(room.questionTimer);
      const originalEndMs = room.questionStartTime + (room.timerDuration + 2) * 1000;
      const remainingMs = Math.max(500, originalEndMs - FREEZE_SECONDS * 1000 - Date.now());
      room.questionTimer = setTimeout(() => {
        room.questionTimer = null;
        if (room.state === "question") {
          showResults(room);
        }
      }, remainingMs);
    }
  }

  // Only what changed. This was a full `getRoomSnapshot` broadcast — every
  // player, the entire question payload and the leaderboard, sent to every
  // client, for a tap that alters one player's counter.
  bcast(room, {
    type: "power-up-used",
    data: {
      playerId,
      powerUp,
      usesLeft: player.powerUpUses,
      usedTypes: [...player.usedPowerUpTypes],
      roundPowerUps: [...room.activePowerUps.entries()].map(([pid, pu]) => ({
        playerId: pid,
        powerUp: pu,
      })),
    },
  });

  return {};
}
