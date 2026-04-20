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
  if (pct === 1) return { icon: Trophy, color: "text-[#ff9062]" };
  if (pct >= 0.9) return { icon: Flame, color: "text-[#ff793e]" };
  if (pct >= 0.7) return { icon: Star, color: "text-[#c9a825]" };
  if (pct >= 0.5) return { icon: ThumbsUp, color: "text-[#66bb6a]" };
  if (pct >= 0.3) return { icon: Dumbbell, color: "text-[#43a5fc]" };
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

export default function ResultScreen({ score, total, onRestart }: ResultScreenProps) {
  const { t } = useTranslation();
  const { icon: TierIcon, color: tierColor } = getTierIcon(score, total);
  const title = t(getMessageKey(score, total) as never);
  const [displayScore, setDisplayScore] = useState(0);
  const [step, setStep] = useState(0);

  // Staggered reveal: emoji → score → bar → message → button
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 200),   // emoji
      setTimeout(() => setStep(2), 600),   // score
      setTimeout(() => setStep(3), 1000),  // bar + percentage
      setTimeout(() => setStep(4), 1600),  // message
      setTimeout(() => setStep(5), 2000),  // button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Animate score counting up (starts at step 2)
  useEffect(() => {
    if (step < 2 || score === 0) return;
    const duration = 1000;
    const steps = 20;
    const increment = score / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [score, step]);

  const pct = Math.round((score / total) * 100);

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
        <span className="font-[var(--font-headline)] text-7xl font-extrabold text-white sm:text-8xl">
          {displayScore}
        </span>
        <span className="text-3xl font-bold text-white/40 sm:text-4xl">
          /{total}
        </span>
      </div>

      {/* Percentage bar */}
      <div
        className="mb-2 h-3 w-full max-w-xs overflow-hidden rounded-full bg-white/5 transition-opacity duration-500"
        style={{ opacity: step >= 3 ? 1 : 0 }}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff9062] to-[#ff793e] transition-all duration-1000 ease-out"
          style={{ width: step >= 3 ? `${pct}%` : "0%" }}
        />
      </div>
      <p
        className="mb-6 text-sm font-bold text-white/40 transition-opacity duration-500"
        style={{ opacity: step >= 3 ? 1 : 0 }}
      >
        {pct}%
      </p>

      {/* Message */}
      <h2
        className="mb-8 font-[var(--font-headline)] text-3xl font-extrabold text-white sm:text-4xl transition-[opacity,transform] duration-500"
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
