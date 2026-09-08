import { describe, it, expect } from "vitest";
import { scoreScale, formatHeight, pickPair, TOLERANCE } from "./scale-scoring";

describe("scoreScale", () => {
  it("gives a perfect score for an exact answer", () => {
    const r = scoreScale(5.2, 5.2);
    expect(r.points).toBe(100);
    expect(r.isBullseye).toBe(true);
    expect(r.verdict).toBe("spot on");
  });

  it("scores symmetrically — twice too big equals half too small", () => {
    const big = scoreScale(20, 10);
    const small = scoreScale(5, 10);
    expect(big.points).toBe(small.points);
  });

  it("is scale-invariant: the same ratio scores the same at any size", () => {
    // The whole reason for scoring in log space.
    expect(scoreScale(2, 1).points).toBe(scoreScale(20, 10).points);
    expect(scoreScale(2, 1).points).toBe(scoreScale(2000, 1000).points);
  });

  it("bottoms out at zero once past the tolerance ratio", () => {
    expect(scoreScale(TOLERANCE * 10, 10).points).toBe(0);
    expect(scoreScale(100 * 10, 10).points).toBe(0);
    expect(scoreScale(10 / (TOLERANCE * 10), 10).points).toBe(0);
  });

  it("never returns NaN for a zero or negative guess", () => {
    for (const bad of [0, -5, Number.NaN]) {
      const r = scoreScale(bad, 10);
      expect(Number.isFinite(r.points)).toBe(true);
      expect(r.points).toBe(0);
    }
  });

  it("describes the direction of the error", () => {
    expect(scoreScale(20, 10).verdict).toBe("2.0× too big");
    expect(scoreScale(5, 10).verdict).toBe("2.0× too small");
  });

  it("decreases monotonically as the guess gets worse", () => {
    const scores = [1, 1.25, 1.5, 2, 3].map((r) => scoreScale(10 * r, 10).points);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThan(scores[i - 1]);
    }
  });
});

  /*
   * `accuracy` is what the reveal shows to one decimal; `points` is what the
   * score sums. They must stay two views of one number, or the screen and the
   * scoreboard start disagreeing.
   */
  it("reports accuracy as the unrounded form of points", () => {
    for (const [guess, actual] of [[1, 1], [1.05, 1], [2, 1], [1, 3], [7, 1]]) {
      const r = scoreScale(guess, actual);
      expect(r.points).toBe(Math.round(r.accuracy));
      expect(r.accuracy).toBeGreaterThanOrEqual(0);
      expect(r.accuracy).toBeLessThanOrEqual(100);
    }
  });

  it("keeps a decimal that rounding would hide", () => {
    // A slight overshoot: points alone would show a flat number, and the point
    // of the decimal is that the player can see they were not quite exact.
    const r = scoreScale(1.01, 1);
    expect(r.accuracy).toBeLessThan(100);
    expect(r.accuracy.toFixed(1)).not.toBe("100.0");
  });

  it("gives a zero guess zero accuracy, not NaN", () => {
    for (const bad of [0, -1]) {
      const r = scoreScale(bad, 2);
      expect(Number.isFinite(r.accuracy)).toBe(true);
      expect(r.accuracy).toBe(0);
    }
  });

describe("formatHeight", () => {
  it("uses centimetres below a metre", () => {
    expect(formatHeight(0.24)).toBe("24 cm");
  });
  it("uses metres above", () => {
    expect(formatHeight(5.2)).toBe("5.2 m");
    expect(formatHeight(30)).toBe("30 m");
  });
});

describe("pickPair", () => {
  const pool = [
    { id: "a", heightM: 0.24 },
    { id: "b", heightM: 1.75 },
    { id: "c", heightM: 5.2 },
    { id: "d", heightM: 30 },
  ];

  it("always returns two different creatures within a playable ratio", () => {
    for (let i = 0; i < 200; i++) {
      const [x, y] = pickPair(pool);
      expect(x.id).not.toBe(y.id);
      const ratio = Math.max(x.heightM, y.heightM) / Math.min(x.heightM, y.heightM);
      expect(ratio).toBeGreaterThanOrEqual(1.5);
      expect(ratio).toBeLessThanOrEqual(25);
    }
  });

  it("still returns a pair when the exclusion set would empty the pool", () => {
    const [x, y] = pickPair(pool, new Set(["a", "b", "c", "d"]));
    expect(x).toBeDefined();
    expect(y).toBeDefined();
    expect(x.id).not.toBe(y.id);
  });
});
