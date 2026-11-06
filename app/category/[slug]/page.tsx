import { notFound } from 'next/navigation';
import Listing, { type Search } from '@/components/Filters';
import { listCategories } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: (await listCategories()).find((c) => c.slug === slug)?.name ?? 'Category' }; }
export default async function Category({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Search> }) {
  const { slug } = await params; const sp = await searchParams;
  const c = (await listCategories()).find((x) => x.slug === slug); if (!c) notFound();
  return <div className="section"><h1>{c.name}</h1><p>{c.blurb}</p><Listing category={c.slug} sp={sp} action={`/category/${c.slug}`} /></div>;
}
