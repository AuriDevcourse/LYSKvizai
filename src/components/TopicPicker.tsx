"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Check, Shuffle, ToggleLeft, Calendar, Keyboard, HelpCircle, ZoomOut, Smartphone, Sparkles, FolderPlus } from "lucide-react";
import { TOPICS, topicHasQuiz, quizIdsForTopic, unlistedQuizIds, type Topic } from "@/lib/topics";
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
  { id: "standard", icon: HelpCircle, color: "bg-secondary/15 text-secondary", desc: "Four options, one winner" },
  { id: "true-false", icon: ToggleLeft, color: "bg-tertiary/15 text-tertiary", desc: "Binary decision challenge" },
  { id: "zoom-out", icon: ZoomOut, color: "bg-primary/15 text-primary", desc: "Identify the hidden image" },
  { id: "year-guesser", icon: Calendar, color: "bg-answer-green/15 text-answer-green", desc: "Place events on a timeline" },
  { id: "fastest-finger", icon: Keyboard, color: "bg-error/15 text-error", desc: "Speed is everything" },
  { id: "mixed", icon: Shuffle, color: "bg-tertiary/15 text-tertiary", desc: "A chaotic variety of all types" },
  { id: "charades" as QuestionType, icon: Smartphone, color: "bg-secondary/15 text-secondary", desc: "Act it out, guess it right" },
];

/**
 * Whether a quiz has enough eligible questions for a given game type.
 *
 * Pulled out of the component and parameterised so the chip row can ask the
 * same question of every type — a chip that leads to an empty topic grid is
 * worse than no chip.
 */
function eligibleFor(q: QuizMeta, mode: string | undefined): boolean {
  if (!mode || mode === "standard" || mode === "true-false" || mode === "mixed") return true;
  if (mode === "charades") return true;
  if (mode === "zoom-out") return (q.imageCount ?? 0) > 0;
  if (mode === "year-guesser") return (q.yearCount ?? 0) > 0;
  if (mode === "fastest-finger") return (q.shortAnswerCount ?? 0) >= 3;
  return true;
}

