"use client";

import { useCountdown } from "@/hooks/useCountdown";

interface TimerProps {
  duration: number;
  startTime: number;
  onExpire?: () => void;
}

export default function Timer({ duration, startTime, onExpire }: TimerProps) {
  const { fraction, displaySeconds } = useCountdown(duration, startTime, onExpire);

  const isCritical = fraction <= 0.25;

  return (
    <div className="flex items-center gap-3">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/15">
        <div
          className={`h-full rounded-full transition-all duration-100 ${
            fraction > 0.5
              ? "bg-[#26890c]"
              : fraction > 0.25
                ? "bg-[#d89e00]"
                : "bg-[#e21b3c]"
          }`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span
        className={`min-w-[2ch] text-right text-lg font-extrabold ${
          isCritical ? "text-[#e21b3c] timer-critical" : "text-white"
        }`}
      >
        {displaySeconds}
      </span>
    </div>
  );
}
