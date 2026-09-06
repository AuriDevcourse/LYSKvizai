"use client";

import { Snowflake, Shield, Repeat } from "lucide-react";
import type { QuestionPayload, PowerUpType } from "@/lib/multiplayer/types";
import { useCountdown } from "@/hooks/useCountdown";
import { useProgressiveReveal } from "@/hooks/useProgressiveReveal";
import ProgressiveText from "./ProgressiveText";
import ProgressiveImage from "./ProgressiveImage";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { ANSWER_BG, ANSWER_ICONS, ANSWER_TEXT } from "@/lib/answer-options";

const OPTION_BG = ANSWER_BG;
const OPTION_ICONS = ANSWER_ICONS;

const PU_ICONS: Record<PowerUpType, { icon: typeof Snowflake; color: string }> = {
  freeze: { icon: Snowflake, color: "text-cyan-300" },
  shield: { icon: Shield, color: "text-blue-300" },
  double: { icon: Repeat, color: "text-emerald-300" },
};

interface HostQuestionProps {
  question: QuestionPayload;
  answerCount: { count: number; total: number } | null;
  onTimerExpire: () => void;
  players?: { id: string; name: string }[];
}

export default function HostQuestion({
  question,
  answerCount,
  onTimerExpire,
  players = [],
}: HostQuestionProps) {
  const { t } = useTranslation();
  const qText = question.en?.question ?? question.question;
  const qOptions = question.en?.options ?? question.options;
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

  const allAnswered = answerCount != null && answerCount.total > 0 && answerCount.count >= answerCount.total;
  const isCritical = fraction <= 0.25;

  return (
    <div className="flex flex-1 flex-col">
      {/* TOP: Question number + timer bar */}
      <div className="flex items-center gap-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/[0.07] px-3 py-1 text-sm font-extrabold tabular-nums text-white/75">
            {question.index + 1} / {question.total}
          </div>
          {question.isWagerRound && (
            <span className="rounded-lg bg-[#c9a825]/20 px-2 py-1 text-xs font-extrabold text-[#c9a825]">
              {t("hostQuestion.wager")}
            </span>
          )}
          {question.type && question.type !== "standard" && (
            <span className="rounded-lg bg-purple-500/20 px-2 py-1 text-xs font-extrabold text-purple-300">
              {question.type === "bluff" ? t("hostQuestion.bluff") : question.type === "audio" ? t("hostQuestion.audio") : question.type === "true-false" ? "TRUE / FALSE" : question.type === "zoom-out" ? "ZOOM OUT" : t("hostQuestion.video")}
            </span>
          )}
        </div>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              fraction > 0.5
                ? "bg-[#66bb6a]"
                : fraction > 0.25
                  ? "bg-[#c9a825]"
                  : "bg-[#ff716c]"
            }`}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      </div>

      {/* Power-ups this round */}
      {question.roundPowerUps && question.roundPowerUps.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {question.roundPowerUps.map(({ playerId, powerUp }) => {
            const pu = PU_ICONS[powerUp];
            const Icon = pu.icon;
            const name = players.find((p) => p.id === playerId)?.name ?? "?";
            return (
              <div key={playerId} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1">
                <Icon className={`h-4 w-4 ${pu.color}`} />
                <span className="text-xs font-bold text-white/70">{name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* CENTER: Timer | Question + Media | Answer count */}
      <div className="flex flex-1 items-center gap-4 py-2 sm:gap-8">
        {/* Timer circle */}
        <div
          className={`flex h-18 w-18 shrink-0 items-center justify-center rounded-full text-3xl font-black sm:h-22 sm:w-22 sm:text-4xl ${
            isCritical
              ? "timer-critical bg-[#ff716c] text-[#0e0e0e] shadow-[0_0_38px_-6px_rgba(255,113,108,0.85)]"
              : fraction > 0.5
                ? "bg-[#66bb6a] text-[#0e0e0e] shadow-[0_0_32px_-8px_rgba(102,187,106,0.75)]"
                : "bg-[#c9a825] text-[#0e0e0e] shadow-[0_0_32px_-8px_rgba(201,168,37,0.8)]"
          }`}
        >
          {displaySeconds}
        </div>

        {/* Question + media */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="surface max-w-4xl rounded-3xl px-10 py-8">
            <h2 className="font-headline text-center text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
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
              {question.type === "zoom-out" ? (
                <img
                  src={question.image}
                  alt=""
                  className="h-40 w-full object-cover sm:h-52 transition-transform duration-300 ease-out"
                  style={{ transform: `scale(${allAnswered ? 1 : 1 + 5 * fraction})` }}
                />
              ) : isProgressive ? (
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
      <div className={`grid min-h-[38vh] grid-cols-2 gap-2.5 pt-4 sm:gap-3.5 ${
        qOptions.filter(Boolean).length <= 2 ? "grid-rows-1" : "grid-rows-2"
      } stagger-children`}>
        {qOptions.map((option, i) => {
          if (!option && qOptions.filter(Boolean).length <= 2) return null;
          const Icon = OPTION_ICONS[i];
          return (
            <div
              key={i}
              className={`answer-btn flex items-center gap-4 rounded-2xl px-6 py-5 sm:gap-5 sm:px-9 sm:py-6 ${OPTION_BG[i]}`}
            >
              <Icon className={`h-7 w-7 shrink-0 sm:h-8 sm:w-8 ${ANSWER_TEXT}`} fill="currentColor" />
              <span className={`font-headline text-xl font-extrabold tracking-tight sm:text-2xl lg:text-[1.75rem] ${ANSWER_TEXT}`}>
                {option}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
