import type { Question } from "@/data/types";
import { CREATURES, isScaleCreature, type ScaleCreature } from "./creatures";
import { pickPair } from "./scale-scoring";
import type { ScaleArt } from "@/lib/multiplayer/types";

/**
 * Only entries measured by height can enter the scale game. `isScaleCreature`
 * narrows the type as well as filtering, so everything downstream reads
 * `heightM` without a guard and an archetype with no knowable size cannot reach
 * a round. See the header of `creatures.ts` for why that matters.
 *
 * Exported so the solo page and the multiplayer room draw from one pool. They
 * each had their own copy of this line, which is one edit away from two games
 * disagreeing about who is in the cast.
 */
export const SCALE_POOL: ScaleCreature[] = CREATURES.filter(isScaleCreature);

export function creatureById(id: string): ScaleCreature | undefined {
  return SCALE_POOL.find((c) => c.id === id);
}

/**
 * Strip a creature down to what a phone is allowed to know.
 *
 * Server-side only, and that is the point: `heightM`, `measure` and `source`
 * never cross into a payload through here. This module imports the whole
 * creature table, so it must not be imported by a client component either, or
 * the table lands back in the bundle.
 */
export function toScaleArt(c: ScaleCreature): ScaleArt {
  return { id: c.id, name: c.name, palette: c.palette, artFraction: c.artFraction };
}

/**
 * Generate scale rounds for a multiplayer room.
 *
 * Scale questions are built, not authored. Every other question type is read
 * from a quiz file, but a scale round is a pairing drawn from the creature
 * pool, so a room playing scale ignores the selected quizzes entirely.
 *
 * Pairs avoid repeating a creature while the pool has unused entries left, the
 * same rule the solo game follows. The pool is small, so `count` beyond roughly
 * half its size necessarily starts reusing creatures; `pickPair` falls back to
 * the whole pool rather than throwing when that happens.
 */
/**
 * The window `pickPair` calls interesting: below 1.5x the honest answer is
 * "about the same", above 25x the stage cannot show both creatures.
 */
function isGoodPair(a: ScaleCreature, b: ScaleCreature): boolean {
  const ratio = Math.max(a.heightM, b.heightM) / Math.min(a.heightM, b.heightM);
  return ratio >= 1.5 && ratio <= 25;
}

export function buildScaleQuestions(count: number): Question[] {
  const questions: Question[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < count; i++) {
    /*
     * `pickPair` gives up quietly rather than throwing: when the exclusion set
     * has narrowed the pool to creatures that form no interesting pair, it
     * returns "any two distinct entries" with no ratio check at all. That
     * emitted a 1.19x round, where the honest answer is "about the same size",
     * near the end of every cycle through the pool.
     *
     * So the exclusion set is cleared when it has painted us into that corner,
     * rather than at a guessed threshold, and the second draw sees everyone.
     */
    let [reference, target] = pickPair(SCALE_POOL, seen);
    if (!isGoodPair(reference, target)) {
      seen.clear();
      [reference, target] = pickPair(SCALE_POOL, seen);
    }
    seen.add(reference.id);
    seen.add(target.id);

    questions.push({
      type: "scale",
      question: `How big is the ${target.name.toLowerCase()} next to the ${reference.name.toLowerCase()}?`,
      // A scale round has no multiple choice. The four slots stay empty rather
      // than being filled with plausible-looking text, so any screen that does
      // render options shows nothing instead of showing a wrong answer.
      options: ["", "", "", ""],
      correct: 0,
      explanation: `A ${target.name.toLowerCase()} is ${target.measure}. ${target.source}.`,
      scaleReferenceId: reference.id,
      scaleTargetId: target.id,
    });
  }

  return questions;
}
