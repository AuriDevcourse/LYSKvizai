"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ChevronUp, ChevronDown, Calendar } from "lucide-react";
import type { QuestionPayload } from "@/lib/multiplayer/types";
import Timer from "./Timer";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { useContentTranslationSingle } from "@/hooks/useContentTranslation";

interface YearGuesserInputProps {
  question: QuestionPayload;
  onAnswer: (year: number) => void;
  onTimerExpire: () => void;
  timerReduction?: number;
  eliminated?: boolean;
}

export default function YearGuesserInput({
  question,
  onAnswer,
  onTimerExpire,
  timerReduction = 0,
  eliminated = false,
}: YearGuesserInputProps) {
  const { t } = useTranslation();
  const qText = useContentTranslationSingle(question.question);
  const [year, setYear] = useState(2000);
  const [submitted, setSubmitted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setYear(2000);
    setSubmitted(false);
  }, [question.index]);

  const effectiveDuration = Math.max(5, question.timerDuration - timerReduction);

  const clamp = (v: number) => Math.max(0, Math.min(2030, v));

  const adjust = useCallback((delta: number) => {
    if (submitted) return;
    setYear((prev) => clamp(prev + delta));
  }, [submitted]);

  const startHold = useCallback((delta: number) => {
    if (submitted) return;
    adjust(delta);
    let count = 0;
    intervalRef.current = setInterval(() => {
      count++;
      const speed = count > 15 ? 10 : count > 8 ? 5 : 1;
      setYear((prev) => clamp(prev + delta * speed));
    }, 120);
  }, [submitted, adjust]);

  const stopHold = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (submitted || eliminated) return;
    setSubmitted(true);
    onAnswer(year);
  };

  if (eliminated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Calendar className="h-10 w-10 text-white/40" />
        <p className="text-lg font-extrabold text-white/60">{t("playerQuestion.spectatorMode")}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-scale-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
          <Check className="h-10 w-10 text-white" />
        </div>
        <p className="text-xl font-extrabold text-white">{t("yearGuesser.lockedIn")}</p>
        <p className="text-4xl font-extrabold text-white">{year}</p>
        <p className="font-bold text-white/50">{t("yearGuesser.waitingForOthers")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Question number */}
      <div className="text-center text-sm font-bold text-white/50">
        {question.index + 1} / {question.total}
      </div>

      <Timer
        duration={effectiveDuration}
        startTime={question.startTime}
        onExpire={onTimerExpire}
      />

      {/* Question text */}
      <div className="glass rounded-2xl px-5 py-4 text-center">
        <div className="mb-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50">
          <Calendar className="h-3.5 w-3.5" />
          {t("yearGuesser.title")}
        </div>
        <h2 className="text-lg font-extrabold text-white">
          {qText}
        </h2>
      </div>

      {/* Image */}
      {question.image && (
        <div className="overflow-hidden rounded-xl">
          <img
            src={question.image}
            alt=""
            className="h-32 w-full object-cover"
          />
        </div>
      )}

      {/* Year input */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {/* +10 / +1 buttons */}
        <div className="flex items-center gap-3">
          <button
            onPointerDown={() => startHold(10)}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            className="flex h-12 w-16 items-center justify-center rounded-xl bg-[#1368ce] font-extrabold text-white text-sm active:brightness-90"
          >
            +10
          </button>
          <button
            onPointerDown={() => startHold(1)}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#26890c] text-white active:brightness-90"
          >
            <ChevronUp className="h-7 w-7" />
          </button>
        </div>

        {/* Year display */}
        <div className="text-6xl font-extrabold text-white tabular-nums">
          {year}
        </div>

        {/* -1 / -10 buttons */}
        <div className="flex items-center gap-3">
          <button
            onPointerDown={() => startHold(-10)}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            className="flex h-12 w-16 items-center justify-center rounded-xl bg-[#d89e00] font-extrabold text-white text-sm active:brightness-90"
          >
            -10
          </button>
          <button
            onPointerDown={() => startHold(-1)}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#e21b3c] text-white active:brightness-90"
          >
            <ChevronDown className="h-7 w-7" />
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="btn-primary mt-2 w-full max-w-xs text-lg"
        >
          {t("yearGuesser.lockIn")} {year}
        </button>
      </div>
    </div>
  );
}
