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

const Jamaica = ({ c }: Props) => (
  <>
    <rect width="100" height="70" fill={c.gold} />
    <path d="M0 0 L46 35 L0 70 Z" fill={c.green} />
    <path d="M100 0 L54 35 L100 70 Z" fill={c.green} />
    <path d="M0 0 L50 31 L100 0 Z" fill={c.black} />
    <path d="M0 70 L50 39 L100 70 Z" fill={c.black} />
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

/** South Africa: the six-colour Y, with white and gold fimbriations. */
const SouthAfrica = ({ c }: Props) => (
  <>
    <rect width="100" height="35" fill={c.red} />
    <rect y="35" width="100" height="35" fill={c.blue} />
    {/* White pall */}
    <path d="M0 0 L44 35 L0 70 L0 55 L26 35 L0 15 Z" fill={c.white} />
    <path d="M0 0 L14 0 L58 28 L100 28 L100 42 L58 42 L14 70 L0 70 L44 35 Z" fill={c.white} />
    {/* Green Y inside it */}
    <path d="M0 6 L38 35 L0 64 L0 54 L24 35 L0 16 Z" fill={c.green} />
    <path d="M0 6 L8 6 L52 31 L100 31 L100 39 L52 39 L8 64 L0 64 L38 35 Z" fill={c.green} />
    {/* Black triangle with its gold fimbriation */}
    <path d="M0 0 L30 21 L30 49 L0 70 Z" fill={c.yellow} />
    <path d="M0 4 L24 21 L24 49 L0 66 Z" fill={c.black} />
  </>
);

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
