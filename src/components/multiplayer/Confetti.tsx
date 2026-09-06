"use client";

import { useMemo } from "react";

/**
 * Confetti burst for the winner reveal.
 *
 * The `confetti-fall` keyframe has been sitting in globals.css unused. Pieces
 * are generated once and positioned deterministically per index so the layout
 * doesn't reshuffle on re-render, and the whole thing is `pointer-events-none`
 * so it never eats a tap on the podium underneath.
 *
 * Honours `prefers-reduced-motion` via the global reset in globals.css, which
 * collapses the animation instead of raining across the screen.
 */
const COLORS = ["#ff9062", "#43a5fc", "#e77fff", "#66bb6a", "#c9a825", "#ff716c"];

interface ConfettiProps {
  /** Number of pieces. Kept modest — this runs on phones mid-game. */
  count?: number;
  active?: boolean;
}

export default function Confetti({ count = 40, active = true }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 97) % 100,
        delay: (i % 12) * 0.18,
        duration: 2.6 + ((i * 7) % 18) / 10,
        color: COLORS[i % COLORS.length],
        size: 6 + (i % 4) * 2,
        rounded: i % 3 === 0,
      })),
    [count]
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            backgroundColor: p.color,
            borderRadius: p.rounded ? "9999px" : "2px",
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
