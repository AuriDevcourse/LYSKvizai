"use client";

import { useRef } from "react";
import { Triangle, Diamond, Circle, Square, Check, X } from "lucide-react";
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

const COLORS = [
  { bg: "bg-[#e21b3c]", hover: "hover:brightness-110", icon: Triangle },
  { bg: "bg-[#1368ce]", hover: "hover:brightness-110", icon: Diamond },
  { bg: "bg-[#26890c]", hover: "hover:brightness-110", icon: Circle },
  { bg: "bg-[#d89e00]", hover: "hover:brightness-110", icon: Square },
];

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

  if (answered && !soundPlayedRef.current) {
    soundPlayedRef.current = true;
    if (isCorrect) playCorrect();
    else playWrong();
  }
  if (!answered) soundPlayedRef.current = false;

  return (
    <div className="animate-fade-in-up w-full">
      {/* Question */}
      <div className="glass mb-6 rounded-2xl px-6 py-5 text-center">
        <h2 className="text-xl font-extrabold leading-relaxed text-white sm:text-2xl">
          {question.question}
        </h2>
      </div>

      {question.image && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img
            src={question.image}
            alt=""
            className="h-48 w-full object-cover"
          />
        </div>
      )}

      {/* 2x2 Answer Grid */}
      <div className="grid grid-cols-2 gap-3 stagger-children">
        {question.options.map((option, i) => {
          const { bg, hover, icon: Icon } = COLORS[i];
          const isThis = i === selectedAnswer;
          const isCorrectAnswer = i === question.correct;

          let classes = `answer-btn relative flex items-center gap-3 rounded-2xl px-4 py-5 text-left font-bold text-white transition-all sm:py-6 ${bg}`;

          if (answered) {
            if (isCorrectAnswer) {
              classes += " ring-4 ring-white scale-[1.02]";
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
              <Icon className="h-6 w-6 shrink-0" fill="currentColor" />
              <span className="text-sm leading-tight sm:text-base">{option}</span>
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

      {/* Feedback + Next */}
      {answered && (
        <div className="animate-slide-up mt-6">
          <div
            className={`rounded-2xl px-5 py-4 text-center font-bold ${
              isCorrect
                ? "bg-[#26890c] text-white"
                : "bg-[#e21b3c] text-white"
            }`}
          >
            <p className="text-lg">
              {isCorrect ? "Teisingai! ✓" : "Neteisingai ✗"}
            </p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {question.explanation}
            </p>
          </div>

          <button
            onClick={onNext}
            className="btn-primary mt-4 w-full text-center"
          >
            {isLast ? "Rezultatai" : "Toliau →"}
          </button>
        </div>
      )}
    </div>
  );
}
