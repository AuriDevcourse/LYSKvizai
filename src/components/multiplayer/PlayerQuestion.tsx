"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, Triangle, Square, Circle, Diamond, Eye, Shield, Zap, Snowflake, Bomb, Coins, Repeat } from "lucide-react";
import type { QuestionPayload, PowerUpType } from "@/lib/multiplayer/types";
import { useProgressiveReveal } from "@/hooks/useProgressiveReveal";
import { useCountdown } from "@/hooks/useCountdown";
import Timer from "./Timer";
import ProgressiveText from "./ProgressiveText";
import ProgressiveImage from "./ProgressiveImage";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const BUTTON_COLORS = [
  "bg-[#e21b3c] hover:brightness-110 active:brightness-90",
  "bg-[#1368ce] hover:brightness-110 active:brightness-90",
  "bg-[#26890c] hover:brightness-110 active:brightness-90",
  "bg-[#d89e00] hover:brightness-110 active:brightness-90",
];

const BUTTON_ICONS = [
  <Triangle key="t" className="h-7 w-7" fill="currentColor" />,
  <Diamond key="d" className="h-7 w-7" fill="currentColor" />,
  <Circle key="c" className="h-7 w-7" fill="currentColor" />,
  <Square key="s" className="h-7 w-7" fill="currentColor" />,
];

const POWER_UP_INFO: Record<PowerUpType, { icon: React.ReactNode; bigIcon: React.ReactNode; color: string; bg: string; label: string; desc: string }> = {
  freeze: { icon: <Snowflake className="h-5 w-5" />, bigIcon: <Snowflake className="h-8 w-8" />, color: "text-cyan-300", bg: "bg-cyan-500/20 border-cyan-500/40", label: "FREEZE", desc: "Timer -3s for everyone!" },
  shield: { icon: <Shield className="h-5 w-5" />, bigIcon: <Shield className="h-8 w-8" />, color: "text-blue-300", bg: "bg-blue-500/20 border-blue-500/40", label: "SHIELD", desc: "Keep your streak if wrong" },
  double: { icon: <Repeat className="h-5 w-5" />, bigIcon: <Repeat className="h-8 w-8" />, color: "text-emerald-300", bg: "bg-emerald-500/20 border-emerald-500/40", label: "DOUBLE", desc: "2x points if correct!" },
  thief: { icon: <Coins className="h-5 w-5" />, bigIcon: <Coins className="h-8 w-8" />, color: "text-purple-300", bg: "bg-purple-500/20 border-purple-500/40", label: "THIEF", desc: "Steal 300 from 1st place!" },
  bomb: { icon: <Bomb className="h-5 w-5" />, bigIcon: <Bomb className="h-8 w-8" />, color: "text-red-300", bg: "bg-red-500/20 border-red-500/40", label: "BOMB", desc: "Last place loses 250!" },
  gamble: { icon: <Zap className="h-5 w-5" />, bigIcon: <Zap className="h-8 w-8" />, color: "text-yellow-300", bg: "bg-yellow-500/20 border-yellow-500/40", label: "GAMBLE", desc: "50/50: 3x points or 0!" },
};

interface PlayerQuestionProps {
  question: QuestionPayload;
  onAnswer: (index: number) => void;
  onTimerExpire: () => void;
  timerReduction?: number;
  playerId?: string;
  eliminated?: boolean;
  canAnswer?: boolean;
  waitingPlayerName?: string;
  onChoosePowerUp?: (powerUp: "freeze" | "shield" | "double") => void;
}

