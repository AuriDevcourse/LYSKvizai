"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, X, Heart, Zap } from "lucide-react";
import type { Question } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import QuizCard from "@/components/QuizCard";

const MAX_LIVES = 3;
const DEFAULT_BASE_TIMER = 15; // seconds for first questions
const MIN_TIMER = 5; // fastest timer
const TIMER_DECREASE_EVERY = 5; // decrease timer every N questions

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SurvivalPage() {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center bg-[#46178f]"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}>
      <SurvivalInner />
    </Suspense>
  );
}

function SurvivalInner() {
  const searchParams = useSearchParams();
  const { t, lang } = useTranslation();
  const baseTimer = Number(searchParams.get("timer")) || DEFAULT_BASE_TIMER;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(baseTimer);
  const [shakeLife, setShakeLife] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate timer for current question
  const getTimer = useCallback((questionNum: number) => {
    const decrease = Math.floor(questionNum / TIMER_DECREASE_EVERY);
    return Math.max(MIN_TIMER, baseTimer - decrease * 2);
  }, [baseTimer]);

  // Load questions from selected quizzes (or all if no ids param)
  useEffect(() => {
    const idsParam = searchParams.get("ids");
    const quizIds = idsParam ? idsParam.split(",").filter(Boolean) : null;

    const fetchQuizzes = quizIds
      ? Promise.all(
          quizIds.map((id) =>
            fetch(`/api/quizzes/${id}?lang=${lang}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        )
      : fetch(`/api/quizzes?lang=${lang}`)
          .then((res) => res.json())
          .then((metas: { id: string }[]) =>
            Promise.all(
              metas.map((m) =>
                fetch(`/api/quizzes/${m.id}?lang=${lang}`)
                  .then((r) => (r.ok ? r.json() : null))
                  .catch(() => null)
              )
            )
          );

    fetchQuizzes
      .then((quizzes) => {
        const all: Question[] = (quizzes as Array<{ questions: Question[] } | null>)
          .filter(Boolean)
          .flatMap((q) => q!.questions);
        setQuestions(shuffleArray(all));
        setTimeLeft(baseTimer);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lang, searchParams]);

  // Timer countdown
  useEffect(() => {
    if (loading || gameOver || selectedAnswer !== null) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — lose a life
          clearInterval(timerRef.current!);
          setSelectedAnswer(-1); // mark as timed out
          setLives((l) => {
            const next = l - 1;
            if (next <= 0) setGameOver(true);
            return next;
          });
          setStreak(0);
          setShakeLife(true);
          setTimeout(() => setShakeLife(false), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, gameOver, selectedAnswer, currentIndex]);

  const handleSelect = useCallback(
    (index: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setSelectedAnswer(index);

      const isCorrect = index === questions[currentIndex].correct;
      if (isCorrect) {
        // Points: base + streak bonus + speed bonus
        const speedBonus = Math.floor(timeLeft * 10);
        const streakBonus = streak * 50;
        setScore((s) => s + 100 + speedBonus + streakBonus);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setLives((l) => {
          const next = l - 1;
          if (next <= 0) setGameOver(true);
          return next;
        });
        setStreak(0);
        setShakeLife(true);
        setTimeout(() => setShakeLife(false), 500);
      }
    },
    [currentIndex, questions, timeLeft, streak]
  );

  const handleNext = useCallback(() => {
    if (gameOver) return;
    const nextIndex = currentIndex + 1;

    // If we've used all questions, reshuffle
    if (nextIndex >= questions.length) {
      setQuestions((prev) => shuffleArray(prev));
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIndex);
    }
    setSelectedAnswer(null);
    setTimeLeft(getTimer(nextIndex));
  }, [currentIndex, questions.length, gameOver, getTimer]);

  const handleRestart = () => {
    setQuestions((prev) => shuffleArray(prev));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setLives(MAX_LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setGameOver(false);
    setTimeLeft(baseTimer);
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#46178f]">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  const timerMax = getTimer(currentIndex);
  const timerPct = (timeLeft / timerMax) * 100;
  const timerCritical = timeLeft <= 3;

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#46178f] bg-pattern">
      <Link
        href="/"
        className="fixed right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-5 w-5" />
      </Link>

      <main className="relative z-10 flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-8 sm:px-8">
        {gameOver ? (
          <div className="flex flex-col items-center gap-6 animate-fade-in-up">
            <h2 className="text-3xl font-extrabold text-white">{t("survival.gameOver")}</h2>

            <div className="flex flex-col items-center gap-1">
              <span className="text-6xl font-extrabold text-yellow-300 animate-bounce-in">
                {score.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-white/50">{t("survival.points")}</span>
            </div>

            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-extrabold text-white">{currentIndex}</p>
                <p className="text-xs font-bold text-white/40">{t("survival.questions")}</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">{bestStreak}</p>
                <p className="text-xs font-bold text-white/40">{t("survival.bestStreak")}</p>
              </div>
            </div>

            <button onClick={handleRestart} className="btn-primary flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t("survival.playAgain")}
            </button>

            <Link
              href="/"
              className="text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
            >
              {t("quiz.home")}
            </Link>
          </div>
        ) : (
          <div className="flex w-full flex-col">
            {/* HUD: lives, score, streak, timer */}
            <div className="relative z-10 mb-4 flex items-center justify-between">
              <div className={`flex gap-1 ${shakeLife ? "animate-wiggle" : ""}`}>
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`h-6 w-6 transition-all ${
                      i < lives
                        ? "fill-red-500 text-red-500"
                        : "text-white/20"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-4">
                {streak >= 2 && (
                  <span className="text-xs font-extrabold text-orange-400 animate-bounce-in">
                    {streak}x streak
                  </span>
                )}
                <span className="text-lg font-extrabold text-white">
                  {score.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="relative z-10 mb-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  timerCritical ? "bg-red-500 timer-critical" : "bg-green-500"
                }`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
            <p className="relative z-10 mb-4 text-center text-xs font-bold text-white/30">
              Q{currentIndex + 1} · {timeLeft}s
            </p>

            {/* Question */}
            <QuizCard
              key={currentIndex}
              question={questions[currentIndex]}
              questionNumber={currentIndex + 1}
              selectedAnswer={selectedAnswer}
              onSelect={handleSelect}
              onNext={handleNext}
              isLast={false}
            />
          </div>
        )}
      </main>
    </div>
  );
}
