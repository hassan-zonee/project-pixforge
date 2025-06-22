/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
      {
        source: '/resized/:path*',
        destination: '/api/resized/:path*',
      },
    ];
  },
};

module.exports = nextConfig;