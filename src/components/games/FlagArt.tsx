"use client";

/**
 * Flag renderer with per-region colour override.
 *
 * Each flag is drawn from its actual construction sheet proportions where they
 * matter (the Nordic cross is off-centre; Brazil's diamond touches the margins;
 * India's chakra is a quarter of the flag's height), because a flag drawn with
 * the wrong geometry undercuts the point of getting its colour exactly right.
 *
 * Colours come in as an id → hex map so the game can swap any single region.
 */

type P = Record<string, string>;

interface Props { c: P }

const Brazil = ({ c }: Props) => (
  <>
    <rect width="100" height="70" fill={c.green} />
    <path d="M50 6 L94 35 L50 64 L6 35 Z" fill={c.yellow} />
    <circle cx="50" cy="35" r="16" fill={c.blue} />
    {/* Band across the globe — white, so not a target region. */}
    <path d="M34 30 q16 8 32 0 q-2 5 -4 7 q-14 5 -26 -1 Z" fill="#ffffff" />
  </>
);

const Nordic = ({ c, field, cross }: Props & { field: string; cross: string }) => (
  <>
    <rect width="100" height="70" fill={c[field]} />
    {/* The Nordic cross sits left of centre — 30/70 horizontally. */}
    <rect x="0" y="29" width="100" height="12" fill={c[cross]} />
    <rect x="28" y="0" width="12" height="70" fill={c[cross]} />
  </>
);

/**
 * Jamaica: gold saltire, BLACK triangles at the hoist and fly, GREEN at top and
 * bottom. These were the wrong way round — worth stating, because a colour game
 * that shows the wrong flag is scoring you against the wrong answer.
 */
const Jamaica = ({ c }: Props) => (
  <>
    <rect width="100" height="70" fill={c.gold} />
    <path d="M0 0 L44 35 L0 70 Z" fill={c.black} />
    <path d="M100 0 L56 35 L100 70 Z" fill={c.black} />
    <path d="M0 0 L50 30 L100 0 Z" fill={c.green} />
    <path d="M0 70 L50 40 L100 70 Z" fill={c.green} />
  </>
);

const Bands = ({ c, ids, vertical = false }: Props & { ids: string[]; vertical?: boolean }) => (
  <>
    {ids.map((id, i) => {
      const n = ids.length;
      return vertical ? (
        <rect key={id} x={(100 / n) * i} y="0" width={100 / n} height="70" fill={c[id]} />
      ) : (
        <rect key={id} x="0" y={(70 / n) * i} width="100" height={70 / n} fill={c[id]} />
      );
    })}
  </>
);

const India = ({ c }: Props) => (
  <>
    <rect width="100" height="23.33" fill={c.saffron} />
    <rect y="23.33" width="100" height="23.33" fill="#ffffff" />
    <rect y="46.66" width="100" height="23.34" fill={c.green} />
    {/* Chakra: diameter equal to the width of the white band. */}
    <circle cx="50" cy="35" r="10.2" fill="none" stroke={c.navy} strokeWidth="1.6" />
    <circle cx="50" cy="35" r="2" fill={c.navy} />
    {Array.from({ length: 24 }).map((_, i) => {
      const a = (i * 15 * Math.PI) / 180;
      return (
        <line
          key={i}
          x1={50 + Math.cos(a) * 2}
          y1={35 + Math.sin(a) * 2}
          x2={50 + Math.cos(a) * 10.2}
          y2={35 + Math.sin(a) * 10.2}
          stroke={c.navy}
          strokeWidth="0.7"
        />
      );
    })}
  </>
);

/** White field with a centred disc — Japan. */
const Disc = ({ c, field, disc, r = 21 }: Props & { field: string; disc: string; r?: number }) => (
  <>
    <rect width="100" height="70" fill={c[field]} />
    <circle cx="50" cy="35" r={r} fill={c[disc]} />
  </>
);

/** Square-ish field with a centred bold cross — Switzerland. */
const SwissCross = ({ c }: Props) => (
  <>
    <rect width="100" height="70" fill={c.red} />
    <rect x="42" y="14" width="16" height="42" fill={c.white} />
    <rect x="29" y="27" width="42" height="16" fill={c.white} />
  </>
);

