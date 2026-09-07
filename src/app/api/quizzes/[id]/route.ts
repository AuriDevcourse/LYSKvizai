import { NextRequest, NextResponse } from "next/server";
import { getQuiz, saveQuiz, deleteQuiz } from "@/lib/quiz-store";
import { checkEditorAuthThrottled } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateQuizInput } from "@/lib/quiz-validate";
import { getClientIp } from "@/lib/client-ip";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * GET /api/quizzes/[id] — the full quiz, questions and answers. Public,
 * because players need it to play.
 *
 * It was also the only unthrottled GET in the API, which made it the cheapest
 * way to scrape every answer in the app. Quiz files change only when someone
 * edits them, so it is now rate limited *and* cached — the cache is the part
 * that actually protects the box, since a repeat request never reaches the
 * filesystem.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`quiz-get:${ip}`, 60, 10_000)) {
    return json({ error: "Too many requests" }, 429);
  }

  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) return json({ error: "Quiz not found" }, 404);

  const res = NextResponse.json(quiz);
  // Short and revalidatable rather than immutable: the editor writes these
  // files in place, so a long cache would serve a stale quiz after an edit.
  res.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return res;
}

/** PUT /api/quizzes/[id] — update quiz. Editor-only. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = checkEditorAuthThrottled(req);
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
  const auth = checkEditorAuthThrottled(req);
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
