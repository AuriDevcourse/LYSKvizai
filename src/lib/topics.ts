import {
  Globe, Clapperboard, Star, Landmark, FlaskConical,
  Calculator, Music, Cpu, Trophy, TreePine, Newspaper,
  type LucideIcon,
} from "lucide-react";

export interface Topic {
  id: string;
  /** Label key for i18n (e.g. "topics.geography") */
  labelKey: string;
  icon: LucideIcon;
  bg: string;
  /** Quiz IDs that belong to this topic */
  quizIds: string[];
  /** If set, dynamically match quiz IDs starting with this prefix */
  dynamicPrefix?: string;
}

export const TOPICS: Topic[] = [
  {
    id: "news",
    labelKey: "topics.news",
    icon: Newspaper,
    bg: "bg-[#ef4444]",
    quizIds: [],
    dynamicPrefix: "news-",
  },
  {
    id: "geography",
    labelKey: "topics.geography",
    icon: Globe,
    bg: "bg-[#26890c]",
    quizIds: ["geografija"],
  },
  {
    id: "movies",
    labelKey: "topics.movies",
    icon: Clapperboard,
    bg: "bg-[#a855f7]",
    quizIds: ["filmai-ir-serialai"],
  },
  {
    id: "celebrities",
    labelKey: "topics.celebrities",
    icon: Star,
    bg: "bg-[#e21b3c]",
    quizIds: ["pasaulio-zvaigzdes", "lietuvos-izymybes"],
  },
  {
    id: "history",
    labelKey: "topics.history",
    icon: Landmark,
    bg: "bg-[#d89e00]",
    quizIds: ["pasaulio-istorija", "lietuvos-istorija"],
  },
  {
    id: "science",
    labelKey: "topics.science",
    icon: FlaskConical,
    bg: "bg-[#0ea5e9]",
    quizIds: ["mokslas"],
  },
  {
    id: "math",
    labelKey: "topics.math",
    icon: Calculator,
    bg: "bg-[#1368ce]",
    quizIds: ["matematika"],
  },
  {
    id: "music",
    labelKey: "topics.music",
    icon: Music,
    bg: "bg-[#ec4899]",
    quizIds: ["muzika-pop", "muzika-rokas", "muzika-klasikine", "muzika-hiphop"],
  },
  {
    id: "technology",
    labelKey: "topics.technology",
    icon: Cpu,
    bg: "bg-[#14b8a6]",
    quizIds: ["technologijos"],
  },
  {
    id: "sports",
    labelKey: "topics.sports",
    icon: Trophy,
    bg: "bg-[#eab308]",
    quizIds: ["lietuvos-sportas"],
  },
  {
    id: "holidays",
    labelKey: "topics.holidays",
    icon: TreePine,
    bg: "bg-[#16a34a]",
    quizIds: ["kucios-ir-kaledos", "uzgavenes-klasika", "jonines-ir-rasas", "lietuvos-tradicijos"],
  },
];
