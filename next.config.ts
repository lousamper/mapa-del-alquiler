import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],

  productionBrowserSourceMaps: false,
  experimental: {
    serverSourceMaps: false,
  },

  // para evitar el error de build con Turbopack en Next 16
  turbopack: {},
};

export default nextConfig;