"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Heart, Swords, Home as HomeIcon, Users, PenLine, Plus, LogIn } from "lucide-react";
import TopicPicker from "@/components/TopicPicker";
import GameSettings from "@/components/GameSettings";
import type { QuizMeta } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type GameMode = "classic" | "survival";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<GameMode>("classic");
  const [showSolo, setShowSolo] = useState(false);
  const [timer, setTimer] = useState(20);
  const [questionCount, setQuestionCount] = useState(0); // 0 = all
  const [quizMeta, setQuizMeta] = useState<QuizMeta[]>([]);

  const handleQuizMetaLoad = useCallback((data: QuizMeta[]) => setQuizMeta(data), []);

  const totalQuestions = useMemo(
    () => quizMeta.filter((q) => selectedIds.includes(q.id)).reduce((sum, q) => sum + q.questionCount, 0),
    [quizMeta, selectedIds]
  );

  const handleStart = () => {
    if (selectedIds.length === 0) return;

    const params = new URLSearchParams();
    if (questionCount > 0) params.set("count", String(questionCount));

    if (mode === "survival") {
      params.set("ids", selectedIds.join(","));
      if (timer !== 15) params.set("timer", String(timer));
      router.push(`/survival?${params.toString()}`);
      return;
    }

    // Classic — no timer by default for solo classic
    // (timer param is only used if explicitly set; 0 means no timer)
    if (selectedIds.length === 1) {
      const qs = params.toString();
      router.push(`/quiz/${selectedIds[0]}${qs ? `?${qs}` : ""}`);
    } else {
      params.set("ids", selectedIds.join(","));
      router.push(`/quiz/mix?${params.toString()}`);
    }
  };

  const settingsBlock = (
    <GameSettings
      timer={timer}
      questionCount={questionCount}
      onTimerChange={setTimer}
      onCountChange={setQuestionCount}
      showTimer={mode === "survival"}
      totalQuestions={totalQuestions}
    />
  );

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#46178f] bg-pattern">
      <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-8 sm:justify-start sm:px-8">
        {/* Logo + Desktop Nav */}
        <div className="mb-10 flex flex-col items-center gap-4 animate-fade-in-up">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            Quiz<span className="text-yellow-300">mo</span>
          </h1>
          <nav className="hidden sm:flex items-center gap-1">
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

        {/* === MOBILE: Action buttons (shown first, before topic picker) === */}
        {!showSolo && (
          <div className="flex flex-col gap-3 sm:hidden animate-fade-in-up">
            <Link
              href="/play?create=1"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-5 text-lg font-extrabold text-[#46178f] transition-transform active:scale-[0.98]"
            >
              <Plus className="h-6 w-6" />
              {t("home.createGame")}
            </Link>

            <Link
              href="/play?join=1"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-white/30 bg-white/10 px-6 py-5 text-lg font-extrabold text-white transition-transform active:scale-[0.98]"
            >
              <LogIn className="h-6 w-6" />
              {t("home.joinGame")}
            </Link>

            <button
              onClick={() => setShowSolo(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white/50 transition-colors active:text-white/80"
            >
              <Swords className="h-4 w-4" />
              {t("home.practiceAlone")}
            </button>
          </div>
        )}

        {/* === MOBILE: Solo picker (shown after tapping "Practice alone") === */}
        {showSolo && (
          <div className="sm:hidden animate-fade-in-up">
            <TopicPicker onSelect={setSelectedIds} selectedIds={selectedIds} onQuizMetaLoad={handleQuizMetaLoad} />

            {selectedIds.length > 0 && (
              <div className="mt-6 flex flex-col gap-3 animate-slide-up">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode("classic")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-bold transition-all ${
                      mode === "classic"
                        ? "border-white bg-white/20 text-white"
                        : "border-white/20 bg-white/5 text-white/50"
                    }`}
                  >
                    <Swords className="h-5 w-5" />
                    {t("home.classic")}
                  </button>
                  <button
                    onClick={() => setMode("survival")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-bold transition-all ${
                      mode === "survival"
                        ? "border-red-400 bg-red-500/20 text-white"
                        : "border-white/20 bg-white/5 text-white/50"
                    }`}
                  >
                    <Heart className="h-5 w-5" />
                    {t("home.survival")}
                  </button>
                </div>
                {settingsBlock}
                <button
                  onClick={handleStart}
                  className="btn-primary flex w-full items-center justify-center gap-2"
                >
                  <Play className="h-5 w-5" fill="currentColor" />
                  {t("home.start")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* === DESKTOP: Topic picker always visible === */}
        <div className="hidden sm:block">
          <TopicPicker onSelect={setSelectedIds} selectedIds={selectedIds} onQuizMetaLoad={handleQuizMetaLoad} />

          {selectedIds.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 animate-slide-up">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("classic")}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-bold transition-all ${
                    mode === "classic"
                      ? "border-white bg-white/20 text-white"
                      : "border-white/20 bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  <Swords className="h-5 w-5" />
                  {t("home.classic")}
                </button>
                <button
                  onClick={() => setMode("survival")}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-bold transition-all ${
                    mode === "survival"
                      ? "border-red-400 bg-red-500/20 text-white"
                      : "border-white/20 bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  <Heart className="h-5 w-5" />
                  {t("home.survival")}
                </button>
              </div>
              {settingsBlock}
              <button
                onClick={handleStart}
                className="btn-primary flex w-full items-center justify-center gap-2"
              >
                <Play className="h-5 w-5" fill="currentColor" />
                Start
              </button>
            </div>
          )}
        </div>

      </main>

    </div>
  );
}
