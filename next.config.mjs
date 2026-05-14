/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['leaflet'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.supabase.co",
              "frame-src https://www.openstreetmap.org",
              "connect-src 'self' https://*.supabase.co https://api.resend.com https://nominatim.openstreetmap.org",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
