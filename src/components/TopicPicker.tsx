"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { TOPICS, type Topic } from "@/lib/topics";
import type { QuizMeta } from "@/data/types";
import { getQuizTheme } from "@/lib/quiz-theme";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface TopicPickerProps {
  onSelect: (quizIds: string[]) => void;
  selectedIds: string[];
}

/** Lithuanian-content quiz IDs (about Lithuania specifically — hard for foreigners) */
const LT_CONTENT_IDS = new Set([
  "lietuvos-istorija", "lietuvos-izymybes", "lietuvos-sportas",
  "lietuvos-tradicijos", "kucios-ir-kaledos", "uzgavenes-klasika",
  "jonines-ir-rasas", "muzika-klasikine",
]);

function getQuizRegion(quiz: QuizMeta): "lt" | "intl" {
  if (quiz.language === "en") return "intl";
  if (LT_CONTENT_IDS.has(quiz.id) || quiz.id.startsWith("lietuvos-")) return "lt";
  return "intl";
}

/** Get quiz IDs belonging to a topic */
function getTopicQuizIds(topic: Topic): string[] {
  return topic.quizIds;
}

export default function TopicPicker({ onSelect, selectedIds }: TopicPickerProps) {
  const { t, lang } = useTranslation();
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [allQuizzes, setAllQuizzes] = useState<QuizMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Fetch all quizzes once on mount (for dynamic topic matching)
  useEffect(() => {
    fetch(`/api/quizzes?lang=${lang}`)
      .then((res) => res.json())
      .then((data: QuizMeta[]) => setAllQuizzes(data))
      .catch(() => {})
      .finally(() => setInitialLoaded(true));
  }, [lang]);

  // Get filtered quizzes for active topic
  const topicQuizzes = activeTopic
    ? allQuizzes.filter((q) => activeTopic.quizIds.includes(q.id))
    : [];

  const handleToggleQuiz = (quizId: string) => {
    const next = selectedIds.includes(quizId)
      ? selectedIds.filter((id) => id !== quizId)
      : [...selectedIds, quizId];
    onSelect(next);
  };

  // Subtopic view (inside a topic)
  if (activeTopic) {
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : topicQuizzes.length === 0 ? (
          <p className="py-8 text-center text-sm font-bold text-white/40">
            {t("quizPicker.noQuizzes")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 stagger-children">
            {topicQuizzes.map((quiz) => {
              const isSelected = selectedIds.includes(quiz.id);
              const theme = getQuizTheme(quiz.id);
              const SubIcon = theme.icon;
              const region = getQuizRegion(quiz);
              return (
                <button
                  key={quiz.id}
                  onClick={() => handleToggleQuiz(quiz.id)}
                  className={`answer-btn relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                    isSelected
                      ? "bg-white/20 ring-2 ring-white"
                      : "glass hover:bg-white/12"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.bg}`}>
                    <SubIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-extrabold leading-tight text-white truncate">{quiz.title}</h3>
                      <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-extrabold uppercase leading-none ${
                        region === "lt" ? "bg-yellow-400/20 text-yellow-300" : "bg-blue-400/20 text-blue-300"
                      }`}>
                        {region === "lt" ? "LT" : "EN"}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-white/40">
                      {quiz.questionCount} {t("quizPicker.q")}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
                      <Check className="h-3.5 w-3.5 text-[#46178f]" />
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

  // Always show all topics (dynamic ones show "no quizzes" inside if empty)

  // Topic grid view
  return (
    <div className="relative">
    <div className="max-h-[60svh] overflow-y-auto sm:max-h-none grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 stagger-children">
      {TOPICS.map((topic) => {
        const Icon = topic.icon;
        const topicIds = getTopicQuizIds(topic);
        const selectedCount = topicIds.filter((id) => selectedIds.includes(id)).length;
        return (
          <button
            key={topic.id}
            onClick={() => setActiveTopic(topic)}
            className={`answer-btn relative flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center transition-all ${
              selectedCount > 0
                ? "bg-white/20 ring-2 ring-white"
                : "glass hover:bg-white/12"
            }`}
          >
            {selectedCount > 0 && (
              <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                <span className="text-[10px] font-extrabold text-[#46178f]">{selectedCount}</span>
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
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#46178f] to-transparent sm:hidden" />
    </div>
  );
}
