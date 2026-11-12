import { notFound } from 'next/navigation';
import PayButtons from '@/components/PayButtons';
import UpiPay from '@/components/UpiPay';
import { getOrderByToken, releaseExpiredOrders } from '@/lib/orders';
import { rupees } from '@/lib/money';
import { getPaymentProvider } from '@/lib/providers/payment';
import { getStore } from '@/lib/config';
import { upiLink, appLinks, upiQrSvg } from '@/lib/upi';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payment', robots: { index: false } };
export default async function Pay({ params }: { params: Promise<{ token: string }> }) {
  const prov = getPaymentProvider(); // throws in production unless a real provider (or ALLOW_STUB_PAYMENTS=1) is configured
  await releaseExpiredOrders();
  const d = await getOrderByToken((await params).token); if (!d) notFound();
  const o = d.order;
  if (prov.id === 'upi') {
    const st = await getStore();
    const done = (m: string) => (<div className="section" style={{ maxWidth: 560 }}><h1>Payment</h1><div className="box stack"><p>{m}</p><a className="btn" href={`/order/${o.token}`}>View order</a></div></div>);
    if (o.status === 'payment_review') return done('Thank you. We have your payment details and are checking them. We will confirm your order shortly.');
    if (!['pending_payment', 'expired'].includes(o.status)) return done(`This order is ${o.status.replace(/_/g, ' ')}.`);
    if (!st.upiId) return done('UPI payment is not set up yet. Please contact the shop.');
    const i = { vpa: st.upiId, payee: st.name, amountPaise: Number(o.total_paise), orderNumber: o.number };
    return (<div className="section" style={{ maxWidth: 620 }}><h1>Pay with UPI</h1>
      {o.status === 'expired' && <div className="err">The time to hold this order has passed. If you pay now, please send the reference number below. We will confirm if the items are still available, or refund you.</div>}
      <UpiPay token={o.token} orderNumber={o.number} amount={rupees(o.total_paise)} vpa={st.upiId} payee={st.name} link={upiLink(i)} apps={appLinks(i)} qr={await upiQrSvg(i)} /></div>);
  }
  if (prov.id !== 'stub') notFound();
  return (<div className="section" style={{ maxWidth: 560 }}><h1>Sandbox payment</h1>
    <div className="err">This is a test payment page. No money moves and no card is charged. Replace the stub provider with a real gateway before launch.</div>
    {o.status !== 'pending_payment' ? <div className="box"><p>This order is {o.status.replace(/_/g, ' ')}.</p><a className="btn" href={`/order/${o.token}`}>View order</a></div>
      : <div className="box stack"><p>Order {o.number}</p><p className="price" style={{ fontSize: '1.6rem' }}>{rupees(o.total_paise)} INR</p><PayButtons token={o.token} /></div>}
  </div>);
}
