import ProductForm, { blankForm } from '../../../../../components/admin/ProductForm';
import { listCategories, listProducts } from '../../../../../lib/catalog';
import { getSettings } from '../../../../../lib/config';
export const dynamic = 'force-dynamic';
export default async function New() {
  const [cats, others, s] = await Promise.all([listCategories(), listProducts({ includeArchived: true }), getSettings()]);
  return <ProductForm initial={blankForm} categories={cats} others={others.map((p) => ({ id: p.id, name: p.name }))} defaultGst={s.categoryGst} />;
}
