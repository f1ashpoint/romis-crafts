import { z } from 'zod';
import { getDb, NOW_SQL } from './db';
import { getSettings } from './config';
import { toPaise } from './money';
import { ensureDemoCatalogue } from './seed';

export interface Variant { id: number; label: string; sku: string; pricePaise: number; stock: number }
export interface Product {
  id: number; slug: string; name: string; description: string; pricePaise: number; gstRate: number; hsn: string;
  leadTimeDays: number | null; madeToOrder: boolean; status: 'active' | 'archived'; featured: boolean;
  engraving: { enabled: boolean; max: number; feePaise: number };
  categories: { slug: string; name: string }[]; variants: Variant[]; images: { url: string; alt: string }[];
  addonIds: number[]; totalStock: number; inStock: boolean;
}

const istDate = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
/** Dispatch-by date for a made-to-order item ordered at `from`. Calendar days, IST. */
export function dispatchDate(leadDays: number, from = new Date()): string {
  return istDate(new Date(from.getTime() + leadDays * 86400_000));
}
export const formatDate = (iso: string) =>
  new Date(iso + 'T00:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

type Row = Record<string, any>;
async function hydrate(rows: Row[]): Promise<Product[]> {
  if (!rows.length) return [];
  const db = await getDb(); const settings = await getSettings();
  const ids = rows.map((r) => r.id); const q = ids.map(() => '?').join(',');
  const [cats, vars, imgs, adds] = await Promise.all([
    db.all(`SELECT pc.product_id pid, c.slug, c.name FROM product_categories pc JOIN categories c ON c.id=pc.category_id WHERE pc.product_id IN (${q}) ORDER BY c.sort`, ...ids),
    db.all(`SELECT * FROM variants WHERE product_id IN (${q}) ORDER BY sort, id`, ...ids),
    db.all(`SELECT * FROM product_images WHERE product_id IN (${q}) ORDER BY sort, id`, ...ids),
    db.all(`SELECT product_id pid, addon_product_id aid FROM product_addons WHERE product_id IN (${q})`, ...ids),
  ]);
  return rows.map((r) => {
    const categories = cats.filter((c) => c.pid === r.id).map((c) => ({ slug: c.slug, name: c.name }));
    const variants = vars.filter((v) => v.product_id === r.id).map((v) => ({ id: v.id, label: v.label, sku: v.sku, pricePaise: v.price_paise ?? r.price_paise, stock: v.stock }));
    const totalStock = variants.reduce((s, v) => s + v.stock, 0);
    const madeToOrder = r.lead_time_days !== null;
    return {
      id: r.id, slug: r.slug, name: r.name, description: r.description, pricePaise: r.price_paise,
      gstRate: r.gst_rate ?? settings.categoryGst[categories[0]?.slug] ?? 18, hsn: r.hsn,
      leadTimeDays: r.lead_time_days, madeToOrder, status: r.status, featured: !!r.featured,
      engraving: { enabled: !!r.engraving_enabled, max: r.engraving_max, feePaise: r.engraving_fee_paise },
      categories, variants, images: imgs.filter((i) => i.product_id === r.id).map((i) => ({ url: i.url, alt: i.alt || r.name })),
      addonIds: adds.filter((a) => a.pid === r.id).map((a) => a.aid), totalStock, inStock: madeToOrder || totalStock > 0,
    };
  });
}

export interface Filters {
  category?: string; q?: string; minPaise?: number; maxPaise?: number; inStock?: boolean; madeToOrder?: boolean;
  sort?: 'new' | 'price-asc' | 'price-desc'; includeArchived?: boolean; featured?: boolean; limit?: number; ids?: number[];
}
export async function listProducts(f: Filters = {}): Promise<Product[]> {
  await ensureDemoCatalogue();
  const where: string[] = []; const args: unknown[] = [];
  if (!f.includeArchived) where.push("p.status='active'");
  if (f.category) { where.push('EXISTS (SELECT 1 FROM product_categories pc JOIN categories c ON c.id=pc.category_id WHERE pc.product_id=p.id AND c.slug=?)'); args.push(f.category); }
  if (f.q) { where.push('(p.name ILIKE ? OR p.description ILIKE ?)'); args.push(`%${f.q}%`, `%${f.q}%`); }
  if (f.minPaise !== undefined) { where.push('p.price_paise >= ?'); args.push(f.minPaise); }
  if (f.maxPaise !== undefined) { where.push('p.price_paise <= ?'); args.push(f.maxPaise); }
  if (f.featured) where.push('p.featured=1');
  if (f.madeToOrder) where.push('p.lead_time_days IS NOT NULL');
  if (f.inStock) where.push('(p.lead_time_days IS NOT NULL OR EXISTS (SELECT 1 FROM variants v WHERE v.product_id=p.id AND v.stock>0))');
  if (f.ids) { if (!f.ids.length) return []; where.push(`p.id IN (${f.ids.map(() => '?').join(',')})`); args.push(...f.ids); }
  const order = f.sort === 'price-asc' ? 'p.price_paise ASC' : f.sort === 'price-desc' ? 'p.price_paise DESC' : 'p.id DESC';
  const sql = `SELECT p.* FROM products p ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order} LIMIT ?`;
  return hydrate(await (await getDb()).all(sql, ...args, f.limit ?? 200));
}
export const getProductBySlug = async (slug: string, includeArchived = false) =>
  (await hydrate(await (await getDb()).all(`SELECT * FROM products WHERE slug=? ${includeArchived ? '' : "AND status='active'"}`, slug)))[0] ?? null;
export const getProductById = async (id: number) => (await hydrate(await (await getDb()).all('SELECT * FROM products WHERE id=?', id)))[0] ?? null;
export const listCategories = async () => (await getDb()).all<{ slug: string; name: string; blurb: string }>('SELECT slug, name, blurb FROM categories ORDER BY sort');

export const productInput = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  description: z.string().trim().max(5000).default(''),
  priceInr: z.coerce.number().min(0).max(1_000_000),
  categories: z.array(z.string()).min(1, 'Pick at least one category'),
  gstRate: z.coerce.number().min(0).max(40).nullable().optional(),
  hsn: z.string().trim().max(10).default(''),
  leadTimeDays: z.coerce.number().int().min(0).max(120).nullable().optional(),
  featured: z.boolean().default(false),
  engraving: z.object({ enabled: z.boolean(), max: z.coerce.number().int().min(1).max(60).default(20), feeInr: z.coerce.number().min(0).max(10000).default(0) }).default({ enabled: false, max: 20, feeInr: 0 }),
  variants: z.array(z.object({
    id: z.number().int().optional(), label: z.string().trim().min(1, 'Variant label required').max(60),
    sku: z.string().trim().max(40).default(''), priceInr: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
    stock: z.coerce.number().int().min(0).max(100000),
  })).min(1, 'Add at least one variant (use "Standard" for a single option)').max(30),
  images: z.array(z.object({ url: z.string().min(1).max(300).regex(/^(\/api\/media\/[\w.-]+|\/products\/[\w.-]+|https:\/\/[^\s]+)$/, 'Invalid image URL'), alt: z.string().max(200).default('') })).max(10).default([]),
  addonIds: z.array(z.number().int()).max(6).default([]),
});
export type ProductInput = z.infer<typeof productInput>;

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'item'; }

