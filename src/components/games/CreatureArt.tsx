"use client";

/**
 * Original artwork for the mini-games.
 *
 * Every shape here was drawn for this project. Nothing is traced from or
 * modelled on an existing character — see the note in `lib/games/creatures.ts`
 * for why that matters.
 *
 * Each creature takes exactly four colours, in a fixed order, so the tint game
 * can swap the palette wholesale and score each slot:
 *   [0] body   [1] shade   [2] accent   [3] detail
 *
 * Every drawing is authored in a 100×100 viewBox and sits on the baseline at
 * y=100, so the scale game can put two of them side by side and have their
 * feet line up without any per-creature nudging.
 */

export type Palette = string[];

interface ArtProps {
  palette: Palette;
}

const Cat = ({ palette: p }: ArtProps) => (
  <>
    <ellipse cx="46" cy="74" rx="30" ry="20" fill={p[0]} />
    <path d="M74 74 q16 -4 14 -18 q-2 12 -14 10 Z" fill={p[1]} />
    <circle cx="26" cy="52" r="19" fill={p[0]} />
    <path d="M11 42 l-2 -17 l15 9 Z" fill={p[0]} />
    <path d="M41 42 l2 -17 l-15 9 Z" fill={p[0]} />
    <path d="M13 41 l-1 -10 l8 5 Z" fill={p[2]} />
    <path d="M39 41 l1 -10 l-8 5 Z" fill={p[2]} />
    <ellipse cx="26" cy="60" rx="11" ry="8" fill={p[3]} opacity="0.5" />
    <circle cx="20" cy="50" r="3.4" fill={p[3]} />
    <circle cx="33" cy="50" r="3.4" fill={p[3]} />
    <circle cx="21" cy="49" r="1.2" fill={p[3]} opacity="0.4" />
    <path d="M23 58 h6 l-3 3 Z" fill={p[2]} />
    <rect x="20" y="92" width="9" height="8" rx="4" fill={p[1]} />
    <rect x="42" y="92" width="9" height="8" rx="4" fill={p[1]} />
    <rect x="58" y="92" width="9" height="8" rx="4" fill={p[1]} />
  </>
);

const Penguin = ({ palette: p }: ArtProps) => (
  <>
    <ellipse cx="50" cy="60" rx="27" ry="38" fill={p[0]} />
    <ellipse cx="50" cy="66" rx="18" ry="29" fill={p[1]} />
    <circle cx="50" cy="26" r="19" fill={p[0]} />
    <path d="M50 12 a19 19 0 0 1 15 25 a17 17 0 0 0 -15 -25 Z" fill={p[0]} />
    <ellipse cx="50" cy="31" rx="12" ry="13" fill={p[1]} />
    <circle cx="44" cy="25" r="3" fill={p[0]} />
    <circle cx="56" cy="25" r="3" fill={p[0]} />
    <path d="M44 33 l12 0 l-6 8 Z" fill={p[2]} />
    <ellipse cx="21" cy="62" rx="6" ry="20" fill={p[0]} transform="rotate(-12 21 62)" />
    <ellipse cx="79" cy="62" rx="6" ry="20" fill={p[0]} transform="rotate(12 79 62)" />
    <ellipse cx="40" cy="97" rx="10" ry="4" fill={p[3]} />
    <ellipse cx="60" cy="97" rx="10" ry="4" fill={p[3]} />
  </>
);

const Knight = ({ palette: p }: ArtProps) => (
  <>
    <rect x="36" y="38" width="28" height="34" rx="7" fill={p[0]} />
    <path d="M36 44 h28 v6 h-28 Z" fill={p[1]} />
    <rect x="24" y="40" width="9" height="28" rx="4.5" fill={p[1]} />
    <rect x="67" y="40" width="9" height="28" rx="4.5" fill={p[1]} />
    <rect x="40" y="70" width="9" height="26" rx="4" fill={p[1]} />
    <rect x="51" y="70" width="9" height="26" rx="4" fill={p[1]} />
    <rect x="36" y="94" width="14" height="6" rx="3" fill={p[1]} />
    <rect x="50" y="94" width="14" height="6" rx="3" fill={p[1]} />
    <rect x="38" y="14" width="24" height="26" rx="9" fill={p[0]} />
    <rect x="43" y="24" width="14" height="5" rx="2.5" fill={p[3]} />
    <path d="M50 4 q6 4 5 11 h-10 q-1 -7 5 -11 Z" fill={p[2]} />
    <path d="M70 44 l10 -26 l4 2 l-9 26 Z" fill={p[3]} />
    <rect x="66" y="42" width="16" height="4" rx="2" fill={p[2]} />
    <path d="M18 44 q-8 12 0 26 q8 -14 0 -26 Z" fill={p[2]} />
  </>
);

