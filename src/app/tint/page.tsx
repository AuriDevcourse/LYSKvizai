"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Palette as PaletteIcon, RotateCcw, Check, Trophy, Eye } from "lucide-react";
import FlagArt from "@/components/games/FlagArt";
import ImageTint from "@/components/games/ImageTint";
import TransitDiagram from "@/components/games/TransitDiagram";
import { FLAGS, officialPalette, playableRegions, type Flag, type FlagRegion } from "@/lib/games/flags";
import { loadLocalRounds, type LocalImageRound } from "@/lib/games/local-images";
import { playableLines, diagramFor, TFL_STANDARD, type TransitLine } from "@/lib/games/transit";
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
/**
 * A round is either a flag or one of the player's own local images. Both work
 * the same way — one colour region is wrong, the sliders move it, the score is
 * ΔE₀₀ against the correct value — so the rest of the screen doesn't care which
 * it's looking at.
 */
type Round =
  | {
      kind: "flag";
      flag: Flag;
      region: FlagRegion;
      /** Colour the region starts at. */
      start: string;
      /** The correct colour. */
      truth: string;
      /** Heading above the question. */
      title: string;
      /** What the player is restoring. */
      label: string;
      /** Where the correct value comes from. */
      spec: string;
      /** The scramble, so the image renderer can start from it. */
      scramble: TintScramble;
    }
  | {
      kind: "transit";
      target: TransitLine;
      /** Lines drawn alongside it, in their true colours. */
      diagram: TransitLine[];
      start: string;
      truth: string;
      title: string;
      label: string;
      spec: string;
      scramble: TintScramble;
    }
  | {
      kind: "image";
      image: LocalImageRound;
      start: string;
      truth: string;
      title: string;
      label: string;
      spec: string;
      scramble: TintScramble;
    };

function flagRound(seenFlags: Set<string>): Round {
  const pool = FLAGS.filter((f) => !seenFlags.has(f.id));
  const source = pool.length ? pool : FLAGS;
  const flag = source[Math.floor(Math.random() * source.length)];
  const options = playableRegions(flag);
  const region = options[Math.floor(Math.random() * options.length)];
  const scramble = scrambleOne(region.hex);
  return {
    kind: "flag",
    flag,
    region,
    start: adjustHex(region.hex, scramble.hue, scramble.sat, scramble.light),
    truth: region.hex,
    title: flag.name,
    label: region.label,
    spec: region.spec,
    scramble,
  };
}

function transitRound(seen: Set<string>): Round {
  const pool = playableLines().filter((l) => !seen.has(l.id));
  const source = pool.length ? pool : playableLines();
  const target = source[Math.floor(Math.random() * source.length)];
  const scramble = scrambleOne(target.hex);
  return {
    kind: "transit",
    target,
    diagram: diagramFor(target),
    start: adjustHex(target.hex, scramble.hue, scramble.sat, scramble.light),
    truth: target.hex,
    title: "Transport for London",
    label: `the ${target.name.replace(/ line$/, "")} line`,
    spec: `${target.spec} (${TFL_STANDARD})`,
    scramble,
  };
}

function imageRound(image: LocalImageRound): Round {
  const scramble = scrambleOne(image.hex);
  return {
    kind: "image",
    image,
    start: adjustHex(image.hex, scramble.hue, scramble.sat, scramble.light),
    truth: image.hex,
    title: image.name,
    label: image.label,
    spec: image.hex,
    scramble,
  };
}

