import { handle, json, readCookie } from '@/lib/http';
import { createOrder } from '@/lib/orders';
import { VISITOR_COOKIE, NOPERS_COOKIE } from '@/lib/behavior';

export const POST = handle(async (req) => {
  const raw = await req.json();
  const vid = readCookie(req, NOPERS_COOKIE) ? undefined : readCookie(req, VISITOR_COOKIE);
  const o = await createOrder(raw, vid);
  return json({ orderNumber: o.number, redirect: o.payment.action.url });
});