const Ostrich = ({ palette: p }: ArtProps) => (
  <>
    <ellipse cx="50" cy="56" rx="26" ry="21" fill={p[0]} />
    <ellipse cx="62" cy="52" rx="14" ry="13" fill={p[1]} opacity="0.55" />
    <path d="M44 40 q-4 -22 4 -30" stroke={p[0]} strokeWidth="8" fill="none" strokeLinecap="round" />
    <circle cx="49" cy="10" r="8" fill={p[1]} />
    <path d="M55 10 l10 3 l-10 3 Z" fill={p[2]} />
    <circle cx="47" cy="8" r="1.8" fill={p[3]} />
    <path d="M42 74 l-3 24" stroke={p[3]} strokeWidth="4.5" strokeLinecap="round" />
    <path d="M56 74 l3 24" stroke={p[3]} strokeWidth="4.5" strokeLinecap="round" />
    <path d="M35 98 h12" stroke={p[2]} strokeWidth="4" strokeLinecap="round" />
    <path d="M53 98 h12" stroke={p[2]} strokeWidth="4" strokeLinecap="round" />
    <path d="M24 54 q-12 6 -4 16 q6 -8 4 -16 Z" fill={p[1]} />
  </>
);

const Robot = ({ palette: p }: ArtProps) => (
  <>
    <rect x="32" y="36" width="36" height="38" rx="8" fill={p[0]} />
    <rect x="38" y="44" width="24" height="16" rx="4" fill={p[1]} />
    <circle cx="50" cy="52" r="5" fill={p[2]} />
    <rect x="20" y="40" width="9" height="26" rx="4.5" fill={p[1]} />
    <rect x="71" y="40" width="9" height="26" rx="4.5" fill={p[1]} />
    <rect x="37" y="72" width="10" height="22" rx="4" fill={p[1]} />
    <rect x="53" y="72" width="10" height="22" rx="4" fill={p[1]} />
    <rect x="33" y="92" width="16" height="8" rx="3" fill={p[3]} />
    <rect x="51" y="92" width="16" height="8" rx="3" fill={p[3]} />
    <rect x="35" y="12" width="30" height="22" rx="7" fill={p[0]} />
    <rect x="41" y="19" width="18" height="8" rx="4" fill={p[3]} />
    <circle cx="46" cy="23" r="2.6" fill={p[2]} />
    <circle cx="56" cy="23" r="2.6" fill={p[2]} />
    <path d="M50 12 v-7" stroke={p[1]} strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="3" r="3.4" fill={p[2]} />
  </>
);

const Elephant = ({ palette: p }: ArtProps) => (
  <>
    <ellipse cx="54" cy="52" rx="34" ry="27" fill={p[0]} />
    <circle cx="24" cy="48" r="21" fill={p[0]} />
    <ellipse cx="16" cy="42" rx="13" ry="17" fill={p[1]} />
    <path d="M14 62 q-6 20 4 32 q6 -4 2 -12 q-4 -10 0 -20 Z" fill={p[0]} />
    <path d="M20 64 l-7 8" stroke={p[2]} strokeWidth="4" strokeLinecap="round" />
    <circle cx="28" cy="44" r="2.6" fill={p[3]} />
    <rect x="34" y="76" width="12" height="24" rx="5" fill={p[1]} />
    <rect x="52" y="76" width="12" height="24" rx="5" fill={p[1]} />
    <rect x="70" y="76" width="12" height="24" rx="5" fill={p[1]} />
    <path d="M86 46 q10 6 6 18" stroke={p[1]} strokeWidth="4" fill="none" strokeLinecap="round" />
  </>
);

const Trex = ({ palette: p }: ArtProps) => (
  <>
    <path d="M18 92 q6 -34 30 -40 q22 -6 32 8 q10 14 -4 20 q-16 6 -30 12 Z" fill={p[0]} />
    <path d="M78 56 q16 -6 20 -22 q-12 10 -22 12 Z" fill={p[1]} />
    <circle cx="76" cy="42" r="15" fill={p[0]} />
    <path d="M64 40 q14 -10 26 -2 q-4 10 -14 12 q-10 0 -12 -10 Z" fill={p[1]} />
    <circle cx="80" cy="36" r="2.6" fill={p[3]} />
    <path d="M66 46 l20 2 l-2 4 l-18 -2 Z" fill={p[2]} />
    <path d="M68 48 l2 4 M74 49 l2 4 M80 50 l2 4" stroke={p[2]} strokeWidth="1.6" />
    <rect x="34" y="82" width="12" height="18" rx="5" fill={p[1]} />
    <rect x="54" y="82" width="12" height="18" rx="5" fill={p[1]} />
    <path d="M62 60 q8 4 6 12" stroke={p[1]} strokeWidth="4" fill="none" strokeLinecap="round" />
  </>
);

