/**
 * Multiplayer API/SSE base URLs.
 * Always uses local Next.js API routes. If an external MP server is needed
 * in the future, set MP_SERVER_URL and the Vercel rewrites will proxy /mp/* paths.
 */
export const MP_API_URL = "/api";
export const MP_SSE_URL = "/api/rooms";
export const SSE_SUFFIX = "/stream";
