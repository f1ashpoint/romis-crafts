import { describe, it, expect, beforeEach } from 'vitest';
import { dbGet, dbRun, freshDb, addProduct, variantOf, address } from './helpers';
import { getDb } from '@/lib/db';
import { quoteCart, createOrder, markPaid, markFailed, releaseExpiredOrders, getOrderByToken } from '@/lib/orders';
import { HttpError } from '@/lib/http';

const tokenOf = async (items: any[], over: any = {}) => { const o = await createOrder({ ...address, items, ...over }); return ((await dbGet('SELECT token FROM orders WHERE number=?', o.number)) as { token: string }).token; };
beforeEach(async () => { await freshDb(); });

describe('cart quote', () => {
  it('prices from the database, ignoring anything the client sends', async () => {
    const p = await addProduct({ priceInr: 500, categories: ['ceramics'] });
    const q = await quoteCart([{ variantId: await variantOf(p), qty: 2 }]);
    expect(q.price.itemsTotalPaise).toBe(100000); expect(q.price.shippingPaise).toBe(0);
  });
  it('adds engraving fee only when supported', async () => {
    const p = await addProduct({ priceInr: 500, engraving: { enabled: true, max: 10, feeInr: 100 } });
    const q = await quoteCart([{ variantId: await variantOf(p), qty: 1, engraving: 'Asha' }]);
    expect(q.lines[0].unitPaise).toBe(60000);
    const p2 = await addProduct({ name: 'Plain', priceInr: 500 });
    expect((await quoteCart([{ variantId: await variantOf(p2), qty: 1, engraving: 'x' }])).lines[0].unitPaise).toBe(50000);
  });
  it('flags quantity above stock and made-to-order dispatch date', async () => {
    const p = await addProduct({ variants: [{ label: 'S', stock: 2 }] });
    expect((await quoteCart([{ variantId: await variantOf(p), qty: 3 }])).issues[0]).toMatch(/Only 2 left/);
    const m = await addProduct({ name: 'MTO', leadTimeDays: 7, variants: [{ label: 'S', stock: 0 }] });
    const q = await quoteCart([{ variantId: await variantOf(m), qty: 5 }]);
    expect(q.issues).toHaveLength(0); expect(q.dispatchBy).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('checkout', () => {
  it('rejects addresses outside India and bad PIN or phone', async () => {
    const p = await addProduct(); const items = [{ variantId: await variantOf(p), qty: 1 }];
    await expect(createOrder({ ...address, items, country: 'United States' })).rejects.toBeInstanceOf(HttpError);
    await expect(createOrder({ ...address, items, state: 'California' })).rejects.toThrow();
    await expect(createOrder({ ...address, items, pincode: '012345' })).rejects.toThrow();
    await expect(createOrder({ ...address, items, phone: '12345' })).rejects.toThrow();
    expect((await dbGet('SELECT COUNT(*) c FROM orders'))).toEqual({ c: 0 });
  });
  it('splits GST as CGST/SGST in Tamil Nadu, IGST elsewhere, and totals match the quote', async () => {
    const p = await addProduct({ priceInr: 500, categories: ['ceramics'] });
    const items = [{ variantId: await variantOf(p), qty: 1 }];
    const tn = (await getOrderByToken(await tokenOf(items, { state: 'Tamil Nadu', pincode: '600001' })))!.order;
    expect(tn.igst_paise).toBe(0); expect(tn.cgst_paise).toBeGreaterThan(0);
    const ka = (await getOrderByToken(await tokenOf(items)))!.order;
    expect(ka.cgst_paise).toBe(0); expect(ka.igst_paise).toBeGreaterThan(0);
    const q = await quoteCart(items, { state: 'Karnataka' });
    expect(ka.total_paise).toBe(q.price.totalPaise); expect(ka.total_paise).toBe(50000 + 7900);
    expect(ka.taxable_paise + ka.igst_paise).toBe(ka.total_paise);
  });
  it('decrements stock on order, and returns it on failed payment or expiry', async () => {
    const p = await addProduct({ variants: [{ label: 'S', stock: 3 }] }); const v = await variantOf(p);
    const stock = async () => ((await dbGet('SELECT stock FROM variants WHERE id=?', v)) as any).stock;
    const t1 = await tokenOf([{ variantId: v, qty: 2 }]); expect(await stock()).toBe(1);
    await expect(createOrder({ ...address, items: [{ variantId: v, qty: 2 }] })).rejects.toThrow(/Only 1 left|not enough/);
    await markFailed(t1); expect(await stock()).toBe(3);
    await tokenOf([{ variantId: v, qty: 3 }]); expect(await stock()).toBe(0);
    await releaseExpiredOrders(new Date(Date.now() + 3600_000)); expect(await stock()).toBe(3);
  });
  it('does not decrement stock for made-to-order items', async () => {
    const p = await addProduct({ leadTimeDays: 5, variants: [{ label: 'S', stock: 0 }] });
    await tokenOf([{ variantId: await variantOf(p), qty: 4 }]);
    expect(((await dbGet('SELECT stock FROM variants WHERE product_id=?', p)) as any).stock).toBe(0);
    expect(((await dbGet('SELECT dispatch_by FROM orders')) as any).dispatch_by).toBeTruthy();
  });
  it('payment confirmation is idempotent and issues exactly one invoice', async () => {
    const p = await addProduct(); const t = await tokenOf([{ variantId: await variantOf(p), qty: 1 }]);
    expect(await markPaid(t)).toBe('paid'); expect(await markPaid(t)).toBe('paid');
    expect((await dbGet('SELECT COUNT(*) c FROM invoices'))).toEqual({ c: 1 });
  });
});

describe('loyalty is opt-in', () => {
  it('does not enrol or award points unless the box was ticked', async () => {
    const p = await addProduct({ priceInr: 1000 }); const items = [{ variantId: await variantOf(p), qty: 1 }];
    await markPaid(await tokenOf(items));
    expect((await dbGet('SELECT COUNT(*) c FROM loyalty_members'))).toEqual({ c: 0 });
    await markPaid(await tokenOf(items, { joinLoyalty: true }));
    expect(((await dbGet('SELECT points FROM loyalty_members')) as any).points).toBe(20);
  });
  it('redeems points as a discount and caps at the configured percentage', async () => {
    const p = await addProduct({ priceInr: 1000, variants: [{ label: 'S', stock: 20 }] }); const items = [{ variantId: await variantOf(p), qty: 1 }];
    await dbRun('INSERT INTO loyalty_members (email, name, points) VALUES (?,?,?)', address.email, 'Asha', 500);
    const q = await quoteCart(items, { redeemPoints: 500, email: address.email });
    expect(q.redeemedPoints).toBe(200); expect(q.price.discountPaise).toBe(20000);
  });
});
