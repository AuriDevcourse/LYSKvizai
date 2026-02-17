import type { Question, QuestionType } from "@/data/types";

// --- Room & Player ---

export type RoomState = "lobby" | "question" | "results" | "wager" | "finished";
export type GameMode = "classic" | "elimination" | "team";
export type PowerUpType = "freeze" | "shield" | "double";

export interface Player {
  id: string;
  name: string;
  emoji: string;
  score: number;
  streak: number;
  /** Answer index for current question, null if not answered yet */
  currentAnswer: number | null;
  /** Timestamp when answer was submitted */
  answerTime: number | null;
  connected: boolean;
  /** Power-up uses remaining (starts at 2) */
  powerUpUses: number;
  /** Whether player is eliminated (elimination mode) */
  eliminated: boolean;
  /** Team index (team mode), null if not in team mode */
  teamIndex: number | null;
}

export interface Room {
  code: string;
  hostId: string;
  state: RoomState;
  players: Map<string, Player>;
  /** The actual questions for this game (loaded from a quiz) */
  questions: Question[];
  /** Indices into the questions array (shuffled subset or full) */
  questionIndices: number[];
  /** Per-question option shuffle: optionShuffles[qIdx] = [2,0,3,1] means
   *  displayed option 0 = original option 2, etc. */
  optionShuffles: number[][];
  currentQuestionIndex: number;
  /** Timestamp when the current question was shown */
  questionStartTime: number;
  /** Seconds per question */
  timerDuration: number;
  createdAt: number;

  // --- Game mode ---
  gameMode: GameMode;

  // --- Elimination mode ---
  eliminatedPlayers: Set<string>;
  eliminationInterval: number; // eliminate every N rounds (default 3)

  // --- Team mode ---
  teamCount: number;
  teamNames: string[];
  /** Per-team: which player index is currently answering */
  currentTeamAnswerer: Map<number, string>; // teamIndex -> playerId
  teamRotationIndex: number;

  // --- Wager ---
  wagers: Map<string, number>; // playerId -> wager amount
  wagerInterval: number; // wager every N questions (default 3)
  isWagerRound: boolean;

  // --- Power-ups ---
  activePowerUps: Map<string, PowerUpType>; // playerId -> active power-up this question
  freezeActive: boolean; // whether freeze was used this question

  // --- Bluff ---
  /** For bluff questions: which display index has the bluff answer */
  bluffDisplayIndex: number | null;
  /** Original option that was replaced by bluff */
  bluffReplacedOriginalIndex: number | null;
}

// --- Server → Client Events (SSE) ---

export interface EmojiReaction {
  playerId: string;
  playerName: string;
  playerEmoji: string;
  emoji: string;
}

export type ServerEvent =
  | { type: "room-state"; data: RoomSnapshot }
  | { type: "player-joined"; data: { player: PlayerInfo } }
  | { type: "player-left"; data: { playerId: string } }
  | { type: "question-start"; data: QuestionPayload }
  | { type: "answer-count"; data: { count: number; total: number } }
  | { type: "results"; data: ResultsPayload }
  | { type: "finished"; data: { leaderboard: LeaderboardEntry[] } }
  | { type: "emoji-reaction"; data: EmojiReaction }
  | { type: "powerup-used"; data: PowerUpUsedPayload }
  | { type: "wager-start"; data: WagerPayload }
  | { type: "player-eliminated"; data: { playerId: string; playerName: string; playerEmoji: string } }
  | { type: "timer-reduced"; data: { seconds: number } }
  | { type: "ping"; data: null };

export interface PlayerInfo {
  id: string;
  name: string;
  emoji: string;
  score: number;
  connected: boolean;
  eliminated?: boolean;
  teamIndex?: number | null;
  powerUpUses?: number;
}

export interface RoomSnapshot {
  code: string;
  state: RoomState;
  players: PlayerInfo[];
  currentQuestionIndex: number;
  totalQuestions: number;
  gameMode: GameMode;
  teamNames?: string[];
  /** Only present during "question" state */
  question?: QuestionPayload;
  /** Only present during "results" state */
  results?: ResultsPayload;
  /** Only present during "finished" state */
  leaderboard?: LeaderboardEntry[];
  /** Only present during "wager" state */
  wager?: WagerPayload;
}

export interface QuestionPayload {
  index: number;
  total: number;
  question: string;
  options: [string, string, string, string];
  timerDuration: number;
  startTime: number;
  /** Server's Date.now() at time of sending — lets clients correct for clock skew */
  serverNow: number;
  image?: string;
  type?: QuestionType;
  audioUrl?: string;
  videoUrl?: string;
  progressiveReveal?: boolean;
  isWagerRound?: boolean;
  /** Whether this player can answer (team mode: only designated answerer) */
  canAnswer?: boolean;
  /** Player IDs who can answer this round (team mode) */
  currentTeamAnswerers?: string[];
}

export interface AnswerResult {
  playerId: string;
  playerName: string;
  playerEmoji: string;
  correct: boolean;
  points: number;
  totalScore: number;
  streak: number;
}

export interface ResultsPayload {
  correctAnswer: number;
  explanation: string;
  answerDistribution: number[];
  playerResults: AnswerResult[];
  leaderboard: LeaderboardEntry[];
  // Bluff
  bluffAnswer?: string;
  bluffIndex?: number;
  bluffVictims?: string[]; // player names who picked the bluff
  // Elimination
  eliminatedThisRound?: { playerId: string; playerName: string; playerEmoji: string }[];
  // Team
  teamScores?: TeamScore[];
  // Wager
  wagerResults?: WagerResult[];
  // Power-ups
  powerUpEffects?: PowerUpEffect[];
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  emoji: string;
  score: number;
  rank: number;
}

// --- New payload types ---

export interface WagerPayload {
  questionIndex: number;
  maxWager: number; // min(500, player's score)
}

export interface TeamScore {
  teamIndex: number;
  teamName: string;
  score: number;
}

export interface WagerResult {
  playerId: string;
  playerName: string;
  wager: number;
  won: boolean;
  netPoints: number; // positive if won, negative if lost
}

export interface PowerUpUsedPayload {
  playerId: string;
  playerName: string;
  playerEmoji: string;
  powerUp: PowerUpType;
}

export interface PowerUpEffect {
  playerId: string;
  playerName: string;
  powerUp: PowerUpType;
  effect: string; // description like "Dvigubi taškai!"
}

// --- Client → Server Actions (POST) ---

export type ClientAction =
  | { action: "create"; hostId: string; quizId: string; questionCount?: number; timerDuration?: number; gameMode?: GameMode; teamCount?: number; eliminationInterval?: number }
  | { action: "join"; code: string; playerId: string; name: string; emoji: string }
  | { action: "start"; code: string; hostId: string }
  | { action: "answer"; code: string; playerId: string; answerIndex: number }
  | { action: "next"; code: string; hostId: string }
  | { action: "force-results"; code: string; hostId: string }
  | { action: "react"; code: string; playerId: string; emoji: string }
  | { action: "disconnect"; code: string; playerId: string }
  | { action: "use-powerup"; code: string; playerId: string; powerUp: PowerUpType }
  | { action: "submit-wager"; code: string; playerId: string; amount: number }
  | { action: "advance-wager"; code: string; hostId: string };
