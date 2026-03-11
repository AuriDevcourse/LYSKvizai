/** Multiplayer server base URL (Hetzner) */
export const MP_HTTP_URL =
  process.env.NEXT_PUBLIC_MP_URL || "http://46.225.135.183:3002";

export const MP_WS_URL =
  process.env.NEXT_PUBLIC_MP_WS_URL || "ws://46.225.135.183:3002";
