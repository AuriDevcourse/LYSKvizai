import { describe, it, expect } from "vitest";
import {
  scoreTint, paletteDelta, applyTint, randomScramble, inverseOf, PERFECT_DE,
  scoreSingle, scrambleOne,
} from "./tint-scoring";
import { CREATURES, isScaleCreature } from "./creatures";
import { FLAGS, playableRegions, pickFlagRound, roundKey } from "./flags";
import { FLAG_RENDERER_IDS } from "@/components/games/FlagArt";
import { TRANSIT_LINES, playableLines, diagramFor } from "./transit";

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

  /*
   * The scale game's promise is that the answer is a checkable fact. These pin
   * that promise to the data.
   *
   * The robot shipped with `heightM: 3.2` and the source "Fictional — sized
   * deliberately between an ostrich and a T. rex", and it was in the scale
   * pool. A player who reasoned perfectly was scored against a number someone
   * made up, and the reveal then admitted it. The third test below is the one
   * that would have caught it.
   */
  it("gives every scale-game creature a positive height, a measure and a source", () => {
    for (const c of CREATURES.filter(isScaleCreature)) {
      expect(c.heightM).toBeGreaterThan(0);
      expect(c.measure.length).toBeGreaterThan(0);
      expect(c.source.length).toBeGreaterThan(0);
    }
  });

  it("keeps creatures with no knowable size out of the scale game", () => {
    for (const c of CREATURES) {
      if (c.heightM === undefined) {
        expect(c.inScaleGame, `${c.id} has no size and must not be a scale target`).toBe(false);
      }
    }
  });

  it("never scores a player against an invented figure", () => {
    // A source is a citation, not an admission. If it reads like one of these,
    // the number is not a fact and the creature does not belong in the game.
    const invented = /fiction|invent|made ?up|deliberate|arbitrar|guess/i;
    for (const c of CREATURES.filter(isScaleCreature)) {
      expect(
        invented.test(c.source),
        `${c.id} is a scale target but its source reads as invented: "${c.source}"`,
      ).toBe(false);
    }
  });

  it("still has enough scale targets to make varied pairs", () => {
    // pickPair needs pairs whose ratio lands between 1.5x and 25x; too small a
    // pool and the game repeats itself.
    expect(CREATURES.filter(isScaleCreature).length).toBeGreaterThanOrEqual(6);
  });
});

describe("flag region labels", () => {
  /*
   * The prompt must not contain the answer.
   *
   * Labels used to read "the green field", "the yellow diamond", "the red
   * cross". Told the diamond is yellow, a player drags hue to yellow and the
   * colour recall this game exists to test never happens. Recognising the flag
   * is supposed to be what tells you roughly what belongs there.
   */
  const COLOUR_WORDS =
    /\b(red|green|blue|yellow|gold|golden|orange|black|white|navy|saffron|purple|pink|brown|grey|gray|pale|dark|light|crimson|azure)\b/i;

  it("never names a colour", () => {
    for (const flag of FLAGS) {
      for (const region of flag.regions) {
        expect(
          COLOUR_WORDS.test(region.label),
          `${flag.name} / ${region.id}: label "${region.label}" gives away the answer`,
        ).toBe(false);
      }
    }
  });

  it("offers far more rounds than flags, because each flag has several parts", () => {
    // The selector used to retire a whole flag after one round, which made most
    // of these unreachable. Brazil alone has three; Portugal, South Africa and
    // Ethiopia have four each.
    const flags = FLAGS.length;
    const rounds = FLAGS.reduce((n, f) => n + playableRegions(f).length, 0);
    expect(flags).toBeGreaterThanOrEqual(20);
    expect(rounds).toBeGreaterThan(flags * 2);
  });

  it("gives every playable region a distinct label within its flag", () => {
    // Two regions on one flag reading "the band" would leave the player unsure
    // which one is being asked for.
    for (const flag of FLAGS) {
      const labels = flag.regions.filter((r) => r.playable).map((r) => r.label);
      expect(new Set(labels).size, `${flag.name} has duplicate labels`).toBe(labels.length);
    }
  });

  it("phrases every label so it reads after \"Restore\"", () => {
    for (const flag of FLAGS) {
      for (const region of flag.regions) {
        expect(region.label, `${flag.name} / ${region.id}`).toMatch(/^the /);
      }
    }
  });
});

