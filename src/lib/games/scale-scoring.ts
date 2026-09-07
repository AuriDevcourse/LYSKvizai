/**
 * Scoring for the scale game.
 *
 * The player sets how big a target creature is relative to a reference. The
 * error that matters is the *ratio* between their answer and the truth, not the
 * difference: guessing 2 m when the answer is 1 m is the same size of mistake
 * as guessing 20 m when the answer is 10 m, and a linear score would call the
 * second one ten times worse.
 *
 * So error is measured in log space and a perfect answer is ratio 1.
 *   ratio 1.0  → 100 points (exact)
 *   ratio 1.1  → still near-perfect, 10% out
 *   ratio 2.0  → half credit-ish
 *   ratio 4.0+ → zero
 *
 * `TOLERANCE` is the ratio at which the score reaches zero. 4 means "four times
 * too big or four times too small earns nothing", which is generous enough that
 * a thoughtful guess always scores and tight enough that a random drag doesn't.
 */
export const TOLERANCE = 4;

export interface ScaleResult {
  /** The player's implied height for the target, in metres. */
  guessedM: number;
  /** The real height. */
  actualM: number;
  /** guessed / actual. 1 is perfect, 2 is twice too big, 0.5 is half. */
  ratio: number;
  /** 0-100. */
  points: number;
  /** True when within 10% either way — worth celebrating. */
  isBullseye: boolean;
  /** "2.4× too big" / "3.1× too small" / "spot on". */
  verdict: string;
}

export function scoreScale(guessedM: number, actualM: number): ScaleResult {
  // Guard: a zero or negative guess has no log. Treat it as maximally wrong
  // rather than returning NaN into the UI.
  if (!(guessedM > 0) || !(actualM > 0)) {
    return {
      guessedM: Math.max(0, guessedM),
      actualM,
      ratio: 0,
      points: 0,
      isBullseye: false,
      verdict: "no guess",
    };
  }

  const ratio = guessedM / actualM;
  const logError = Math.abs(Math.log(ratio));
  const points = Math.round(100 * Math.max(0, 1 - logError / Math.log(TOLERANCE)));
  const isBullseye = ratio >= 0.9 && ratio <= 1.1;

  let verdict: string;
  if (isBullseye) {
    verdict = "spot on";
  } else if (ratio > 1) {
    verdict = `${ratio.toFixed(1)}× too big`;
  } else {
    verdict = `${(1 / ratio).toFixed(1)}× too small`;
  }

  return { guessedM, actualM, ratio, points, isBullseye, verdict };
}

/** Human-readable size. Sub-metre reads better in centimetres. */
export function formatHeight(m: number): string {
  if (m < 1) return `${Math.round(m * 100)} cm`;
  if (m < 10) return `${m.toFixed(m < 3 ? 2 : 1)} m`;
  return `${Math.round(m)} m`;
}

/**
 * Pick a reference and a target that make an interesting round.
 *
 * A pairing is only fun if the two are far enough apart to be a real judgement
 * but not so far that the smaller one is a single pixel. Ratios between 1.5×
 * and 25× hit that window — below 1.5 the answer is "about the same" and above
 * 25 the layout can't show both honestly.
 */
export function pickPair<T extends { id: string; heightM: number }>(
  pool: T[],
  exclude: Set<string> = new Set(),
  /**
   * Picks among the valid pairs. Random by default; the first round of a game
   * passes a fixed choice so the server and the client render the same pair
   * instead of disagreeing and tripping a hydration mismatch.
   */
  choose: (count: number) => number = (n) => Math.floor(Math.random() * n)
): [T, T] {
  const usable = pool.filter((c) => !exclude.has(c.id));
  const candidates = usable.length >= 2 ? usable : pool;

  const pairs: [T, T][] = [];
  for (const a of candidates) {
    for (const b of candidates) {
      if (a.id === b.id) continue;
      const ratio = Math.max(a.heightM, b.heightM) / Math.min(a.heightM, b.heightM);
      if (ratio >= 1.5 && ratio <= 25) pairs.push([a, b]);
    }
  }
  if (pairs.length === 0) {
    // Fall back to any two distinct entries rather than throwing mid-game.
    return [candidates[0], candidates[1] ?? pool[1]];
  }
  return pairs[choose(pairs.length)];
}
