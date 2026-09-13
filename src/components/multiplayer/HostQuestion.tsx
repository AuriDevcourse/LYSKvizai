"use client";

import { Snowflake, Shield, Repeat, FastForward } from "lucide-react";
import type { QuestionPayload, PowerUpType } from "@/lib/multiplayer/types";
import { TimerBar, TimerCircle, ZoomOutImage } from "./CountdownVisuals";
import QuizImage from "./QuizImage";
import { useProgressiveReveal } from "@/hooks/useProgressiveReveal";
import ProgressiveText from "./ProgressiveText";
import ProgressiveImage from "./ProgressiveImage";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { ANSWER_BG, ANSWER_ICONS, ANSWER_TEXT } from "@/lib/answer-options";
import CreatureArt from "@/components/games/CreatureArt";
import { formatHeight } from "@/lib/games/scale-scoring";

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
  /**
   * Ends the question early and shows the results. Same server action the
   * timer fires; this is just the host choosing the moment.
   */
  onReveal?: () => void;
  players?: { id: string; name: string; teamIndex?: number | null }[];
  /** Team names, so team mode can say whose turn it is. */
  teamNames?: string[];
}

/**
 * What each question type is called on the big screen.
 *
 * Types absent from this table get no chip. "standard" is deliberately absent:
 * a normal question needs no label. The three `__`-prefixed values are looked
 * up in the translation table by the component; the rest are literal.
 */
const TYPE_LABELS: Partial<Record<NonNullable<QuestionPayload["type"]>, string>> = {
  bluff: "__bluff",
  audio: "__audio",
  video: "__video",
  "true-false": "TRUE / FALSE",
  "zoom-out": "ZOOM OUT",
  "year-guesser": "YEAR",
  "fastest-finger": "RAPID FIRE",
  scale: "SCALE",
};

export default function HostQuestion({
  question,
  answerCount,
  onTimerExpire,
  onReveal,
  players = [],
  teamNames = [],
}: HostQuestionProps) {
  const { t } = useTranslation();
  const qText = question.question;
  const qOptions = question.options;
  const isScale = question.type === "scale";
  const reference = question.scale?.reference;
  const count = answerCount?.count ?? 0;
  const isProgressive = question.progressiveReveal ?? false;
  const words = qText.split(/\s+/);

  const { visibleWordCount, blurAmount } = useProgressiveReveal(
    words.length,
    question.timerDuration,
    isProgressive
  );

  const allAnswered = answerCount != null && answerCount.total > 0 && answerCount.count >= answerCount.total;

  /**
   * In team mode only one player per team may answer each round. The players
   * knew whose turn it was on their own phones; the screen everyone is
   * actually looking at never said, so the room had no idea who to shout at.
   */
  const answerers = question.currentTeamAnswerers
    ?.map((id) => players.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p)) ?? [];

  return (
    <div className="flex flex-1 flex-col">
      {/* TOP: Question number + timer bar */}
      <div className="flex items-center gap-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/[0.07] px-3 py-1 text-sm font-extrabold tabular-nums text-white/75">
            {question.index + 1} / {question.total}
          </div>
          {question.isWagerRound && (
            <span className="rounded-lg bg-answer-yellow/20 px-2 py-1 text-xs font-extrabold text-answer-yellow">
              {t("hostQuestion.wager")}
            </span>
          )}
          {/* The chip used to be a ternary chain whose final `else` was "VIDEO",
              so every type it did not know about announced itself as a video
              round. Adding the scale round put "VIDEO" above a giraffe. A table
              with an explicit entry per type cannot do that: an unlabelled type
              now shows no chip rather than the wrong one. */}
          {question.type && TYPE_LABELS[question.type] && (
            <span className="rounded-lg bg-purple-500/20 px-2 py-1 text-xs font-extrabold text-purple-300">
              {TYPE_LABELS[question.type] === "__bluff" ? t("hostQuestion.bluff")
                : TYPE_LABELS[question.type] === "__audio" ? t("hostQuestion.audio")
                : TYPE_LABELS[question.type] === "__video" ? t("hostQuestion.video")
                : TYPE_LABELS[question.type]}
            </span>
          )}
        </div>
        <TimerBar duration={question.timerDuration} startTime={question.startTime} />
      </div>

      {/* Whose turn it is, in team mode. The room is looking at this screen,
          so this is where the name has to be. */}
      {answerers.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
            Answering
          </span>
          {answerers.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-primary/20 px-3 py-1 text-sm font-extrabold text-primary"
            >
              {p.name}
              {p.teamIndex != null && teamNames[p.teamIndex] && (
                <span className="ml-1.5 font-bold text-primary/60">
                  {teamNames[p.teamIndex]}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

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
        <TimerCircle
          duration={question.timerDuration}
          startTime={question.startTime}
          onExpire={onTimerExpire}
        />

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
                <ZoomOutImage
                  src={question.image}
                  duration={question.timerDuration}
                  startTime={question.startTime}
                  settled={allAnswered}
                  className="h-40 sm:h-52"
                />
              ) : isProgressive ? (
                <ProgressiveImage
                  src={question.image}
                  blurAmount={blurAmount}
                  className="h-40 sm:h-52"
                />
              ) : (
                <QuizImage
                  src={question.image}
                  heightClass="h-40 sm:h-52"
                  sizes="448px"
                  priority
                />
              )}
            </div>
          )}
        </div>

        {/* Answer count. The denominator matters: "7" tells the host nothing,
            "7/8" tells them to wait and "7/30" tells them not to. */}
        <div className="flex shrink-0 flex-col items-center">
          <span className="font-headline text-3xl font-black text-white sm:text-4xl">
            {count}
            {answerCount != null && answerCount.total > 0 && (
              <span className="text-white/35">/{answerCount.total}</span>
            )}
          </span>
          <span className="text-xs font-bold text-white/50 sm:text-sm">
            {t("hostQuestion.answered")}
          </span>

          {onReveal && (
            <button
              type="button"
              onClick={onReveal}
              className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-full bg-white/8 px-4 text-xs font-bold text-white/60 transition-colors hover:bg-white/15 hover:text-white"
            >
              <FastForward className="h-3.5 w-3.5" />
              Reveal now
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM: the reference creature, for a scale round.
          A scale round has no options, and the empty 2x2 grid rendered four
          blank coloured blocks under the question. What the room actually wants
          on the big screen is the thing everyone is measuring against, at the
          size the phones are drawing it, with its real height printed. The
          target is not shown: that is the answer. */}
      {isScale && reference ? (
        <div className="flex min-h-[38vh] flex-col items-center justify-center gap-4 pt-4">
          <CreatureArt
            id={reference.id}
            palette={reference.palette}
            height={200}
            artFraction={reference.artFraction}
            title={reference.name}
          />
          <div className="text-center">
            <p className="font-headline text-xl font-extrabold text-white">{reference.name}</p>
            <p className="font-headline text-3xl font-extrabold text-secondary">
              {formatHeight(question.scale!.referenceHeightM)}
            </p>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
