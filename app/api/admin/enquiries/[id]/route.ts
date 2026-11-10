import { z } from 'zod';
import { handle, json, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ENQUIRY_STATUSES } from '@/lib/enquiries';

const body = z.object({ status: z.enum(ENQUIRY_STATUSES).optional(), notes: z.string().trim().max(2000).optional() });
export const PATCH = handle(async (req, c) => {
  await requireAdmin(req);
  const id = Number((await c?.params)?.id); const b = body.parse(await req.json());
  const n = await (await getDb()).run('UPDATE enquiries SET status=COALESCE(?::text,status), notes=COALESCE(?::text,notes) WHERE id=?', b.status ?? null, b.notes ?? null, id);
  if (!n) throw new HttpError(404, 'Enquiry not found.');
  return json({ ok: true });
});
export const DELETE = handle(async (req, c) => {
  await requireAdmin(req);
  const n = await (await getDb()).run('DELETE FROM enquiries WHERE id=?', Number((await c?.params)?.id));
  if (!n) throw new HttpError(404, 'Enquiry not found.');
  return json({ ok: true });
});
