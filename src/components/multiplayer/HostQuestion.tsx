"use client";

import { Triangle, Square, Circle, Diamond, Snowflake } from "lucide-react";
import type { QuestionPayload, PowerUpUsedPayload } from "@/lib/multiplayer/types";
import { useCountdown } from "@/hooks/useCountdown";
import { useProgressiveReveal } from "@/hooks/useProgressiveReveal";
import ProgressiveText from "./ProgressiveText";
import ProgressiveImage from "./ProgressiveImage";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const OPTION_BG = [
  "bg-[#e21b3c]",
  "bg-[#1368ce]",
  "bg-[#26890c]",
  "bg-[#d89e00]",
];

const OPTION_ICONS = [Triangle, Diamond, Circle, Square];

interface HostQuestionProps {
  question: QuestionPayload;
  answerCount: { count: number; total: number } | null;
  onTimerExpire: () => void;
  powerUpEvent?: PowerUpUsedPayload | null;
}

export default function HostQuestion({
  question,
  answerCount,
  onTimerExpire,
  powerUpEvent,
}: HostQuestionProps) {
  const { t, lang } = useTranslation();
  const qText = lang !== "lt" && question.en ? question.en.question : question.question;
  const qOptions = lang !== "lt" && question.en ? question.en.options : question.options;
  const count = answerCount?.count ?? 0;
  const isProgressive = question.progressiveReveal ?? false;
  const words = qText.split(/\s+/);

  const { fraction, displaySeconds } = useCountdown(
    question.timerDuration,
    question.startTime,
    onTimerExpire
  );

  const { visibleWordCount, blurAmount } = useProgressiveReveal(
    words.length,
    question.timerDuration,
    isProgressive
  );

  const isCritical = fraction <= 0.25;

  return (
    <div className="flex flex-1 flex-col">
      {/* TOP: Question number + timer bar */}
      <div className="flex items-center gap-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/10 px-3 py-1 text-sm font-extrabold text-white/70">
            {question.index + 1} / {question.total}
          </div>
          {question.isWagerRound && (
            <span className="rounded-lg bg-[#d89e00]/20 px-2 py-1 text-xs font-extrabold text-[#d89e00]">
              {t("hostQuestion.wager")}
            </span>
          )}
          {question.type && question.type !== "standard" && (
            <span className="rounded-lg bg-purple-500/20 px-2 py-1 text-xs font-extrabold text-purple-300">
              {question.type === "bluff" ? t("hostQuestion.bluff") : question.type === "audio" ? t("hostQuestion.audio") : t("hostQuestion.video")}
            </span>
          )}
        </div>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              fraction > 0.5
                ? "bg-[#26890c]"
                : fraction > 0.25
                  ? "bg-[#d89e00]"
                  : "bg-[#e21b3c]"
            }`}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      </div>

      {/* Power-up toast */}
      {powerUpEvent && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white animate-fade-in">
          <Snowflake className="h-4 w-4" />
          <span>{powerUpEvent.playerEmoji} {powerUpEvent.playerName} used {
            powerUpEvent.powerUp === "freeze" ? t("hostQuestion.freeze") :
            powerUpEvent.powerUp === "shield" ? t("hostQuestion.shield") : t("hostQuestion.double")
          }!</span>
        </div>
      )}

      {/* CENTER: Timer | Question + Media | Answer count */}
      <div className="flex flex-1 items-center gap-4 sm:gap-8">
        {/* Timer circle */}
        <div
          className={`flex h-18 w-18 shrink-0 items-center justify-center rounded-full text-3xl font-black sm:h-22 sm:w-22 sm:text-4xl ${
            isCritical
              ? "bg-[#e21b3c] text-white timer-critical"
              : fraction > 0.5
                ? "bg-[#26890c] text-white"
                : "bg-[#d89e00] text-white"
          }`}
        >
          {displaySeconds}
        </div>

        {/* Question + media */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="glass max-w-3xl rounded-2xl px-8 py-6">
            <h2 className="text-center text-2xl font-extrabold leading-snug text-white sm:text-3xl lg:text-4xl">
              {isProgressive ? (
                <ProgressiveText text={qText} visibleWordCount={visibleWordCount} />
              ) : (
                qText
              )}
            </h2>
          </div>

          {question.type === "audio" && question.audioUrl && (
            <AudioPlayer src={question.audioUrl} />
          )}

          {question.type === "video" && question.videoUrl && (
            <VideoPlayer src={question.videoUrl} />
          )}

          {question.image && (
            <div className="max-w-md overflow-hidden rounded-xl">
              {isProgressive ? (
                <ProgressiveImage
                  src={question.image}
                  blurAmount={blurAmount}
                  className="h-40 w-full object-cover sm:h-52"
                />
              ) : (
                <img
                  src={question.image}
                  alt=""
                  className="h-40 w-full object-cover sm:h-52"
                />
              )}
            </div>
          )}
        </div>

        {/* Answer count */}
        <div className="flex shrink-0 flex-col items-center">
          <span className="text-3xl font-black text-white sm:text-4xl">
            {count}
          </span>
          <span className="text-xs font-bold text-white/50 sm:text-sm">
            {t("hostQuestion.answered")}
          </span>
        </div>
      </div>

      {/* BOTTOM: answer blocks (2×2 grid) */}
      <div className={`grid min-h-[30vh] grid-cols-2 gap-2 pt-4 sm:gap-3 ${
        qOptions.filter(Boolean).length <= 2 ? "grid-rows-1" : "grid-rows-2"
      } stagger-children`}>
        {qOptions.map((option, i) => {
          if (!option && qOptions.filter(Boolean).length <= 2) return null;
          const Icon = OPTION_ICONS[i];
          return (
            <div
              key={i}
              className={`answer-btn flex items-center gap-4 rounded-2xl px-5 py-4 sm:px-8 sm:py-5 ${OPTION_BG[i]}`}
            >
              <Icon className="h-7 w-7 shrink-0 text-white/90 sm:h-8 sm:w-8" fill="currentColor" />
              <span className="text-lg font-extrabold text-white sm:text-xl lg:text-2xl">
                {option}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
