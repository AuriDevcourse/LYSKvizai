import type { NextConfig } from "next";
import path from "node:path";

const MP_SERVER = process.env.MP_SERVER_URL;
if (!MP_SERVER) {
  console.warn("⚠ MP_SERVER_URL not set — multiplayer rewrites will not work");
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingIncludes: {
    "/api/**": ["./data/quizzes/**"],
  },
  async rewrites() {
    if (!MP_SERVER) return [];
    return [
      {
        source: "/mp/api/:path*",
        destination: `${MP_SERVER}/api/:path*`,
      },
      {
        source: "/mp/sse/:path*",
        destination: `${MP_SERVER}/sse/:path*`,
      },
    ];
  },
};

export default nextConfig;
