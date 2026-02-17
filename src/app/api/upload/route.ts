import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "quiz-images");

const ALLOWED_TYPES: Record<string, number> = {
  // Images — 5MB
  "image/jpeg": 5 * 1024 * 1024,
  "image/png": 5 * 1024 * 1024,
  "image/gif": 5 * 1024 * 1024,
  "image/webp": 5 * 1024 * 1024,
  // Audio — 10MB
  "audio/mpeg": 10 * 1024 * 1024,
  "audio/wav": 10 * 1024 * 1024,
  "audio/ogg": 10 * 1024 * 1024,
  "audio/webm": 10 * 1024 * 1024,
  // Video — 20MB
  "video/mp4": 20 * 1024 * 1024,
  "video/webm": 20 * 1024 * 1024,
  "video/ogg": 20 * 1024 * 1024,
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** POST /api/upload — upload an image, audio, or video file */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return json({ error: "Nepateiktas failas" }, 400);
    }

    const maxSize = ALLOWED_TYPES[file.type];
    if (!maxSize) {
      return json({ error: "Netinkamas failo tipas. Leidžiami: JPG, PNG, GIF, WebP, MP3, WAV, OGG, MP4, WebM" }, 400);
    }

    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      return json({ error: `Failas per didelis (max ${maxMB}MB)` }, 400);
    }

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin";
    const slug = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .slice(0, 40);
    const unique = `${slug}-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, unique);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return json({ url: `/quiz-images/${unique}` }, 201);
  } catch {
    return json({ error: "Klaida įkeliant failą" }, 500);
  }
}
