import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 640, 828, 1080, 1280, 1440, 1920, 2560],
  },
};

export default nextConfig;
