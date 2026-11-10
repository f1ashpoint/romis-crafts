'use client';
import { useState } from 'react';
export default function AccountForm() {
  const [pw, setPw] = useState({ current: '', next: '' }); const [ad, setAd] = useState({ email: '', password: '' }); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  async function send(method: string, body: object, ok: string) { setMsg(''); setErr(''); const r = await fetch('/api/admin/account', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const d = await r.json(); if (r.ok) { setMsg(ok); if (method === 'PUT') setTimeout(() => window.location.reload(), 800); } else setErr(d.error + ' ' + Object.values(d.fields || {}).join(' ')); }
  return (<div className="stack">{msg && <div className="okmsg" role="status">{msg}</div>}{err && <div className="err" role="alert">{err}</div>}
    <form className="box stack" onSubmit={(e) => { e.preventDefault(); send('POST', { current: pw.current, next: pw.next }, 'Password changed.'); }}><h2>Change my password</h2>
      <div className="form"><label className="field">Current password<input type="password" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label><label className="field">New password (10+ characters)<input type="password" autoComplete="new-password" minLength={10} required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label></div><button className="btn">Change password</button></form>
    <form className="box stack" onSubmit={(e) => { e.preventDefault(); send('PUT', ad, 'Admin added.'); }}><h2>Add another admin</h2>
      <div className="form"><label className="field">Email<input type="email" required value={ad.email} onChange={(e) => setAd({ ...ad, email: e.target.value })} /></label><label className="field">Password (10+ characters)<input type="password" autoComplete="new-password" minLength={10} required value={ad.password} onChange={(e) => setAd({ ...ad, password: e.target.value })} /></label></div><button className="btn">Add admin</button></form></div>);
}
