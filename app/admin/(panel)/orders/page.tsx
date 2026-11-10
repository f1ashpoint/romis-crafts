import Link from 'next/link';
import { getDb } from '../../../../lib/db';
import { rupees } from '../../../../lib/money';
import OrderActions from '../../../../components/admin/OrderActions';
import { releaseExpiredOrders } from '../../../../lib/orders';
export const dynamic = 'force-dynamic';
const STATUSES = ['paid', 'shipped', 'delivered', 'pending_payment', 'needs_refund', 'refunded', 'cancelled', 'expired', 'payment_failed'];
export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams; await releaseExpiredOrders();
  const status = STATUSES.includes(sp.status ?? '') ? sp.status! : ''; const q = (sp.q ?? '').trim().slice(0, 80);
  const rows = await (await getDb()).all<any>(`SELECT o.*, (SELECT number FROM invoices WHERE order_id=o.id) inv, (SELECT string_agg(name || ' x' || qty, ', ' ORDER BY id) FROM order_items WHERE order_id=o.id) items FROM orders o
    WHERE (?::text = '' OR o.status = ?::text) AND (?::text = '' OR o.number ILIKE '%' || ?::text || '%' OR o.name ILIKE '%' || ?::text || '%' OR o.email ILIKE '%' || ?::text || '%' OR o.phone LIKE '%' || ?::text || '%') ORDER BY o.id DESC LIMIT 200`, status, status, q, q, q, q, q);
  return (<div className="stack"><div className="sechead"><h1>Orders</h1><a className="btn alt" href="/api/admin/orders/export">Download all as CSV</a></div>
    <form className="filters" method="get"><label>Status<select name="status" defaultValue={status}><option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select></label>
      <label>Search<input name="q" defaultValue={q} placeholder="Order no., name, email, phone" /></label><button className="btn sm">Filter</button>{(status || q) && <Link href="/admin/orders">Clear</Link>}</form>
    <div className="scroll"><table className="t"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Invoice</th><th>Fulfilment</th></tr></thead><tbody>
    {rows.map((o) => <tr key={o.id}><td>{o.number}</td><td>{o.created_at}</td><td>{o.name}<br /><small>{o.email}, {o.phone}<br />{o.ship_line1}{o.ship_line2 ? ', ' + o.ship_line2 : ''}, {o.ship_city}, {o.ship_state} {o.ship_pincode}</small></td><td>{o.items}{o.dispatch_by && <div><small>Dispatch by {o.dispatch_by}</small></div>}</td><td>{rupees(o.total_paise)}</td><td>{o.status.replace(/_/g, ' ')}</td>
      <td>{o.inv ? <a href={`/api/orders/${o.token}/invoice`}>{o.inv}</a> : '-'}</td><td><OrderActions id={o.id} status={o.status} awb={o.awb} notes={o.notes} /></td></tr>)}
    {!rows.length && <tr><td colSpan={8}>No orders found.</td></tr>}</tbody></table></div></div>);
}
