import Link from 'next/link';
import { getDb } from '../../../../lib/db';
import { getSettings } from '../../../../lib/config';
import { rupees } from '../../../../lib/money';
import { releaseExpiredOrders } from '../../../../lib/orders';
export const dynamic = 'force-dynamic';
const PAID = "('paid','shipped','delivered')";
const D30 = "to_char(timezone('utc', now()) - interval '30 days', 'YYYY-MM-DD HH24:MI:SS')";
export default async function Dashboard() {
  await releaseExpiredOrders();
  const db = await getDb(); const low = (await getSettings()).lowStockThreshold;
  const one = async (sql: string, ...p: unknown[]) => (await db.get<{ n: number }>(sql, ...p))!.n;
  const [toShip, refund, pending, enq, rev30, ord30, products, members] = await Promise.all([
    one("SELECT COUNT(*)::int n FROM orders WHERE status='paid'"), one("SELECT COUNT(*)::int n FROM orders WHERE status='needs_refund'"),
    one("SELECT COUNT(*)::int n FROM orders WHERE status='pending_payment'"), one("SELECT COUNT(*)::int n FROM enquiries WHERE status='new'"),
    one(`SELECT COALESCE(SUM(total_paise),0)::bigint n FROM orders WHERE status IN ${PAID} AND paid_at >= ${D30}`), one(`SELECT COUNT(*)::int n FROM orders WHERE status IN ${PAID} AND paid_at >= ${D30}`),
    one("SELECT COUNT(*)::int n FROM products WHERE status='active'"), one('SELECT COUNT(*)::int n FROM loyalty_members'),
  ]);
  const lowStock = await db.all<any>(`SELECT p.id, p.name, v.label, v.stock FROM variants v JOIN products p ON p.id=v.product_id WHERE p.status='active' AND p.lead_time_days IS NULL AND v.stock <= ? ORDER BY v.stock, p.name LIMIT 12`, low);
  const recent = await db.all<any>('SELECT number, name, total_paise, status, created_at FROM orders ORDER BY id DESC LIMIT 8');
  const top = await db.all<any>(`SELECT oi.name, SUM(oi.qty)::int qty FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.status IN ${PAID} AND o.paid_at >= ${D30} GROUP BY oi.name ORDER BY qty DESC LIMIT 5`);
  const Card = ({ label, value, href, warn }: { label: string; value: string | number; href?: string; warn?: boolean }) => { const inner = (<><span className="note">{label}</span><b style={{ display: 'block', fontSize: '1.7rem', fontFamily: 'var(--serif)', color: warn ? '#a4142f' : undefined }}>{value}</b></>); return href ? <Link href={href} className="box" style={{ textDecoration: 'none' }}>{inner}</Link> : <div className="box">{inner}</div>; };
  return (<div className="stack"><h1>Dashboard</h1>
    <div className="cats" style={{ margin: 0 }}>
      <Card label="Revenue, last 30 days" value={rupees(rev30)} /><Card label="Paid orders, last 30 days" value={ord30} />
      <Card label="Paid, waiting to ship" value={toShip} href="/admin/orders?status=paid" warn={toShip > 0} /><Card label="Need a refund" value={refund} href="/admin/orders?status=needs_refund" warn={refund > 0} />
      <Card label="New custom enquiries" value={enq} href="/admin/enquiries" warn={enq > 0} /><Card label="Awaiting payment" value={pending} href="/admin/orders?status=pending_payment" />
      <Card label="Active products" value={products} href="/admin/products" /><Card label="Rewards members" value={members} href="/admin/customers" /></div>
    <div className="cartgrid" style={{ padding: 0 }}>
      <section className="box"><h2>Recent orders</h2><div className="scroll"><table className="t"><tbody>
        {recent.map((o) => <tr key={o.number}><td>{o.number}</td><td>{o.name}</td><td>{rupees(o.total_paise)}</td><td>{o.status.replace(/_/g, ' ')}</td></tr>)}{!recent.length && <tr><td>No orders yet. Share the shop link to get started.</td></tr>}</tbody></table></div><p><Link href="/admin/orders">All orders</Link></p></section>
      <div className="stack">
        <section className="box"><h2>Low stock</h2>{lowStock.length ? <ul style={{ margin: 0, paddingLeft: 18 }}>{lowStock.map((v, i) => <li key={i}><Link href={`/admin/products/${v.id}`}>{v.name}</Link> ({v.label}): <b style={{ color: '#a4142f' }}>{v.stock}</b> left</li>)}</ul> : <p className="note">Nothing is running low.</p>}</section>
        <section className="box"><h2>Best sellers, 30 days</h2>{top.length ? <ol style={{ margin: 0, paddingLeft: 18 }}>{top.map((t) => <li key={t.name}>{t.name} ({t.qty})</li>)}</ol> : <p className="note">No sales yet.</p>}</section></div></div>
    <div className="row"><Link className="btn" href="/admin/products/new">Add product</Link><Link className="btn alt" href="/admin/store">Store details</Link><a className="btn alt" href="/" target="_blank" rel="noopener">View shop</a></div></div>);
}
