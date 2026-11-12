'use client';
import { useEffect, useRef, useState } from 'react';

interface Props { token: string; orderNumber: string; amount: string; vpa: string; payee: string; link: string; apps: { name: string; href: string }[]; qr: string }
export default function UpiPay({ token, orderNumber, amount, vpa, payee, link, apps, qr }: Props) {
  const [mobile, setMobile] = useState(false); const [opening, setOpening] = useState(false); const [stuck, setStuck] = useState(false);
  const [utr, setUtr] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [copied, setCopied] = useState(false);
  const tried = useRef(false);
  useEffect(() => {
    const m = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.matchMedia?.('(pointer:coarse)').matches && window.innerWidth < 900);
    setMobile(m);
    let key = 'upi_opened_' + token, already = false; try { already = sessionStorage.getItem(key) === '1'; } catch { /* storage unavailable */ }
    if (!m || tried.current || already) return;
    tried.current = true; setOpening(true);
    try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
    const t1 = setTimeout(() => { window.location.href = link; }, 700);
    // If the page is still visible a few seconds later, no UPI app took over: offer the QR code and the manual options.
    const t2 = setTimeout(() => { if (document.visibilityState === 'visible') { setOpening(false); setStuck(true); } }, 3800);
    const vis = () => { if (document.visibilityState === 'hidden') { clearTimeout(t2); setOpening(false); } };
    document.addEventListener('visibilitychange', vis);
    return () => { clearTimeout(t1); clearTimeout(t2); document.removeEventListener('visibilitychange', vis); };
  }, [link, token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/pay/upi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, utr }) }); const d = await r.json().catch(() => ({}));
    if (r.ok) { window.location.href = `/order/${token}`; return; }
    setErr((d.error || 'Something went wrong.') + ' ' + Object.values(d.fields || {}).join(' ')); setBusy(false);
  }
  const copy = async () => { try { await navigator.clipboard.writeText(vpa); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ } };
  const open = () => { setOpening(true); setStuck(false); window.location.href = link; setTimeout(() => { if (document.visibilityState === 'visible') { setOpening(false); setStuck(true); } }, 3500); };

  return (<div className="stack upi">
    <div className="box stack"><div className="row" style={{ justifyContent: 'space-between' }}><div><span className="note">Pay to</span><br /><b>{payee}</b></div><div style={{ textAlign: 'right' }}><span className="note">Amount</span><br /><b className="price" style={{ fontSize: '1.7rem' }}>{amount}</b></div></div>
      <p className="note" style={{ margin: 0 }}>Order {orderNumber}. The amount is filled in for you. Please do not change it.</p></div>

    {opening && <div className="okmsg upi-pulse" role="status">Opening your UPI app…</div>}
    {stuck && <div className="err" role="status"><b>No UPI app opened?</b> You can try again, pick an app below, or scan the QR code with any UPI app.</div>}

    <section className="box stack" aria-labelledby="pay-app"><h2 id="pay-app" style={{ fontSize: '1.2rem', margin: 0 }}>{mobile ? 'Pay with a UPI app on this phone' : 'Pay with a UPI app'}</h2>
      <button type="button" className="btn gold" onClick={open}>Open my UPI app</button>
      <div className="row">{apps.map((a) => <a key={a.name} className="btn sm alt" href={a.href}>{a.name}</a>)}</div></section>

    <section className="box stack" aria-labelledby="pay-qr"><h2 id="pay-qr" style={{ fontSize: '1.2rem', margin: 0 }}>{mobile ? 'Or scan the QR code from another phone' : 'Scan the QR code with any UPI app'}</h2>
      <div className="upi-qr" dangerouslySetInnerHTML={{ __html: qr }} role="img" aria-label={`UPI QR code to pay ${amount}`} />
      <p className="note" style={{ margin: 0 }}>Open Google Pay, PhonePe, Paytm or any UPI app, choose Scan, and point it here. Or pay to this UPI ID: <b>{vpa}</b> <button type="button" className="btn sm alt" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></p></section>

    <form className="box stack" onSubmit={submit} aria-labelledby="pay-done"><h2 id="pay-done" style={{ fontSize: '1.2rem', margin: 0 }}>After you have paid</h2>
      <p className="note" style={{ margin: 0 }}>Enter the 12-digit UPI reference number (also called UTR or transaction ID) shown in your UPI app. We check it against our bank account and confirm your order, usually within a few hours.</p>
      {err && <div className="err" role="alert">{err}</div>}
      <label className="field">UPI reference number (12 digits)<input value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))} inputMode="numeric" autoComplete="off" placeholder="For example 412345678901" required /></label>
      <button className="btn" disabled={busy || utr.length !== 12}>{busy ? 'Sending…' : 'I have paid'}</button></form>
  </div>);
}
