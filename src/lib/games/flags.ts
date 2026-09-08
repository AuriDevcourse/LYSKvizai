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
  /**
   * Which region to restore, named by shape or position — **never by colour**.
   *
   * These read "the green field", "the yellow diamond", "the red cross", which
   * handed over the answer: told the diamond is yellow, you drag hue to yellow
   * and the recall the game is built on never happens. Recognising the flag
   * tells you roughly what belongs there; the label must not.
   *
   * Shape where it is unique ("the diamond", "the saltire", "the Ashoka
   * Chakra"), position where the shape repeats. Horizontal tricolours are
   * top/middle/bottom; vertical ones are hoist/middle/fly, hoist being the mast
   * side. Orientation comes from the renderers in `FlagArt.tsx`.
   */
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
      { id: "green", label: "the field", hex: "#009c3b", spec: "Pantone 355 C", playable: true },
      { id: "yellow", label: "the diamond", hex: "#ffdf00", spec: "Pantone 7408 C", playable: true },
      { id: "blue", label: "the globe", hex: "#002776", spec: "Pantone 287 C", playable: true },
    ],
  },
  {
    id: "sweden",
    name: "Sweden",
    ratio: "16:10",
    regions: [
      { id: "blue", label: "the field", hex: "#004b87", spec: "Pantone 301 C", playable: true },
      { id: "yellow", label: "the cross", hex: "#ffcd00", spec: "Pantone 116 C", playable: true },
    ],
  },
  {
    id: "denmark",
    name: "Denmark",
    ratio: "37:28",
    regions: [
      { id: "red", label: "the field", hex: "#c60c30", spec: "Pantone 186 C (Dannebrog red)", playable: true },
      { id: "white", label: "the cross", hex: W, spec: "white", playable: false },
    ],
  },
  {
    id: "jamaica",
    name: "Jamaica",
    ratio: "2:1",
    regions: [
      { id: "gold", label: "the saltire", hex: "#ffd100", spec: "Pantone 109 C", playable: true },
      { id: "green", label: "the top and bottom triangles", hex: "#009639", spec: "Pantone 355 C", playable: true },
      { id: "black", label: "the hoist and fly triangles", hex: "#000000", spec: "100% black", playable: false },
    ],
  },
  {
    id: "germany",
    name: "Germany",
    ratio: "5:3",
    regions: [
      { id: "black", label: "the top band", hex: "#000000", spec: "RAL 9005", playable: false },
      { id: "red", label: "the middle band", hex: "#dd0000", spec: "RAL 3020 (approx. Pantone 485)", playable: true },
      { id: "gold", label: "the bottom band", hex: "#ffcc00", spec: "RAL 1021 (approx. Pantone 109)", playable: true },
    ],
  },
  {
    id: "ireland",
    name: "Ireland",
    ratio: "2:1",
    regions: [
      { id: "green", label: "the hoist band", hex: "#009a44", spec: "Pantone 347", playable: true },
      { id: "white", label: "the middle band", hex: W, spec: "white", playable: false },
      { id: "orange", label: "the fly band", hex: "#ff8200", spec: "Pantone 151", playable: true },
    ],
  },
  {
    id: "india",
    name: "India",
    ratio: "3:2",
    regions: [
      { id: "saffron", label: "the top band", hex: "#ff671f", spec: "Pantone 165 C", playable: true },
      { id: "white", label: "the middle band", hex: W, spec: "white", playable: false },
      { id: "green", label: "the bottom band", hex: "#046a38", spec: "Pantone 2258 C", playable: true },
      { id: "navy", label: "the Ashoka Chakra", hex: "#06038d", spec: "Pantone 2735 C", playable: true },
    ],
  },
  {
    id: "netherlands",
    name: "Netherlands",
    ratio: "3:2",
    regions: [
      { id: "red", label: "the top band", hex: "#ae1c28", spec: "Pantone 186 C", playable: true },
      { id: "white", label: "the middle band", hex: W, spec: "white", playable: false },
      { id: "blue", label: "the bottom band", hex: "#21468b", spec: "Pantone 280 C", playable: true },
    ],
  },
  {
    id: "lithuania",
    name: "Lithuania",
    ratio: "5:3",
    regions: [
      { id: "yellow", label: "the top band", hex: "#ffb81c", spec: "Pantone 1235", playable: true },
      { id: "green", label: "the middle band", hex: "#046a38", spec: "Pantone 349", playable: true },
      { id: "red", label: "the bottom band", hex: "#be3a34", spec: "Pantone 180", playable: true },
    ],
  },
  {
    id: "italy",
    name: "Italy",
    ratio: "3:2",
    regions: [
      { id: "green", label: "the hoist band", hex: "#008c45", spec: "Pantone 17-6153 TCX, Fern Green", playable: true },
      { id: "white", label: "the middle band", hex: "#f4f9ff", spec: "Pantone 11-0601 TCX, Bright White", playable: false },
      { id: "red", label: "the fly band", hex: "#cd212a", spec: "Pantone 18-1662 TCX, Flame Scarlet", playable: true },
    ],
  },
  {
    id: "france",
    name: "France",
    ratio: "3:2",
    regions: [
      { id: "blue", label: "the hoist band", hex: "#000091", spec: "Pantone 072 C", playable: true },
      { id: "white", label: "the middle band", hex: W, spec: "white", playable: false },
      { id: "red", label: "the fly band", hex: "#e1000f", spec: "Pantone 485 C", playable: true },
    ],
  },
  {
    id: "belgium",
    name: "Belgium",
    ratio: "15:13",
    regions: [
      { id: "black", label: "the hoist band", hex: "#2d2926", spec: "Pantone Black", playable: false },
      { id: "yellow", label: "the middle band", hex: "#ffcd00", spec: "Pantone 116", playable: true },
      { id: "red", label: "the fly band", hex: "#c8102e", spec: "Pantone 186", playable: true },
    ],
  },
  {
    id: "ukraine",
    name: "Ukraine",
    ratio: "3:2",
    regions: [
      { id: "blue", label: "the top band", hex: "#0057b7", spec: "Pantone 2935", playable: true },
      { id: "yellow", label: "the bottom band", hex: "#ffdd00", spec: "Pantone Yellow", playable: true },
    ],
  },
  {
    id: "norway",
    name: "Norway",
    ratio: "22:16",
    regions: [
      { id: "red", label: "the field", hex: "#ba0c2f", spec: "Pantone 200 C", playable: true },
      { id: "white", label: "the outer cross", hex: W, spec: "white", playable: false },
      { id: "blue", label: "the inner cross", hex: "#00205b", spec: "Pantone 281 C", playable: true },
    ],
  },
  {
    id: "japan",
    name: "Japan",
    ratio: "3:2",
    regions: [
      { id: "white", label: "the field", hex: W, spec: "white", playable: false },
      { id: "red", label: "the disc", hex: "#bc002d", spec: "Pantone 032", playable: true },
    ],
  },
  {
    id: "switzerland",
    name: "Switzerland",
    ratio: "1:1",
    regions: [
      { id: "red", label: "the field", hex: "#da291c", spec: "Pantone 485", playable: true },
      { id: "white", label: "the cross", hex: W, spec: "white", playable: false },
    ],
  },
  {
    id: "greece",
    name: "Greece",
    ratio: "3:2",
    regions: [
      { id: "blue", label: "the stripes and canton", hex: "#0d5eaf", spec: "Pantone 300 C", playable: true },
      { id: "white", label: "the alternating stripes", hex: W, spec: "white", playable: false },
    ],
  },
  {
    id: "spain",
    name: "Spain",
    ratio: "3:2",
    regions: [
      { id: "red", label: "the top and bottom bands", hex: "#aa151b", spec: "Pantone 032 — 'Flag Red', Royal Decree 441/1981", playable: true },
      { id: "yellow", label: "the middle band", hex: "#f1bf00", spec: "Pantone 109 — 'Flag Weld-Yellow', Royal Decree 441/1981", playable: true },
    ],
  },
  {
    id: "portugal",
    name: "Portugal",
    ratio: "3:2",
    regions: [
      { id: "green", label: "the hoist field", hex: "#046a38", spec: "Pantone 349", playable: true },
      { id: "red", label: "the fly field", hex: "#da291c", spec: "Pantone 485", playable: true },
      { id: "yellow", label: "the armillary sphere", hex: "#ffe900", spec: "Pantone 803", playable: true },
      { id: "blue", label: "the shield", hex: "#002d72", spec: "Pantone 288", playable: true },
    ],
  },
  {
    id: "mexico",
    name: "Mexico",
    ratio: "7:4",
    regions: [
      { id: "green", label: "the hoist band", hex: "#006341", spec: "Pantone 3425", playable: true },
      { id: "white", label: "the middle band", hex: W, spec: "white", playable: false },
      { id: "red", label: "the fly band", hex: "#c8102e", spec: "Pantone 186", playable: true },
    ],
  },
  {
    id: "kenya",
    name: "Kenya",
    ratio: "3:2",
    regions: [
      { id: "black", label: "the top band", hex: "#000000", spec: "Pantone Black", playable: false },
      { id: "red", label: "the middle band", hex: "#bb0000", spec: "Pantone 180", playable: true },
      { id: "green", label: "the bottom band", hex: "#006600", spec: "Pantone 347", playable: true },
      { id: "white", label: "the fimbriations", hex: W, spec: "white", playable: false },
    ],
  },
  {
    id: "southafrica",
    name: "South Africa",
    ratio: "3:2",
    regions: [
      { id: "red", label: "the upper band", hex: "#e03c31", spec: "Pantone 179", playable: true },
      { id: "blue", label: "the lower band", hex: "#001489", spec: "Pantone Reflex Blue", playable: true },
      { id: "green", label: "the Y", hex: "#007749", spec: "Pantone 3415", playable: true },
      { id: "yellow", label: "the wedge", hex: "#ffb81c", spec: "Pantone 1235", playable: true },
      { id: "black", label: "the triangle", hex: "#000000", spec: "Pantone Black", playable: false },
      { id: "white", label: "the fimbriations", hex: W, spec: "white", playable: false },
    ],
  },
  {
    id: "ethiopia",
    name: "Ethiopia",
    ratio: "3:2",
    regions: [
      { id: "green", label: "the top band", hex: "#009a44", spec: "Pantone 347 C", playable: true },
      { id: "yellow", label: "the middle band", hex: "#fedd00", spec: "Pantone Yellow C", playable: true },
      { id: "red", label: "the bottom band", hex: "#ef3340", spec: "Pantone 032 C", playable: true },
      { id: "blue", label: "the disc", hex: "#0645b1", spec: "Pantone 2728 C", playable: true },
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

/** Key for one asked question: this region of this flag. */
export function roundKey(flagId: string, regionId: string): string {
  return `${flagId}:${regionId}`;
}

/**
 * Choose the next flag and region to ask about.
 *
 * `asked` holds `flag:region` keys. This used to retire a whole flag after one
 * round, which made most of the game unreachable: 23 flags but 51 playable
 * regions, so two thirds of the questions could never come up. Brazil has a
 * field, a diamond and a globe; Portugal, South Africa and Ethiopia have four
 * parts each.
 *
 * Flags nobody has been asked about come first, so early rounds stay varied.
 * Only once every flag has been used does one return wanting a different part.
 * That order matters: Brazil twice in three rounds reads as a bug, whereas
 * Brazil coming back later for the globe instead of the diamond reads as the
 * game going deeper. Once all 51 are done it starts over.
 */
export function pickFlagRound(
  asked: Set<string>,
  choose: (count: number) => number = (n) => Math.floor(Math.random() * n),
): { flag: Flag; region: FlagRegion } {
  const remaining = FLAGS.map((flag) => ({
    flag,
    unasked: playableRegions(flag).filter((r) => !asked.has(roundKey(flag.id, r.id))),
  })).filter((x) => x.unasked.length > 0);

  if (remaining.length === 0) {
    // Every question has been asked; begin again rather than dead-end.
    const flag = FLAGS[choose(FLAGS.length)];
    const options = playableRegions(flag);
    return { flag, region: options[choose(options.length)] };
  }

  const untouched = remaining.filter(
    (x) => x.unasked.length === playableRegions(x.flag).length,
  );
  const pool = untouched.length ? untouched : remaining;
  const pick = pool[choose(pool.length)];
  return { flag: pick.flag, region: pick.unasked[choose(pick.unasked.length)] };
}
