import { getDb, type Queryable } from './db';
export const VISITOR_COOKIE = 'csc_vid';
export const NOPERS_COOKIE = 'csc_nopers';

export async function recordEvent(visitorId: string, productId: number, type: 'view' | 'cart' | 'purchase', q?: Queryable) {
  if (!/^[a-f0-9]{16,64}$/.test(visitorId)) return;
  await (q ?? await getDb()).run('INSERT INTO events (visitor_id, product_id, type) VALUES (?,?,?)', visitorId, productId, type);
}
export async function eraseVisitor(visitorId: string) {
  await (await getDb()).run('DELETE FROM events WHERE visitor_id = ?', visitorId);
}
