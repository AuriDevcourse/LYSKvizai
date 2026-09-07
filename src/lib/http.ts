import type { NextRequest } from "next/server";

/**
 * Shared request-handling guards.
 */

/**
 * Largest request body any route here accepts.
 *
 * The App Router has no default limit, so `req.json()` buffers whatever
 * arrives before a single field is checked — a 50 MB body was parsed in full
 * and only then rejected for having the wrong shape. Quiz saves are the
 * biggest legitimate payload and sit far under this.
 */
export const MAX_BODY_BYTES = 256 * 1024;

/**
 * Reads and parses a JSON body, refusing anything oversized.
 *
 * Checks `Content-Length` first, which costs nothing, then measures what
 * actually arrived — a chunked request can omit the header, so the header
 * check alone is a courtesy rather than a guard.
 */
export async function readJsonBody(
  req: NextRequest,
  limit = MAX_BODY_BYTES
): Promise<{ ok: true; value: unknown } | { ok: false; status: number; error: string }> {
  const declared = req.headers.get("content-length");
  if (declared && Number(declared) > limit) {
    return { ok: false, status: 413, error: "Request too large" };
  }

  let text: string;
  try {
    text = await req.text();
  } catch {
    return { ok: false, status: 400, error: "Could not read request" };
  }

  // `length` is UTF-16 units, so this over-counts for multi-byte characters —
  // which is the safe direction for a cap.
  if (text.length > limit) {
    return { ok: false, status: 413, error: "Request too large" };
  }

  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: "Invalid request format" };
  }
}

/**
 * Records a server-side failure.
 *
 * Every `catch` in this codebase discarded its error, so a production failure
 * left nothing behind in the journal and the only evidence was a player saying
 * it didn't work. Deliberately `console.error` and nothing more: on this box
 * stderr goes to the systemd journal, which is where someone debugging would
 * look first.
 *
 * Never pass a token, a request body or a player name — this output is
 * retained and greppable.
 */
export function logServerError(where: string, error: unknown, context?: Record<string, string | number>): void {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const extra = context
    ? " " + Object.entries(context).map(([k, v]) => `${k}=${v}`).join(" ")
    : "";
  console.error(`[quizmo] ${where} — ${detail}${extra}`);
  if (error instanceof Error && error.stack) console.error(error.stack);
}
