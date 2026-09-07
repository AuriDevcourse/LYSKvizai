"use client";

import { useEffect, useState, useMemo } from "react";
import { Check, Triangle, Square, Circle, Diamond, Eye, Shield, Snowflake, Repeat, WifiOff, AlertTriangle } from "lucide-react";
import type { QuestionPayload, PowerUpType } from "@/lib/multiplayer/types";
import { useProgressiveReveal } from "@/hooks/useProgressiveReveal";
import { ZoomOutImage } from "./CountdownVisuals";
import QuizImage from "./QuizImage";
import Timer from "./Timer";
import ProgressiveText from "./ProgressiveText";
import ProgressiveImage from "./ProgressiveImage";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import StreakBadge from "./StreakBadge";
import { haptic } from "@/lib/haptics";
import { ANSWER_BG, ANSWER_TEXT } from "@/lib/answer-options";

// The phone used its own darker shades, so the answer a player tapped was a
// different colour from the same answer on the host screen. Same palette now.
//
// No hover/active utilities here: `.answer-btn` already owns both, and it
// disables them under `prefers-reduced-motion`. Two systems were applying
// competing `filter: brightness(...)` values to the same element, and the
// Tailwind one skipped the reduced-motion guard entirely.
const BUTTON_COLORS = ANSWER_BG;

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
};

