"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Ruler, Check, Trophy } from "lucide-react";
import CreatureArt from "@/components/games/CreatureArt";
import { CREATURES, type Creature } from "@/lib/games/creatures";

/** Only entries measured by height — see `inScaleGame` for why the whale is out. */
const SCALE_POOL = CREATURES.filter((c) => c.inScaleGame);
import { scoreScale, formatHeight, pickPair, type ScaleResult } from "@/lib/games/scale-scoring";

const ROUNDS = 6;

/** Reference art is always drawn this tall, and everything else is judged against it. */
const REF_PX = 120;
/** Stage height, including room for the labels pinned under the baseline. */
const STAGE_H = 320;
/** Usable drawing height above the baseline. */
const STAGE_DRAW_H = STAGE_H - 80;

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
  reference: Creature;
  target: Creature;
}

function newRound(seen: Set<string>): Round {
  const [reference, target] = pickPair(SCALE_POOL, seen);
  return { reference, target };
}

export default function ScaleGamePage() {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [round, setRound] = useState<Round>(() => newRound(new Set()));
  const [slider, setSlider] = useState(0.5);
  const [result, setResult] = useState<ScaleResult | null>(null);
  const [roundNo, setRoundNo] = useState(1);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);

  const ratio = useMemo(() => ratioFromSlider(slider), [slider]);
  const targetPx = REF_PX * ratio;
  const guessedM = round.reference.heightM * ratio;

  // Where the target *should* be, for the reveal.
  const trueRatio = round.target.heightM / round.reference.heightM;
  const truePx = REF_PX * trueRatio;

  // One shared shrink factor so the tallest thing on the stage — the reference,
  // the player's current guess, or (after lock-in) the true answer — still fits.
  const tallest = Math.max(
    REF_PX / round.reference.artFraction,
    targetPx / round.target.artFraction,
    result ? truePx / round.target.artFraction : 0
  );
  const fit = Math.min(1, STAGE_DRAW_H / Math.max(1, tallest));

  const lockIn = useCallback(() => {
    if (result) return;
    const r = scoreScale(guessedM, round.target.heightM);
    setResult(r);
    setTotal((t) => t + r.points);
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
    setDone(false);
  }, []);

  if (done) {
    const avg = Math.round(total / ROUNDS);
    return (
      <div className="rise flex min-h-svh flex-col items-center justify-center gap-7 px-5 py-10">
        <Trophy className="h-14 w-14 text-[#c9a825] drop-shadow-[0_0_20px_rgba(201,168,37,0.7)]" />
        <div className="text-center">
          <h1 className="font-headline neon text-5xl font-extrabold tracking-tight sm:text-6xl">{total}</h1>
          <p className="mt-2 text-white/55">out of {ROUNDS * 100} · {avg}% average accuracy</p>
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
        <h1 className="text-center text-lg font-bold text-white/85 sm:text-xl">
          How big is the{" "}
          <span className="text-[#ff9062]">{round.target.name.toLowerCase()}</span>{" "}
          next to the {round.reference.name.toLowerCase()}?
        </h1>

        {/* The stage.
            Both creatures stand on one baseline, because the only thing being
            judged is height — anything else in the layout is noise. Everything
            is then scaled by a single `fit` factor so that whatever the player
            drags to, and the true answer, both stay inside the frame. Without
            that, dragging to the top of the slider pushes the creature off
            screen and the player loses the very feedback they're using. */}
        <div className="surface relative w-full overflow-hidden rounded-3xl" style={{ height: STAGE_H }}>
          <div className="absolute inset-x-0 bottom-14 h-px bg-white/10" />
          <div className="absolute inset-x-0 bottom-14 flex items-end justify-center gap-10 px-6 sm:gap-20">
            <div className="flex flex-col items-center">
              <CreatureArt
                id={round.reference.id}
                palette={round.reference.palette}
                height={REF_PX * fit}
                artFraction={round.reference.artFraction}
                title={round.reference.name}
              />
            </div>

            <div className="relative flex items-end">
              {/* Ghost of the true size, revealed on lock-in — the fastest way
                  to see how far off you were. */}
              {result && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-25">
                  <CreatureArt
                    id={round.target.id}
                    palette={["#ffffff", "#ffffff", "#ffffff", "#ffffff"]}
                    height={truePx * fit}
                    artFraction={round.target.artFraction}
                  />
                </div>
              )}
              <CreatureArt
                id={round.target.id}
                palette={round.target.palette}
                height={targetPx * fit}
                artFraction={round.target.artFraction}
                title={round.target.name}
              />
            </div>
          </div>

          {/* Labels pinned below the baseline so they never move as things scale. */}
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-10 px-6 text-center sm:gap-20">
            <div className="w-28">
              <p className="truncate text-xs font-extrabold text-white">{round.reference.name}</p>
              <p className="font-headline text-base font-extrabold text-[#43a5fc]">
                {formatHeight(round.reference.heightM)}
              </p>
            </div>
            <div className="w-28">
              <p className="truncate text-xs font-extrabold text-white">{round.target.name}</p>
              <p className="font-headline text-base font-extrabold tabular-nums text-[#ff9062]">
                {result ? formatHeight(result.actualM) : formatHeight(guessedM)}
              </p>
            </div>
          </div>
        </div>

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
            <p className={`font-headline text-4xl font-extrabold ${result.isBullseye ? "text-[#66bb6a]" : "text-white"}`}>
              +{result.points}
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
