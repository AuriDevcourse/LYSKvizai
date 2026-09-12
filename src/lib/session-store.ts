"use client";

/**
 * Client-side store for a player's multiplayer identity.
 *
 * Uses localStorage, not sessionStorage: people play on mobile data in a pub,
 * where a phone locks, the browser is switched away, or the OS discards a
 * backgrounded tab — all of which wipe sessionStorage and used to strand a
 * player (or, worse, the host) with no way back into their seat. localStorage
 * survives a closed tab and a killed browser, so reopening the room link drops
 * you straight back in.
 *
 * Per-room credentials are keyed by room code so a stale token from a previous
 * game is never presented to a new one. The device id is global and stable.
 */

const DEVICE_KEY = "quiz-device-id";

function safeGet(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function safeSet(k: string, v: string): void {
  try { localStorage.setItem(k, v); } catch { /* private mode / disabled */ }
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Stable per-device id, created once and reused across games. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = safeGet(DEVICE_KEY);
  if (!id) {
    id = generateId();
    safeSet(DEVICE_KEY, id);
  }
  return id;
}

export interface RoomSession {
  playerId: string;
  playerToken?: string;
  name?: string;
  emoji?: string;
  hostId?: string;
  hostToken?: string;
  hostPlaying?: boolean;
}

function roomKey(code: string): string {
  return `quiz-room:${code.toUpperCase()}`;
}

export function getRoomSession(code: string): RoomSession | null {
  if (typeof window === "undefined" || !code) return null;
  const raw = safeGet(roomKey(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoomSession;
  } catch {
    return null;
  }
}

export function saveRoomSession(code: string, data: RoomSession): void {
  if (typeof window === "undefined" || !code) return;
  safeSet(roomKey(code), JSON.stringify(data));
}

/** Drop the host credentials for a room (kept player fields), e.g. when the
 * server says the stored host token no longer owns the room. */
export function clearHostFromSession(code: string): void {
  const s = getRoomSession(code);
  if (!s) return;
  delete s.hostId;
  delete s.hostToken;
  delete s.hostPlaying;
  saveRoomSession(code, s);
}
