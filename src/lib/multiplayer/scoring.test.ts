import { describe, it, expect } from "vitest";
import { competitionRanks, maxWagerFor, lowestScorers } from "./scoring";

/**
 * The first tests over anything in `lib/multiplayer` (improvement 10.1 noted
 * the whole directory was untested). Ranking is a good place to start: it is
 * pure, and 5.5 was a real defect visible on the projected leaderboard.
 */
describe("competitionRanks", () => {
  it("numbers distinct scores 1, 2, 3", () => {
    expect(competitionRanks([{ score: 900 }, { score: 500 }, { score: 100 }])).toEqual([1, 2, 3]);
  });

  it("shares a place across a tie and skips the places it used", () => {
    // The bug this replaces: these two 4200s were shown as 2nd and 3rd.
    expect(
      competitionRanks([{ score: 5000 }, { score: 4200 }, { score: 4200 }, { score: 3000 }])
    ).toEqual([1, 2, 2, 4]);
  });

  it("handles a tie at the top", () => {
    expect(competitionRanks([{ score: 100 }, { score: 100 }, { score: 50 }])).toEqual([1, 1, 3]);
  });

  it("gives everyone first place when nobody has scored", () => {
    // Every player on zero is the state of the leaderboard before question one.
    expect(competitionRanks([{ score: 0 }, { score: 0 }, { score: 0 }])).toEqual([1, 1, 1]);
  });

  it("handles a three-way tie followed by a distinct score", () => {
    expect(
      competitionRanks([{ score: 7 }, { score: 7 }, { score: 7 }, { score: 1 }])
    ).toEqual([1, 1, 1, 4]);
  });

  it("returns nothing for an empty leaderboard", () => {
    expect(competitionRanks([])).toEqual([]);
  });
});

describe("maxWagerFor", () => {
  it("floors low scores at 500 so the round still means something", () => {
    expect(maxWagerFor(0)).toBe(500);
    expect(maxWagerFor(1000)).toBe(500);
  });

  it("gives 30% once that beats the floor", () => {
    expect(maxWagerFor(5000)).toBe(1500);
    expect(maxWagerFor(10000)).toBe(3000);
  });

  it("crosses over where the two rules meet", () => {
    // 500 / 0.3 = 1666.67, so 1666 still floors and 1667 does not.
    expect(maxWagerFor(1666)).toBe(500);
    expect(maxWagerFor(1667)).toBe(500);
    expect(maxWagerFor(1670)).toBe(501);
  });

  it("never returns a fraction", () => {
    expect(Number.isInteger(maxWagerFor(3333))).toBe(true);
  });
});

describe("lowestScorers", () => {
  it("returns the single lowest when there is no tie", () => {
    const r = lowestScorers([{ score: 900 }, { score: 100 }, { score: 500 }]);
    expect(r).toEqual([{ score: 100 }]);
  });

  it("returns everyone tied at the bottom", () => {
    // The bug: this used to always pick whoever joined first.
    const r = lowestScorers([{ score: 900 }, { score: 100 }, { score: 100 }]);
    expect(r).toHaveLength(2);
  });

  it("returns everyone when nobody has scored", () => {
    expect(lowestScorers([{ score: 0 }, { score: 0 }, { score: 0 }])).toHaveLength(3);
  });

  it("handles negative scores", () => {
    // Slow penalties can put a player below zero.
    const r = lowestScorers([{ score: 10 }, { score: -50 }, { score: 0 }]);
    expect(r).toEqual([{ score: -50 }]);
  });

  it("returns nothing for an empty list", () => {
    expect(lowestScorers([])).toEqual([]);
  });
});
