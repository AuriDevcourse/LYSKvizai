import { NextRequest, NextResponse } from "next/server";
import { networkInterfaces } from "os";

/**
 * Returns `true` for addresses we consider "phone on the same Wi-Fi can reach this."
 * Filters out link-local, loopback, and known virtual-adapter ranges
 * (Docker, WSL, Hyper-V, VPN defaults) that a friend's phone almost certainly can't reach.
 */
function looksReachable(addr: string): boolean {
  if (addr.startsWith("169.254.")) return false; // link-local
  if (addr.startsWith("127.")) return false; // loopback
  // Docker defaults: 172.17.0.0 – 172.31.255.255 (172.16/12 block used by Docker)
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(addr)) return false;
  // Docker Desktop on macOS uses 192.168.65.x
  if (addr.startsWith("192.168.65.")) return false;
  // Tailscale / CG-NAT (100.64.0.0/10)
  if (/^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./.test(addr)) return false;
  return true;
}

/**
 * Score an interface name by how likely it is to be the user's primary LAN adapter.
 * Physical Wi-Fi/Ethernet > anything mentioning "virtual"/"docker"/"wsl"/"vmware"/"vbox".
 */
function scoreInterfaceName(name: string): number {
  const lower = name.toLowerCase();
  if (/virtual|docker|wsl|vmware|vbox|hyper-?v|vethernet|loopback|bluetooth|npcap/.test(lower)) {
    return 0;
  }
  if (/wi-?fi|wlan|wireless/.test(lower)) return 3;
  if (/ethernet|eth\d|en\d/.test(lower)) return 2;
  return 1;
}

export async function GET(req: NextRequest) {
  // If there's a Host header (production behind nginx), use that
  const host = req.headers.get("host");
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    return NextResponse.json({ url: `${protocol}://${host}` });
  }

  // Fallback: LAN IP detection for local dev
  const ifaces = networkInterfaces();
  const candidates: { name: string; address: string; score: number }[] = [];

  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (iface.internal || iface.family !== "IPv4") continue;
      if (!looksReachable(iface.address)) continue;
      candidates.push({
        name,
        address: iface.address,
        score: scoreInterfaceName(name),
      });
    }
  }

  // Pick highest-scoring adapter; within the same score, prefer 192.168/10.x over others.
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const privA = a.address.startsWith("192.168.") || a.address.startsWith("10.") ? 1 : 0;
    const privB = b.address.startsWith("192.168.") || b.address.startsWith("10.") ? 1 : 0;
    return privB - privA;
  });

  const lanIp = candidates[0]?.address ?? "localhost";
  const port = req.nextUrl.port || "3000";

  return NextResponse.json({
    url: `http://${lanIp}:${port}`,
    // Expose other candidates so the UI can offer a fallback if the primary is wrong
    candidates: candidates.slice(0, 5).map((c) => `http://${c.address}:${port}`),
  });
}
