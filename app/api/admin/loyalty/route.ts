import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

const body = z.object({ email: z.string().trim().toLowerCase().email(), delta: z.coerce.number().int().min(-100000).max(100000).refine((n) => n !== 0, 'Enter a number of points'), reason: z.string().trim().min(3, 'Give a short reason').max(120) });
export const POST = handle(async (req) => {
  await requireAdmin(req);
  const b = body.parse(await req.json()); const db = await getDb();
  await db.tx(async (q) => {
    const m = await q.get<{ points: number }>('SELECT points FROM loyalty_members WHERE email=? FOR UPDATE', b.email);
    if (!m) throw new HttpError(404, 'That customer is not in the rewards programme.');
    if (m.points + b.delta < 0) throw new HttpError(422, 'That would take the balance below zero.');
    await q.run('UPDATE loyalty_members SET points = points + ? WHERE email=?', b.delta, b.email);
    await q.run('INSERT INTO loyalty_ledger (email, order_id, delta, reason) VALUES (?,?,?,?)', b.email, null, b.delta, 'Adjusted by owner: ' + b.reason);
  });
  return json({ ok: true });
});
