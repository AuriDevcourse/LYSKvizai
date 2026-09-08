"use client";

import { useCountdown } from "@/hooks/useCountdown";
import QuizImage from "./QuizImage";

/**
 * The pieces of a question screen that animate with the clock, each owning its
 * own countdown.
 *
 * `useCountdown` calls `setState` every 100ms, so whichever component calls it
 * re-renders ten times a second — and so does everything that component
 * renders. `HostQuestion` called it at the top level, which meant the entire
 * projected screen (question card, image, the 2×2 answer grid, power-up chips)
 * was rebuilt 10×/sec on a TV. `PlayerQuestion` called it *unconditionally*
 * for a zoom value only zoom-out questions use, so every phone re-rendered the
 * whole question screen 10×/sec on every question type for a number it threw
 * away.
 *
 * Moving the ticking into leaves confines each re-render to the handful of
 * nodes that actually change.
 */

interface ClockProps {
  duration: number;
  startTime: number;
}

/** The thin progress bar across the top of the host screen. */
export function TimerBar({ duration, startTime }: ClockProps) {
  const { fraction } = useCountdown(duration, startTime);
  return (
    <div aria-hidden="true" className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
      <div
        className={`h-full rounded-full transition-all duration-100 ${
          fraction > 0.5 ? "bg-answer-green" : fraction > 0.25 ? "bg-answer-yellow" : "bg-error"
        }`}
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  );
}

/**
 * The big seconds-remaining circle. It also owns the expiry callback, since
 * this is the component whose clock reaching zero is the event.
 */
export function TimerCircle({
  duration,
  startTime,
  onExpire,
}: ClockProps & { onExpire?: () => void }) {
  const { fraction, displaySeconds } = useCountdown(duration, startTime, onExpire);
  const isCritical = fraction <= 0.25;
  return (
    <div
      role="timer"
      aria-label="Time remaining"
      className={`flex h-18 w-18 shrink-0 items-center justify-center rounded-full font-headline text-3xl font-black sm:h-22 sm:w-22 sm:text-4xl ${
        isCritical
          ? "timer-critical bg-error text-background shadow-[0_0_38px_-6px_rgba(255,113,108,0.85)]"
          : fraction > 0.5
            ? "bg-answer-green text-background shadow-[0_0_32px_-8px_rgba(102,187,106,0.75)]"
            : "bg-answer-yellow text-background shadow-[0_0_32px_-8px_rgba(201,168,37,0.8)]"
      }`}
    >
      {displaySeconds}
    </div>
  );
}

/**
 * A zoom-out question's image, which starts scaled far in and pulls back as the
 * clock runs down. Only rendered for that question type, so no other question
 * pays for the ticking.
 */
export function ZoomOutImage({
  src,
  duration,
  startTime,
  className,
  settled = false,
}: ClockProps & {
  src: string;
  className?: string;
  /** Snap to actual size — used once everyone has answered. */
  settled?: boolean;
}) {
  const { fraction } = useCountdown(duration, startTime);
  return (
    <QuizImage
      src={src}
      heightClass={className ?? ""}
      className="transition-transform duration-300 ease-out"
      style={{ transform: `scale(${settled ? 1 : 1 + 5 * fraction})` }}
      priority
    />
  );
}
