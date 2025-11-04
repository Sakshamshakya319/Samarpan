/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  onDemandEntries: {
    maxInactiveAge: 15000,
    pagesBufferLength: 2,
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Mark Node.js built-in modules as external to prevent bundling in browser
    if (!isServer) {
      config.externals = [
        ...(config.externals || []),
        'child_process',
        'fs',
        'path',
        'os',
        'crypto',
        'stream',
        'util',
        'net',
        'tls',
        'http',
        'https',
        'zlib',
        'vm',
        'events',
        'buffer',
        'string_decoder',
        'perf_hooks',
        'inspector',
      ];
    }
    return config;
  },
}

export default nextConfig
