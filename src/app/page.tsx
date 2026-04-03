"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play, Plus, LogIn, ArrowLeft, Users, User,
  HelpCircle, ToggleLeft, ZoomOut, Calendar, Keyboard, Shuffle, Smartphone,
} from "lucide-react";
import TopicPicker, { type SelectedGameType } from "@/components/TopicPicker";
import GameSettings from "@/components/GameSettings";
import type { QuizMeta } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const GAME_MODES = [
  { icon: HelpCircle, name: "Classic", color: "bg-[#43a5fc]/15 border-[#43a5fc]/20 text-[#43a5fc]" },
  { icon: ToggleLeft, name: "True/False", color: "bg-[#e77fff]/15 border-[#e77fff]/20 text-[#e77fff]" },
  { icon: ZoomOut, name: "Zoom Out", color: "bg-[#ff9062]/15 border-[#ff9062]/20 text-[#ff9062]" },
  { icon: Keyboard, name: "Rapid Fire", color: "bg-[#ff716c]/15 border-[#ff716c]/20 text-[#ff716c]" },
  { icon: Calendar, name: "Year Guesser", color: "bg-[#66bb6a]/15 border-[#66bb6a]/20 text-[#66bb6a]" },
  { icon: Shuffle, name: "Mixed Mode", color: "bg-[#e77fff]/15 border-[#e77fff]/20 text-[#e77fff]" },
  { icon: Smartphone, name: "Charades", color: "bg-[#43a5fc]/15 border-[#43a5fc]/20 text-[#43a5fc]" },
];

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const actionFromUrl = searchParams.get("action");
  const [mode, setMode] = useState<"menu" | "choose" | "create">(actionFromUrl === "create" ? "choose" : "menu");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [quizMeta, setQuizMeta] = useState<QuizMeta[]>([]);
  const [gameType, setGameType] = useState<SelectedGameType | null>(null);

  const handleQuizMetaLoad = useCallback((data: QuizMeta[]) => setQuizMeta(data), []);

  const totalQuestions = useMemo(() => {
    const selected = quizMeta.filter((q) => selectedIds.includes(q.id));
    return selected.reduce((sum, q) => {
      if (gameType === "year-guesser") return sum + (q.yearCount ?? 0);
      if (gameType === "zoom-out") return sum + (q.imageCount ?? 0);
      if (gameType === "fastest-finger") return sum + (q.shortAnswerCount ?? 0);
      return sum + q.questionCount;
    }, 0);
  }, [quizMeta, selectedIds, gameType]);

  const handleStart = () => {
    if (selectedIds.length === 0) return;
    const params = new URLSearchParams();
    if (questionCount > 0) params.set("count", String(questionCount));
    if (gameType === "charades") { router.push(`/charades?ids=${selectedIds.join(",")}`); return; }
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
    <div className="relative flex min-h-svh flex-col overflow-hidden">

      {mode === "menu" && (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 animate-fade-in-up">
          {/* Logo */}
          <div className="mb-3 flex flex-col items-center">
            <h1 className="font-[var(--font-headline)] text-6xl font-extrabold tracking-tighter text-white sm:text-8xl lg:text-[8rem] logo-stroke">
              Quizmo
            </h1>
            <p className="mt-2 text-center text-sm font-medium text-white/40 sm:text-base lg:text-lg">
              Step into the high-energy arena. Play, create, and conquer.
            </p>
          </div>

          {/* Action cards */}
          <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 sm:mt-12">
            <button
              onClick={() => setMode("choose")}
              className="group flex flex-col items-center gap-5 rounded-2xl bg-white/4 p-8 text-center backdrop-blur-2xl border-[1.5px] border-white/8 transition-all duration-300 hover:bg-white/8 hover:border-white/8 active:scale-[0.98] sm:p-10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff9062]/15 transition-all group-hover:bg-[#ff9062]/25 sm:h-16 sm:w-16">
                <Plus className="h-7 w-7 text-[#ff9062] sm:h-8 sm:w-8" />
              </div>
              <div>
                <p className="font-[var(--font-headline)] text-xl font-extrabold text-white sm:text-2xl">{t("home.createGame")}</p>
                <p className="mt-1 text-sm text-white/40">Design your own logic & challenges</p>
              </div>
            </button>
            <button
              onClick={() => router.push("/play?join=1")}
              className="group flex flex-col items-center gap-5 rounded-2xl bg-white/4 p-8 text-center backdrop-blur-2xl border-[1.5px] border-white/8 transition-all duration-300 hover:bg-white/8 hover:border-white/8 active:scale-[0.98] sm:p-10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#43a5fc]/15 transition-all group-hover:bg-[#43a5fc]/25 sm:h-16 sm:w-16">
                <LogIn className="h-7 w-7 text-[#43a5fc] sm:h-8 sm:w-8" />
              </div>
              <div>
                <p className="font-[var(--font-headline)] text-xl font-extrabold text-white sm:text-2xl">{t("home.joinGame")}</p>
                <p className="mt-1 text-sm text-white/40">Enter code to join the party</p>
              </div>
            </button>
          </div>

          {/* Trending modes chips — hidden on mobile to avoid overlapping bottom nav */}
          <div className="mt-10 hidden flex-col items-center gap-4 sm:flex sm:mt-12">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30">
              Trending modes
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {GAME_MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.name} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold backdrop-blur-md ${m.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {mode === "choose" && (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 animate-fade-in-up">
          <h1 className="mb-8 font-[var(--font-headline)] text-2xl font-extrabold text-white sm:text-3xl">
            {t("home.createGame")}
          </h1>

          <div className="flex w-full max-w-md flex-col gap-3">
            <button
              onClick={() => setMode("create")}
              className="flex items-center gap-4 rounded-2xl bg-white/4 px-5 py-5 text-left backdrop-blur-2xl border-[1.5px] border-white/8 transition-all duration-300 hover:bg-white/8 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ff9062]/15">
                <User className="h-6 w-6 text-[#ff9062]" />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">{t("home.playSolo")}</p>
                <p className="text-xs text-white/40">{t("home.playSoloDesc")}</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/play?create=1")}
              className="flex items-center gap-4 rounded-2xl bg-white/4 px-5 py-5 text-left backdrop-blur-2xl border-[1.5px] border-white/8 transition-all duration-300 hover:bg-white/8 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#43a5fc]/15">
                <Users className="h-6 w-6 text-[#43a5fc]" />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">{t("home.playWithFriends")}</p>
                <p className="text-xs text-white/40">{t("home.playWithFriendsDesc")}</p>
              </div>
            </button>
          </div>

          <button
            onClick={() => setMode("menu")}
            className="mt-6 flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("nav.home")}
          </button>
        </div>
      )}

      {mode === "create" && (
        <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 pt-14 pb-8 sm:px-8 sm:pt-8 animate-fade-in-up">
          {!gameType && (
            <button
              onClick={() => { setMode("choose"); setSelectedIds([]); setGameType(null); }}
              className="mb-6 flex items-center gap-2 text-sm font-bold text-white/40 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          <TopicPicker onSelect={setSelectedIds} selectedIds={selectedIds} onQuizMetaLoad={handleQuizMetaLoad} onGameTypeChange={setGameType} />

          {selectedIds.length > 0 && (
            <div className="mt-8 flex flex-col gap-4 animate-slide-up">
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
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
