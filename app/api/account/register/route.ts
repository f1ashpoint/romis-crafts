import { handle, json } from '@/lib/http';
import { registerCustomer, signCustomer, customerCookie, ipOf } from '@/lib/customer';
export const POST = handle(async (req) => { const id = await registerCustomer(await req.json(), ipOf(req)); return json({ ok: true }, 200, { 'Set-Cookie': customerCookie(signCustomer(id)) }); });
