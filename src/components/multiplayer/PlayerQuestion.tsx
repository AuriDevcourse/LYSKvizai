"use client";

import { useState, useEffect } from "react";
import { Check, Triangle, Square, Circle, Diamond, Eye } from "lucide-react";
import type { QuestionPayload, PowerUpType } from "@/lib/multiplayer/types";
import { useProgressiveReveal } from "@/hooks/useProgressiveReveal";
import Timer from "./Timer";
import PowerUpBar from "./PowerUpBar";
import ProgressiveText from "./ProgressiveText";
import ProgressiveImage from "./ProgressiveImage";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";

const BUTTON_COLORS = [
  "bg-red-500 hover:bg-red-400 active:bg-red-600",
  "bg-blue-500 hover:bg-blue-400 active:bg-blue-600",
  "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600",
  "bg-amber-500 hover:bg-amber-400 active:bg-amber-600",
];

const BUTTON_ICONS = [
  <Triangle key="t" className="h-7 w-7" fill="currentColor" />,
  <Diamond key="d" className="h-7 w-7" fill="currentColor" />,
  <Circle key="c" className="h-7 w-7" fill="currentColor" />,
  <Square key="s" className="h-7 w-7" fill="currentColor" />,
];

interface PlayerQuestionProps {
  question: QuestionPayload;
  onAnswer: (index: number) => void;
  onTimerExpire: () => void;
  timerReduction?: number;
  powerUpUses?: number;
  onUsePowerUp?: (powerUp: PowerUpType) => void;
  eliminated?: boolean;
  canAnswer?: boolean;
  waitingPlayerName?: string;
}

export default function PlayerQuestion({
  question,
  onAnswer,
  onTimerExpire,
  timerReduction = 0,
  powerUpUses = 0,
  onUsePowerUp,
  eliminated = false,
  canAnswer = true,
  waitingPlayerName,
}: PlayerQuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const isProgressive = question.progressiveReveal ?? false;
  const words = question.question.split(/\s+/);

  // Reset selection when question changes
  useEffect(() => {
    setSelected(null);
  }, [question.index]);

  const { visibleWordCount, blurAmount } = useProgressiveReveal(
    words.length,
    question.timerDuration,
    isProgressive
  );

  // Effective timer with freeze reduction
  const effectiveDuration = Math.max(5, question.timerDuration - timerReduction);

  const handleSelect = (index: number) => {
    if (selected !== null || eliminated || !canAnswer) return;
    setSelected(index);
    onAnswer(index);
  };

  // Eliminated: spectator mode
  if (eliminated) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300">
          <Eye className="h-4 w-4" />
          Stebėjimo režimas
        </div>

        <div className="flex items-center justify-between text-sm text-amber-200/50">
          <span>{question.index + 1} / {question.total}</span>
        </div>

        <h2 className="text-center text-lg font-bold text-amber-50/60">
          {question.question}
        </h2>

        <div className="grid flex-1 grid-cols-2 gap-3 opacity-50">
          {question.options.map((option, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-6 text-center font-semibold text-white/60 ${BUTTON_COLORS[i].split(" ")[0]}`}
            >
              {BUTTON_ICONS[i]}
              <span className="text-sm leading-tight sm:text-base">{option}</span>
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-400/15">
          <Eye className="h-8 w-8 text-blue-400" />
        </div>
        <p className="text-lg font-semibold text-amber-50">Laukiame {waitingPlayerName} atsakymo</p>
        <p className="text-amber-200/50">Šį raundą atsako jūsų komandos narys</p>

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
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <p className="text-lg font-semibold text-amber-50">Atsakymas priimtas!</p>
        <p className="text-amber-200/50">Laukiame kitų žaidėjų...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Timer + question number + wager badge */}
      <div className="flex items-center justify-between text-sm text-amber-200/50">
        <span>
          {question.index + 1} / {question.total}
          {question.isWagerRound && (
            <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-bold text-amber-300">
              STATYMAS
            </span>
          )}
        </span>
      </div>

      <Timer
        duration={effectiveDuration}
        startTime={question.startTime}
        onExpire={onTimerExpire}
      />

      {/* Power-ups */}
      {onUsePowerUp && powerUpUses > 0 && (
        <PowerUpBar usesLeft={powerUpUses} onUse={onUsePowerUp} />
      )}

      {/* Question text */}
      <h2 className="text-center text-lg font-bold text-amber-50">
        {isProgressive ? (
          <ProgressiveText text={question.question} visibleWordCount={visibleWordCount} />
        ) : (
          question.question
        )}
      </h2>

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
          {isProgressive ? (
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
      <div className="grid flex-1 grid-cols-2 gap-3">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-6 text-center font-semibold text-white transition-transform active:scale-95 ${BUTTON_COLORS[i]}`}
          >
            {BUTTON_ICONS[i]}
            <span className="text-sm leading-tight sm:text-base">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
