import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { loginCustomer, signCustomer, customerCookie, ipOf } from '@/lib/customer';
export const POST = handle(async (req) => {
  const b = z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).parse(await req.json());
  const id = await loginCustomer(b.email, b.password, ipOf(req)); if (!id) throw new HttpError(401, 'Email or password is incorrect.');
  return json({ ok: true }, 200, { 'Set-Cookie': customerCookie(signCustomer(id)) });
});
