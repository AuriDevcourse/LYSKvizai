/**
 * PARKED — not wired into any game.
 *
 * The Tint game deliberately carries two categories only: flags (published
 * specs) and cartoon characters the player imports themselves. Transit lines
 * were a third; they were removed from the rotation on 2026-09-07 at the
 * project owner's request, not because anything here is wrong.
 *
 * Every value below was verified character-by-character against the official
 * Issue 11 PDF on 2026-09-07 — all 23 lines, hex and Pantone. If the category
 * is ever wanted back, re-add `transitRound` to src/app/tint/page.tsx; nothing
 * else needs to change. Until then this file is data at rest.
 */
/**
 * Transport for London line colours.
 *
 * Source: TfL "Colour standard", Issue 11 — the document TfL issues to its own
 * suppliers and contractors. It states plainly that "the colours illustrated
 * for each purpose are mandatory and must be matched accurately", which makes
 * these about as factual as a colour gets: not a sample off a photograph, but
 * the value the operator requires.
 *
 * The hex values below are the exact RGB triples printed in that standard,
 * alongside the Pantone reference each one derives from.
 *
 * Why this belongs in the game: the mechanic needs a subject the player already
 * knows the colour of. Anyone who has used the Tube knows the Central line is
 * red and the Piccadilly is dark blue — the question is how precisely, which is
 * exactly the recall test flags provide, in a different domain.
 */

export interface TransitLine {
  id: string;
  name: string;
  /** Exact value from the standard. */
  hex: string;
  /** Pantone reference the value derives from. */
  spec: string;
  /** Which part of the network — used to build a coherent diagram per round. */
  group: "underground" | "overground" | "mode";
  /** Black has no hue or saturation to recover, so it can't be a target. */
  playable: boolean;
}

export const TFL_STANDARD = "TfL Colour standard, Issue 11";

export const TRANSIT_LINES: TransitLine[] = [
  // London Underground
  { id: "bakerloo", name: "Bakerloo line", hex: "#b26300", spec: "Pantone 470", group: "underground", playable: true },
  { id: "central", name: "Central line", hex: "#dc241f", spec: "Pantone 485", group: "underground", playable: true },
  { id: "circle", name: "Circle line", hex: "#ffc80a", spec: "Pantone 116", group: "underground", playable: true },
  { id: "district", name: "District line", hex: "#007d32", spec: "Pantone 356", group: "underground", playable: true },
  { id: "hammersmith", name: "Hammersmith & City line", hex: "#f589a6", spec: "Pantone 197", group: "underground", playable: true },
  { id: "jubilee", name: "Jubilee line", hex: "#838d93", spec: "Pantone 430", group: "underground", playable: true },
  { id: "metropolitan", name: "Metropolitan line", hex: "#9b0058", spec: "Pantone 235", group: "underground", playable: true },
  { id: "northern", name: "Northern line", hex: "#000000", spec: "Pantone Black", group: "underground", playable: false },
  { id: "piccadilly", name: "Piccadilly line", hex: "#0019a8", spec: "Pantone 072", group: "underground", playable: true },
  { id: "victoria", name: "Victoria line", hex: "#039be5", spec: "Pantone 299", group: "underground", playable: true },
  { id: "waterloocity", name: "Waterloo & City line", hex: "#76d0bd", spec: "Pantone 338", group: "underground", playable: true },

  // London Overground — renamed to six individual lines in 2024
  { id: "liberty", name: "Liberty line", hex: "#5d6061", spec: "Pantone 6215", group: "overground", playable: true },
  { id: "lioness", name: "Lioness line", hex: "#faa61a", spec: "Pantone 2012", group: "overground", playable: true },
  { id: "mildmay", name: "Mildmay line", hex: "#0077ad", spec: "Pantone 2383", group: "overground", playable: true },
  { id: "suffragette", name: "Suffragette line", hex: "#5bbd72", spec: "Pantone 6171", group: "overground", playable: true },
  { id: "weaver", name: "Weaver line", hex: "#823a62", spec: "Pantone 689", group: "overground", playable: true },
  { id: "windrush", name: "Windrush line", hex: "#ed1b00", spec: "Pantone 1795", group: "overground", playable: true },

  // Other modes
  { id: "dlr", name: "DLR", hex: "#00afad", spec: "Pantone 326", group: "mode", playable: true },
  { id: "elizabeth", name: "Elizabeth line", hex: "#60399e", spec: "Pantone 266", group: "mode", playable: true },
  { id: "trams", name: "London Trams", hex: "#5fb526", spec: "Pantone 368", group: "mode", playable: true },
  { id: "riverservices", name: "London River Services", hex: "#039be5", spec: "Pantone 299", group: "mode", playable: true },
  { id: "cablecar", name: "London Cable Car", hex: "#dc241f", spec: "Pantone 485", group: "mode", playable: true },
  { id: "coaches", name: "London Coaches", hex: "#ffa600", spec: "Pantone 130", group: "mode", playable: true },
];

export function playableLines(): TransitLine[] {
  return TRANSIT_LINES.filter((l) => l.playable);
}

/**
 * Pick the lines to show alongside a target.
 *
 * Same idea as leaving the rest of a flag correct: the surrounding lines are
 * shown in their true colours, so the player has real reference points on
 * screen instead of judging one colour in isolation. Drawn from the target's own
 * group, because a diagram mixing Tube lines with river services isn't a thing
 * anyone recognises.
 */
export function diagramFor(target: TransitLine, count = 5): TransitLine[] {
  const pool = TRANSIT_LINES.filter((l) => l.group === target.group && l.id !== target.id);
  const others: TransitLine[] = [];
  const taken = new Set<string>();
  while (others.length < Math.min(count - 1, pool.length)) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (taken.has(pick.id)) continue;
    taken.add(pick.id);
    others.push(pick);
  }
  // Target sits in a random slot so it isn't always the same row.
  const slot = Math.floor(Math.random() * (others.length + 1));
  others.splice(slot, 0, target);
  return others;
}
