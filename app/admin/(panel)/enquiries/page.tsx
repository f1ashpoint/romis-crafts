import { getDb } from '../../../../lib/db';
import EnquiryActions from '../../../../components/admin/EnquiryActions';
export const dynamic = 'force-dynamic';
export default async function Enquiries() {
  const rows = await (await getDb()).all<any>("SELECT * FROM enquiries ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, id DESC LIMIT 300");
  return (<div className="stack"><h1>Custom enquiries</h1><p className="note">Requests sent from the Custom orders page on your shop. Reply by phone, WhatsApp or email, then update the status.</p>
    {rows.map((e) => <article className="box stack" key={e.id}><div className="row" style={{ justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>{e.name} <span className={`tag ${e.status === 'new' ? 'warn' : e.status === 'done' ? 'ok' : ''}`}>{e.status.replace('_', ' ')}</span></h3><small>{e.created_at} UTC</small></div>
      <p style={{ margin: 0 }}>{e.message}</p>
      <p className="note" style={{ margin: 0 }}>{[e.occasion && `Occasion: ${e.occasion}`, e.budget && `Budget: ${e.budget}`, e.needed_by && `Needed by: ${e.needed_by}`].filter(Boolean).join(' | ')}</p>
      <p style={{ margin: 0 }}>{e.phone && <a href={`tel:+91${e.phone}`}>{e.phone}</a>}{e.phone && e.email && ' | '}{e.email && <a href={`mailto:${e.email}`}>{e.email}</a>}{e.phone && <> | <a href={`https://wa.me/91${e.phone}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></>}</p>
      <EnquiryActions id={e.id} status={e.status} notes={e.notes} /></article>)}
    {!rows.length && <p>No enquiries yet.</p>}</div>);
}
