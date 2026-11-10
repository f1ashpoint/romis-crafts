import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { requireAdmin, verifyPassword, hashPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';

const pw = z.string().min(10, 'Use at least 10 characters').max(200);
/** Change your own password. */
export const POST = handle(async (req) => {
  const me = await requireAdmin(req);
  const b = z.object({ current: z.string().min(1), next: pw }).parse(await req.json()); const db = await getDb();
  const row = await db.get<{ password_hash: string }>('SELECT password_hash FROM admins WHERE id=?', me.id);
  if (!row || !verifyPassword(b.current, row.password_hash)) throw new HttpError(403, 'Your current password is not correct.', { current: 'Not correct' });
  await db.run('UPDATE admins SET password_hash=? WHERE id=?', hashPassword(b.next), me.id);
  return json({ ok: true });
});
/** Add another admin (for example a family member or helper). */
export const PUT = handle(async (req) => {
  await requireAdmin(req);
  const b = z.object({ email: z.string().trim().toLowerCase().email(), password: pw }).parse(await req.json()); const db = await getDb();
  if (await db.get('SELECT 1 FROM admins WHERE email=?', b.email)) throw new HttpError(409, 'An admin with that email already exists.');
  await db.run('INSERT INTO admins (email, password_hash) VALUES (?,?)', b.email, hashPassword(b.password));
  return json({ ok: true }, 201);
});
