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

/** Strip diacritics/accents for more forgiving comparison */
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Normalize text: lowercase, strip accents, trim, collapse whitespace */
function normalize(s: string): string {
  return stripAccents(s.toLowerCase().trim()).replace(/\s+/g, " ");
}

/** Check if two strings match within a Levenshtein distance threshold */
function isWithinDistance(a: string, b: string, maxRatio = 0.25): boolean {
  const maxLen = Math.max(a.length, b.length);
  const maxDist = Math.max(1, Math.floor(maxLen * maxRatio));
  return levenshtein(a, b) <= maxDist;
}

/**
 * Check if `input` fuzzy-matches any of the `accepted` answers.
 *
 * Matching strategies (in order):
 * 1. Exact match (after normalization)
 * 2. Levenshtein fuzzy match (up to 25% character difference)
 * 3. Input matches a significant word in the answer (e.g., "whale" matches "Blue whale")
 * 4. Answer starts with input or input starts with answer (prefix matching)
 * 5. Input with articles/prepositions stripped matches
 */
export function fuzzyMatch(input: string, accepted: string[]): boolean {
  const norm = normalize(input);
  if (!norm) return false;

  return accepted.some((a) => {
    const target = normalize(a);

    // 1. Exact match
    if (norm === target) return true;

    // 2. Levenshtein fuzzy match (25% tolerance, more forgiving than before)
    if (isWithinDistance(norm, target, 0.25)) return true;

    // 3. Partial match: input matches a significant word in the accepted answer
    if (norm.length >= 3) {
      const words = target.split(/\s+/);
      // Match against individual words (for multi-word answers like "Blue whale")
      if (words.some((w) => w.length >= 3 && isWithinDistance(w, norm, 0.25))) return true;
      // Match against last word (often the key word, e.g. "whale" in "Blue whale")
      const lastWord = words[words.length - 1];
      if (lastWord && lastWord.length >= 3 && isWithinDistance(lastWord, norm, 0.3)) return true;
    }

    // 4. Prefix matching: "United States" matches "United States of America"
    if (target.startsWith(norm) && norm.length >= Math.min(5, target.length * 0.6)) return true;
    if (norm.startsWith(target) && target.length >= Math.min(5, norm.length * 0.6)) return true;

    // 5. Strip common articles/prepositions and retry
    const STRIP_WORDS = /^(the|a|an|le|la|les|der|die|das)\s+/i;
    const normStripped = norm.replace(STRIP_WORDS, "");
    const targetStripped = target.replace(STRIP_WORDS, "");
    if (normStripped !== norm || targetStripped !== target) {
      if (normStripped === targetStripped) return true;
      if (isWithinDistance(normStripped, targetStripped, 0.25)) return true;
    }

    // 6. Abbreviation matching: "USA" matches "United States of America"
    if (norm.length >= 2 && norm.length <= 6 && /^[a-z]+$/.test(norm)) {
      const initials = target
        .split(/\s+/)
        .map((w) => w[0])
        .join("");
      if (initials === norm) return true;
    }

    return false;
  });
}
