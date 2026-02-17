export type QuestionType = "standard" | "bluff" | "audio" | "video";

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
}
