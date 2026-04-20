"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Eye, Zap } from "lucide-react";
import type { QuestionPayload } from "@/lib/multiplayer/types";
import Timer from "./Timer";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface FastestFingerInputProps {
  question: QuestionPayload;
  onAnswer: (text: string) => void;
  onTimerExpire: () => void;
  timerReduction?: number;
  eliminated?: boolean;
}

export default function FastestFingerInput({
  question,
  onAnswer,
  onTimerExpire,
  timerReduction = 0,
  eliminated = false,
}: FastestFingerInputProps) {
  const { t } = useTranslation();
  const qText = question.en?.question ?? question.question;
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lastQuestionIndex, setLastQuestionIndex] = useState(question.index);
  const inputRef = useRef<HTMLInputElement>(null);

  if (lastQuestionIndex !== question.index) {
    setLastQuestionIndex(question.index);
    setText("");
    setSubmitted(false);
  }

  useEffect(() => {
    if (!submitted && !eliminated && inputRef.current) {
      inputRef.current.focus();
    }
  }, [submitted, eliminated]);

  const effectiveDuration = Math.max(5, question.timerDuration - timerReduction);

  const handleSubmit = () => {
    if (submitted || !text.trim() || eliminated) return;
    setSubmitted(true);
    onAnswer(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Eliminated: spectator mode
  if (eliminated) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#ff716c]/20 px-4 py-2 text-sm font-bold text-white">
          <Eye className="h-4 w-4" />
          {t("playerQuestion.spectatorMode")}
        </div>
        <div className="text-center text-sm font-bold text-white/50">
          {question.index + 1} / {question.total}
        </div>
        <div className="glass rounded-2xl px-5 py-4 text-center">
          <h2 className="text-lg font-extrabold text-white">{qText}</h2>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#c9a825]/20 px-4 py-2 text-sm font-bold text-[#c9a825]">
          <Zap className="h-4 w-4" />
          {t("fastestFinger.title")}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-scale-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
          <Check className="h-10 w-10 text-white" />
        </div>
        <p className="text-xl font-extrabold text-white">{t("fastestFinger.lockedIn")}</p>
        <p className="font-bold text-white/50">{t("fastestFinger.waitingForOthers")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Question counter */}
      <div className="text-center text-sm font-bold text-white/50">
        {question.index + 1} / {question.total}
      </div>

      <Timer
        duration={effectiveDuration}
        startTime={question.startTime}
        onExpire={onTimerExpire}
      />

      {/* Fastest Finger badge */}
      <div className="flex items-center justify-center gap-2 rounded-xl bg-[#c9a825]/20 px-4 py-2 text-sm font-extrabold text-[#c9a825]">
        <Zap className="h-4 w-4" />
        {t("fastestFinger.title")}
      </div>

      {/* Question text */}
      <div className="glass rounded-2xl px-5 py-4 text-center">
        <h2 className="text-lg font-extrabold text-white">{qText}</h2>
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

      {/* Text input */}
      <div className="flex flex-col gap-3 mt-auto">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("fastestFinger.placeholder")}
          className="w-full rounded-2xl border-[1.5px] border-white/8 bg-white/5 px-5 py-4 text-lg font-bold text-white placeholder-white/40 outline-none transition-colors focus:border-white/50 focus:bg-white/5"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="w-full rounded-2xl bg-[#5a9e3e] px-6 py-4 text-lg font-extrabold text-white transition-all hover:brightness-110 active:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("fastestFinger.submit")}
        </button>
      </div>
    </div>
  );
}
