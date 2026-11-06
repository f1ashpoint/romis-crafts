import { json } from '@/lib/http';
import { sessionCookie } from '@/lib/auth';
export async function POST() { return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', true) }); }
