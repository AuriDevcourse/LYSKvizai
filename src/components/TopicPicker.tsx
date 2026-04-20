"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, Shuffle, ToggleLeft, Calendar, Keyboard, HelpCircle, ZoomOut, Smartphone, Sparkles } from "lucide-react";
import { TOPICS, type Topic } from "@/lib/topics";
import type { QuizMeta } from "@/data/types";
import type { QuestionType } from "@/data/types";
import { getQuizTheme } from "@/lib/quiz-theme";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const DAY_MS = 86_400_000;
const NEW_THRESHOLD_DAYS = 14;

/** Returns a short "X days ago" / "today" string from an ISO date. */
function relativeAge(iso?: string): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / DAY_MS);
  if (days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function isRecentlyAdded(iso?: string): boolean {
  if (!iso) return false;
  const then = Date.parse(iso);
  if (isNaN(then)) return false;
  return (Date.now() - then) / DAY_MS <= NEW_THRESHOLD_DAYS;
}

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
  color: string;
  desc: string;
};

const GAME_TYPES: GameTypeOption[] = [
  { id: "standard", icon: HelpCircle, color: "bg-[#43a5fc]/15 text-[#43a5fc]", desc: "Four options, one winner" },
  { id: "true-false", icon: ToggleLeft, color: "bg-[#e77fff]/15 text-[#e77fff]", desc: "Binary decision challenge" },
  { id: "zoom-out", icon: ZoomOut, color: "bg-[#ff9062]/15 text-[#ff9062]", desc: "Identify the hidden image" },
  { id: "year-guesser", icon: Calendar, color: "bg-[#66bb6a]/15 text-[#66bb6a]", desc: "Place events on a timeline" },
  { id: "fastest-finger", icon: Keyboard, color: "bg-[#ff716c]/15 text-[#ff716c]", desc: "Speed is everything" },
  { id: "mixed", icon: Shuffle, color: "bg-[#e77fff]/15 text-[#e77fff]", desc: "A chaotic variety of all types" },
  { id: "charades" as QuestionType, icon: Smartphone, color: "bg-[#43a5fc]/15 text-[#43a5fc]", desc: "Act it out, guess it right" },
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

  /** Check if a quiz has enough eligible questions for the active game type */
  const isQuizEligible = (q: QuizMeta): boolean => {
    const mode = activeGameType?.id as string | undefined;
    if (!mode || mode === "standard" || mode === "true-false" || mode === "mixed") return true;
    if (mode === "charades") return true;
    if (mode === "zoom-out") return (q.imageCount ?? 0) > 0;
    if (mode === "year-guesser") return (q.yearCount ?? 0) > 0;
    if (mode === "fastest-finger") return (q.shortAnswerCount ?? 0) >= 3;
    return true;
  };

  // === Level 3: Quizzes inside a category ===
  if (activeGameType && activeTopic) {
    const topicQuizzes = allQuizzes
      .filter((q) => activeTopic.quizIds.includes(q.id))
      .filter(isQuizEligible);
    const Icon = activeTopic.icon;
    return (
      <div className="animate-fade-in-up">
        <button
          onClick={() => setActiveTopic(null)}
          className="mb-4 flex items-center gap-2 text-sm font-bold text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav.back")}
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTopic.bg}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h2 className="font-[var(--font-headline)] text-2xl font-extrabold text-white">
            {t(activeTopic.labelKey as never)}
          </h2>
        </div>

        {!initialLoaded ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/4 px-5 py-4 animate-pulse border border-white/5">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white/8" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-white/8" />
                  <div className="h-3 w-1/3 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : topicQuizzes.length === 0 ? (
          <p className="py-8 text-center text-sm font-bold text-white/30">
            {t("quizPicker.noQuizzes")}
          </p>
        ) : (
          <div className="flex flex-col gap-3 stagger-children">
            {topicQuizzes.map((quiz) => {
              const isSelected = selectedIds.includes(quiz.id);
              const theme = getQuizTheme(quiz.id);
              const SubIcon = theme.icon;
              return (
                <button
                  key={quiz.id}
                  onClick={() => handleToggleQuiz(quiz.id)}
                  className={`group relative flex items-center gap-4 rounded-xl px-5 py-4 text-left transition-all duration-300 ${
                    isSelected
                      ? "bg-[#e8590c]/12 border-[1.5px] border-[#ff9062]/40"
                      : "bg-white/4 border-[1.5px] border-white/5 hover:bg-white/8 hover:border-white/10"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.bg}`}>
                    <SubIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`text-sm font-extrabold leading-tight truncate ${isSelected ? "text-[#ff9062]" : "text-white group-hover:text-[#ff9062]"} transition-colors`}>{quiz.title}</h3>
                      {isRecentlyAdded(quiz.createdAt) && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#ff9062]/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#ff9062]">
                          <Sparkles className="h-2.5 w-2.5" />
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">
                      {activeGameType?.id === "year-guesser" ? (quiz.yearCount ?? 0)
                        : activeGameType?.id === "zoom-out" ? (quiz.imageCount ?? 0)
                        : activeGameType?.id === "fastest-finger" ? (quiz.shortAnswerCount ?? 0)
                        : quiz.questionCount} questions
                      {quiz.createdAt && (
                        <span className="text-white/20"> · {relativeAge(quiz.createdAt)}</span>
                      )}
                    </p>
                  </div>
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                    isSelected ? "bg-[#ff9062] border-[#ff9062]" : "border-white/8 bg-white/5"
                  }`}>
                    {isSelected && <Check className="h-3.5 w-3.5 text-black" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // === Level 2: Topics grid ===
  if (activeGameType) {
    return (
      <div className="animate-fade-in-up">
        <button
          onClick={() => { setActiveGameType(null); onGameTypeChange?.(null); }}
          className="mb-2 flex items-center gap-2 text-sm font-bold text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav.back")}
        </button>

        <h2 className="font-[var(--font-headline)] text-3xl font-extrabold text-white mb-1 sm:text-4xl">
          Select <span className="text-[#43a5fc]">Topic</span>
        </h2>
        <p className="text-sm text-white/30 mb-6">Pick a topic to start building your challenge.</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 stagger-children">
          {TOPICS.filter((topic) => {
            // Hide topics with zero eligible quizzes for this game type
            return topic.quizIds.some((id) => {
              const meta = allQuizzes.find((q) => q.id === id);
              return meta && isQuizEligible(meta);
            });
          }).map((topic) => {
            const Icon = topic.icon;
            const topicIds = topic.quizIds;
            const selectedCount = topicIds.filter((id) => selectedIds.includes(id)).length;
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic)}
                className={`group relative flex flex-col items-center gap-3 rounded-xl p-4 sm:items-start sm:p-5 text-center sm:text-left transition-all duration-300 ${
                  selectedCount > 0
                    ? "bg-[#e8590c]/12 border-[1.5px] border-[#ff9062]/40"
                    : "bg-white/4 border-[1.5px] border-white/5 hover:bg-white/8 hover:border-white/10"
                }`}
              >
                {selectedCount > 0 && (
                  <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff9062] text-[10px] font-extrabold text-black">
                    {selectedCount}
                  </div>
                )}
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${topic.bg}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">
                  {t(topic.labelKey as never)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === Level 1: Game type list ===
  return (
    <div className="animate-fade-in-up">
      <h2 className="font-[var(--font-headline)] text-3xl font-extrabold text-white mb-1 sm:text-4xl">
        Choose Game <span className="text-[#ff9062]">Type</span>
      </h2>
      <p className="text-sm text-white/30 mb-6">Select a game mode to start building your quiz experience.</p>

      <div className="flex flex-col gap-3 stagger-children">
        {GAME_TYPES.map((gt) => {
          const Icon = gt.icon;
          const nameKey = gt.id === "mixed" ? "gameTypes.mixed" : `gameTypes.${gt.id}`;
          return (
            <button
              key={gt.id}
              onClick={() => { setActiveGameType(gt); onGameTypeChange?.(gt.id); }}
              className="group flex items-center gap-4 rounded-xl bg-white/4 border-[1.5px] border-white/5 px-5 py-4 text-left transition-all duration-300 hover:bg-white/8 hover:border-white/10 active:scale-[0.98]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${gt.color.split(" ")[0]}`}>
                <Icon className={`h-5 w-5 ${gt.color.split(" ").slice(1).join(" ")}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-[var(--font-headline)] text-base font-extrabold text-white">
                  {t(nameKey as never)}
                </p>
                <p className="text-xs text-white/30 mt-0.5">{gt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
