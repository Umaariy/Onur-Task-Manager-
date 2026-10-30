import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build in .next/standalone (no node_modules needed on the server).
  output: "standalone",
  // The second design runs from its own build folder so both can run at once (npm run dev:b).
  distDir: process.env.OTM_DIST_DIR || ".next",
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "same-origin" },
      ],
    }, {
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      ],
    }];
  },
};

export default nextConfig;
