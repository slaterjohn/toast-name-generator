import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: no server, no API routes, no runtime name service.
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
