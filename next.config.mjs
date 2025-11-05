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
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
          },
        ],
      },
      {
        source: '/api/event-registrations/qr-verify',
        headers: [
          {
            key: 'X-RateLimit-Limit',
            value: '10',
          },
          {
            key: 'X-RateLimit-Window',
            value: '60000', // 1 minute in milliseconds
          },
        ],
      },
    ];
  },
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
