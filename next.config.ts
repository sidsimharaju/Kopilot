import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/skills/**": ["./skills/**"],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
