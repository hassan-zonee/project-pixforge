/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Increase memory limit for Node.js
  experimental: {
    // Reduce the size of the build traces
    outputFileTracingIgnores: [
      // Ignore node_modules
      'node_modules/**/*',
      // Ignore test files
      '**/*.test.*',
      '**/*.spec.*',
      // Ignore development files
      '.git/**',
      '.github/**',
      '.vscode/**'
    ],
    // Optimize memory usage
    memoryBasedWorkersCount: true,
  },
  // Configure rewrites
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
  // Optimize image handling
  images: {
    domains: ['localhost'],
    unoptimized: true, // Since we're handling our own image processing
  },
};

module.exports = nextConfig;