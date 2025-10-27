/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for optimized production builds
  output: 'standalone',

  // React Compiler for automatic optimization
  // Eliminates need for manual useMemo/useCallback in most cases
  reactCompiler: true,

  experimental: {
    // Server Actions configuration
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', ...(process.env.CORS_ORIGIN?.split(',') || [])],
    },
  },

  // Environment variables exposed to the browser
  // Note: NEXT_PUBLIC_* variables are automatically available
  env: {
    // Server-side only variables (not exposed to browser)
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID,
    API_URL: process.env.API_URL,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
      },
      {
        protocol: 'https',
        hostname: 'nyc.cloud.appwrite.io',
      },
    ],
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGIN || 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
