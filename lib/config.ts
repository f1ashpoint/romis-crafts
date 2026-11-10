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
  categoryGst: { 'fiber-textile': 5, 'home-decor': 18, accessories: 18, 'wedding-events': 18 },
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

const envStore = () => ({
  name: process.env.STORE_LEGAL_NAME || 'Simply Romi',
  address: process.env.STORE_ADDRESS || 'Chennai, Tamil Nadu, India',
  gstin: process.env.STORE_GSTIN || '',
  pan: process.env.STORE_PAN || '',
  email: process.env.STORE_EMAIL || 'hello@example.com',
  phone: process.env.STORE_PHONE || '',
  grievanceName: process.env.GRIEVANCE_OFFICER_NAME || '',
  grievanceEmail: process.env.GRIEVANCE_OFFICER_EMAIL || process.env.STORE_EMAIL || '',
});

export type StoreProfile = ReturnType<typeof envStore> & { instagram: string; whatsapp: string; tagline: string };
/** Environment values, used as the starting point. Kept sync for code that cannot await. */
export const store = () => envStore();
export const STORE_FIELDS = ['name', 'address', 'gstin', 'pan', 'email', 'phone', 'grievanceName', 'grievanceEmail', 'instagram', 'whatsapp', 'tagline'] as const;
/** The shop's public details: values saved in Admin > Store details win over the environment defaults. */
export async function getStore(q?: Queryable): Promise<StoreProfile> {
  const base: StoreProfile = { ...envStore(), instagram: 'https://www.instagram.com/simplyromi.studio', whatsapp: '', tagline: 'A little luxury in every detail' };
  try {
    const row = await (q ?? await getDb()).get<{ value: string }>("SELECT value FROM settings WHERE key='storeProfile'");
    if (row) { const v = JSON.parse(row.value); for (const k of STORE_FIELDS) if (typeof v[k] === 'string' && v[k].trim()) (base as any)[k] = v[k].trim(); }
  } catch { /* fall back to the environment values */ }
  if (!process.env.GRIEVANCE_OFFICER_EMAIL && base.grievanceEmail === envStore().grievanceEmail) base.grievanceEmail ||= base.email;
  return base;
}
export async function saveStoreProfile(p: Record<string, string>) {
  const db = await getDb();
  await db.run('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', 'storeProfile', JSON.stringify(p));
}
