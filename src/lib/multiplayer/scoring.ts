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
 * Fastest answerer bonus (+150) applied separately in room-store.
 * Hard cap enforced: total cannot exceed the per-question ceiling.
 */

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
