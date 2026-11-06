import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

const body = z.object({ status: z.enum(['paid', 'shipped', 'delivered', 'cancelled']).optional(), awb: z.string().trim().max(60).optional(), trackingUrl: z.string().trim().url().max(300).or(z.literal('')).optional() });
export const PATCH = handle(async (req, c) => {
  await requireAdmin(req);
  const id = Number((await c?.params)?.id); const b = body.parse(await req.json());
  const db = await getDb();
  const o = await db.get<{ status: string }>('SELECT status FROM orders WHERE id=?', id);
  if (!o) throw new HttpError(404, 'Order not found.');
  if (b.status && ['pending_payment', 'expired', 'payment_failed'].includes(o.status)) throw new HttpError(409, 'This order has not been paid, so its status cannot be changed.');
  await db.run('UPDATE orders SET status=COALESCE(?::text,status), awb=COALESCE(?::text,awb), tracking_url=COALESCE(?::text,tracking_url) WHERE id=?', b.status ?? null, b.awb ?? null, b.trackingUrl ?? null, id);
  return json({ ok: true });
});
