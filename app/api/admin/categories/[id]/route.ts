import { handle, json, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { categoryBody } from '../route';

export const PATCH = handle(async (req, c) => {
  await requireAdmin(req);
  const id = Number((await c?.params)?.id); const b = categoryBody.parse(await req.json());
  const n = await (await getDb()).run('UPDATE categories SET name=?, blurb=?, sort=COALESCE(?::int, sort) WHERE id=?', b.name, b.blurb, b.sort ?? null, id);
  if (!n) throw new HttpError(404, 'Category not found.');
  return json({ ok: true });
});
export const DELETE = handle(async (req, c) => {
  await requireAdmin(req);
  const id = Number((await c?.params)?.id); const db = await getDb();
  const used = (await db.get<{ n: number }>('SELECT COUNT(*)::int n FROM product_categories WHERE category_id=?', id))!.n;
  if (used) throw new HttpError(409, `This category still has ${used} product${used === 1 ? '' : 's'}. Move them to another category (Products > Edit) first.`);
  const n = await db.run('DELETE FROM categories WHERE id=?', id);
  if (!n) throw new HttpError(404, 'Category not found.');
  return json({ ok: true });
});
