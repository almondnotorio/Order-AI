import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress the Prisma generated client deprecation notices
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {},
};

export default nextConfig;
