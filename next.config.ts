import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  // Loaded by Node at runtime rather than bundled.
  serverExternalPackages: ['pdfkit', 'pg', '@electric-sql/pglite'],
  // pdfkit loads its built-in font metrics from disk, so make sure they ship with the invoice route.
  outputFileTracingIncludes: { '/api/orders/[token]/invoice': ['./node_modules/pdfkit/js/**/*'] },
  images: { remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }] },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ] }];
  },
};
export default config;
