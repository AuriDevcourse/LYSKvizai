import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, peekRateLimit, recordAttempt, clearRateLimit } from "./rate-limit";

/**
 * The limiter behind every throttle in the app, including the editor password
 * lockout. Tests use a unique key per case, since the store is module-level.
 */
let n = 0;
let key = "";
beforeEach(() => {
  key = `test-${n++}-${Math.random()}`;
});

describe("checkRateLimit", () => {
  it("allows up to the limit and then refuses", () => {
    for (let i = 0; i < 3; i++) expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("counts each key separately", () => {
    expect(checkRateLimit(`${key}-a`, 1, 60_000)).toBe(true);
    expect(checkRateLimit(`${key}-a`, 1, 60_000)).toBe(false);
    // A different caller is unaffected.
    expect(checkRateLimit(`${key}-b`, 1, 60_000)).toBe(true);
  });

  it("forgets entries older than the window", () => {
    // A zero-length window means every previous timestamp is already outside it.
    expect(checkRateLimit(key, 1, 0)).toBe(true);
    expect(checkRateLimit(key, 1, 0)).toBe(true);
  });
});

describe("peekRateLimit", () => {
  it("does not consume the budget", () => {
    // The property the editor lockout depends on: a successful save must not
    // count against the allowance for failed passwords.
    for (let i = 0; i < 50; i++) expect(peekRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("reports refusal once the budget is spent", () => {
    recordAttempt(key, 60_000);
    recordAttempt(key, 60_000);
    expect(peekRateLimit(key, 2, 60_000)).toBe(false);
    expect(peekRateLimit(key, 3, 60_000)).toBe(true);
  });
});

describe("recordAttempt and clearRateLimit", () => {
  it("spends budget without asking permission", () => {
    recordAttempt(key, 60_000);
    recordAttempt(key, 60_000);
    recordAttempt(key, 60_000);
    expect(peekRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("clears a lockout completely", () => {
    // What a correct password does: two mistypes then success starts clean.
    recordAttempt(key, 60_000);
    recordAttempt(key, 60_000);
    clearRateLimit(key);
    expect(peekRateLimit(key, 2, 60_000)).toBe(true);
  });

  it("is safe to clear a key that was never used", () => {
    expect(() => clearRateLimit(`${key}-never-seen`)).not.toThrow();
  });
});

describe("window length is honoured per key", () => {
  it("keeps a long window's history alongside a short one", () => {
    /*
     * The bug this pins: the cleanup pass pruned every key with a hardcoded
     * 60s cutoff, so a five-minute lockout was silently reset a minute in.
     * Windows are now recorded per key. This checks the read path — two keys
     * with very different windows don't interfere.
     */
    const shortKey = `${key}-short`;
    const longKey = `${key}-long`;
    recordAttempt(shortKey, 0);
    recordAttempt(longKey, 5 * 60 * 1000);

    // A zero-length window is definitionally already elapsed; the five-minute
    // one has not. (A 1ms window would be flaky — a timestamp recorded in the
    // same millisecond is genuinely still inside it.)
    expect(peekRateLimit(shortKey, 1, 0)).toBe(true);
    expect(peekRateLimit(longKey, 1, 5 * 60 * 1000)).toBe(false);
  });
});
