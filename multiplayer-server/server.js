import { createServer } from "http";
import { WebSocketServer } from "ws";
import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const QUIZZES_DIR = join(__dirname, "data", "quizzes");

// ===== Quiz Store =====
async function getQuiz(id) {
  try {
    const raw = await readFile(join(QUIZZES_DIR, `${id}.json`), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ===== Translation =====
const translationCache = new Map();

function cacheKey(text, from, to) {
  return `${from}:${to}:${text}`;
}

async function callTranslate(text, from, to) {
  try {
    const { default: translate } = await import("google-translate-api-x");
    const res = await translate(text, { from, to });
    return res.text;
  } catch {
    return text;
  }
}

async function translateBatch(texts, from, to) {
  if (from === to) return texts;

  const results = new Array(texts.length);
  const toTranslate = [];

  for (let i = 0; i < texts.length; i++) {
    if (!texts[i] || !texts[i].trim()) {
      results[i] = texts[i] ?? "";
      continue;
    }
    const key = cacheKey(texts[i], from, to);
    const cached = translationCache.get(key);
    if (cached) {
      results[i] = cached;
    } else {
      toTranslate.push({ index: i, text: texts[i] });
    }
  }

  if (toTranslate.length === 0) return results;

  const CHUNK_SIZE = 5;
  for (let c = 0; c < toTranslate.length; c += CHUNK_SIZE) {
    const chunk = toTranslate.slice(c, c + CHUNK_SIZE);
    const separator = "\n||||\n";
    const batchText = chunk.map((t) => t.text).join(separator);

    try {
      const translated = await callTranslate(batchText, from, to);
      const parts = translated.split(/\n?\|{4}\n?/);
      for (let i = 0; i < chunk.length; i++) {
        const raw = (parts[i] ?? chunk[i].text).trim();
        results[chunk[i].index] = raw;
        translationCache.set(cacheKey(chunk[i].text, from, to), raw);
      }
    } catch {
      for (const item of chunk) {
        if (!results[item.index]) results[item.index] = item.text;
      }
    }
  }

  return results;
}

// ===== Scoring =====
function calculateScore(correct, answerTimeMs, timerDurationMs, currentStreak) {
  if (!correct) return { points: 0, newStreak: 0 };
  const base = 1000;
  const elapsed = Math.max(0, Math.min(answerTimeMs, timerDurationMs));
  const speedRatio = 1 - elapsed / timerDurationMs;
  const speedBonus = Math.round(500 * speedRatio);
  const newStreak = currentStreak + 1;
  const streakBonus = newStreak >= 3 ? Math.min((newStreak - 2) * 100, 500) : 0;
  return { points: base + speedBonus + streakBonus, newStreak };
}

// ===== Room Code =====
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 4; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return code;
}

// ===== WebSocket Connection Manager =====
const wsConnections = new Map(); // connId -> { ws, playerId, roomCode }
let connCounter = 0;

function addWsConnection(roomCode, playerId, ws) {
  const id = `conn_${++connCounter}`;
  wsConnections.set(id, { ws, playerId, roomCode });
  return id;
}

function removeWsConnection(id) {
  wsConnections.delete(id);
}

function broadcast(roomCode, event) {
  const message = JSON.stringify(event);
  for (const [id, conn] of wsConnections) {
    if (conn.roomCode === roomCode) {
      try {
        if (conn.ws.readyState === 1) conn.ws.send(message);
      } catch {
        wsConnections.delete(id);
      }
    }
  }
}

function removeRoomConnections(roomCode) {
  for (const [id, conn] of wsConnections) {
    if (conn.roomCode === roomCode) {
      try { conn.ws.close(); } catch {}
      wsConnections.delete(id);
    }
  }
}

// ===== Room Store =====
const rooms = new Map();
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS) {
      if (room.questionTimer) clearTimeout(room.questionTimer);
      removeRoomConnections(code);
      rooms.delete(code);
    }
  }
}, 60_000);

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function playerToInfo(p) {
  return {
    id: p.id, name: p.name, emoji: p.emoji, score: p.score,
    connected: p.connected, eliminated: p.eliminated || undefined,
    teamIndex: p.teamIndex, powerUpUses: p.powerUpUses,
    usedPowerUpTypes: [...p.usedPowerUpTypes],
  };
}

