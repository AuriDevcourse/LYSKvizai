"use client";

import { useEffect } from "react";
import { Clock, Hash } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const TIME_OPTIONS = [10, 15, 20, 30] as const;
const ALL_COUNT_OPTIONS = [5, 10, 15, 20, 0] as const; // 0 = all

interface GameSettingsProps {
  timer: number;
  questionCount: number;
  onTimerChange: (t: number) => void;
  onCountChange: (c: number) => void;
  showTimer?: boolean;
  /** Total number of available questions from selected quizzes */
  totalQuestions?: number;
}

export default function GameSettings({
  timer,
  questionCount,
  onTimerChange,
  onCountChange,
  showTimer = true,
  totalQuestions = 0,
}: GameSettingsProps) {
  const { t } = useTranslation();

  // Filter count options: only show values that make sense given the total
  // Always include "All" (0), and only numeric options < totalQuestions
  const countOptions = totalQuestions > 0
    ? ALL_COUNT_OPTIONS.filter((c) => c === 0 || c < totalQuestions)
    : ALL_COUNT_OPTIONS;

  // If the current selection is no longer valid, reset to "All"
  useEffect(() => {
    if (questionCount !== 0 && totalQuestions > 0 && questionCount >= totalQuestions) {
      onCountChange(0);
    }
  }, [totalQuestions, questionCount, onCountChange]);

  // Don't show question count selector if there are very few questions
  const showCountSelector = totalQuestions === 0 || totalQuestions > 5;

  return (
    <div className="flex flex-col gap-3">
      {showTimer && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-white/50">
            <Clock className="h-3.5 w-3.5" />
            {t("settings.timePerQuestion")}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {TIME_OPTIONS.map((sec) => (
              <button
                key={sec}
                onClick={() => onTimerChange(sec)}
                className={`rounded-xl py-2 text-sm font-extrabold transition-all ${
                  timer === sec
                    ? "bg-white/20 text-white ring-2 ring-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      )}
      {showCountSelector && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-white/50">
            <Hash className="h-3.5 w-3.5" />
            {t("settings.questionCount")}
            {totalQuestions > 0 && (
              <span className="text-white/30">({totalQuestions})</span>
            )}
          </div>
          <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${countOptions.length}, 1fr)` }}>
            {countOptions.map((count) => (
              <button
                key={count}
                onClick={() => onCountChange(count)}
                className={`rounded-xl py-2 text-sm font-extrabold transition-all ${
                  questionCount === count
                    ? "bg-white/20 text-white ring-2 ring-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {count === 0 ? t("settings.all") : count}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
