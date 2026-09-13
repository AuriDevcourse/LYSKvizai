"use client";

import { useState, useMemo } from "react";
import { Check, Ruler } from "lucide-react";
import type { QuestionPayload } from "@/lib/multiplayer/types";
import { formatHeight } from "@/lib/games/scale-scoring";
import ScaleStage from "@/components/games/ScaleStage";
import Timer from "./Timer";
import StreakBadge from "./StreakBadge";

/**
 * The slider is logarithmic.
 *
 * A linear one spends most of its travel on the huge end and makes small
 * answers impossible to hit: with a whale as the target and a cat as the
 * reference the useful range spans 125x. These bounds match the solo game.
 */
const MIN_RATIO = 0.08;
const MAX_RATIO = 30;

function ratioFromSlider(t: number): number {
  return MIN_RATIO * Math.pow(MAX_RATIO / MIN_RATIO, t);
}

interface ScaleGuessInputProps {
  question: QuestionPayload;
  /**
   * Resolves true when the server took the guess.
   *
   * The return value is not decoration: this component used to flip itself to
   * "Locked in" the moment the button was pressed, so a player the server
   * refused saw an error toast and a screen telling them their guess was in.
   * In team mode that happened to half the room on every round.
   */
  onAnswer: (metres: number) => Promise<boolean>;
  onTimerExpire: () => void;
  timerReduction?: number;
  eliminated?: boolean;
  streak?: number;
  /** False when a team-mate is the designated answerer this round. */
  canAnswer?: boolean;
  /** Who the room is waiting on, when it is not this player. */
  waitingPlayerName?: string;
}

export default function ScaleGuessInput({
  question,
  onAnswer,
  onTimerExpire,
  timerReduction = 0,
  eliminated = false,
  streak = 0,
  canAnswer = true,
  waitingPlayerName,
}: ScaleGuessInputProps) {
  const [slider, setSlider] = useState(0.5);
  const [submitted, setSubmitted] = useState(false);

  /*
   * Reset for a new round during render, not in an effect.
   *
   * `setState` inside an effect trips `react-hooks/set-state-in-effect` and
   * costs a second render pass, which on this component means the previous
   * round's slider position is painted once before snapping back to centre.
   * This is the same adjust-state-on-prop-change shape the play page uses for
   * its ready flag.
   */
  const [roundKey, setRoundKey] = useState(question.index);
  if (question.index !== roundKey) {
    setRoundKey(question.index);
    setSlider(0.5);
    setSubmitted(false);
  }

  /*
   * Straight from the payload. This component must not import
   * `scale-rounds.ts`: that module pulls in the whole creature table, sizes
   * included, and the target's size is the answer to the round on screen.
   */
  const reference = question.scale?.reference;
  const target = question.scale?.target;

  const ratio = useMemo(() => ratioFromSlider(slider), [slider]);
  // The server's number, and now the only one in reach: the client has no
  // size table to disagree with.
  const referenceHeightM = question.scale?.referenceHeightM ?? 1;
  const guessedM = referenceHeightM * ratio;

  const effectiveDuration = Math.max(5, question.timerDuration - timerReduction);

  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (submitted || sending || eliminated || !canAnswer) return;
    setSending(true);
    const accepted = await onAnswer(guessedM);
    setSending(false);
    // Only the server gets to say the guess is in.
    if (accepted) setSubmitted(true);
  };

  if (eliminated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Ruler className="h-10 w-10 text-white/50" />
        <p className="text-lg font-extrabold text-white/60">Spectator mode</p>
      </div>
    );
  }

  // Team mode: a player who is not the designated answerer is shown who the
  // room is waiting on, rather than a working slider the server will refuse.
  if (!canAnswer && waitingPlayerName) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Ruler className="h-10 w-10 text-white/50" />
        <p className="text-lg font-extrabold text-white">Waiting for {waitingPlayerName}</p>
        <p className="text-sm font-bold text-white/50">They are guessing for your team</p>
      </div>
    );
  }

  // A payload with no pair in it. Better an honest message than a stage with
  // two blanks on it.
  if (!reference || !target) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Ruler className="h-10 w-10 text-white/40" />
        <p className="font-bold text-white/60">This round could not be loaded.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="animate-scale-in flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
          <Check className="h-10 w-10 text-white" />
        </div>
        <p className="text-xl font-extrabold text-white">Locked in</p>
        <p className="font-headline text-4xl font-extrabold tabular-nums text-primary">
          {formatHeight(guessedM)}
        </p>
        <p className="font-bold text-white/50">Waiting for the others</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-center gap-3 text-sm font-bold text-white/50">
        <span>
          {question.index + 1} / {question.total}
        </span>
        <StreakBadge streak={streak} />
      </div>

      <Timer duration={effectiveDuration} startTime={question.startTime} onExpire={onTimerExpire} />

      <div className="glass rounded-2xl px-5 py-4 text-center">
        <div className="mb-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50">
          <Ruler className="h-3.5 w-3.5" />
          Scale
        </div>
        <h2 className="font-headline text-lg font-extrabold text-white">
          How big is the <span className="text-primary">{target.name.toLowerCase()}</span> next to
          the {reference.name.toLowerCase()}?
        </h2>
      </div>

      {/* 260 rather than the solo game's 320: the slider, the readout and the
          lock-in button all have to share a 390px-tall phone with this. */}
      <ScaleStage
        reference={reference}
        target={target}
        ratio={ratio}
        referenceLabel={formatHeight(referenceHeightM)}
        targetLabel={formatHeight(guessedM)}
        height={260}
      />

      <div className="w-full">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={slider}
          onChange={(e) => setSlider(parseFloat(e.target.value))}
          aria-label={`Size of the ${target.name}`}
          aria-valuetext={`${formatHeight(guessedM)}, ${ratio.toFixed(2)} times the ${reference.name}`}
          className="year-slider w-full"
        />
        <div className="mt-2 flex justify-between text-[11px] font-bold uppercase tracking-wider text-white/35">
          <span>smaller</span>
          <span className="tabular-nums text-white/60">
            {ratio.toFixed(2)}x the {reference.name.toLowerCase()}
          </span>
          <span>bigger</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={sending}
          className="btn-primary mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 !text-lg disabled:opacity-60"
        >
          <Check className="h-5 w-5" /> {sending ? "Sending..." : "Lock it in"}
        </button>
      </div>
    </div>
  );
}
