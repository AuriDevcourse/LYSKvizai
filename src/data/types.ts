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
  emoji: string;
  questions: Question[];
  createdAt: string; // ISO date
  updatedAt: string;
}

export interface QuizMeta {
  id: string;
  title: string;
  description: string;
  emoji: string;
  questionCount: number;
  /** Content language/region: "lt" for Lithuanian-focused, "en" for English/international */
  language?: string;
  /** Number of questions that have images (for zoom-out eligibility) */
  imageCount?: number;
}
