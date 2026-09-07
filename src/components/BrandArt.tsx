/**
 * Brand illustrations, inlined.
 *
 * These exist as files too (`brand-assets/backgrounds/`, copied to `public/`)
 * for anywhere that needs a URL, but a React component is better inside the app:
 * no extra request, no `<img>` lint warning, and the fills come from palette
 * tokens through Tailwind's `fill-*` utilities rather than being frozen into the
 * file. Keep the two in step if you edit either.
 */

interface ArtProps {
  className?: string;
}

/**
 * A small pile of shapes at rest, for empty states.
 *
 * Calm rather than energetic: things set down, not thrown. One orange focal
 * shape, the rest near-invisible, so it reads as texture beside the message
 * instead of competing with it.
 */
export function EmptyPile({ className }: ArtProps) {
  return (
    <svg viewBox="180 260 380 230" className={className} aria-hidden="true">
      {/*
       * Each faded shape is solid paint inside a group that carries the opacity.
       *
       * Putting the alpha on the paint instead (`fill-white/10 stroke-white/10`)
       * looks identical in isolation and is wrong: the rounded triangle is drawn
       * as a fill plus a thick stroke, and where the two overlap two 10% layers
       * composite to about 19%, so a seam appears around the shape's edge.
       * Solid paint under a group opacity composites once.
       */}
      <g opacity={0.1}>
        <path
          d="M286,326 L321,449 L197,418 Z"
          fill="#fff"
          stroke="#fff"
          strokeWidth={44}
          strokeLinejoin="round"
        />
      </g>
      <g opacity={0.07}>
        <rect x={301} y={295} width={86} height={86} rx={26} transform="rotate(45 344 338)" fill="#fff" />
      </g>
      <g opacity={0.1}>
        <circle cx={532} cy={414} r={56} fill="#fff" />
      </g>
      {/* The focal shape, at full strength and the only colour in the pile. */}
      <rect
        x={350}
        y={330}
        width={132}
        height={132}
        rx={38}
        transform="rotate(-8 416 396)"
        className="fill-primary"
      />
    </svg>
  );
}
