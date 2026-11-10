import type { MetadataRoute } from 'next';
import { listProducts, listCategories } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || '';
  const [products, cats] = await Promise.all([listProducts({}), listCategories()]);
  return [
    { url: `${base}/` }, { url: `${base}/shop` }, { url: `${base}/policies` }, { url: `${base}/loyalty` },
    ...cats.map((c) => ({ url: `${base}/category/${c.slug}` })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}` })),
  ];
}
