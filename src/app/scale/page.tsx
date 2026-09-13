"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Ruler, Check, Trophy } from "lucide-react";
import ScaleStage from "@/components/games/ScaleStage";
import { type ScaleCreature } from "@/lib/games/creatures";
// The pool moved to `scale-rounds.ts` when multiplayer started drawing from it
// too. One list, so the two games cannot disagree about the cast.
import { SCALE_POOL } from "@/lib/games/scale-rounds";
import { scoreScale, formatHeight, pickPair, type ScaleResult } from "@/lib/games/scale-scoring";

const ROUNDS = 6;

/**
 * How the guess works
 * -------------------
 * The reference creature is drawn at a fixed on-screen height with its real size
 * labelled. The player scales the target with a slider until it looks right
 * *next to that reference*. Their slider position implies a real-world height:
 *
 *     guessedM = referenceM × (targetPixels / referencePixels)
 *
 * So the player is really answering "how many reference-heights tall is this?",
 * which is the question a person can actually reason about, rather than being
 * asked to type a number in metres.
 *
 * The slider is logarithmic. A linear slider would spend most of its travel on
 * the huge end and make small answers impossible to hit — with a blue whale as
 * the target and a cat as the reference the useful range spans 125×.
 */
const MIN_RATIO = 0.08;
const MAX_RATIO = 30;

function ratioFromSlider(t: number): number {
  return MIN_RATIO * Math.pow(MAX_RATIO / MIN_RATIO, t);
}

interface Round {
  reference: ScaleCreature;
  target: ScaleCreature;
}

function newRound(seen: Set<string>, choose?: (count: number) => number): Round {
  const [reference, target] = pickPair(SCALE_POOL, seen, choose);
  return { reference, target };
}