function getLeaderboard(room) {
  const sorted = [...room.players.values()].sort((a, b) => b.score - a.score);
  return sorted.map((p, i) => ({
    playerId: p.id, name: p.name, emoji: p.emoji, score: p.score, rank: i + 1,
  }));
}

function getActivePlayers(room) {
  return [...room.players.values()].filter((p) => !p.eliminated);
}

function getShuffledCorrectIndex(room) {
  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];
  return room.optionShuffles[room.currentQuestionIndex].indexOf(q.correct);
}

function displayToOriginal(room, displayIndex) {
  return room.optionShuffles[room.currentQuestionIndex][displayIndex];
}

function getQuestionPayload(room) {
  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];
  const optShuffle = room.optionShuffles[room.currentQuestionIndex];

  const shuffledOptions = optShuffle.map((origIdx) => {
    if (q.type === "bluff" && q.bluffAnswer && room.bluffReplacedOriginalIndex === origIdx) return q.bluffAnswer;
    return q.options[origIdx];
  });

  const payload = {
    index: room.currentQuestionIndex, total: room.questionIndices.length,
    question: q.question, options: shuffledOptions,
    timerDuration: room.timerDuration, startTime: room.questionStartTime, serverNow: Date.now(),
    image: q.image, type: q.type, audioUrl: q.audioUrl, videoUrl: q.videoUrl,
    progressiveReveal: q.progressiveReveal, isWagerRound: room.isWagerRound || undefined,
  };

  if (room.gameMode === "team") payload.currentTeamAnswerers = [...room.currentTeamAnswerer.values()];

  const enT = room.enTranslations.get(qIndex);
  if (enT) {
    const enShuffledOptions = optShuffle.map((origIdx) => {
      if (q.type === "bluff" && q.bluffAnswer && room.bluffReplacedOriginalIndex === origIdx) return q.bluffAnswer;
      return enT.options[origIdx];
    });
    payload.en = { question: enT.question, options: enShuffledOptions };
  }

  return payload;
}

function getTeamScores(room) {
  if (room.gameMode !== "team") return [];
  const scores = [];
  for (let i = 0; i < room.teamCount; i++) {
    let total = 0;
    for (const p of room.players.values()) {
      if (p.teamIndex === i) total += p.score;
    }
    scores.push({ teamIndex: i, teamName: room.teamNames[i] || `Team ${i + 1}`, score: total });
  }
  return scores.sort((a, b) => b.score - a.score);
}

function scoreYearGuess(guessedYear, correctYear) {
  const diff = Math.abs(guessedYear - correctYear);
  if (diff === 0) return 1500;
  if (diff <= 2) return 1200;
  if (diff <= 5) return 1000;
  if (diff <= 10) return 750;
  if (diff <= 25) return 500;
  if (diff <= 50) return 250;
  return 0;
}

