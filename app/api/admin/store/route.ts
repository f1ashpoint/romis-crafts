import { z } from 'zod';
import { handle, json } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { getStore, saveStoreProfile } from '@/lib/config';

const t = (n: number) => z.string().trim().max(n).default('');
const body = z.object({
  name: t(100), address: t(300), gstin: z.string().trim().toUpperCase().regex(/^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'That GSTIN does not look right (15 characters)').default(''),
  pan: z.string().trim().toUpperCase().regex(/^$|^[A-Z]{5}[0-9]{4}[A-Z]$/, 'That PAN does not look right (10 characters)').default(''),
  email: z.string().trim().max(160).refine((v) => v === '' || /^\S+@\S+\.\S+$/.test(v), 'Enter a valid email').default(''), phone: t(30),
  grievanceName: t(100), grievanceEmail: z.string().trim().max(160).refine((v) => v === '' || /^\S+@\S+\.\S+$/.test(v), 'Enter a valid email').default(''),
  instagram: z.string().trim().max(200).refine((v) => v === '' || /^https:\/\//.test(v), 'Start the link with https://').default(''), whatsapp: t(30), tagline: t(80),
  upiId: z.string().trim().max(80).regex(/^$|^[a-zA-Z0-9._-]{2,64}@[a-zA-Z0-9.-]{2,40}$/, 'A UPI ID looks like name@bank').default(''),
});
export const GET = handle(async (req) => { await requireAdmin(req); return json(await getStore()); });
export const PUT = handle(async (req) => { await requireAdmin(req); await saveStoreProfile(body.parse(await req.json())); return json({ ok: true }); });
