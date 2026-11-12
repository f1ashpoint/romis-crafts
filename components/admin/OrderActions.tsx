'use client';
import { useState } from 'react';
export default function OrderActions({ id, status, awb, notes }: { id: number; status: string; awb: string; notes: string }) {
  const [a, setA] = useState(awb); const [n, setN] = useState(notes); const [err, setErr] = useState('');
  async function patch(body: object) { const r = await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (r.ok) window.location.reload(); else setErr((await r.json()).error || 'Failed'); }
  const note = <div className="row"><input value={n} onChange={(e) => setN(e.target.value)} placeholder="Private note" aria-label="Private note" style={{ width: 180 }} /><button className="btn sm alt" onClick={() => patch({ notes: n })}>Save note</button></div>;
  async function verify(action: 'confirm' | 'reject') { if (action === 'reject' && !confirm('Reject this payment? The items go back into stock.')) return; const r = await fetch(`/api/admin/orders/${id}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }); if (r.ok) window.location.reload(); else setErr((await r.json()).error || 'Failed'); }
  if (status === 'payment_review') return (<div className="stack"><small>Check your bank or UPI app for this amount and UTR, then decide.</small><div className="row"><button className="btn sm" onClick={() => verify('confirm')}>Money received</button><button className="btn sm alt" onClick={() => verify('reject')}>Reject</button></div>{err && <small role="alert">{err}</small>}</div>);
  if (['pending_payment', 'expired', 'payment_failed'].includes(status)) return <small>Not paid</small>;
  if (['needs_refund', 'cancelled', 'refunded'].includes(status)) return (<div className="stack">{status !== 'refunded' && <><small>Refund the customer in your payment dashboard, then mark it here.</small><button className="btn sm" onClick={() => patch({ status: 'refunded' })}>Mark refunded</button></>}{note}{err && <small role="alert">{err}</small>}</div>);
  return (<div className="stack"><div className="row"><input value={a} onChange={(e) => setA(e.target.value)} placeholder="Tracking no." aria-label="Tracking number" style={{ width: 130 }} />
    <button className="btn sm alt" onClick={() => patch({ awb: a, status: 'shipped' })}>Mark shipped</button><button className="btn sm alt" onClick={() => patch({ status: 'delivered' })}>Delivered</button></div>{note}{err && <small role="alert">{err}</small>}</div>);
}
