import { getDb } from './db';
import { saveProduct, productInput } from './catalog';
import { DEMO } from './seedData';

/** Fills an empty catalogue with the demo pieces when SEED_DEMO=1. Runs at most once per process. Never touches a shop that already has products. */
let done = false;
export async function ensureDemoCatalogue() {
  if (done || process.env.SEED_DEMO !== '1') return;
  done = true;
  try {
    const db = await getDb();
    const n = (await db.get<{ n: number }>('SELECT COUNT(*)::int AS n FROM products'))!.n;
    if (n > 0) return;
    const ids = new Map<string, number>();
    for (const d of DEMO) ids.set(d.name, await saveProduct(productInput.parse(d)));
    const link = async (a: string, b: string) => { const x = ids.get(a), y = ids.get(b); if (x && y) await db.run('INSERT INTO product_addons (product_id, addon_product_id) VALUES (?,?) ON CONFLICT DO NOTHING', x, y); };
    await link('Bead & Chenille Necklace', 'Clay Drop Earrings'); await link('Clay Drop Earrings', 'Bead & Chenille Necklace');
    await link('Hand-Stamped Clay Charm', 'Clay Care Kit'); await link('Pinch-Pot Trinket Bowl', 'Clay Care Kit'); await link('Glazed Stoneware Vase', 'Chenille Tulip Bouquet');
  } catch (e) { done = false; throw e; }
}
