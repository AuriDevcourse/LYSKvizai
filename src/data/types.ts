export type QuestionType = "standard" | "bluff" | "audio" | "video" | "fastest-finger" | "year-guesser" | "true-false" | "zoom-out";

export interface Question {
  question: string;
  options: [string, string, string, string];
  correct: number; // 0-3 index
  explanation: string;
  image?: string; // "/quiz-images/photo.jpg" or external URL
  type?: QuestionType;
  bluffAnswer?: string; // fake answer for bluff questions
  audioUrl?: string;
  videoUrl?: string;
  progressiveReveal?: boolean;
  /** Accepted text answers for fastest-finger questions (case-insensitive matching) */
  acceptedAnswers?: string[];
  /** Correct year for year-guesser questions */
  correctYear?: number;
}

export interface Quiz {
  id: string; // filesystem-safe slug: "uzgavenes-klasika"
  title: string;
  description: string;
  /** Legacy: Unicode emoji. Kept for backward compat; new quizzes use `icon` instead. */
  emoji: string;
  /** Lucide icon name (see @/lib/quiz-icons#QUIZ_ICONS). Preferred over emoji. */
  icon?: string;
  questions: Question[];
  createdAt: string; // ISO date
  updatedAt: string;
}

export interface QuizMeta {
  id: string;
  title: string;
  description: string;
  emoji: string;
  /** Lucide icon name. Preferred over `emoji` when resolving the quiz theme. */
  icon?: string;
  questionCount: number;
  /** ISO date when the quiz was first added (from git history, or set by editor on save). */
  createdAt?: string;
  /** ISO date of the last edit in the editor. */
  updatedAt?: string;
  /** Reserved for future language tagging. Currently always "en". */
  language?: string;
  /** Number of questions that have local images (for zoom-out eligibility) */
  imageCount?: number;
  /** Number of questions with correctYear (for year-guesser eligibility) */
  yearCount?: number;
  /** Number of questions with short typeable answers (for fastest-finger eligibility) */
  shortAnswerCount?: number;
}
