import { NextRequest, NextResponse } from "next/server";
import { getQuiz, saveQuiz, deleteQuiz } from "@/lib/quiz-store";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** GET /api/quizzes/[id] — get full quiz with questions */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) return json({ error: "Kvizas nerastas" }, 404);
  return json(quiz);
}

/** PUT /api/quizzes/[id] — update quiz */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getQuiz(id);
  if (!existing) return json({ error: "Kvizas nerastas" }, 404);

  try {
    const body = await req.json();
    const updated = {
      ...existing,
      ...body,
      id, // don't allow changing ID through PUT
      createdAt: existing.createdAt,
    };

    await saveQuiz(updated);
    return json(updated);
  } catch {
    return json({ error: "Netinkamas užklausos formatas" }, 400);
  }
}

/** DELETE /api/quizzes/[id] — delete quiz */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteQuiz(id);
  if (!deleted) return json({ error: "Kvizas nerastas" }, 404);
  return json({ ok: true });
}
