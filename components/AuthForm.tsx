'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function AuthForm({ mode, next }: { mode: 'login' | 'register'; next: string }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' }); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [fields, setFields] = useState<Record<string, string>>({});
  const reg = mode === 'register';
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(''); setFields({});
    const r = await fetch(`/api/account/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reg ? f : { email: f.email, password: f.password }) }); const d = await r.json().catch(() => ({}));
    if (r.ok) { window.location.href = next; return; } setErr(d.error || 'Something went wrong.'); setFields(d.fields || {}); setBusy(false);
  }
  const I = (k: keyof typeof f, label: string, type = 'text', auto = '', req = true) => <label className="field">{label}<input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} autoComplete={auto} required={req} aria-invalid={!!fields[k]} />{fields[k] && <small role="alert">{fields[k]}</small>}</label>;
  return (<form className="box stack" onSubmit={submit}>{err && <div className="err" role="alert">{err}</div>}
    {reg && I('name', 'Full name', 'text', 'name')}{I('email', 'Email', 'email', 'email')}{reg && I('phone', 'Mobile number (optional)', 'tel', 'tel', false)}{I('password', reg ? 'Password (8+ characters)' : 'Password', 'password', reg ? 'new-password' : 'current-password')}
    <button className="btn" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Sign in'}</button>
    <p className="note" style={{ margin: 0 }}>{reg ? <>Already have an account? <Link href={`/account/login?next=${encodeURIComponent(next)}`}>Sign in</Link></> : <>New here? <Link href={`/account/register?next=${encodeURIComponent(next)}`}>Create an account</Link>. Forgot your password? Message us on WhatsApp or Instagram and we will set a temporary one.</>}</p></form>);
}