function getResultsPayload(room) {
  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];
  const shuffledCorrectIdx = getShuffledCorrectIndex(room);

  const distribution = [0, 0, 0, 0];
  const playerResults = [];
  const bluffVictims = [];
  const wagerResults = [];
  const powerUpEffects = [];

  for (const player of room.players.values()) {
    if (player.currentAnswer !== null && player.currentAnswer >= 0) distribution[player.currentAnswer]++;

    let correct;
    if (q.type === "fastest-finger") {
      if (!player.currentTextAnswer) { correct = false; }
      else {
        const norm = player.currentTextAnswer.toLowerCase();
        const accepted = q.acceptedAnswers ?? [q.options[q.correct].toLowerCase()];
        correct = accepted.some(a => a.toLowerCase().trim() === norm);
      }
    } else if (q.type === "year-guesser") {
      if (!player.currentTextAnswer || q.correctYear == null) { correct = false; }
      else {
        const guessed = parseInt(player.currentTextAnswer, 10);
        correct = !isNaN(guessed) && scoreYearGuess(guessed, q.correctYear) > 0;
      }
    } else {
      const originalAnswer = player.currentAnswer !== null ? displayToOriginal(room, player.currentAnswer) : -1;
      correct = originalAnswer === q.correct;
    }

    if (q.type === "bluff" && room.bluffDisplayIndex !== null && player.currentAnswer === room.bluffDisplayIndex) bluffVictims.push(player.name);

    const activePU = room.activePowerUps.get(player.id);
    if (activePU === "double" && correct) powerUpEffects.push({ playerId: player.id, playerName: player.name, powerUp: "double", effect: "Double points!" });
    else if (activePU === "shield" && !correct) powerUpEffects.push({ playerId: player.id, playerName: player.name, powerUp: "shield", effect: "Shield protected your streak!" });

    if (room.isWagerRound && room.wagers.has(player.id)) {
      const wager = room.wagers.get(player.id);
      wagerResults.push({ playerId: player.id, playerName: player.name, wager, won: correct, netPoints: correct ? wager * 2 : -wager });
    }

    let basePts;
    if (q.type === "year-guesser" && player.currentTextAnswer && q.correctYear != null) {
      const guessed = parseInt(player.currentTextAnswer, 10);
      basePts = !isNaN(guessed) ? scoreYearGuess(guessed, q.correctYear) : 0;
    } else {
      basePts = correct ? calculateScore(true, (player.answerTime ?? room.questionStartTime) - room.questionStartTime, room.timerDuration * 1000, player.streak - 1).points : 0;
    }
    const mysteryMult = room.mysteryMultipliers.get(room.currentQuestionIndex) ?? 1;

    playerResults.push({
      playerId: player.id, playerName: player.name, playerEmoji: player.emoji,
      correct, points: basePts * mysteryMult, totalScore: player.score, streak: player.streak,
      basePoints: mysteryMult > 1 ? basePts : undefined,
    });
  }

  const mysteryMultiplier = room.mysteryMultipliers.get(room.currentQuestionIndex);
  const result = {
    correctAnswer: shuffledCorrectIdx, explanation: q.explanation,
    answerDistribution: distribution, playerResults, leaderboard: getLeaderboard(room),
    mysteryMultiplier: mysteryMultiplier && mysteryMultiplier > 1 ? mysteryMultiplier : undefined,
  };

  if (q.type === "fastest-finger") {
    const accepted = q.acceptedAnswers ?? [q.options[q.correct].toLowerCase()];
    const correctPlayers = [...room.players.values()]
      .filter(p => p.currentTextAnswer && accepted.some(a => a.toLowerCase().trim() === p.currentTextAnswer.toLowerCase()))
      .sort((a, b) => (a.answerTime ?? Infinity) - (b.answerTime ?? Infinity));
    if (correctPlayers.length > 0) result.fastestFinger = { playerId: correctPlayers[0].id, playerName: correctPlayers[0].name, bonusPoints: 500 };
    result.correctAnswerText = q.acceptedAnswers?.[0] ?? q.options[q.correct];
  }

  if (q.type === "year-guesser" && q.correctYear != null) {
    const yearGuesses = [];
    for (const player of room.players.values()) {
      if (player.currentTextAnswer) {
        const guessed = parseInt(player.currentTextAnswer, 10);
        if (!isNaN(guessed)) yearGuesses.push({ playerId: player.id, playerName: player.name, guessedYear: guessed, correctYear: q.correctYear, points: scoreYearGuess(guessed, q.correctYear) });
      }
    }
    yearGuesses.sort((a, b) => Math.abs(a.guessedYear - a.correctYear) - Math.abs(b.guessedYear - b.correctYear));
    result.yearGuesses = yearGuesses;
  }

  if (q.type === "bluff" && q.bluffAnswer) {
    result.bluffAnswer = q.bluffAnswer;
    result.bluffIndex = room.bluffDisplayIndex ?? undefined;
    result.bluffVictims = bluffVictims;
  }
  if (room.gameMode === "team") result.teamScores = getTeamScores(room);
  if (room.isWagerRound && wagerResults.length > 0) result.wagerResults = wagerResults;
  if (powerUpEffects.length > 0) result.powerUpEffects = powerUpEffects;

  const enT = room.enTranslations.get(qIndex);
  if (enT) {
    const optShuffle = room.optionShuffles[room.currentQuestionIndex];
    result.en = {
      correctAnswerText: result.correctAnswerText ? enT.options[q.correct] : undefined,
      explanation: enT.explanation,
      options: optShuffle.map((origIdx) => enT.options[origIdx]),
    };
  }

  return result;
}

function getRoomSnapshot(room) {
  const snapshot = {
    code: room.code, state: room.state,
    players: [...room.players.values()].map(playerToInfo),
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.questionIndices.length, gameMode: room.gameMode,
  };
  if (room.gameMode === "team") snapshot.teamNames = room.teamNames;
  if (room.state === "question") snapshot.question = getQuestionPayload(room);
  else if (room.state === "results") snapshot.results = getResultsPayload(room);
  else if (room.state === "finished") snapshot.leaderboard = getLeaderboard(room);
  else if (room.state === "wager") snapshot.wager = { questionIndex: room.currentQuestionIndex, maxWager: 500 };
  return snapshot;
}

