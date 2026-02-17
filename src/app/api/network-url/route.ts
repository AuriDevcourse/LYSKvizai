import { NextRequest, NextResponse } from "next/server";
import { networkInterfaces } from "os";

export async function GET(req: NextRequest) {
  const ifaces = networkInterfaces();
  let lanIp = "localhost";

  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      // Skip internal and non-IPv4
      if (iface.internal || iface.family !== "IPv4") continue;
      lanIp = iface.address;
      break;
    }
    if (lanIp !== "localhost") break;
  }

  const port = req.nextUrl.port || "3000";
  const protocol = req.nextUrl.protocol || "http:";

  return NextResponse.json({
    url: `${protocol}//${lanIp}:${port}`,
  });
}
