import { NextRequest } from "next/server";
import { getRoom, getRoomSnapshot, handleConnectionLost, cancelPendingDisconnect, isHostOf } from "@/lib/multiplayer/room-store";
import { addConnection, removeConnection, countPlayerConnections, countRoomConnections } from "@/lib/multiplayer/sse-manager";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import type { ServerEvent } from "@/lib/multiplayer/types";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();
const HEARTBEAT_MS = 15_000;

function formatSSE(event: ServerEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const playerId = req.nextUrl.searchParams.get("playerId") ?? "unknown";
  const token = req.nextUrl.searchParams.get("token") ?? "";

  // This was the one route with no throttle at all. Each stream is a long-lived
  // connection holding a heartbeat timer, so without a limit a single caller
  // could open them until the box ran out of memory or file descriptors.
  const ip = getClientIp(req);
  if (!checkRateLimit(`sse:${ip}`, 30, 60_000)) {
    return new Response("Too many connections", { status: 429 });
  }

  const room = getRoom(code);
  if (!room) {
    return new Response("Room not found", { status: 404 });
  }

  // Membership check. `playerId` arrives as a query param and used to be taken
  // on trust, so anyone holding a room code could open the full live event feed
  // — and, by passing a real player's id, cancel that player's disconnect timer.
  // The host connects with their own host token instead of a player token.
  const player = room.players.get(playerId);
  const isRoomHost = isHostOf(code, playerId, token);
  if (!isRoomHost && (!player || player.token !== token)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Cap fan-out per room. A client stuck in a reconnect loop could otherwise
  // accumulate connections without bound.
  const MAX_ROOM_CONNECTIONS = Math.max(40, room.players.size * 4);
  if (countRoomConnections(upperCode) >= MAX_ROOM_CONNECTIONS) {
    return new Response("Room connection limit reached", { status: 503 });
  }

  // New connection for this player — cancel any pending disconnect timer.
  cancelPendingDisconnect(upperCode, playerId);

  let connectionId: string;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
    if (connectionId) {
      removeConnection(connectionId);
      const remaining = countPlayerConnections(upperCode, playerId);
      handleConnectionLost(upperCode, playerId, remaining > 0);
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      connectionId = addConnection(upperCode, playerId, controller);

      // Send initial room state
      try {
        const snapshot = getRoomSnapshot(room);
        const initEvent: ServerEvent = { type: "room-state", data: snapshot };
        controller.enqueue(encoder.encode(formatSSE(initEvent)));
      } catch {
        cleanup();
        return;
      }

      // Heartbeat — keeps proxies from killing idle streams AND detects dead connections.
      // If enqueue throws, the client is gone; clean up and mark disconnected.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          cleanup();
        }
      }, HEARTBEAT_MS);

      // Detect client disconnect via the request's abort signal
      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
