import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/TEST",
  assetPrefix: "/TEST",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
