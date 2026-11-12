'use client';
import { useState } from 'react';
import { INDIAN_STATES } from '@/lib/states';
export default function AddressManager({ initial }: { initial: any[] }) {
  const [f, setF] = useState({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: 'Tamil Nadu', pincode: '', isDefault: false }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function add(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr(''); const r = await fetch('/api/account/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); const d = await r.json().catch(() => ({})); if (r.ok) window.location.reload(); else { setErr((d.error || 'Failed') + ' ' + Object.values(d.fields || {}).join(' ')); setBusy(false); } }
  async function del(id: number) { if (!confirm('Delete this address?')) return; await fetch('/api/account/addresses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); window.location.reload(); }
  const I = (k: keyof typeof f, label: string, full = false, req = true) => <label className={`field${full ? ' full' : ''}`}>{label}<input value={String(f[k])} onChange={set(k)} required={req} /></label>;
  return (<div className="stack">{initial.map((a) => <div className="box" key={a.id}><b>{a.label}{a.is_default ? ' (default)' : ''}</b><p style={{ margin: '.3rem 0' }}>{a.name}, {a.phone}<br />{a.line1}{a.line2 ? ', ' + a.line2 : ''}, {a.city}, {a.state} {a.pincode}</p><button className="btn sm alt" onClick={() => del(a.id)}>Delete</button></div>)}
    <form className="box stack" onSubmit={add}><h2 style={{ fontSize: '1.2rem', margin: 0 }}>Add an address</h2>{err && <div className="err" role="alert">{err}</div>}
      <div className="form">{I('label', 'Label (Home, Work)')}{I('name', 'Full name')}{I('phone', 'Mobile number')}{I('line1', 'Address', true)}{I('line2', 'Apartment, landmark (optional)', true, false)}{I('city', 'City')}
        <label className="field">State<select value={f.state} onChange={set('state')}>{INDIAN_STATES.map((s) => <option key={s.code}>{s.name}</option>)}</select></label>{I('pincode', 'PIN code')}</div>
      <label className="chk field" style={{ flexDirection: 'row' }}><input type="checkbox" checked={f.isDefault} onChange={(e) => setF({ ...f, isDefault: e.target.checked })} /><span>Use as my default address</span></label>
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button></form></div>);
}
