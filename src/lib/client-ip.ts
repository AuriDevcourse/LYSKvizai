import type { NextRequest } from "next/server";

/**
 * The client's IP, as trustworthy as we can make it behind nginx.
 *
 * Every route used to do `x-forwarded-for.split(",")[0]`, which is exactly
 * backwards. nginx's standard `proxy_add_x_forwarded_for` *appends* the real
 * peer to whatever the client sent, so a request carrying its own
 * `X-Forwarded-For: 1.2.3.4` arrives as `"1.2.3.4, <real ip>"` — index [0] is
 * the attacker's string. Every rate limit keyed on it could be bypassed by
 * sending a fresh random value per request.
 *
 * Order of trust:
 *   1. `X-Real-IP` — nginx sets this from `$remote_addr`; a client-sent copy is
 *      overwritten, so it cannot be forged through the proxy.
 *   2. The LAST hop of `X-Forwarded-For` — the entry nginx appended itself.
 *      Everything to its left is client-supplied and worthless.
 *
 * If the app is ever reached without a proxy in front, both are absent and we
 * fall back to "unknown", which buckets all such callers together. That is the
 * safe direction: over-throttling an unidentifiable caller beats letting them
 * mint a fresh bucket per request.
 */
export function getClientIp(req: NextRequest): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    const lastHop = hops[hops.length - 1];
    if (lastHop) return lastHop;
  }

  return "unknown";
}
