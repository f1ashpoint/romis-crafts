import { redirect } from 'next/navigation';
import AccountNav from '@/components/AccountNav';
import ReorderButton from '@/components/ReorderButton';
import { getCustomer, customerOrders } from '@/lib/customer';
import { rupees } from '@/lib/money';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your orders', robots: { index: false } };
const label: Record<string, string> = { pending_payment: 'Waiting for payment', payment_review: 'Confirming payment', paid: 'Paid, being made', shipped: 'Shipped', delivered: 'Delivered', expired: 'Expired', payment_failed: 'Payment failed', cancelled: 'Cancelled', needs_refund: 'Refund in progress', refunded: 'Refunded' };
export default async function Account() {
  const c = await getCustomer(); if (!c) redirect('/account/login?next=/account');
  const orders = await customerOrders(c.id);
  return (<div className="section"><AccountNav here="/account" name={c.name} />
    {!orders.length ? <div className="box"><p>No orders yet. Orders you place while signed in show up here.</p><a className="btn" href="/shop">Browse the shop</a></div>
      : <div className="stack">{orders.map((o: any) => <div className="box ordercard" key={o.id}><div className="row" style={{ justifyContent: 'space-between' }}><b>Order {o.number}</b><span className="tag">{label[o.status] ?? o.status}</span></div>
        <p className="note" style={{ margin: '.3rem 0' }}>{String(o.created_at).slice(0, 10)} · {rupees(o.total_paise)}</p><p style={{ margin: '.3rem 0' }}>{o.items}</p>
        {o.awb && <p className="note">Tracking number: {o.awb}</p>}
        <div className="row"><a className="btn sm" href={o.status === 'pending_payment' ? `/pay/${o.token}` : `/order/${o.token}`}>{o.status === 'pending_payment' ? 'Pay now' : 'View order'}</a>{o.reorder.length > 0 && <ReorderButton items={o.reorder} />}</div></div>)}</div>}
  </div>);
}
