import { z } from 'zod';
import { handle, json } from '@/lib/http';
import { quoteCart } from '@/lib/orders';
import { cartSchema } from '@/lib/validation';
import { INDIAN_STATES } from '@/lib/config';
import { listProducts } from '@/lib/catalog';

const body = z.object({ items: cartSchema, state: z.string().optional().refine((s) => !s || INDIAN_STATES.some((x) => x.name === s), 'Unknown state'), pincode: z.string().optional(), redeemPoints: z.number().int().min(0).optional(), email: z.string().email().optional() });
export const POST = handle(async (req) => {
  const b = body.parse(await req.json());
  const q = await quoteCart(b.items, b);
  const inCart = new Set(q.lines.map((l) => l.productId));
  const addonIds = new Set<number>();
  for (const l of q.lines) if (l.productId) { const p = (await listProducts({ ids: [l.productId] }))[0]; p?.addonIds.forEach((a) => !inCart.has(a) && addonIds.add(a)); }
  const addons = (await listProducts({ ids: [...addonIds], inStock: true })).slice(0, 3).map((p) => ({ id: p.id, slug: p.slug, name: p.name, pricePaise: p.pricePaise, image: p.images[0]?.url ?? null, variantId: p.variants.find((v) => v.stock > 0 || p.madeToOrder)?.id ?? null, hasChoices: p.variants.length > 1 || p.engraving.enabled }));
  return json({ ...q, addons });
});
