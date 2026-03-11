import {
  Calculator, Globe, Landmark, Star, FlaskConical,
  Clapperboard, Music, Cpu, TreePine, Drama,
  Clover, Trophy, Flag, BookOpen,
  type LucideIcon,
} from "lucide-react";

/** Map quiz IDs to specific icons and accent colors */
export const QUIZ_THEME: Record<string, { icon: LucideIcon; bg: string }> = {
  "matematika":          { icon: Calculator,   bg: "bg-[#1368ce]" },
  "geografija":          { icon: Globe,         bg: "bg-[#26890c]" },
  "pasaulio-istorija":   { icon: Landmark,      bg: "bg-[#d89e00]" },
  "pasaulio-zvaigzdes":  { icon: Star,          bg: "bg-[#e21b3c]" },
  "mokslas":             { icon: FlaskConical,   bg: "bg-[#0ea5e9]" },
  "filmai-ir-serialai":  { icon: Clapperboard,  bg: "bg-[#a855f7]" },
  "muzika":              { icon: Music,         bg: "bg-[#ec4899]" },
  "technologijos":       { icon: Cpu,           bg: "bg-[#14b8a6]" },
  "kucios-ir-kaledos":   { icon: TreePine,      bg: "bg-[#16a34a]" },
  "uzgavenes-klasika":   { icon: Drama,         bg: "bg-[#f97316]" },
  "jonines-ir-rasas":    { icon: Clover,        bg: "bg-[#22c55e]" },
  "lietuvos-sportas":    { icon: Trophy,        bg: "bg-[#eab308]" },
  "lietuvos-istorija":   { icon: Landmark,      bg: "bg-[#b45309]" },
  "lietuvos-izymybes":   { icon: Star,          bg: "bg-[#7c3aed]" },
  "lietuvos-tradicijos": { icon: Flag,          bg: "bg-[#dc2626]" },
};

export const DEFAULT_THEME = { icon: BookOpen, bg: "bg-white/20" };

export function getQuizTheme(id: string) {
  return QUIZ_THEME[id] ?? DEFAULT_THEME;
}
