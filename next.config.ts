import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],

  // No sourcemaps (evita el crash del overlay)
  productionBrowserSourceMaps: false,

  experimental: {
    serverSourceMaps: false,
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false; // 🔥 corta los sourcemaps en dev
    }
    return config;
  },
};

export default nextConfig;