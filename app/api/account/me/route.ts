import { handle, json } from '@/lib/http';
import { customerFromReq, wishlistIds, listAddresses } from '@/lib/customer';
/** Lightweight session probe used by the header, wishlist hearts and checkout prefill. */
export const GET = handle(async (req) => { const c = await customerFromReq(req); if (!c) return json({ user: null }); return json({ user: c, wishlist: await wishlistIds(c.id), addresses: await listAddresses(c.id) }); });
