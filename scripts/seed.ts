/* Creates/updates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD and optionally seeds demo products (SEED_DEMO=1). Needs DATABASE_URL. */
import { getDb } from '../lib/db';
import { hashPassword } from '../lib/auth';
import { ensureDemoCatalogue } from '../lib/seed';

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const pw = process.env.ADMIN_PASSWORD || '';
  if (!email.includes('@')) throw new Error('Set ADMIN_EMAIL to a valid email address.');
  if (pw.length < 12) throw new Error('Set ADMIN_PASSWORD to at least 12 characters.');
  const db = await getDb();
  await db.tx(async (q) => {
    await q.run('DELETE FROM admins WHERE email != ?', email);
    await q.run('INSERT INTO admins (email, password_hash) VALUES (?,?) ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash', email, hashPassword(pw));
  });
  console.log(`Admin account ready for ${email}.`);
  await ensureDemoCatalogue();
  await db.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
