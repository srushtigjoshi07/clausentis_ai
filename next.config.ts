import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/dashboard/tenders/:path*',
        destination: '/tenders/:path*',
      },
      {
        source: '/dashboard/documents/:path*',
        destination: '/documents/:path*',
      },
      {
        source: '/dashboard/reports/:path*',
        destination: '/reports/:path*',
      },
      {
        source: '/dashboard/settings/:path*',
        destination: '/settings/:path*',
      },
    ];
  },
};

export default nextConfig;
