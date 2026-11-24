import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-left",
  },
  experimental: {
    // Default Next.js cuma 10MB untuk request yang lewat middleware.ts
    // (termasuk /api/admin/upload, karena matcher-nya mencakup /api/admin/*) —
    // tanpa ini, upload video >10MB kepotong diam-diam lalu gagal diproses.
    middlewareClientMaxBodySize: "320mb",
  },
};

export default nextConfig;
