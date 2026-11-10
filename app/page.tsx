import Link from 'next/link';
import { cookies } from 'next/headers';
import ProductCard from '@/components/ProductCard';
import { listCategories, listProducts } from '@/lib/catalog';
import { getRecommendations } from '@/lib/reco';
import { VISITOR_COOKIE, NOPERS_COOKIE } from '@/lib/behavior';
import { getSettings } from '@/lib/config';
import { rupees } from '@/lib/money';
import { getStore } from '@/lib/config';

export const dynamic = 'force-dynamic';
export default async function Home() {
  const cats = await listCategories(); const featured = await listProducts({ featured: true, limit: 8 });
  const c = await cookies(); const pers = !c.get(NOPERS_COOKIE);
  const recos = pers ? await getRecommendations(c.get(VISITOR_COOKIE)?.value, 4) : [];
  const personal = recos.some((r) => r.tier !== 'new'); const s = await getSettings(); const st = await getStore();
  return (<>
    <section className="hero"><div className="grid">
      <div>
        <p className="eyebrow">Handmade gifts &amp; bouquets</p><h1>A little luxury in every detail.</h1>
        <p className="lead">Bouquets, accessories and custom gifts, made by hand one at a time in a small Chennai studio and sent to your door anywhere in India.</p>
        <div className="row"><Link className="btn gold" href="/shop">Shop the studio</Link><a className="btn alt" href="https://www.instagram.com/simplyromi.studio" target="_blank" rel="noopener noreferrer">Custom order on Instagram</a></div>
        <p className="note" style={{ marginTop: 14 }}>Free delivery from {rupees(s.freeShippingThresholdPaise)}. GST included in every price.</p>
      </div>
      <img className="mark" src="/logo.svg" alt="Simply Romi, handmade gifts and bouquets" width={380} height={380} />
    </div></section>
    <section className="trust" aria-label="Why shop with us">
      <div><b>Handmade in Chennai</b><span>Every piece made one at a time</span></div>
      <div><b>Custom orders welcome</b><span>Your colours, names and occasion</span></div>
      <div><b>Free delivery from {rupees(s.freeShippingThresholdPaise)}</b><span>Shipped across India</span></div>
      <div><b>Never wilts</b><span>Bouquets that last for years</span></div>
    </section>
    <section className="section" aria-labelledby="cats"><h2 id="cats">Shop by category</h2>
      <div className="cats">{cats.map((c, i) => <Link key={c.slug} href={`/category/${c.slug}`} className={`cat c${i}`}><h3>{c.name}</h3><span>{c.blurb}</span></Link>)}</div>
    </section>
    <section className="section" aria-labelledby="feat"><div className="sechead"><h2 id="feat">Studio favourites</h2><Link href="/shop">See everything</Link></div>
      <div className="grid4">{featured.length ? featured.map((p) => <ProductCard key={p.id} p={p} />) : <p>New pieces are being photographed. Please check back soon.</p>}</div>
    </section>
    {recos.length > 0 && <section className="section" aria-labelledby="rec"><div className="sechead"><h2 id="rec">{personal ? 'Picked for you' : 'New from the studio'}</h2>{personal && <span className="note">Based only on what you viewed, carted or bought on this site. You can switch this off in the footer.</span>}</div>
      <div className="grid4">{recos.map((r) => <ProductCard key={r.product.id} p={r.product} reason={r.reason} />)}</div></section>}
    <section className="band" aria-labelledby="gift"><div className="wrap">
      <p className="eyebrow" style={{ color: '#f6c23e' }}>Made for gifting</p><h2 id="gift">A gift that is made just for them</h2>
      <ol className="steps">
        <li><b>1. Tell us</b><span>Share the occasion, colours and your budget.</span></li>
        <li><b>2. We design</b><span>We reply with ideas and a price, then start making.</span></li>
        <li><b>3. We deliver</b><span>Gift-ready and sent to your door anywhere in India.</span></li>
      </ol>
      <div className="row"><Link className="btn gold" href="/custom">Start a custom order</Link><a className="btn alt" style={{ color: '#fff', borderColor: '#fff' }} href={st.instagram} target="_blank" rel="noopener noreferrer">Or message us on Instagram</a></div>
    </div></section>
    <section className="section story" aria-labelledby="about"><img src="/logo.svg" alt="" width={220} height={220} />
      <div><h2 id="about">Meet Simply Romi</h2><p>Simply Romi is a small handmade studio in Chennai. We make bouquets, accessories and gifts that never wilt: chenille flowers, crochet daisies, woven pieces and keepsakes, shaped by hand, one at a time.</p><p>Because everything is made to order or in small batches, we can match your colours, add a name, or build something new from your idea.</p><Link className="btn alt" href="/shop">Browse the shop</Link></div></section>
    <section className="section" aria-labelledby="faq"><h2 id="faq">Good to know</h2><div className="faq">
      <details><summary>Do you deliver across India?</summary><p>Yes. We ship anywhere in India, and delivery is free on orders of {rupees(s.freeShippingThresholdPaise)} and above.</p></details>
      <details><summary>Can I choose the colours or add a name?</summary><p>Many pieces can be personalised. Choose an option on the product page, or send a <Link href="/custom">custom order request</Link> and we will make it your way.</p></details>
      <details><summary>How do I look after chenille and crochet pieces?</summary><p>Keep them dry and away from strong sun, and dust them gently with a soft brush or a cool hairdryer.</p></details>
      <details><summary>When will my order arrive?</summary><p>Ready pieces ship quickly. Made-to-order pieces show their dispatch date on the product page before you buy. See our <Link href="/policies">shipping and returns</Link> page for details.</p></details>
    </div></section>
    <section className="section"><div className="box"><h2>How we make and ship</h2><p>Ready pieces ship from Chennai within the days shown on the product page. Made-to-order pieces show their own dispatch date before you pay, calculated from the lead time we set for that piece. Nothing on this site is a countdown. Stock numbers are the real numbers on our shelf.</p></div></section>
  </>);
}
