/**
 * The cast for the scale game.
 *
 * Only the scale game reads this. The colour game draws from `flags.ts`, from
 * images you drop in `public/tint-local/`, and from your own imported
 * references — its "cartoon characters" are those local images, not these
 * drawings. The header used to say "both mini-games", which stopped being true
 * and made it look as though a sizeless entry still had a job here.
 *
 * Every character here is drawn from scratch for this project. That is a
 * deliberate constraint, not an aesthetic one: a "guess the cartoon character"
 * game built on Mickey Mouse or Pikachu is trademark and copyright
 * infringement, and shipping it would be a real problem. These are original
 * archetypes — a knight, a robot, a wizard — which are not protectable.
 *
 * `heightM` is a real-world measurement, because the whole point of the scale
 * game is that the answer is a fact rather than a vibe. Sources are cited per
 * entry; where a species varies, the figure is a typical adult and the note
 * says which measurement it is (shoulder height and total height are very
 * different numbers for an elephant, and picking the wrong one makes the game
 * lie to the player).
 *
 * Which is why **a size is optional, and a creature without one cannot enter
 * the scale game.** The robot used to carry `heightM: 3.2` with the source
 * "Fictional — sized deliberately between an ostrich and a T. rex", and it was
 * in the scale pool. Nobody can know that number. A player reasoning perfectly
 * was scored against something invented, and the reveal then told them so.
 *
 * The type enforces it rather than trusting a flag: `pickPair` needs a definite
 * `heightM`, so a pool that has not been narrowed by `isScaleCreature` will not
 * compile. Archetypes with no real size still work fine in the tint game, which
 * only ever reads the palette.
 */

export interface Creature {
  id: string;
  name: string;
  /**
   * Real-world size in metres, with what it measures and where it came from.
   *
   * All three or none. Absent means "this thing has no knowable size", which is
   * true of an invented archetype and disqualifies it from the scale game.
   */
  heightM?: number;
  /** What the number actually measures — shown to the player on reveal. */
  measure?: string;
  /** Where the figure comes from. Must be a citation, not an assertion. */
  source?: string;
  /** Palette slots consumed by the SVG. Order is stable; the tint game scores
   *  every one of these. */
  palette: string[];
  /**
   * Fraction of the 100×100 viewBox that the measured dimension actually spans.
   *
   * Without this the scale game lies. Every drawing is authored in the same
   * square box, but a giraffe fills it top to bottom while a cat only fills the
   * lower two-thirds — so rendering both "150px tall" makes the cat look far
   * bigger than its shoulder height warrants. The renderer divides by this to
   * make the *measured* dimension the thing that matches on screen.
   */
  artFraction: number;
  /**
   * Whether this entry belongs in the scale game.
   *
   * The blue whale's 30 m is a body length, not a height, and the game compares
   * heights — putting it in would be comparing two different quantities and
   * calling it a size judgement. It still appears in the colour game, where the
   * measurement is irrelevant.
   */
  inScaleGame: boolean;
}

/**
 * A creature that can appear in the scale game: one whose size is a cited fact.
 *
 * `pickPair` requires a definite `heightM`, so handing it a raw `Creature[]`
 * does not compile. Narrowing through `isScaleCreature` is the only way in,
 * which is what stops an invented size ever being scored again.
 */
export type ScaleCreature = Creature & {
  heightM: number;
  measure: string;
  source: string;
};

/** Type guard: opted in to the scale game *and* carrying a real measurement. */
export function isScaleCreature(c: Creature): c is ScaleCreature {
  return (
    c.inScaleGame &&
    typeof c.heightM === "number" &&
    c.heightM > 0 &&
    !!c.measure &&
    !!c.source
  );
}

