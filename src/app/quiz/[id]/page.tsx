"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, X } from "lucide-react";
import type { Question } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import ProgressBar from "@/components/ProgressBar";
import QuizCard from "@/components/QuizCard";
import ResultScreen from "@/components/ResultScreen";

interface PageProps {
  params: Promise<{ id: string }>;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SinglePlayerQuiz({ params }: PageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { t, lang } = useTranslation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const isMix = id === "mix";
    const idsParam = searchParams.get("ids");

    if (isMix && idsParam) {
      // Multi-quiz mode: fetch all quizzes and merge
      const quizIds = idsParam.split(",").filter(Boolean);
      Promise.all(
        quizIds.map((qid) =>
          fetch(`/api/quizzes/${qid}?lang=${lang}`).then((res) => {
            if (!res.ok) return null;
            return res.json();
          })
        )
      )
        .then((results) => {
          const validQuizzes = results.filter(Boolean);
          if (validQuizzes.length === 0) {
            setError(t("quiz.notFound"));
            return;
          }
          const allQuestions: Question[] = validQuizzes.flatMap((q: { questions: Question[] }) => q.questions);
          setQuestions(shuffleArray(allQuestions));
          const titles = validQuizzes.map((q: { title: string }) => q.title);
          setQuizTitle(`${t("quiz.mix")}${titles.join(" + ")}`);
        })
        .catch(() => setError("Error loading quizzes"))
        .finally(() => setLoading(false));
    } else {
      // Single quiz mode
      fetch(`/api/quizzes/${id}?lang=${lang}`)
        .then((res) => {
          if (!res.ok) throw new Error(t("quiz.notFound"));
          return res.json();
        })
        .then((quiz) => {
          setQuestions(quiz.questions);
          setQuizTitle(quiz.title);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id, searchParams, lang]);

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
    setQuestions((prev) => shuffleArray(prev));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setFinished(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#46178f]">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#46178f]">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-bold text-white">{error || t("quiz.empty")}</p>
          <Link href="/" className="btn-primary">
            {t("quiz.home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#46178f] bg-pattern">
      <Link
        href="/"
        className="fixed right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-5 w-5" />
      </Link>
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
              className="mt-6 flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("quiz.home")}
            </Link>
          </div>
        ) : (
          <div className="flex w-full flex-col">
            <div className="mb-1 text-center text-sm font-bold text-white/40">{quizTitle}</div>
            <ProgressBar
              current={currentIndex + 1}
              total={questions.length}
            />
            <div className="mt-6">
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
    </div>
  );
}
