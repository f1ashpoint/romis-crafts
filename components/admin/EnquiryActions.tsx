'use client';
import { useState } from 'react';
export default function EnquiryActions({ id, status, notes }: { id: number; status: string; notes: string }) {
  const [n, setN] = useState(notes); const [err, setErr] = useState('');
  async function call(method: string, body?: object) { const r = await fetch(`/api/admin/enquiries/${id}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); if (r.ok) window.location.reload(); else setErr((await r.json()).error || 'Failed'); }
  return (<div className="row"><input aria-label="Private notes" placeholder="Private notes" value={n} onChange={(e) => setN(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
    <button className="btn sm alt" onClick={() => call('PATCH', { notes: n })}>Save note</button>
    {status !== 'in_progress' && <button className="btn sm alt" onClick={() => call('PATCH', { status: 'in_progress' })}>In progress</button>}
    {status !== 'done' && <button className="btn sm" onClick={() => call('PATCH', { status: 'done' })}>Mark done</button>}
    <button className="btn sm danger" onClick={() => { if (confirm('Delete this enquiry?')) call('DELETE'); }}>Delete</button>{err && <small role="alert">{err}</small>}</div>);
}
