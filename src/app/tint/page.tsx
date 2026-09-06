"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Palette as PaletteIcon, RotateCcw, Check, Trophy, Eye } from "lucide-react";
import CreatureArt from "@/components/games/CreatureArt";
import { CREATURES, type Creature } from "@/lib/games/creatures";
import {
  applyTint, randomScramble, scoreTint,
  type TintScramble, type TintResult,
} from "@/lib/games/tint-scoring";

const ROUNDS = 5;

interface Round {
  creature: Creature;
  scramble: TintScramble;
  /** The palette the player starts from. */
  scrambled: string[];
}

function newRound(seen: Set<string>): Round {
  const pool = CREATURES.filter((c) => !seen.has(c.id));
  const creature = (pool.length ? pool : CREATURES)[
    Math.floor(Math.random() * (pool.length ? pool.length : CREATURES.length))
  ];
  const scramble = randomScramble(Math.random, creature.palette);
  return { creature, scramble, scrambled: applyTint(creature.palette, scramble) };
}

export default function TintGamePage() {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [round, setRound] = useState<Round>(() => newRound(new Set()));
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(1);
  const [light, setLight] = useState(0);
  const [result, setResult] = useState<TintResult | null>(null);
  const [roundNo, setRoundNo] = useState(1);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [peeking, setPeeking] = useState(false);

  // What the player is currently looking at: the scrambled palette with their
  // correction applied on top. Same transform the scramble used, so an exact
  // undo is always reachable.
  const current = useMemo(
    () => applyTint(round.scrambled, { hue, sat, light }),
    [round.scrambled, hue, sat, light]
  );

  const lockIn = useCallback(() => {
    if (result) return;
    const r = scoreTint(round.creature.palette, current);
    setResult(r);
    setTotal((t) => t + r.points);
  }, [result, round.creature.palette, current]);

  const next = useCallback(() => {
    if (roundNo >= ROUNDS) { setDone(true); return; }
    const nextSeen = new Set(seen).add(round.creature.id);
    setSeen(nextSeen);
    setRound(newRound(nextSeen));
    setHue(0); setSat(1); setLight(0);
    setResult(null);
    setRoundNo((n) => n + 1);
  }, [roundNo, seen, round]);

  const restart = useCallback(() => {
    setSeen(new Set());
    setRound(newRound(new Set()));
    setHue(0); setSat(1); setLight(0);
    setResult(null);
    setRoundNo(1); setTotal(0); setDone(false);
  }, []);

  if (done) {
    return (
      <div className="rise flex min-h-svh flex-col items-center justify-center gap-7 px-5 py-10">
        <Trophy className="h-14 w-14 text-[#c9a825] drop-shadow-[0_0_20px_rgba(201,168,37,0.7)]" />
        <div className="text-center">
          <h1 className="font-headline neon text-5xl font-extrabold tracking-tight sm:text-6xl">{total}</h1>
          <p className="mt-2 text-white/55">out of {ROUNDS * 100}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={restart} className="btn-primary flex min-h-[48px] items-center gap-2 !px-7 !py-0 !text-base">
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
          <Link href="/" className="btn-secondary flex min-h-[48px] items-center !px-7 !py-0 !text-base">Home</Link>
        </div>
      </div>
    );
  }

  const shown = peeking && !result ? round.creature.palette : current;

  return (
    <div className="flex min-h-svh flex-col px-5 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <Link href="/" aria-label="Back to home" className="tap-target -ml-2 rounded-full text-white/45 transition-colors hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
          <PaletteIcon className="h-3.5 w-3.5" />
          Round {roundNo} / {ROUNDS}
        </div>
        <div className="font-headline text-lg font-extrabold tabular-nums text-white">{total}</div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6">
        <h1 className="text-center text-lg font-bold text-white/85 sm:text-xl">
          Put the <span className="text-[#ff9062]">{round.creature.name.toLowerCase()}</span> back to its real colours
        </h1>

        <div className="surface relative flex w-full items-center justify-center rounded-3xl py-8">
          <CreatureArt
            id={round.creature.id}
            palette={shown}
            height={200}
            title={round.creature.name}
          />
          {result && (
            <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Original</span>
              <div className="rounded-xl bg-white/5 p-2">
                <CreatureArt id={round.creature.id} palette={round.creature.palette} height={70} />
              </div>
            </div>
          )}
        </div>

        {/* Palette read-out — the four slots being scored. */}
        <div className="flex items-center gap-3">
          {shown.map((hex, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={`h-9 w-9 rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] ${
                  result && i === result.worstIndex ? "outline outline-2 outline-[#ff716c]" : ""
                }`}
                style={{ backgroundColor: hex }}
              />
              {result && (
                <div className="h-6 w-6 rounded-md opacity-70" style={{ backgroundColor: round.creature.palette[i] }} />
              )}
            </div>
          ))}
        </div>

        {!result ? (
          <div className="w-full max-w-lg space-y-4">
            <Slider label="Hue" value={hue} min={-180} max={180} step={1}
              display={`${hue > 0 ? "+" : ""}${Math.round(hue)}°`} onChange={setHue} />
            <Slider label="Saturation" value={sat} min={0.2} max={2.2} step={0.01}
              display={`${sat.toFixed(2)}×`} onChange={setSat} />
            <Slider label="Lightness" value={light} min={-35} max={35} step={0.5}
              display={`${light > 0 ? "+" : ""}${light.toFixed(0)}`} onChange={setLight} />

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onMouseDown={() => setPeeking(true)}
                onMouseUp={() => setPeeking(false)}
                onMouseLeave={() => setPeeking(false)}
                onTouchStart={() => setPeeking(true)}
                onTouchEnd={() => setPeeking(false)}
                className="btn-secondary flex min-h-[52px] items-center gap-2 !px-5 !py-0 !text-base"
                aria-label="Hold to peek at the original colours"
              >
                <Eye className="h-4 w-4" /> Peek
              </button>
              <button onClick={lockIn} className="btn-primary flex min-h-[52px] flex-1 items-center justify-center gap-2 !text-lg">
                <Check className="h-5 w-5" /> Lock it in
              </button>
            </div>
            <p className="text-center text-xs text-white/35">
              Peek shows the real colours while you hold it. Using it costs nothing but time.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-lg text-center">
            <p className={`font-headline text-4xl font-extrabold ${result.points >= 90 ? "text-[#66bb6a]" : "text-white"}`}>
              +{result.points}
            </p>
            <p className="mt-1 text-white/70">{result.verdict}</p>
            <p className="mt-3 text-sm text-white/45">
              Average colour difference ΔE{"₀₀"} {result.meanDeltaE.toFixed(1)}
              {result.meanDeltaE > 2 && <> · furthest off was swatch {result.worstIndex + 1} at {result.worstDeltaE.toFixed(1)}</>}
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

function Slider({
  label, value, min, max, step, display, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={`slider-${label}`} className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
          {label}
        </label>
        <span className="font-headline text-sm font-extrabold tabular-nums text-white/80">{display}</span>
      </div>
      <input
        id={`slider-${label}`}
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-valuetext={`${label} ${display}`}
        className="year-slider w-full"
      />
    </div>
  );
}
