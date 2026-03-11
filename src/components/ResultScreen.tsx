"use client";

import { useEffect, useState } from "react";

interface ResultScreenProps {
  score: number;
  total: number;
  onRestart: () => void;
}

function getMessage(score: number, total: number): { title: string; emoji: string } {
  const pct = score / total;
  if (pct === 1) return { title: "Perfect!", emoji: "🏆" };
  if (pct >= 0.9) return { title: "Excellent!", emoji: "🔥" };
  if (pct >= 0.7) return { title: "Great job!", emoji: "⭐" };
  if (pct >= 0.5) return { title: "Not bad!", emoji: "👍" };
  if (pct >= 0.3) return { title: "Could be better", emoji: "💪" };
  return { title: "Try again!", emoji: "🎯" };
}

export default function ResultScreen({ score, total, onRestart }: ResultScreenProps) {
  const { title, emoji } = getMessage(score, total);
  const [displayScore, setDisplayScore] = useState(0);

  // Animate score counting up
  useEffect(() => {
    if (score === 0) return;
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
  }, [score]);

  const pct = Math.round((score / total) * 100);

  return (
    <div className="flex w-full flex-col items-center text-center">
      {/* Big emoji */}
      <div className="animate-bounce-in mb-4 text-7xl">{emoji}</div>

      {/* Score */}
      <div className="animate-count-up mb-2">
        <span className="text-7xl font-extrabold text-white sm:text-8xl">
          {displayScore}
        </span>
        <span className="text-3xl font-bold text-white/50 sm:text-4xl">
          /{total}
        </span>
      </div>

      {/* Percentage bar */}
      <div className="mb-2 h-3 w-full max-w-xs overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-white transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mb-6 text-sm font-bold text-white/50">{pct}%</p>

      {/* Message */}
      <h2 className="animate-fade-in mb-8 text-3xl font-extrabold text-white sm:text-4xl">
        {title}
      </h2>

      <button onClick={onRestart} className="btn-primary w-full max-w-xs text-center">
        Play again
      </button>
    </div>
  );
}
