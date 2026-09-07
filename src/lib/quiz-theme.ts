import {
  Newspaper, BookOpen,
  type LucideIcon,
} from "lucide-react";
import { getIcon } from "./quiz-icons";
import { TOPICS } from "./topics";

/**
 * Per-quiz accent, resolved from the quiz's topic.
 *
 * This used to be a hand-written map of 47 background colours, one per quiz id,
 * in arbitrary hexes: Tailwind defaults (`#8b5cf6`, `#0ea5e9`, `#f97316`) plus a
 * few of Kahoot's (`#26890c`, `#e21b3c`, `#1368ce`). None were in the Quizmo
 * palette, and CLAUDE.md's claim that quiz themes are *data* did not hold up: a
 * flag's colour is a fact about the flag, but a quiz tile's colour is a design
 * choice, and one that was quietly overriding the brand on every picker.
 *
 * Deriving it from the topic fixes both problems at once. The colour is always a
 * palette token, and there is no second list to fall out of step with
 * `topics.ts` — a new quiz picks up its topic's accent the moment the topic
 * claims it, where before it silently fell through to a washed-out
 * `bg-white/20`.
 */

/** Fallback for a quiz no topic claims. */
const DEFAULT_ACCENT = "bg-white/[0.07] text-white/60";

/**
 * quiz id -> accent, built once from TOPICS.
 *
 * Prefix matches are kept separate and applied only after an exact match
 * misses, so a quiz listed explicitly always wins over a topic that merely
 * claims its prefix.
 */
const { exact, prefixes } = (() => {
  const exact = new Map<string, string>();
  const prefixes: Array<{ prefix: string; accent: string }> = [];
  for (const topic of TOPICS) {
    for (const id of topic.quizIds) {
      // First topic to claim an id wins, matching how the pickers resolve it.
      if (!exact.has(id)) exact.set(id, topic.accent.classes);
    }
    if (topic.idPrefix) prefixes.push({ prefix: topic.idPrefix, accent: topic.accent.classes });
  }
  return { exact, prefixes };
})();

function accentFor(id: string): string {
  const hit = exact.get(id);
  if (hit) return hit;
  const byPrefix = prefixes.find((p) => id.startsWith(p.prefix));
  return byPrefix ? byPrefix.accent : DEFAULT_ACCENT;
}

export const DEFAULT_THEME: { icon: LucideIcon; bg: string } = {
  icon: BookOpen,
  bg: DEFAULT_ACCENT,
};

interface ThemeInput {
  id: string;
  icon?: string;
}

/**
 * Resolve the icon and accent for a quiz. Prefers `quiz.icon` (Lucide name)
 * from the JSON when set, then a news default, then BookOpen.
 *
 * `bg` keeps its name because three call sites interpolate it as a class, but it
 * now carries both the tinted ground *and* the accent text colour, so the icon
 * inside inherits the accent through `currentColor`. Do not add `text-white`
 * alongside it — that is what made every tile's icon one colour before.
 */
export function getQuizTheme(quiz: string | ThemeInput): { icon: LucideIcon; bg: string } {
  const id = typeof quiz === "string" ? quiz : quiz.id;
  const iconName = typeof quiz === "string" ? undefined : quiz.icon;

  const bg = accentFor(id);

  const dataIcon = getIcon(iconName);
  if (dataIcon) return { icon: dataIcon, bg };

  if (id.startsWith("news-")) return { icon: Newspaper, bg };

  return { icon: DEFAULT_THEME.icon, bg };
}
