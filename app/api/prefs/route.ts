import { z } from 'zod';
import { handle, readCookie } from '@/lib/http';
import { eraseVisitor, VISITOR_COOKIE, NOPERS_COOKIE } from '@/lib/behavior';

export const POST = handle(async (req) => {
  const { personalization } = z.object({ personalization: z.boolean() }).parse(await req.json());
  const h = new Headers({ 'Content-Type': 'application/json' });
  if (!personalization) {
    const vid = readCookie(req, VISITOR_COOKIE); if (vid) await eraseVisitor(vid);
    h.append('Set-Cookie', `${NOPERS_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`);
    h.append('Set-Cookie', `${VISITOR_COOKIE}=; Path=/; Max-Age=0`);
  } else h.append('Set-Cookie', `${NOPERS_COOKIE}=; Path=/; Max-Age=0`);
  return new Response(JSON.stringify({ ok: true }), { headers: h });
});
