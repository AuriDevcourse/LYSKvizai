"use client";

import { useState, useEffect } from "react";
import {
  Loader2, Check,
  Calculator, Globe, Landmark, Star, FlaskConical,
  Clapperboard, Music, Cpu, TreePine, Drama,
  Clover, Trophy, Flag, BookOpen, HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { QuizMeta } from "@/data/types";

/** Map quiz IDs to specific icons and accent colors */
const QUIZ_THEME: Record<string, { icon: LucideIcon; bg: string }> = {
  "matematika":          { icon: Calculator,   bg: "bg-[#1368ce]" },
  "geografija":          { icon: Globe,         bg: "bg-[#26890c]" },
  "pasaulio-istorija":   { icon: Landmark,      bg: "bg-[#d89e00]" },
  "pasaulio-zvaigzdes":  { icon: Star,          bg: "bg-[#e21b3c]" },
  "mokslas":             { icon: FlaskConical,   bg: "bg-[#0ea5e9]" },
  "filmai-ir-serialai":  { icon: Clapperboard,  bg: "bg-[#a855f7]" },
  "muzika":              { icon: Music,         bg: "bg-[#ec4899]" },
  "technologijos":       { icon: Cpu,           bg: "bg-[#14b8a6]" },
  "kucios-ir-kaledos":   { icon: TreePine,      bg: "bg-[#16a34a]" },
  "uzgavenes-klasika":   { icon: Drama,         bg: "bg-[#f97316]" },
  "jonines-ir-rasas":    { icon: Clover,        bg: "bg-[#22c55e]" },
  "lietuvos-sportas":    { icon: Trophy,        bg: "bg-[#eab308]" },
  "lietuvos-istorija":   { icon: Landmark,      bg: "bg-[#b45309]" },
  "lietuvos-izymybes":   { icon: Star,          bg: "bg-[#7c3aed]" },
  "lietuvos-tradicijos": { icon: Flag,          bg: "bg-[#dc2626]" },
};

const DEFAULT_THEME = { icon: BookOpen, bg: "bg-white/20" };

function getQuizTheme(id: string) {
  return QUIZ_THEME[id] ?? DEFAULT_THEME;
}

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
        <p className="text-lg font-bold">No quizzes</p>
        <p className="mt-1 text-sm">Create one in the editor</p>
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
            {selectedIds.length} {selectedIds.length === 1 ? "quiz" : "quizzes"} selected
          </span>
          <span className="text-sm font-bold text-white/50">
            {totalQuestions} questions
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 stagger-children">
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
                  ? "bg-white/20 ring-2 ring-white"
                  : "glass hover:bg-white/12"
              }`}
            >
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                  <Check className="h-3.5 w-3.5 text-[#46178f]" />
                </div>
              )}
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${theme.bg}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-extrabold leading-tight text-white">{quiz.title}</h3>
              <p className="text-[11px] font-bold text-white/40">
                {quiz.questionCount} q.
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
