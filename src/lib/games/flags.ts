/**
 * Reference colours for the colour-matching game.
 *
 * Why flags rather than cartoon characters
 * ---------------------------------------
 * The mechanic wants something the player already knows the colour of — that's
 * the whole game, recalling a colour rather than guessing one. Cartoon
 * characters are perfect for that and legally unusable: SpongeBob is
 * Paramount's, Pikachu is Nintendo's, and this app is deployed publicly.
 *
 * National flags give the same recall test with none of that risk. They are
 * instantly recognisable, nobody owns them, and — better than a cartoon — the
 * correct answer is a *published specification* rather than someone's opinion
 * about a screenshot. Every colour below carries the Pantone reference it comes
 * from, so the game can show its working on the reveal.
 *
 * Where a country specifies its flag in Pantone or RAL (most do) the hex here
 * is the standard sRGB rendering of that reference, not an eyedropper sample.
 */

export interface FlagRegion {
  /** Stable key used by the SVG. */
  id: string;
  /** What the player is being asked to restore, e.g. "the green". */
  label: string;
  /** Official colour, as sRGB hex. */
  hex: string;
  /** The specification this comes from. Shown on the reveal. */
  spec: string;
  /** Regions that are pure black or white are excluded from being the target —
   *  hue and saturation are meaningless on them, so they'd be unplayable. */
  playable: boolean;
}

export interface Flag {
  id: string;
  name: string;
  /** Rendered inside a 60×40 viewBox (3:2), the most common flag ratio. */
  ratio: string;
  regions: FlagRegion[];
}

const W = "#ffffff";

export const FLAGS: Flag[] = [
  {
    id: "brazil",
    name: "Brazil",
    ratio: "10:7",
    regions: [
      { id: "green", label: "the green field", hex: "#009c3b", spec: "Pantone 355 C", playable: true },
      { id: "yellow", label: "the yellow diamond", hex: "#ffdf00", spec: "Pantone 7408 C", playable: true },
      { id: "blue", label: "the blue globe", hex: "#002776", spec: "Pantone 287 C", playable: true },
    ],
  },
  {
    id: "sweden",
    name: "Sweden",
    ratio: "16:10",
    regions: [
      { id: "blue", label: "the blue field", hex: "#004b87", spec: "Pantone 301 C", playable: true },
      { id: "yellow", label: "the yellow cross", hex: "#ffcd00", spec: "Pantone 116 C", playable: true },
    ],
  },
  {
    id: "denmark",
    name: "Denmark",
    ratio: "37:28",
    regions: [
      { id: "red", label: "the red field", hex: "#c60c30", spec: "Pantone 186 C (Dannebrog red)", playable: true },
      { id: "white", label: "the white cross", hex: W, spec: "white", playable: false },
    ],
  },
  {
    id: "jamaica",
    name: "Jamaica",
    ratio: "2:1",
    regions: [
      { id: "gold", label: "the gold saltire", hex: "#ffd100", spec: "Pantone 109 C", playable: true },
      { id: "green", label: "the green triangles", hex: "#009639", spec: "Pantone 355 C", playable: true },
      { id: "black", label: "the black triangles", hex: "#000000", spec: "100% black", playable: false },
    ],
  },
  {
    id: "germany",
    name: "Germany",
    ratio: "5:3",
    regions: [
      { id: "black", label: "the black band", hex: "#000000", spec: "RAL 9005", playable: false },
      { id: "red", label: "the red band", hex: "#dd0000", spec: "RAL 3020 (approx. Pantone 485)", playable: true },
      { id: "gold", label: "the gold band", hex: "#ffcc00", spec: "RAL 1021 (approx. Pantone 109)", playable: true },
    ],
  },
  {
    id: "ireland",
    name: "Ireland",
    ratio: "2:1",
    regions: [
      { id: "green", label: "the green band", hex: "#009a44", spec: "Pantone 347", playable: true },
      { id: "white", label: "the white band", hex: W, spec: "white", playable: false },
      { id: "orange", label: "the orange band", hex: "#ff8200", spec: "Pantone 151", playable: true },
    ],
  },
  {
    id: "india",
    name: "India",
    ratio: "3:2",
    regions: [
      { id: "saffron", label: "the saffron band", hex: "#ff671f", spec: "Pantone 165 C", playable: true },
      { id: "white", label: "the white band", hex: W, spec: "white", playable: false },
      { id: "green", label: "the green band", hex: "#046a38", spec: "Pantone 2258 C", playable: true },
      { id: "navy", label: "the Ashoka Chakra", hex: "#06038d", spec: "Pantone 2735 C", playable: true },
    ],
  },
  {
    id: "netherlands",
    name: "Netherlands",
    ratio: "3:2",
    regions: [
      { id: "red", label: "the red band", hex: "#ae1c28", spec: "Pantone 186 C", playable: true },
      { id: "white", label: "the white band", hex: W, spec: "white", playable: false },
      { id: "blue", label: "the blue band", hex: "#21468b", spec: "Pantone 280 C", playable: true },
    ],
  },
];

/** The correct palette for a flag, as an id → hex map. */
export function officialPalette(flag: Flag): Record<string, string> {
  return Object.fromEntries(flag.regions.map((r) => [r.id, r.hex]));
}

/** Regions worth asking about — black and white have no hue to recover. */
export function playableRegions(flag: Flag): FlagRegion[] {
  return flag.regions.filter((r) => r.playable);
}

export function flagById(id: string): Flag {
  const f = FLAGS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown flag: ${id}`);
  return f;
}
