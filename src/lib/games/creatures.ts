/**
 * The cast for both mini-games.
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
 */

export interface Creature {
  id: string;
  name: string;
  /** Real-world size in metres. See `measure` for what is being measured. */
  heightM: number;
  /** What the number actually measures — shown to the player on reveal. */
  measure: string;
  /** Where the figure comes from. */
  source: string;
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
    heightM: 3.2,
    measure: "standing height",
    source: "Fictional — sized deliberately between an ostrich and a T. rex",
    palette: ["#b9c4cf", "#6d7b8a", "#3ec9d6", "#f5a623"],
    artFraction: 1.0,
    inScaleGame: true,
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
