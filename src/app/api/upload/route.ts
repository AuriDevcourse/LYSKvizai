import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { checkEditorAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const UPLOAD_DIR = path.join(process.cwd(), "public", "quiz-images");

/**
 * Allowed MIME types → the single extension each one is written with, plus a
 * size cap.
 *
 * The extension is decided HERE, from the sniffed content type — never taken
 * from the uploaded filename. Two bugs came from trusting `file.name`:
 *   1. `file.name.split(".").pop()` was used raw as the extension, so a name
 *      like `a.b/../../../../evil` escaped the upload directory entirely.
 *   2. Nothing cross-checked extension against type, so a file declared
 *      `image/png` but named `x.html` was written as .html and then served as
 *      HTML from the app's own origin — stored XSS with access to the host and
 *      player tokens in sessionStorage.
 */
const ALLOWED: Record<string, { ext: string; maxSize: number }> = {
  "image/jpeg": { ext: "jpg", maxSize: 5 * 1024 * 1024 },
  "image/png": { ext: "png", maxSize: 5 * 1024 * 1024 },
  "image/gif": { ext: "gif", maxSize: 5 * 1024 * 1024 },
  "image/webp": { ext: "webp", maxSize: 5 * 1024 * 1024 },
  "audio/mpeg": { ext: "mp3", maxSize: 10 * 1024 * 1024 },
  "audio/wav": { ext: "wav", maxSize: 10 * 1024 * 1024 },
  "audio/ogg": { ext: "ogg", maxSize: 10 * 1024 * 1024 },
  "audio/webm": { ext: "weba", maxSize: 10 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", maxSize: 20 * 1024 * 1024 },
  "video/webm": { ext: "webm", maxSize: 20 * 1024 * 1024 },
  "video/ogg": { ext: "ogv", maxSize: 20 * 1024 * 1024 },
};

/** Magic-number check — the declared Content-Type is client-supplied and can lie. */
function sniff(buf: Buffer): string | null {
  const b = (...bytes: number[]) => bytes.every((v, i) => buf[i] === v);
  if (b(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (b(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (b(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (b(0x52, 0x49, 0x46, 0x46) && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (b(0x52, 0x49, 0x46, 0x46) && buf.subarray(8, 12).toString() === "WAVE") return "audio/wav";
  if (b(0x49, 0x44, 0x33) || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) return "audio/mpeg";
  if (b(0x4f, 0x67, 0x67, 0x53)) return "audio/ogg"; // also video/ogg
  if (b(0x1a, 0x45, 0xdf, 0xa3)) return "video/webm"; // Matroska/WebM, also audio/webm
  if (buf.subarray(4, 8).toString() === "ftyp") return "video/mp4";
  return null;
}

/** Containers that share a magic number — accept the declared type within its family. */
const FAMILIES: Record<string, string[]> = {
  "audio/ogg": ["audio/ogg", "video/ogg"],
  "video/webm": ["video/webm", "audio/webm"],
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** POST /api/upload — upload quiz media. Editor-only. */
export async function POST(req: NextRequest) {
  // Writing into the public web root is admin surface, not player surface.
  const auth = checkEditorAuth(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const ip = getClientIp(req);
  if (!checkRateLimit(`upload:${ip}`, 20, 60_000)) {
    return json({ error: "Too many uploads — try again in a minute" }, 429);
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return json({ error: "No file provided" }, 400);
    }

    const declared = ALLOWED[file.type];
    if (!declared) {
      return json(
        { error: "Unsupported file type. Allowed: JPG, PNG, GIF, WebP, MP3, WAV, OGG, MP4, WebM" },
        400
      );
    }

    if (file.size > declared.maxSize) {
      return json({ error: `File too large (max ${Math.round(declared.maxSize / 1024 / 1024)}MB)` }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Re-check size against the real buffer — file.size is client-reported.
    if (buffer.length > declared.maxSize) {
      return json({ error: `File too large (max ${Math.round(declared.maxSize / 1024 / 1024)}MB)` }, 400);
    }

    const actual = sniff(buffer);
    const family = FAMILIES[actual ?? ""] ?? [actual];
    if (!actual || !family.includes(file.type)) {
      return json({ error: "File content does not match its type" }, 400);
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Filename is fully server-generated: a sanitized slug from the original
    // name for human readability, plus random bytes for uniqueness, plus the
    // extension this MIME type maps to. No user-controlled path segment survives.
    const slug =
      file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40)
        .toLowerCase() || "upload";
    const unique = `${slug}-${randomBytes(6).toString("hex")}.${declared.ext}`;
    const filePath = path.join(UPLOAD_DIR, unique);

    // Belt and braces: prove the resolved path is still inside UPLOAD_DIR.
    if (path.dirname(path.resolve(filePath)) !== path.resolve(UPLOAD_DIR)) {
      return json({ error: "Invalid filename" }, 400);
    }

    await fs.writeFile(filePath, buffer);

    return json({ url: `/quiz-images/${unique}` }, 201);
  } catch {
    return json({ error: "Failed to upload file" }, 500);
  }
}
