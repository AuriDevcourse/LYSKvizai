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
      { id: "green", label: "the green triangles, top and bottom", hex: "#009639", spec: "Pantone 355 C", playable: true },
      { id: "black", label: "the black triangles, hoist and fly", hex: "#000000", spec: "100% black", playable: false },
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
  {
    id: "lithuania",
    name: "Lithuania",
    ratio: "5:3",
    regions: [
      { id: "yellow", label: "the yellow band", hex: "#ffb81c", spec: "Pantone 1235", playable: true },
      { id: "green", label: "the green band", hex: "#046a38", spec: "Pantone 349", playable: true },
      { id: "red", label: "the red band", hex: "#be3a34", spec: "Pantone 180", playable: true },
    ],
  },
  {
    id: "italy",
    name: "Italy",
    ratio: "3:2",
    regions: [
      { id: "green", label: "the green band", hex: "#008c45", spec: "Pantone 17-6153 TCX, Fern Green", playable: true },
      { id: "white", label: "the white band", hex: "#f4f9ff", spec: "Pantone 11-0601 TCX, Bright White", playable: false },
      { id: "red", label: "the red band", hex: "#cd212a", spec: "Pantone 18-1662 TCX, Flame Scarlet", playable: true },
    ],
  },
  {
    id: "france",
    name: "France",
    ratio: "3:2",
    regions: [
      { id: "blue", label: "the blue band", hex: "#000091", spec: "Pantone 072 C", playable: true },
      { id: "white", label: "the white band", hex: W, spec: "white", playable: false },
      { id: "red", label: "the red band", hex: "#e1000f", spec: "Pantone 485 C", playable: true },
    ],
  },
  {
    id: "belgium",
    name: "Belgium",
    ratio: "15:13",
    regions: [
      { id: "black", label: "the black band", hex: "#2d2926", spec: "Pantone Black", playable: false },
      { id: "yellow", label: "the yellow band", hex: "#ffcd00", spec: "Pantone 116", playable: true },
      { id: "red", label: "the red band", hex: "#c8102e", spec: "Pantone 186", playable: true },
    ],
  },
  {
    id: "ukraine",
    name: "Ukraine",
    ratio: "3:2",
    regions: [
      { id: "blue", label: "the blue band", hex: "#0057b7", spec: "Pantone 2935", playable: true },
      { id: "yellow", label: "the yellow band", hex: "#ffdd00", spec: "Pantone Yellow", playable: true },
    ],
  },
  {
    id: "norway",
    name: "Norway",
    ratio: "22:16",
    regions: [
      { id: "red", label: "the red field", hex: "#ba0c2f", spec: "Pantone 200 C", playable: true },
      { id: "white", label: "the white cross", hex: W, spec: "white", playable: false },
      { id: "blue", label: "the blue cross", hex: "#00205b", spec: "Pantone 281 C", playable: true },
    ],
  },
  {
    id: "japan",
    name: "Japan",
    ratio: "3:2",
    regions: [
      { id: "white", label: "the white field", hex: W, spec: "white", playable: false },
      { id: "red", label: "the red disc", hex: "#bc002d", spec: "Pantone 032", playable: true },
    ],
  },
  {
    id: "switzerland",
    name: "Switzerland",
    ratio: "1:1",
    regions: [
      { id: "red", label: "the red field", hex: "#da291c", spec: "Pantone 485", playable: true },
      { id: "white", label: "the white cross", hex: W, spec: "white", playable: false },
    ],
  },
  {
    id: "greece",
    name: "Greece",
    ratio: "3:2",
    regions: [
      { id: "blue", label: "the blue stripes", hex: "#0d5eaf", spec: "Pantone 300 C", playable: true },
      { id: "white", label: "the white stripes", hex: W, spec: "white", playable: false },
    ],
  },
  {
    id: "spain",
    name: "Spain",
    ratio: "3:2",
    regions: [
      { id: "red", label: "the red bands", hex: "#aa151b", spec: "Pantone 032 — 'Flag Red', Royal Decree 441/1981", playable: true },
      { id: "yellow", label: "the yellow band", hex: "#f1bf00", spec: "Pantone 109 — 'Flag Weld-Yellow', Royal Decree 441/1981", playable: true },
    ],
  },
  {
    id: "portugal",
    name: "Portugal",
    ratio: "3:2",
    regions: [
      { id: "green", label: "the green field", hex: "#046a38", spec: "Pantone 349", playable: true },
      { id: "red", label: "the red field", hex: "#da291c", spec: "Pantone 485", playable: true },
      { id: "yellow", label: "the armillary sphere", hex: "#ffe900", spec: "Pantone 803", playable: true },
      { id: "blue", label: "the shield", hex: "#002d72", spec: "Pantone 288", playable: true },
    ],
  },
  {
    id: "mexico",
    name: "Mexico",
    ratio: "7:4",
    regions: [
      { id: "green", label: "the green band", hex: "#006341", spec: "Pantone 3425", playable: true },
      { id: "white", label: "the white band", hex: W, spec: "white", playable: false },
      { id: "red", label: "the red band", hex: "#c8102e", spec: "Pantone 186", playable: true },
    ],
  },
  {
    id: "kenya",
    name: "Kenya",
    ratio: "3:2",
    regions: [
      { id: "black", label: "the black band", hex: "#000000", spec: "Pantone Black", playable: false },
      { id: "red", label: "the red band", hex: "#bb0000", spec: "Pantone 180", playable: true },
      { id: "green", label: "the green band", hex: "#006600", spec: "Pantone 347", playable: true },
      { id: "white", label: "the white fimbriations", hex: W, spec: "white", playable: false },
    ],
  },
  {
    id: "southafrica",
    name: "South Africa",
    ratio: "3:2",
    regions: [
      { id: "red", label: "the red band", hex: "#e03c31", spec: "Pantone 179", playable: true },
      { id: "blue", label: "the blue band", hex: "#001489", spec: "Pantone Reflex Blue", playable: true },
      { id: "green", label: "the green Y", hex: "#007749", spec: "Pantone 3415", playable: true },
      { id: "yellow", label: "the yellow wedge", hex: "#ffb81c", spec: "Pantone 1235", playable: true },
      { id: "black", label: "the black triangle", hex: "#000000", spec: "Pantone Black", playable: false },
      { id: "white", label: "the white fimbriations", hex: W, spec: "white", playable: false },
    ],
  },
  {
    id: "ethiopia",
    name: "Ethiopia",
    ratio: "3:2",
    regions: [
      { id: "green", label: "the green band", hex: "#009a44", spec: "Pantone 347 C", playable: true },
      { id: "yellow", label: "the yellow band", hex: "#fedd00", spec: "Pantone Yellow C", playable: true },
      { id: "red", label: "the red band", hex: "#ef3340", spec: "Pantone 032 C", playable: true },
      { id: "blue", label: "the blue disc", hex: "#0645b1", spec: "Pantone 2728 C", playable: true },
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
