import type { NextConfig } from "next";

const MP_SERVER = process.env.MP_SERVER_URL || "http://46.225.135.183:3002";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
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
