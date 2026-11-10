import Link from 'next/link';
import { cookies } from 'next/headers';
import ProductCard from '@/components/ProductCard';
import { listCategories, listProducts } from '@/lib/catalog';
import { getRecommendations } from '@/lib/reco';
import { VISITOR_COOKIE, NOPERS_COOKIE } from '@/lib/behavior';
import { getSettings } from '@/lib/config';
import { rupees } from '@/lib/money';

export const dynamic = 'force-dynamic';
export default async function Home() {
  const cats = await listCategories(); const featured = await listProducts({ featured: true, limit: 8 });
  const c = await cookies(); const pers = !c.get(NOPERS_COOKIE);
  const recos = pers ? await getRecommendations(c.get(VISITOR_COOKIE)?.value, 4) : [];
  const personal = recos.some((r) => r.tier !== 'new'); const s = await getSettings();
  return (<>
    <section className="hero"><div className="grid">
      <div>
        <p className="eyebrow">Handmade gifts &amp; bouquets</p><h1>A little luxury in every detail.</h1>
        <p className="lead">Bouquets, accessories and custom gifts, made by hand one at a time in a small Chennai studio and sent to your door anywhere in India.</p>
        <div className="row"><Link className="btn gold" href="/shop">Shop the studio</Link><a className="btn alt" href="https://www.instagram.com/simplyromi.studio" target="_blank" rel="noopener noreferrer">Custom order on Instagram</a></div>
        <p className="note" style={{ marginTop: 14 }}>Free delivery from {rupees(s.freeShippingThresholdPaise)}. GST included in every price.</p>
      </div>
      <img className="mark" src="/logo.png" alt="Simply Romi, handmade gifts and bouquets" width={380} height={380} />
    </div></section>
    <section className="section" aria-labelledby="cats"><h2 id="cats">Shop by craft</h2>
      <div className="cats">{cats.map((c, i) => <Link key={c.slug} href={`/category/${c.slug}`} className={`cat c${i}`}><h3>{c.name}</h3><span>{c.blurb}</span></Link>)}</div>
    </section>
    <section className="section" aria-labelledby="feat"><div className="sechead"><h2 id="feat">Studio favourites</h2><Link href="/shop">See everything</Link></div>
      <div className="grid4">{featured.length ? featured.map((p) => <ProductCard key={p.id} p={p} />) : <p>New pieces are being photographed. Please check back soon.</p>}</div>
    </section>
    {recos.length > 0 && <section className="section" aria-labelledby="rec"><div className="sechead"><h2 id="rec">{personal ? 'Picked for you' : 'New from the studio'}</h2>{personal && <span className="note">Based only on what you viewed, carted or bought on this site. You can switch this off in the footer.</span>}</div>
      <div className="grid4">{recos.map((r) => <ProductCard key={r.product.id} p={r.product} reason={r.reason} />)}</div></section>}
    <section className="section"><div className="box"><h2>How we make and ship</h2><p>Ready pieces ship from Chennai within the days shown on the product page. Made-to-order pieces show their own dispatch date before you pay, calculated from the lead time we set for that piece. Nothing on this site is a countdown. Stock numbers are the real numbers on our shelf.</p></div></section>
  </>);
}