describe("pickFlagRound", () => {
  const allPairs = FLAGS.flatMap((f) => playableRegions(f).map((r) => roundKey(f.id, r.id)));

  it("asks about every flag before repeating one", () => {
    // Brazil twice in three rounds reads as a bug. Every flag first, then depth.
    const asked = new Set<string>();
    const flagsSeen: string[] = [];
    for (let i = 0; i < FLAGS.length; i++) {
      const { flag, region } = pickFlagRound(asked, () => 0);
      flagsSeen.push(flag.id);
      asked.add(roundKey(flag.id, region.id));
    }
    expect(new Set(flagsSeen).size).toBe(FLAGS.length);
  });

  it("then brings a flag back for a part it has not asked about", () => {
    // Ask one region of every flag, then keep going: the next pick must be a
    // returning flag, and must not repeat a question already asked.
    const asked = new Set<string>();
    for (let i = 0; i < FLAGS.length; i++) {
      const { flag, region } = pickFlagRound(asked, () => 0);
      asked.add(roundKey(flag.id, region.id));
    }
    const { flag, region } = pickFlagRound(asked, () => 0);
    expect(asked.has(roundKey(flag.id, region.id))).toBe(false);
    // It is a flag we have already used, asking about a different part.
    expect([...asked].some((k) => k.startsWith(`${flag.id}:`))).toBe(true);
  });

  it("reaches every one of the playable regions", () => {
    const asked = new Set<string>();
    for (let i = 0; i < allPairs.length; i++) {
      const { flag, region } = pickFlagRound(asked, () => 0);
      asked.add(roundKey(flag.id, region.id));
    }
    expect(asked.size).toBe(allPairs.length);
    for (const pair of allPairs) expect(asked.has(pair)).toBe(true);
  });

  it("starts over instead of dead-ending once everything is asked", () => {
    const asked = new Set(allPairs);
    const { flag, region } = pickFlagRound(asked, () => 0);
    expect(flag).toBeTruthy();
    expect(region).toBeTruthy();
    expect(playableRegions(flag).map((r) => r.id)).toContain(region.id);
  });
});

describe("single-colour scoring (the flag game)", () => {
  it("is perfect for an exact match", () => {
    expect(scoreSingle("#009c3b", "#009c3b").points).toBe(100);
  });

  it("ranks a near miss above a wild miss", () => {
    const near = scoreSingle("#009c3b", "#0aa244");
    const wild = scoreSingle("#009c3b", "#8b1fd0");
    expect(near.points).toBeGreaterThan(wild.points);
  });

  it("stays inside 0-100 for the worst possible answer", () => {
    const r = scoreSingle("#000000", "#ffffff");
    expect(r.points).toBeGreaterThanOrEqual(0);
    expect(r.points).toBeLessThanOrEqual(100);
  });
});

