import type { Question, QuestionType } from "@/data/types";

// --- Room & Player ---

export type RoomState = "lobby" | "question" | "results" | "wager" | "finished";
export type GameMode = "classic" | "elimination" | "team" | "survival";
export type PowerUpType = "freeze" | "shield" | "double" | "thief" | "bomb" | "gamble";

export const ALL_POWER_UPS: PowerUpType[] = ["freeze", "shield", "double", "thief", "bomb", "gamble"];

export interface Player {
  id: string;
  name: string;
  emoji: string;
  score: number;
  streak: number;
  currentAnswer: number | null;
  answerTime: number | null;
  connected: boolean;
  eliminated: boolean;
  teamIndex: number | null;
  currentTextAnswer: string | null;
  slowestStreak: number;
  /** Gamble result for this round (if assigned gamble power-up) */
  gambleWon?: boolean;
  /** Power-up uses remaining (each player gets 3 per game) */
  powerUpUses: number;
  /** Power-up types already used this game */
  usedPowerUpTypes: PowerUpType[];
}

export interface Room {
  code: string;
  hostId: string;
  state: RoomState;
  players: Map<string, Player>;
  questions: Question[];
  questionIndices: number[];
  optionShuffles: number[][];
  currentQuestionIndex: number;
  questionStartTime: number;
  timerDuration: number;
  createdAt: number;

  gameMode: GameMode;

  // Elimination
  eliminatedPlayers: Set<string>;
  eliminationInterval: number;

  // Team
  teamCount: number;
  teamNames: string[];
  currentTeamAnswerer: Map<number, string>;
  teamRotationIndex: number;

  // Wager
  wagers: Map<string, number>;
  wagerInterval: number;
  isWagerRound: boolean;
  wagerType: WagerType;
  wagerCount: number;

  // Timer
  questionTimer: ReturnType<typeof setTimeout> | null;

  // Power-ups (randomly assigned each round)
  activePowerUps: Map<string, PowerUpType>;
  freezeActive: boolean;

  // Bluff
  bluffDisplayIndex: number | null;
  bluffReplacedOriginalIndex: number | null;

  // Mystery Multiplier
  mysteryMultipliers: Map<number, number>;

  // Translations
  enTranslations: Map<number, { question: string; options: string[]; explanation: string }>;

  // Leaderboard snapshot (captured at question start, before answers)
  previousLeaderboard: LeaderboardEntry[];
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
  usedPowerUpTypes?: string[];
}

export interface RoomSnapshot {
  code: string;
  state: RoomState;
  players: PlayerInfo[];
  currentQuestionIndex: number;
  totalQuestions: number;
  gameMode: GameMode;
  teamNames?: string[];
  question?: QuestionPayload;
  results?: ResultsPayload;
  leaderboard?: LeaderboardEntry[];
  wager?: WagerPayload;
}

export interface QuestionPayload {
  index: number;
  total: number;
  question: string;
  options: [string, string, string, string];
  timerDuration: number;
  startTime: number;
  serverNow: number;
  image?: string;
  type?: QuestionType;
  audioUrl?: string;
  videoUrl?: string;
  progressiveReveal?: boolean;
  isWagerRound?: boolean;
  canAnswer?: boolean;
  currentTeamAnswerers?: string[];
  /** Power-ups active this round: playerId -> powerUpType */
  roundPowerUps?: { playerId: string; powerUp: PowerUpType }[];
  /** Power-up uses remaining for requesting player */
  powerUpUsesLeft?: number;
  /** Power-up types already used by requesting player */
  usedPowerUpTypes?: PowerUpType[];
  en?: { question: string; options: [string, string, string, string] };
  lt?: { question: string; options: [string, string, string, string] };
}

export interface AnswerResult {
  playerId: string;
  playerName: string;
  playerEmoji: string;
  correct: boolean;
  points: number;
  totalScore: number;
  streak: number;
  basePoints?: number;
  speedBonus?: number;
  slowPenalty?: number;
  /** Power-up effect description */
  powerUpEffect?: string;
  /** Power-up type assigned this round */
  powerUp?: PowerUpType;
}

export interface ResultsPayload {
  correctAnswer: number;
  explanation: string;
  answerDistribution: number[];
  playerResults: AnswerResult[];
  leaderboard: LeaderboardEntry[];
  bluffAnswer?: string;
  bluffIndex?: number;
  bluffVictims?: string[];
  eliminatedThisRound?: { playerId: string; playerName: string; playerEmoji: string }[];
  teamScores?: TeamScore[];
  wagerResults?: WagerResult[];
  powerUpEffects?: PowerUpEffect[];
  mysteryMultiplier?: number;
  fastestFinger?: { playerId: string; playerName: string; bonusPoints: number };
  correctAnswerText?: string;
  yearGuesses?: { playerId: string; playerName: string; guessedYear: number; correctYear: number; points: number }[];
  en?: { correctAnswerText?: string; explanation?: string; options?: string[] };
  lt?: { correctAnswerText?: string; explanation?: string; options?: string[] };
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  emoji: string;
  score: number;
  rank: number;
  previousRank?: number;
  previousScore?: number;
}

// --- Payload types ---

export type WagerType = "regular" | "super";

export interface WagerPayload {
  questionIndex: number;
  maxWager: number;
  wagerType: WagerType;
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
  netPoints: number;
}

export interface PowerUpEffect {
  playerId: string;
  playerName: string;
  powerUp: PowerUpType;
  effect: string;
}

// --- Client → Server Actions (POST) ---

export type ClientAction =
  | { action: "create"; hostId: string; quizId?: string; quizIds?: string[]; questionCount?: number; timerDuration?: number; gameMode?: GameMode; teamCount?: number; eliminationInterval?: number }
  | { action: "join"; code: string; playerId: string; name: string; emoji: string }
  | { action: "start"; code: string; hostId: string }
  | { action: "answer"; code: string; playerId: string; answerIndex: number }
  | { action: "next"; code: string; hostId: string }
  | { action: "force-results"; code: string; hostId: string }
  | { action: "react"; code: string; playerId: string; emoji: string }
  | { action: "disconnect"; code: string; playerId: string }
  | { action: "submit-wager"; code: string; playerId: string; amount: number }
  | { action: "advance-wager"; code: string; hostId: string }
  | { action: "answer-text"; code: string; playerId: string; answer: string }
  | { action: "answer-year"; code: string; playerId: string; year: number }
  | { action: "choose-powerup"; code: string; playerId: string; powerUp: PowerUpType };
