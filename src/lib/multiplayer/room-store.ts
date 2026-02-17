import type {
  Room,
  Player,
  RoomSnapshot,
  PlayerInfo,
  QuestionPayload,
  ResultsPayload,
  LeaderboardEntry,
  GameMode,
  PowerUpType,
  TeamScore,
  WagerResult,
  PowerUpEffect,
  WagerPayload,
} from "./types";
import { generateRoomCode } from "./room-code";
import { calculateScore } from "./scoring";
import { broadcast, removeRoomConnections } from "./sse-manager";
import { getQuiz } from "@/lib/quiz-store";

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
  };
}

function getLeaderboard(room: Room): LeaderboardEntry[] {
  const sorted = [...room.players.values()].sort((a, b) => b.score - a.score);
  return sorted.map((p, i) => ({
    playerId: p.id,
    name: p.name,
    emoji: p.emoji,
    score: p.score,
    rank: i + 1,
  }));
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
      teamName: room.teamNames[i] || `Komanda ${i + 1}`,
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
    if (player.currentAnswer !== null) {
      distribution[player.currentAnswer]++;
    }
    // Check if the player's answer (display index) maps to the original correct
    const originalAnswer = player.currentAnswer !== null
      ? displayToOriginal(room, player.currentAnswer)
      : -1;
    const correct = originalAnswer === q.correct;

    // Check if player picked bluff answer
    if (q.type === "bluff" && room.bluffDisplayIndex !== null && player.currentAnswer === room.bluffDisplayIndex) {
      bluffVictims.push(player.name);
    }

    // Collect power-up effects
    const activePU = room.activePowerUps.get(player.id);
    if (activePU === "double" && correct) {
      powerUpEffects.push({ playerId: player.id, playerName: player.name, powerUp: "double", effect: "Dvigubi taškai!" });
    } else if (activePU === "shield" && !correct) {
      powerUpEffects.push({ playerId: player.id, playerName: player.name, powerUp: "shield", effect: "Skydas apsaugojo seriją!" });
    }

    // Wager results
    if (room.isWagerRound && room.wagers.has(player.id)) {
      const wager = room.wagers.get(player.id)!;
      wagerResults.push({
        playerId: player.id,
        playerName: player.name,
        wager,
        won: correct,
        netPoints: correct ? wager * 2 : -wager,
      });
    }

    playerResults.push({
      playerId: player.id,
      playerName: player.name,
      playerEmoji: player.emoji,
      correct,
      points: correct ? calculateScore(
        true,
        (player.answerTime ?? room.questionStartTime) - room.questionStartTime,
        room.timerDuration * 1000,
        player.streak - 1
      ).points : 0,
      totalScore: player.score,
      streak: player.streak,
    });
  }

  const result: ResultsPayload = {
    correctAnswer: shuffledCorrectIdx,
    explanation: q.explanation,
    answerDistribution: distribution,
    playerResults,
    leaderboard: getLeaderboard(room),
  };

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
    maxWager: 500,
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
  quizId: string,
  questionCount?: number,
  timerDuration?: number,
  gameMode?: GameMode,
  teamCount?: number,
  eliminationInterval?: number
): Promise<Room> {
  // Load quiz from disk
  const quiz = await getQuiz(quizId);
  if (!quiz) throw new Error("Kvizas nerastas");

  let code: string;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  const questions = quiz.questions;

  // Shuffle and pick questions
  const allIndices = shuffle(questions.map((_, i) => i));
  const count = Math.min(questionCount ?? 15, questions.length);
  const questionIndices = allIndices.slice(0, count);

  // Generate shuffled option orders for each selected question
  const optionShuffles = questionIndices.map(() => shuffle([0, 1, 2, 3]));

  const DEFAULT_TEAM_NAMES = ["Blynai", "Lašiniai", "Morė", "Kanapė"];

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

    activePowerUps: new Map(),
    freezeActive: false,

    bluffDisplayIndex: null,
    bluffReplacedOriginalIndex: null,
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
  name: string,
  emoji: string
): { room: Room; player: Player } | { error: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Kambarys nerastas" };
  if (room.state !== "lobby") return { error: "Žaidimas jau prasidėjo" };
  if (room.players.size >= 50) return { error: "Kambarys pilnas" };

  // Check for duplicate name
  for (const p of room.players.values()) {
    if (p.name.toLowerCase() === name.toLowerCase() && p.id !== playerId) {
      return { error: "Šis vardas jau užimtas" };
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
      powerUpUses: 2,
      eliminated: false,
      teamIndex: null,
    };
    room.players.set(playerId, player);
  }

  broadcast(code, { type: "player-joined", data: { player: playerToInfo(player) } });
  return { room, player };
}

