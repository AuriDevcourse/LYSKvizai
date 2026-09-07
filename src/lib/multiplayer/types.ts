import type { Question, QuestionType } from "@/data/types";

// --- Room & Player ---

export type RoomState = "lobby" | "question" | "results" | "wager" | "finished";
export type GameMode = "classic" | "elimination" | "team";
export type PowerUpType = "freeze" | "shield" | "double";

export const ALL_POWER_UPS: PowerUpType[] = ["freeze", "shield", "double"];

export interface Player {
  id: string;
  /** Server-issued auth token. Client proves identity by presenting this on every action. */
  token: string;
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
  /**
   * Points actually added to `score` for the current question, including the
   * double multiplier, wager swing and fastest-finger bonus.
   *
   * Results used to recompute this from scratch, which drifted from what was
   * really awarded (the recompute ignored every bonus) and, for the double
   * power-up, awarded a second helping on top of the doubling already applied
   * at submit time — 3x instead of 2x. Award once, here, and report it.
   */
  lastPointsAwarded: number;
  slowestStreak: number;
  /** Power-up uses remaining (each player gets 3 per game) */
  powerUpUses: number;
  /** Power-up types already used this game */
  usedPowerUpTypes: PowerUpType[];
}

export interface Room {
  code: string;
  hostId: string;
  /** Server-issued host auth token. Required for host-only actions. */
  hostToken: string;
  state: RoomState;
  players: Map<string, Player>;
  questions: Question[];
  questionIndices: number[];
  optionShuffles: number[][];
  currentQuestionIndex: number;
  questionStartTime: number;
  timerDuration: number;
  createdAt: number;
  /** Updated on every broadcast (i.e. every state-changing action). Used by the
   * idle-room reaper so active games are not deleted mid-session. */
  lastActivityAt: number;

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

  // Leaderboard snapshot (captured at question start, before answers)
  previousLeaderboard: LeaderboardEntry[];

  // Cached results payload — computed once per round in showResults, read by getRoomSnapshot.
  // Prevents score inflation from getResultsPayload being called on every snapshot fetch.
  cachedResults: ResultsPayload | null;
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
  /**
   * Someone spent a power-up.
   *
   * Choosing one used to trigger a full `room-state` broadcast — every player,
   * the whole question payload and the leaderboard, to every connected client,
   * mid-question. This carries only what actually changed: who spent what, and
   * that player's remaining budget.
   */
  | {
      type: "power-up-used";
      data: {
        playerId: string;
        powerUp: PowerUpType;
        usesLeft: number;
        usedTypes: PowerUpType[];
        roundPowerUps: { playerId: string; powerUp: PowerUpType }[];
      };
    }
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
  /**
   * Set during a wager round: whether this player has submitted. The amount is
   * never sent — knowing what someone wagered would break the round.
   */
  hasWagered?: boolean;
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
  /**
   * Seconds already cut from the current question's clock by a Freeze.
   *
   * `timer-reduced` is a one-shot event, so a player who reconnected after
   * someone froze the timer rebuilt their countdown from the original
   * duration and ran several seconds behind everyone else — then had their
   * answer refused by a question that had already closed.
   */
  timerReduction?: number;
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
  fastestFinger?: { playerId: string; playerName: string; bonusPoints: number };
  correctAnswerText?: string;
  yearGuesses?: { playerId: string; playerName: string; guessedYear: number; correctYear: number; points: number }[];
  /**
   * The options in the order they were shown, so the results screen doesn't
   * have to still be holding the question payload.
   *
   * This used to live under `en`, alongside copies of `correctAnswerText` and
   * `explanation` that duplicated the fields right next to them — a
   * translation envelope left over from when the app was bilingual. Lithuanian
   * was removed end-to-end, so the envelope was shipping two redundant strings
   * to every player on every question.
   */
  options?: string[];
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
  | { action: "join"; code: string; playerId: string; name: string; emoji: string; token?: string }
  | { action: "start"; code: string; hostId: string; hostToken: string }
  | { action: "answer"; code: string; playerId: string; token: string; answerIndex: number }
  | { action: "next"; code: string; hostId: string; hostToken: string }
  | { action: "force-results"; code: string; hostId: string; hostToken: string }
  | { action: "react"; code: string; playerId: string; token: string; emoji: string }
  | { action: "disconnect"; code: string; playerId: string; token: string }
  | { action: "submit-wager"; code: string; playerId: string; token: string; amount: number }
  | { action: "advance-wager"; code: string; hostId: string; hostToken: string }
  | { action: "answer-text"; code: string; playerId: string; token: string; answer: string }
  | { action: "answer-year"; code: string; playerId: string; token: string; year: number }
  | { action: "choose-powerup"; code: string; playerId: string; token: string; powerUp: PowerUpType };
