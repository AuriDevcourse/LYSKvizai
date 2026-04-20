import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LEN = 2000;
const MAX_FROM_LEN = 200;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`feedback:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_TO_EMAIL ?? "baciauskas.aurimas@gmail.com";
  if (!apiKey) {
    return NextResponse.json({ error: "Feedback sending is not configured" }, { status: 500 });
  }

  let body: { message?: string; from?: string; pageUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const message = sanitizeText(body.message ?? "", MAX_MESSAGE_LEN);
  const from = body.from ? sanitizeText(body.from, MAX_FROM_LEN) : "";
  const pageUrl = body.pageUrl ? sanitizeText(body.pageUrl, 500) : "";
  const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? "";

  if (!message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const fromDisplay = from.trim() || "anonymous";
  const subject = `[Quizmo feedback] ${fromDisplay}`;

  const htmlBody = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 16px">New Quizmo feedback</h2>
      <p style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:6px;margin:0 0 24px">${escapeHtml(message)}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
      <p style="color:#666;font-size:13px;margin:4px 0"><strong>From:</strong> ${escapeHtml(fromDisplay)}</p>
      <p style="color:#666;font-size:13px;margin:4px 0"><strong>Page:</strong> ${escapeHtml(pageUrl || "—")}</p>
      <p style="color:#666;font-size:13px;margin:4px 0"><strong>User-Agent:</strong> ${escapeHtml(userAgent)}</p>
      <p style="color:#666;font-size:13px;margin:4px 0"><strong>IP:</strong> ${escapeHtml(ip)}</p>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Quizmo Feedback <onboarding@resend.dev>",
      to,
      subject,
      html: htmlBody,
      replyTo: from.includes("@") ? from : undefined,
    });

    if (error) {
      return NextResponse.json({ error: "Failed to send" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 502 });
  }
}