export const CREATURES: Creature[] = [
  {
    id: "cat",
    name: "House cat",
    heightM: 0.24,
    measure: "shoulder height, typical adult",
    source: "Breed guides put a domestic shorthair at roughly 23-25 cm at the shoulder",
    palette: ["#e8933f", "#f7c98b", "#3a2a20", "#ffffff"],
    artFraction: 0.46,
    inScaleGame: true,
  },
  {
    id: "penguin",
    name: "Emperor penguin",
    heightM: 1.1,
    measure: "standing height, adult",
    source: "Adults stand around 1.1 m; the species is the tallest living penguin",
    palette: ["#20262e", "#f4f1e8", "#f0b429", "#e07b39"],
    artFraction: 0.93,
    inScaleGame: true,
  },
  {
    id: "knight",
    name: "Knight",
    heightM: 1.75,
    measure: "standing height, adult human in armour",
    source: "Average adult male height is about 1.78 m; armour adds little",
    palette: ["#8fa3b8", "#5a6b80", "#c0392b", "#f0c674"],
    artFraction: 0.96,
    inScaleGame: true,
  },
  {
    id: "ostrich",
    name: "Ostrich",
    heightM: 2.7,
    measure: "standing height, adult male",
    source: "The largest living bird, standing up to about 2.7 m",
    palette: ["#33302c", "#f2ede3", "#e8a33d", "#d97b4a"],
    artFraction: 0.98,
    inScaleGame: true,
  },
  {
    id: "robot",
    name: "Service robot",
    /*
     * No size, deliberately, which also means no game uses this entry today.
     *
     * A robot has no standing height anyone could know. It cannot be a fair
     * answer, and it cannot be the reference either: the reference's real size
     * is printed on screen, so a fictional one would hand the player an
     * invented fact to reason from and quietly corrupt every guess made against
     * it.
     *
     * Kept rather than deleted because the drawing is original work and the
     * archetype is fine — it only lacks a measurement. Give it a real, cited
     * height (a specific production robot, say) and flip `inScaleGame`, and
     * `isScaleCreature` will let it back in. Until then it is inert by
     * construction, not by convention.
     */
    palette: ["#b9c4cf", "#6d7b8a", "#3ec9d6", "#f5a623"],
    artFraction: 1.0,
    inScaleGame: false,
  },
  {
    id: "elephant",
    name: "African elephant",
    heightM: 3.2,
    measure: "shoulder height, adult male",
    source: "Fully grown males average about 3.2 m at the shoulder",
    palette: ["#8d8b86", "#6f6d69", "#c9b8a8", "#3a3a3a"],
    artFraction: 0.73,
    inScaleGame: true,
  },
  {
    id: "trex",
    name: "Tyrannosaurus",
    heightM: 3.7,
    measure: "hip height",
    source: "Hip height estimated at roughly 3.6-3.9 m; hips are the standard measure",
    palette: ["#7a8b4f", "#4f5c33", "#e2c290", "#c0392b"],
    artFraction: 0.62,
    inScaleGame: true,
  },
  {
    id: "bus",
    name: "Double-decker bus",
    heightM: 4.4,
    measure: "overall height",
    source: "A standard UK double-decker is about 4.4 m tall",
    palette: ["#c0392b", "#8e2b21", "#9fd3e8", "#2c2c2c"],
    artFraction: 0.76,
    inScaleGame: true,
  },
  {
    id: "giraffe",
    name: "Giraffe",
    heightM: 5.2,
    measure: "total height to horns, adult male",
    source: "Adult males typically 4.8-5.5 m tall",
    palette: ["#e0a94a", "#a8702c", "#f3e0b8", "#3a2a20"],
    artFraction: 1.0,
    inScaleGame: true,
  },
  {
    id: "whale",
    name: "Blue whale",
    heightM: 30,
    measure: "body length, adult",
    source: "Reaches roughly 30 m in length; the largest animal known",
    palette: ["#4a7fa5", "#33607f", "#cfd9e0", "#22384a"],
    artFraction: 0.96,
    inScaleGame: false,
  },
];

export function creatureById(id: string): Creature {
  const c = CREATURES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown creature: ${id}`);
  return c;
}