export default function PlayerQuestion({
  question,
  onAnswer,
  onTimerExpire,
  timerReduction = 0,
  playerId,
  eliminated = false,
  canAnswer = true,
  waitingPlayerName,
  onChoosePowerUp,
}: PlayerQuestionProps) {
  const { t, lang } = useTranslation();
  const qText = lang === "lt" && question.lt ? question.lt.question : lang !== "lt" && question.en ? question.en.question : question.question;
  const qOptions = lang === "lt" && question.lt ? question.lt.options : lang !== "lt" && question.en ? question.en.options : question.options;
  const [selected, setSelected] = useState<number | null>(null);
  const isProgressive = question.progressiveReveal ?? false;
  const words = qText.split(/\s+/);

  // Find this player's assigned power-up for this round
  const myPowerUp = useMemo(() => {
    if (!playerId || !question.roundPowerUps) return null;
    const entry = question.roundPowerUps.find((p) => p.playerId === playerId);
    return entry?.powerUp ?? null;
  }, [playerId, question.roundPowerUps]);

  useEffect(() => {
    setSelected(null);
  }, [question.index]);

  const { visibleWordCount, blurAmount } = useProgressiveReveal(
    words.length,
    question.timerDuration,
    isProgressive
  );

  const effectiveDuration = Math.max(5, question.timerDuration - timerReduction);

  // For zoom-out: track fraction to drive zoom level
  const { fraction: zoomFraction } = useCountdown(effectiveDuration, question.startTime);

  // For true-false: only show non-empty options, preserving original indices
  const visibleOptions = useMemo(() => {
    return qOptions.map((opt, i) => ({ opt, i })).filter(({ opt }) => opt !== "");
  }, [qOptions]);

  const handleSelect = (index: number) => {
    if (selected !== null || eliminated || !canAnswer) return;
    setSelected(index);
    onAnswer(index);
  };

  // Eliminated: spectator mode
  if (eliminated) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#e21b3c]/20 px-4 py-2 text-sm font-bold text-white">
          <Eye className="h-4 w-4" />
          {t("playerQuestion.spectatorMode")}
        </div>

        <div className="text-center text-sm font-bold text-white/50">
          {question.index + 1} / {question.total}
        </div>

        <h2 className="text-center text-lg font-extrabold text-white/60">
          {qText}
        </h2>

        <div className={`grid gap-3 opacity-40 ${visibleOptions.length <= 2 ? "grid-cols-2" : "grid-cols-2"}`}>
          {visibleOptions.map(({ opt, i }) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-6 text-center font-bold text-white ${BUTTON_COLORS[i].split(" ")[0]}`}
            >
              {BUTTON_ICONS[i]}
              <span className="text-sm leading-tight sm:text-base">{opt}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Team mode: not your turn
  if (!canAnswer && waitingPlayerName) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <Eye className="h-8 w-8 text-white" />
        </div>
        <p className="text-lg font-extrabold text-white">{t("playerQuestion.waitingFor")} {waitingPlayerName}</p>
        <p className="font-bold text-white/50">{t("playerQuestion.teammateAnswers")}</p>
        <Timer
          duration={effectiveDuration}
          startTime={question.startTime}
          onExpire={onTimerExpire}
        />
      </div>
    );
  }

  if (selected !== null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-scale-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
          <Check className="h-10 w-10 text-white" />
        </div>
        <p className="text-xl font-extrabold text-white">{t("playerQuestion.lockedIn")}</p>
        <p className="font-bold text-white/50">{t("playerQuestion.waitingForOthers")}</p>
        {myPowerUp && (
          <div className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-3 ${POWER_UP_INFO[myPowerUp].bg}`}>
            <div className={POWER_UP_INFO[myPowerUp].color}>
              {POWER_UP_INFO[myPowerUp].icon}
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-extrabold ${POWER_UP_INFO[myPowerUp].color}`}>{POWER_UP_INFO[myPowerUp].label}</span>
              <span className="text-xs font-bold text-white/60">{POWER_UP_INFO[myPowerUp].desc}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Timer + question number */}
      <div className="text-center text-sm font-bold text-white/50">
        {question.index + 1} / {question.total}
        {question.isWagerRound && (
          <span className="ml-2 rounded-lg bg-[#d89e00]/20 px-2 py-0.5 text-xs font-extrabold text-[#d89e00]">
            {t("hostQuestion.wager")}
          </span>
        )}
      </div>

      <Timer
        duration={effectiveDuration}
        startTime={question.startTime}
        onExpire={onTimerExpire}
      />

      {/* Power-up indicator */}
      {myPowerUp && (
        <div className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-3 animate-bounce-in ${POWER_UP_INFO[myPowerUp].bg}`}>
          <div className={POWER_UP_INFO[myPowerUp].color}>
            {POWER_UP_INFO[myPowerUp].bigIcon}
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-extrabold ${POWER_UP_INFO[myPowerUp].color}`}>{POWER_UP_INFO[myPowerUp].label}</span>
            <span className="text-xs font-bold text-white/60">{POWER_UP_INFO[myPowerUp].desc}</span>
          </div>
        </div>
      )}

      {/* Question text */}
      <div className="glass rounded-2xl px-5 py-4 text-center">
        <h2 className="text-lg font-extrabold text-white">
          {isProgressive ? (
            <ProgressiveText text={qText} visibleWordCount={visibleWordCount} />
          ) : (
            qText
          )}
        </h2>
      </div>

      {/* Audio */}
      {question.type === "audio" && question.audioUrl && (
        <AudioPlayer src={question.audioUrl} />
      )}

      {/* Video */}
      {question.type === "video" && question.videoUrl && (
        <VideoPlayer src={question.videoUrl} />
      )}

      {/* Image */}
      {question.image && (
        <div className="overflow-hidden rounded-xl">
          {question.type === "zoom-out" ? (
            <img
              src={question.image}
              alt=""
              className="h-32 w-full object-cover transition-transform duration-300 ease-out"
              style={{ transform: `scale(${1 + 5 * zoomFraction})` }}
            />
          ) : isProgressive ? (
            <ProgressiveImage
              src={question.image}
              blurAmount={blurAmount}
              className="h-32 w-full object-cover"
            />
          ) : (
            <img
              src={question.image}
              alt=""
              className="h-32 w-full object-cover"
            />
          )}
        </div>
      )}

      {/* Big answer buttons */}
      <div className={`grid gap-3 stagger-children ${visibleOptions.length <= 2 ? "grid-cols-1 max-w-sm mx-auto w-full" : "grid-cols-2"}`}>
        {visibleOptions.map(({ opt, i }) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`answer-btn flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-5 text-center font-bold text-white min-h-[4.5rem] ${BUTTON_COLORS[i]}`}
          >
            {BUTTON_ICONS[i]}
            <span className="text-sm leading-tight sm:text-base">{opt}</span>
          </button>
        ))}
      </div>

      {/* Power-up chooser (below answers, safe from accidental taps) */}
      {onChoosePowerUp && !myPowerUp && (question.powerUpUsesLeft ?? 0) > 0 && (
        <div className="mt-2">
          <p className="mb-1.5 text-center text-[10px] font-bold text-white/30 uppercase tracking-wider">
            Power-up ({question.powerUpUsesLeft} left)
          </p>
          <div className="flex items-center justify-center gap-2">
            {(["freeze", "shield", "double"] as const).map((pu) => {
              const info = POWER_UP_INFO[pu];
              const alreadyUsed = question.usedPowerUpTypes?.includes(pu);
              return (
                <button
                  key={pu}
                  onClick={() => onChoosePowerUp(pu)}
                  disabled={!!alreadyUsed}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed ${info.bg} ${info.color} border`}
                >
                  {info.icon}
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
