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

const RENDERERS: Record<string, (c: P) => React.ReactElement> = {
  brazil: (c) => <Brazil c={c} />,
  sweden: (c) => <Nordic c={c} field="blue" cross="yellow" />,
  denmark: (c) => <Nordic c={c} field="red" cross="white" />,
  jamaica: (c) => <Jamaica c={c} />,
  germany: (c) => <Bands c={c} ids={["black", "red", "gold"]} />,
  ireland: (c) => <Bands c={c} ids={["green", "white", "orange"]} vertical />,
  netherlands: (c) => <Bands c={c} ids={["red", "white", "blue"]} />,
  india: (c) => <India c={c} />,
};

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
