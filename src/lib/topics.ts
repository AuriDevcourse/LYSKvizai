import {
  Globe, Clapperboard, Star, Landmark, FlaskConical,
  Calculator, Music, Cpu, Trophy, Newspaper,
  UtensilsCrossed, PawPrint, Gamepad2, Brain,
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
}

export const TOPICS: Topic[] = [
  {
    id: "news",
    labelKey: "topics.news",
    icon: Newspaper,
    bg: "bg-[#ef4444]",
    quizIds: [
      "news-2024-q1", "news-2024-q2", "news-2024-q3", "news-2024-q4",
      "news-2025-q1", "news-2025-q2", "news-2025-q3", "news-2025-q4",
    ],
  },
  {
    id: "general",
    labelKey: "topics.general",
    icon: Brain,
    bg: "bg-[#8b5cf6]",
    quizIds: ["bendros-zinios", "misrus-testas", "zoom-out-pictures"],
  },
  {
    id: "geography",
    labelKey: "topics.geography",
    icon: Globe,
    bg: "bg-[#26890c]",
    quizIds: ["geografija", "pasaulio-sostines", "europos-geografija", "vandenynai-ir-kontinentai", "bluff-geography"],
  },
  {
    id: "movies",
    labelKey: "topics.movies",
    icon: Clapperboard,
    bg: "bg-[#a855f7]",
    quizIds: ["filmai-ir-serialai", "tv-serialai", "animacija", "year-entertainment"],
  },
  {
    id: "celebrities",
    labelKey: "topics.celebrities",
    icon: Star,
    bg: "bg-[#e21b3c]",
    quizIds: ["pasaulio-zvaigzdes"],
  },
  {
    id: "history",
    labelKey: "topics.history",
    icon: Landmark,
    bg: "bg-[#d89e00]",
    quizIds: ["pasaulio-istorija", "year-world-history", "bluff-history"],
  },
  {
    id: "science",
    labelKey: "topics.science",
    icon: FlaskConical,
    bg: "bg-[#0ea5e9]",
    quizIds: ["mokslas", "biologija", "fizika", "kosmosas", "year-science-tech", "year-space", "bluff-science"],
  },
  {
    id: "math",
    labelKey: "topics.math",
    icon: Calculator,
    bg: "bg-[#1368ce]",
    quizIds: ["matematika", "logikos-galvosukai"],
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
    quizIds: ["technologijos", "socialiniai-tinklai"],
  },
  {
    id: "sports",
    labelKey: "topics.sports",
    icon: Trophy,
    bg: "bg-[#eab308]",
    quizIds: ["pasaulio-futbolas", "olimpiniai-zaidimai", "krepsinis", "year-sports"],
  },
  {
    id: "food",
    labelKey: "topics.food",
    icon: UtensilsCrossed,
    bg: "bg-[#f97316]",
    quizIds: ["pasaulio-virtuve", "gerimai", "bluff-food"],
  },
  {
    id: "nature",
    labelKey: "topics.nature",
    icon: PawPrint,
    bg: "bg-[#22c55e]",
    quizIds: ["gyvunai", "gamta", "bluff-animals"],
  },
  {
    id: "gaming",
    labelKey: "topics.gaming",
    icon: Gamepad2,
    bg: "bg-[#6366f1]",
    quizIds: ["video-zaidimai"],
  },
];
