import type { NextConfig } from "next";
import { join } from "node:path";

const config: NextConfig = {
  reactStrictMode: true,
  // The site lives in a monorepo: let Next.js see the workspace root.
  turbopack: { root: join(import.meta.dirname, "../..") },
  outputFileTracingRoot: join(import.meta.dirname, "../.."),
};

export default config;