export function startGame(code: string, hostId: string): { error?: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Kambarys nerastas" };
  if (room.hostId !== hostId) return { error: "Tik šeimininkas gali pradėti" };
  if (room.state !== "lobby") return { error: "Žaidimas jau prasidėjo" };
  if (room.players.size === 0) return { error: "Reikia bent vieno žaidėjo" };

  // Init power-up uses for all players
  for (const p of room.players.values()) {
    p.powerUpUses = 2;
    p.eliminated = false;
    p.currentAnswer = null;
    p.answerTime = null;
  }

  // Team mode: assign players to teams
  if (room.gameMode === "team") {
    const playerArr = shuffle([...room.players.values()]);
    playerArr.forEach((p, i) => {
      p.teamIndex = i % room.teamCount;
    });
    rotateTeamAnswerers(room);
  }

  room.state = "question";
  room.currentQuestionIndex = 0;
  room.questionStartTime = Date.now();

  // Setup bluff if needed
  setupBluffQuestion(room, 0);

  broadcast(code, { type: "question-start", data: getQuestionPayload(room) });
  return {};
}

export function submitAnswer(
  code: string,
  playerId: string,
  answerIndex: number
): { error?: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Kambarys nerastas" };
  if (room.state !== "question") return { error: "Dabar negalima atsakyti" };

  const player = room.players.get(playerId);
  if (!player) return { error: "Žaidėjas nerastas" };
  if (player.currentAnswer !== null) return { error: "Jau atsakėte" };

  // Elimination: eliminated players can't answer
  if (player.eliminated) return { error: "Esate pašalintas" };

  // Team mode: only designated answerer can answer
  if (room.gameMode === "team") {
    const isDesignated = [...room.currentTeamAnswerer.values()].includes(playerId);
    if (!isDesignated) return { error: "Šį raundą atsako kitas komandos narys" };
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
    player.streak
  );

  // Check active power-ups
  const activePU = room.activePowerUps.get(playerId);

  if (correct) {
    let finalPoints = points;
    // Double power-up: 2x points
    if (activePU === "double") {
      finalPoints = points * 2;
    }
    // Wager round: add wager * 2
    if (room.isWagerRound && room.wagers.has(playerId)) {
      finalPoints += room.wagers.get(playerId)! * 2;
    }
    player.score += finalPoints;
    player.streak = newStreak;
  } else {
    // Wrong answer
    if (activePU === "shield") {
      // Shield: keep streak, still 0 points
      // streak stays the same
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
  broadcast(code, {
    type: "answer-count",
    data: { count: answered, total: totalEligible },
  });

  // Auto-advance if everyone answered
  if (answered >= totalEligible) {
    showResults(room);
  }

  return {};
}

function showResults(room: Room): void {
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
  const room = rooms.get(code);
  if (!room) return { error: "Kambarys nerastas" };
  if (room.hostId !== hostId) return { error: "Tik šeimininkas gali tęsti" };
  if (room.state !== "results") return { error: "Dar negalima tęsti" };

  if (room.currentQuestionIndex + 1 >= room.questionIndices.length) {
    room.state = "finished";
    broadcast(code, { type: "finished", data: { leaderboard: getLeaderboard(room) } });
    return {};
  }

  room.currentQuestionIndex++;

  // Clear power-ups and wager state
  room.activePowerUps.clear();
  room.freezeActive = false;
  room.isWagerRound = false;
  room.wagers.clear();

  // Check if this is a wager round (every Nth question, 1-indexed)
  const questionNum = room.currentQuestionIndex + 1;
  if (questionNum > 1 && questionNum % room.wagerInterval === 0) {
    // Start wager phase
    room.state = "wager";
    broadcast(code, { type: "wager-start", data: getWagerPayload(room) });
    return {};
  }

  // Normal question flow
  startQuestionRound(room);
  return {};
}

function startQuestionRound(room: Room): void {
  room.questionStartTime = Date.now();
  room.state = "question";

  // Reset player answers
  for (const p of room.players.values()) {
    p.currentAnswer = null;
    p.answerTime = null;
  }

  // Setup bluff if needed
  setupBluffQuestion(room, room.currentQuestionIndex);

  // Team mode: rotate answerers
  if (room.gameMode === "team") {
    rotateTeamAnswerers(room);
  }

  broadcast(room.code, { type: "question-start", data: getQuestionPayload(room) });
}

export function submitWager(
  code: string,
  playerId: string,
  amount: number
): { error?: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Kambarys nerastas" };
  if (room.state !== "wager") return { error: "Dabar negalima statyti" };

  const player = room.players.get(playerId);
  if (!player) return { error: "Žaidėjas nerastas" };
  if (player.eliminated) return { error: "Esate pašalintas" };

  // Clamp wager to [0, min(500, score)]
  const maxWager = Math.min(500, player.score);
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
  const room = rooms.get(code);
  if (!room) return { error: "Kambarys nerastas" };
  if (room.hostId !== hostId) return { error: "Tik šeimininkas gali tęsti" };
  if (room.state !== "wager") return { error: "Nėra statymų fazės" };

  advanceFromWager(room);
  return {};
}

function advanceFromWager(room: Room): void {
  room.isWagerRound = true;
  startQuestionRound(room);
}

export function usePowerUp(
  code: string,
  playerId: string,
  powerUp: PowerUpType
): { error?: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Kambarys nerastas" };
  if (room.state !== "question") return { error: "Dabar negalima naudoti galių" };

  const player = room.players.get(playerId);
  if (!player) return { error: "Žaidėjas nerastas" };
  if (player.eliminated) return { error: "Esate pašalintas" };
  if (player.powerUpUses <= 0) return { error: "Nebeturite galių" };
  if (room.activePowerUps.has(playerId)) return { error: "Jau naudojote galią šį raundą" };

  player.powerUpUses--;
  room.activePowerUps.set(playerId, powerUp);

  // Broadcast power-up usage
  broadcast(code, {
    type: "powerup-used",
    data: {
      playerId: player.id,
      playerName: player.name,
      playerEmoji: player.emoji,
      powerUp,
    },
  });

  // Freeze: broadcast timer reduction to other players
  if (powerUp === "freeze") {
    room.freezeActive = true;
    broadcast(code, {
      type: "timer-reduced",
      data: { seconds: 3 },
    });
  }

  return {};
}

export function disconnectPlayer(code: string, playerId: string): void {
  const room = rooms.get(code);
  if (!room) return;

  const player = room.players.get(playerId);
  if (player) {
    player.connected = false;
    broadcast(code, { type: "player-left", data: { playerId } });
  }
}

export function forceShowResults(code: string, hostId: string): { error?: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Kambarys nerastas" };
  if (room.hostId !== hostId) return { error: "Tik šeimininkas gali tęsti" };
  if (room.state !== "question") return { error: "Nėra aktyvaus klausimo" };

  showResults(room);
  return {};
}
