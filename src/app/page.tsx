"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Play, Plus, LogIn, ArrowLeft } from "lucide-react";
import TopicPicker, { type SelectedGameType } from "@/components/TopicPicker";
import GameSettings from "@/components/GameSettings";
import type { QuizMeta } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"menu" | "create">("menu");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [quizMeta, setQuizMeta] = useState<QuizMeta[]>([]);
  const [gameType, setGameType] = useState<SelectedGameType | null>(null);

  const handleQuizMetaLoad = useCallback((data: QuizMeta[]) => setQuizMeta(data), []);

  const totalQuestions = useMemo(
    () => quizMeta.filter((q) => selectedIds.includes(q.id)).reduce((sum, q) => sum + q.questionCount, 0),
    [quizMeta, selectedIds]
  );

  const handleStart = () => {
    if (selectedIds.length === 0) return;

    const params = new URLSearchParams();
    if (questionCount > 0) params.set("count", String(questionCount));

    if (gameType === "charades") {
      router.push(`/charades?ids=${selectedIds.join(",")}`);
      return;
    }

    if (gameType && gameType !== "standard") params.set("gameType", gameType);

    if (selectedIds.length === 1) {
      const qs = params.toString();
      router.push(`/quiz/${selectedIds[0]}${qs ? `?${qs}` : ""}`);
    } else {
      params.set("ids", selectedIds.join(","));
      router.push(`/quiz/mix?${params.toString()}`);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#e8590c] bg-pattern">
      <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3 animate-fade-in-up">
          <h1 className="text-6xl font-extrabold tracking-tight text-white sm:text-8xl logo-stroke">
            Quizmo
          </h1>
          <p className="text-base font-bold text-white/60 sm:text-lg">The ultimate quiz experience</p>
        </div>

        {mode === "menu" && (
          <div className="flex flex-1 items-center justify-center animate-fade-in-up">
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <button
                onClick={() => setMode("create")}
                className="group flex flex-col items-center gap-4 rounded-3xl border-2 border-white/25 bg-white/8 px-8 py-10 text-center backdrop-blur-sm transition-transform active:scale-[0.98] sm:py-16"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 sm:h-20 sm:w-20">
                  <Plus className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-white sm:text-2xl">{t("home.createGame")}</p>
                  <p className="mt-1 text-sm font-bold text-white/50">Pick topics & play</p>
                </div>
              </button>
              <button
                onClick={() => router.push("/play?join=1")}
                className="group flex flex-col items-center gap-4 rounded-3xl border-2 border-white/25 bg-white/8 px-8 py-10 text-center backdrop-blur-sm transition-transform active:scale-[0.98] sm:py-16"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 sm:h-20 sm:w-20">
                  <LogIn className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-white sm:text-2xl">{t("home.joinGame")}</p>
                  <p className="mt-1 text-sm font-bold text-white/50">Enter a room code</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === "create" && (
          <div className="animate-fade-in-up">
            {/* Back to menu — only visible when TopicPicker is at game type level (no gameType selected) */}
            {!gameType && (
              <button
                onClick={() => { setMode("menu"); setSelectedIds([]); setGameType(null); }}
                className="mb-4 flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("nav.back")}
              </button>
            )}

            {/* Game type → Category → Quiz picker */}
            <TopicPicker onSelect={setSelectedIds} selectedIds={selectedIds} onQuizMetaLoad={handleQuizMetaLoad} onGameTypeChange={setGameType} />

            {/* Start button + settings */}
            {selectedIds.length > 0 && (
              <div className="mt-6 flex flex-col gap-3 animate-slide-up">
                <GameSettings
                  timer={0}
                  questionCount={questionCount}
                  onTimerChange={() => {}}
                  onCountChange={setQuestionCount}
                  showTimer={false}
                  totalQuestions={totalQuestions}
                />
                <button
                  onClick={handleStart}
                  className="btn-primary flex w-full items-center justify-center gap-2 text-lg py-4"
                >
                  <Play className="h-5 w-5" fill="currentColor" />
                  {t("home.start")}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
