import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lafabricadelpanel.com.ar',
      },
    ],
  },
  transpilePackages: ['three'],
};

export default nextConfig;
