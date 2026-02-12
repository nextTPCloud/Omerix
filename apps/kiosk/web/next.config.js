/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Habilitar standalone para deployment en contenedores
  output: 'standalone',
  // Configurar para pantallas tactiles
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
