'use client';
import { useState } from 'react';
type Cat = { id: number; slug: string; name: string; blurb: string; sort: number; products: number };
export default function CategoryManager({ initial }: { initial: Cat[] }) {
  const [rows, setRows] = useState(initial); const [err, setErr] = useState(''); const [msg, setMsg] = useState(''); const [nw, setNw] = useState({ name: '', blurb: '' });
  async function call(url: string, method: string, body?: unknown) {
    setErr(''); setMsg('');
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr((d.error || 'Failed') + ' ' + Object.values(d.fields || {}).join(' ')); return false; } return true;
  }
  const done = () => window.location.reload();
  return (<div className="stack"><h1>Categories</h1>
    <p className="note">These appear in the shop menu and on the home page, in this order (smaller numbers first). A category can only be deleted when it has no products.</p>
    {err && <div className="err" role="alert">{err}</div>}{msg && <div className="okmsg" role="status">{msg}</div>}
    <div className="scroll"><table className="t"><thead><tr><th>Name</th><th>Short description</th><th>Order</th><th>Products</th><th></th></tr></thead><tbody>
      {rows.map((c, i) => <tr key={c.id}>
        <td><input aria-label="Name" value={c.name} onChange={(e) => setRows(rows.map((r, j) => j === i ? { ...r, name: e.target.value } : r))} /></td>
        <td><input aria-label="Description" style={{ width: '100%', minWidth: 220 }} value={c.blurb} onChange={(e) => setRows(rows.map((r, j) => j === i ? { ...r, blurb: e.target.value } : r))} /></td>
        <td><input aria-label="Order" type="number" min={0} style={{ width: 70 }} value={c.sort} onChange={(e) => setRows(rows.map((r, j) => j === i ? { ...r, sort: Number(e.target.value) } : r))} /></td>
        <td>{c.products}</td>
        <td className="row"><button className="btn sm" onClick={async () => { if (await call(`/api/admin/categories/${c.id}`, 'PATCH', { name: c.name, blurb: c.blurb, sort: c.sort })) done(); }}>Save</button>
          <button className="btn sm danger" onClick={async () => { if (confirm(`Delete "${c.name}"?`) && await call(`/api/admin/categories/${c.id}`, 'DELETE')) done(); }}>Delete</button></td></tr>)}</tbody></table></div>
    <form className="box stack" onSubmit={async (e) => { e.preventDefault(); if (await call('/api/admin/categories', 'POST', nw)) done(); }}><h2>Add a category</h2>
      <div className="form"><label className="field">Name<input required value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} /></label><label className="field">Short description<input value={nw.blurb} onChange={(e) => setNw({ ...nw, blurb: e.target.value })} /></label></div>
      <button className="btn">Add category</button><p className="note">New categories use 18% GST until you set a rate under Shipping and GST.</p></form></div>);
}
