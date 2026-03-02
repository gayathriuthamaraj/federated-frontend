import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        // Local development backend
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },
      {
        // Allow any https host so federated servers work without per-host config
        protocol: 'https',
        hostname: '**',
        pathname: '/uploads/**',
      },
      {
        // Allow any http host for local federation testing
        protocol: 'http',
        hostname: '**',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