interface PlayerQuestionProps {
  question: QuestionPayload;
  /**
   * Submits the answer. Resolving to `false` means the server refused it —
   * usually because the question had already closed — which the UI has to
   * show, or a late tap is indistinguishable from never tapping.
   */
  onAnswer: (index: number) => void | Promise<boolean | void>;
  onTimerExpire: () => void;
  timerReduction?: number;
  playerId?: string;
  eliminated?: boolean;
  canAnswer?: boolean;
  waitingPlayerName?: string;
  onChoosePowerUp?: (powerUp: "freeze" | "shield" | "double") => void;
  /** The player's current answer streak, for the live badge. */
  streak?: number;
  /** How many players have answered, for the wait after committing. */
  answerCount?: { count: number; total: number } | null;
  /** False while the SSE stream is down. */
  connected?: boolean;
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
  streak = 0,
  answerCount,
  connected = true,
}: PlayerQuestionProps) {
  const { t } = useTranslation();
  const qText = question.question;
  const qOptions = question.options;
  const [selected, setSelected] = useState<number | null>(null);
  /** Set when the server refused the answer, so the player isn't left believing it landed. */
  const [rejected, setRejected] = useState(false);
  const [lastQuestionIndex, setLastQuestionIndex] = useState(question.index);
  const isProgressive = question.progressiveReveal ?? false;
  const words = qText.split(/\s+/);

  // Find this player's assigned power-up for this round
  const myPowerUp = useMemo(() => {
    if (!playerId || !question.roundPowerUps) return null;
    const entry = question.roundPowerUps.find((p) => p.playerId === playerId);
    return entry?.powerUp ?? null;
  }, [playerId, question.roundPowerUps]);

  if (lastQuestionIndex !== question.index) {
    setLastQuestionIndex(question.index);
    setSelected(null);
  }

  const { visibleWordCount, blurAmount } = useProgressiveReveal(
    words.length,
    question.timerDuration,
    isProgressive
  );

  const effectiveDuration = Math.max(5, question.timerDuration - timerReduction);

  // For zoom-out: track fraction to drive zoom level

  // For true-false: only show non-empty options, preserving original indices
  const visibleOptions = useMemo(() => {
    return qOptions.map((opt, i) => ({ opt, i })).filter(({ opt }) => opt !== "");
  }, [qOptions]);

  const handleSelect = async (index: number) => {
    if (selected !== null || eliminated || !canAnswer) return;
    setSelected(index);
    setRejected(false);
    // Confirm the tap in the hand — players are watching the host screen, not
    // their own phone, at the moment they commit.
    haptic("commit");

    // A tap that arrives after the question closes used to leave "Locked in"
    // on screen and then turn up as "No Answer" in the results, with nothing
    // in between to explain it. Put the choice back and say what happened.
    const accepted = await onAnswer(index);
    if (accepted === false) {
      setSelected(null);
      setRejected(true);
      haptic("error");
    }
  };

  /**
   * Number keys 1-4 answer.
   *
   * The convention in every timed quiz game, and the only way to play at speed
   * on a laptop or with a switch device — tabbing to the fourth button and
   * hitting Enter is not a competitive option against a 20-second clock.
   *
   * Bound to the document rather than the buttons so it works without first
   * focusing anything, and skipped while a text field has focus so it can't
   * eat a keystroke meant for an input.
   */
  useEffect(() => {
    if (selected !== null || eliminated || !canAnswer || !connected) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;

      // `e.code` rather than `e.key`, so it works on layouts where the
      // unshifted digit isn't a digit.
      const match = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
      if (!match) return;
      const nth = Number(match[1]) - 1;
      const option = visibleOptions[nth];
      if (!option) return;
      e.preventDefault();
      void handleSelect(option.i);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // No dependency array on purpose. `handleSelect` is recreated every render,
    // so any list that included it would re-bind every render anyway — and a
    // list that left it out would capture a stale `selected` and let a second
    // keypress submit a second answer. Re-binding one listener per render is
    // cheap now that this component no longer re-renders at 10Hz (see 9.5).
  });

  // Eliminated: spectator mode
  if (eliminated) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-error/20 px-4 py-2 text-sm font-bold text-white">
          <Eye className="h-4 w-4" />
          {t("playerQuestion.spectatorMode")}
        </div>

        <div className="text-center text-sm font-bold text-white/50">
          {question.index + 1} / {question.total}
        </div>

        <h2 className="text-center text-lg font-extrabold text-white/60">
          {qText}
        </h2>

        <div className={`grid gap-3 opacity-40 ${visibleOptions.length <= 2 ? "grid-cols-1 max-w-sm mx-auto w-full" : "grid-cols-2"}`}>
          {visibleOptions.map(({ opt, i }) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-6 text-center font-bold ${ANSWER_TEXT} ${BUTTON_COLORS[i].split(" ")[0]}`}
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
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
        {/* Zoom-out: show fully revealed image after answering */}
        {question.type === "zoom-out" && question.image && (
          <div className="w-full max-w-sm">
            {/* The reveal: no transform, just the picture at its real size. */}
            <QuizImage src={question.image} heightClass="h-40" className="rounded-xl" />
          </div>
        )}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <Check className="h-8 w-8 text-white" />
        </div>
        <p className="text-xl font-extrabold text-white">{t("playerQuestion.lockedIn")}</p>
        <p className="font-bold text-white/50">{t("playerQuestion.waitingForOthers")}</p>

        {/* 4.1 — `answerCount` was already broadcast to the whole room and only
            the host rendered it, so this screen was blank space while players
            wondered whether anything was happening. */}
        {answerCount != null && answerCount.total > 0 && (
          <div className="flex w-full max-w-[220px] flex-col gap-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-answer-green transition-all duration-500"
                style={{ width: `${Math.min(100, (answerCount.count / answerCount.total) * 100)}%` }}
              />
            </div>
            <p className="text-center text-xs font-bold tabular-nums text-white/45">
              {answerCount.count} of {answerCount.total} answered
            </p>
          </div>
        )}

        <StreakBadge streak={streak} />
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
      {/* Timer + question number + live streak */}
      <div className="flex items-center justify-center gap-3 text-sm font-bold text-white/50">
        <span>
          {question.index + 1} / {question.total}
        </span>
        {question.isWagerRound && (
          <span className="rounded-lg bg-answer-yellow/20 px-2 py-0.5 text-xs font-extrabold text-answer-yellow">
            {t("hostQuestion.wager")}
          </span>
        )}
        <StreakBadge streak={streak} />
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
            <ZoomOutImage
              src={question.image}
              duration={effectiveDuration}
              startTime={question.startTime}
              className="h-32"
            />
          ) : isProgressive ? (
            <ProgressiveImage
              src={question.image}
              blurAmount={blurAmount}
              className="h-32"
            />
          ) : (
            <QuizImage src={question.image} heightClass="h-32" priority />
          )}
        </div>
      )}

      {/* A refused answer, explained. Otherwise the player taps, sees nothing
          change, and finds out at the reveal that they scored zero. */}
      {rejected && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-error/15 px-4 py-2.5 text-sm font-bold text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          That didn&apos;t go through — tap again
        </div>
      )}

      {/* 4.8 — the buttons used to stay bright and tappable with the stream
          down, so a tap would fail silently. */}
      {!connected && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-bold text-white/60">
          <WifiOff className="h-4 w-4 shrink-0" />
          Reconnecting — your tap won&apos;t count yet
        </div>
      )}

      {/* Big answer buttons */}
      <div className={`grid gap-3 stagger-children ${visibleOptions.length <= 2 ? "grid-cols-1 max-w-sm mx-auto w-full" : "grid-cols-2"}`}>
        {visibleOptions.map(({ opt, i }, n) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={!connected}
            aria-keyshortcuts={`${n + 1}`}
            aria-label={`Answer ${n + 1}: ${opt}`}
            className={`answer-btn relative flex min-h-[4.5rem] flex-col items-center justify-center gap-2 rounded-2xl px-3 py-5 text-center font-bold disabled:cursor-not-allowed disabled:opacity-40 ${ANSWER_TEXT} ${BUTTON_COLORS[i]}`}
          >
            {/* Only worth showing where there's a keyboard to press. */}
            <span
              aria-hidden="true"
              className="absolute left-2 top-1.5 hidden text-[11px] font-black opacity-40 sm:block"
            >
              {n + 1}
            </span>
            {BUTTON_ICONS[i]}
            <span className="text-sm leading-tight sm:text-base">{opt}</span>
          </button>
        ))}
      </div>

      {/* Power-up chooser (below answers, safe from accidental taps) */}
      {onChoosePowerUp && !myPowerUp && (question.powerUpUsesLeft ?? 0) > 0 && (
        <div className="mt-2">
          <p className="mb-1.5 text-center text-[10px] font-bold text-white/45 uppercase tracking-wider">
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
