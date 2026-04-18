import { NextRequest } from "next/server";
import { getRoom, getRoomSnapshot, handleConnectionLost, cancelPendingDisconnect } from "@/lib/multiplayer/room-store";
import { addConnection, removeConnection, countPlayerConnections } from "@/lib/multiplayer/sse-manager";
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

  const room = getRoom(code);
  if (!room) {
    return new Response("Kambarys nerastas", { status: 404 });
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