/** Spain: red-yellow-red with the middle band twice the height of the others. */
const Spain = ({ c }: Props) => (
  <>
    <rect width="100" height="17.5" fill={c.red} />
    <rect y="17.5" width="100" height="35" fill={c.yellow} />
    <rect y="52.5" width="100" height="17.5" fill={c.red} />
  </>
);

/** Greece: nine stripes with a cross in the canton. */
const Greece = ({ c }: Props) => (
  <>
    <rect width="100" height="70" fill={c.white} />
    {[0, 2, 4, 6, 8].map((i) => (
      <rect key={i} y={(70 / 9) * i} width="100" height={70 / 9} fill={c.blue} />
    ))}
    <rect width={(70 / 9) * 5} height={(70 / 9) * 5} fill={c.blue} />
    <rect x={(70 / 9) * 2} y="0" width={70 / 9} height={(70 / 9) * 5} fill={c.white} />
    <rect x="0" y={(70 / 9) * 2} width={(70 / 9) * 5} height={70 / 9} fill={c.white} />
  </>
);

/** Portugal: green two-fifths, red three-fifths, arms on the seam. */
const Portugal = ({ c }: Props) => (
  <>
    <rect width="40" height="70" fill={c.green} />
    <rect x="40" width="60" height="70" fill={c.red} />
    <circle cx="40" cy="35" r="15" fill="none" stroke={c.yellow} strokeWidth="3" />
    <ellipse cx="40" cy="35" rx="6" ry="15" fill="none" stroke={c.yellow} strokeWidth="1.6" />
    <line x1="25" y1="35" x2="55" y2="35" stroke={c.yellow} strokeWidth="1.6" />
    <path d="M40 24 l7 9 v10 l-7 8 l-7 -8 v-10 Z" fill={c.blue} />
    <path d="M40 24 l7 9 v10 l-7 8 l-7 -8 v-10 Z" fill="none" stroke={c.white} strokeWidth="1.4" />
  </>
);

/** Kenya: black, red and green with white fimbriations and a central shield. */
const Kenya = ({ c }: Props) => (
  <>
    <rect width="100" height="21" fill={c.black} />
    <rect y="21" width="100" height="28" fill={c.white} />
    <rect y="24.5" width="100" height="21" fill={c.red} />
    <rect y="49" width="100" height="21" fill={c.green} />
    <path d="M50 16 q9 8 9 19 q0 11 -9 19 q-9 -8 -9 -19 q0 -11 9 -19 Z" fill={c.red} />
    <path d="M50 16 q9 8 9 19 q0 11 -9 19 q-9 -8 -9 -19 q0 -11 9 -19 Z" fill="none" stroke={c.white} strokeWidth="2.2" />
    <path d="M50 22 v26" stroke={c.black} strokeWidth="3" />
  </>
);

/**
 * South Africa, built from Schedule One of the Constitution (1996).
 *
 * The spec is given as fractions of the flag's hoist (its "width", H below):
 * the green pall is H/5, each fimbriation H/15, and the red and blue bands H/3
 * — which is the published 5:1:3:1:5 stack down the fly edge. The pall's centre
 * lines "start in the top and bottom corners next to the flag post, converge in
 * the centre of the flag, and continue horizontally to the middle of the free
 * edge".
 *
 * Drawn with strokes rather than polygons. An earlier hand-built version
 * self-intersected and filled the whole area between the arms as solid green,
 * which is not this flag. A stroked polyline keeps both arms at a constant
 * width and mitres the join at the centre for free.
 */
const SouthAfrica = ({ c }: Props) => {
  const H = 70;
  const pall = H / 5;                 // green band, 14
  const edging = H / 15;              // each fimbriation, 4.67
  const pallOuter = pall + edging * 2; // white band behind it, 23.33

  // The black triangle's edges run parallel to the arms, offset from each
  // centre line by half the green band plus one edging. Extending those offset
  // lines back to the hoist gives the y values below; the gold triangle is the
  // same construction one edging further out.
  const goldTop = 8.6, goldApex = 37.8;
  const blackTop = 14.3, blackApex = 29.6;

  return (
    <>
      <rect width="100" height="35" fill={c.red} />
      <rect y="35" width="100" height="35" fill={c.blue} />
      <g fill="none" strokeLinejoin="miter">
        <path d="M0 0 L50 35 L100 35" stroke={c.white} strokeWidth={pallOuter} />
        <path d="M0 70 L50 35 L100 35" stroke={c.white} strokeWidth={pallOuter} />
        <path d="M0 0 L50 35 L100 35" stroke={c.green} strokeWidth={pall} />
        <path d="M0 70 L50 35 L100 35" stroke={c.green} strokeWidth={pall} />
      </g>
      <path d={`M0 ${goldTop} L${goldApex} 35 L0 ${70 - goldTop} Z`} fill={c.yellow} />
      <path d={`M0 ${blackTop} L${blackApex} 35 L0 ${70 - blackTop} Z`} fill={c.black} />
    </>
  );
};

