"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Home as HomeIcon, Users, PenLine, Plus, LogIn } from "lucide-react";
import TopicPicker, { type SelectedGameType } from "@/components/TopicPicker";
import GameSettings from "@/components/GameSettings";
import type { QuizMeta } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
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
        {/* Logo + Nav */}
        <div className="mb-8 flex flex-col items-center gap-4 animate-fade-in-up">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            Quiz<span className="text-yellow-300">mo</span>
          </h1>
          <nav className="flex items-center gap-1">
            {[
              { href: "/", icon: HomeIcon, label: t("nav.home") },
              { href: "/play", icon: Users, label: t("nav.play") },
              { href: "/editor", icon: PenLine, label: t("nav.editor") },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/50 hover:bg-white/10 hover:text-white/80"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Multiplayer shortcuts */}
        <div className="mb-6 grid grid-cols-2 gap-3 animate-fade-in-up">
          <Link
            href="/play?create=1"
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-base font-extrabold text-[#e8590c] transition-transform active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            {t("home.createGame")}
          </Link>
          <Link
            href="/play?join=1"
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-4 py-4 text-base font-extrabold text-white transition-transform active:scale-[0.98]"
          >
            <LogIn className="h-5 w-5" />
            {t("home.joinGame")}
          </Link>
        </div>

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
      </main>
    </div>
  );
}
