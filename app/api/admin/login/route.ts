import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { login, signSession, sessionCookie, loginRateLimit } from '@/lib/auth';

export const POST = handle(async (req) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  loginRateLimit(ip);
  const b = z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).parse(await req.json());
  const id = await login(b.email, b.password);
  if (!id) throw new HttpError(401, 'Email or password is incorrect.');
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(signSession(id)) });
});
