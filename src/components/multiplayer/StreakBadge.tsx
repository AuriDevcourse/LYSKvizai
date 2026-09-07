"use client";

import { Flame } from "lucide-react";

/**
 * The player's live answer streak, shown on their own phone during a question.
 *
 * The server has tracked `streak` all along and it fed the score multiplier,
 * but the number only appeared for a moment on the results screen — so the
 * thing driving your points was invisible at the moment you were deciding how
 * fast to answer. Two in a row is where it starts mattering, so that's where
 * the badge appears.
 */
interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export default function StreakBadge({ streak, className = "" }: StreakBadgeProps) {
  if (streak < 2) return null;

  // Past 5 the flame runs hot — a small visual reward for a long run.
  const hot = streak >= 5;

  return (
    <div
      className={`animate-streak flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1 ${
        hot
          ? "border-primary/50 bg-primary-dim/25 text-[#ffb08c]"
          : "border-white/10 bg-white/5 text-orange-300"
      } ${className}`}
      title={`${streak} correct in a row`}
    >
      <Flame size={14} className={hot ? "text-primary" : "text-orange-400"} fill="currentColor" />
      <span className="text-sm font-extrabold tabular-nums">{streak}</span>
      <span className="sr-only">correct answers in a row</span>
    </div>
  );
}
