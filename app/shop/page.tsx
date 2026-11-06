import Listing, { type Search } from '@/components/Filters';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shop everything' };
export default async function Shop({ searchParams }: { searchParams: Promise<Search> }) {
  return <div className="section"><h1>Everything in the studio</h1><Listing sp={await searchParams} action="/shop" /></div>;
}
