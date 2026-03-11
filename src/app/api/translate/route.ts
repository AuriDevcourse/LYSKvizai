import { NextRequest, NextResponse } from "next/server";
import { translateBatch } from "@/lib/translate";

export async function POST(req: NextRequest) {
  try {
    const { texts, from = "lt", to = "en" } = await req.json();

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
