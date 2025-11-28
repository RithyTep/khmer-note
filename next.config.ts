import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      // OAuth provider profile images
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // GitHub
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com", // Facebook
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com", // Twitter/X
      },
      // Cover images from Unsplash
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
