import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  experimental: {
    // Required for server actions with streaming
  },
}

export default nextConfig
