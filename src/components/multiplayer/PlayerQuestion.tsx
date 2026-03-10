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

  useEffect(() => {
    setSelected(null);
  }, [question.index]);

  const { visibleWordCount, blurAmount } = useProgressiveReveal(
    words.length,
    question.timerDuration,
    isProgressive
  );

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
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#e21b3c]/20 px-4 py-2 text-sm font-bold text-white">
          <Eye className="h-4 w-4" />
          Stebėjimo režimas
        </div>

        <div className="text-center text-sm font-bold text-white/50">
          {question.index + 1} / {question.total}
        </div>

        <h2 className="text-center text-lg font-extrabold text-white/60">
          {question.question}
        </h2>

        <div className="grid flex-1 grid-cols-2 gap-3 opacity-40">
          {question.options.map((option, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-6 text-center font-bold text-white ${BUTTON_COLORS[i].split(" ")[0]}`}
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <Eye className="h-8 w-8 text-white" />
        </div>
        <p className="text-lg font-extrabold text-white">Laukiame {waitingPlayerName}</p>
        <p className="font-bold text-white/50">Šį raundą atsako jūsų komandos narys</p>
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
        <p className="text-xl font-extrabold text-white">Priimta!</p>
        <p className="font-bold text-white/50">Laukiame kitų...</p>
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
            STATYMAS
          </span>
        )}
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
      <div className="glass rounded-2xl px-5 py-4 text-center">
        <h2 className="text-lg font-extrabold text-white">
          {isProgressive ? (
            <ProgressiveText text={question.question} visibleWordCount={visibleWordCount} />
          ) : (
            question.question
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
      <div className="grid flex-1 grid-cols-2 gap-3 stagger-children">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`answer-btn flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-6 text-center font-bold text-white ${BUTTON_COLORS[i]}`}
          >
            {BUTTON_ICONS[i]}
            <span className="text-sm leading-tight sm:text-base">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
