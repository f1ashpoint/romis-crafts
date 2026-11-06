import { handle, json } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { listProducts, productInput, saveProduct } from '@/lib/catalog';

export const GET = handle(async (req) => { await requireAdmin(req); return json({ products: await listProducts({ includeArchived: true }) }); });
export const POST = handle(async (req) => {
  await requireAdmin(req);
  const id = await saveProduct(productInput.parse(await req.json()));
  return json({ id }, 201);
});
