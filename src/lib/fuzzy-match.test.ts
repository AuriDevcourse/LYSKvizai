import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "./fuzzy-match";

/**
 * `fuzzyMatch` decides whether a typed answer counts, under a clock, in front
 * of a room. It is the single most consequential pure function in the app and
 * it had no tests.
 *
 * These pin both directions: what must be accepted (a player who knows the
 * answer and mistypes it) and what must be rejected (a player who doesn't).
 * The second half matters more — a matcher that is too generous is invisible
 * until someone wins a round they should have lost.
 */
describe("fuzzyMatch — accepts", () => {
  it("an exact answer", () => {
    expect(fuzzyMatch("Pacific", ["Pacific"])).toBe(true);
  });

  it("different case and stray whitespace", () => {
    expect(fuzzyMatch("  pACIFIC  ", ["Pacific"])).toBe(true);
  });

  it("a typo within the distance threshold", () => {
    expect(fuzzyMatch("Pacfic", ["Pacific"])).toBe(true);
    expect(fuzzyMatch("cheetha", ["Cheetah"])).toBe(true);
  });

  it("an accented answer typed without accents", () => {
    expect(fuzzyMatch("Bogota", ["Bogotá"])).toBe(true);
    expect(fuzzyMatch("Zurich", ["Zürich"])).toBe(true);
  });

  it("a significant word out of a longer answer", () => {
    expect(fuzzyMatch("whale", ["Blue whale"])).toBe(true);
  });

  it("any one of several accepted forms", () => {
    expect(fuzzyMatch("the pacific", ["Pacific", "Pacific Ocean", "the pacific"])).toBe(true);
  });

  it("collapsed internal whitespace", () => {
    expect(fuzzyMatch("Blue    whale", ["Blue whale"])).toBe(true);
  });
});

describe("fuzzyMatch — known generosity", () => {
  it("accepts a two-edit difference on the last word, by design", () => {
    // Strategy 3 compares the last word at a 0.3 ratio, so a 7-letter answer
    // tolerates two edits: "Cheetos" is credited for "Cheetah". Asserted
    // rather than fixed — tightening this would start rejecting the ordinary
    // typos the whole function exists to forgive. Documented so a future
    // change to the threshold is a decision, not a surprise.
    expect(fuzzyMatch("Cheetos", ["Cheetah"])).toBe(true);
  });
});

describe("fuzzyMatch — rejects", () => {
  it("a different answer", () => {
    expect(fuzzyMatch("Atlantic", ["Pacific"])).toBe(false);
  });

  it("an empty submission", () => {
    // A player who taps submit without typing must not be credited.
    expect(fuzzyMatch("", ["Pacific"])).toBe(false);
    expect(fuzzyMatch("   ", ["Pacific"])).toBe(false);
  });

  it("a single letter against a two-letter answer", () => {
    // The exploit this closed: the distance floor of 1 allowed one edit
    // regardless of length, so any vowel won a question accepting "Au".
    expect(fuzzyMatch("a", ["Au"])).toBe(false);
    expect(fuzzyMatch("e", ["Au"])).toBe(false);
    expect(fuzzyMatch("ao", ["Au"])).toBe(false);
    // The real answer still counts, in any case.
    expect(fuzzyMatch("au", ["Au"])).toBe(true);
    expect(fuzzyMatch("AU", ["Au"])).toBe(true);
  });

  it("anything at all when no answers are accepted", () => {
    // Improvement 6.8 now blocks saving such a question; this pins that the
    // matcher never credits one that already exists.
    expect(fuzzyMatch("Pacific", [])).toBe(false);
  });
});
