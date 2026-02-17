import { NextRequest, NextResponse } from "next/server";
import { listQuizzes, saveQuiz } from "@/lib/quiz-store";
import type { Quiz } from "@/data/types";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** GET /api/quizzes — list all quiz metadata */
export async function GET() {
  const quizzes = await listQuizzes();
  return json(quizzes);
}

/** POST /api/quizzes — create a new quiz */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id || !body.title || !body.questions?.length) {
      return json({ error: "Trūksta privalomų laukų (id, title, questions)" }, 400);
    }

    const quiz: Quiz = {
      id: body.id,
      title: body.title,
      description: body.description || "",
      emoji: body.emoji || "📝",
      questions: body.questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveQuiz(quiz);
    return json(quiz, 201);
  } catch {
    return json({ error: "Netinkamas užklausos formatas" }, 400);
  }
}