describe("flag data", () => {
  it("gives every flag at least one playable region", () => {
    for (const flag of FLAGS) {
      expect(playableRegions(flag).length).toBeGreaterThan(0);
    }
  });

  it("marks pure black and white as unplayable — they have no hue to recover", () => {
    for (const flag of FLAGS) {
      for (const r of flag.regions) {
        if (r.hex.toLowerCase() === "#ffffff" || r.hex.toLowerCase() === "#000000") {
          expect(r.playable).toBe(false);
        }
      }
    }
  });

  it("uses valid hex and cites a specification for every colour", () => {
    for (const flag of FLAGS) {
      for (const r of flag.regions) {
        expect(r.hex).toMatch(/^#[0-9a-f]{6}$/i);
        expect(r.spec.length).toBeGreaterThan(0);
      }
    }
  });

  it("can always scramble a playable region reversibly", () => {
    // The property that makes every round winnable.
    let seed = 4242;
    const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (const flag of FLAGS) {
      for (const region of playableRegions(flag)) {
        for (let i = 0; i < 15; i++) {
          const sc = scrambleOne(region.hex, rng);
          const restored = applyTint(applyTint([region.hex], sc), inverseOf(sc));
          expect(paletteDelta([region.hex], restored).mean).toBeLessThanOrEqual(PERFECT_DE);
        }
      }
    }
  });
});

describe("reference set", () => {
  it("carries at least 50 factual colour references", () => {
    // The whole premise is that the game can state a correct answer. Every
    // reference is a real published specification, which is why this count is
    // worth asserting rather than assuming.
    const total = FLAGS.reduce((n, f) => n + playableRegions(f).length, 0);
    expect(total).toBeGreaterThanOrEqual(50);
  });

  it("has a renderer for every flag in the data", () => {
    // A flag with data but no drawing would crash mid-round.
    for (const flag of FLAGS) {
      expect(FLAG_RENDERER_IDS).toContain(flag.id);
    }
  });

  it("cites a real specification, not a placeholder, for every playable colour", () => {
    for (const flag of FLAGS) {
      for (const r of playableRegions(flag)) {
        // A playable reference must name something checkable: a Pantone or RAL
        // number, or a decree. "white" alone is not an answer worth scoring.
        expect(r.spec).toMatch(/Pantone|RAL|Decree|TCX/i);
      }
    }
  });

  it("uses ids unique across the whole set", () => {
    const ids = FLAGS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every region within a flag a unique id", () => {
    for (const flag of FLAGS) {
      const ids = flag.regions.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});


describe("transit reference set", () => {
  it("cites a Pantone reference for every line", () => {
    for (const line of TRANSIT_LINES) {
      expect(line.spec).toMatch(/Pantone/i);
      expect(line.hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("marks black as unplayable — no hue or saturation to recover", () => {
    const northern = TRANSIT_LINES.find((l) => l.id === "northern");
    expect(northern?.hex).toBe("#000000");
    expect(northern?.playable).toBe(false);
  });

  it("uses unique ids", () => {
    const ids = TRANSIT_LINES.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("always builds a diagram that contains the target exactly once", () => {
    for (const target of playableLines()) {
      for (let i = 0; i < 20; i++) {
        const diagram = diagramFor(target);
        expect(diagram.filter((l) => l.id === target.id)).toHaveLength(1);
        // No duplicates — the same line twice in one diagram reads as a bug.
        expect(new Set(diagram.map((l) => l.id)).size).toBe(diagram.length);
        // Every companion comes from the target's own part of the network.
        for (const l of diagram) expect(l.group).toBe(target.group);
      }
    }
  });

  it("can scramble every playable line reversibly", () => {
    let seed = 777;
    const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (const line of playableLines()) {
      for (let i = 0; i < 10; i++) {
        const sc = scrambleOne(line.hex, rng);
        const restored = applyTint(applyTint([line.hex], sc), inverseOf(sc));
        expect(paletteDelta([line.hex], restored).mean).toBeLessThanOrEqual(PERFECT_DE);
      }
    }
  });
});

describe("total reference count", () => {
  it("offers well over 50 factual references across more than one category", () => {
    const flagRefs = FLAGS.reduce((n, f) => n + playableRegions(f).length, 0);
    const transitRefs = playableLines().length;
    expect(flagRefs).toBeGreaterThanOrEqual(50);
    expect(transitRefs).toBeGreaterThan(0);
    expect(flagRefs + transitRefs).toBeGreaterThanOrEqual(70);
  });
});
