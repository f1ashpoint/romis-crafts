import AccountForm from '../../../../components/admin/AccountForm';
import { getDb } from '../../../../lib/db';
export const dynamic = 'force-dynamic';
export default async function Account() {
  const admins = await (await getDb()).all<{ email: string; created_at: string }>('SELECT email, created_at FROM admins ORDER BY id');
  return (<div className="stack"><h1>Account and admins</h1><AccountForm /><h2>People who can sign in</h2><ul>{admins.map((a) => <li key={a.email}>{a.email} <small>(added {a.created_at.slice(0, 10)})</small></li>)}</ul></div>);
}
