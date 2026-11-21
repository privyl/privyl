import type { NextConfig } from "next";
import { join } from "node:path";

// Security headers for every response. The Content Security Policy is set in src/proxy.ts,
// because it needs a new random nonce on each request.
// Scripts are also hash-checked with Subresource Integrity (experimental.sri below).
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const config: NextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework in an "X-Powered-By" header.
  poweredByHeader: false,
  // No source maps in the browser (this is already the default; kept explicit on purpose).
  productionBrowserSourceMaps: false,
  experimental: { sri: { algorithm: "sha256" } },
  // The site lives in a monorepo: let Next.js see the workspace root.
  turbopack: { root: join(import.meta.dirname, "../..") },
  outputFileTracingRoot: join(import.meta.dirname, "../.."),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
