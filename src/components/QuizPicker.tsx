"use client";

import { useState, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import type { QuizMeta } from "@/data/types";

interface QuizPickerProps {
  onSelect: (quizIds: string[]) => void;
  selectedIds?: string[];
  multi?: boolean;
}

export default function QuizPicker({ onSelect, selectedIds = [], multi = true }: QuizPickerProps) {
  const [quizzes, setQuizzes] = useState<QuizMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quizzes")
      .then((res) => res.json())
      .then((data) => setQuizzes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        <p className="text-lg font-bold">Nėra kvizų</p>
        <p className="mt-1 text-sm">Sukurk naują per redaktorių</p>
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
        <div className="mb-3 flex items-center justify-between rounded-xl bg-white/10 px-4 py-2">
          <span className="text-sm font-bold text-white/70">
            {selectedIds.length} {selectedIds.length === 1 ? "kvizas" : "kvizai"} pasirinkti
          </span>
          <span className="text-sm font-bold text-white/50">
            {totalQuestions} klausimų
          </span>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 stagger-children">
        {quizzes.map((quiz) => {
          const isSelected = selectedIds.includes(quiz.id);
          return (
            <button
              key={quiz.id}
              onClick={() => handleToggle(quiz.id)}
              className={`answer-btn relative flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all ${
                isSelected
                  ? "bg-white/20 ring-2 ring-white"
                  : "glass hover:bg-white/12"
              }`}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white">
                  <Check className="h-4 w-4 text-[#46178f]" />
                </div>
              )}
              <span className="text-4xl">{quiz.emoji}</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-white">{quiz.title}</h3>
                <p className="mt-1 text-xs font-medium text-white/50">
                  {quiz.questionCount} klausimų
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
