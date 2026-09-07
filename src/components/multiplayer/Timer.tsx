"use client";

import { useEffect, useRef } from "react";
import { useCountdown } from "@/hooks/useCountdown";

interface TimerProps {
  duration: number;
  startTime: number;
  onExpire?: () => void;
}

/**
 * Seconds at which the remaining time is spoken.
 *
 * A ticking countdown must never sit inside a live region: at 10Hz it would
 * talk over everything else in the game and drown out the question. So the
 * bar is marked `aria-hidden` and the clock is announced only at the moments
 * that change a player's decision.
 */
const ANNOUNCE_AT = [30, 10, 5, 3];

export default function Timer({ duration, startTime, onExpire }: TimerProps) {
  const { fraction, displaySeconds } = useCountdown(duration, startTime, onExpire);

  const isCritical = fraction <= 0.25;

  // Announce each threshold once. Written to the node directly, for the same
  // reason as LiveRegion: it is a platform API, not state.
  const liveRef = useRef<HTMLSpanElement>(null);
  const spoken = useRef<Set<number>>(new Set());

  useEffect(() => {
    spoken.current = new Set();
  }, [startTime]);

  useEffect(() => {
    const el = liveRef.current;
    if (!el) return;
    if (displaySeconds <= 0) {
      if (!spoken.current.has(0)) {
        spoken.current.add(0);
        el.textContent = "Time is up.";
      }
      return;
    }
    const hit = ANNOUNCE_AT.find((t) => displaySeconds === t && !spoken.current.has(t));
    if (hit !== undefined) {
      spoken.current.add(hit);
      el.textContent = `${hit} seconds left.`;
    }
  }, [displaySeconds]);

  return (
    <div className="flex items-center gap-3">
      <div aria-hidden="true" className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-100 ${
            fraction > 0.5
              ? "bg-answer-green"
              : fraction > 0.25
                ? "bg-answer-yellow"
                : "bg-error"
          }`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span
        // `role="timer"` names it for assistive tech that exposes one, while
        // `aria-hidden` on the digits stops the value being re-read ten times
        // a second. The spoken version is the threshold region below.
        role="timer"
        aria-label="Time remaining"
        className={`w-8 text-center tabular-nums text-lg font-extrabold ${
          isCritical ? "text-error timer-critical" : "text-white"
        }`}
      >
        <span aria-hidden="true">{displaySeconds}</span>
      </span>
      <span ref={liveRef} aria-live="assertive" aria-atomic="true" className="sr-only" />
    </div>
  );
}
