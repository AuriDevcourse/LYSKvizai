/**
 * Runtime validation for POST /api/rooms bodies.
 *
 * `req.json()` returns `any`. Casting it to ClientAction satisfies the compiler
 * and proves nothing at runtime — the client is a phone on someone else's Wi-Fi.
 * Everything that reaches the room store is validated here first.
 *
 * The bug this exists to prevent: `answerIndex` was never bounds-checked, and
 * results does `distribution[player.currentAnswer]++` on a 4-element array.
 * An answerIndex of 999 turned that into a 1000-element sparse array which was
 * then serialised to every client in the room.
 */

import type { ClientAction } from "./types";

export const MAX_ANSWER_LEN = 200;
export const MIN_YEAR = -10000;
export const MAX_YEAR = 10000;
export const MAX_WAGER = 1_000_000;
export const MAX_QUESTION_COUNT = 100;
export const MIN_TIMER = 5;
export const MAX_TIMER = 300;

const GAME_MODES = new Set(["classic", "elimination", "team"]);
const POWER_UPS = new Set(["freeze", "shield", "double"]);
const KNOWN_ACTIONS = new Set([
  "create", "join", "start", "next", "force-results", "advance-wager",
  "answer", "answer-text", "answer-year", "submit-wager", "react",
  "choose-powerup", "disconnect",
]);

function isStr(v: unknown, max = 200): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= max;
}

/** Finite integer within [min, max] — rejects NaN, Infinity, floats and numeric strings. */
function isInt(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

function isOptInt(v: unknown, min: number, max: number): boolean {
  return v === undefined || isInt(v, min, max);
}

/**
 * Validate a parsed request body. Returns the narrowed action, or an error
 * string naming the offending field.
 */
export function validateAction(
  body: unknown
): { action: ClientAction } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Body must be an object" };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.action !== "string") return { error: "Missing action" };

  // Reject unknown actions before anything else, so the error names the real
  // problem instead of complaining about a room code the caller never sent.
  if (!KNOWN_ACTIONS.has(b.action)) return { error: "Unknown action" };

  // Room code — always required except on create.
  if (b.action !== "create" && !isStr(b.code, 12)) {
    return { error: "Invalid room code" };
  }

  switch (b.action) {
    case "create":
      if (!isStr(b.hostId, 100)) return { error: "Invalid hostId" };
      if (b.quizId !== undefined && !isStr(b.quizId, 200)) return { error: "Invalid quizId" };
      if (b.quizIds !== undefined) {
        if (!Array.isArray(b.quizIds) || b.quizIds.length > 50) return { error: "Invalid quizIds" };
        if (!b.quizIds.every((q) => isStr(q, 200))) return { error: "Invalid quizIds" };
      }
      if (!isOptInt(b.questionCount, 1, MAX_QUESTION_COUNT)) return { error: "Invalid questionCount" };
      if (!isOptInt(b.timerDuration, MIN_TIMER, MAX_TIMER)) return { error: "Invalid timerDuration" };
      if (!isOptInt(b.teamCount, 2, 10)) return { error: "Invalid teamCount" };
      if (!isOptInt(b.eliminationInterval, 1, 50)) return { error: "Invalid eliminationInterval" };
      if (b.gameMode !== undefined && !(typeof b.gameMode === "string" && GAME_MODES.has(b.gameMode))) {
        return { error: "Invalid gameMode" };
      }
      break;

    case "join":
      if (!isStr(b.playerId, 100)) return { error: "Invalid playerId" };
      if (!isStr(b.name, 100)) return { error: "Name is required" };
      if (typeof b.emoji !== "string" || b.emoji.length > 200) return { error: "Invalid avatar" };
      if (b.token !== undefined && !isStr(b.token, 100)) return { error: "Invalid token" };
      break;

    case "start":
    case "next":
    case "force-results":
    case "advance-wager":
      if (!isStr(b.hostId, 100)) return { error: "Invalid hostId" };
      if (!isStr(b.hostToken, 100)) return { error: "Invalid hostToken" };
      break;

    case "answer":
      if (!isStr(b.playerId, 100)) return { error: "Invalid playerId" };
      if (!isStr(b.token, 100)) return { error: "Invalid token" };
      // The whole point: options are always a 4-tuple, so 0-3 and nothing else.
      if (!isInt(b.answerIndex, 0, 3)) return { error: "Invalid answerIndex" };
      break;

    case "answer-text":
      if (!isStr(b.playerId, 100)) return { error: "Invalid playerId" };
      if (!isStr(b.token, 100)) return { error: "Invalid token" };
      if (typeof b.answer !== "string" || b.answer.length > MAX_ANSWER_LEN) {
        return { error: "Invalid answer" };
      }
      break;

    case "answer-year":
      if (!isStr(b.playerId, 100)) return { error: "Invalid playerId" };
      if (!isStr(b.token, 100)) return { error: "Invalid token" };
      if (!isInt(b.year, MIN_YEAR, MAX_YEAR)) return { error: "Invalid year" };
      break;

    case "submit-wager":
      if (!isStr(b.playerId, 100)) return { error: "Invalid playerId" };
      if (!isStr(b.token, 100)) return { error: "Invalid token" };
      if (!isInt(b.amount, 0, MAX_WAGER)) return { error: "Invalid wager amount" };
      break;

    case "react":
      if (!isStr(b.playerId, 100)) return { error: "Invalid playerId" };
      if (!isStr(b.token, 100)) return { error: "Invalid token" };
      if (!isStr(b.emoji, 200)) return { error: "Invalid emoji" };
      break;

    case "choose-powerup":
      if (!isStr(b.playerId, 100)) return { error: "Invalid playerId" };
      if (!isStr(b.token, 100)) return { error: "Invalid token" };
      if (!(typeof b.powerUp === "string" && POWER_UPS.has(b.powerUp))) {
        return { error: "Invalid power-up" };
      }
      break;

    case "disconnect":
      if (!isStr(b.playerId, 100)) return { error: "Invalid playerId" };
      if (!isStr(b.token, 100)) return { error: "Invalid token" };
      break;

    default:
      return { error: "Unknown action" };
  }

  return { action: body as ClientAction };
}
