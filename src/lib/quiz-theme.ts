import {
  Calculator, Globe, Landmark, Star, FlaskConical,
  Clapperboard, Music, Cpu, Trophy, BookOpen,
  Mic, Guitar, Headphones, Newspaper, Brain,
  UtensilsCrossed, Wine, PawPrint, Trees,
  Gamepad2, Smartphone, Puzzle, Tv, Film, Rocket, Atom,
  Dna, Medal, Dribbble, MapPin,
  type LucideIcon,
} from "lucide-react";

/** Map quiz IDs to specific icons and accent colors */
export const QUIZ_THEME: Record<string, { icon: LucideIcon; bg: string }> = {
  // Math
  "mathematics":          { icon: Calculator,   bg: "bg-[#1368ce]" },
  "logic-puzzles":  { icon: Puzzle,        bg: "bg-[#8b5cf6]" },

  // Geography
  "geography":          { icon: Globe,         bg: "bg-[#26890c]" },
  "world-capitals":   { icon: MapPin,        bg: "bg-[#16a34a]" },
  "european-geography":  { icon: Globe,         bg: "bg-[#0ea5e9]" },
  "oceans-and-continents": { icon: Globe,   bg: "bg-[#0284c7]" },

  // History
  "world-history":   { icon: Landmark,      bg: "bg-[#d89e00]" },

  // Celebrities
  "world-celebrities":  { icon: Star,          bg: "bg-[#e21b3c]" },

  // Science
  "science":             { icon: FlaskConical,   bg: "bg-[#0ea5e9]" },
  "biology":           { icon: Dna,            bg: "bg-[#22c55e]" },
  "physics":              { icon: Atom,           bg: "bg-[#6366f1]" },
  "space":            { icon: Rocket,         bg: "bg-[#1e40af]" },

  // Movies & TV
  "movies-and-series":  { icon: Clapperboard,  bg: "bg-[#a855f7]" },
  "tv-series":         { icon: Tv,            bg: "bg-[#7c3aed]" },
  "animation":           { icon: Film,          bg: "bg-[#ec4899]" },

  // Music
  "music-pop":          { icon: Mic,           bg: "bg-[#ec4899]" },
  "music-rock":        { icon: Guitar,        bg: "bg-[#e21b3c]" },
  "music-classical":    { icon: Music,         bg: "bg-[#a855f7]" },
  "music-hiphop":       { icon: Headphones,    bg: "bg-[#f97316]" },

  // Technology
  "technology":       { icon: Cpu,           bg: "bg-[#14b8a6]" },
  "social-networks": { icon: Smartphone,    bg: "bg-[#3b82f6]" },

  // Gaming
  "video-games":      { icon: Gamepad2,      bg: "bg-[#6366f1]" },

  // Sports
  "world-football":   { icon: Dribbble,      bg: "bg-[#16a34a]" },
  "olympic-games": { icon: Medal,         bg: "bg-[#d89e00]" },
  "basketball":           { icon: Trophy,        bg: "bg-[#f97316]" },

  // Food & Drink
  "world-cuisine":    { icon: UtensilsCrossed, bg: "bg-[#f97316]" },
  "drinks":             { icon: Wine,           bg: "bg-[#7c3aed]" },

  // Animals & Nature
  "animals":             { icon: PawPrint,       bg: "bg-[#22c55e]" },
  "nature":               { icon: Trees,          bg: "bg-[#16a34a]" },

  // General Knowledge
  "general-knowledge":      { icon: Brain,          bg: "bg-[#8b5cf6]" },
  "mixed-quiz":       { icon: Brain,          bg: "bg-[#6366f1]" },
  "zoom-out-pictures":   { icon: Brain,          bg: "bg-[#0ea5e9]" },

};

/** News quiz theme */
const NEWS_THEME = { icon: Newspaper, bg: "bg-[#ef4444]" };

export const DEFAULT_THEME = { icon: BookOpen, bg: "bg-white/20" };

export function getQuizTheme(id: string) {
  if (QUIZ_THEME[id]) return QUIZ_THEME[id];
  if (id.startsWith("news-")) return NEWS_THEME;
  return DEFAULT_THEME;
}
