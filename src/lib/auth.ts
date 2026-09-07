import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { peekRateLimit, recordAttempt, clearRateLimit } from "./rate-limit";
import { getClientIp } from "./client-ip";

/**
 * Editor authentication.
 *
 * Quizmo has two audiences with very different trust levels:
 *   - Players — anyone with a room code. No account, no secret. They only ever
 *     touch /api/rooms, and every mutating action there is token-gated per player.
 *   - The host/editor — whoever runs the quiz. They can create, rewrite and delete
 *     quizzes and upload media to the public web root. That is admin surface and
 *     must not be open to the internet.
 *
 * This gates the second group behind a single shared secret (`EDITOR_SECRET`),
 * sent as `Authorization: Bearer <secret>`.
 *
 * Fail-closed by design: if EDITOR_SECRET is unset in production, every editor
 * write is refused rather than silently left open. In development it stays open
 * so `npm run dev` needs no setup.
 */

const HEADER = "authorization";

export type AuthResult = { ok: true } | { ok: false; status: number; error: string };

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual throws on length mismatch, so compare lengths separately.
  // Length is not the secret here — content is.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkEditorAuth(req: NextRequest): AuthResult {
  const secret = process.env.EDITOR_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        status: 503,
        error: "Editor is not configured on this server (EDITOR_SECRET is unset).",
      };
    }
    return { ok: true }; // dev convenience
  }

  const header = req.headers.get(HEADER) ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!provided) {
    return { ok: false, status: 401, error: "Editor password required" };
  }
  if (!safeEqual(provided, secret)) {
    return { ok: false, status: 403, error: "Wrong editor password" };
  }
  return { ok: true };
}

/* --------------------------------------------------------------- throttling */

/**
 * Failed password attempts allowed per IP, and over how long.
 *
 * Ten is generous for someone mistyping a password they have, and useless to
 * anyone guessing. Five minutes is long enough to make a sustained attempt
 * pointless without stranding an editor who fat-fingered it twice.
 */
const MAX_AUTH_FAILURES = 10;
const AUTH_FAILURE_WINDOW_MS = 5 * 60 * 1000;

/**
 * `checkEditorAuth` plus brute-force protection.
 *
 * Every editor endpoint called `checkEditorAuth` *before* any rate limit, so a
 * wrong password cost the caller nothing and could be retried without limit.
 * With a `openssl rand -base64 24` secret that is academic — 192 bits is not
 * getting guessed — but a shared editor password is exactly the kind that gets
 * quietly replaced with something memorable, and at that point unlimited
 * attempts matter a great deal.
 *
 * Only **failures** are counted, so an editor saving fifty quizzes in a session
 * never approaches the limit. A correct password clears the record, so someone
 * who mistypes twice and then gets it right starts clean.
 *
 * The 503 for an unconfigured server is deliberately not counted: that is the
 * server's state, not the caller's fault, and charging for it would let anyone
 * lock out the real editor for five minutes before the secret was even set.
 */
export function checkEditorAuthThrottled(req: NextRequest): AuthResult {
  const key = `editor-auth:${getClientIp(req)}`;

  if (!peekRateLimit(key, MAX_AUTH_FAILURES, AUTH_FAILURE_WINDOW_MS)) {
    return {
      ok: false,
      status: 429,
      error: "Too many failed attempts. Wait a few minutes and try again.",
    };
  }

  const result = checkEditorAuth(req);

  if (result.ok) {
    clearRateLimit(key);
    return result;
  }

  if (result.status === 401 || result.status === 403) {
    recordAttempt(key, AUTH_FAILURE_WINDOW_MS);
  }

  return result;
}
