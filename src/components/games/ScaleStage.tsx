"use client";

import CreatureArt from "./CreatureArt";
import type { ScaleArt } from "@/lib/multiplayer/types";

/** Reference art is always drawn this tall, and everything else is judged against it. */
export const REF_PX = 120;
/** Stage height, including room for the labels pinned under the baseline. */
export const STAGE_H = 320;
/** Usable drawing height above the baseline. */
const STAGE_DRAW_H = STAGE_H - 80;

interface ScaleStageProps {
  /**
   * Art only, no measurements.
   *
   * The stage used to take whole creatures and print `reference.heightM`
   * itself, which meant the multiplayer round drew its label from the client's
   * creature table while its maths used the height the server sent. Two
   * sources for one number. Both labels are now passed in by the caller that
   * owns the numbers.
   */
  reference: ScaleArt;
  target: ScaleArt;
  /** How many reference-heights tall the target is being drawn right now. */
  ratio: number;
  /**
   * The true ratio, drawn as a ghost behind the guess. Omitted before the
   * reveal, which is the whole game: showing it early answers the question.
   */
  revealRatio?: number;
  /** What to print under the reference. Its real height, formatted. */
  referenceLabel: string;
  /** What to print under the target. The live guess before the reveal, the truth after. */
  targetLabel: string;
  /** Shorter stage for a phone, where the slider and button also have to fit. */
  height?: number;
}

/**
 * Two creatures on one baseline.
 *
 * Both the solo game and the multiplayer round draw this. Two copies of a
 * layout drift, and these two would drift in a way that changes what the player
 * is judging rather than only how it looks.
 *
 * Height is the only thing being compared, so everything else in the layout is
 * noise. The single `fit` factor shrinks the whole scene to keep the tallest
 * element on stage: without it, dragging the slider to the top pushes the
 * creature off screen and removes the feedback the player is steering by.
 */
export default function ScaleStage({
  reference,
  target,
  ratio,
  revealRatio,
  referenceLabel,
  targetLabel,
  height = STAGE_H,
}: ScaleStageProps) {
  const drawH = height - 80;
  const targetPx = REF_PX * ratio;
  const revealPx = revealRatio != null ? REF_PX * revealRatio : 0;

  const tallest = Math.max(
    REF_PX / reference.artFraction,
    targetPx / target.artFraction,
    revealPx / target.artFraction
  );
  const fit = Math.min(1, Math.min(STAGE_DRAW_H, drawH) / Math.max(1, tallest));

  return (
    <div className="surface relative w-full overflow-hidden rounded-3xl" style={{ height }}>
      <div className="absolute inset-x-0 bottom-14 h-px bg-white/10" />
      <div className="absolute inset-x-0 bottom-14 flex items-end justify-center gap-10 px-6 sm:gap-20">
        <div className="flex flex-col items-center">
          <CreatureArt
            id={reference.id}
            palette={reference.palette}
            height={REF_PX * fit}
            artFraction={reference.artFraction}
            title={reference.name}
          />
        </div>

        <div className="relative flex items-end">
          {revealRatio != null && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-25">
              <CreatureArt
                id={target.id}
                palette={["#ffffff", "#ffffff", "#ffffff", "#ffffff"]}
                height={revealPx * fit}
                artFraction={target.artFraction}
              />
            </div>
          )}
          <CreatureArt
            id={target.id}
            palette={target.palette}
            height={targetPx * fit}
            artFraction={target.artFraction}
            title={target.name}
          />
        </div>
      </div>

      {/* Labels pinned below the baseline so they never move as things scale. */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-10 px-6 text-center sm:gap-20">
        <div className="w-28">
          <p className="truncate text-xs font-extrabold text-white">{reference.name}</p>
          <p className="font-headline text-base font-extrabold text-secondary">
            {referenceLabel}
          </p>
        </div>
        <div className="w-28">
          <p className="truncate text-xs font-extrabold text-white">{target.name}</p>
          <p className="font-headline text-base font-extrabold tabular-nums text-primary">
            {targetLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
