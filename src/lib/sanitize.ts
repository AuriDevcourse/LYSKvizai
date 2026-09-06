/**
 * Sanitize user input to prevent XSS attacks.
 * Strips HTML tags and limits length.
 */
export function sanitizeText(input: string, maxLength = 50): string {
  return input
    // `&` deliberately NOT stripped. This runs on `answer-text` submissions
    // before fuzzyMatch, so stripping it silently mangled legitimately correct
    // answers — "Fish & Chips" and "AT&T" became "Fish  Chips" and "ATT" and
    // scored zero. It also mangled feedback text. JSX escapes on render and the
    // feedback route runs its own escapeHtml, so removing `&` here bought
    // nothing and cost correctness.
    .replace(/[<>"']/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Sanitize player name — alphanumeric, spaces, emoji, dashes only */
export function sanitizeName(name: string): string {
  // Allow letters (any script), digits, spaces, hyphens, underscores, and emoji
  // Strip anything that looks like HTML tags or script injection
  return name
    .replace(/<[^>]*>/g, "")    // strip HTML tags
    .replace(/[&<>"'`;(){}]/g, "") // strip dangerous chars
    .trim()
    .slice(0, 30);
}

/** Sanitize emoji/avatar string — allow encoded avatar configs and emoji sequences */
export function sanitizeEmoji(input: string): string {
  // Allow up to 120 chars for encoded avatar strings. DiceBear config format
  // "d1:H:E:L:N:B:Bd:Bd:G:BG" with 2-digit indices fits in ~35; leave headroom
  // for future style toggles / longer encodings.
  return input.slice(0, 120).replace(/<[^>]*>/g, "");
}
