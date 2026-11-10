'use client';
import { useState } from 'react';
export default function LoyaltyAdjust({ members }: { members: { email: string; name: string; points: number }[] }) {
  const [f, setF] = useState({ email: members[0]?.email ?? '', delta: '', reason: '' }); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  async function go(e: React.FormEvent) { e.preventDefault(); setMsg(''); setErr(''); const r = await fetch('/api/admin/loyalty', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); const d = await r.json(); if (r.ok) { setMsg('Saved.'); setTimeout(() => window.location.reload(), 600); } else setErr(d.error + ' ' + Object.values(d.fields || {}).join(' ')); }
  if (!members.length) return <p>Nobody has joined the rewards programme yet.</p>;
  return (<div className="stack"><div className="scroll"><table className="t"><thead><tr><th>Member</th><th>Email</th><th>Points</th></tr></thead><tbody>{members.map((m) => <tr key={m.email}><td>{m.name}</td><td>{m.email}</td><td>{m.points}</td></tr>)}</tbody></table></div>
    <form className="box stack" onSubmit={go}>{msg && <div className="okmsg">{msg}</div>}{err && <div className="err" role="alert">{err}</div>}
      <div className="form"><label className="field">Member<select value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })}>{members.map((m) => <option key={m.email} value={m.email}>{m.name || m.email} ({m.points})</option>)}</select></label>
        <label className="field">Points to add (use a minus to remove)<input required type="number" value={f.delta} onChange={(e) => setF({ ...f, delta: e.target.value })} /></label>
        <label className="field full">Reason<input required value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></label></div><button className="btn">Adjust points</button></form></div>);
}
