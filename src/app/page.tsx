"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Play, Plus, LogIn, ArrowLeft, Users, User, Ruler, Palette,
  HelpCircle, ToggleLeft, ZoomOut, Calendar, Keyboard, Shuffle, Smartphone,
} from "lucide-react";
import TopicPicker, { type SelectedGameType } from "@/components/TopicPicker";
import GameSettings from "@/components/GameSettings";
import type { QuizMeta } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

/**
 * These were decoration — seven chips that looked clickable and did nothing
 * (flagged in the backlog as "wire them up or remove them"). Each one now
 * carries the game type it names and drops you straight into the picker with
 * that mode chosen, which is the fastest route into a game on the whole page.
 */
const GAME_MODES: { icon: typeof HelpCircle; name: string; type: SelectedGameType; accent: string }[] = [
  { icon: HelpCircle, name: "Classic", type: "standard", accent: "#43a5fc" },
  { icon: ToggleLeft, name: "True/False", type: "true-false", accent: "#e77fff" },
  { icon: ZoomOut, name: "Zoom Out", type: "zoom-out", accent: "#ff9062" },
  { icon: Keyboard, name: "Rapid Fire", type: "fastest-finger", accent: "#ff716c" },
  { icon: Calendar, name: "Year Guesser", type: "year-guesser", accent: "#66bb6a" },
  { icon: Shuffle, name: "Mixed Mode", type: "mixed", accent: "#e77fff" },
  { icon: Smartphone, name: "Charades", type: "charades", accent: "#43a5fc" },
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
        <div className="rise flex flex-1 flex-col items-center justify-center px-5 py-8">
          {/* Wordmark. Oversized on purpose — this is the one moment the app
              gets to be a poster before it becomes a utility. */}
          <div className="flex flex-col items-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/55 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff9062] opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ff9062]" />
              </span>
              Live quiz night
            </span>
            <h1 className="neon font-headline text-6xl font-extrabold leading-[0.85] tracking-tighter sm:text-[7rem] lg:text-[8.5rem]">
              Quizmo
            </h1>
            <p className="mt-4 max-w-md text-center text-sm font-medium leading-relaxed text-white/55 sm:text-base">
              Put the questions on the big screen.
              <br className="hidden sm:block" />
              {" "}Everyone else plays from their phone.
            </p>
          </div>

          {/* Two doors. Each blooms in its own colour so the choice reads
              instantly from across a room. */}
          <div className="mt-9 grid w-full max-w-3xl grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
            <button
              onClick={() => setMode("choose")}
              style={{ ["--bloom" as string]: "rgba(255,144,98,0.45)" }}
              className="surface surface-hover group flex items-center gap-5 p-6 text-left sm:flex-col sm:items-start sm:gap-5 sm:p-7"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff9062] to-[#e8590c] shadow-[0_10px_30px_-8px_rgba(232,89,12,0.75)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 sm:h-16 sm:w-16">
                <Plus className="h-7 w-7 text-[#0e0e0e] sm:h-8 sm:w-8" strokeWidth={2.75} />
              </div>
              <div className="min-w-0">
                <p className="font-headline text-2xl font-extrabold tracking-tight text-white sm:text-[1.75rem]">
                  {t("home.createGame")}
                </p>
                <p className="mt-1 text-sm leading-snug text-white/55">
                  Pick a topic, set the pace, share the code
                </p>
              </div>
              <Play className="ml-auto h-5 w-5 shrink-0 text-white/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#ff9062] sm:hidden" />
            </button>

            <button
              onClick={() => router.push("/play?join=1")}
              style={{ ["--bloom" as string]: "rgba(67,165,252,0.45)" }}
              className="surface surface-hover group flex items-center gap-5 p-6 text-left sm:flex-col sm:items-start sm:gap-5 sm:p-7"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7cc0ff] to-[#43a5fc] shadow-[0_10px_30px_-8px_rgba(67,165,252,0.7)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 sm:h-16 sm:w-16">
                <LogIn className="h-7 w-7 text-[#0e0e0e] sm:h-8 sm:w-8" strokeWidth={2.75} />
              </div>
              <div className="min-w-0">
                <p className="font-headline text-2xl font-extrabold tracking-tight text-white sm:text-[1.75rem]">
                  {t("home.joinGame")}
                </p>
                <p className="mt-1 text-sm leading-snug text-white/55">
                  Got a four-letter code? You&apos;re thirty seconds away
                </p>
              </div>
              <Play className="ml-auto h-5 w-5 shrink-0 text-white/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#43a5fc] sm:hidden" />
            </button>
          </div>

          {/* Solo mini-games. Different shape of play from the quiz, so they
              get their own row rather than being buried in the mode list. */}
          <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:mt-9">
            <Link
              href="/scale"
              style={{ ["--bloom" as string]: "rgba(102,187,106,0.4)" }}
              className="surface surface-hover group flex items-center gap-3.5 p-4 sm:p-5"
            >
              <Ruler className="h-5 w-5 shrink-0 text-[#66bb6a] transition-transform duration-300 group-hover:scale-110" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white">Scale</p>
                <p className="truncate text-xs text-white/45">How big is it, really?</p>
              </div>
            </Link>
            <Link
              href="/tint"
              style={{ ["--bloom" as string]: "rgba(231,127,255,0.4)" }}
              className="surface surface-hover group flex items-center gap-3.5 p-4 sm:p-5"
            >
              <Palette className="h-5 w-5 shrink-0 text-[#e77fff] transition-transform duration-300 group-hover:scale-110" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white">Tint</p>
                <p className="truncate text-xs text-white/45">Restore the real colours</p>
              </div>
            </Link>
          </div>

          {/* Jump straight into a mode. Hidden on mobile so it can't collide
              with the bottom nav. */}
          <div className="mt-9 hidden w-full max-w-3xl flex-col items-center gap-4 sm:flex sm:mt-10">
            <div className="flex w-full items-center gap-4">
              <div className="rule-fade flex-1" />
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">
                Jump into a mode
              </p>
              <div className="rule-fade flex-1" />
            </div>
            <div className="flex flex-wrap justify-center gap-2.5">
              {GAME_MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => { setGameType(m.type); setMode("choose"); }}
                    style={{ ["--chip" as string]: m.accent }}
                    className="chip flex min-h-[38px] items-center gap-2 rounded-full px-4 py-2 text-xs font-bold backdrop-blur-md"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {mode === "choose" && (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 animate-fade-in-up">
          <h1 className="mb-8 font-headline text-2xl font-extrabold text-white sm:text-3xl">
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
