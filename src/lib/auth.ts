import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

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
