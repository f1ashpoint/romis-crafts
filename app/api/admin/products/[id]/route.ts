import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { productInput, saveProduct, setArchived, deleteProduct, getProductById } from '@/lib/catalog';

const idOf = async (c: any) => { const n = Number((await c?.params)?.id); if (!Number.isInteger(n)) throw new HttpError(400, 'Bad product id'); return n; };
export const PUT = handle(async (req, c) => {
  await requireAdmin(req); const id = await idOf(c);
  if (!(await getProductById(id))) throw new HttpError(404, 'Product not found.');
  await saveProduct(productInput.parse(await req.json()), id);
  return json({ id });
});
export const PATCH = handle(async (req, c) => {
  await requireAdmin(req); const id = await idOf(c);
  const { archived } = z.object({ archived: z.boolean() }).parse(await req.json());
  if (!(await setArchived(id, archived))) throw new HttpError(404, 'Product not found.');
  return json({ id, archived });
});
export const DELETE = handle(async (req, c) => {
  await requireAdmin(req);
  if (!(await deleteProduct(await idOf(c)))) throw new HttpError(404, 'Product not found.');
  return json({ ok: true });
});
