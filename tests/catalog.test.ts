import { describe, it, expect, beforeEach } from 'vitest';
import { dbGet, dbRun, freshDb, addProduct } from './helpers';
import { listProducts, listCategories, getProductBySlug, setArchived, deleteProduct, productInput, saveProduct, dispatchDate } from '@/lib/catalog';

beforeEach(async () => { await freshDb(); });
describe('catalog', () => {
  it('has all six categories in navigation order', async () => {
    expect((await listCategories()).map((c) => c.name)).toEqual(['Air-Dry Clay & Polymer Clay', 'Fiber & Textile Art', 'Handmade Ceramics', 'Aesthetic Home Decor', 'Personal Accessories', 'Wedding & Events']);
  });
  it('filters by category, price, stock and made-to-order, and hides archived', async () => {
    const a = await addProduct({ name: 'Mug', priceInr: 400, categories: ['ceramics'] });
    await addProduct({ name: 'Charm', priceInr: 1500, categories: ['clay'], variants: [{ label: 'S', stock: 0 }] });
    await addProduct({ name: 'Favour', priceInr: 800, categories: ['wedding-events'], variants: [{ label: 'Set', stock: 0 }], leadTimeDays: 10 });
    expect((await listProducts({ category: 'ceramics' })).map((p) => p.name)).toEqual(['Mug']);
    expect((await listProducts({ minPaise: 50000 })).map((p) => p.name).sort()).toEqual(['Charm', 'Favour']);
    expect((await listProducts({ inStock: true })).map((p) => p.name).sort()).toEqual(['Favour', 'Mug']);
    expect((await listProducts({ madeToOrder: true })).map((p) => p.name)).toEqual(['Favour']);
    await setArchived(a, true);
    expect(await listProducts({ category: 'ceramics' })).toHaveLength(0);
    expect(await listProducts({ category: 'ceramics', includeArchived: true })).toHaveLength(1);
  });
  it('supports multiple categories, variants and per-product GST defaults from settings', async () => {
    await addProduct({ name: 'Vase', categories: ['ceramics', 'home-decor'], variants: [{ label: 'Blue', stock: 2 }, { label: 'Pink', stock: 3, priceInr: 650 }] });
    const p = (await getProductBySlug('vase'))!;
    expect(p.categories).toHaveLength(2); expect(p.gstRate).toBe(5); expect(p.totalStock).toBe(5); expect(p.variants[1].pricePaise).toBe(65000);
  });
  it('validates input on the server', async () => {
    expect(() => productInput.parse({ name: 'x', priceInr: -1, categories: [], variants: [] })).toThrow();
    await expect(saveProduct(productInput.parse({ name: 'Bad', priceInr: 1, categories: ['nope'], variants: [{ label: 'a', stock: 1 }] }))).rejects.toThrow(/Unknown category/);
  });
  it('deletes products and derives dispatch date from lead time', async () => {
    const id = await addProduct({ name: 'Temp' }); expect(await deleteProduct(id)).toBe(true); expect(await getProductBySlug('temp')).toBeNull();
    expect(dispatchDate(10, new Date('2026-10-13T06:00:00Z'))).toBe('2026-10-23');
  });
});

import { normaliseSsl } from '@/lib/db';
describe('database url', () => {
  it('makes the certificate check explicit', () => {
    expect(normaliseSsl('postgres://u:p@h/db?sslmode=require')).toBe('postgres://u:p@h/db?sslmode=verify-full');
    expect(normaliseSsl('postgres://u:p@h/db?x=1&sslmode=prefer&y=2')).toBe('postgres://u:p@h/db?x=1&sslmode=verify-full&y=2');
    expect(normaliseSsl('postgres://u:p@h/db')).toBe('postgres://u:p@h/db');
  });
});