function setupBluffQuestion(room, questionIdx) {
  const qIndex = room.questionIndices[questionIdx];
  const q = room.questions[qIndex];
  if (q.type !== "bluff" || !q.bluffAnswer) { room.bluffDisplayIndex = null; room.bluffReplacedOriginalIndex = null; return; }
  const optShuffle = room.optionShuffles[questionIdx];
  const wrongDisplayIndices = optShuffle.map((origIdx, displayIdx) => ({ origIdx, displayIdx })).filter(({ origIdx }) => origIdx !== q.correct);
  if (wrongDisplayIndices.length === 0) return;
  const pick = wrongDisplayIndices[Math.floor(Math.random() * wrongDisplayIndices.length)];
  room.bluffDisplayIndex = pick.displayIdx;
  room.bluffReplacedOriginalIndex = pick.origIdx;
}

function rotateTeamAnswerers(room) {
  if (room.gameMode !== "team") return;
  room.currentTeamAnswerer.clear();
  const teamPlayers = new Map();
  for (const p of room.players.values()) {
    if (p.teamIndex !== null && !p.eliminated) {
      if (!teamPlayers.has(p.teamIndex)) teamPlayers.set(p.teamIndex, []);
      teamPlayers.get(p.teamIndex).push(p);
    }
  }
  for (const [teamIdx, players] of teamPlayers) {
    if (players.length === 0) continue;
    room.currentTeamAnswerer.set(teamIdx, players[room.teamRotationIndex % players.length].id);
  }
  room.teamRotationIndex++;
}

function scheduleQuestionTimer(room) {
  if (room.questionTimer) { clearTimeout(room.questionTimer); room.questionTimer = null; }
  const ms = (room.timerDuration + 2) * 1000;
  room.questionTimer = setTimeout(() => {
    room.questionTimer = null;
    if (room.state === "question") showResults(room);
  }, ms);
}

function startQuestionRound(room) {
  room.questionStartTime = Date.now();
  room.state = "question";
  for (const p of room.players.values()) { p.currentAnswer = null; p.answerTime = null; p.currentTextAnswer = null; }
  setupBluffQuestion(room, room.currentQuestionIndex);
  if (room.gameMode === "team") rotateTeamAnswerers(room);
  broadcast(room.code, { type: "question-start", data: getQuestionPayload(room) });
  scheduleQuestionTimer(room);
}