export default function ScaleGamePage() {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  /**
   * The first pair is fixed, not random.
   *
   * `pickPair` normally draws at random, which in a state initialiser means the
   * server renders one pair and the client another — a hydration mismatch that
   * makes React discard the tree. So the server-rendered round is deterministic
   * and the effect below swaps in a random one once we're on the client.
   */
  const [round, setRound] = useState<Round>(() => newRound(new Set(), () => 0));
  const [slider, setSlider] = useState(0.5);
  const [result, setResult] = useState<ScaleResult | null>(null);
  const [roundNo, setRoundNo] = useState(1);
  const [total, setTotal] = useState(0);
  /*
   * Sum of the unrounded per-round accuracies, kept apart from `total`.
   *
   * The average used to be `total / ROUNDS`, which averages numbers that were
   * already rounded — fine at 0 decimals, but reporting one decimal from that
   * claims precision the figure does not have. Summing the precise values makes
   * the displayed average actually correct to the digit shown.
   */
  const [accuracySum, setAccuracySum] = useState(0);
  const [done, setDone] = useState(false);

  // Deferred a microtask rather than set during render: this is the point where
  // the randomness is safe, because only the client runs it.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) setRound(newRound(new Set())); });
    return () => { cancelled = true; };
  }, []);

  const ratio = useMemo(() => ratioFromSlider(slider), [slider]);
  const guessedM = round.reference.heightM * ratio;

  // Where the target *should* be, for the reveal.
  const trueRatio = round.target.heightM / round.reference.heightM;

  const lockIn = useCallback(() => {
    if (result) return;
    const r = scoreScale(guessedM, round.target.heightM);
    setResult(r);
    setTotal((t) => t + r.points);
    setAccuracySum((a) => a + r.accuracy);
  }, [result, guessedM, round.target.heightM]);

  const next = useCallback(() => {
    if (roundNo >= ROUNDS) { setDone(true); return; }
    const nextSeen = new Set(seen).add(round.reference.id).add(round.target.id);
    setSeen(nextSeen);
    setRound(newRound(nextSeen));
    setSlider(0.5);
    setResult(null);
    setRoundNo((n) => n + 1);
  }, [roundNo, seen, round]);

  const restart = useCallback(() => {
    setSeen(new Set());
    setRound(newRound(new Set()));
    setSlider(0.5);
    setResult(null);
    setRoundNo(1);
    setTotal(0);
    setAccuracySum(0);
    setDone(false);
  }, []);

  if (done) {
    const avg = accuracySum / ROUNDS;
    return (
      <div className="rise flex min-h-svh flex-col items-center justify-center gap-7 px-5 py-10">
        <Trophy className="h-14 w-14 text-answer-yellow drop-shadow-[0_0_20px_rgba(201,168,37,0.7)]" />
        <div className="text-center">
          <h1 className="font-headline neon text-5xl font-extrabold tracking-tight sm:text-6xl">{total}</h1>
          <p className="mt-2 text-white/55">out of {ROUNDS * 100} · {avg.toFixed(1)}% average accuracy</p>
        </div>
        <div className="flex gap-3">
          <button onClick={restart} className="btn-primary flex min-h-[48px] items-center gap-2 !px-7 !py-0 !text-base">
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
          <Link href="/" className="btn-secondary flex min-h-[48px] items-center !px-7 !py-0 !text-base">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col px-5 py-6 sm:py-8">
      {/* Header */}
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <Link href="/" aria-label="Back to home" className="tap-target -ml-2 rounded-full text-white/45 transition-colors hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
          <Ruler className="h-3.5 w-3.5" />
          Round {roundNo} / {ROUNDS}
        </div>
        <div className="font-headline text-lg font-extrabold tabular-nums text-white">{total}</div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8">
        <h1 className="font-headline text-center text-lg font-bold text-white/85 sm:text-xl">
          How big is the{" "}
          <span className="text-primary">{round.target.name.toLowerCase()}</span>{" "}
          next to the {round.reference.name.toLowerCase()}?
        </h1>

        {/* The stage. Shared with the multiplayer scale round so the two games
            cannot drift apart on what the player is actually judging. */}
        <ScaleStage
          reference={round.reference}
          target={round.target}
          ratio={ratio}
          revealRatio={result ? trueRatio : undefined}
          referenceLabel={formatHeight(round.reference.heightM)}
          targetLabel={result ? formatHeight(result.actualM) : formatHeight(guessedM)}
        />

        {/* Control */}
        {!result ? (
          <div className="w-full max-w-lg">
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={slider}
              onChange={(e) => setSlider(parseFloat(e.target.value))}
              aria-label={`Size of the ${round.target.name}`}
              aria-valuetext={`${formatHeight(guessedM)}, ${ratio.toFixed(2)} times the ${round.reference.name}`}
              className="year-slider w-full"
            />
            <div className="mt-2 flex justify-between text-[11px] font-bold uppercase tracking-wider text-white/35">
              <span>smaller</span>
              <span className="tabular-nums text-white/60">{ratio.toFixed(2)}× the {round.reference.name.toLowerCase()}</span>
              <span>bigger</span>
            </div>
            <button onClick={lockIn} className="btn-primary mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 !text-lg">
              <Check className="h-5 w-5" /> Lock it in
            </button>
          </div>
        ) : (
          <div className="w-full max-w-lg text-center">
            <p className={`font-headline text-4xl font-extrabold ${result.isBullseye ? "text-answer-green" : "text-white"}`}>
              +{result.points}
            </p>
            {/* The precise figure behind the points. `points` is rounded because
                it is summed into the score; this is the same measure to one
                decimal, so a near-miss reads as 99.4% rather than a flat 99. */}
            <p className="mt-1 font-headline text-lg font-extrabold tabular-nums text-primary">
              {result.accuracy.toFixed(1)}% accurate
            </p>
            <p className="mt-1 text-white/70">
              {result.isBullseye ? "Spot on." : `You were ${result.verdict}.`}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/45">
              A {round.target.name.toLowerCase()} is {formatHeight(result.actualM)} —{" "}
              {round.target.measure}. {round.target.source}.
            </p>
            <button onClick={next} className="btn-primary mt-6 flex min-h-[52px] w-full items-center justify-center !text-lg">
              {roundNo >= ROUNDS ? "See results" : "Next round"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
