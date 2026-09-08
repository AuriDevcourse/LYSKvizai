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
  /*
   * Avatars arrive from whoever is joining, so this is attacker-controlled, and
   * the value is rendered on the host's big screen and on every other player's
   * phone. It reaches `dangerouslySetInnerHTML` in `Avatar` for the DiceBear
   * case and an `<img src>` for the file case.
   *
   * Neither is exploitable today: DiceBear decoding keeps only integers and
   * clamps them into fixed variant arrays, and the file case is always prefixed
   * with `/avatars/`. But this used to accept *any* 120-character string with
   * only `<...>` stripped, which meant that safety rested entirely on every
   * future consumer staying careful. One `href`, one style string, one template
   * literal without the prefix, and it becomes injection.
   *
   * So allow only the shapes actually supported, and fall back to the default
   * avatar for anything else:
   *   - "d2:1:2:3:..."   the DiceBear config: digits, colons, minus signs
   *   - "name.svg"       a bare file name from /public/avatars
   *   - "svg:name.svg:#rrggbb"
   *   - a short run of emoji characters
   */
  const raw = input.slice(0, 120);

  // DiceBear config — the only form the avatar builder emits.
  if (/^d[12](:-?\d{1,3}){8,10}$/.test(raw)) return raw;

  // A file name, optionally with the "svg:" prefix and a hex background. No
  // slashes and no dots beyond the extension, so no path can be built from it.
  if (/^(svg:)?[a-z0-9-]{1,60}\.svg(:#[0-9a-fA-F]{3,8})?$/i.test(raw)) return raw;

  // Anything short with no markup or path characters: an emoji, a letter.
  const plain = raw.replace(/[<>"'`\\/]/g, "");
  if (plain.length <= 16 && plain === raw) return plain;

  // Unrecognised. Empty means "use the default", which `Avatar` already handles.
  return "";
}
