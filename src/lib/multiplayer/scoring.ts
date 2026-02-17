/**
 * Kahoot-style scoring:
 * - Base: 1000 pts for correct answer
 * - Speed bonus: up to 500 pts (linear decay over timer duration)
 * - Streak bonus: kicks in at 3+ correct in a row, +100 per streak level, max 500
 *   (streak 3 = +100, streak 4 = +200, ... streak 7+ = +500)
 * - Wrong: 0 pts, streak resets
 */
export function calculateScore(
  correct: boolean,
  answerTimeMs: number,
  timerDurationMs: number,
  currentStreak: number
): { points: number; newStreak: number } {
  if (!correct) {
    return { points: 0, newStreak: 0 };
  }

  const base = 1000;

  // Speed bonus: linear from 500 → 0 over the timer duration
  const elapsed = Math.max(0, Math.min(answerTimeMs, timerDurationMs));
  const speedRatio = 1 - elapsed / timerDurationMs;
  const speedBonus = Math.round(500 * speedRatio);

  // Streak bonus: starts at 3+ consecutive correct, 100 per level, max 500
  const newStreak = currentStreak + 1;
  const streakBonus = newStreak >= 3 ? Math.min((newStreak - 2) * 100, 500) : 0;

  return {
    points: base + speedBonus + streakBonus,
    newStreak,
  };
}
