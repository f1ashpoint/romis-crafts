import { z } from 'zod';
import { handle, json } from '@/lib/http';
import { requireCustomer, saveAddressFor, deleteAddress } from '@/lib/customer';
export const POST = handle(async (req) => { const c = await requireCustomer(req); await saveAddressFor(c.id, await req.json()); return json({ ok: true }); });
export const DELETE = handle(async (req) => { const c = await requireCustomer(req); const b = z.object({ id: z.number().int() }).parse(await req.json()); await deleteAddress(c.id, b.id); return json({ ok: true }); });