function showResults(room) {
  if (room.questionTimer) { clearTimeout(room.questionTimer); room.questionTimer = null; }
  room.state = "results";
  const results = getResultsPayload(room);

  if (room.gameMode === "elimination") {
    const roundNum = room.currentQuestionIndex + 1;
    if (roundNum % room.eliminationInterval === 0) {
      const activePlayers = getActivePlayers(room);
      if (activePlayers.length > 1) {
        const sorted = [...activePlayers].sort((a, b) => a.score - b.score);
        const toEliminate = sorted[0];
        toEliminate.eliminated = true;
        room.eliminatedPlayers.add(toEliminate.id);
        results.eliminatedThisRound = [{ playerId: toEliminate.id, playerName: toEliminate.name, playerEmoji: toEliminate.emoji }];
        broadcast(room.code, { type: "player-eliminated", data: { playerId: toEliminate.id, playerName: toEliminate.name, playerEmoji: toEliminate.emoji } });
        if (getActivePlayers(room).length <= 1) {
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

// ===== Room Actions =====
async function createRoom(hostId, quizIds, questionCount, timerDuration, gameMode, teamCount, eliminationInterval) {
  const ids = Array.isArray(quizIds) ? quizIds : [quizIds];
  if (ids.length === 0) throw new Error("No quiz selected");

  const allQuestions = [];
  for (const qid of ids) {
    const quiz = await getQuiz(qid);
    if (!quiz) throw new Error(`Quiz "${qid}" not found`);
    allQuestions.push(...quiz.questions);
  }
  if (allQuestions.length === 0) throw new Error("Quizzes have no questions");

  let code;
  do { code = generateRoomCode(); } while (rooms.has(code));

  const allIndices = shuffle(allQuestions.map((_, i) => i));
  const count = Math.min(questionCount ?? 15, allQuestions.length);
  const questionIndices = allIndices.slice(0, count);
  const optionShuffles = questionIndices.map(() => shuffle([0, 1, 2, 3]));
  const DEFAULT_TEAM_NAMES = ["Alpha", "Bravo", "Charlie", "Delta"];

  const room = {
    code, hostId, state: "lobby", players: new Map(), questions: allQuestions,
    questionIndices, optionShuffles, currentQuestionIndex: 0, questionStartTime: 0,
    timerDuration: timerDuration ?? 20, createdAt: Date.now(),
    gameMode: gameMode ?? "classic", eliminatedPlayers: new Set(), eliminationInterval: eliminationInterval ?? 3,
    teamCount: teamCount ?? 2, teamNames: DEFAULT_TEAM_NAMES.slice(0, teamCount ?? 2),
    currentTeamAnswerer: new Map(), teamRotationIndex: 0,
    wagers: new Map(), wagerInterval: 3, isWagerRound: false,
    questionTimer: null, activePowerUps: new Map(), freezeActive: false,
    bluffDisplayIndex: null, bluffReplacedOriginalIndex: null,
    mysteryMultipliers: new Map(), enTranslations: new Map(),
  };

  rooms.set(code, room);
  return room;
}

function joinRoom(code, playerId, name, emoji) {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };
  if (room.state !== "lobby") return { error: "Game already started" };
  if (room.players.size >= 50) return { error: "Room is full" };

  for (const p of room.players.values()) {
    if (p.name.toLowerCase() === name.toLowerCase() && p.id !== playerId) return { error: "This name is taken" };
  }

  let player = room.players.get(playerId);
  if (player) { player.connected = true; player.name = name; player.emoji = emoji; }
  else {
    player = { id: playerId, name, emoji, score: 0, streak: 0, currentAnswer: null, answerTime: null, connected: true, powerUpUses: 3, usedPowerUpTypes: new Set(), eliminated: false, teamIndex: null, currentTextAnswer: null };
    room.players.set(playerId, player);
  }

  broadcast(code, { type: "player-joined", data: { player: playerToInfo(player) } });
  return { room, player };
}

async function startGame(code, hostId) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostId) return { error: "Only the host can start" };
  if (room.state !== "lobby") return { error: "Game already started" };
  if (room.players.size === 0) return { error: "Need at least one player" };

  for (const p of room.players.values()) { p.powerUpUses = 3; p.usedPowerUpTypes = new Set(); p.eliminated = false; p.currentAnswer = null; p.answerTime = null; p.currentTextAnswer = null; }

  if (room.gameMode === "team") {
    const playerArr = shuffle([...room.players.values()]);
    playerArr.forEach((p, i) => { p.teamIndex = i % room.teamCount; });
    rotateTeamAnswerers(room);
  }

  room.mysteryMultipliers.clear();
  for (let i = 0; i < room.questionIndices.length; i++) {
    if (Math.random() < 0.25) room.mysteryMultipliers.set(i, Math.floor(Math.random() * 4) + 2);
  }

  // Pre-translate to English
  try {
    const allTexts = [];
    for (const idx of room.questionIndices) {
      const q = room.questions[idx];
      allTexts.push(q.question, ...q.options, q.explanation);
    }
    const translated = await translateBatch(allTexts, "lt", "en");
    let ti = 0;
    for (const idx of room.questionIndices) {
      const tQuestion = translated[ti++];
      const tOptions = [translated[ti++], translated[ti++], translated[ti++], translated[ti++]];
      const tExplanation = translated[ti++];
      room.enTranslations.set(idx, { question: tQuestion, options: tOptions, explanation: tExplanation });
    }
  } catch {}

  room.state = "question";
  room.currentQuestionIndex = 0;
  room.questionStartTime = Date.now();
  setupBluffQuestion(room, 0);
  broadcast(code, { type: "question-start", data: getQuestionPayload(room) });
  scheduleQuestionTimer(room);
  return {};
}

function submitAnswer(code, playerId, answerIndex) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.state !== "question") return { error: "Can't answer right now" };

  const player = room.players.get(playerId);
  if (!player) return { error: "Player not found" };
  if (player.currentAnswer !== null) return { error: "Already answered" };
  if (player.eliminated) return { error: "You are eliminated" };

  if (room.gameMode === "team") {
    const isDesignated = [...room.currentTeamAnswerer.values()].includes(playerId);
    if (!isDesignated) return { error: "Another team member answers this round" };
  }

  const now = Date.now();
  player.currentAnswer = answerIndex;
  player.answerTime = now;

  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];
  const originalIndex = displayToOriginal(room, answerIndex);
  const correct = originalIndex === q.correct;
  const elapsed = now - room.questionStartTime;
  const { points, newStreak } = calculateScore(correct, elapsed, room.timerDuration * 1000, player.streak);

  const activePU = room.activePowerUps.get(playerId);
  if (correct) {
    let finalPoints = points;
    if (activePU === "double") finalPoints = points * 2;
    if (room.isWagerRound && room.wagers.has(playerId)) finalPoints += room.wagers.get(playerId) * 2;
    const mysteryMult = room.mysteryMultipliers.get(room.currentQuestionIndex) ?? 1;
    player.score += finalPoints * mysteryMult;
    player.streak = newStreak;
  } else {
    if (activePU !== "shield") player.streak = 0;
    if (room.isWagerRound && room.wagers.has(playerId)) player.score = Math.max(0, player.score - room.wagers.get(playerId));
  }

  let answered = 0, totalEligible = 0;
  for (const p of room.players.values()) {
    if (p.eliminated) continue;
    if (room.gameMode === "team" && ![...room.currentTeamAnswerer.values()].includes(p.id)) continue;
    totalEligible++;
    if (p.currentAnswer !== null) answered++;
  }
  broadcast(code, { type: "answer-count", data: { count: answered, total: totalEligible } });
  if (answered >= totalEligible) showResults(room);

  return {};
}

