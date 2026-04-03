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
} from "./types";
import { ALL_POWER_UPS } from "./types";
import { generateRoomCode } from "./room-code";
import { calculateScore, getQuestionValues } from "./scoring";
import { fuzzyMatch } from "../fuzzy-match";
import { sanitizeName, sanitizeEmoji } from "../sanitize";
import { broadcast, removeRoomConnections } from "./sse-manager";
import { translateBatch } from "@/lib/translate";
import { getQuiz } from "@/lib/quiz-store";
import type { Question } from "@/data/types";

// Persist on globalThis to survive HMR in development
const g = globalThis as typeof globalThis & {
  __quiz_rooms?: Map<string, Room>;
  __quiz_cleanup?: ReturnType<typeof setInterval>;
};
if (!g.__quiz_rooms) g.__quiz_rooms = new Map();
const rooms = g.__quiz_rooms;

// Auto-cleanup rooms older than 2 hours (only one interval)
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
if (!g.__quiz_cleanup) {
  g.__quiz_cleanup = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (now - room.createdAt > ROOM_TTL_MS) {
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
  return sorted.map((p, i) => {
    const prevEntry = prev.find((e) => e.playerId === p.id);
    return {
      playerId: p.id,
      name: p.name,
      emoji: p.emoji,
      score: p.score,
      rank: i + 1,
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

  // Include Lithuanian translations if available (content is in English)
  const ltT = room.enTranslations.get(qIndex);
  if (ltT) {
    const ltShuffledOptions = optShuffle.map((origIdx) => {
      if (q.type === "bluff" && q.bluffAnswer && room.bluffReplacedOriginalIndex === origIdx) {
        return q.bluffAnswer;
      }
      return ltT.options[origIdx];
    }) as [string, string, string, string];
    payload.lt = {
      question: ltT.question,
      options: ltShuffledOptions,
    };
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

  for (const player of room.players.values()) {
    if (player.currentAnswer !== null && player.currentAnswer >= 0) {
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

    let basePts: number;
    if (q.type === "year-guesser" && player.currentTextAnswer && q.correctYear != null) {
      const guessed = parseInt(player.currentTextAnswer, 10);
      basePts = !isNaN(guessed) ? scoreYearGuess(guessed, q.correctYear) : 0;
    } else {
      basePts = correct ? calculateScore(
        true,
        (player.answerTime ?? room.questionStartTime) - room.questionStartTime,
        room.timerDuration * 1000,
        player.streak - 1,
        room.currentQuestionIndex
      ).points : 0;
    }

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

  // --- Fastest answerer bonus (only for standard multiple-choice, 3+ players) ---
  if (q.type !== "fastest-finger" && q.type !== "year-guesser") {
    const correctAnswerers = [...room.players.values()]
      .filter((p) => !p.eliminated && p.currentAnswer !== null && p.answerTime !== null)
      .filter((p) => {
        const origIdx = displayToOriginal(room, p.currentAnswer!);
        return origIdx === q.correct;
      })
      .sort((a, b) => a.answerTime! - b.answerTime!);

    if (correctAnswerers.length >= 2) {
      const fastest = correctAnswerers[0];
      const SPEED_BONUS = 150;
      fastest.score += SPEED_BONUS;
      const fastestResult = playerResults.find((r) => r.playerId === fastest.id);
      if (fastestResult) {
        fastestResult.points += SPEED_BONUS;
        fastestResult.totalScore = fastest.score;
        fastestResult.speedBonus = SPEED_BONUS;
      }
    }
  }

  // --- Power-up effects (thief, bomb, gamble, double, shield) ---
  for (const [pid, pu] of room.activePowerUps) {
    const pr = playerResults.find((r) => r.playerId === pid);
    if (!pr) continue;
    const player = room.players.get(pid);
    if (!player) continue;
    pr.powerUp = pu;

    if (pu === "thief" && pr.correct) {
      // Steal 300 from 1st place (or 2nd if thief IS 1st)
      const sorted = [...room.players.values()].filter((p) => !p.eliminated).sort((a, b) => b.score - a.score);
      const target = sorted.find((p) => p.id !== pid) ?? sorted[0];
      if (target && target.id !== pid) {
        const steal = Math.min(300, target.score);
        target.score -= steal;
        player.score += steal;
        pr.points += steal;
        pr.totalScore = player.score;
        pr.powerUpEffect = `Stole ${steal} from ${target.name}!`;
        const targetResult = playerResults.find((r) => r.playerId === target.id);
        if (targetResult) { targetResult.totalScore = target.score; }
        powerUpEffects.push({ playerId: pid, playerName: player.name, powerUp: "thief", effect: `Stole ${steal} pts from ${target.name}` });
      }
    }

    if (pu === "bomb" && pr.correct) {
      // Last place player loses 250
      const sorted = [...room.players.values()].filter((p) => !p.eliminated && p.id !== pid).sort((a, b) => a.score - b.score);
      const target = sorted[0];
      if (target) {
        const damage = Math.min(250, target.score);
        target.score -= damage;
        const targetResult = playerResults.find((r) => r.playerId === target.id);
        if (targetResult) { targetResult.totalScore = target.score; targetResult.points -= damage; }
        pr.powerUpEffect = `Bombed ${target.name}! -${damage}`;
        powerUpEffects.push({ playerId: pid, playerName: player.name, powerUp: "bomb", effect: `${target.name} lost ${damage} pts` });
      }
    }

    if (pu === "gamble") {
      pr.powerUpEffect = player.gambleWon ? "Gamble: 2x!" : "Gamble: 0!";
      powerUpEffects.push({ playerId: pid, playerName: player.name, powerUp: "gamble", effect: player.gambleWon ? "2x points!" : "Lost it all!" });
    }

    if (pu === "double" && pr.correct) {
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
    const accepted = q.acceptedAnswers ?? [q.options[q.correct].toLowerCase()];
    const correctPlayers = [...room.players.values()]
      .filter(p => {
        if (!p.currentTextAnswer) return false;
        const norm = p.currentTextAnswer.toLowerCase();
        return accepted.some(a => a.toLowerCase().trim() === norm);
      })
      .sort((a, b) => (a.answerTime ?? Infinity) - (b.answerTime ?? Infinity));

    if (correctPlayers.length > 0) {
      result.fastestFinger = {
        playerId: correctPlayers[0].id,
        playerName: correctPlayers[0].name,
        bonusPoints: 150,
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

  // Include Lithuanian translations for results (content is in English)
  const ltT = room.enTranslations.get(qIndex);
  if (ltT) {
    const optShuffle = room.optionShuffles[room.currentQuestionIndex];
    result.lt = {
      correctAnswerText: result.correctAnswerText
        ? ltT.options[q.correct]
        : undefined,
      explanation: ltT.explanation,
      options: optShuffle.map((origIdx) => ltT.options[origIdx]),
    };
  }

  return result;
}

export function getRoomSnapshot(room: Room): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    state: room.state,
    players: [...room.players.values()].map(playerToInfo),
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.questionIndices.length,
    gameMode: room.gameMode,
  };

  if (room.gameMode === "team") {
    snapshot.teamNames = room.teamNames;
  }

  if (room.state === "question") {
    snapshot.question = getQuestionPayload(room);
  } else if (room.state === "results") {
    snapshot.results = getResultsPayload(room);
  } else if (room.state === "finished") {
    snapshot.leaderboard = getLeaderboard(room);
  } else if (room.state === "wager") {
    snapshot.wager = getWagerPayload(room);
  }

  return snapshot;
}

function getWagerPayload(room: Room): WagerPayload {
  return {
    questionIndex: room.currentQuestionIndex,
    maxWager: 0, // per-player max is sent client-side from their own score
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

  // Group players by team
  const teamPlayers: Map<number, Player[]> = new Map();
  for (const p of room.players.values()) {
    if (p.teamIndex !== null && !p.eliminated) {
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
    state: "lobby",
    players: new Map(),
    questions,
    questionIndices,
    optionShuffles,
    currentQuestionIndex: 0,
    questionStartTime: 0,
    timerDuration: timerDuration ?? 20,
    createdAt: Date.now(),

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

    mysteryMultipliers: new Map(),
    enTranslations: new Map(),
    previousLeaderboard: [],
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function joinRoom(
  code: string,
  playerId: string,
  rawName: string,
  rawEmoji: string
): { room: Room; player: Player } | { error: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.state !== "lobby") return { error: "Game already started" };
  if (room.players.size >= 50) return { error: "Room is full" };

  const name = sanitizeName(rawName);
  const emoji = sanitizeEmoji(rawEmoji);
  if (!name) return { error: "Invalid name" };

  // Check for duplicate name
  for (const p of room.players.values()) {
    if (p.name.toLowerCase() === name.toLowerCase() && p.id !== playerId) {
      return { error: "This name is taken" };
    }
  }

  // Reconnect or create
  let player = room.players.get(playerId);
  if (player) {
    player.connected = true;
    player.name = name;
    player.emoji = emoji;
  } else {
    player = {
      id: playerId,
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
      slowestStreak: 0,
      powerUpUses: 3,
      usedPowerUpTypes: [],
    };
    room.players.set(playerId, player);
  }

  broadcast(room.code, { type: "player-joined", data: { player: playerToInfo(player) } });
  return { room, player };
}

export async function startGame(code: string, hostId: string): Promise<{ error?: string }> {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostId) return { error: "Only the host can start" };
  if (room.state !== "lobby") return { error: "Game already started" };
  if (room.players.size === 0) return { error: "Need at least one player" };

  // Init power-up uses for all players
  for (const p of room.players.values()) {
    p.eliminated = false;
    p.currentAnswer = null;
    p.answerTime = null;
    p.currentTextAnswer = null;
    p.slowestStreak = 0;
    p.powerUpUses = 3;
    p.usedPowerUpTypes = [];
  }

  // Team mode: assign players to teams
  if (room.gameMode === "team") {
    const playerArr = shuffle([...room.players.values()]);
    playerArr.forEach((p, i) => {
      p.teamIndex = i % room.teamCount;
    });
    rotateTeamAnswerers(room);
  }

  // Mystery multipliers removed — escalating question values replace them
  room.mysteryMultipliers.clear();

  // Pre-translate all questions to Lithuanian (content is in English)
  try {
    const allTexts: string[] = [];
    for (const idx of room.questionIndices) {
      const q = room.questions[idx];
      allTexts.push(q.question, ...q.options, q.explanation);
    }
    const translated = await translateBatch(allTexts, "en", "lt");
    let ti = 0;
    for (const idx of room.questionIndices) {
      const tQuestion = translated[ti++];
      const tOptions = [translated[ti++], translated[ti++], translated[ti++], translated[ti++]];
      const tExplanation = translated[ti++];
      room.enTranslations.set(idx, { question: tQuestion, options: tOptions, explanation: tExplanation });
    }
  } catch {
    // Translation failed — multiplayer will fall back to English
  }

  room.currentQuestionIndex = 0;
  startQuestionRound(room);
  return {};
}

export function submitAnswer(
  code: string,
  playerId: string,
  answerIndex: number
): { error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.state !== "question") return { error: "Can't answer right now" };

  const player = room.players.get(playerId);
  if (!player) return { error: "Player not found" };
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
    player.score += finalPoints + wagerBonus;
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
      player.score = Math.max(0, player.score - wager);
    }
  }

  // Broadcast answer count — only count active (non-eliminated) players
  let answered = 0;
  let totalEligible = 0;
  for (const p of room.players.values()) {
    if (p.eliminated) continue;
    if (room.gameMode === "team" && ![...room.currentTeamAnswerer.values()].includes(p.id)) continue;
    totalEligible++;
    if (p.currentAnswer !== null) answered++;
  }
  broadcast(room.code, {
    type: "answer-count",
    data: { count: answered, total: totalEligible },
  });

  // Auto-advance if everyone answered
  if (answered >= totalEligible) {
    showResults(room);
  }

  return {};
}

export function submitTextAnswer(
  code: string,
  playerId: string,
  answer: string
): { error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.state !== "question") return { error: "Can't answer right now" };

  const player = room.players.get(playerId);
  if (!player) return { error: "Player not found" };
  if (player.currentTextAnswer !== null) return { error: "Already answered" };
  if (player.eliminated) return { error: "You are eliminated" };

  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];

  player.currentTextAnswer = answer.trim();
  player.answerTime = Date.now();

  // Check correctness
  const normalizedAnswer = answer.trim().toLowerCase();
  const acceptedAnswers = q.acceptedAnswers ?? [q.options[q.correct].toLowerCase()];
  const correct = acceptedAnswers.some(a => a.toLowerCase().trim() === normalizedAnswer);

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

    // Fastest finger bonus: flat +150
    const isFirstCorrect = ![...room.players.values()].some(p => {
      if (p.id === playerId) return false;
      if (!p.currentTextAnswer) return false;
      const pNorm = p.currentTextAnswer.toLowerCase();
      return acceptedAnswers.some(a => a.toLowerCase().trim() === pNorm);
    });
    const fastestBonus = isFirstCorrect ? 150 : 0;

    player.score += finalPoints + fastestBonus;
    player.streak = newStreak;
  } else {
    if (activePU === "shield") {
      // keep streak
    } else {
      player.streak = 0;
    }
  }

  // Set currentAnswer to a dummy value to mark as answered (for answer count tracking)
  player.currentAnswer = correct ? 0 : -1;

  // Broadcast answer count
  let answered = 0;
  let totalEligible = 0;
  for (const p of room.players.values()) {
    if (p.eliminated) continue;
    totalEligible++;
    if (p.currentTextAnswer !== null) answered++;
  }
  broadcast(room.code, { type: "answer-count", data: { count: answered, total: totalEligible } });

  if (answered >= totalEligible) {
    showResults(room);
  }

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
  year: number
): { error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.state !== "question") return { error: "Can't answer right now" };

  const player = room.players.get(playerId);
  if (!player) return { error: "Player not found" };
  if (player.currentTextAnswer !== null) return { error: "Already answered" };
  if (player.eliminated) return { error: "You are eliminated" };

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

  // Broadcast answer count
  let answered = 0;
  let totalEligible = 0;
  for (const p of room.players.values()) {
    if (p.eliminated) continue;
    totalEligible++;
    if (p.currentTextAnswer !== null) answered++;
  }
  broadcast(room.code, { type: "answer-count", data: { count: answered, total: totalEligible } });

  if (answered >= totalEligible) {
    showResults(room);
  }

  return {};
}

function showResults(room: Room): void {
  // Clear server-side timer
  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }
  room.state = "results";

  const results = getResultsPayload(room);

  // Elimination mode: check if it's time to eliminate
  if (room.gameMode === "elimination") {
    const roundNum = room.currentQuestionIndex + 1;
    if (roundNum % room.eliminationInterval === 0) {
      const activePlayers = getActivePlayers(room);
      if (activePlayers.length > 1) {
        // Find the lowest-scoring non-eliminated player
        const sorted = [...activePlayers].sort((a, b) => a.score - b.score);
        const toEliminate = sorted[0];
        toEliminate.eliminated = true;
        room.eliminatedPlayers.add(toEliminate.id);

        results.eliminatedThisRound = [{
          playerId: toEliminate.id,
          playerName: toEliminate.name,
          playerEmoji: toEliminate.emoji,
        }];

        broadcast(room.code, {
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
          broadcast(room.code, { type: "results", data: results });
          broadcast(room.code, { type: "finished", data: { leaderboard: getLeaderboard(room) } });
          return;
        }
      }
    }
  }

  broadcast(room.code, { type: "results", data: results });
}

export function nextQuestion(code: string, hostId: string): { error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostId) return { error: "Only the host can continue" };
  if (room.state !== "results") return { error: "Can't continue yet" };

  if (room.currentQuestionIndex + 1 >= room.questionIndices.length) {
    room.state = "finished";
    broadcast(room.code, { type: "finished", data: { leaderboard: getLeaderboard(room) } });
    return {};
  }

  room.currentQuestionIndex++;

  // Clear power-ups and wager state
  room.activePowerUps.clear();
  room.freezeActive = false;
  room.isWagerRound = false;
  room.wagers.clear();

  // Check if this is a wager round (every Nth question, 1-indexed)
  // Final question wager: trigger wager phase only before the last question
  const isSecondToLast = room.currentQuestionIndex + 1 >= room.questionIndices.length - 1;
  if (isSecondToLast && room.wagerCount === 0) {
    room.wagerCount++;
    room.wagerType = "regular";
    room.state = "wager";
    broadcast(room.code, { type: "wager-start", data: getWagerPayload(room) });
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

function startQuestionRound(room: Room): void {
  // Capture leaderboard before this round (for animated transitions)
  room.previousLeaderboard = getLeaderboard(room);

  room.questionStartTime = Date.now();
  room.state = "question";

  // Reset player answers
  for (const p of room.players.values()) {
    p.currentAnswer = null;
    p.answerTime = null;
    p.currentTextAnswer = null;
    p.gambleWon = undefined;
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

  broadcast(room.code, { type: "question-start", data: getQuestionPayload(room) });
  scheduleQuestionTimer(room);
}

export function submitWager(
  code: string,
  playerId: string,
  amount: number
): { error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.state !== "wager") return { error: "Can't wager right now" };

  const player = room.players.get(playerId);
  if (!player) return { error: "Player not found" };
  if (player.eliminated) return { error: "You are eliminated" };

  // Clamp wager to [0, 30% of score] — prevents runaway scoring
  const maxWager = Math.floor(player.score * 0.3);
  const clamped = Math.max(0, Math.min(amount, maxWager));
  room.wagers.set(playerId, clamped);

  // Check if all active players submitted wagers
  const activePlayers = getActivePlayers(room);
  const allWagered = activePlayers.every((p) => room.wagers.has(p.id));
  if (allWagered) {
    advanceFromWager(room);
  }

  return {};
}

export function advanceFromWagerAction(code: string, hostId: string): { error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostId) return { error: "Only the host can continue" };
  if (room.state !== "wager") return { error: "No wager phase" };

  advanceFromWager(room);
  return {};
}

function advanceFromWager(room: Room): void {
  room.isWagerRound = true;
  startQuestionRound(room);
}

export function disconnectPlayer(code: string, playerId: string): void {
  const room = rooms.get(code.toUpperCase());
  if (!room) return;

  const player = room.players.get(playerId);
  if (player) {
    player.connected = false;
    broadcast(room.code, { type: "player-left", data: { playerId } });
  }
}

export function forceShowResults(code: string, hostId: string): { error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostId) return { error: "Only the host can continue" };
  if (room.state !== "question") return { error: "No active question" };

  showResults(room);
  return {};
}

export function choosePowerUp(
  code: string,
  playerId: string,
  powerUp: "freeze" | "shield" | "double"
): { error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.state !== "question") return { error: "Can't use power-ups right now" };

  const player = room.players.get(playerId);
  if (!player) return { error: "Player not found" };
  if (player.eliminated) return { error: "You are eliminated" };
  if (player.powerUpUses <= 0) return { error: "No power-up uses remaining" };
  if (room.activePowerUps.has(playerId)) return { error: "Already used a power-up this round" };
  if (player.usedPowerUpTypes.includes(powerUp)) return { error: "Already used this power-up type" };

  // Deduct use and record
  player.powerUpUses--;
  player.usedPowerUpTypes.push(powerUp);
  room.activePowerUps.set(playerId, powerUp);

  // Freeze auto-applies immediately
  if (powerUp === "freeze" && !room.freezeActive) {
    room.freezeActive = true;
    broadcast(room.code, { type: "timer-reduced", data: { seconds: 3 } });
  }

  // Broadcast updated power-ups to host screen
  broadcast(room.code, {
    type: "question-start",
    data: getQuestionPayload(room),
  });

  return {};
}
