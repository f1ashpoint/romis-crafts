'use client';
import { useState } from 'react';
export default function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [f, setF] = useState({ name, phone, currentPassword: '', newPassword: '' }); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  async function save(e: React.FormEvent) { e.preventDefault(); setMsg(''); setErr(''); const body: any = { name: f.name, phone: f.phone }; if (f.newPassword) { body.currentPassword = f.currentPassword; body.newPassword = f.newPassword; }
    const r = await fetch('/api/account/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); if (r.ok) { setMsg('Saved.'); setF({ ...f, currentPassword: '', newPassword: '' }); } else setErr((d.error || 'Failed') + ' ' + Object.values(d.fields || {}).join(' ')); }
  async function del() { if (!confirm('Delete your account? Your wishlist and saved addresses are removed. Past orders stay on record for invoicing.')) return; const r = await fetch('/api/account/profile', { method: 'DELETE' }); if (r.ok) window.location.href = '/'; }
  return (<div className="stack"><form className="box stack" onSubmit={save}>{err && <div className="err" role="alert">{err}</div>}{msg && <div className="okmsg" role="status">{msg}</div>}
    <p className="note" style={{ margin: 0 }}>Signed in as {email}</p>
    <label className="field">Name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label><label className="field">Mobile number<input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Change password</h2><label className="field">Current password<input type="password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} autoComplete="current-password" /></label><label className="field">New password (8+ characters)<input type="password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} autoComplete="new-password" /></label>
    <button className="btn">Save changes</button></form>
    <div className="box"><button className="btn sm alt" onClick={del}>Delete my account</button></div></div>);
}
