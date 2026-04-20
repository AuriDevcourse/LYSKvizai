import {
  Newspaper, BookOpen,
  type LucideIcon,
} from "lucide-react";
import { getIcon } from "./quiz-icons";

/**
 * Per-quiz accent color. Icon is now data-driven (stored on each quiz's JSON
 * `icon` field and looked up via quiz-icons.ts) — this map only controls
 * the background tile color used in pickers.
 */
const QUIZ_BG: Record<string, string> = {
  // Math / logic
  "mathematics": "bg-[#1368ce]",
  "logic-puzzles": "bg-[#8b5cf6]",
  // Geography
  "geography": "bg-[#26890c]",
  "world-capitals": "bg-[#16a34a]",
  "european-geography": "bg-[#0ea5e9]",
  "oceans-and-continents": "bg-[#0284c7]",
  "bluff-geography": "bg-[#0891b2]",
  // History
  "world-history": "bg-[#d89e00]",
  "bluff-history": "bg-[#b45309]",
  "year-world-history": "bg-[#a16207]",
  // Celebrities
  "world-celebrities": "bg-[#e21b3c]",
  // Science
  "science": "bg-[#0ea5e9]",
  "biology": "bg-[#22c55e]",
  "physics": "bg-[#6366f1]",
  "space": "bg-[#1e40af]",
  "bluff-science": "bg-[#0369a1]",
  "year-science-tech": "bg-[#2563eb]",
  "year-space": "bg-[#1d4ed8]",
  // Movies & TV
  "movies-and-series": "bg-[#a855f7]",
  "tv-series": "bg-[#7c3aed]",
  "animation": "bg-[#ec4899]",
  "year-entertainment": "bg-[#c026d3]",
  // Music
  "music-pop": "bg-[#ec4899]",
  "music-rock": "bg-[#e21b3c]",
  "music-classical": "bg-[#a855f7]",
  "music-hiphop": "bg-[#f97316]",
  // Technology
  "technology": "bg-[#14b8a6]",
  "technology-ai": "bg-[#06b6d4]",
  "technology-internet": "bg-[#0ea5e9]",
  "social-networks": "bg-[#3b82f6]",
  // Gaming
  "video-games": "bg-[#6366f1]",
  "games-modern": "bg-[#4f46e5]",
  "games-retro": "bg-[#7c3aed]",
  // Sports
  "world-football": "bg-[#16a34a]",
  "olympic-games": "bg-[#d89e00]",
  "basketball": "bg-[#f97316]",
  "year-sports": "bg-[#ca8a04]",
  // Food & Drink
  "world-cuisine": "bg-[#f97316]",
  "drinks": "bg-[#7c3aed]",
  "bluff-food": "bg-[#ea580c]",
  // Animals & Nature
  "animals": "bg-[#22c55e]",
  "nature": "bg-[#16a34a]",
  "bluff-animals": "bg-[#15803d]",
  // General
  "general-knowledge": "bg-[#8b5cf6]",
  "mixed-quiz": "bg-[#6366f1]",
  "zoom-out-pictures": "bg-[#0ea5e9]",
};

const NEWS_BG = "bg-[#ef4444]";
const DEFAULT_BG = "bg-white/20";

export const DEFAULT_THEME: { icon: LucideIcon; bg: string } = { icon: BookOpen, bg: DEFAULT_BG };

interface ThemeInput {
  id: string;
  icon?: string;
}

/**
 * Resolve the icon + background for a quiz. Prefers `quiz.icon` (Lucide name)
 * from the JSON when set; falls back to a hardcoded default icon by id, then
 * BookOpen. BG is always resolved from the per-id map (or news / default).
 */
export function getQuizTheme(quiz: string | ThemeInput): { icon: LucideIcon; bg: string } {
  const id = typeof quiz === "string" ? quiz : quiz.id;
  const iconName = typeof quiz === "string" ? undefined : quiz.icon;

  const bg = QUIZ_BG[id] ?? (id.startsWith("news-") ? NEWS_BG : DEFAULT_BG);

  const dataIcon = getIcon(iconName);
  if (dataIcon) return { icon: dataIcon, bg };

  // Fall back to Newspaper for news-* if no icon set in data
  if (id.startsWith("news-")) return { icon: Newspaper, bg };

  return { icon: DEFAULT_THEME.icon, bg };
}
