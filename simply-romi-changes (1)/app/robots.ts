import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL || '';
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/pay', '/order', '/checkout', '/cart'] }, ...(base ? { sitemap: `${base}/sitemap.xml` } : {}) };
}