const Bus = ({ palette: p }: ArtProps) => (
  <>
    <rect x="6" y="22" width="88" height="64" rx="9" fill={p[0]} />
    <rect x="6" y="52" width="88" height="5" fill={p[1]} />
    <rect x="13" y="28" width="30" height="18" rx="3" fill={p[2]} />
    <rect x="48" y="28" width="18" height="18" rx="3" fill={p[2]} />
    <rect x="71" y="28" width="16" height="18" rx="3" fill={p[2]} />
    <rect x="13" y="62" width="26" height="17" rx="3" fill={p[2]} />
    <rect x="44" y="62" width="18" height="17" rx="3" fill={p[2]} />
    <rect x="67" y="60" width="20" height="21" rx="3" fill={p[1]} />
    <circle cx="26" cy="88" r="10" fill={p[3]} />
    <circle cx="74" cy="88" r="10" fill={p[3]} />
    <circle cx="26" cy="88" r="4" fill={p[1]} />
    <circle cx="74" cy="88" r="4" fill={p[1]} />
  </>
);

const Giraffe = ({ palette: p }: ArtProps) => (
  <>
    <ellipse cx="50" cy="66" rx="24" ry="18" fill={p[0]} />
    <path d="M44 52 q-6 -30 6 -42" stroke={p[0]} strokeWidth="13" fill="none" strokeLinecap="round" />
    <ellipse cx="53" cy="10" rx="11" ry="8" fill={p[0]} />
    <path d="M62 9 q6 1 7 4 q-5 2 -8 0 Z" fill={p[2]} />
    <circle cx="50" cy="7" r="1.9" fill={p[3]} />
    <path d="M47 2 v-4 M57 2 v-4" stroke={p[1]} strokeWidth="3" strokeLinecap="round" />
    <circle cx="41" cy="34" r="4" fill={p[1]} />
    <circle cx="47" cy="22" r="3.4" fill={p[1]} />
    <circle cx="42" cy="46" r="4" fill={p[1]} />
    <circle cx="42" cy="62" r="5" fill={p[1]} />
    <circle cx="56" cy="60" r="5.4" fill={p[1]} />
    <circle cx="62" cy="72" r="4" fill={p[1]} />
    <circle cx="46" cy="76" r="4.4" fill={p[1]} />
    <rect x="34" y="82" width="8" height="18" rx="3.5" fill={p[0]} />
    <rect x="58" y="82" width="8" height="18" rx="3.5" fill={p[0]} />
    <rect x="34" y="96" width="8" height="4" rx="2" fill={p[3]} />
    <rect x="58" y="96" width="8" height="4" rx="2" fill={p[3]} />
  </>
);

const Whale = ({ palette: p }: ArtProps) => (
  <>
    <path d="M4 60 q22 -30 52 -28 q30 2 38 22 q-8 20 -38 22 q-30 2 -52 -16 Z" fill={p[0]} />
    <path d="M10 62 q22 12 46 12 q26 0 38 -12 q-8 18 -38 20 q-28 2 -46 -20 Z" fill={p[2]} />
    <path d="M4 60 q-4 -14 -2 -22 q10 8 14 14 Z" fill={p[1]} />
    <path d="M2 62 q-2 12 2 20 q8 -8 12 -14 Z" fill={p[1]} />
    <path d="M52 76 q10 10 22 8 q-10 -6 -14 -12 Z" fill={p[1]} />
    <circle cx="82" cy="52" r="2.8" fill={p[3]} />
    <path d="M74 40 q6 -8 12 -4" stroke={p[3]} strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M26 40 q4 -8 10 -6" stroke={p[1]} strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </>
);

const ART: Record<string, (props: ArtProps) => React.ReactElement> = {
  cat: Cat,
  penguin: Penguin,
  knight: Knight,
  ostrich: Ostrich,
  robot: Robot,
  elephant: Elephant,
  trex: Trex,
  bus: Bus,
  giraffe: Giraffe,
  whale: Whale,
};

interface CreatureArtProps {
  id: string;
  palette: Palette;
  /**
   * How many CSS pixels the creature's *measured* dimension should occupy —
   * its shoulder height, standing height or length, whichever the data says.
   * Not the size of the SVG box.
   */
  height: number;
  /**
   * Fraction of the square viewBox that the measured dimension spans. The box
   * is scaled up by 1/artFraction so the measured part lands at `height`.
   * Defaults to 1 (the drawing fills the box).
   */
  artFraction?: number;
  className?: string;
  title?: string;
}

export default function CreatureArt({
  id, palette, height, artFraction = 1, className = "", title,
}: CreatureArtProps) {
  const Art = ART[id];
  if (!Art) return null;
  // Scale the whole box so that the measured dimension — not the bounding box —
  // matches the caller's size. Without this a cat drawn in the lower half of
  // its box renders as tall as a giraffe that fills its own.
  const box = height / Math.max(0.05, artFraction);
  return (
    <svg
      viewBox="0 0 100 100"
      height={box}
      width={box}
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      style={{ overflow: "visible" }}
    >
      <Art palette={palette} />
    </svg>
  );
}

export const CREATURE_IDS = Object.keys(ART);
