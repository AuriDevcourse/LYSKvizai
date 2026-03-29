"use client";

import { useState, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import type { QuizMeta } from "@/data/types";
import { getQuizTheme } from "@/lib/quiz-theme";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface QuizPickerProps {
  onSelect: (quizIds: string[]) => void;
  selectedIds?: string[];
  multi?: boolean;
}

export default function QuizPicker({ onSelect, selectedIds = [], multi = true }: QuizPickerProps) {
  const { t, lang } = useTranslation();
  const [quizzes, setQuizzes] = useState<QuizMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quizzes?lang=${lang}`)
      .then((res) => res.json())
      .then((data: QuizMeta[]) => setQuizzes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lang]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="py-12 text-center text-white/60">
        <p className="text-lg font-bold">{t("quizPicker.noQuizzes")}</p>
        <p className="mt-1 text-sm">{t("quizPicker.createInEditor")}</p>
      </div>
    );
  }

  const handleToggle = (quizId: string) => {
    if (multi) {
      const next = selectedIds.includes(quizId)
        ? selectedIds.filter((id) => id !== quizId)
        : [...selectedIds, quizId];
      onSelect(next);
    } else {
      onSelect([quizId]);
    }
  };

  const totalQuestions = quizzes
    .filter((q) => selectedIds.includes(q.id))
    .reduce((sum, q) => sum + q.questionCount, 0);

  return (
    <div>
      {multi && selectedIds.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-white/5 px-4 py-2">
          <span className="text-sm font-bold text-white/70">
            {selectedIds.length} {selectedIds.length === 1 ? t("quizPicker.quiz") : t("quizPicker.quizzes")} {t("quizPicker.selected")}
          </span>
          <span className="text-sm font-bold text-white/50">
            {totalQuestions} {t("quizPicker.questions")}
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 stagger-children">
        {quizzes.map((quiz) => {
          const isSelected = selectedIds.includes(quiz.id);
          const theme = getQuizTheme(quiz.id);
          const Icon = theme.icon;
          return (
            <button
              key={quiz.id}
              onClick={() => handleToggle(quiz.id)}
              className={`answer-btn relative flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center transition-all ${
                isSelected
                  ? "bg-white/20 outline outline-[1.5px] outline-[#ff9062]"
                  : "glass hover:bg-white/5"
              }`}
            >
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                  <Check className="h-3.5 w-3.5 text-[#ff9062]" />
                </div>
              )}
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${theme.bg}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-[11px] font-bold text-white/40">
                {quiz.questionCount} {t("quizPicker.q")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
