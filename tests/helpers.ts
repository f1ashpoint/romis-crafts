import { resetDbForTests, getDb } from '@/lib/db';
import { z } from 'zod';
import { saveProduct, productInput } from '@/lib/catalog';
import { hashPassword } from '@/lib/auth';

export const freshDb = async () => { await resetDbForTests(); };
export async function addProduct(over: Partial<z.input<typeof productInput>> = {}) {
  return await saveProduct(productInput.parse({
    name: 'Test Piece', priceInr: 500, categories: ['ceramics'], variants: [{ label: 'Standard', stock: 5 }], ...over,
  }));
}
export async function addAdmin(email = 'owner@example.com', pw = 'correct horse battery') {
  const db = await getDb();
  return db.insert('INSERT INTO admins (email, password_hash) VALUES (?,?)', email, hashPassword(pw));
}
export const variantOf = async (productId: number) => (await (await getDb()).get<{ id: number }>('SELECT id FROM variants WHERE product_id=?', productId))!.id;
export const address = { name: 'Asha Rao', email: 'asha@example.com', phone: '9876543210', line1: '12 Lake View Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', country: 'India' };
export const dbGet = async (sql: string, ...p: unknown[]) => (await getDb()).get(sql, ...p);
export const dbRun = async (sql: string, ...p: unknown[]) => (await getDb()).run(sql, ...p);
