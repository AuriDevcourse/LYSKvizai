"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, Loader2, Shuffle, ToggleLeft, Calendar, Keyboard, HelpCircle, ZoomOut, Smartphone } from "lucide-react";
import { TOPICS, type Topic } from "@/lib/topics";
import type { QuizMeta } from "@/data/types";
import type { QuestionType } from "@/data/types";
import { getQuizTheme } from "@/lib/quiz-theme";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export type SelectedGameType = QuestionType | "mixed" | "charades";

interface TopicPickerProps {
  onSelect: (quizIds: string[]) => void;
  selectedIds: string[];
  onQuizMetaLoad?: (quizzes: QuizMeta[]) => void;
  onGameTypeChange?: (gameType: SelectedGameType | null) => void;
}

type GameTypeOption = {
  id: QuestionType | "mixed";
  icon: typeof HelpCircle;
  bg: string;
};

const GAME_TYPES: GameTypeOption[] = [
  { id: "standard", icon: HelpCircle, bg: "bg-[#1368ce]" },
  { id: "true-false", icon: ToggleLeft, bg: "bg-[#26890c]" },
  { id: "zoom-out", icon: ZoomOut, bg: "bg-[#0ea5e9]" },
  { id: "year-guesser", icon: Calendar, bg: "bg-[#d89e00]" },
  { id: "fastest-finger", icon: Keyboard, bg: "bg-[#e21b3c]" },
  { id: "mixed", icon: Shuffle, bg: "bg-[#8b5cf6]" },
  { id: "charades" as QuestionType, icon: Smartphone, bg: "bg-[#f97316]" },
];

export default function TopicPicker({ onSelect, selectedIds, onQuizMetaLoad, onGameTypeChange }: TopicPickerProps) {
  const { t, lang } = useTranslation();
  const [activeGameType, setActiveGameType] = useState<GameTypeOption | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [allQuizzes, setAllQuizzes] = useState<QuizMeta[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/quizzes?lang=${lang}`)
      .then((res) => res.json())
      .then((data: QuizMeta[]) => { setAllQuizzes(data); onQuizMetaLoad?.(data); })
      .catch(() => {})
      .finally(() => setInitialLoaded(true));
  }, [lang]);

  const handleToggleQuiz = (quizId: string) => {
    const next = selectedIds.includes(quizId)
      ? selectedIds.filter((id) => id !== quizId)
      : [...selectedIds, quizId];
    onSelect(next);
  };

  // === Level 3: Quizzes inside a category ===
  if (activeGameType && activeTopic) {
    const topicQuizzes = allQuizzes.filter((q) => activeTopic.quizIds.includes(q.id));
    const Icon = activeTopic.icon;
    return (
      <div className="animate-fade-in-up">
        <button
          onClick={() => setActiveTopic(null)}
          className="mb-4 flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav.back")}
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTopic.bg}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {t(activeTopic.labelKey as never)}
          </h2>
        </div>

        {!initialLoaded ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 animate-pulse">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-white/10" />
                  <div className="h-3 w-1/3 rounded bg-white/8" />
                </div>
              </div>
            ))}
          </div>
        ) : topicQuizzes.length === 0 ? (
          <p className="py-8 text-center text-sm font-bold text-white/40">
            {t("quizPicker.noQuizzes")}
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-2.5 stagger-children [&>button]:w-full sm:[&>button]:w-[calc(50%-0.3125rem)]">
            {topicQuizzes.map((quiz) => {
              const isSelected = selectedIds.includes(quiz.id);
              const theme = getQuizTheme(quiz.id);
              const SubIcon = theme.icon;
              return (
                <button
                  key={quiz.id}
                  onClick={() => handleToggleQuiz(quiz.id)}
                  className={`answer-btn relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                    isSelected
                      ? "bg-white/20 outline outline-2 outline-white"
                      : "glass hover:bg-white/12"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.bg}`}>
                    <SubIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold leading-tight text-white truncate">{quiz.title}</h3>
                    <p className="text-[11px] font-bold text-white/40">
                      {quiz.questionCount} {t("quizPicker.q")}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
                      <Check className="h-3.5 w-3.5 text-[#e8590c]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // === Level 2: Categories inside a game type ===
  if (activeGameType) {
    const GtIcon = activeGameType.icon;
    const gtKey = activeGameType.id === "mixed" ? "gameTypes.mixed" : `gameTypes.${activeGameType.id}`;
    return (
      <div className="animate-fade-in-up">
        <button
          onClick={() => { setActiveGameType(null); onGameTypeChange?.(null); }}
          className="mb-4 flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav.back")}
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeGameType.bg}`}>
            <GtIcon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {t(gtKey as never)}
          </h2>
        </div>

        <div className="max-h-[60svh] overflow-y-auto sm:max-h-none flex flex-wrap justify-center gap-3 sm:gap-4 stagger-children p-1 [&>button]:w-[calc(50%-0.375rem)] sm:[&>button]:w-[calc(25%-0.75rem)]">
          {TOPICS.map((topic) => {
            const Icon = topic.icon;
            const topicIds = topic.quizIds;
            const selectedCount = topicIds.filter((id) => selectedIds.includes(id)).length;
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic)}
                className={`answer-btn relative flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center transition-all ${
                  selectedCount > 0
                    ? "bg-white/20 outline outline-2 outline-white"
                    : "glass hover:bg-white/12"
                }`}
              >
                {selectedCount > 0 && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                    <span className="text-[10px] font-extrabold text-[#e8590c]">{selectedCount}</span>
                  </div>
                )}
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${topic.bg}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-extrabold text-white/80">
                  {t(topic.labelKey as never)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#e8590c] to-transparent sm:hidden" />
      </div>
    );
  }

  // === Level 1: Game type grid ===
  return (
    <div className="relative">
      <div className="flex flex-wrap justify-center gap-3 stagger-children [&>button]:w-[calc(50%-0.375rem)] sm:[&>button]:w-[calc(33.333%-0.5rem)]">
        {GAME_TYPES.map((gt) => {
          const Icon = gt.icon;
          const nameKey = gt.id === "mixed" ? "gameTypes.mixed" : `gameTypes.${gt.id}`;
          const descKey = gt.id === "mixed" ? "gameTypes.mixed.desc" : `gameTypes.${gt.id}.desc`;
          return (
            <button
              key={gt.id}
              onClick={() => { setActiveGameType(gt); onGameTypeChange?.(gt.id); }}
              className="answer-btn flex flex-col items-center gap-2 rounded-2xl px-4 py-6 text-center glass hover:bg-white/12 transition-all"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${gt.bg}`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <span className="text-sm font-extrabold text-white">
                {t(nameKey as never)}
              </span>
              <span className="text-[11px] font-bold text-white/70">
                {t(descKey as never)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
