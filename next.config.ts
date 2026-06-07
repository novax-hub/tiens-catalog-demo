import type { NextConfig } from "next";

const spacesCdnUrl = process.env.NEXT_PUBLIC_SPACES_CDN_URL ?? 'https://cdn.vivetiens.com';
const { hostname } = new URL(spacesCdnUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname,
      },
      {
        protocol: 'https',
        hostname: 'cdn.vivetiens.com',
      },
    ],
  },
};

export default nextConfig;
