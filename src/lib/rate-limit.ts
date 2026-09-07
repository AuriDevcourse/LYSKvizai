/**
 * Simple in-memory sliding-window rate limiter, keyed per caller.
 */

interface RateLimitEntry {
  timestamps: number[];
  /**
   * The window this key is counted over.
   *
   * Recorded because the cleanup pass below used a hardcoded 60s cutoff, which
   * silently capped every window at 60 seconds no matter what the caller
   * passed. Nothing exceeded 60s at the time, so it never showed — but the
   * editor lockout below runs over five minutes, and would have been quietly
   * reset by the janitor a minute in.
   */
  windowMs: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 60s, pruning each key over its *own* window.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > now - entry.windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 60_000);

function entryFor(key: string, windowMs: number, now: number): RateLimitEntry {
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [], windowMs };
    store.set(key, entry);
  }
  entry.windowMs = windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);
  return entry;
}

/**
 * Check whether a request is allowed, and count it.
 *
 * @param key - Identifier, usually derived from the client IP
 * @param limit - Max requests allowed in the window
 * @param windowMs - Window length in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = entryFor(key, windowMs, now);

  if (entry.timestamps.length >= limit) return false;

  entry.timestamps.push(now);
  return true;
}

/**
 * Whether a request *would* be allowed, without counting it.
 *
 * Needed for budgets that should only be spent on failure. Throttling password
 * attempts with `checkRateLimit` would count every successful save against the
 * same allowance and lock out the legitimate editor, which is the usual reason
 * login throttles get removed again.
 */
export function peekRateLimit(key: string, limit: number, windowMs: number): boolean {
  const entry = entryFor(key, windowMs, Date.now());
  return entry.timestamps.length < limit;
}

/** Spend one unit of a budget. Pairs with `peekRateLimit`. */
export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  entryFor(key, windowMs, now).timestamps.push(now);
}

/** Forget a key's history — used to clear a lockout after a correct password. */
export function clearRateLimit(key: string): void {
  store.delete(key);
}
