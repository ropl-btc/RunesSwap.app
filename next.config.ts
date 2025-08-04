import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disable Strict Mode for testing
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      '@headlessui/react',
      'recharts'
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'icon.unisat.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sats-terminal-node.azurewebsites.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ordinals.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ordiscan.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
