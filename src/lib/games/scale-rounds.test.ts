import { describe, it, expect } from "vitest";
import { buildScaleQuestions, creatureById, toScaleArt, SCALE_POOL } from "./scale-rounds";

describe("SCALE_POOL", () => {
  it("only holds creatures with a real, cited size", () => {
    expect(SCALE_POOL.length).toBeGreaterThan(1);
    for (const c of SCALE_POOL) {
      expect(c.inScaleGame).toBe(true);
      expect(typeof c.heightM).toBe("number");
      expect(c.heightM).toBeGreaterThan(0);
      // A size with no source is an invented number, which is the one thing
      // this game must never score a player against.
      expect(c.measure).toBeTruthy();
      expect(c.source).toBeTruthy();
    }
  });
});

describe("buildScaleQuestions", () => {
  it("builds exactly the number of rounds asked for", () => {
    expect(buildScaleQuestions(1)).toHaveLength(1);
    expect(buildScaleQuestions(6)).toHaveLength(6);
    // Past the pool size it must keep going rather than run dry or throw.
    expect(buildScaleQuestions(40)).toHaveLength(40);
  });

  it("gives every round two different, known creatures", () => {
    for (const q of buildScaleQuestions(40)) {
      expect(q.type).toBe("scale");
      expect(q.scaleReferenceId).toBeTruthy();
      expect(q.scaleTargetId).toBeTruthy();
      expect(q.scaleReferenceId).not.toBe(q.scaleTargetId);
      expect(creatureById(q.scaleReferenceId!)).toBeDefined();
      expect(creatureById(q.scaleTargetId!)).toBeDefined();
    }
  });

  it("leaves the four option slots empty", () => {
    // A scale round has no multiple choice. Filling these with plausible text
    // would put a wrong answer on any screen that still renders options.
    for (const q of buildScaleQuestions(10)) {
      expect(q.options).toEqual(["", "", "", ""]);
    }
  });

  it("pairs creatures far enough apart to be a real judgement", () => {
    for (const q of buildScaleQuestions(40)) {
      const a = creatureById(q.scaleReferenceId!)!;
      const b = creatureById(q.scaleTargetId!)!;
      const ratio = Math.max(a.heightM, b.heightM) / Math.min(a.heightM, b.heightM);
      // Below 1.5x the answer is "about the same"; above 25x the layout cannot
      // show both honestly.
      expect(ratio).toBeGreaterThanOrEqual(1.5);
      expect(ratio).toBeLessThanOrEqual(25);
    }
  });

  it("cites the target's measurement in the explanation", () => {
    for (const q of buildScaleQuestions(10)) {
      const target = creatureById(q.scaleTargetId!)!;
      expect(q.explanation).toContain(target.measure);
      expect(q.explanation).toContain(target.source);
    }
  });
});

describe("toScaleArt", () => {
  it("carries the art and none of the measurements", () => {
    // This is the guard against the answer reaching a phone before the reveal.
    // The target's height is what the round is asking for.
    for (const c of SCALE_POOL) {
      const art = toScaleArt(c);
      expect(art).toEqual({
        id: c.id,
        name: c.name,
        palette: c.palette,
        artFraction: c.artFraction,
      });
      expect(Object.keys(art)).not.toContain("heightM");
      expect(Object.keys(art)).not.toContain("measure");
      expect(Object.keys(art)).not.toContain("source");
      expect(JSON.stringify(art)).not.toContain(String(c.heightM));
    }
  });
});
