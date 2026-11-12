import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { markPaid, markFailed } from '@/lib/orders';

/** Owner decision on a UPI payment: confirm the money arrived (issues the invoice, awards points) or reject it (releases the stock). */
export const POST = handle(async (req, c) => {
  await requireAdmin(req);
  const id = Number((await c?.params)?.id); const b = z.object({ action: z.enum(['confirm', 'reject']) }).parse(await req.json());
  const o = await (await getDb()).get<{ token: string; status: string; payment_ref: string }>('SELECT token, status, payment_ref FROM orders WHERE id=?', id);
  if (!o) throw new HttpError(404, 'Order not found.');
  if (o.status !== 'payment_review') throw new HttpError(409, 'This order is not waiting for payment verification.');
  if (b.action === 'confirm') return json({ ok: true, status: await markPaid(o.token, o.payment_ref) });
  await markFailed(o.token);
  return json({ ok: true, status: 'payment_failed' });
});
