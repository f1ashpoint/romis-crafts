import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { requireCustomer, changePassword, deleteAccount, customerCookie } from '@/lib/customer';
import { getDb } from '@/lib/db';
export const PATCH = handle(async (req) => {
  const c = await requireCustomer(req);
  const b = z.object({ name: z.string().trim().min(2).max(80).optional(), phone: z.string().trim().regex(/^\+?[0-9 ]{10,14}$/, 'Enter a valid mobile number.').or(z.literal('')).optional(), currentPassword: z.string().optional(), newPassword: z.string().optional() }).parse(await req.json());
  const db = await getDb();
  if (b.name !== undefined) await db.run('UPDATE users SET name=? WHERE id=?', b.name, c.id);
  if (b.phone !== undefined) await db.run('UPDATE users SET phone=? WHERE id=?', b.phone, c.id);
  if (b.newPassword) { if (!b.currentPassword) throw new HttpError(400, 'Enter your current password.'); await changePassword(c.id, b.currentPassword, b.newPassword); }
  return json({ ok: true });
});
export const DELETE = handle(async (req) => { const c = await requireCustomer(req); await deleteAccount(c.id); return json({ ok: true }, 200, { 'Set-Cookie': customerCookie('', true) }); });
