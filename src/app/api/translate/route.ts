import { NextRequest, NextResponse } from "next/server";
import { translateBatch } from "@/lib/translate";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`translate:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many translation requests" }, { status: 429 });
  }

  try {
    const { texts, from = "en", to = "lt" } = await req.json();

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: "texts array required" }, { status: 400 });
    }

    // Limit batch size
    if (texts.length > 100) {
      return NextResponse.json({ error: "Max 100 texts per request" }, { status: 400 });
    }

    const translated = await translateBatch(texts, from, to);
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
