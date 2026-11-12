import Link from 'next/link';
import { listCategories, listProducts } from '@/lib/catalog';

/** Landing-page category display: arch-shaped photo cards with the category's own pieces, a count and a hover reveal. */
export default async function CategoryShowcase() {
  const cats = await listCategories();
  const data = await Promise.all(cats.map(async (c) => ({ c, ps: await listProducts({ category: c.slug, limit: 40 }) })));
  // Give each category its own cover: prefer featured pieces, and never reuse a picture another category already shows.
  const used = new Set<string>();
  return (<div className="showcase">{data.map(({ c, ps }, i) => {
    const ranked = [...ps].sort((a, b) => Number(b.featured) - Number(a.featured));
    const all = ranked.map((p) => p.images[0]).filter(Boolean);
    const fresh = all.filter((im) => !used.has(im.url)); const imgs = [...fresh, ...all.filter((im) => used.has(im.url))].slice(0, 3);
    imgs.slice(0, 2).forEach((im) => used.add(im.url));
    return (<Link key={c.slug} href={`/category/${c.slug}`} className={`scard s${i % 4} reveal`} style={{ ['--d' as any]: `${i * 90}ms` }}>
      <span className="arch">{imgs[0] ? <img src={imgs[0].url} alt="" loading="lazy" /> : null}{imgs[1] && <img className="b" src={imgs[1].url} alt="" loading="lazy" />}</span>
      <span className="thumbs" aria-hidden="true">{imgs.slice(1).map((im, k) => <img key={k} src={im.url} alt="" loading="lazy" />)}</span>
      <span className="meta"><b>{c.name}</b><small>{c.blurb}</small><em>{ps.length} {ps.length === 1 ? 'piece' : 'pieces'} <i aria-hidden="true">→</i></em></span></Link>);
  })}</div>);
}