/** Ethiopia: three bands with the emblem disc and pentagram. */
const Ethiopia = ({ c }: Props) => (
  <>
    <rect width="100" height="23.33" fill={c.green} />
    <rect y="23.33" width="100" height="23.33" fill={c.yellow} />
    <rect y="46.66" width="100" height="23.34" fill={c.red} />
    <circle cx="50" cy="35" r="16" fill={c.blue} />
    {/* Pentagram, drawn as a five-pointed star path */}
    <path
      d={Array.from({ length: 5 }, (_, i) => {
        const a = (i * 144 - 90) * (Math.PI / 180);
        return `${i === 0 ? "M" : "L"}${50 + Math.cos(a) * 11} ${35 + Math.sin(a) * 11}`;
      }).join(" ") + " Z"}
      fill="none"
      stroke={c.yellow}
      strokeWidth="1.8"
    />
  </>
);

const RENDERERS: Record<string, (c: P) => React.ReactElement> = {
  brazil: (c) => <Brazil c={c} />,
  sweden: (c) => <Nordic c={c} field="blue" cross="yellow" />,
  denmark: (c) => <Nordic c={c} field="red" cross="white" />,
  jamaica: (c) => <Jamaica c={c} />,
  germany: (c) => <Bands c={c} ids={["black", "red", "gold"]} />,
  ireland: (c) => <Bands c={c} ids={["green", "white", "orange"]} vertical />,
  netherlands: (c) => <Bands c={c} ids={["red", "white", "blue"]} />,
  india: (c) => <India c={c} />,

  // Added with the expansion to 51 sourced colour references.
  lithuania: (c) => <Bands c={c} ids={["yellow", "green", "red"]} />,
  italy: (c) => <Bands c={c} ids={["green", "white", "red"]} vertical />,
  france: (c) => <Bands c={c} ids={["blue", "white", "red"]} vertical />,
  belgium: (c) => <Bands c={c} ids={["black", "yellow", "red"]} vertical />,
  ukraine: (c) => <Bands c={c} ids={["blue", "yellow"]} />,
  norway: (c) => (
    <>
      <Nordic c={c} field="red" cross="white" />
      {/* The blue cross sits inside the white one, at a third of its width. */}
      <rect x="0" y="32" width="100" height="6" fill={c.blue} />
      <rect x="31" y="0" width="6" height="70" fill={c.blue} />
    </>
  ),
  japan: (c) => <Disc c={c} field="white" disc="red" r={21} />,
  switzerland: (c) => <SwissCross c={c} />,
  greece: (c) => <Greece c={c} />,
  spain: (c) => <Spain c={c} />,
  portugal: (c) => <Portugal c={c} />,
  mexico: (c) => <Bands c={c} ids={["green", "white", "red"]} vertical />,
  kenya: (c) => <Kenya c={c} />,
  southafrica: (c) => <SouthAfrica c={c} />,
  ethiopia: (c) => <Ethiopia c={c} />,
};

/** Every flag this component can draw. Asserted against the data in tests. */
export const FLAG_RENDERER_IDS = Object.keys(RENDERERS);

interface FlagArtProps {
  id: string;
  colors: P;
  width: number;
  className?: string;
  title?: string;
}

export default function FlagArt({ id, colors, width, className = "", title }: FlagArtProps) {
  const render = RENDERERS[id];
  if (!render) return null;
  return (
    <svg
      viewBox="0 0 100 70"
      width={width}
      height={width * 0.7}
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
    >
      {render(colors)}
    </svg>
  );
}
