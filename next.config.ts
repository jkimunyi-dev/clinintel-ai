import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude Prisma from serverless functions
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
