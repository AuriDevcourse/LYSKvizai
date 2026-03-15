import {
  Calculator, Globe, Landmark, Star, FlaskConical,
  Clapperboard, Music, Cpu, TreePine, Drama,
  Clover, Trophy, Flag, BookOpen, Mic, Guitar, Headphones,
  Newspaper, Brain, UtensilsCrossed, Wine, PawPrint, Trees,
  Gamepad2, Smartphone, Puzzle, Tv, Film, Rocket, Atom,
  Dna, Medal, Dribbble, MapPin,
  type LucideIcon,
} from "lucide-react";

/** Map quiz IDs to specific icons and accent colors */
export const QUIZ_THEME: Record<string, { icon: LucideIcon; bg: string }> = {
  // Math
  "matematika":          { icon: Calculator,   bg: "bg-[#1368ce]" },
  "logikos-galvosukai":  { icon: Puzzle,        bg: "bg-[#8b5cf6]" },

  // Geography
  "geografija":          { icon: Globe,         bg: "bg-[#26890c]" },
  "pasaulio-sostines":   { icon: MapPin,        bg: "bg-[#16a34a]" },
  "europos-geografija":  { icon: Globe,         bg: "bg-[#0ea5e9]" },
  "vandenynai-ir-kontinentai": { icon: Globe,   bg: "bg-[#0284c7]" },

  // History
  "pasaulio-istorija":   { icon: Landmark,      bg: "bg-[#d89e00]" },
  "lietuvos-istorija":   { icon: Landmark,      bg: "bg-[#b45309]" },

  // Celebrities
  "pasaulio-zvaigzdes":  { icon: Star,          bg: "bg-[#e21b3c]" },
  "lietuvos-izymybes":   { icon: Star,          bg: "bg-[#7c3aed]" },

  // Science
  "mokslas":             { icon: FlaskConical,   bg: "bg-[#0ea5e9]" },
  "biologija":           { icon: Dna,            bg: "bg-[#22c55e]" },
  "fizika":              { icon: Atom,           bg: "bg-[#6366f1]" },
  "kosmosas":            { icon: Rocket,         bg: "bg-[#1e40af]" },

  // Movies & TV
  "filmai-ir-serialai":  { icon: Clapperboard,  bg: "bg-[#a855f7]" },
  "tv-serialai":         { icon: Tv,            bg: "bg-[#7c3aed]" },
  "animacija":           { icon: Film,          bg: "bg-[#ec4899]" },

  // Music
  "muzika":              { icon: Music,         bg: "bg-[#ec4899]" },
  "muzika-pop":          { icon: Mic,           bg: "bg-[#ec4899]" },
  "muzika-rokas":        { icon: Guitar,        bg: "bg-[#e21b3c]" },
  "muzika-klasikine":    { icon: Music,         bg: "bg-[#a855f7]" },
  "muzika-hiphop":       { icon: Headphones,    bg: "bg-[#f97316]" },

  // Technology
  "technologijos":       { icon: Cpu,           bg: "bg-[#14b8a6]" },
  "socialiniai-tinklai": { icon: Smartphone,    bg: "bg-[#3b82f6]" },

  // Gaming
  "video-zaidimai":      { icon: Gamepad2,      bg: "bg-[#6366f1]" },

  // Sports
  "lietuvos-sportas":    { icon: Trophy,        bg: "bg-[#eab308]" },
  "pasaulio-futbolas":   { icon: Dribbble,      bg: "bg-[#16a34a]" },
  "olimpiniai-zaidimai": { icon: Medal,         bg: "bg-[#d89e00]" },
  "krepsinis":           { icon: Trophy,        bg: "bg-[#f97316]" },

  // Food & Drink
  "pasaulio-virtuve":    { icon: UtensilsCrossed, bg: "bg-[#f97316]" },
  "gerimai":             { icon: Wine,           bg: "bg-[#7c3aed]" },

  // Animals & Nature
  "gyvunai":             { icon: PawPrint,       bg: "bg-[#22c55e]" },
  "gamta":               { icon: Trees,          bg: "bg-[#16a34a]" },

  // General Knowledge
  "bendros-zinios":      { icon: Brain,          bg: "bg-[#8b5cf6]" },

  // Holidays
  "kucios-ir-kaledos":   { icon: TreePine,      bg: "bg-[#16a34a]" },
  "uzgavenes-klasika":   { icon: Drama,         bg: "bg-[#f97316]" },
  "jonines-ir-rasas":    { icon: Clover,        bg: "bg-[#22c55e]" },
  "lietuvos-tradicijos": { icon: Flag,          bg: "bg-[#dc2626]" },
};

/** News quiz theme */
const NEWS_THEME = { icon: Newspaper, bg: "bg-[#ef4444]" };

export const DEFAULT_THEME = { icon: BookOpen, bg: "bg-white/20" };

export function getQuizTheme(id: string) {
  if (QUIZ_THEME[id]) return QUIZ_THEME[id];
  if (id.startsWith("news-")) return NEWS_THEME;
  return DEFAULT_THEME;
}
