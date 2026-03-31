import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Variantes responsivas: evita servir imágenes 4K donde no hacen falta
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    remotePatterns: [
      // VPS de producción: imágenes servidas por nginx
      {
        protocol: 'https',
        hostname: 'alexis.iwebtecnology.com',
        pathname: '/media/images/**',
      },
      // Dev local: FastAPI sirve las imágenes en localhost
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/uploads/images/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.vimeo.com; child-src 'self' https://player.vimeo.com; frame-src 'self' https://player.vimeo.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
