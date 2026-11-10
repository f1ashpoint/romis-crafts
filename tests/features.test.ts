import { describe, it, expect, beforeEach } from 'vitest';
import { dbGet, dbRun, freshDb, addAdmin, addProduct } from './helpers';
import { getDb } from '@/lib/db';
import { signSession, ADMIN_COOKIE, verifyPassword } from '@/lib/auth';
import { createEnquiry, enquiryRateLimit } from '@/lib/enquiries';
import { POST as postEnquiry } from '@/app/api/enquiries/route';
import { GET as listCats, POST as addCat } from '@/app/api/admin/categories/route';
import { DELETE as delCat } from '@/app/api/admin/categories/[id]/route';
import { PUT as putStore, GET as getStoreApi } from '@/app/api/admin/store/route';
import { POST as changePw, PUT as addAdminApi } from '@/app/api/admin/account/route';
import { GET as exportCsv } from '@/app/api/admin/orders/export/route';
import { getStore } from '@/lib/config';
import { ensureDemoCatalogue } from '@/lib/seed';
import { listProducts, listCategories } from '@/lib/catalog';

let cookie = '';
const call = (method: string, data?: unknown) => new Request('http://localhost/api/admin/x', { method, headers: { 'Content-Type': 'application/json', host: 'localhost', cookie: `${ADMIN_COOKIE}=${cookie}` }, body: data ? JSON.stringify(data) : undefined });
beforeEach(async () => { await freshDb(); cookie = signSession(await addAdmin()); });

describe('custom enquiries', () => {
  it('saves a valid enquiry and rejects incomplete ones', async () => {
    await createEnquiry({ name: 'Asha', phone: '98765 43210', message: 'A sunflower bouquet in yellow and white please' });
    expect((await dbGet('SELECT phone, status FROM enquiries')) as any).toEqual({ phone: '9876543210', status: 'new' });
    await expect(createEnquiry({ name: 'A', message: 'short' })).rejects.toThrow();
    await expect(createEnquiry({ name: 'Asha', message: 'A sunflower bouquet in yellow please' })).rejects.toThrow(/email or a phone/);
  });
  it('quietly drops bot submissions and rate limits floods', async () => {
    await createEnquiry({ name: 'Bot', email: 'b@x.co', message: 'Buy cheap watches online now', website: 'http://spam' });
    expect(((await dbGet('SELECT COUNT(*)::int n FROM enquiries')) as any).n).toBe(0);
    for (let i = 0; i < 5; i++) enquiryRateLimit('9.9.9.9'); expect(() => enquiryRateLimit('9.9.9.9')).toThrow(/few requests/);
    const r = await postEnquiry(new Request('http://localhost/api/enquiries', { method: 'POST', headers: { 'x-forwarded-for': '5.5.5.5' }, body: JSON.stringify({ name: 'Asha', email: 'a@b.co', message: 'Ten return gifts for a housewarming' }) }));
    expect(r.status).toBe(201);
  });
});

describe('admin categories', () => {
  it('adds a category with a unique slug and refuses to delete one that has products', async () => {
    expect((await (await listCats(call('GET'))).json()).length).toBe(4);
    const a = await (await addCat(call('POST', { name: 'Gift Hampers', blurb: 'Boxes' }))).json(); expect(a.slug).toBe('gift-hampers');
    expect((await (await addCat(call('POST', { name: 'Gift Hampers' }))).json()).slug).toBe('gift-hampers-2');
    await addProduct({ name: 'In hamper', categories: ['gift-hampers'] });
    const r = await delCat(call('DELETE'), { params: Promise.resolve({ id: String(a.id) }) }); expect(r.status).toBe(409);
    await dbRun('DELETE FROM products'); expect((await delCat(call('DELETE'), { params: Promise.resolve({ id: String(a.id) }) })).status).toBe(200);
  });
  it('requires sign-in', async () => { expect((await listCats(new Request('http://localhost/api/admin/categories'))).status).toBe(401); });
});

