import { describe, it, expect, beforeEach, vi } from 'vitest';
import { freshDb, addProduct, addAdmin, variantOf, address, dbGet, dbRun } from './helpers';
import { registerCustomer, loginCustomer, signCustomer, verifyCustomer, toggleWishlist, wishlistIds, customerOrders, deleteAccount, saveAddressFor, listAddresses } from '@/lib/customer';
import { signSession, login, resetLoginAttempts } from '@/lib/auth';
import { createOrder, markPaid } from '@/lib/orders';
import { upiLink, UTR } from '@/lib/upi';

beforeEach(async () => { process.env.SESSION_SECRET = 'x'.repeat(40); resetLoginAttempts(); await freshDb(); });

describe('customer accounts', () => {
  it('registers, signs in, and rejects bad passwords and duplicates', async () => {
    const id = await registerCustomer({ name: 'Asha Rao', email: 'Asha@Example.com', password: 'longenough1' }, 'ip1');
    expect(await loginCustomer('asha@example.com', 'longenough1', 'ip2')).toBe(id);
    expect(await loginCustomer('asha@example.com', 'wrongwrong', 'ip3')).toBeNull();
    await expect(registerCustomer({ name: 'Asha', email: 'asha@example.com', password: 'longenough1' }, 'ip4')).rejects.toThrow(/already exists/);
  });
  it('customer tokens are not admin tokens and vice versa', async () => {
    const id = await registerCustomer({ name: 'Asha Rao', email: 'a@example.com', password: 'longenough1' }, 'ip');
    expect((await verifyCustomer(signCustomer(id)))?.id).toBe(id);
    expect(await verifyCustomer(signSession(id))).toBeNull();
    expect(await verifyCustomer(signCustomer(id, Date.now() - 40 * 86400_000))).toBeNull();
  });
  it('wishlist, addresses, and order history only for orders placed while signed in', async () => {
    const uid = await registerCustomer({ name: 'Asha Rao', email: 'a@example.com', password: 'longenough1' }, 'ip');
    const p = await addProduct(); await toggleWishlist(uid, p, true); await toggleWishlist(uid, p, true);
    expect(await wishlistIds(uid)).toEqual([p]); await toggleWishlist(uid, p, false); expect(await wishlistIds(uid)).toEqual([]);
    const v = await variantOf(p);
    await createOrder({ ...address, items: [{ variantId: v, qty: 1 }], saveAddress: true }, undefined, uid);
    await createOrder({ ...address, items: [{ variantId: v, qty: 1 }] });
    const orders = await customerOrders(uid); expect(orders).toHaveLength(1); expect(orders[0].reorder[0].variantId).toBe(v);
    expect(await listAddresses(uid)).toHaveLength(1);
    await deleteAccount(uid); expect(await dbGet('SELECT 1 FROM users WHERE id=?', uid)).toBeUndefined();
    expect(await dbGet('SELECT COUNT(*)::int n FROM orders WHERE user_id IS NOT NULL')).toMatchObject({ n: 0 });
  });
});

describe('admin env reset', () => {
  it('applies once per distinct value and lets a later change stick', async () => {
    await addAdmin('owner@example.com', 'old password here');
    process.env.ADMIN_EMAIL = 'owner@example.com'; process.env.ADMIN_RESET_PASSWORD = 'brand-new-temp-pass';
    expect(await login('owner@example.com', 'brand-new-temp-pass')).toBeTypeOf('number');
    expect(await login('owner@example.com', 'old password here')).toBeNull();
    const { hashPassword } = await import('@/lib/auth');
    await dbRun('UPDATE admins SET password_hash=? WHERE email=?', hashPassword('chosen by owner 1'), 'owner@example.com');
    expect(await login('owner@example.com', 'chosen by owner 1')).toBeTypeOf('number');
    delete process.env.ADMIN_RESET_PASSWORD;
  });
});

describe('UPI', () => {
  it('builds a standard link and validates UTRs', () => {
    const l = upiLink({ vpa: 'jannegarder13-2@okicici', payee: 'Simply Romi', amountPaise: 89900, orderNumber: 'SR-1001' });
    expect(l).toContain('upi://pay?pa=jannegarder13-2%40okicici'); expect(l).toContain('am=899.00'); expect(l).toContain('cu=INR');
    expect(UTR.test('412345678901')).toBe(true); expect(UTR.test('41234')).toBe(false);
  });
  it('UTR submission moves an order to review, rejects duplicates, and confirm marks it paid', async () => {
    process.env.PAYMENT_PROVIDER = 'upi';
    const p = await addProduct(); const v = await variantOf(p);
    const a = await createOrder({ ...address, items: [{ variantId: v, qty: 1 }] }); const b = await createOrder({ ...address, items: [{ variantId: v, qty: 1 }] });
    const { POST } = await import('@/app/api/pay/upi/route');
    const post = (token: string, utr: string) => POST(new Request('http://x/api/pay/upi', { method: 'POST', body: JSON.stringify({ token, utr }) }));
    expect((await post(a.token, '123')).status).toBe(400);
    expect((await post(a.token, '412345678901')).status).toBe(200);
    expect((await dbGet('SELECT status FROM orders WHERE token=?', a.token))).toMatchObject({ status: 'payment_review' });
    expect((await post(b.token, '412345678901')).status).toBe(409);
    expect(await markPaid(a.token, 'UPI 412345678901')).toBeTruthy();
    expect((await dbGet('SELECT status FROM orders WHERE token=?', a.token))).toMatchObject({ status: 'paid' });
    delete process.env.PAYMENT_PROVIDER;
  });
});

describe('seed v3 upgrade', () => {
  it('adds only the new products when v2 already ran, keeping deleted v2 products deleted', async () => {
    process.env.SEED_DEMO = '1';
    try {
      const { getDb } = await import('@/lib/db'); const { listProducts } = await import('@/lib/catalog'); const db = await getDb();
      await db.run("INSERT INTO settings (key,value) VALUES ('demo_catalogue_v2','\"1\"')");
      vi.resetModules(); const { ensureDemoCatalogue } = await import('@/lib/seed'); await ensureDemoCatalogue();
      const ps = await listProducts({ includeArchived: true }); expect(ps.length).toBe(12);
      expect(ps.some((p) => p.name === 'Chenille Sunflower Bouquet')).toBe(false);
    } finally { delete process.env.SEED_DEMO; }
  });
});
