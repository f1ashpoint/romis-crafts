import { redirect } from 'next/navigation';
import AccountNav from '@/components/AccountNav';
import ProductCard from '@/components/ProductCard';
import { getCustomer, wishlistIds } from '@/lib/customer';
import { getProductById } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your wishlist', robots: { index: false } };
export default async function Wishlist() {
  const c = await getCustomer(); if (!c) redirect('/account/login?next=/account/wishlist');
  const ps = (await Promise.all((await wishlistIds(c.id)).map((id) => getProductById(id)))).filter((p) => p && p.status === 'active');
  return (<div className="section"><AccountNav here="/account/wishlist" name={c.name} />
    {!ps.length ? <div className="box"><p>Tap the heart on any piece to save it here.</p><a className="btn" href="/shop">Browse the shop</a></div> : <div className="grid">{ps.map((p) => <ProductCard key={p!.id} p={p!} />)}</div>}</div>);
}
