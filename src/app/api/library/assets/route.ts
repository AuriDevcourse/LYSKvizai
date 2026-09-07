import { NextRequest, NextResponse } from "next/server";
import { collectAssets } from "@/lib/library";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

/**
 * GET /api/library/assets — the media on disk, with who references it.
 *
 * Only the folders named in `ASSET_FOLDERS` are listed, and the caller cannot
 * name one: there is no path parameter to traverse. Everything reported here is
 * already served statically from `public/`, so listing it discloses nothing
 * that a correct guess wouldn't.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`library:${ip}`, 20, 10_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const payload = await collectAssets();
  return NextResponse.json(payload);
}
