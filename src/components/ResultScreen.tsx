"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Star, ThumbsUp, Dumbbell, Target, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface ResultScreenProps {
  score: number;
  total: number;
  onRestart: () => void;
}

function getTierIcon(score: number, total: number): { icon: LucideIcon; color: string } {
  const pct = score / total;
  if (pct === 1) return { icon: Trophy, color: "text-primary" };
  if (pct >= 0.9) return { icon: Flame, color: "text-primary-container" };
  if (pct >= 0.7) return { icon: Star, color: "text-answer-yellow" };
  if (pct >= 0.5) return { icon: ThumbsUp, color: "text-answer-green" };
  if (pct >= 0.3) return { icon: Dumbbell, color: "text-secondary" };
  return { icon: Target, color: "text-white/50" };
}

function getMessageKey(score: number, total: number): string {
  const pct = score / total;
  if (pct === 1) return "resultScreen.perfect";
  if (pct >= 0.9) return "resultScreen.excellent";
  if (pct >= 0.7) return "resultScreen.greatJob";
  if (pct >= 0.5) return "resultScreen.notBad";
  if (pct >= 0.3) return "resultScreen.couldBeBetter";
  return "resultScreen.tryAgain";
}

/**
 * How long the score spends counting up, and when it starts.
 *
 * The percentage must not appear until the count has landed, or the screen
 * shows two different scores at once and reads as a bug. It did: the count ran
 * 600-1600ms and the percentage arrived at 1000ms.
 *
 * Module scope, not component scope: they are constants, and as locals they
 * counted as effect dependencies.
 */
const COUNT_START_MS = 500;
const COUNT_DURATION_MS = 800;
const COUNT_END_MS = COUNT_START_MS + COUNT_DURATION_MS;

export default function ResultScreen({ score, total, onRestart }: ResultScreenProps) {
  const { t } = useTranslation();
  const { icon: TierIcon, color: tierColor } = getTierIcon(score, total);
  const title = t(getMessageKey(score, total) as never);
  const [displayScore, setDisplayScore] = useState(0);
  const [step, setStep] = useState(0);

  // Staggered reveal: emoji → score counting → bar + percentage → message → button
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 200),                // emoji
      setTimeout(() => setStep(2), COUNT_START_MS),     // score starts counting
      setTimeout(() => setStep(3), COUNT_END_MS + 60),  // bar + percentage, once it has landed
      setTimeout(() => setStep(4), COUNT_END_MS + 520), // message
      setTimeout(() => setStep(5), COUNT_END_MS + 880), // button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  /*
   * Count the score up, once.
   *
   * This depended on `step`, which changes five times during the reveal. Every
   * change tore the interval down and re-ran the effect from `current = 0`, so
   * the count restarted four times and only finished after the last step
   * landed — roughly four seconds in, with the final percentage sitting beside
   * a number still climbing toward it. Depending on the *threshold* rather than
   * the step means this runs exactly once.
   */
  const counting = step >= 2;
  useEffect(() => {
    if (!counting || score === 0) return;
    const ticks = 20;
    const increment = score / ticks;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, COUNT_DURATION_MS / ticks);
    return () => clearInterval(interval);
  }, [score, counting]);

  const pct = Math.round((score / total) * 100);

  /**
   * The percentage and bar wait for the counter to land.
   *
   * Timing this with a `setTimeout` is not enough. Background tabs throttle
   * timers, and the count-up needs twenty interval ticks where the reveal needs
   * one timeout, so under throttling the timeout wins and the percentage
   * appears beside a score still reading zero — which is the contradiction this
   * was meant to remove, and I reproduced it in an unfocused tab.
   *
   * Gating on `displayScore` instead makes it impossible by construction: the
   * final figure cannot appear before the number showing it has arrived.
   */
  const scoreHasLanded = displayScore === score;
  const revealTotals = step >= 3 && scoreHasLanded;

  return (
    <div className="flex w-full flex-col items-center text-center">
      {/* Tier icon */}
      <div
        className="mb-4 transition-[opacity,transform] duration-500"
        style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "scale(1)" : "scale(0.3)" }}
      >
        <TierIcon className={`h-20 w-20 sm:h-24 sm:w-24 ${tierColor}`} strokeWidth={1.5} />
      </div>

      {/* Score */}
      <div
        className="mb-2 transition-[opacity,transform] duration-500"
        style={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "translateY(0)" : "translateY(20px)" }}
      >
        <span className="font-headline text-7xl font-extrabold text-white sm:text-8xl">
          {displayScore}
        </span>
        <span className="text-3xl font-bold text-white/50 sm:text-4xl">
          /{total}
        </span>
      </div>

      {/* Percentage bar */}
      <div
        className="mb-2 h-3 w-full max-w-xs overflow-hidden rounded-full bg-white/5 transition-opacity duration-500"
        style={{ opacity: revealTotals ? 1 : 0 }}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-1000 ease-out"
          style={{ width: revealTotals ? `${pct}%` : "0%" }}
        />
      </div>
      <p
        className="mb-6 text-sm font-bold text-white/50 transition-opacity duration-500"
        style={{ opacity: revealTotals ? 1 : 0 }}
      >
        {pct}%
      </p>

      {/* Message */}
      <h2
        className="mb-8 font-headline text-3xl font-extrabold text-white sm:text-4xl transition-[opacity,transform] duration-500"
        style={{ opacity: step >= 4 ? 1 : 0, transform: step >= 4 ? "translateY(0)" : "translateY(12px)" }}
      >
        {title}
      </h2>

      {/* Play again button */}
      <div
        className="w-full max-w-xs transition-[opacity,transform] duration-500"
        style={{ opacity: step >= 5 ? 1 : 0, transform: step >= 5 ? "translateY(0)" : "translateY(12px)" }}
      >
        <button onClick={onRestart} className="btn-primary w-full text-center">
          {t("resultScreen.playAgain")}
        </button>
      </div>
    </div>
  );
}
