import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" - dihapus
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;