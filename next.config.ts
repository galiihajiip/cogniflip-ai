import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md is a curated, competition-reviewed agent document; `next dev`
  // must not inject its own managed block into it.
  agentRules: false,
  poweredByHeader: false,
  // Baseline security headers for every route (BLOCK 53).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Microphone/camera/location are off until a reviewed feature needs them.
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
      {
        // Learner code runs in this worker (D-012). Its own CSP lets it load
        // only same-site scripts, WebAssembly and data, and blocks every
        // connection to other servers. Listed after the global rule so this
        // CSP is the one sent for the worker.
        source: "/runner/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
          },
        ],
      },
      {
        // Learner JavaScript worker (D-015): may evaluate code, but can load
        // nothing and connect nowhere.
        source: "/runner-js/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; script-src 'self' 'unsafe-eval'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
