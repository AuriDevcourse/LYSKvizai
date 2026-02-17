"use client";

import { Triangle, Square, Circle, Diamond, Snowflake } from "lucide-react";
import type { QuestionPayload, PowerUpUsedPayload } from "@/lib/multiplayer/types";
import { useCountdown } from "@/hooks/useCountdown";
import { useProgressiveReveal } from "@/hooks/useProgressiveReveal";
import ProgressiveText from "./ProgressiveText";
import ProgressiveImage from "./ProgressiveImage";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";

const OPTION_BG = [
  "bg-red-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
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
  const count = answerCount?.count ?? 0;
  const isProgressive = question.progressiveReveal ?? false;
  const words = question.question.split(/\s+/);

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

  const timerColor =
    fraction > 0.5
      ? "bg-emerald-500 text-emerald-50"
      : fraction > 0.25
        ? "bg-amber-500 text-amber-50"
        : "bg-red-500 text-red-50";

  const barColor =
    fraction > 0.5
      ? "bg-emerald-400"
      : fraction > 0.25
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="flex flex-1 flex-col">
      {/* ---- TOP: Question number + timer bar + wager badge ---- */}
      <div className="flex items-center gap-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/10 px-3 py-1 text-sm font-medium text-amber-200/70">
            {question.index + 1} / {question.total}
          </div>
          {question.isWagerRound && (
            <span className="rounded-lg bg-amber-500/20 px-2 py-1 text-xs font-bold text-amber-300">
              STATYMAS
            </span>
          )}
          {question.type && question.type !== "standard" && (
            <span className="rounded-lg bg-purple-500/20 px-2 py-1 text-xs font-bold text-purple-300">
              {question.type === "bluff" ? "APGAULĖ" : question.type === "audio" ? "AUDIO" : "VIDEO"}
            </span>
          )}
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-100 ${barColor}`}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      </div>

      {/* Power-up toast */}
      {powerUpEvent && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm text-cyan-200 animate-fade-in">
          <Snowflake className="h-4 w-4" />
          <span>{powerUpEvent.playerEmoji} {powerUpEvent.playerName} naudoja {
            powerUpEvent.powerUp === "freeze" ? "Užšaldymą" :
            powerUpEvent.powerUp === "shield" ? "Skydą" : "Dvigubai"
          }!</span>
        </div>
      )}

      {/* ---- CENTER: Timer | Question + Media | Answer count ---- */}
      <div className="flex flex-1 items-center gap-4 sm:gap-8">
        {/* Timer circle — left */}
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-black sm:h-20 sm:w-20 sm:text-3xl ${timerColor}`}
        >
          {displaySeconds}
        </div>

        {/* Question + media — center */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <h2 className="max-w-3xl text-center text-2xl font-bold leading-snug text-amber-50 sm:text-3xl lg:text-4xl">
            {isProgressive ? (
              <ProgressiveText text={question.question} visibleWordCount={visibleWordCount} />
            ) : (
              question.question
            )}
          </h2>

          {/* Audio player */}
          {question.type === "audio" && question.audioUrl && (
            <AudioPlayer src={question.audioUrl} />
          )}

          {/* Video player */}
          {question.type === "video" && question.videoUrl && (
            <VideoPlayer src={question.videoUrl} />
          )}

          {/* Image */}
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

        {/* Answer count — right */}
        <div className="flex shrink-0 flex-col items-center">
          <span className="text-2xl font-black text-amber-50 sm:text-3xl">
            {count}
          </span>
          <span className="text-xs font-medium text-amber-200/50 sm:text-sm">
            Atsakė
          </span>
        </div>
      </div>

      {/* ---- BOTTOM: answer blocks (2×2 grid) ---- */}
      <div className={`grid min-h-[30vh] grid-cols-2 gap-2 pt-4 sm:gap-3 ${
        question.options.filter(Boolean).length <= 2 ? "grid-rows-1" : "grid-rows-2"
      }`}>
        {question.options.map((option, i) => {
          if (!option && question.options.filter(Boolean).length <= 2) return null;
          const Icon = OPTION_ICONS[i];
          return (
            <div
              key={i}
              className={`flex items-end gap-3 rounded-xl px-5 pb-5 pt-4 sm:gap-4 sm:px-8 sm:pb-7 ${OPTION_BG[i]}`}
            >
              <Icon className="h-7 w-7 shrink-0 text-white/90 sm:h-8 sm:w-8" fill="currentColor" />
              <span className="text-lg font-bold text-white sm:text-xl lg:text-2xl">
                {option}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
