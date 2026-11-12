import crypto from 'crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getDb } from './db';
import { hashPassword, verifyPassword, loginRateLimit } from './auth';
import { HttpError, readCookie } from './http';

export const CUSTOMER_COOKIE = 'csc_user';
const DAYS = 30;
/** Separate derived key so a customer token can never be accepted as an admin session. */
function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set to at least 32 characters.');
  return crypto.createHmac('sha256', s).update('customer-session-v1').digest();
}
export function signCustomer(id: number, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ u: id, exp: now + DAYS * 86400_000 })).toString('base64url');
  return `${body}.${crypto.createHmac('sha256', key()).update(body).digest('base64url')}`;
}
export interface Customer { id: number; email: string; name: string; phone: string }
export async function verifyCustomer(token: string | undefined, now = Date.now()): Promise<Customer | null> {
  if (!token) return null; const [body, sig] = token.split('.'); if (!body || !sig) return null;
  const exp = crypto.createHmac('sha256', key()).update(body).digest('base64url'); const a = Buffer.from(sig), b = Buffer.from(exp);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); if (typeof p.u !== 'number' || p.exp < now) return null;
    return (await (await getDb()).get<Customer>('SELECT id, email, name, phone FROM users WHERE id=?', p.u)) ?? null; } catch { return null; }
}
export const customerCookie = (token: string, clear = false) => `${CUSTOMER_COOKIE}=${clear ? '' : token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : DAYS * 86400}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
/** For API routes. */
export const customerFromReq = (req: Request) => verifyCustomer(readCookie(req, CUSTOMER_COOKIE));
export async function requireCustomer(req: Request): Promise<Customer> {
  const c = await customerFromReq(req); if (!c) throw new HttpError(401, 'Please sign in to continue.');
  if (!['GET', 'HEAD'].includes(req.method)) { const o = req.headers.get('origin'), h = req.headers.get('host'); if (o && h && new URL(o).host !== h) throw new HttpError(403, 'Cross-origin request blocked.'); }
  return c;
}
/** For server components. */
export async function getCustomer(): Promise<Customer | null> { return verifyCustomer((await cookies()).get(CUSTOMER_COOKIE)?.value); }

export const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email().max(120), phone: z.string().trim().regex(/^\+?[0-9 ]{10,14}$/, 'Enter a valid mobile number.').or(z.literal('')).default(''), password: z.string().min(8, 'Use at least 8 characters.').max(200) });
export async function registerCustomer(raw: unknown, ip: string) {
  loginRateLimit('reg:' + ip); const b = registerSchema.parse(raw); const db = await getDb();
  if (await db.get('SELECT 1 FROM users WHERE email=?', b.email)) throw new HttpError(409, 'An account with this email already exists. Please sign in.', { email: 'Already registered' });
  return db.insert('INSERT INTO users (email, name, phone, password_hash) VALUES (?,?,?,?)', b.email, b.name, b.phone, hashPassword(b.password));
}
export async function loginCustomer(email: string, password: string, ip: string): Promise<number | null> {
  loginRateLimit('cust:' + ip);
  const row = await (await getDb()).get<{ id: number; password_hash: string }>('SELECT id, password_hash FROM users WHERE email=?', email.trim().toLowerCase());
  const ok = verifyPassword(password, row?.password_hash ?? 'scrypt$00$00'); return row && ok ? row.id : null;
}
export const ipOf = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

export const addressSchema = z.object({ label: z.string().trim().max(30).default('Home'), name: z.string().trim().min(2).max(80), phone: z.string().trim().regex(/^\+?[0-9 ]{10,14}$/, 'Enter a valid mobile number.'), line1: z.string().trim().min(3).max(160), line2: z.string().trim().max(160).default(''), city: z.string().trim().min(2).max(80), state: z.string().trim().min(2).max(60), pincode: z.string().trim().regex(/^[0-9]{6}$/, 'PIN code is 6 digits.'), isDefault: z.boolean().default(false) });
export const listAddresses = (uid: number) => getDb().then((d) => d.all('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, id DESC', uid));
export async function saveAddressFor(uid: number, raw: unknown) {
  const a = addressSchema.parse(raw); const db = await getDb();
  await db.tx(async (q) => { if (a.isDefault) await q.run('UPDATE addresses SET is_default=0 WHERE user_id=?', uid);
    await q.insert('INSERT INTO addresses (user_id,label,name,phone,line1,line2,city,state,pincode,is_default) VALUES (?,?,?,?,?,?,?,?,?,?)', uid, a.label, a.name, a.phone, a.line1, a.line2, a.city, a.state, a.pincode, a.isDefault ? 1 : 0); });
}
export const deleteAddress = async (uid: number, id: number) => { await (await getDb()).run('DELETE FROM addresses WHERE id=? AND user_id=?', id, uid); };

export async function wishlistIds(uid: number) { return (await (await getDb()).all<{ product_id: number }>('SELECT product_id FROM wishlist WHERE user_id=?', uid)).map((r) => r.product_id); }
export async function toggleWishlist(uid: number, productId: number, on: boolean) {
  const db = await getDb();
  if (on) { if (!(await db.get("SELECT 1 FROM products WHERE id=? AND status='active'", productId))) throw new HttpError(404, 'Product not found.'); await db.run('INSERT INTO wishlist (user_id, product_id) VALUES (?,?) ON CONFLICT DO NOTHING', uid, productId); }
  else await db.run('DELETE FROM wishlist WHERE user_id=? AND product_id=?', uid, productId);
}
export async function customerOrders(uid: number) {
  const db = await getDb();
  const rows = await db.all<any>(`SELECT o.id, o.token, o.number, o.status, o.total_paise, o.created_at, o.awb, (SELECT string_agg(name || ' × ' || qty, ', ') FROM order_items WHERE order_id=o.id) items FROM orders o WHERE o.user_id=? ORDER BY o.id DESC LIMIT 100`, uid);
  const its = rows.length ? await db.all<any>(`SELECT order_id, variant_id, qty, engraving FROM order_items WHERE order_id = ANY(?) AND variant_id IS NOT NULL`, rows.map((r: any) => r.id)) : [];
  return rows.map((r: any) => ({ ...r, reorder: its.filter((i: any) => i.order_id === r.id).map((i: any) => ({ variantId: Number(i.variant_id), qty: Number(i.qty), engraving: i.engraving || '' })) }));
}
export async function deleteAccount(uid: number) { const db = await getDb(); await db.tx(async (q) => { await q.run('UPDATE orders SET user_id=NULL WHERE user_id=?', uid); await q.run('DELETE FROM wishlist WHERE user_id=?', uid); await q.run('DELETE FROM addresses WHERE user_id=?', uid); await q.run('DELETE FROM users WHERE id=?', uid); }); }
export async function changePassword(uid: number, current: string, next: string) {
  if (next.length < 8) throw new HttpError(400, 'Use at least 8 characters.'); const db = await getDb();
  const r = await db.get<{ password_hash: string }>('SELECT password_hash FROM users WHERE id=?', uid);
  if (!r || !verifyPassword(current, r.password_hash)) throw new HttpError(403, 'Your current password is not correct.');
  await db.run('UPDATE users SET password_hash=? WHERE id=?', hashPassword(next), uid);
}
