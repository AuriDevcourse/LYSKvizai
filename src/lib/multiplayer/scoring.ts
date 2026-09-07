/**
 * Scoring system (research-backed, additive-only, hard-capped):
 *
 * Per-question cap depends on question position (escalating stakes):
 *   Q1-Q5:   base 1000, cap 1500
 *   Q6-Q10:  base 1200, cap 1700
 *   Q11-Q15: base 1400, cap 1900
 *   Q16+:    base 1500, cap 2000
 *
 * Components (all additive, never multiplicative):
 *   - Base: awarded for correct answer (see above)
 *   - Speed bonus: up to 300 pts (linear decay over timer)
 *   - Streak bonus: +100 flat at 3-4 streak, +200 flat at 5+ streak
 *   - Wrong: 0 pts, streak resets
 *
 * Fastest answerer bonus (`FASTEST_BONUS`) applied separately in room-store.
 * Hard cap enforced: total cannot exceed the per-question ceiling.
 */

/**
 * Flat bonus for being first to answer correctly.
 *
 * Was the literal `150` in three separate places in `room-store.ts`, one of
 * them the value actually awarded and another the value *reported* to the
 * player — exactly the shape of drift that made the earlier double-award bug
 * possible.
 */
export const FASTEST_BONUS = 150;

/** Seconds a Freeze cuts from the clock. Was the literal `3` in the event and the timer maths. */
export const FREEZE_SECONDS = 3;

/** Power-ups a player gets for a whole game. Was the literal `3` in two places. */
export const POWER_UP_USES = 3;

/**
 * How much a player may stake on a wager round.
 *
 * The floor matters: without it, anyone on a low score could only wager a
 * trivial amount and the round would mean nothing to them.
 *
 * This formula used to be written twice — once in `submitWager` on the server
 * and once in `WagerScreen` on the client — while the wager payload shipped a
 * placeholder `maxWager: 0`. Two copies of a rule the player is held to is one
 * copy too many: change one and the slider offers a stake the server silently
 * clamps away.
 */
export const WAGER_FLOOR = 500;
export const WAGER_SHARE = 0.3;

export function maxWagerFor(score: number): number {
  return Math.max(WAGER_FLOOR, Math.floor(score * WAGER_SHARE));
}

/** Get base value and cap for a question based on its position (0-indexed) */
export function getQuestionValues(questionIndex: number): { base: number; cap: number } {
  if (questionIndex < 5)  return { base: 1000, cap: 1500 };
  if (questionIndex < 10) return { base: 1200, cap: 1700 };
  if (questionIndex < 15) return { base: 1400, cap: 1900 };
  return { base: 1500, cap: 2000 };
}

export function calculateScore(
  correct: boolean,
  answerTimeMs: number,
  timerDurationMs: number,
  currentStreak: number,
  questionIndex = 0
): { points: number; newStreak: number } {
  if (!correct) {
    return { points: 0, newStreak: 0 };
  }

  const { base, cap } = getQuestionValues(questionIndex);

  // Speed bonus: linear from 300 → 0 over the timer duration
  const elapsed = Math.max(0, Math.min(answerTimeMs, timerDurationMs));
  const speedRatio = 1 - elapsed / timerDurationMs;
  const speedBonus = Math.round(300 * speedRatio);

  // Streak bonus: flat additive, capped
  const newStreak = currentStreak + 1;
  const streakBonus = newStreak >= 5 ? 200 : newStreak >= 3 ? 100 : 0;

  // Hard cap: total cannot exceed per-question ceiling
  const raw = base + speedBonus + streakBonus;
  const points = Math.min(raw, cap);

  return { points, newStreak };
}

/**
 * Competition ranking: equal scores share a place, and the next distinct score
 * skips the places the tie occupied. 4200, 4200, 3000 ranks as 1, 1, 3.
 *
 * The leaderboard used to rank by array position (`i + 1`), so two players on
 * the same score were shown as 2nd and 3rd — a difference the game never
 * awarded and the players could see was wrong.
 *
 * Expects `sorted` to already be in descending score order.
 */
export function competitionRanks(sorted: { score: number }[]): number[] {
  const ranks: number[] = [];
  let rank = 0;
  let lastScore: number | null = null;
  sorted.forEach((entry, i) => {
    if (lastScore === null || entry.score !== lastScore) {
      rank = i + 1;
      lastScore = entry.score;
    }
    ranks.push(rank);
  });
  return ranks;
}

/**
 * Everyone tied for the lowest score.
 *
 * Elimination used to take `sort((a,b) => a.score - b.score)[0]`. `Array.sort`
 * is stable and the player list is in join order, so a tie *always* removed
 * whoever joined first — the same player every time, which over a few rounds
 * stops being chance and starts being a rule nobody agreed to. Returning the
 * whole tied group lets the caller break the tie at random.
 */
export function lowestScorers<T extends { score: number }>(players: T[]): T[] {
  if (players.length === 0) return [];
  let min = Infinity;
  for (const p of players) if (p.score < min) min = p.score;
  return players.filter((p) => p.score === min);
}
