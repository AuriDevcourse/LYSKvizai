"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import QuizImage from "@/components/multiplayer/QuizImage";
import type { Question } from "@/data/types";
import { ANSWER_BG, ANSWER_TEXT } from "@/lib/answer-options";

/**
 * Shows a question as players will see it, with a scrub control for time.
 *
 * The two things an author could not check without starting a real game were
 * **progressive reveal** (does the question still make sense when only the
 * first four words are showing?) and **zoom-out crops** (is the subject even
 * inside the frame at maximum zoom?). Both depend entirely on where the clock
 * is, so the preview makes the clock a slider rather than something you have
 * to sit through.
 *
 * Deliberately not a full game screen: it mirrors the pieces that are
 * timing-dependent and the answer grid, and nothing else. A preview that drifts
 * from the real screen is worse than no preview, so it uses the same
 * `QuizImage` and the same answer palette the game does.
 */
export default function QuestionPreview({
  question,
  index,
  total,
  open,
  onClose,
}: {
  question: Question;
  index: number;
  total: number;
  open: boolean;
  onClose: () => void;
}) {
  /** 0 = question just appeared, 1 = clock about to expire. */
  const [elapsed, setElapsed] = useState(0);

  const type = question.type ?? "standard";
  const isZoom = type === "zoom-out";
  const isProgressive = question.progressiveReveal ?? false;

  const words = question.question.split(/\s+/).filter(Boolean);
  // Reveal completes at 70% of the clock, matching `useProgressiveReveal`.
  const revealFraction = Math.min(elapsed / 0.7, 1);
  const visibleWords = isProgressive
    ? words.slice(0, Math.max(1, Math.ceil(revealFraction * words.length)))
    : words;
  const blur = isProgressive ? Math.max(0, 20 * (1 - revealFraction)) : 0;

  // `1 + 5 * fraction` is the game's zoom curve; fraction counts *down*.
  const zoomScale = isZoom ? 1 + 5 * (1 - elapsed) : 1;

  const visible = question.options.map((o, i) => ({ o, i })).filter(({ o }) => o.trim() !== "");

  return (
    <Modal open={open} onClose={onClose} title={`Preview · question ${index + 1} of ${total}`}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-white/[0.04] p-4">
          <p className="text-center text-base font-extrabold leading-snug text-white">
            {visibleWords.join(" ")}
            {isProgressive && visibleWords.length < words.length && (
              <span className="text-white/25"> …</span>
            )}
          </p>
        </div>

        {question.image && (
          <div className="overflow-hidden rounded-xl">
            <QuizImage
              src={question.image}
              heightClass="h-40"
              style={{ transform: `scale(${zoomScale})`, filter: blur ? `blur(${blur}px)` : undefined }}
              alt="Preview of this question's picture"
            />
          </div>
        )}

        {visible.length > 0 && (
          <div className={`grid gap-2 ${visible.length <= 2 ? "grid-cols-1" : "grid-cols-2"}`}>
            {visible.map(({ o, i }) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-3 text-center text-sm font-bold ${ANSWER_TEXT} ${ANSWER_BG[i]} ${
                  i === question.correct ? "outline outline-2 outline-white" : ""
                }`}
              >
                {o}
              </div>
            ))}
          </div>
        )}

        {/* Types that aren't multiple choice show what they actually need. */}
        {type === "year-guesser" && (
          <p className="text-center text-sm font-bold text-answer-green-lit">
            Answer: {question.correctYear ?? "— no year set, this question can't be scored"}
          </p>
        )}
        {type === "fastest-finger" && (
          <p className="text-center text-sm font-bold text-answer-green-lit">
            Accepts: {question.acceptedAnswers?.join(" · ") ?? "— nothing set, no answer can be right"}
          </p>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-white/50">
            <span>Question appears</span>
            <span>Clock runs out</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={elapsed}
            onChange={(e) => setElapsed(Number(e.target.value))}
            aria-label="Scrub through the question timer"
            aria-valuetext={`${Math.round(elapsed * 100)}% of the way through`}
            className="w-full accent-primary"
          />
          {!isProgressive && !isZoom && (
            <p className="mt-1.5 text-center text-xs text-white/45">
              This question doesn&apos;t change over time — the slider only matters for
              progressive reveal and zoom-out.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
