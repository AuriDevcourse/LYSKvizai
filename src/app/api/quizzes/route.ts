import { NextRequest, NextResponse } from "next/server";
import { listQuizzes, saveQuiz } from "@/lib/quiz-store";
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
      emoji: body.emoji ?? "",
      icon: body.icon ?? "BookOpen",
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
