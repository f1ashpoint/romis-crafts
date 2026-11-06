import SettingsForm from '../../../../components/admin/SettingsForm';
import { getSettings } from '../../../../lib/config';
import { listCategories } from '../../../../lib/catalog';
export const dynamic = 'force-dynamic';
export default async function Settings() {
  const s = await getSettings();
  return <SettingsForm categories={await listCategories()} initial={{ shippingFlatInr: s.shippingFlatPaise / 100, freeShippingThresholdInr: s.freeShippingThresholdPaise / 100, shippingGstRate: s.shippingGstRate, lowStockThreshold: s.lowStockThreshold, loyaltyEarnPerRupees: s.loyaltyEarnPerRupees, loyaltyMaxRedeemPct: s.loyaltyMaxRedeemPct, categoryGst: s.categoryGst }} />;
}
