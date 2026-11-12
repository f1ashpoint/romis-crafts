import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { getDb } from '@/lib/db';
import { UTR } from '@/lib/upi';

const hits = new Map<string, { n: number; reset: number }>();
function limit(key: string) { const now = Date.now(), h = hits.get(key); if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + 600_000 }); return; } if (++h.n > 10) throw new HttpError(429, 'Too many attempts. Please wait a few minutes.'); }

/** The customer reports the UPI reference number (UTR) after paying. The order then waits for the owner to confirm the money arrived. */
export const POST = handle(async (req) => {
  limit(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local');
  const b = z.object({ token: z.string().min(10).max(80), utr: z.string().trim().regex(UTR, 'The UPI reference number is 12 digits. You can find it in your UPI app under the payment details.') }).parse(await req.json());
  const db = await getDb();
  await db.tx(async (q) => {
    const o = await q.get<{ id: number; status: string }>('SELECT id, status FROM orders WHERE token=? FOR UPDATE', b.token);
    if (!o) throw new HttpError(404, 'Order not found.');
    if (o.status === 'payment_review') throw new HttpError(409, 'We already have your payment details and are checking them.');
    if (!['pending_payment', 'expired'].includes(o.status)) throw new HttpError(409, 'This order does not need a payment.');
    if (await q.get('SELECT 1 FROM orders WHERE payment_ref=? AND id<>?', 'UPI ' + b.utr, o.id)) throw new HttpError(409, 'That reference number has already been used on another order. Please check it.', { utr: 'Already used' });
    await q.run("UPDATE orders SET status='payment_review', payment_provider='upi', payment_ref=?, notes=CASE WHEN notes='' THEN ? ELSE notes || ' | ' || ? END WHERE id=?", 'UPI ' + b.utr, o.status === 'expired' ? 'Payment details sent after the hold expired' : 'Payment details sent by customer', o.status === 'expired' ? 'Payment details sent after the hold expired' : 'Payment details sent by customer', o.id);
  });
  return json({ ok: true });
});
