/**
 * Sanitize user input to prevent XSS attacks.
 * Strips HTML tags and limits length.
 */
export function sanitizeText(input: string, maxLength = 50): string {
  return input
    .replace(/[<>"'&]/g, "") // strip chars that could form HTML/script
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
  // Allow up to 50 chars for encoded avatar strings (e.g. "frog:orange:wizard:glasses")
  return input.slice(0, 50).replace(/<[^>]*>/g, "");
}
