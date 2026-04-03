import type { NextConfig } from "next";

const MP_SERVER = process.env.MP_SERVER_URL;
if (!MP_SERVER) {
  console.warn("⚠ MP_SERVER_URL not set — multiplayer rewrites will not work");
}

const nextConfig: NextConfig = {
  reactCompiler: true,
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
