import { NextRequest, NextResponse } from "next/server";
import { getQuiz, saveQuiz, deleteQuiz } from "@/lib/quiz-store";
import { translateBatch } from "@/lib/translate";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** GET /api/quizzes/[id] — get full quiz with questions */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) return json({ error: "Quiz not found" }, 404);

  const lang = req.nextUrl.searchParams.get("lang");
  // Content is in English — translate to target language if not English
  if (lang && lang !== "en") {
    try {
      const texts: string[] = [quiz.title];
      for (const q of quiz.questions) {
        texts.push(q.question, ...q.options, q.explanation);
      }

      const translated = await translateBatch(texts, "en", lang);

      let idx = 0;
      const tTitle = translated[idx++];
      const tQuestions = quiz.questions.map((q) => {
        const tQuestion = translated[idx++];
        const tOptions = [translated[idx++], translated[idx++], translated[idx++], translated[idx++]] as [string, string, string, string];
        const tExplanation = translated[idx++];
        return { ...q, question: tQuestion, options: tOptions, explanation: tExplanation };
      });

      return json({ ...quiz, title: tTitle, questions: tQuestions });
    } catch {
      // Translation failed — return English content
    }
  }

  return json(quiz);
}

/** PUT /api/quizzes/[id] — update quiz */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getQuiz(id);
  if (!existing) return json({ error: "Quiz not found" }, 404);

  try {
    const body = await req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      createdAt: existing.createdAt,
    };

    await saveQuiz(updated);
    return json(updated);
  } catch {
    return json({ error: "Invalid request format" }, 400);
  }
}

/** DELETE /api/quizzes/[id] — delete quiz */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteQuiz(id);
  if (!deleted) return json({ error: "Quiz not found" }, 404);
  return json({ ok: true });
}
