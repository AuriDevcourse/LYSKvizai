/**
 * PARKED — not wired into any game.
 *
 * The Tint game deliberately carries two categories only: flags (published
 * specs) and cartoon characters the player imports themselves. Transit lines
 * were a third; they were removed from the rotation on 2026-09-07 at the
 * project owner's request, not because anything here is wrong.
 *
 * Renders the generic route diagram those lines were shown on. Kept beside
 * src/lib/games/transit.ts so the pair can be revived together.
 */
"use client";

import type { TransitLine } from "@/lib/games/transit";

/**
 * A stylised transit diagram: parallel routes with interchange ticks.
 *
 * Deliberately generic rather than a reproduction of the Tube map. The
 * roundel and the map itself are TfL trademarks and the map is a copyrighted
 * work — the *colour specifications* are published facts anyone may use, the
 * artwork is not. This is a diagram in the general idiom of a transit map,
 * which is what the game actually needs: several routes side by side so the
 * player can judge one colour against neighbours they know are correct.
 *
 * Each route gets a small dogleg so the drawing reads as a network rather than
 * a bar chart, and so a colour is seen on both horizontal and diagonal strokes
 * the way it would be in use.
 */
interface TransitDiagramProps {
  lines: TransitLine[];
  /** id → hex. Lets the game override exactly one line's colour. */
  colors: Record<string, string>;
  width: number;
  /** The line being asked about, drawn thicker so it's unmistakable. */
  targetId?: string;
  className?: string;
  title?: string;
}

export default function TransitDiagram({
  lines, colors, width, targetId, className = "", title,
}: TransitDiagramProps) {
  const H = 70;
  const rows = lines.length;
  const gap = H / (rows + 1);

  return (
    <svg
      viewBox="0 0 100 70"
      width={width}
      height={width * 0.7}
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
    >
      <rect width="100" height="70" fill="#f4f4f2" />

      {lines.map((line, i) => {
        const y = gap * (i + 1);
        // Dogleg: straight, a short diagonal, then straight again. Offset per
        // row so the diagonals don't all stack in one column.
        const bend = 34 + ((i * 11) % 26);
        const drop = i % 2 === 0 ? -4 : 4;
        const isTarget = line.id === targetId;
        const stroke = colors[line.id] ?? line.hex;

        return (
          <g key={line.id}>
            <path
              d={`M4 ${y} H${bend} L${bend + 9} ${y + drop} H96`}
              fill="none"
              stroke={stroke}
              strokeWidth={isTarget ? 5.4 : 3.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Interchange ticks — the visual grammar that makes this read as a
                route diagram rather than a set of stripes. */}
            {[14, 26, bend + 20, bend + 34].map((x) =>
              x < 92 ? (
                <circle
                  key={x}
                  cx={x}
                  cy={x < bend ? y : y + drop}
                  r={isTarget ? 2.4 : 1.8}
                  fill="#f4f4f2"
                  stroke="#2b2b2b"
                  strokeWidth="0.9"
                />
              ) : null
            )}
          </g>
        );
      })}
    </svg>
  );
}