function submitTextAnswer(code, playerId, answer) {
  const room = rooms.get(code);
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

  const normalizedAnswer = answer.trim().toLowerCase();
  const acceptedAnswers = q.acceptedAnswers ?? [q.options[q.correct].toLowerCase()];
  const correct = acceptedAnswers.some(a => a.toLowerCase().trim() === normalizedAnswer);
  const elapsed = player.answerTime - room.questionStartTime;
  const { points, newStreak } = calculateScore(correct, elapsed, room.timerDuration * 1000, player.streak);
  const activePU = room.activePowerUps.get(playerId);

  if (correct) {
    let finalPoints = points;
    if (activePU === "double") finalPoints = points * 2;
    const isFirstCorrect = ![...room.players.values()].some(p => {
      if (p.id === playerId || !p.currentTextAnswer) return false;
      return acceptedAnswers.some(a => a.toLowerCase().trim() === p.currentTextAnswer.toLowerCase());
    });
    if (isFirstCorrect) finalPoints += 500;
    player.score += finalPoints * (room.mysteryMultipliers.get(room.currentQuestionIndex) ?? 1);
    player.streak = newStreak;
  } else {
    if (activePU !== "shield") player.streak = 0;
  }
  player.currentAnswer = correct ? 0 : -1;

  let answered = 0, totalEligible = 0;
  for (const p of room.players.values()) {
    if (p.eliminated) continue;
    totalEligible++;
    if (p.currentTextAnswer !== null) answered++;
  }
  broadcast(code, { type: "answer-count", data: { count: answered, total: totalEligible } });
  if (answered >= totalEligible) showResults(room);

  return {};
}

function submitYearAnswer(code, playerId, year) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.state !== "question") return { error: "Can't answer right now" };

  const player = room.players.get(playerId);
  if (!player) return { error: "Player not found" };
  if (player.currentTextAnswer !== null) return { error: "Already answered" };
  if (player.eliminated) return { error: "You are eliminated" };

  const qIndex = room.questionIndices[room.currentQuestionIndex];
  const q = room.questions[qIndex];
  if (q.type !== "year-guesser" || q.correctYear == null) return { error: "Not a year-guesser question" };

  player.currentTextAnswer = String(year);
  player.answerTime = Date.now();

  const points = scoreYearGuess(year, q.correctYear);
  const activePU = room.activePowerUps.get(playerId);
  let finalPoints = points;
  if (activePU === "double" && points > 0) finalPoints = points * 2;
  player.score += finalPoints * (room.mysteryMultipliers.get(room.currentQuestionIndex) ?? 1);
  if (points > 0) player.streak += 1;
  else if (activePU !== "shield") player.streak = 0;
  player.currentAnswer = points > 0 ? 0 : -1;

  let answered = 0, totalEligible = 0;
  for (const p of room.players.values()) {
    if (p.eliminated) continue;
    totalEligible++;
    if (p.currentTextAnswer !== null) answered++;
  }
  broadcast(code, { type: "answer-count", data: { count: answered, total: totalEligible } });
  if (answered >= totalEligible) showResults(room);

  return {};
}

