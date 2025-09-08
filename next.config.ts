import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    autoPrerender: false, // desativa o aviso de pré-renderização automática
  },
}

export default nextConfig;
