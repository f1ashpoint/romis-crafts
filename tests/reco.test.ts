import { describe, it, expect, beforeEach } from 'vitest';
import { dbGet, dbRun, freshDb, addProduct } from './helpers';
import { recordEvent } from '@/lib/behavior';
import { getRecommendations } from '@/lib/reco';

const V = 'a'.repeat(32);
beforeEach(async () => { await freshDb(); });
describe('recommendations use on-site behaviour only', () => {
  it('falls back to new arrivals with an honest label when there is no history', async () => {
    await addProduct({ name: 'Ab' }); const r = await getRecommendations(undefined, 4);
    expect(r[0].tier).toBe('new'); expect(r[0].reason).toBe('New from the studio');
  });
  it('ranks purchased category above viewed and excludes owned items', async () => {
    const bought = await addProduct({ name: 'Bought', categories: ['fiber-textile'] });
    const viewed = await addProduct({ name: 'Viewed', categories: ['accessories'] });
    const c = await addProduct({ name: 'Mug2', categories: ['fiber-textile'] }); const d = await addProduct({ name: 'Charm2', categories: ['accessories'] });
    await recordEvent(V, bought, 'purchase'); await recordEvent(V, viewed, 'view');
    const r = await getRecommendations(V, 4);
    expect(r.map((x) => x.product.id)).not.toContain(bought);
    expect(r[0].product.id).toBe(c); expect(r[0].tier).toBe('purchased'); expect(r[0].reason).toContain('Bought');
    expect(r.find((x) => x.product.id === d)?.tier).toBe('viewed');
  });
});
