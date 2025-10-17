import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: true,
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
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
