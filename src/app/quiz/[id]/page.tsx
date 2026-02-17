"use client";

import { use, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import type { Question } from "@/data/types";
import ProgressBar from "@/components/ProgressBar";
import QuizCard from "@/components/QuizCard";
import ResultScreen from "@/components/ResultScreen";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SinglePlayerQuiz({ params }: PageProps) {
  const { id } = use(params);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Kvizas nerastas");
        return res.json();
      })
      .then((quiz) => {
        setQuestions(quiz.questions);
        setQuizTitle(quiz.title);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelect = useCallback(
    (index: number) => {
      setSelectedAnswer(index);
      if (index === questions[currentIndex].correct) {
        setScore((s) => s + 1);
      }
    },
    [currentIndex, questions]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    }
  }, [currentIndex, questions.length]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setFinished(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0f0e0a]">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0f0e0a]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">😵</div>
          <p className="text-lg text-red-300">{error || "Kvizas tuščias"}</p>
          <Link
            href="/"
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-amber-950 hover:bg-amber-400"
          >
            Grįžti
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#0f0e0a]">
      {/* Decorative gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.05] blur-3xl" />
        <div className="absolute left-0 top-1/2 h-[300px] w-[300px] rounded-full bg-emerald-500/[0.04] blur-3xl" />
      </div>

      <main className="relative z-10 flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-8 sm:px-8">
        {finished ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <ResultScreen
              score={score}
              total={questions.length}
              onRestart={handleRestart}
            />
            <Link
              href="/"
              className="mt-4 flex items-center gap-1.5 text-sm text-amber-200/40 hover:text-amber-200/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Grįžti į pradžią
            </Link>
          </div>
        ) : (
          <div className="flex w-full flex-col">
            <div className="mb-2 text-center text-sm text-amber-200/40">{quizTitle}</div>
            <ProgressBar
              current={currentIndex + 1}
              total={questions.length}
            />
            <div className="mt-8">
              <QuizCard
                key={currentIndex}
                question={questions[currentIndex]}
                questionNumber={currentIndex + 1}
                selectedAnswer={selectedAnswer}
                onSelect={handleSelect}
                onNext={handleNext}
                isLast={currentIndex + 1 === questions.length}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 pb-4 text-center text-xs text-amber-200/30">
        LYS Kvizai &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
