import { getDb } from './db';
import { saveProduct, productInput } from './catalog';
import { DEMO } from './seedData';

/**
 * Adds the sample catalogue (with sample images) when SEED_DEMO=1. It runs once per catalogue version: after it has run, products you delete
 * stay deleted, and nothing you added yourself is touched. Remove SEED_DEMO from the environment once you have your own products.
 */
const VERSION = 'demo_catalogue_v3'; const PREVIOUS = 'demo_catalogue_v2';
let done = false;
export async function ensureDemoCatalogue() {
  if (done || process.env.SEED_DEMO !== '1') return;
  done = true;
  try {
    const db = await getDb();
    if (await db.get('SELECT 1 FROM settings WHERE key=?', VERSION)) return;
    // If v2 already ran, only add the products introduced in v3 so anything the owner deleted from v2 stays deleted.
    const onlyNew = !!(await db.get('SELECT 1 FROM settings WHERE key=?', PREVIOUS));
    // Retire the old clay and ceramics sample products (archived, so any past orders keep their details).
    const legacy = ['Glazed Stoneware Vase', 'Speckle Mug', 'Pinch-Pot Trinket Bowl', 'Clay Drop Earrings', 'Hand-Stamped Clay Charm', 'Clay Care Kit'];
    await db.run(`UPDATE products SET status='archived', featured=0 WHERE name IN (${legacy.map(() => '?').join(',')})`, ...legacy);
    const ids = new Map<string, number>();
    for (const d of DEMO) {
      if (onlyNew && ((d as any).v ?? 2) < 3) continue;
      const existing = await db.get<{ id: number }>('SELECT id FROM products WHERE name=?', d.name);
      if (!existing) { ids.set(d.name, await saveProduct(productInput.parse(d))); continue; }
      ids.set(d.name, existing.id);
      // An earlier sample product with the same name: give it the new sample photos, but never replace photos the owner uploaded.
      const imgs = await db.all<{ url: string }>('SELECT url FROM product_images WHERE product_id=?', existing.id);
      if (imgs.every((i) => i.url.startsWith('/products/'))) {
        await db.run('DELETE FROM product_images WHERE product_id=?', existing.id);
        for (const [i, im] of (((d as any).images ?? []) as { url: string; alt?: string }[]).entries()) await db.run('INSERT INTO product_images (product_id, url, alt, sort) VALUES (?,?,?,?)', existing.id, im.url, im.alt ?? '', i);
      }
    }
    const link = async (a: string, b: string) => { const x = ids.get(a), y = ids.get(b); if (x && y) await db.run('INSERT INTO product_addons (product_id, addon_product_id) VALUES (?,?) ON CONFLICT DO NOTHING', x, y); };
    await link('Bead & Chenille Necklace', 'Flower Drop Earrings'); await link('Flower Drop Earrings', 'Bead & Chenille Necklace');
    await link('Crochet Flower Keychain', 'Daisy Hair Band Set'); await link('Chenille Tulip Bouquet', 'Chenille Daisy Flower Pot'); await link('Chenille Sunflower Bouquet', 'Custom Gift Hamper');
    await db.run('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT (key) DO NOTHING', VERSION, '"1"');
  } catch (e) { done = false; throw e; }
}
