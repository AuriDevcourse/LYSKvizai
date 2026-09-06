"use client";

import { Check } from "lucide-react";
import { ANSWER_COLORS, ANSWER_ICONS, ANSWER_SHAPE_NAMES } from "@/lib/answer-options";

/**
 * How the room split across the four options, shown on the host screen after
 * each question.
 *
 * The data was already computed server-side and thrown away. The correct answer
 * is highlighted; everything else recedes, so the shape of the room's
 * disagreement reads at a glance from across the room.
 */
interface AnswerDistributionProps {
  /** Counts per display index, already in the order shown on screen. */
  distribution: number[];
  correctIndex: number;
  /** Shape colours, matched to the answer buttons. */
  className?: string;
}



export default function AnswerDistribution({
  distribution,
  correctIndex,
  className = "",
}: AnswerDistributionProps) {
  const total = distribution.reduce((a, b) => a + b, 0);

  // Text and year rounds have no multiple-choice split to show.
  if (total === 0) return null;

  const max = Math.max(...distribution);

  return (
    <div className={`flex items-end justify-center gap-3 sm:gap-5 ${className}`}>
      {distribution.map((count, i) => {
        const isCorrect = i === correctIndex;
        const ShapeIcon = ANSWER_ICONS[i];
        // Scale against the biggest bar so a 2-vs-1 split still reads clearly,
        // with a floor so a zero-count column stays visible as an empty slot.
        const heightPct = max === 0 ? 0 : Math.round((count / max) * 100);
        const share = total === 0 ? 0 : Math.round((count / total) * 100);

        return (
          <div key={i} className="flex w-14 flex-col items-center gap-2 sm:w-20">
            <span
              className={`text-sm font-extrabold tabular-nums transition-opacity sm:text-base ${
                isCorrect ? "text-white" : "text-white/40"
              }`}
            >
              {count}
            </span>

            <div className="relative flex h-24 w-full items-end sm:h-32">
              <div
                className="animate-bar-grow w-full rounded-t-lg"
                style={{
                  height: `${Math.max(heightPct, count > 0 ? 8 : 3)}%`,
                  backgroundColor: ANSWER_COLORS[i],
                  opacity: isCorrect ? 1 : 0.28,
                  animationDelay: `${i * 70}ms`,
                }}
              />
            </div>

            <div
              className={`flex h-7 w-full items-center justify-center gap-1 rounded-lg text-sm font-bold ${
                isCorrect ? "text-white" : "text-white/30"
              }`}
              style={{ color: isCorrect ? ANSWER_COLORS[i] : undefined }}
            >
              <ShapeIcon size={14} fill="currentColor" aria-hidden />
              {isCorrect && <Check size={14} strokeWidth={3} />}
            </div>

            <span className="sr-only">
              {ANSWER_SHAPE_NAMES[i]}: {count} {count === 1 ? "player" : "players"} ({share}%)
              {isCorrect ? " — correct answer" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