function nextQuestion(code, hostId) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostId) return { error: "Only the host can continue" };
  if (room.state !== "results") return { error: "Can't continue yet" };

  if (room.currentQuestionIndex + 1 >= room.questionIndices.length) {
    room.state = "finished";
    broadcast(code, { type: "finished", data: { leaderboard: getLeaderboard(room) } });
    return {};
  }

  room.currentQuestionIndex++;
  room.activePowerUps.clear();
  room.freezeActive = false;
  room.isWagerRound = false;
  room.wagers.clear();

  const questionNum = room.currentQuestionIndex + 1;
  if (questionNum > 1 && questionNum % room.wagerInterval === 0) {
    room.state = "wager";
    broadcast(code, { type: "wager-start", data: { questionIndex: room.currentQuestionIndex, maxWager: 500 } });
    return {};
  }

  startQuestionRound(room);
  return {};
}

function submitWager(code, playerId, amount) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.state !== "wager") return { error: "Can't wager right now" };
  const player = room.players.get(playerId);
  if (!player) return { error: "Player not found" };
  if (player.eliminated) return { error: "You are eliminated" };

  const maxWager = Math.min(500, player.score);
  room.wagers.set(playerId, Math.max(0, Math.min(amount, maxWager)));

  const activePlayers = getActivePlayers(room);
  if (activePlayers.every((p) => room.wagers.has(p.id))) {
    room.isWagerRound = true;
    startQuestionRound(room);
  }
  return {};
}

function advanceFromWagerAction(code, hostId) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostId) return { error: "Only the host can continue" };
  if (room.state !== "wager") return { error: "No wager phase" };
  room.isWagerRound = true;
  startQuestionRound(room);
  return {};
}

function usePowerUp(code, playerId, powerUp) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.state !== "question") return { error: "Can't use powers right now" };
  const player = room.players.get(playerId);
  if (!player) return { error: "Player not found" };
  if (player.eliminated) return { error: "You are eliminated" };
  if (player.powerUpUses <= 0) return { error: "No powers left" };
  if (room.activePowerUps.has(playerId)) return { error: "Already used a power this round" };
  if (player.usedPowerUpTypes.has(powerUp)) return { error: "Already used this power" };

  player.powerUpUses--;
  player.usedPowerUpTypes.add(powerUp);
  room.activePowerUps.set(playerId, powerUp);

  broadcast(code, { type: "powerup-used", data: { playerId: player.id, playerName: player.name, playerEmoji: player.emoji, powerUp } });
  if (powerUp === "freeze") {
    room.freezeActive = true;
    broadcast(code, { type: "timer-reduced", data: { seconds: 3 } });
  }
  return {};
}

function disconnectPlayer(code, playerId) {
  const room = rooms.get(code);
  if (!room) return;
  const player = room.players.get(playerId);
  if (player) { player.connected = false; broadcast(code, { type: "player-left", data: { playerId } }); }
}

function forceShowResults(code, hostId) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostId) return { error: "Only the host can continue" };
  if (room.state !== "question") return { error: "No active question" };
  showResults(room);
  return {};
}

// ===== HTTP + WebSocket Server =====
const server = createServer((req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, connections: wsConnections.size }));
    return;
  }

  // POST /api/rooms
  if (req.method === "POST" && url.pathname === "/api/rooms") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const result = await handleAction(data);
        res.writeHead(result.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result.data));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message || "Bad request" }));
      }
    });
    return;
  }

  // GET /api/rooms?code=XXXX
  if (req.method === "GET" && url.pathname === "/api/rooms") {
    const code = url.searchParams.get("code");
    if (!code) { res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "Missing code" })); return; }
    const room = rooms.get(code.toUpperCase());
    if (!room) { res.writeHead(404, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "Room not found" })); return; }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ snapshot: getRoomSnapshot(room) }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

