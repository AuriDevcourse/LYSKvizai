import { NextRequest, NextResponse } from "next/server";
import { listQuizzes, saveQuiz } from "@/lib/quiz-store";
import { translateBatch } from "@/lib/translate";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Quiz } from "@/data/types";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

/** GET /api/quizzes — list all quiz metadata */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`quizzes:${ip}`, 30, 10_000)) {
    return json({ error: "Too many requests" }, 429);
  }

  const quizzes = await listQuizzes();

  const lang = req.nextUrl.searchParams.get("lang");
  // Content is in English — translate titles to target language if not English
  if (lang && lang !== "en") {
    const toTranslate: { idx: number; title: string }[] = [];
    for (let i = 0; i < quizzes.length; i++) {
      toTranslate.push({ idx: i, title: quizzes[i].title });
    }
    if (toTranslate.length > 0) {
      try {
        const translated = await translateBatch(toTranslate.map((t) => t.title), "en", lang);
        const result = quizzes.map((q) => ({ ...q }));
        toTranslate.forEach((t, j) => { result[t.idx].title = translated[j]; });
        return json(result);
      } catch {
        // Translation failed — return English titles
      }
    }
  }

  return json(quizzes);
}

/** POST /api/quizzes — create a new quiz */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id || !body.title || !body.questions?.length) {
      return json({ error: "Missing required fields (id, title, questions)" }, 400);
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
    return json({ error: "Invalid request format" }, 400);
  }
}