export default function TintGamePage() {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [locals, setLocals] = useState<LocalImageRound[]>([]);
  const [localIndex, setLocalIndex] = useState(0);
  const [round, setRound] = useState<Round>(() => flagRound(new Set()));

  // Local images are opt-in and gitignored, so most installs have none. If a
  // manifest is there, its rounds go first — they're the ones the player
  // deliberately set up.
  useEffect(() => {
    let cancelled = false;
    loadLocalRounds().then((rounds) => {
      if (cancelled || rounds.length === 0) return;
      setLocals(rounds);
      setRound(imageRound(rounds[0]));
      setLocalIndex(1);
    });
    return () => { cancelled = true; };
  }, []);
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

  const showTruth = (peeking && !result) || result !== null;

  /**
   * The player's total transform, for image rounds.
   *
   * A canvas starts from the *original* pixels, so reaching what the player
   * currently sees means applying the scramble AND their correction on top of
   * it — the same composition `attempt` performs on a single hex value, applied
   * to every masked pixel. An earlier version returned only the scramble, which
   * froze the image at its starting colour while the swatch moved and made the
   * sliders look broken.
   */
  const playerShift = useMemo<TintScramble>(() => ({
    hue: round.scramble.hue + tint.hue,
    sat: round.scramble.sat * tint.sat,
    light: round.scramble.light + tint.light,
  }), [round.scramble, tint]);

  const lockIn = useCallback(() => {
    if (result) return;
    const r = scoreSingle(round.truth, attempt);
    setResult(r);
    setTotal((t) => t + r.points);
  }, [result, round.truth, attempt]);

  const next = useCallback(() => {
    if (roundNo >= ROUNDS) { setDone(true); return; }
    // Work through the player's own images first, then fall back to flags.
    if (localIndex < locals.length) {
      setRound(imageRound(locals[localIndex]));
      setLocalIndex((i) => i + 1);
    } else {
      // Alternate categories, so a five-round session isn't all flags or all
      // transit lines. `seen` is shared: ids don't collide across categories.
      const nextSeen = new Set(seen);
      if (round.kind === "flag") nextSeen.add(round.flag.id);
      if (round.kind === "transit") nextSeen.add(round.target.id);
      setSeen(nextSeen);
      setRound(round.kind === "flag" ? transitRound(nextSeen) : flagRound(nextSeen));
    }
    setTint({ hue: 0, sat: 1, light: 0 });
    setResult(null);
    setRoundNo((n) => n + 1);
  }, [roundNo, seen, round, locals, localIndex]);

  const restart = useCallback(() => {
    setSeen(new Set());
    if (locals.length > 0) {
      setRound(imageRound(locals[0]));
      setLocalIndex(1);
    } else {
      setRound(flagRound(new Set()));
      setLocalIndex(0);
    }
    setTint({ hue: 0, sat: 1, light: 0 });
    setResult(null);
    setRoundNo(1); setTotal(0); setDone(false);
  }, [locals]);

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
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">{round.title}</p>
          <h1 className="mt-1 text-lg font-bold text-white/90 sm:text-xl">
            Find <span className="text-[#ff9062]">{round.label}</span>
          </h1>
        </div>

        {/* While playing: one flag, with every region except the target already
            correct — so the real palette is right there to judge against.
            After locking in: both versions side by side at the same size. A pair
            of small swatches told you the numbers; two full flags let you
            actually see how far off you were, which is the whole point. */}
        {!result ? (
          <div className="surface rounded-3xl p-3">
            <div className="overflow-hidden rounded-xl shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)]">
              <Subject
                round={round}
                shown={showTruth ? round.truth : attempt}
                width={300}
                imageShift={playerShift}
                withTitle
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
            <Compare caption="Yours" hex={attempt} tone="text-white/60">
              <Subject round={round} shown={attempt} width={215} imageShift={playerShift} />
            </Compare>
            <Compare caption="Official" hex={round.truth} tone="text-[#66bb6a]" highlight>
              <Subject round={round} shown={round.truth} width={215} imageShift={playerShift} />
            </Compare>
          </div>
        )}

        {/* Live swatch while playing. */}
        {!result && (
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="h-10 w-16 rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]"
              style={{ backgroundColor: attempt }}
            />
            <span className="font-mono text-[10px] text-white/35">{attempt}</span>
          </div>
        )}

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
              {round.kind === "flag" && (
                <>
                  {round.flag.name} specifies {round.label} as{" "}
                  <span className="font-bold text-white/70">{round.spec}</span>.
                </>
              )}
              {round.kind === "transit" && (
                <>
                  TfL specifies {round.label} as{" "}
                  <span className="font-bold text-white/70">{round.target.spec}</span>{" "}
                  — {round.truth}, per the {TFL_STANDARD}.
                </>
              )}
              {round.kind === "image" && (
                <>
                  {round.label} is <span className="font-bold text-white/70">{round.truth}</span>.
                </>
              )}{" "}
              You were ΔE{"₀₀"} {result.meanDeltaE.toFixed(1)} away.
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

/**
 * Renders whichever kind of subject this round is, with the target colour set
 * to `shown`. Every other part of the subject stays at its true value, so the
 * player always has correct neighbours to judge against.
 *
 * One component rather than a ternary at each call site: there are three
 * categories now and four places that draw one, and nesting those was already
 * producing type errors.
 */
function Subject({
  round, shown, width, imageShift, withTitle = false,
}: {
  round: Round;
  shown: string;
  width: number;
  /** Composed hue/sat/light shift for image rounds. Ignored by the others. */
  imageShift: TintScramble;
  withTitle?: boolean;
}) {
  if (round.kind === "flag") {
    return (
      <FlagArt
        id={round.flag.id}
        colors={{ ...officialPalette(round.flag), [round.region.id]: shown }}
        width={width}
        title={withTitle ? `Flag of ${round.flag.name}` : undefined}
      />
    );
  }

  if (round.kind === "transit") {
    return (
      <TransitDiagram
        lines={round.diagram}
        colors={{
          ...Object.fromEntries(round.diagram.map((l) => [l.id, l.hex])),
          [round.target.id]: shown,
        }}
        targetId={round.target.id}
        width={width}
        title={withTitle ? `Transit diagram highlighting ${round.target.name}` : undefined}
      />
    );
  }

  // Images recolour pixels rather than swapping a fill, so the transform has to
  // be expressed as a shift from the original rather than an absolute colour.
  const atTruth = shown === round.truth;
  return (
    <ImageTint
      src={`/tint-local/${round.image.file}`}
      targetHex={round.truth}
      tolerance={round.image.tolerance ?? 22}
      hueShift={atTruth ? 0 : imageShift.hue}
      satScale={atTruth ? 1 : imageShift.sat}
      lightShift={atTruth ? 0 : imageShift.light}
      width={width}
      alt={withTitle ? round.image.name : undefined}
    />
  );
}

/**
 * One half of the side-by-side. Same flag, same size, one colour different —
 * so the eye compares the thing itself rather than two abstract chips.
 */
function Compare({
  caption, hex, tone, highlight = false, children,
}: {
  caption: string; hex: string; tone: string; highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`surface rounded-2xl p-2 ${highlight ? "outline outline-2 outline-[#66bb6a]/60" : ""}`}>
        <div className="overflow-hidden rounded-lg">{children}</div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="h-4 w-4 rounded-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]"
          style={{ backgroundColor: hex }}
        />
        <span className={`font-headline text-[11px] font-bold uppercase tracking-[0.16em] ${tone}`}>
          {caption}
        </span>
        <span className="font-mono text-[10px] text-white/35">{hex}</span>
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
