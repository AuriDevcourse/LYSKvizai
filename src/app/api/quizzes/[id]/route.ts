import { NextRequest, NextResponse } from "next/server";
import { getQuiz, saveQuiz, deleteQuiz } from "@/lib/quiz-store";
import { checkEditorAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateQuizInput } from "@/lib/quiz-validate";
import { getClientIp } from "@/lib/client-ip";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** GET /api/quizzes/[id] — get full quiz with questions. Public: players need this. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) return json({ error: "Quiz not found" }, 404);
  return json(quiz);
}

/** PUT /api/quizzes/[id] — update quiz. Editor-only. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = checkEditorAuth(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const ip = getClientIp(req);
  if (!checkRateLimit(`quiz-write:${ip}`, 30, 60_000)) {
    return json({ error: "Too many requests" }, 429);
  }

  const { id } = await params;
  const existing = await getQuiz(id);
  if (!existing) return json({ error: "Quiz not found" }, 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request format" }, 400);
  }

  // Validate the full payload rather than spreading `body` over `existing`,
  // which let arbitrary fields through and allowed unvalidated questions to be
  // written straight to disk.
  if (typeof body !== "object" || body === null) {
    return json({ error: "Body must be an object" }, 400);
  }
  const validated = validateQuizInput({ ...(body as Record<string, unknown>), id });
  if ("error" in validated) return json({ error: validated.error }, 400);
  const v = validated.quiz;

  const updated = {
    ...existing,
    title: v.title,
    description: v.description,
    emoji: v.emoji,
    icon: v.icon,
    questions: v.questions,
    id,
    createdAt: existing.createdAt,
  };

  await saveQuiz(updated);
  return json(updated);
}

/** DELETE /api/quizzes/[id] — delete quiz. Editor-only. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = checkEditorAuth(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const ip = getClientIp(req);
  if (!checkRateLimit(`quiz-write:${ip}`, 30, 60_000)) {
    return json({ error: "Too many requests" }, 429);
  }

  const { id } = await params;
  const deleted = await deleteQuiz(id);
  if (!deleted) return json({ error: "Quiz not found" }, 404);
  return json({ ok: true });
}
