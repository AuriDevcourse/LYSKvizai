"use client";

import { useState, useRef, useEffect } from "react";
import { Triangle, Diamond, Circle, Square, Check, X, Clock, ArrowRight, Trophy } from "lucide-react";
import type { Question } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { fuzzyMatch } from "@/lib/fuzzy-match";

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  selectedAnswer: number | null;
  onSelect: (index: number) => void;
  onNext: () => void;
  isLast: boolean;
}

const COLORS = [
  { bg: "bg-[#ff716c]", hover: "hover:brightness-110", icon: Triangle },
  { bg: "bg-[#43a5fc]", hover: "hover:brightness-110", icon: Diamond },
  { bg: "bg-[#66bb6a]", hover: "hover:brightness-110", icon: Circle },
  { bg: "bg-[#c9a825]", hover: "hover:brightness-110", icon: Square },
];

const TF_COLORS = [
  { bg: "bg-[#66bb6a]", hover: "hover:brightness-110", icon: Check },
  { bg: "bg-[#ff716c]", hover: "hover:brightness-110", icon: X },
];

export default function QuizCard({
  question,
  questionNumber,
  selectedAnswer,
  onSelect,
  onNext,
  isLast,
}: QuizCardProps) {
  const { t } = useTranslation();
  const qText = question.question;
  const qOptions = question.options;
  const qExplanation = question.explanation;
  const answered = selectedAnswer !== null;
  const questionType = question.type ?? "standard";
  const isTrueFalse = questionType === "true-false";
  const isYearGuesser = questionType === "year-guesser";
  const isFastestFinger = questionType === "fastest-finger";
  const isZoomOut = questionType === "zoom-out";
  const isTextInput = isFastestFinger || isZoomOut;

  // Year guesser state — slider range
  const YEAR_MIN = 1800;
  const YEAR_MAX = 2030;
  const correctYear = question.correctYear ?? 2000;
  const yearRange = YEAR_MAX - YEAR_MIN;
  const [yearGuess, setYearGuess] = useState(Math.round((YEAR_MIN + YEAR_MAX) / 2));
  // Fastest finger state
  const [textAnswer, setTextAnswer] = useState("");
  const ffStartTime = useRef<number>(Date.now());
  const [ffResponseTime, setFfResponseTime] = useState<number | null>(null);

  // Reset start time when question changes
  useEffect(() => {
    ffStartTime.current = Date.now();
    setFfResponseTime(null);
  }, [question.question]);

  const isCorrectStandard = selectedAnswer === question.correct;

  // Year guesser scoring: 10% of range = threshold for any points
  const yearDiff = isYearGuesser ? Math.abs(yearGuess - correctYear) : 0;
  const yearThreshold = yearRange * 0.1; // 10% of range = ~23 years
  const yearAccuracy = isYearGuesser ? Math.max(0, 1 - yearDiff / yearThreshold) : 0;
  const isYearCorrect = yearDiff === 0;
  const yearGotPoints = yearAccuracy > 0;

  // Text input correctness (fuzzy — allows typos) — used by fastest-finger and zoom-out
  const acceptedAnswers = question.acceptedAnswers ?? [question.options[question.correct]];
  const isTextCorrect = fuzzyMatch(textAnswer, acceptedAnswers);

  // Zoom-out animation: starts at 6x, shrinks to 1x over 15 seconds
  const ZOOM_DURATION = 15;
  const [zoomScale, setZoomScale] = useState(6);
  useEffect(() => {
    if (!isZoomOut) return;
    if (answered) { setZoomScale(1); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const fraction = Math.min(elapsed / ZOOM_DURATION, 1);
      setZoomScale(6 - 5 * fraction); // 6 → 1
      if (fraction < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isZoomOut, question.question, answered]);

  const isCorrect = isYearGuesser ? yearGotPoints : isTextInput ? isTextCorrect : isCorrectStandard;

  const handleYearSubmit = () => {
    if (answered) return;
    // Use 0 as a sentinel; correctness checked via yearGuess state
    onSelect(isYearCorrect ? question.correct : -1);
  };

  const handleTextSubmit = () => {
    if (answered || !textAnswer.trim()) return;
    setFfResponseTime((Date.now() - ffStartTime.current) / 1000);
    onSelect(isTextCorrect ? question.correct : -1);
  };

  return (
    <div className="animate-fade-in-up w-full">
      {/* Question — hidden for zoom-out (image IS the question) */}
      {!isZoomOut && (
        <div className="glass mb-6 rounded-2xl px-6 py-5 text-center">
          <h2 className="text-xl font-extrabold leading-relaxed text-white sm:text-2xl">
            {qText}
          </h2>
        </div>
      )}

      {/* Image */}
      {question.image && (
        <div className={`mb-6 overflow-hidden rounded-2xl ${isZoomOut ? "h-64 sm:h-80" : ""} relative bg-white/5`}>
          <img
            src={question.image}
            alt=""
            className={`w-full object-cover transition-transform duration-200 ease-out ${isZoomOut ? "h-full" : "h-48"}`}
            style={isZoomOut ? { transform: `scale(${zoomScale})` } : undefined}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Year Guesser — Slider */}
      {isYearGuesser && (
        <div className="flex flex-col items-center gap-5">
          <span className="text-6xl font-black text-white">{yearGuess}</span>
          <div className="w-full max-w-md px-2">
            <input
              type="range"
              min={YEAR_MIN}
              max={YEAR_MAX}
              value={yearGuess}
              onChange={(e) => !answered && setYearGuess(Number(e.target.value))}
              disabled={answered}
              className="year-slider w-full"
            />
            <div className="mt-1 flex justify-between text-xs font-bold text-white/40">
              <span>{YEAR_MIN}</span>
              <span>{YEAR_MAX}</span>
            </div>
          </div>
          {!answered && (
            <button
              onClick={handleYearSubmit}
              className="btn-primary w-full max-w-xs text-center"
            >
              {t("quizCard.submit")}
            </button>
          )}
        </div>
      )}

      {/* Text input — Fastest Finger & Zoom Out */}
      {isTextInput && (
        <div className="flex flex-col items-center gap-4">
          <input
            type="text"
            value={textAnswer}
            onChange={(e) => !answered && setTextAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
            disabled={answered}
            autoFocus
            placeholder={t("quizCard.typeAnswer")}
            className="w-full max-w-md rounded-2xl border-[1.5px] border-white/8 bg-white/5 px-5 py-4 text-center text-xl font-bold text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none disabled:opacity-60"
          />
          {!answered && (
            <button
              onClick={handleTextSubmit}
              disabled={!textAnswer.trim()}
              className="btn-primary w-full max-w-xs text-center disabled:opacity-40"
            >
              {t("quizCard.submit")}
            </button>
          )}
        </div>
      )}

      {/* Standard / True-False / Bluff / Audio / Video answer grid */}
      {!isYearGuesser && !isTextInput && (
        <div className={`grid gap-3 stagger-children grid-cols-2`}>
          {qOptions.map((option, i) => {
            if (isTrueFalse && !option) return null;
            const { bg, hover, icon: Icon } = isTrueFalse ? TF_COLORS[i] : COLORS[i];
            const isThis = i === selectedAnswer;
            const isCorrectAnswer = i === question.correct;

            let classes = `answer-btn relative flex items-center gap-3 rounded-2xl px-4 py-5 text-left font-bold text-white transition-all sm:py-6 ${bg}`;

            if (answered) {
              if (isCorrectAnswer) {
                classes += " outline outline-2 outline-[#ff9062] scale-[1.02]";
              } else if (isThis) {
                classes += " opacity-60 grayscale";
              } else {
                classes += " opacity-30";
              }
            } else {
              classes += ` ${hover}`;
            }

            return (
              <button
                key={i}
                onClick={() => !answered && onSelect(i)}
                disabled={answered}
                className={classes}
              >
                <Icon className="h-6 w-6 shrink-0" {...(isTrueFalse ? { strokeWidth: 3 } : { fill: "currentColor" })} />
                <span className="text-sm leading-tight break-words sm:text-base">{option}</span>
                {answered && isCorrectAnswer && (
                  <Check className="absolute right-3 top-3 h-5 w-5 animate-bounce-in" />
                )}
                {answered && isThis && !isCorrectAnswer && (
                  <X className="absolute right-3 top-3 h-5 w-5 animate-bounce-in" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Feedback + Next */}
      {answered && (
        <div className="animate-slide-up mt-6">
          <div
            className={`rounded-2xl px-5 py-4 text-center font-bold ${
              isYearGuesser && yearGotPoints && !isYearCorrect
                ? "bg-[#c9a825] text-white"
                : isCorrect
                  ? "bg-[#66bb6a] text-white"
                  : "bg-[#ff716c] text-white"
            }`}
          >
            <p className="flex items-center justify-center gap-2 text-lg">
              {isYearGuesser
                ? isYearCorrect
                  ? <>{t("quizCard.correct")} {correctYear} <Check className="h-5 w-5" /></>
                  : yearGotPoints
                    ? `${Math.round(yearAccuracy * 100)}% · Off by ${yearDiff} ${yearDiff === 1 ? "year" : "years"}`
                    : <>{t("quizCard.incorrect")} <X className="h-5 w-5" /></>
                : isCorrect
                  ? <>{t("quizCard.correct")} <Check className="h-5 w-5" /></>
                  : <>{t("quizCard.incorrect")} <X className="h-5 w-5" /></>}
            </p>
            {isYearGuesser && !isYearCorrect && (
              <p className="mt-1 text-sm font-medium text-white/80">
                {t("quizCard.correctAnswer")}: {correctYear}
              </p>
            )}
            {isTextInput && (
              <div className="mt-1 flex items-center justify-center gap-3 text-sm font-medium text-white/80">
                {ffResponseTime !== null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {ffResponseTime.toFixed(2)}s
                  </span>
                )}
                {!isTextCorrect && (
                  <span>{t("quizCard.correctAnswer")}: {acceptedAnswers[0]}</span>
                )}
              </div>
            )}
            <p className="mt-1 text-sm font-medium text-white/80">
              {qExplanation}
            </p>
          </div>

          <button
            onClick={onNext}
            className="btn-primary mt-4 flex w-full items-center justify-center gap-2"
          >
            {isLast ? <>{t("quizCard.results")} <Trophy className="h-5 w-5" /></> : <>{t("quizCard.next")} <ArrowRight className="h-5 w-5" /></>}
          </button>
        </div>
      )}
    </div>
  );
}
