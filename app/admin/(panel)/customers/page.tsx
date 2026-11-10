import { getDb } from '../../../../lib/db';
import { rupees } from '../../../../lib/money';
import LoyaltyAdjust from '../../../../components/admin/LoyaltyAdjust';
export const dynamic = 'force-dynamic';
export default async function Customers() {
  const rows = await (await getDb()).all<any>(`SELECT o.email, MAX(o.name) name, MAX(o.phone) phone, MAX(o.ship_city) city, COUNT(*)::int orders,
      COALESCE(SUM(CASE WHEN o.status IN ('paid','shipped','delivered') THEN o.total_paise END),0)::bigint spent, MAX(o.created_at) last, MAX(m.points) points
    FROM orders o LEFT JOIN loyalty_members m ON m.email=o.email GROUP BY o.email ORDER BY MAX(o.id) DESC LIMIT 500`);
  const members = await (await getDb()).all<any>('SELECT email, name, points, enrolled_at FROM loyalty_members ORDER BY enrolled_at DESC LIMIT 200');
  return (<div className="stack"><h1>Customers and rewards</h1>
    <div className="scroll"><table className="t"><thead><tr><th>Customer</th><th>Contact</th><th>City</th><th>Orders</th><th>Paid total</th><th>Last order</th><th>Points</th></tr></thead><tbody>
      {rows.map((c) => <tr key={c.email}><td>{c.name}</td><td>{c.email}<br /><small>{c.phone}</small></td><td>{c.city}</td><td>{c.orders}</td><td>{rupees(c.spent)}</td><td>{c.last}</td><td>{c.points ?? '-'}</td></tr>)}
      {!rows.length && <tr><td colSpan={7}>No customers yet.</td></tr>}</tbody></table></div>
    <h2>Rewards members</h2><p className="note">Adjust a balance to fix a mistake or say thank you. Every change is recorded with your reason.</p>
    <LoyaltyAdjust members={members} /></div>);
}
