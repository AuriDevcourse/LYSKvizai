"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Palette as PaletteIcon, RotateCcw, Check, Trophy, Eye } from "lucide-react";
import FlagArt from "@/components/games/FlagArt";
import { FLAGS, officialPalette, playableRegions, type Flag, type FlagRegion } from "@/lib/games/flags";
import { adjustHex } from "@/lib/color/convert";
import { scoreSingle, scrambleOne, type TintScramble, type TintResult } from "@/lib/games/tint-scoring";

const ROUNDS = 5;

/**
 * The game
 * --------
 * One region of a flag is shown in the wrong colour; every other region is
 * correct. Three sliders — hue, saturation, lightness — move that one region.
 *
 * The point is recall, not guesswork: you already know roughly what colour the
 * Brazilian green is, and the question is how precisely. That only works with a
 * reference the player has seen a thousand times, which is why these are flags
 * and not invented characters. It's also why the correct answer can be a
 * published Pantone spec rather than an opinion.
 */
interface Round {
  flag: Flag;
  region: FlagRegion;
  /** Colour the region starts at. */
  start: string;
}

function newRound(seenFlags: Set<string>): Round {
  const pool = FLAGS.filter((f) => !seenFlags.has(f.id));
  const source = pool.length ? pool : FLAGS;
  const flag = source[Math.floor(Math.random() * source.length)];
  const options = playableRegions(flag);
  const region = options[Math.floor(Math.random() * options.length)];
  const scramble = scrambleOne(region.hex);
  return { flag, region, start: adjustHex(region.hex, scramble.hue, scramble.sat, scramble.light) };
}

export default function TintGamePage() {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [round, setRound] = useState<Round>(() => newRound(new Set()));
  const [tint, setTint] = useState<TintScramble>({ hue: 0, sat: 1, light: 0 });
  const [result, setResult] = useState<TintResult | null>(null);
  const [roundNo, setRoundNo] = useState(1);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [peeking, setPeeking] = useState(false);

  /** The player's current colour for the scrambled region. */
  const attempt = useMemo(
    () => adjustHex(round.start, tint.hue, tint.sat, tint.light),
    [round.start, tint]
  );

  // Every other region stays official — only the target moves.
  const colors = useMemo(() => {
    const base = officialPalette(round.flag);
    const showTruth = (peeking && !result) || result !== null;
    return { ...base, [round.region.id]: showTruth ? round.region.hex : attempt };
  }, [round, attempt, peeking, result]);

  const lockIn = useCallback(() => {
    if (result) return;
    const r = scoreSingle(round.region.hex, attempt);
    setResult(r);
    setTotal((t) => t + r.points);
  }, [result, round.region.hex, attempt]);

  const next = useCallback(() => {
    if (roundNo >= ROUNDS) { setDone(true); return; }
    const nextSeen = new Set(seen).add(round.flag.id);
    setSeen(nextSeen);
    setRound(newRound(nextSeen));
    setTint({ hue: 0, sat: 1, light: 0 });
    setResult(null);
    setRoundNo((n) => n + 1);
  }, [roundNo, seen, round]);

  const restart = useCallback(() => {
    setSeen(new Set());
    setRound(newRound(new Set()));
    setTint({ hue: 0, sat: 1, light: 0 });
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

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 sm:gap-5">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">{round.flag.name}</p>
          <h1 className="mt-1 text-lg font-bold text-white/90 sm:text-xl">
            Find <span className="text-[#ff9062]">{round.region.label}</span>
          </h1>
        </div>

        {/* The flag. Everything except the target region is already correct, so
            the eye has the real palette right there to judge against. */}
        <div className="surface rounded-3xl p-3">
          <div className="overflow-hidden rounded-xl shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)]">
            <FlagArt
              id={round.flag.id}
              colors={colors}
              width={300}
              title={`Flag of ${round.flag.name}`}
            />
          </div>
        </div>

        {/* Swatch: what the player currently has vs, after locking in, the truth. */}
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="h-10 w-14 rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]"
              style={{ backgroundColor: attempt }}
            />
            <span className="font-headline text-[11px] font-bold uppercase tracking-wider text-white/45">yours</span>
            <span className="font-mono text-[10px] text-white/35">{attempt}</span>
          </div>
          {result && (
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="h-10 w-14 rounded-xl outline outline-2 outline-[#66bb6a] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]"
                style={{ backgroundColor: round.region.hex }}
              />
              <span className="font-headline text-[11px] font-bold uppercase tracking-wider text-white/45">official</span>
              <span className="font-mono text-[10px] text-white/35">{round.region.hex}</span>
            </div>
          )}
        </div>

        {!result ? (
          <div className="w-full max-w-lg space-y-3">
            <Slider label="Hue" value={tint.hue} min={-180} max={180} step={1}
              display={`${tint.hue > 0 ? "+" : ""}${Math.round(tint.hue)}°`}
              onChange={(hue) => setTint((t) => ({ ...t, hue }))} />
            <Slider label="Saturation" value={tint.sat} min={0.2} max={2.2} step={0.01}
              display={`${tint.sat.toFixed(2)}×`}
              onChange={(sat) => setTint((t) => ({ ...t, sat }))} />
            <Slider label="Lightness" value={tint.light} min={-35} max={35} step={0.5}
              display={`${tint.light > 0 ? "+" : ""}${tint.light.toFixed(0)}`}
              onChange={(light) => setTint((t) => ({ ...t, light }))} />

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onPointerDown={() => setPeeking(true)}
                onPointerUp={() => setPeeking(false)}
                onPointerLeave={() => setPeeking(false)}
                className="btn-secondary flex min-h-[52px] items-center gap-2 !px-5 !py-0 !text-base"
                aria-label="Hold to see the official colour"
              >
                <Eye className="h-4 w-4" /> Peek
              </button>
              <button onClick={lockIn} className="btn-primary flex min-h-[52px] flex-1 items-center justify-center gap-2 !text-lg">
                <Check className="h-5 w-5" /> Lock it in
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg text-center">
            <p className={`font-headline text-4xl font-extrabold ${result.points >= 90 ? "text-[#66bb6a]" : "text-white"}`}>
              +{result.points}
            </p>
            <p className="mt-1 text-white/70">{result.verdict}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/45">
              {round.flag.name} specifies {round.region.label} as{" "}
              <span className="font-bold text-white/70">{round.region.spec}</span>. You were
              ΔE{"₀₀"} {result.meanDeltaE.toFixed(1)} away.
            </p>
            <button onClick={next} className="btn-primary mt-6 flex min-h-[52px] w-full items-center justify-center !text-lg">
              {roundNo >= ROUNDS ? "See results" : "Next flag"}
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
