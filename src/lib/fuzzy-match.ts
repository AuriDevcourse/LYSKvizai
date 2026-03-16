/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Check if `input` fuzzy-matches any of the `accepted` answers.
 * Allows up to 20% character difference (at least 1 char for short words).
 * Also accepts if input matches a key word in the answer (e.g., "whale" matches "Blue whale").
 */
export function fuzzyMatch(input: string, accepted: string[]): boolean {
  const norm = input.toLowerCase().trim();
  if (!norm) return false;
  return accepted.some((a) => {
    const target = a.toLowerCase().trim();
    // Exact match
    if (norm === target) return true;
    // Levenshtein fuzzy match
    const maxLen = Math.max(norm.length, target.length);
    const maxDist = Math.max(1, Math.floor(maxLen * 0.2));
    if (levenshtein(norm, target) <= maxDist) return true;
    // Partial match: input matches a word in the accepted answer
    // (only if input is at least 3 chars to avoid false positives)
    if (norm.length >= 3) {
      const words = target.split(/\s+/);
      if (words.some((w) => w === norm || (w.length >= 3 && levenshtein(w, norm) <= Math.max(1, Math.floor(w.length * 0.2))))) return true;
    }
    return false;
  });
}
