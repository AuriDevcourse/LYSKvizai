/**
 * Tiny haptic helper.
 *
 * Committing an answer is the one moment in the game where a phone should
 * confirm the tap without the player needing to look — they're usually watching
 * the host screen, not their own. Silently a no-op where the API is missing
 * (iOS Safari) or the user has asked for reduced motion.
 */
type Pattern = "tap" | "commit" | "error";

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 10,
  commit: 15,
  error: [12, 40, 12],
};

export function haptic(pattern: Pattern = "tap"): void {
  if (typeof window === "undefined") return;
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;

  // Someone who has turned motion down did not ask for their phone to buzz.
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* some browsers throw on vibrate in a non-user-gesture context */
  }
}
