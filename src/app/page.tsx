"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Play, Plus, LogIn, ArrowLeft, User, Ruler, Palette, Heart,
  HelpCircle, ToggleLeft, ZoomOut, Calendar, Keyboard, Shuffle, Smartphone,
} from "lucide-react";
import Logo from "@/components/Logo";
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
  const [mode, setMode] = useState<"menu" | "create">(actionFromUrl === "create" ? "create" : "menu");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  /**
   * Default solo length.
   *
   * Was 0, meaning "All" — which was fine when you picked a single 15-question
   * quiz. Now that picking a topic plays the whole topic, "All" means up to 105
   * questions, so the same default became a forty-minute game you did not ask
   * for. Ten is a quick game; "All" is one tap away above the topics.
   */
  const [questionCount, setQuestionCount] = useState(10);
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

  const handleStart = (ids: string[] = selectedIds) => {
    if (ids.length === 0) return;
    const selectedIdsArg = ids;
    const params = new URLSearchParams();
    if (questionCount > 0) params.set("count", String(questionCount));
    if (gameType === "charades") { router.push(`/charades?ids=${selectedIdsArg.join(",")}`); return; }
    if (gameType && gameType !== "standard") params.set("gameType", gameType);
    if (selectedIdsArg.length === 1) {
      const qs = params.toString();
      router.push(`/quiz/${selectedIdsArg[0]}${qs ? `?${qs}` : ""}`);
    } else {
      params.set("ids", selectedIdsArg.join(","));
      router.push(`/quiz/mix?${params.toString()}`);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">

      {mode === "menu" && (
        <div className="rise flex flex-1 flex-col items-center justify-center px-5 py-8">
          {/* Wordmark, alone. Oversized on purpose — this is the one moment the
              app gets to be a poster before it becomes a utility.

              The "Live quiz night" badge and the tagline below it were both cut:
              the three cards under this say what the app does more plainly than
              a sentence about it did. */}
          <h1 className="logo-glow text-6xl leading-[0.85] sm:text-[7rem] lg:text-[8.5rem]">
            <Logo />
          </h1>

          {/* Three doors, each its own colour so the choice reads instantly
              from across a room.
              "Create game" used to lead to a screen asking solo-or-friends —
              a question the cards themselves can answer, so it is asked here
              and that screen is gone. */}
          <div className="mt-11 grid w-full max-w-3xl grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-4">
            <button
              onClick={() => router.push("/play?create=1")}
              style={{ ["--bloom" as string]: "rgba(255,144,98,0.45)" }}
              className="surface surface-hover group flex items-center gap-5 p-6 text-left sm:flex-col sm:items-start sm:gap-5 sm:p-7"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dim shadow-[0_10px_30px_-8px_rgba(232,89,12,0.75)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 sm:h-16 sm:w-16">
                <Plus className="h-7 w-7 text-background sm:h-8 sm:w-8" strokeWidth={2.75} />
              </div>
              <div className="min-w-0">
                <p className="font-headline text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  Host a game
                </p>
                <p className="mt-1 text-sm leading-snug text-white/55">
                  Big screen, everyone joins by code
                </p>
              </div>
              <Play className="ml-auto h-5 w-5 shrink-0 text-white/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary sm:hidden" />
            </button>

            <button
              onClick={() => setMode("create")}
              style={{ ["--bloom" as string]: "rgba(102,187,106,0.4)" }}
              className="surface surface-hover group flex items-center gap-5 p-6 text-left sm:flex-col sm:items-start sm:gap-5 sm:p-7"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-answer-green-lit to-answer-green shadow-[0_10px_30px_-8px_rgba(102,187,106,0.6)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 sm:h-16 sm:w-16">
                <User className="h-7 w-7 text-background sm:h-8 sm:w-8" strokeWidth={2.75} />
              </div>
              <div className="min-w-0">
                <p className="font-headline text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  Play solo
                </p>
                <p className="mt-1 text-sm leading-snug text-white/55">
                  Just you and a topic, right now
                </p>
              </div>
              <Play className="ml-auto h-5 w-5 shrink-0 text-white/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-answer-green sm:hidden" />
            </button>

            <button
              onClick={() => router.push("/play?join=1")}
              style={{ ["--bloom" as string]: "rgba(67,165,252,0.45)" }}
              className="surface surface-hover group flex items-center gap-5 p-6 text-left sm:flex-col sm:items-start sm:gap-5 sm:p-7"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-lit to-secondary shadow-[0_10px_30px_-8px_rgba(67,165,252,0.7)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 sm:h-16 sm:w-16">
                <LogIn className="h-7 w-7 text-background sm:h-8 sm:w-8" strokeWidth={2.75} />
              </div>
              <div className="min-w-0">
                <p className="font-headline text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  {t("home.joinGame")}
                </p>
                <p className="mt-1 text-sm leading-snug text-white/55">
                  Got a four-letter code?
                </p>
              </div>
              <Play className="ml-auto h-5 w-5 shrink-0 text-white/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-secondary sm:hidden" />
            </button>
          </div>

          {/* Solo games, playable in one click — no setup at all. Their own row
              rather than buried in a mode list.
              Survival was fully built (3 lives, speeding timer, its own i18n
              strings and even a BottomNav hide-rule) and **nothing linked to
              it** — an entire working game unreachable from the app. */}
          <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:mt-9 sm:grid-cols-3">
            <Link
              href="/scale"
              style={{ ["--bloom" as string]: "rgba(102,187,106,0.4)" }}
              className="surface surface-hover group flex items-center gap-3.5 p-4 sm:p-5"
            >
              <Ruler className="h-5 w-5 shrink-0 text-answer-green transition-transform duration-300 group-hover:scale-110" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white">Scale</p>
                <p className="truncate text-xs text-white/45">How big is it, really?</p>
              </div>
            </Link>
            <Link
              href="/survival"
              style={{ ["--bloom" as string]: "rgba(255,113,108,0.4)" }}
              className="surface surface-hover group flex items-center gap-3.5 p-4 sm:p-5"
            >
              <Heart className="h-5 w-5 shrink-0 text-error transition-transform duration-300 group-hover:scale-110" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white">Survival</p>
                <p className="truncate text-xs text-white/45">Three lives, rising speed</p>
              </div>
            </Link>

            <Link
              href="/tint"
              style={{ ["--bloom" as string]: "rgba(231,127,255,0.4)" }}
              className="surface surface-hover group flex items-center gap-3.5 p-4 sm:p-5"
            >
              <Palette className="h-5 w-5 shrink-0 text-tertiary transition-transform duration-300 group-hover:scale-110" />
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
                    // Straight into solo with the type applied. This used to
                    // set the type and then go to a screen whose "with friends"
                    // branch pushed to /play without it — so the choice you
                    // just made was thrown away.
                    onClick={() => { setGameType(m.type); setMode("create"); }}
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

      {mode === "create" && (
        <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 pt-14 pb-8 sm:px-8 sm:pt-8 animate-fade-in-up">
          {/* Back goes to the home cards now that there is no screen in
              between. Always shown: the picker has its own internal back for
              topic → quiz, but leaving the flow entirely needs a way out. */}
          <button
            onClick={() => { setMode("menu"); setSelectedIds([]); setGameType(null); }}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {/* How long, chosen *before* the topic rather than after.
              Picking a topic is the action that starts the game, so anything
              you might want to set has to be reachable beforehand — otherwise
              the length choice becomes another screen. */}
          <div className="mb-5 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
              Length
            </span>
            {[
              { n: 5, label: "5" },
              { n: 10, label: "10" },
              { n: 0, label: "All" },
            ].map(({ n, label }) => (
              <button
                key={label}
                type="button"
                aria-pressed={questionCount === n}
                onClick={() => setQuestionCount(n)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  questionCount === n
                    ? "bg-primary text-background"
                    : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/85"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <TopicPicker
            onSelect={setSelectedIds}
            selectedIds={selectedIds}
            onQuizMetaLoad={handleQuizMetaLoad}
            onGameTypeChange={setGameType}
            onCommit={handleStart}
          />

          {/* Still shown when quizzes were cherry-picked from inside a topic,
              which is the one path that doesn't start on selection. */}
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
                onClick={() => handleStart()}
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
