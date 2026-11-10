import CategoryManager from '../../../../components/admin/CategoryManager';
import { getDb } from '../../../../lib/db';
export const dynamic = 'force-dynamic';
export default async function Categories() {
  const rows = await (await getDb()).all<any>('SELECT c.id, c.slug, c.name, c.blurb, c.sort, (SELECT COUNT(*)::int FROM product_categories WHERE category_id=c.id) products FROM categories c ORDER BY c.sort, c.id');
  return <CategoryManager initial={rows} />;
}
