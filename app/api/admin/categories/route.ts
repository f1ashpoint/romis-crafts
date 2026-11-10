import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const categoryBody = z.object({ name: z.string().trim().min(2, 'Enter a name').max(60), blurb: z.string().trim().max(160).default(''), sort: z.coerce.number().int().min(0).max(999).optional() });
export const slugify = (s: string) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'category';
export const GET = handle(async (req) => {
  await requireAdmin(req);
  return json(await (await getDb()).all('SELECT c.id, c.slug, c.name, c.blurb, c.sort, (SELECT COUNT(*)::int FROM product_categories WHERE category_id=c.id) products FROM categories c ORDER BY c.sort, c.id'));
});
export const POST = handle(async (req) => {
  await requireAdmin(req);
  const b = categoryBody.parse(await req.json()); const db = await getDb();
  let slug = slugify(b.name); let n = 2;
  while (await db.get('SELECT 1 FROM categories WHERE slug=?', slug)) slug = `${slugify(b.name)}-${n++}`;
  const next = (await db.get<{ m: number }>('SELECT COALESCE(MAX(sort),-1)+1 AS m FROM categories'))!.m;
  const id = await db.insert('INSERT INTO categories (slug, name, blurb, sort) VALUES (?,?,?,?)', slug, b.name, b.blurb, b.sort ?? next);
  return json({ id, slug }, 201);
});
