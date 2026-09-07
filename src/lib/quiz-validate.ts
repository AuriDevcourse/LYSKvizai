/**
 * Runtime validation for quiz payloads written through the editor API.
 *
 * Previously `POST /api/quizzes` stored `body.questions` verbatim. A quiz with
 * a malformed question is not just bad data — the game engine indexes into it
 * directly (`q.options[origIdx]` in getQuestionPayload), so one missing
 * `options` array throws mid-game and takes down the room for everyone in it.
 */

import type { Question, QuestionType } from "@/data/types";

export const MAX_TITLE = 120;
export const MAX_DESCRIPTION = 500;
export const MAX_QUESTION_TEXT = 500;
export const MAX_OPTION = 200;
export const MAX_EXPLANATION = 1000;
export const MAX_QUESTIONS = 200;
export const MAX_URL = 500;

const QUESTION_TYPES = new Set<QuestionType>([
  "standard", "bluff", "audio", "video",
  "fastest-finger", "year-guesser", "true-false", "zoom-out",
]);

export interface ValidatedQuiz {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: Question[];
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > max) return null;
  return t;
}

function optStr(v: unknown, max: number): string | undefined | null {
  if (v === undefined || v === null || v === "") return undefined;
  return str(v, max);
}

/**
 * Media URLs must be same-origin paths or plain http(s) — never `javascript:`
 * or `data:`, which would otherwise land in an <img src> / <video src>.
 */
function mediaUrl(v: unknown): string | undefined | null {
  const s = optStr(v, MAX_URL);
  if (s === undefined || s === null) return s;
  if (s.startsWith("/")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return null;
}

function validateQuestion(raw: unknown, i: number): { question: Question } | { error: string } {
  const at = `Question ${i + 1}`;
  if (typeof raw !== "object" || raw === null) return { error: `${at}: not an object` };
  const q = raw as Record<string, unknown>;

  const question = str(q.question, MAX_QUESTION_TEXT);
  if (!question) return { error: `${at}: text is required` };

  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return { error: `${at}: needs exactly 4 options` };
  }
  const options: string[] = [];
  for (let k = 0; k < 4; k++) {
    // An option may legitimately be empty-ish in a true/false pair, so allow
    // blanks but cap the length and force a string.
    const o = q.options[k];
    if (typeof o !== "string" || o.length > MAX_OPTION) {
      return { error: `${at}: option ${k + 1} is invalid` };
    }
    options.push(o);
  }

  if (typeof q.correct !== "number" || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) {
    return { error: `${at}: "correct" must be 0-3` };
  }

  const explanation = typeof q.explanation === "string" ? q.explanation.slice(0, MAX_EXPLANATION) : "";

  let type: QuestionType | undefined;
  if (q.type !== undefined) {
    if (typeof q.type !== "string" || !QUESTION_TYPES.has(q.type as QuestionType)) {
      return { error: `${at}: unknown question type` };
    }
    type = q.type as QuestionType;
  }

  const image = mediaUrl(q.image);
  if (image === null) return { error: `${at}: invalid image URL` };
  const audioUrl = mediaUrl(q.audioUrl);
  if (audioUrl === null) return { error: `${at}: invalid audio URL` };
  const videoUrl = mediaUrl(q.videoUrl);
  if (videoUrl === null) return { error: `${at}: invalid video URL` };

  const bluffAnswer = optStr(q.bluffAnswer, MAX_OPTION);
  if (bluffAnswer === null) return { error: `${at}: invalid bluff answer` };

  let acceptedAnswers: string[] | undefined;
  if (q.acceptedAnswers !== undefined) {
    if (!Array.isArray(q.acceptedAnswers) || q.acceptedAnswers.length > 20) {
      return { error: `${at}: invalid accepted answers` };
    }
    const list = q.acceptedAnswers.filter(
      (a): a is string => typeof a === "string" && a.trim().length > 0 && a.length <= MAX_OPTION
    );
    acceptedAnswers = list.length ? list : undefined;
  }

  let correctYear: number | undefined;
  if (q.correctYear !== undefined && q.correctYear !== null) {
    if (typeof q.correctYear !== "number" || !Number.isInteger(q.correctYear)
        || q.correctYear < -10000 || q.correctYear > 10000) {
      return { error: `${at}: invalid year` };
    }
    correctYear = q.correctYear;
  }

  // A year-guesser question without a year breaks scoring at runtime.
  if (type === "year-guesser" && correctYear === undefined) {
    return { error: `${at}: year-guesser questions need a correct year` };
  }
  if (type === "bluff" && !bluffAnswer) {
    return { error: `${at}: bluff questions need a bluff answer` };
  }

  /*
   * The remaining types that can be saved in an unplayable state.
   *
   * `year-guesser` and `bluff` above were already checked; these two were not,
   * so the editor would happily save a zoom-out round with no picture (there
   * is nothing to zoom) or a fastest-finger round with nothing to accept (no
   * answer can ever be right). Both fail at runtime, mid-game, in front of
   * everyone — which is the worst possible place to find out.
   */
  if (type === "zoom-out" && !image) {
    return { error: `${at}: zoom-out questions need an image to zoom out of` };
  }
  if (type === "fastest-finger" && (!acceptedAnswers || acceptedAnswers.length === 0)) {
    return { error: `${at}: fastest-finger questions need at least one accepted answer` };
  }

  const out: Question = {
    question,
    options: options as [string, string, string, string],
    correct: q.correct,
    explanation,
  };
  if (type) out.type = type;
  if (image) out.image = image;
  if (audioUrl) out.audioUrl = audioUrl;
  if (videoUrl) out.videoUrl = videoUrl;
  if (bluffAnswer) out.bluffAnswer = bluffAnswer;
  if (acceptedAnswers) out.acceptedAnswers = acceptedAnswers;
  if (correctYear !== undefined) out.correctYear = correctYear;
  if (q.progressiveReveal === true) out.progressiveReveal = true;

  return { question: out };
}

export function validateQuizInput(body: unknown): { quiz: ValidatedQuiz } | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Body must be an object" };
  const b = body as Record<string, unknown>;

  const id = str(b.id, 200);
  if (!id) return { error: "Quiz id is required" };
  const title = str(b.title, MAX_TITLE);
  if (!title) return { error: "Quiz title is required" };

  if (!Array.isArray(b.questions) || b.questions.length === 0) {
    return { error: "A quiz needs at least one question" };
  }
  if (b.questions.length > MAX_QUESTIONS) {
    return { error: `Too many questions (max ${MAX_QUESTIONS})` };
  }

  const questions: Question[] = [];
  for (let i = 0; i < b.questions.length; i++) {
    const r = validateQuestion(b.questions[i], i);
    if ("error" in r) return { error: r.error };
    questions.push(r.question);
  }

  const description = typeof b.description === "string" ? b.description.slice(0, MAX_DESCRIPTION) : "";
  const icon = typeof b.icon === "string" && /^[A-Za-z0-9]{1,40}$/.test(b.icon) ? b.icon : "BookOpen";

  return { quiz: { id, title, description, icon, questions } };
}
