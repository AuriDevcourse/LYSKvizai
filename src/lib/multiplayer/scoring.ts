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

/**
 * Catch-up multiplier: trailing players earn bonus points.
 * - Players in bottom half get up to 1.5x multiplier based on distance from leader.
 * - Leader and top players get 1.0x (no bonus).
 * - Minimum multiplier: 1.0x, Maximum: 1.5x
 */
export function getCatchUpMultiplier(
  playerScore: number,
  leaderScore: number,
  playerCount: number
): number {
  if (playerCount <= 1 || leaderScore <= 0) return 1.0;
  // How far behind as a ratio (0 = tied with leader, 1 = zero points vs leader)
  const deficit = Math.max(0, (leaderScore - playerScore) / leaderScore);
  // Scale: 0% deficit = 1.0x, 100% deficit = 1.5x
  return 1.0 + deficit * 0.5;
}
