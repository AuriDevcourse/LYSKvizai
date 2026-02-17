import fs from "fs/promises";
import path from "path";
import type { Quiz, QuizMeta } from "@/data/types";

const QUIZZES_DIR = path.join(process.cwd(), "data", "quizzes");

/** Ensure the quizzes directory exists */
async function ensureDir() {
  await fs.mkdir(QUIZZES_DIR, { recursive: true });
}

/** Sanitize an ID to be filesystem-safe */
function sanitizeId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** List all quizzes (metadata only) */
export async function listQuizzes(): Promise<QuizMeta[]> {
  await ensureDir();
  const files = await fs.readdir(QUIZZES_DIR);
  const metas: QuizMeta[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(QUIZZES_DIR, file), "utf-8");
      const quiz: Quiz = JSON.parse(raw);
      metas.push({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        emoji: quiz.emoji,
        questionCount: quiz.questions.length,
      });
    } catch {
      // skip invalid files
    }
  }

  return metas.sort((a, b) => a.title.localeCompare(b.title));
}

/** Get a single quiz by ID */
export async function getQuiz(id: string): Promise<Quiz | null> {
  const filePath = path.join(QUIZZES_DIR, `${sanitizeId(id)}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as Quiz;
  } catch {
    return null;
  }
}

/** Save a quiz (create or update) */
export async function saveQuiz(quiz: Quiz): Promise<void> {
  await ensureDir();
  quiz.id = sanitizeId(quiz.id);
  quiz.updatedAt = new Date().toISOString();
  if (!quiz.createdAt) quiz.createdAt = quiz.updatedAt;
  const filePath = path.join(QUIZZES_DIR, `${quiz.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(quiz, null, 2), "utf-8");
}

/** Delete a quiz by ID */
export async function deleteQuiz(id: string): Promise<boolean> {
  const filePath = path.join(QUIZZES_DIR, `${sanitizeId(id)}.json`);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
