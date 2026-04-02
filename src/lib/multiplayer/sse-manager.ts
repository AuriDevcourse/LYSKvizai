import type { ServerEvent } from "./types";

type SSEController = ReadableStreamDefaultController<Uint8Array>;

interface Connection {
  controller: SSEController;
  playerId: string;
  roomCode: string;
}

const encoder = new TextEncoder();

// Persist on globalThis to survive HMR in development
const g = globalThis as typeof globalThis & {
  __sse_connections?: Map<string, Connection>;
  __sse_counter?: number;
};
if (!g.__sse_connections) g.__sse_connections = new Map();
if (!g.__sse_counter) g.__sse_counter = 0;

const connections = g.__sse_connections;

function nextConnectionId() {
  return `conn_${++g.__sse_counter!}`;
}

function formatSSE(event: ServerEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export function addConnection(
  roomCode: string,
  playerId: string,
  controller: SSEController
): string {
  const id = nextConnectionId();
  connections.set(id, { controller, playerId, roomCode });
  return id;
}

export function removeConnection(connectionId: string): void {
  connections.delete(connectionId);
}

/** Broadcast an event to all connections in a room */
export function broadcast(roomCode: string, event: ServerEvent): void {
  const message = encoder.encode(formatSSE(event));
  for (const [id, conn] of connections) {
    if (conn.roomCode === roomCode) {
      try {
        conn.controller.enqueue(message);
      } catch {
        // Connection closed, clean up
        connections.delete(id);
      }
    }
  }
}

/** Send an event to a specific connection */
export function sendTo(connectionId: string, event: ServerEvent): void {
  const conn = connections.get(connectionId);
  if (!conn) return;
  try {
    conn.controller.enqueue(encoder.encode(formatSSE(event)));
  } catch {
    connections.delete(connectionId);
  }
}

/** Get count of active connections for a room */
export function getConnectionCount(roomCode: string): number {
  let count = 0;
  for (const conn of connections.values()) {
    if (conn.roomCode === roomCode) count++;
  }
  return count;
}

/** Remove all connections for a room */
export function removeRoomConnections(roomCode: string): void {
  for (const [id, conn] of connections) {
    if (conn.roomCode === roomCode) {
      try {
        conn.controller.close();
      } catch {
        // already closed
      }
      connections.delete(id);
    }
  }
}
