import { handle, json } from '@/lib/http';
import { customerCookie } from '@/lib/customer';
export const POST = handle(async () => json({ ok: true }, 200, { 'Set-Cookie': customerCookie('', true) }));
