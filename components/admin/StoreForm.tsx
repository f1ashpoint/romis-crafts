'use client';
import { useState } from 'react';
const FIELDS: [string, string, string?][] = [['name', 'Shop name (as on invoices)'], ['tagline', 'Tagline'], ['address', 'Address (shown on invoices and in the footer)'], ['gstin', 'GSTIN (leave blank if not registered)'], ['pan', 'PAN'], ['email', 'Contact email'], ['phone', 'Phone / WhatsApp number'], ['whatsapp', 'WhatsApp number for the chat button (digits, with 91)'], ['instagram', 'Instagram link'], ['grievanceName', 'Grievance officer name'], ['grievanceEmail', 'Grievance officer email']];
export default function StoreForm({ initial }: { initial: Record<string, string> }) {
  const [f, setF] = useState(initial); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  async function save(e: React.FormEvent) { e.preventDefault(); setMsg(''); setErr(''); const r = await fetch('/api/admin/store', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); const d = await r.json(); if (r.ok) setMsg('Saved. The footer, policies and new invoices now use these details.'); else setErr(d.error + ' ' + Object.values(d.fields || {}).join(' ')); }
  return (<form className="stack" onSubmit={save}><h1>Store details</h1><p className="note">These show in the footer, the policies page and on every new GST invoice. Invoices already issued keep the details they were issued with.</p>
    {msg && <div className="okmsg" role="status">{msg}</div>}{err && <div className="err" role="alert">{err}</div>}
    <div className="form">{FIELDS.map(([k, label]) => <label className={`field${k === 'address' ? ' full' : ''}`} key={k}>{label}{k === 'address' ? <textarea value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} /> : <input value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}</label>)}</div>
    <button className="btn">Save details</button></form>);
}
