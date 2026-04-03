/**
 * Multiplayer API/SSE base URLs.
 * In production: proxied through Vercel rewrites (/mp/api, /mp/sse) to Hetzner.
 * In local dev (no MP_SERVER_URL): fall back to local Next.js API routes.
 *
 * SSE URL is used as: `${MP_SSE_URL}/${code}` in production (maps to /sse/:code on Hetzner)
 * or `${MP_SSE_URL}/${code}/stream` in local dev (maps to /api/rooms/:code/stream).
 */
const IS_LOCAL_DEV =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const MP_API_URL = IS_LOCAL_DEV ? "/api" : "/mp/api";
export const MP_SSE_URL = IS_LOCAL_DEV ? "/api/rooms" : "/mp/sse";
export const SSE_SUFFIX = IS_LOCAL_DEV ? "/stream" : "";
