import { NextRequest } from "next/server";
import { getRoom, getRoomSnapshot } from "@/lib/multiplayer/room-store";
import { addConnection, removeConnection } from "@/lib/multiplayer/sse-manager";
import type { ServerEvent } from "@/lib/multiplayer/types";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function formatSSE(event: ServerEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const playerId = req.nextUrl.searchParams.get("playerId") ?? "unknown";

  const room = getRoom(code);
  if (!room) {
    return new Response("Kambarys nerastas", { status: 404 });
  }

  let connectionId: string;

  const stream = new ReadableStream({
    start(controller) {
      connectionId = addConnection(code.toUpperCase(), playerId, controller);

      // Send initial room state
      const snapshot = getRoomSnapshot(room);
      const initEvent: ServerEvent = { type: "room-state", data: snapshot };
      controller.enqueue(encoder.encode(formatSSE(initEvent)));
    },
    cancel() {
      if (connectionId) {
        removeConnection(connectionId);
      }
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
