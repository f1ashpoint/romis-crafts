import { SCHEMA, CATEGORIES } from './schema';

/** Minimal async query surface shared by the production (pg) and test/dev (PGlite) drivers. Use `?` placeholders. */
export interface Queryable {
  all<T = Record<string, any>>(sql: string, ...params: unknown[]): Promise<T[]>;
  get<T = Record<string, any>>(sql: string, ...params: unknown[]): Promise<T | undefined>;
  /** Runs a write and returns the number of rows changed. */
  run(sql: string, ...params: unknown[]): Promise<number>;
  /** Runs an INSERT (RETURNING id is appended) and returns the new id. */
  insert(sql: string, ...params: unknown[]): Promise<number>;
}
export interface Db extends Queryable {
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** UTC timestamp text, the same shape SQLite's datetime('now') produced. */
export const NOW_SQL = "to_char(timezone('utc', now()), 'YYYY-MM-DD HH24:MI:SS')";

const toPg = (sql: string) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };
const norm = (v: unknown) => (typeof v === 'bigint' ? Number(v) : v);
const normRow = <T>(r: T): T => { if (r && typeof r === 'object') for (const k of Object.keys(r)) (r as any)[k] = norm((r as any)[k]); return r; };

type Exec = (sql: string, params: unknown[]) => Promise<{ rows: any[]; changes: number }>;
function wrap(exec: Exec): Queryable {
  return {
    async all(sql, ...p) { return (await exec(toPg(sql), p)).rows.map(normRow) as any; },
    async get(sql, ...p) { const r = (await exec(toPg(sql), p)).rows[0]; return r ? (normRow(r) as any) : undefined; },
    async run(sql, ...p) { return (await exec(toPg(sql), p)).changes; },
    async insert(sql, ...p) { const r = (await exec(toPg(sql) + ' RETURNING id', p)).rows[0]; return Number(r.id); },
  };
}

/** Makes the strict certificate check explicit, so the pg driver stops warning about changing sslmode semantics. */
export function normaliseSsl(url: string): string {
  return url.replace(/([?&]sslmode=)(prefer|require|verify-ca)(?=&|$)/, '$1verify-full');
}

async function openPg(url: string): Promise<Db> {
  const { Pool, types } = await import('pg');
  types.setTypeParser(20, (v: string) => Number(v));
  const pool = new Pool({ connectionString: normaliseSsl(url), max: Number(process.env.PG_POOL_MAX || 5), idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 });
  pool.on('error', () => { /* idle client errors are retried on next checkout */ });
  const base = wrap(async (sql, params) => { const r = await pool.query(sql, params as any[]); return { rows: r.rows, changes: r.rowCount ?? 0 }; });
  return {
    ...base,
    async tx(fn) {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        const out = await fn(wrap(async (sql, params) => { const r = await c.query(sql, params as any[]); return { rows: r.rows, changes: r.rowCount ?? 0 }; }));
        await c.query('COMMIT');
        return out;
      } catch (e) { try { await c.query('ROLLBACK'); } catch { /* connection already gone */ } throw e; }
      finally { c.release(); }
    },
    close: () => pool.end(),
  };
}

async function openPglite(dir?: string): Promise<Db> {
  const { PGlite } = await import('@electric-sql/pglite');
  const pg = dir ? new PGlite(dir) : new PGlite();
  await pg.waitReady;
  const mk = (h: { query: (s: string, p?: any[]) => Promise<any> }) => wrap(async (sql, params) => { const r = await h.query(sql, params); return { rows: r.rows, changes: r.affectedRows ?? 0 }; });
  return {
    ...mk(pg as any),
    tx: (fn) => pg.transaction((t) => fn(mk(t as any))),
    close: () => pg.close(),
  };
}

async function bootstrap(db: Db, usesPg: boolean) {
  await db.tx(async (q) => {
    if (usesPg) await q.run('SELECT pg_advisory_xact_lock(727001)'); // serialise concurrent cold starts
    for (const stmt of SCHEMA.split(';\n').map((s) => s.trim()).filter(Boolean)) await q.run(stmt);
    let i = 0;
    for (const c of CATEGORIES) await q.run('INSERT INTO categories (slug, name, blurb, sort) VALUES (?,?,?,?) ON CONFLICT (slug) DO NOTHING', c.slug, c.name, c.blurb, i++);
  });
}

async function open(): Promise<Db> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  if (url) { const db = await openPg(url); await bootstrap(db, true); return db; }
  if (process.env.NODE_ENV === 'production' && !process.env.VITEST)
    throw new Error('DATABASE_URL is not set. Add a Postgres database (Vercel Marketplace: Neon) to this project.');
  // Local development and tests: an embedded Postgres. In memory for tests, on disk (./data/pglite) for `npm run dev`.
  const dir = process.env.VITEST || process.env.PGLITE_MEMORY ? undefined : process.env.PGLITE_DIR || './data/pglite';
  const db = await openPglite(dir);
  await bootstrap(db, false);
  return db;
}

const g = globalThis as unknown as { __csc_db?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!g.__csc_db) g.__csc_db = open().catch((e) => { g.__csc_db = undefined; throw e; });
  return g.__csc_db;
}

/** Test helper: empties every table (keeping one embedded database alive, since starting PGlite is slow) and re-seeds the categories. */
export async function resetDbForTests(): Promise<Db> {
  const db = await getDb();
  await db.tx(async (q) => {
    const tables = await q.all<{ tablename: string }>("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    if (tables.length) await q.run(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`);
    let i = 0;
    for (const c of CATEGORIES) await q.run('INSERT INTO categories (slug, name, blurb, sort) VALUES (?,?,?,?) ON CONFLICT (slug) DO NOTHING', c.slug, c.name, c.blurb, i++);
  });
  return db;
}
