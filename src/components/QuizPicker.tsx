"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { QuizMeta } from "@/data/types";

interface QuizPickerProps {
  onSelect: (quizId: string) => void;
  selectedId?: string;
}

export default function QuizPicker({ onSelect, selectedId }: QuizPickerProps) {
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
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="py-12 text-center text-amber-200/50">
        <p className="text-lg">Nėra kvizų</p>
        <p className="mt-1 text-sm">Sukurk naują per redaktorių</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {quizzes.map((quiz) => (
        <button
          key={quiz.id}
          onClick={() => onSelect(quiz.id)}
          className={`flex items-start gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all ${
            selectedId === quiz.id
              ? "border-amber-400 bg-amber-400/15"
              : "border-white/10 bg-white/5 hover:border-amber-400/40 hover:bg-amber-400/10"
          }`}
        >
          <span className="mt-0.5 text-4xl">{quiz.emoji}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-amber-50">{quiz.title}</h3>
            <p className="mt-0.5 text-sm text-amber-200/50 line-clamp-2">
              {quiz.description}
            </p>
            <p className="mt-1.5 text-xs text-amber-200/40">
              {quiz.questionCount} klausimų
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
