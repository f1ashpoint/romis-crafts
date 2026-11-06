import crypto from 'crypto';
import { z } from 'zod';
import { handle, json, readCookie } from '@/lib/http';
import { recordEvent, VISITOR_COOKIE, NOPERS_COOKIE } from '@/lib/behavior';

const body = z.object({ productId: z.number().int().positive(), type: z.enum(['view', 'cart']) });
export const POST = handle(async (req) => {
  if (readCookie(req, NOPERS_COOKIE)) return json({ ok: true, tracking: false });
  const b = body.parse(await req.json());
  let vid = readCookie(req, VISITOR_COOKIE); const headers: Record<string, string> = {};
  if (!vid || !/^[a-f0-9]{32}$/.test(vid)) {
    vid = crypto.randomBytes(16).toString('hex');
    headers['Set-Cookie'] = `${VISITOR_COOKIE}=${vid}; Path=/; Max-Age=${60 * 60 * 24 * 90}; SameSite=Lax; HttpOnly`;
  }
  await recordEvent(vid, b.productId, b.type);
  return json({ ok: true, tracking: true }, 200, headers);
});
