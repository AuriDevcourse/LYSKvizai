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

  return (
    <div className="grid gap-3 sm:grid-cols-2 stagger-children">
      {quizzes.map((quiz) => (
        <button
          key={quiz.id}
          onClick={() => onSelect(quiz.id)}
          className={`answer-btn flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all ${
            selectedId === quiz.id
              ? "bg-white/20 ring-2 ring-white"
              : "glass hover:bg-white/12"
          }`}
        >
          <span className="text-4xl">{quiz.emoji}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-white">{quiz.title}</h3>
            <p className="mt-1 text-xs font-medium text-white/50">
              {quiz.questionCount} klausimų
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
