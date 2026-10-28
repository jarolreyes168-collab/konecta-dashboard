/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/app.html',
      },
      {
        source: '/resumen',
        destination: '/app.html',
      },
    ];
  },
};

export default nextConfig;