describe('store details and account', () => {
  it('saved details override the environment defaults and are validated', async () => {
    expect((await getStore()).name).toBe('Simply Romi');
    expect((await putStore(call('PUT', { name: 'Simply Romi Studio', gstin: 'bad' }))).status).toBe(400);
    expect((await putStore(call('PUT', { name: 'Simply Romi Studio', email: 'hello@simplyromi.in', phone: '9876543210' }))).status).toBe(200);
    const s = await getStore(); expect(s.name).toBe('Simply Romi Studio'); expect(s.email).toBe('hello@simplyromi.in');
    expect((await (await getStoreApi(call('GET'))).json()).name).toBe('Simply Romi Studio');
  });
  it('changes a password only with the right current one, and adds another admin', async () => {
    expect((await changePw(call('POST', { current: 'wrong password', next: 'a brand new password' }))).status).toBe(403);
    expect((await changePw(call('POST', { current: 'correct horse battery', next: 'a brand new password' }))).status).toBe(200);
    const row = (await dbGet('SELECT password_hash FROM admins')) as any; expect(verifyPassword('a brand new password', row.password_hash)).toBe(true);
    expect((await addAdminApi(call('PUT', { email: 'helper@example.com', password: 'another long password' }))).status).toBe(201);
    expect((await addAdminApi(call('PUT', { email: 'helper@example.com', password: 'another long password' }))).status).toBe(409);
  });
  it('exports orders as CSV for admins only', async () => {
    const r = await exportCsv(call('GET')); expect(r.headers.get('content-type')).toContain('text/csv'); expect((await r.text()).split('\n')[0]).toContain('Order,Date');
    expect((await exportCsv(new Request('http://localhost/api/admin/orders/export'))).status).toBe(401);
  });
});

describe('catalogue migration and sample products', () => {
  it('seeds the sample catalogue once, with images, and never re-adds deleted products', async () => {
    process.env.SEED_DEMO = '1';
    try {
      await ensureDemoCatalogue();
      const ps = await listProducts({ includeArchived: true }); expect(ps.length).toBe(12);
      expect(ps.every((p) => p.images.length >= 1 && p.images.every((i) => i.url.startsWith('/products/')))).toBe(true);
      expect(ps.every((p) => p.categories.every((c) => ['fiber-textile', 'home-decor', 'accessories', 'wedding-events'].includes(c.slug)))).toBe(true);
    } finally { delete process.env.SEED_DEMO; }
  });
  it('only offers the four current categories', async () => { expect((await listCategories()).map((c) => c.slug)).toEqual(['fiber-textile', 'home-decor', 'accessories', 'wedding-events']); });
  it('one-time migration removes clay and ceramics and archives products that only belonged to them', async () => {
    const db = await getDb();
    await db.run("INSERT INTO categories (slug,name,sort) VALUES ('clay','Clay',90),('ceramics','Ceramics',91)");
    const only = await addProduct({ name: 'Old Mug', categories: ['accessories'] }); const both = await addProduct({ name: 'Old Charm', categories: ['accessories'] });
    await db.run("INSERT INTO product_categories (product_id, category_id) SELECT ?, id FROM categories WHERE slug='ceramics'", only); await db.run("DELETE FROM product_categories WHERE product_id=? AND category_id=(SELECT id FROM categories WHERE slug='accessories')", only);
    await db.run("INSERT INTO product_categories (product_id, category_id) SELECT ?, id FROM categories WHERE slug='clay'", both);
    const { RETIRED_CATEGORIES } = await import('@/lib/schema'); const ph = RETIRED_CATEGORIES.map(() => '?').join(',');
    await db.run(`UPDATE products SET status='archived' WHERE id IN (SELECT pc.product_id FROM product_categories pc JOIN categories c ON c.id=pc.category_id GROUP BY pc.product_id HAVING bool_and(c.slug IN (${ph})))`, ...RETIRED_CATEGORIES);
    await db.run(`DELETE FROM categories WHERE slug IN (${ph})`, ...RETIRED_CATEGORIES);
    expect(((await dbGet('SELECT status FROM products WHERE id=?', only)) as any).status).toBe('archived');
    expect(((await dbGet('SELECT status FROM products WHERE id=?', both)) as any).status).toBe('active');
    expect(await dbGet("SELECT 1 FROM categories WHERE slug IN ('clay','ceramics')")).toBeUndefined();
  });
});
