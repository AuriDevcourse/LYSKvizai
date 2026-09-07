import { NextRequest, NextResponse } from "next/server";
import { collectQuestions } from "@/lib/library";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

/**
 * GET /api/library/questions — every question in every quiz.
 *
 * Public and read-only, which is a deliberate choice rather than an oversight:
 * `GET /api/quizzes/[id]` is already public because players need it, so every
 * question and answer here is reachable without this route. It exposes nothing
 * new; it just saves 54 round trips. There is no POST/PUT/DELETE — authoring
 * stays behind the editor's secret.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`library:${ip}`, 20, 10_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const payload = await collectQuestions();
  return NextResponse.json(payload);
}
