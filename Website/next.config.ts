import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cấu hình tối ưu chuẩn của Vercel (bỏ export và basePath)
  images: {
    unoptimized: false, // Bật tối ưu hóa hình ảnh chuẩn Next.js
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
