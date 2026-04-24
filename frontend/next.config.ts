import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/r/:shortCode",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "https://shadowscale-gateway.onrender.com"}/r/:shortCode`,
      },
    ];
  },
};

export default nextConfig;
