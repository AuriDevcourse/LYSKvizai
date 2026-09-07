/**
 * The Quizmo logo and mark.
 *
 * The drawn Q *is* the capital of the word, not a mark placed beside it: a mark
 * next to "Quizmo" puts the letter on screen twice and reads "Q Quizmo". So the
 * lockup here renders the drawn Q followed by the typeset "uizmo", and there is
 * deliberately no mark-plus-full-word variant. For square spaces use `<Mark />`.
 *
 * The letters are live text in the display face rather than outlined paths,
 * which keeps them selectable, translatable and correctly hinted. The standalone
 * outlined file lives in `brand-assets/playful/logo.svg` for anywhere that has
 * no webfont.
 *
 * See BRAND.md revision 03.
 */

import { useId } from "react";

/** Geometry of the mark, on a 512 grid. Mirrors `mark-primary.svg`. */
const R_OUT = 168;
const COUNTER = 86;
const COUNTER_R = 44;
const TAIL_W = 104;
const TILT = -6;
const C = 256;
const CY = 248;
const TAIL = { x1: 326.7, y1: 318.7, x2: 410.1, y2: 402.1 };

interface MarkProps {
  className?: string;
  /** Accessible name. Omit for a decorative mark sitting beside a text logo. */
  title?: string;
}

/**
 * The mark alone: favicon, app icon, avatar, anywhere square.
 *
 * The counter is knocked out rather than filled, so the mark drops onto any
 * ground. Nothing sits inside it: every variant with a shape in the counter read
 * as a magnifying glass once reduced to 32px.
 */
export function Mark({ className, title }: MarkProps) {
  /*
   * Two marks on one page must not share a mask id. A module-level counter is
   * the obvious fix and the wrong one: it mutates state outside the component,
   * which the React Compiler rejects, and it desynchronises between server and
   * client render. `useId` is stable across both.
   */
  const id = `q-counter-${useId()}`;
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <rect width="512" height="512" fill="#fff" />
          <rect
            x={C - COUNTER}
            y={CY - COUNTER}
            width={COUNTER * 2}
            height={COUNTER * 2}
            rx={COUNTER_R}
            fill="#000"
            transform={`rotate(${TILT} ${C} ${CY})`}
          />
        </mask>
      </defs>
      <g transform={`rotate(${TILT} ${C} ${CY})`}>
        <g mask={`url(#${id})`}>
          <line
            x1={TAIL.x1}
            y1={TAIL.y1}
            x2={TAIL.x2}
            y2={TAIL.y2}
            stroke="currentColor"
            strokeWidth={TAIL_W}
            strokeLinecap="round"
          />
          <circle cx={C} cy={CY} r={R_OUT} fill="currentColor" />
        </g>
      </g>
    </svg>
  );
}

interface LogoProps {
  /** Tailwind text-size class driving the whole lockup, e.g. `text-6xl`. */
  className?: string;
  /** Colour of the drawn Q. The word takes the surrounding text colour. */
  markClassName?: string;
}

/**
 * The full logo: drawn Q plus "uizmo".
 *
 * Sized off the cap height with `1em`, so it scales with whatever font size the
 * caller sets and never needs its own breakpoints. The 1.04 factor is an optical
 * bump: round forms read small beside flat-sided ones.
 */
export default function Logo({ className = "", markClassName = "text-primary" }: LogoProps) {
  return (
    <span
      className={`font-headline inline-flex items-baseline font-extrabold tracking-tight ${className}`}
    >
      <span className="sr-only">Quizmo</span>
      <Mark
        className={`${markClassName} h-[1.04em] w-[1.04em] shrink-0 translate-y-[0.14em]`}
      />
      <span aria-hidden="true" className="-ml-[0.06em]">
        uizmo
      </span>
    </span>
  );
}
