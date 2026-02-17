import { NextRequest, NextResponse } from "next/server";
import { networkInterfaces } from "os";

export async function GET(req: NextRequest) {
  // If there's a Host header (production behind nginx), use that
  const host = req.headers.get("host");
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    return NextResponse.json({ url: `${protocol}://${host}` });
  }

  // Fallback: LAN IP detection for local dev
  const ifaces = networkInterfaces();
  let lanIp = "localhost";

  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (iface.internal || iface.family !== "IPv4") continue;
      // Skip link-local addresses (169.254.x.x)
      if (iface.address.startsWith("169.254.")) continue;
      lanIp = iface.address;
      break;
    }
    if (lanIp !== "localhost") break;
  }

  const port = req.nextUrl.port || "3000";
  return NextResponse.json({
    url: `http://${lanIp}:${port}`,
  });
}