async function handleAction(body) {
  switch (body.action) {
    case "create": {
      const quizIds = body.quizIds ?? (body.quizId ? [body.quizId] : []);
      const room = await createRoom(body.hostId, quizIds, body.questionCount, body.timerDuration, body.gameMode, body.teamCount, body.eliminationInterval);
      return { status: 200, data: { code: room.code, snapshot: getRoomSnapshot(room) } };
    }
    case "join": {
      const result = joinRoom(body.code, body.playerId, body.name, body.emoji);
      if (result.error) return { status: 400, data: { error: result.error } };
      return { status: 200, data: { snapshot: getRoomSnapshot(result.room) } };
    }
    case "start": {
      const result = await startGame(body.code, body.hostId);
      if (result.error) return { status: 400, data: { error: result.error } };
      return { status: 200, data: { ok: true } };
    }
    case "answer": {
      const result = submitAnswer(body.code, body.playerId, body.answerIndex);
      if (result.error) return { status: 400, data: { error: result.error } };
      return { status: 200, data: { ok: true } };
    }
    case "answer-text": {
      const result = submitTextAnswer(body.code, body.playerId, body.answer);
      if (result.error) return { status: 400, data: { error: result.error } };
      return { status: 200, data: { ok: true } };
    }
    case "answer-year": {
      const result = submitYearAnswer(body.code, body.playerId, body.year);
      if (result.error) return { status: 400, data: { error: result.error } };
      return { status: 200, data: { ok: true } };
    }
    case "next": {
      const result = nextQuestion(body.code, body.hostId);
      if (result.error) return { status: 400, data: { error: result.error } };
      return { status: 200, data: { ok: true } };
    }
    case "force-results": {
      const result = forceShowResults(body.code, body.hostId);
      if (result.error) return { status: 400, data: { error: result.error } };
      return { status: 200, data: { ok: true } };
    }
    case "use-powerup": {
      const result = usePowerUp(body.code, body.playerId, body.powerUp);
      if (result.error) return { status: 400, data: { error: result.error } };
      return { status: 200, data: { ok: true } };
    }
    case "submit-wager": {
      const result = submitWager(body.code, body.playerId, body.amount);
      if (result.error) return { status: 400, data: { error: result.error } };
      return { status: 200, data: { ok: true } };
    }
    case "advance-wager": {
      const result = advanceFromWagerAction(body.code, body.hostId);
      if (result.error) return { status: 400, data: { error: result.error } };
      return { status: 200, data: { ok: true } };
    }
    case "react": {
      const room = rooms.get(body.code);
      if (!room) return { status: 404, data: { error: "Room not found" } };
      const player = room.players.get(body.playerId);
      if (!player) return { status: 404, data: { error: "Player not found" } };
      broadcast(body.code, { type: "emoji-reaction", data: { playerId: body.playerId, playerName: player.name, playerEmoji: player.emoji, emoji: body.emoji } });
      return { status: 200, data: { ok: true } };
    }
    case "disconnect": {
      disconnectPlayer(body.code, body.playerId);
      return { status: 200, data: { ok: true } };
    }
    default:
      return { status: 400, data: { error: "Unknown action" } };
  }
}

// WebSocket server on the same port
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const match = url.pathname.match(/^\/ws\/([A-Z0-9]+)$/i);
  if (!match) { ws.close(4000, "Invalid path. Use /ws/ROOMCODE?playerId=xxx"); return; }

  const code = match[1].toUpperCase();
  const playerId = url.searchParams.get("playerId") ?? "unknown";

  const room = rooms.get(code);
  if (!room) { ws.close(4004, "Room not found"); return; }

  const connId = addWsConnection(code, playerId, ws);

  // Send initial room state
  const snapshot = getRoomSnapshot(room);
  ws.send(JSON.stringify({ type: "room-state", data: snapshot }));

  // Ping every 15s to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: "ping", data: null }));
  }, 15000);

  ws.on("close", () => {
    clearInterval(pingInterval);
    removeWsConnection(connId);
  });

  ws.on("error", () => {
    clearInterval(pingInterval);
    removeWsConnection(connId);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Quizmo multiplayer server running on port ${PORT}`);
  console.log(`  HTTP: http://0.0.0.0:${PORT}/api/rooms`);
  console.log(`  WS:   ws://0.0.0.0:${PORT}/ws/ROOMCODE?playerId=xxx`);
  console.log(`  Health: http://0.0.0.0:${PORT}/health`);
});
