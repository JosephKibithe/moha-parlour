import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "moha-parlour.pages.dev",
        "*.moha-parlour.pages.dev",
        "moha-parlour.joethetraplord.workers.dev",
      ],
    },
  },
};

export default nextConfig;
