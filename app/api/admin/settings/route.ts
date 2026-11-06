import { z } from 'zod';
import { handle, json } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { getSettings, saveSettings } from '@/lib/config';
import { toPaise } from '@/lib/money';

const rate = z.coerce.number().min(0).max(40);
const body = z.object({
  shippingFlatInr: z.coerce.number().min(0).max(5000), freeShippingThresholdInr: z.coerce.number().min(0).max(1_000_000),
  shippingGstRate: rate, lowStockThreshold: z.coerce.number().int().min(0).max(100),
  categoryGst: z.record(z.string(), rate),
  loyaltyEarnPerRupees: z.coerce.number().int().min(1).max(10000), loyaltyMaxRedeemPct: z.coerce.number().int().min(0).max(100),
});
export const GET = handle(async (req) => { await requireAdmin(req); return json(await getSettings()); });
export const PUT = handle(async (req) => {
  await requireAdmin(req);
  const b = body.parse(await req.json());
  await saveSettings({ shippingFlatPaise: toPaise(b.shippingFlatInr), freeShippingThresholdPaise: toPaise(b.freeShippingThresholdInr), shippingGstRate: b.shippingGstRate,
    lowStockThreshold: b.lowStockThreshold, categoryGst: b.categoryGst, loyaltyEarnPerRupees: b.loyaltyEarnPerRupees, loyaltyMaxRedeemPct: b.loyaltyMaxRedeemPct });
  return json({ ok: true });
});
