"use client";

import { Clock, Hash } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const TIME_OPTIONS = [10, 15, 20, 30] as const;
const COUNT_OPTIONS = [5, 10, 15, 20, 0] as const; // 0 = all

interface GameSettingsProps {
  timer: number;
  questionCount: number;
  onTimerChange: (t: number) => void;
  onCountChange: (c: number) => void;
  showTimer?: boolean;
}

export default function GameSettings({
  timer,
  questionCount,
  onTimerChange,
  onCountChange,
  showTimer = true,
}: GameSettingsProps) {
  const { t } = useTranslation();

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
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-white/50">
          <Hash className="h-3.5 w-3.5" />
          {t("settings.questionCount")}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {COUNT_OPTIONS.map((count) => (
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
    </div>
  );
}
