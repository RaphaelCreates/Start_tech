import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    autoPrerender: false, // desativa o aviso de pré-renderização automática
  },
  eslint: {
    ignoreDuringBuilds: true, // correct property to ignore ESLint errors during build
  },
}

export default nextConfig;
