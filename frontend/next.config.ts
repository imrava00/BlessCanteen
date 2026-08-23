import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use static export for PythonAnywhere deployment
  output: "export",
  // Remove trailing slash for clean URLs
  trailingSlash: true,
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Base path for subdirectory deployment (uncomment if needed)
  // basePath: '/your-app-name',
  
  // Images configuration for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
