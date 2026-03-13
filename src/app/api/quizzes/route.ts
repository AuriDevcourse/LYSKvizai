import { NextRequest, NextResponse } from "next/server";
import { listQuizzes, saveQuiz } from "@/lib/quiz-store";
import { translateBatch } from "@/lib/translate";
import type { Quiz } from "@/data/types";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** GET /api/quizzes — list all quiz metadata */
export async function GET(req: NextRequest) {
  const quizzes = await listQuizzes();

  const lang = req.nextUrl.searchParams.get("lang");
  if (lang && lang !== "lt") {
    // Only translate Lithuanian titles to target lang; English titles are already fine
    const toTranslate: { idx: number; title: string }[] = [];
    for (let i = 0; i < quizzes.length; i++) {
      if (quizzes[i].language !== "en") toTranslate.push({ idx: i, title: quizzes[i].title });
    }
    if (toTranslate.length > 0) {
      const translated = await translateBatch(toTranslate.map((t) => t.title), "lt", lang);
      const result = quizzes.map((q) => ({ ...q }));
      toTranslate.forEach((t, j) => { result[t.idx].title = translated[j]; });
      return json(result);
    }
    return json(quizzes);
  }
  if (lang === "lt") {
    // Translate English titles to Lithuanian
    const toTranslate: { idx: number; title: string }[] = [];
    for (let i = 0; i < quizzes.length; i++) {
      if (quizzes[i].language === "en") toTranslate.push({ idx: i, title: quizzes[i].title });
    }
    if (toTranslate.length > 0) {
      const translated = await translateBatch(toTranslate.map((t) => t.title), "en", "lt");
      const result = quizzes.map((q) => ({ ...q }));
      toTranslate.forEach((t, j) => { result[t.idx].title = translated[j]; });
      return json(result);
    }
  }

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
