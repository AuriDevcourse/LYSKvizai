import { describe, it, expect } from "vitest";
import {
  scoreTint, paletteDelta, applyTint, randomScramble, inverseOf, PERFECT_DE,
} from "./tint-scoring";
import { CREATURES } from "./creatures";

const PALETTE = ["#e8933f", "#f7c98b", "#3a2a20", "#ffffff"];

describe("paletteDelta", () => {
  it("is zero for an identical palette", () => {
    const { mean, worst } = paletteDelta(PALETTE, PALETTE);
    expect(mean).toBeCloseTo(0, 10);
    expect(worst).toBeCloseTo(0, 10);
  });

  it("reports which slot is furthest off", () => {
    const attempt = [...PALETTE];
    attempt[2] = "#ff0000"; // wreck exactly one slot
    const { worstIndex } = paletteDelta(PALETTE, attempt);
    expect(worstIndex).toBe(2);
  });

  it("refuses mismatched palettes rather than scoring nonsense", () => {
    expect(() => paletteDelta(PALETTE, ["#fff"])).toThrow();
    expect(() => paletteDelta([], [])).toThrow();
  });
});

describe("scoreTint", () => {
  it("awards a perfect score for an exact match", () => {
    const r = scoreTint(PALETTE, PALETTE);
    expect(r.points).toBe(100);
    expect(r.meanDeltaE).toBeLessThanOrEqual(PERFECT_DE);
  });

  it("never leaves the 0-100 range, even for wildly wrong answers", () => {
    const r = scoreTint(["#000000"], ["#ffffff"]);
    expect(r.points).toBeGreaterThanOrEqual(0);
    expect(r.points).toBeLessThanOrEqual(100);
  });

  it("scores a closer attempt higher than a further one", () => {
    const near = applyTint(PALETTE, { hue: 4, sat: 1, light: 0 });
    const far = applyTint(PALETTE, { hue: 90, sat: 1, light: 0 });
    expect(scoreTint(PALETTE, near).points).toBeGreaterThan(scoreTint(PALETTE, far).points);
  });
});

describe("scramble reversibility", () => {
  it("every scramble has an exact undo — the game is always winnable", () => {
    // The single most important property here. If a scramble were not
    // reversible with the sliders the player is given, a round could be
    // unwinnable and the score would be a lie.
    let seed = 12345;
    const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

    for (const creature of CREATURES) {
      for (let i = 0; i < 20; i++) {
        const scramble = randomScramble(rng, creature.palette);
        const scrambled = applyTint(creature.palette, scramble);
        const restored = applyTint(scrambled, inverseOf(scramble));
        const { mean } = paletteDelta(creature.palette, restored);
        // Not bit-exact: HSL clamps at the extremes and hex quantises to 8 bits.
        // What matters is that it lands inside the perceptual-match threshold.
        expect(mean).toBeLessThanOrEqual(PERFECT_DE);
      }
    }
  });

  it("produces a scramble that is actually visible", () => {
    let seed = 999;
    const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 50; i++) {
      const s = randomScramble(rng);
      expect(Math.abs(s.hue)).toBeGreaterThanOrEqual(25);
      expect(Math.abs(s.hue)).toBeLessThanOrEqual(180);
    }
  });
});

describe("creature data", () => {
  it("gives every creature exactly four palette slots", () => {
    for (const c of CREATURES) expect(c.palette).toHaveLength(4);
  });

  it("uses valid hex colours throughout", () => {
    for (const c of CREATURES) {
      for (const hex of c.palette) expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("has a real, positive height and a source for every entry", () => {
    for (const c of CREATURES) {
      expect(c.heightM).toBeGreaterThan(0);
      expect(c.measure.length).toBeGreaterThan(0);
      expect(c.source.length).toBeGreaterThan(0);
    }
  });
});
