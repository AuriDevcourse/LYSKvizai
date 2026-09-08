import type { NextConfig } from "next";
import path from "node:path";

const MP_SERVER = process.env.MP_SERVER_URL;
if (!MP_SERVER) {
  console.warn("⚠ MP_SERVER_URL not set — multiplayer rewrites will not work");
}

const nextConfig: NextConfig = {
  reactCompiler: true,

  /**
   * Quiz pictures were served at full size to every phone at once: 2.7 MB
   * across `public/quiz-images`, with `redwood.jpg` alone at 294 KB for a slot
   * a few hundred pixels tall, times thirty players on venue wifi. Routing
   * them through the optimizer resizes and re-encodes to webp/avif per device.
   *
   * `upload.wikimedia.org` is the one external host any quiz references (30
   * questions). Listed explicitly rather than wildcarded, so the optimizer
   * can't be pointed at arbitrary hosts.
   */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/wikipedia/**" },
    ],
    // The slots these fill are small; the largest is about half a 1080p screen.
    deviceSizes: [360, 480, 640, 828, 1080],
    imageSizes: [96, 160, 256, 384],
    // Next 16 only serves qualities declared here. 65 for quiz photos: they
    // sit in short, heavily cropped slots where the difference isn't visible,
    // and it takes a meaningful bite out of the transfer. 75 stays for
    // anything that asks for the default.
    qualities: [65, 75],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingIncludes: {
    "/api/**": ["./data/quizzes/**"],
  },
  /**
   * Long-lived caching for the static assets under `public/`, and baseline
   * security headers.
   *
   * Next only sets immutable caching for its own `_next/static` output, so
   * everything in `public/` — 87 avatars, the quiz images, the lobby MP3 — was
   * being revalidated on every visit. These files are content-addressed by
   * hand (a new picture gets a new name), so a year of immutable caching is
   * safe; the one exception is the Tint manifest, which is edited in place.
   *
   * The security headers cover improvement 2.4: the editor was iframeable
   * while holding a bearer token in `sessionStorage`. No CSP here — this app
   * relies on inline styles and a real policy needs to be built and tested
   * against the whole surface rather than guessed at.
   */
  async headers() {
    const immutable = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];
    return [
      {
        source: "/:all*(svg|png|jpg|jpeg|webp|avif|gif|ico|mp3|wav|woff2)",
        headers: immutable,
      },
      {
        // Edited in place, so it must never be pinned.
        source: "/tint-local/manifest.json",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          /*
           * SAMEORIGIN, not DENY.
           *
           * Both refuse framing by any other origin, which is the clickjacking
           * threat this header exists for, so the protection is unchanged.
           * DENY additionally refuses to let the app frame *itself*, which buys
           * nothing and costs the ability to preview or test one of our own
           * pages inside another of our own pages.
           */
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
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
