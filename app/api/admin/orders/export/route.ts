import { handle } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

const q = (v: unknown) => { const s = String(v ?? ''); return /^[=+\-@\t\r]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const GET = handle(async (req) => {
  await requireAdmin(req);
  const rows = await (await getDb()).all<any>(`SELECT o.*, (SELECT number FROM invoices WHERE order_id=o.id) inv, (SELECT string_agg(name || ' x' || qty, '; ' ORDER BY id) FROM order_items WHERE order_id=o.id) items FROM orders o ORDER BY o.id DESC`);
  const head = ['Order', 'Date (UTC)', 'Status', 'Customer', 'Email', 'Phone', 'City', 'State', 'PIN', 'Items', 'Items total (INR)', 'Shipping (INR)', 'Total (INR)', 'CGST', 'SGST', 'IGST', 'Invoice', 'Tracking'];
  const r = (p: number) => (p / 100).toFixed(2);
  const lines = [head.join(',')].concat(rows.map((o) => [o.number, o.created_at, o.status, o.name, o.email, o.phone, o.ship_city, o.ship_state, o.ship_pincode, o.items, r(o.items_total_paise), r(o.shipping_paise), r(o.total_paise), r(o.cgst_paise), r(o.sgst_paise), r(o.igst_paise), o.inv ?? '', o.awb].map(q).join(',')));
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="simply-romi-orders.csv"', 'Cache-Control': 'no-store' } });
});
