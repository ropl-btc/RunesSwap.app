import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disable Strict Mode for testing
  eslint: {
    dirs: ['src'],
  },
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
