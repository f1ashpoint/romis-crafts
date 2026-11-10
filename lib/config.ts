import { getDb, type Queryable } from './db';

import { INDIAN_STATES, stateCode } from './states';
export { INDIAN_STATES, stateCode };
export interface Settings {
  originState: string;
  shippingFlatPaise: number;
  freeShippingThresholdPaise: number;
  shippingGstRate: number;
  categoryGst: Record<string, number>;
  lowStockThreshold: number;
  orderHoldMinutes: number;
  loyaltyEarnPerRupees: number;
  loyaltyPointValuePaise: number;
  loyaltyMaxRedeemPct: number;
}

// Defaults are starting points only. The owner edits them in Admin > Settings.
export const DEFAULT_SETTINGS: Settings = {
  originState: 'Tamil Nadu',
  shippingFlatPaise: 7900,
  freeShippingThresholdPaise: 99900,
  shippingGstRate: 18,
  categoryGst: { clay: 5, 'fiber-textile': 5, ceramics: 5, 'home-decor': 18, accessories: 18, 'wedding-events': 18 },
  lowStockThreshold: 5,
  orderHoldMinutes: 30,
  loyaltyEarnPerRupees: 50,
  loyaltyPointValuePaise: 100,
  loyaltyMaxRedeemPct: 20,
};

export async function getSettings(q?: Queryable): Promise<Settings> {
  const rows = await (q ?? await getDb()).all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const out: Settings = { ...DEFAULT_SETTINGS, categoryGst: { ...DEFAULT_SETTINGS.categoryGst } };
  for (const r of rows) {
    try {
      const v = JSON.parse(r.value);
      if (r.key === 'categoryGst') out.categoryGst = { ...out.categoryGst, ...v };
      else if (r.key in out) (out as unknown as Record<string, unknown>)[r.key] = v;
    } catch { /* ignore a corrupt row and keep the default */ }
  }
  return out;
}

export async function saveSettings(patch: Partial<Settings>) {
  const db = await getDb();
  await db.tx(async (q) => { for (const [k, v] of Object.entries(patch)) await q.run('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', k, JSON.stringify(v)); });
}

export const store = () => ({
  name: process.env.STORE_LEGAL_NAME || 'Simply Romi',
  address: process.env.STORE_ADDRESS || 'Chennai, Tamil Nadu, India',
  gstin: process.env.STORE_GSTIN || '',
  pan: process.env.STORE_PAN || '',
  email: process.env.STORE_EMAIL || 'hello@example.com',
  phone: process.env.STORE_PHONE || '',
  grievanceName: process.env.GRIEVANCE_OFFICER_NAME || '',
  grievanceEmail: process.env.GRIEVANCE_OFFICER_EMAIL || process.env.STORE_EMAIL || '',
});
