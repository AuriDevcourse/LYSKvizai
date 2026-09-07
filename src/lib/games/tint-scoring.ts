import { ciede2000 } from "@/lib/color/ciede2000";
import { rgbToLab, hexToRgb, adjustHex } from "@/lib/color/convert";

/**
 * Scoring for the colour-matching game.
 *
 * The character's palette is scrambled by a hue rotation, a saturation scale and
 * a lightness offset. The player has one slider for each, and the sliders apply
 * the *same* transform — so an exact undo always exists. That matters: a game
 * where the target is unreachable is just noise.
 *
 * Closeness is the mean CIEDE2000 across every palette slot, not an RGB
 * distance. RGB distance would let the game claim a player was "close" on two
 * colours that look nothing alike, because RGB space is perceptually lumpy.
 *
 * ΔE₀₀ reference points, which set the thresholds below:
 *   < 1   not perceptible to most people
 *   1-2   perceptible on close inspection
 *   2-10  clearly a different colour
 *   > 10  a different colour entirely
 */

/** Mean ΔE at or below this is treated as a perfect match. */
export const PERFECT_DE = 1.0;
/** Mean ΔE at or above this scores zero. */
export const ZERO_DE = 40;

export interface TintScramble {
  hue: number;      // degrees
  sat: number;      // multiplier
  light: number;    // lightness offset
}

export interface TintResult {
  /** Mean ΔE₀₀ over every palette slot. */
  meanDeltaE: number;
  /** Worst single slot — a good match everywhere except one colour is not a
   *  good match, and the player should be told which. */
  worstDeltaE: number;
  worstIndex: number;
  /** 0-100. */
  points: number;
  /** Plain-language reading of the mean ΔE. */
  verdict: string;
}

/** Mean ΔE₀₀ between two equal-length hex palettes. */
export function paletteDelta(a: string[], b: string[]): { mean: number; worst: number; worstIndex: number } {
  if (a.length === 0 || a.length !== b.length) {
    throw new Error("paletteDelta needs two palettes of equal, non-zero length");
  }
  let sum = 0;
  let worst = -1;
  let worstIndex = 0;
  for (let i = 0; i < a.length; i++) {
    const d = ciede2000(rgbToLab(hexToRgb(a[i])), rgbToLab(hexToRgb(b[i])));
    sum += d;
    if (d > worst) { worst = d; worstIndex = i; }
  }
  return { mean: sum / a.length, worst, worstIndex };
}

export function scoreTint(original: string[], attempt: string[]): TintResult {
  const { mean, worst, worstIndex } = paletteDelta(original, attempt);

  const span = ZERO_DE - PERFECT_DE;
  const points = Math.round(100 * Math.min(1, Math.max(0, 1 - (mean - PERFECT_DE) / span)));

  let verdict: string;
  if (mean <= PERFECT_DE) verdict = "indistinguishable from the original";
  else if (mean <= 2) verdict = "only tellable apart side by side";
  else if (mean <= 5) verdict = "close, but visibly off";
  else if (mean <= 12) verdict = "recognisably the wrong colour";
  else verdict = "a different colour entirely";

  return { meanDeltaE: mean, worstDeltaE: worst, worstIndex, points, verdict };
}

/** Apply a scramble (or the player's correction) to a whole palette. */
export function applyTint(palette: string[], t: TintScramble): string[] {
  return palette.map((hex) => adjustHex(hex, t.hue, t.sat, t.light));
}

/**
 * Build a scramble that is visible AND provably reversible *for this palette*.
 *
 * Reversibility is not free. Saturation and lightness clamp at 0 and 100, so a
 * scramble that pushes any colour against a boundary destroys information and
 * no slider position can bring it back — the round would be unwinnable while
 * still showing the player a score. A unit test caught exactly that.
 *
 * So: propose a scramble, apply it, apply the exact inverse, and measure. If
 * the round trip doesn't land back inside the perceptual-match threshold, damp
 * the lossy components (saturation and lightness) toward neutral and try again.
 * Hue rotation is lossless, so the worst case is a hue-only scramble, which is
 * still a real puzzle.
 */
export function randomScramble(
  rng: () => number = Math.random,
  palette?: string[]
): TintScramble {
  const magnitude = 25 + rng() * 130;         // 25-155°
  const hue = rng() < 0.5 ? -magnitude : magnitude;
  let sat = 0.55 + rng() * 0.85;              // 0.55-1.40×
  let light = (rng() - 0.5) * 26;             // ±13

  if (!palette || palette.length === 0) return { hue, sat, light };

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate: TintScramble = { hue, sat, light };
    const roundTrip = applyTint(applyTint(palette, candidate), inverseOf(candidate));
    if (paletteDelta(palette, roundTrip).mean <= PERFECT_DE) return candidate;
    // Too close to a clamp. Pull the lossy axes halfway back to neutral.
    sat = 1 + (sat - 1) * 0.5;
    light *= 0.5;
  }

  // Hue only — always lossless, since rotation never clamps.
  return { hue, sat: 1, light: 0 };
}

/** The correction that exactly undoes a scramble — used to verify solvability. */
export function inverseOf(t: TintScramble): TintScramble {
  return { hue: -t.hue, sat: 1 / t.sat, light: -t.light };
}


/**
 * Score a single colour against its official value.
 *
 * The flag game scrambles exactly one region and leaves the rest correct, so
 * the score is about that one colour rather than a palette average. Same ΔE₀₀
 * thresholds, same reading of the number.
 */
export function scoreSingle(official: string, attempt: string): TintResult {
  const d = ciede2000(rgbToLab(hexToRgb(official)), rgbToLab(hexToRgb(attempt)));
  const span = ZERO_DE - PERFECT_DE;
  const points = Math.round(100 * Math.min(1, Math.max(0, 1 - (d - PERFECT_DE) / span)));

  let verdict: string;
  if (d <= PERFECT_DE) verdict = "indistinguishable from the official colour";
  else if (d <= 2) verdict = "only tellable apart side by side";
  else if (d <= 5) verdict = "close, but visibly off";
  else if (d <= 12) verdict = "recognisably the wrong shade";
  else verdict = "a different colour entirely";

  return { meanDeltaE: d, worstDeltaE: d, worstIndex: 0, points, verdict };
}

/**
 * Scramble a single colour so it is clearly wrong but still recoverable.
 *
 * Same reversibility guarantee as `randomScramble`: propose, apply, invert,
 * measure, and damp the clamping axes until the round trip comes back inside
 * the perceptual-match threshold. A round the player cannot win is worse than
 * no round at all.
 */
export function scrambleOne(hex: string, rng: () => number = Math.random): TintScramble {
  const magnitude = 30 + rng() * 120;
  const hue = rng() < 0.5 ? -magnitude : magnitude;
  let sat = 0.55 + rng() * 0.8;
  let light = (rng() - 0.5) * 24;

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate: TintScramble = { hue, sat, light };
    const roundTrip = applyTint(applyTint([hex], candidate), inverseOf(candidate));
    if (paletteDelta([hex], roundTrip).mean <= PERFECT_DE) return candidate;
    sat = 1 + (sat - 1) * 0.5;
    light *= 0.5;
  }
  return { hue, sat: 1, light: 0 };
}
