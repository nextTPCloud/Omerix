import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita la generacion estatica de paginas
  output: 'standalone',
};

export default nextConfig;
