import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const apiBase = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.xn--kraftig-g1a.com"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  /**
   * Proxy Engine.IO so the browser hits same-origin (`/socket.io`, `/api/socket.io`) and avoids
   * CORS when the API does not allow `http://localhost:3000`. Next forwards to the real API host.
   */
  async rewrites() {
    return [
      { source: "/socket.io", destination: `${apiBase}/socket.io` },
      { source: "/socket.io/", destination: `${apiBase}/socket.io/` },
      { source: "/socket.io/:path*", destination: `${apiBase}/socket.io/:path*` },
      { source: "/api/socket.io", destination: `${apiBase}/api/socket.io` },
      { source: "/api/socket.io/", destination: `${apiBase}/api/socket.io/` },
      { source: "/api/socket.io/:path*", destination: `${apiBase}/api/socket.io/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.xn--kraftig-g1a.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'cdn.kraftigo.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.eu-west-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdn.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
