"use client";

import { useCountdown } from "@/hooks/useCountdown";

interface TimerProps {
  duration: number;
  startTime: number;
  onExpire?: () => void;
}

export default function Timer({ duration, startTime, onExpire }: TimerProps) {
  const { fraction, displaySeconds } = useCountdown(duration, startTime, onExpire);

  const color =
    fraction > 0.5
      ? "bg-emerald-400"
      : fraction > 0.25
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-100 ${color}`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span
        className={`min-w-[2ch] text-right text-lg font-bold ${
          fraction <= 0.25 ? "text-red-400" : "text-amber-50"
        }`}
      >
        {displaySeconds}
      </span>
    </div>
  );
}
