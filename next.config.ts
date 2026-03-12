import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        // Local development backend (specific path for safety)
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },
      {
        // Any HTTPS host — covers CDN uploads, object storage, federation servers
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
      {
        // Any HTTP host for local federation / dev servers
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
