import { NextRequest, NextResponse } from "next/server";
import { listQuizzes, saveQuiz } from "@/lib/quiz-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkEditorAuth } from "@/lib/auth";
import { validateQuizInput } from "@/lib/quiz-validate";
import type { Quiz } from "@/data/types";
import { getClientIp } from "@/lib/client-ip";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** GET /api/quizzes — list all quiz metadata */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`quizzes:${ip}`, 30, 10_000)) {
    return json({ error: "Too many requests" }, 429);
  }

  const quizzes = await listQuizzes();
  return json(quizzes);
}

/** POST /api/quizzes — create a new quiz. Editor-only. */
export async function POST(req: NextRequest) {
  // saveQuiz is create-or-update, so an open POST let anyone overwrite any
  // existing quiz by reusing its id.
  const auth = checkEditorAuth(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const ip = getClientIp(req);
  if (!checkRateLimit(`quiz-write:${ip}`, 30, 60_000)) {
    return json({ error: "Too many requests" }, 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request format" }, 400);
  }

  const validated = validateQuizInput(body);
  if ("error" in validated) return json({ error: validated.error }, 400);
  const v = validated.quiz;

  const quiz: Quiz = {
    id: v.id,
    title: v.title,
    description: v.description,
    emoji: v.emoji,
    icon: v.icon,
    questions: v.questions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveQuiz(quiz);
  return json(quiz, 201);
}