export async function saveProduct(input: ProductInput, id?: number): Promise<number> {
  const db = await getDb();
  const cats = await db.all<{ id: number; slug: string }>('SELECT id, slug FROM categories');
  const catIds = input.categories.map((s) => { const c = cats.find((x) => x.slug === s); if (!c) throw new Error('Unknown category: ' + s); return c.id; });
  return db.tx(async (q) => {
    let pid = id;
    const lead = input.leadTimeDays ?? null;
    const vals = [input.name, input.description, toPaise(input.priceInr), input.gstRate ?? null, input.hsn, lead, input.featured ? 1 : 0,
      input.engraving.enabled ? 1 : 0, input.engraving.max, toPaise(input.engraving.feeInr)];
    if (pid) {
      await q.run(`UPDATE products SET name=?, description=?, price_paise=?, gst_rate=?, hsn=?, lead_time_days=?, featured=?, engraving_enabled=?, engraving_max=?, engraving_fee_paise=?, updated_at=${NOW_SQL} WHERE id=?`, ...vals, pid);
    } else {
      let slug = slugify(input.name); let n = 1;
      while (await q.get('SELECT 1 AS x FROM products WHERE slug=?', slug)) slug = `${slugify(input.name)}-${++n}`;
      pid = await q.insert(`INSERT INTO products (name, description, price_paise, gst_rate, hsn, lead_time_days, featured, engraving_enabled, engraving_max, engraving_fee_paise, slug) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, ...vals, slug);
    }
    await q.run('DELETE FROM product_categories WHERE product_id=?', pid);
    for (const c of catIds) await q.run('INSERT INTO product_categories (product_id, category_id) VALUES (?,?)', pid, c);
    // Variants: update by id, insert new, remove those no longer listed (only if never ordered; else keep with stock 0).
    const existing = await q.all<{ id: number }>('SELECT id FROM variants WHERE product_id=?', pid);
    const keep = new Set<number>();
    for (const [i, v] of input.variants.entries()) {
      const price = v.priceInr == null ? null : toPaise(v.priceInr);
      if (v.id && existing.some((e) => e.id === v.id)) {
        await q.run('UPDATE variants SET label=?, sku=?, price_paise=?, stock=?, sort=? WHERE id=?', v.label, v.sku, price, v.stock, i, v.id); keep.add(v.id);
      } else keep.add(await q.insert('INSERT INTO variants (product_id,label,sku,price_paise,stock,sort) VALUES (?,?,?,?,?,?)', pid, v.label, v.sku, price, v.stock, i));
    }
    for (const e of existing) if (!keep.has(e.id)) {
      const used = await q.get('SELECT 1 AS x FROM order_items WHERE variant_id=?', e.id);
      if (used) await q.run('UPDATE variants SET stock=0 WHERE id=?', e.id); else await q.run('DELETE FROM variants WHERE id=?', e.id);
    }
    await q.run('DELETE FROM product_images WHERE product_id=?', pid);
    for (const [i, im] of input.images.entries()) await q.run('INSERT INTO product_images (product_id,url,alt,sort) VALUES (?,?,?,?)', pid, im.url, im.alt, i);
    await q.run('DELETE FROM product_addons WHERE product_id=?', pid);
    for (const a of input.addonIds.filter((a) => a !== pid)) await q.run('INSERT INTO product_addons (product_id, addon_product_id) VALUES (?,?) ON CONFLICT DO NOTHING', pid, a);
    return pid!;
  });
}
export const setArchived = async (id: number, archived: boolean) =>
  (await (await getDb()).run(`UPDATE products SET status=?, updated_at=${NOW_SQL} WHERE id=?`, archived ? 'archived' : 'active', id)) > 0;
export const deleteProduct = async (id: number) => (await (await getDb()).run('DELETE FROM products WHERE id=?', id)) > 0;
