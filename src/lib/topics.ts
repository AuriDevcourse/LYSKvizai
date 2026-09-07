import {
  NewsIcon, GeneralIcon, GeographyIcon, MoviesIcon, CelebritiesIcon,
  HistoryIcon, ScienceIcon, MathsIcon, MusicIcon, TechnologyIcon,
  SportsIcon, FoodIcon, AnimalsIcon, GamingIcon,
  type TopicIconProps,
} from "@/components/icons/TopicIcons";


/**
 * The six palette accents a topic can wear, each in both forms it is needed in.
 *
 * Tailwind cannot build a class name from a runtime string, so the utility
 * classes have to exist as literals. But the topic grid also styles itself
 * *with* the accent — the hover bloom, a gradient wash, a chip, a focus ring —
 * and that needs a CSS value, not a class. Holding both on one object is the
 * only version of this that cannot drift: there is no second list to update.
 */
export interface Accent {
  /** Tinted ground plus the accent as text colour, for a small icon tile. */
  classes: string;
  /** The raw colour, for `--bloom`, gradients, rings and `color-mix`. */
  css: string;
}

const ACCENTS = {
  orange: { classes: "bg-primary/15 text-primary", css: "var(--color-primary)" },
  blue: { classes: "bg-answer-blue/15 text-answer-blue", css: "var(--color-answer-blue)" },
  green: { classes: "bg-answer-green/15 text-answer-green", css: "var(--color-answer-green)" },
  gold: { classes: "bg-answer-yellow/15 text-answer-yellow", css: "var(--color-answer-yellow)" },
  red: { classes: "bg-error/15 text-error", css: "var(--color-error)" },
  purple: { classes: "bg-answer-purple/15 text-answer-purple", css: "var(--color-answer-purple)" },
} as const satisfies Record<string, Accent>;

export interface Topic {
  id: string;
  /** Label key for i18n (e.g. "topics.geography") */
  labelKey: string;
  icon: React.ComponentType<TopicIconProps>;
  /**
   * Tailwind classes for the tile: a tinted ground plus the accent as text
   * colour, which the icon picks up through `currentColor`.
   *
   * These were fourteen arbitrary hexes (`#ef4444`, `#8b5cf6`, `#26890c` and so
   * on) — Tailwind defaults and one of Kahoot's greens, none of them in the
   * Quizmo palette. Fourteen off-palette flat colour fields is a large part of
   * why the app read as a clone. Six palette accents at 15% over the dark ground
   * keep the topics apart without fourteen solid fields shouting at once.
   */
  accent: Accent;
  /** Quiz IDs that belong to this topic */
  quizIds: string[];
  /**
   * Any quiz whose id starts with this also belongs here.
   *
   * The news topic listed eight fixed ids while the generator writes
   * `news-<topic>-<date>` — so every quiz that cron produced was unreachable
   * from the game-creation flow and then deleted itself three days later. A
   * prefix cannot go stale the way a hand-written list does.
   */
  idPrefix?: string;
}


/**
 * For the synthetic catch-all tile, which is not a real topic and should not
 * wear a palette accent — it holds whatever no topic claimed.
 */
export const NEUTRAL_ACCENT: Accent = {
  classes: "bg-white/[0.07] text-white/60",
  css: "rgba(255, 255, 255, 0.28)",
};

export const TOPICS: Topic[] = [
  {
    id: "news",
    labelKey: "topics.news",
    icon: NewsIcon,
    accent: ACCENTS.orange,
    quizIds: [
      "news-2024-q1", "news-2024-q2", "news-2024-q3", "news-2024-q4",
      "news-2025-q1", "news-2025-q2", "news-2025-q3", "news-2025-q4",
    ],
    // Catches everything `scripts/news-quiz-generator.ts` writes.
    idPrefix: "news-",
  },
  {
    id: "general",
    labelKey: "topics.general",
    icon: GeneralIcon,
    accent: ACCENTS.blue,
    quizIds: ["general-knowledge", "mixed-quiz", "zoom-out-pictures"],
  },
  {
    id: "geography",
    labelKey: "topics.geography",
    icon: GeographyIcon,
    accent: ACCENTS.green,
    quizIds: ["geography", "world-capitals", "european-geography", "oceans-and-continents", "bluff-geography"],
  },
  {
    id: "movies",
    labelKey: "topics.movies",
    icon: MoviesIcon,
    accent: ACCENTS.gold,
    quizIds: ["movies-and-series", "tv-series", "animation", "year-entertainment"],
  },
  {
    id: "celebrities",
    labelKey: "topics.celebrities",
    icon: CelebritiesIcon,
    accent: ACCENTS.red,
    quizIds: ["world-celebrities"],
  },
  {
    id: "history",
    labelKey: "topics.history",
    icon: HistoryIcon,
    accent: ACCENTS.purple,
    quizIds: ["world-history", "year-world-history", "bluff-history"],
  },
  {
    id: "science",
    labelKey: "topics.science",
    icon: ScienceIcon,
    accent: ACCENTS.orange,
    quizIds: ["science", "biology", "physics", "space", "year-science-tech", "year-space", "bluff-science"],
  },
  {
    id: "math",
    labelKey: "topics.math",
    icon: MathsIcon,
    accent: ACCENTS.blue,
    quizIds: ["mathematics", "logic-puzzles"],
  },
  {
    id: "music",
    labelKey: "topics.music",
    icon: MusicIcon,
    accent: ACCENTS.purple,
    quizIds: ["music-pop", "music-rock", "music-classical", "music-hiphop"],
  },
  {
    id: "technology",
    labelKey: "topics.technology",
    icon: TechnologyIcon,
    accent: ACCENTS.green,
    quizIds: ["technology", "social-networks", "technology-ai", "technology-internet"],
  },
  {
    id: "sports",
    labelKey: "topics.sports",
    icon: SportsIcon,
    accent: ACCENTS.gold,
    quizIds: ["world-football", "olympic-games", "basketball", "year-sports"],
  },
  {
    id: "food",
    labelKey: "topics.food",
    icon: FoodIcon,
    accent: ACCENTS.orange,
    quizIds: ["world-cuisine", "drinks", "bluff-food"],
  },
  {
    id: "nature",
    labelKey: "topics.nature",
    icon: AnimalsIcon,
    accent: ACCENTS.green,
    quizIds: ["animals", "nature", "bluff-animals"],
  },
  {
    id: "gaming",
    labelKey: "topics.gaming",
    icon: GamingIcon,
    accent: ACCENTS.red,
    quizIds: ["video-games", "games-retro", "games-modern"],
  },
];

/** Whether a quiz belongs to a topic, by explicit id or by prefix. */
export function topicHasQuiz(topic: Topic, quizId: string): boolean {
  if (topic.quizIds.includes(quizId)) return true;
  return !!topic.idPrefix && quizId.startsWith(topic.idPrefix);
}

/** The ids in a topic, given everything that exists. */
export function quizIdsForTopic(topic: Topic, allIds: string[]): string[] {
  return allIds.filter((id) => topicHasQuiz(topic, id));
}

/**
 * Quizzes that no topic claims.
 *
 * `TOPICS` is a hand-maintained mapping, so anything created in the editor got
 * an id nobody had listed and became invisible in the game-creation flow — you
 * could build a quiz and then never find it to play. These are surfaced under
 * their own heading instead of disappearing.
 */
export function unlistedQuizIds(allIds: string[]): string[] {
  return allIds.filter((id) => !TOPICS.some((t) => topicHasQuiz(t, id)));
}
