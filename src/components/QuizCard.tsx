"use client";

import { useRef } from "react";
import type { Question } from "@/data/types";
import { useSound } from "@/hooks/useSound";

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  selectedAnswer: number | null;
  onSelect: (index: number) => void;
  onNext: () => void;
  isLast: boolean;
}

const labels = ["A", "B", "C", "D"];

export default function QuizCard({
  question,
  questionNumber,
  selectedAnswer,
  onSelect,
  onNext,
  isLast,
}: QuizCardProps) {
  const answered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === question.correct;
  const { playCorrect, playWrong } = useSound();
  const soundPlayedRef = useRef(false);

  // Play sound when answer is first selected
  if (answered && !soundPlayedRef.current) {
    soundPlayedRef.current = true;
    if (isCorrect) playCorrect();
    else playWrong();
  }
  // Reset when question changes
  if (!answered) soundPlayedRef.current = false;

  return (
    <div className="animate-fade-in w-full">
      <h2 className="mb-4 text-lg font-semibold leading-relaxed text-amber-50 sm:text-xl">
        <span className="text-amber-400">{questionNumber}.</span>{" "}
        {question.question}
      </h2>

      {question.image && (
        <div className="mb-4 overflow-hidden rounded-xl">
          <img
            src={question.image}
            alt=""
            className="h-48 w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {question.options.map((option, i) => {
          let classes =
            "flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 cursor-pointer ";

          if (!answered) {
            classes +=
              "border-white/10 bg-white/5 hover:border-amber-400/50 hover:bg-amber-400/10";
          } else if (i === question.correct) {
            classes += "border-emerald-400 bg-emerald-400/15 text-emerald-100";
          } else if (i === selectedAnswer) {
            classes += "border-red-400 bg-red-400/15 text-red-100";
          } else {
            classes += "border-white/5 bg-white/[0.02] opacity-50";
          }

          return (
            <button
              key={i}
              onClick={() => !answered && onSelect(i)}
              disabled={answered}
              className={classes}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  answered && i === question.correct
                    ? "bg-emerald-400 text-emerald-950"
                    : answered && i === selectedAnswer
                      ? "bg-red-400 text-red-950"
                      : "bg-white/10 text-amber-200"
                }`}
              >
                {labels[i]}
              </span>
              <span className="pt-0.5 text-sm sm:text-base">{option}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="animate-fade-in mt-5">
          <div
            className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
              isCorrect
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                : "border-red-400/30 bg-red-400/10 text-red-100"
            }`}
          >
            <span className="font-semibold">
              {isCorrect ? "Teisingai!" : "Neteisingai."}
            </span>{" "}
            {question.explanation}
          </div>

          <button
            onClick={onNext}
            className="mt-4 w-full rounded-xl bg-amber-500 px-6 py-3 font-semibold text-amber-950 transition-colors hover:bg-amber-400"
          >
            {isLast ? "Žiūrėti rezultatus" : "Kitas klausimas →"}
          </button>
        </div>
      )}
    </div>
  );
}