export default function TopicPicker({ onSelect, selectedIds, onQuizMetaLoad, onGameTypeChange }: TopicPickerProps) {
  const { t, lang } = useTranslation();
  /**
   * The game type, defaulting to Classic rather than being asked for.
   *
   * This used to start `null`, which made "Choose Game Type" a mandatory first
   * screen for every single player. The content does not justify it: Classic
   * and Mixed cover all 54 quizzes, Zoom Out and Year Guesser cover 6 each, and
   * True/False and Fastest Finger have **one playable quiz each**. So 100% of
   * users paid a screen to serve options that almost no content supports.
   *
   * Now you land on the topics and the specialised types are a chip row —
   * still one tap away, no longer a toll gate.
   */
  const [activeGameType, setActiveGameType] = useState<GameTypeOption>(
    () => GAME_TYPES.find((g) => g.id === "standard") ?? GAME_TYPES[0]
  );
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



  const isQuizEligible = (q: QuizMeta): boolean => eligibleFor(q, activeGameType.id as string);

  /**
   * The topics actually offered: the hand-maintained list, plus one synthetic
   * catch-all for quizzes nothing claims.
   *
   * Without this, a quiz created in the editor had an id no topic listed and
   * so could never be selected for a game — you could build it and then never
   * find it. Same for everything the news cron generated.
   */
  const allIds = useMemo(() => allQuizzes.map((q) => q.id), [allQuizzes]);
  const topics: Topic[] = useMemo(() => {
    const unlisted = unlistedQuizIds(allIds);
    if (unlisted.length === 0) return TOPICS;
    return [
      ...TOPICS,
      {
        id: "__unlisted",
        labelKey: "topics.more",
        icon: FolderPlus,
        bg: "bg-[#64748b]",
        quizIds: unlisted,
      },
    ];
  }, [allIds]);

  // === Level 3: Quizzes inside a category ===
  if (activeGameType && activeTopic) {
    const topicQuizzes = allQuizzes
      .filter((q) => topicHasQuiz(activeTopic, q.id))
      .filter(isQuizEligible);
    const Icon = activeTopic.icon;
    return (
      <div className="animate-fade-in-up">
        <button
          onClick={() => setActiveTopic(null)}
          className="mb-4 flex items-center gap-2 text-sm font-bold text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav.back")}
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTopic.bg}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-white">
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
          <p className="py-8 text-center text-sm font-bold text-white/45">
            {t("quizPicker.noQuizzes")}
          </p>
        ) : (
          <div className="flex flex-col gap-3 stagger-children">
            {topicQuizzes.map((quiz) => {
              const isSelected = selectedIds.includes(quiz.id);
              const theme = getQuizTheme(quiz);
              const SubIcon = theme.icon;
              return (
                <button
                  key={quiz.id}
                  onClick={() => handleToggleQuiz(quiz.id)}
                  className={`group relative flex items-center gap-4 rounded-xl px-5 py-4 text-left transition-all duration-300 ${
                    isSelected
                      ? "bg-primary-dim/12 border-[1.5px] border-primary/40"
                      : "bg-white/4 border-[1.5px] border-white/5 hover:bg-white/8 hover:border-white/10"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.bg}`}>
                    <SubIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`text-sm font-extrabold leading-tight truncate ${isSelected ? "text-primary" : "text-white group-hover:text-primary"} transition-colors`}>{quiz.title}</h3>
                      {isRecentlyAdded(quiz.createdAt) && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-primary">
                          <Sparkles className="h-2.5 w-2.5" />
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/45 mt-0.5">
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
                    isSelected ? "bg-primary border-primary" : "border-white/8 bg-white/5"
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

  // === Level 1 (entry): topics, with the game type as a chip row ===
  {
    return (
      <div className="animate-fade-in-up">
        <h2 className="font-headline text-3xl font-extrabold text-white mb-1 sm:text-4xl">
          Pick a <span className="text-secondary">topic</span>
        </h2>
        <p className="text-sm text-white/45 mb-4">Classic questions unless you change the mode below.</p>

        {/* Game type as a refinement, not a gate. Only types with playable
            content appear, so the row can't offer a dead end. */}
        <div className="mb-6 flex flex-wrap gap-2">
          {GAME_TYPES.filter((gt) => {
            const id = gt.id as string;
            if (id === "standard") return true;
            // Charades has its own route and no per-quiz eligibility rule.
            if (id === "charades") return allQuizzes.length > 0;
            return allQuizzes.some((q) => eligibleFor(q, id));
          }).map((gt) => {
            const Icon = gt.icon;
            const nameKey = gt.id === "mixed" ? "gameTypes.mixed" : `gameTypes.${gt.id}`;
            const active = activeGameType.id === gt.id;
            return (
              <button
                key={gt.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setActiveGameType(gt);
                  onGameTypeChange?.(gt.id);
                  // A type change can invalidate the current selection.
                  setActiveTopic(null);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                  active
                    ? "bg-primary text-background"
                    : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/85"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(nameKey as never)}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 stagger-children">
          {topics.filter((topic) => {
            // Hide topics with zero eligible quizzes for this game type
            return quizIdsForTopic(topic, allIds).some((id) => {
              const meta = allQuizzes.find((q) => q.id === id);
              return meta && isQuizEligible(meta);
            });
          }).map((topic) => {
            const Icon = topic.icon;
            const topicIds = quizIdsForTopic(topic, allIds);
            const selectedCount = topicIds.filter((id) => selectedIds.includes(id)).length;
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic)}
                className={`group relative flex flex-col items-center gap-3 rounded-xl p-4 sm:items-start sm:p-5 text-center sm:text-left transition-all duration-300 ${
                  selectedCount > 0
                    ? "bg-primary-dim/12 border-[1.5px] border-primary/40"
                    : "bg-white/4 border-[1.5px] border-white/5 hover:bg-white/8 hover:border-white/10"
                }`}
              >
                {selectedCount > 0 && (
                  <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-black">
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
      <h2 className="font-headline text-3xl font-extrabold text-white mb-1 sm:text-4xl">
        Choose Game <span className="text-primary">Type</span>
      </h2>
      <p className="text-sm text-white/45 mb-6">Select a game mode to start building your quiz experience.</p>

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
                <p className="font-headline text-base font-extrabold text-white">
                  {t(nameKey as never)}
                </p>
                <p className="text-xs text-white/45 mt-0.5">{gt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
