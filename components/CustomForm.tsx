'use client';
import { useState } from 'react';
const OCCASIONS = ['Birthday', 'Wedding / bridal', 'Anniversary', 'Housewarming', 'Corporate gifting', 'Return gifts', 'Just because', 'Other'];
export default function CustomForm() {
  const [f, setF] = useState({ name: '', email: '', phone: '', occasion: '', budget: '', neededBy: '', message: '', website: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [fields, setFields] = useState<Record<string, string>>({}); const [done, setDone] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(''); setFields({});
    try {
      const r = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); const d = await r.json().catch(() => ({}));
      if (r.ok) setDone(true); else { setErr(d.error || 'Something went wrong. Please try again.'); setFields(d.fields || {}); }
    } catch { setErr('We could not reach the server. Please check your connection and try again.'); } finally { setBusy(false); }
  }
  if (done) return <div className="okmsg" role="status"><b>Thank you!</b> We have your request and will get back to you soon on the contact details you gave.</div>;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const E = ({ k }: { k: string }) => (fields[k] ? <small role="alert">{fields[k]}</small> : null);
  return (<form className="stack" onSubmit={send} noValidate>
    {err && <div className="err" role="alert">{err}</div>}
    <div className="form">
      <label className="field">Your name<input value={f.name} onChange={set('name')} autoComplete="name" required /><E k="name" /></label>
      <label className="field">Phone / WhatsApp<input value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" /><E k="phone" /></label>
      <label className="field">Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" /><E k="email" /></label>
      <label className="field">Occasion<select value={f.occasion} onChange={set('occasion')}><option value="">Choose one</option>{OCCASIONS.map((o) => <option key={o}>{o}</option>)}</select></label>
      <label className="field">Budget (optional)<input value={f.budget} onChange={set('budget')} placeholder="For example ₹1,500 to ₹2,500" /></label>
      <label className="field">Needed by (optional)<input value={f.neededBy} onChange={set('neededBy')} placeholder="A date or event" /></label>
      <label className="field full">What do you have in mind?<textarea value={f.message} onChange={set('message')} required placeholder="Colours, flowers, names or initials, quantity, anything that helps us picture it." /><E k="message" /></label>
      <label className="hide" aria-hidden="true">Leave this empty<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
    </div>
    <p className="note">Give a phone number or an email so we can reply. We use your details only to answer this request.</p>
    <button className="btn gold" disabled={busy}>{busy ? 'Sending...' : 'Send my request'}</button></form>);
}
