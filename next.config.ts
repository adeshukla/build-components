import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev indicator adds its own DOM to every page, which would pollute axe runs on the harness.
  devIndicators: false,
};

export default nextConfig;
