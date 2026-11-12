import { z } from 'zod';
import { handle, json } from '@/lib/http';
import { requireCustomer, toggleWishlist } from '@/lib/customer';
export const POST = handle(async (req) => { const c = await requireCustomer(req); const b = z.object({ productId: z.number().int().positive(), on: z.boolean() }).parse(await req.json()); await toggleWishlist(c.id, b.productId, b.on); return json({ ok: true }); });
