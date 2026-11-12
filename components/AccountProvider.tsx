'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
export interface Me { id: number; name: string; email: string; phone: string }
interface Ctx { user: Me | null; ready: boolean; wishlist: number[]; addresses: any[]; toggle: (productId: number) => Promise<boolean>; refresh: () => Promise<void> }
const C = createContext<Ctx>({ user: null, ready: false, wishlist: [], addresses: [], toggle: async () => false, refresh: async () => {} });
export const useAccount = () => useContext(C);
export default function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null); const [ready, setReady] = useState(false); const [wishlist, setWl] = useState<number[]>([]); const [addresses, setAddr] = useState<any[]>([]);
  const refresh = useCallback(async () => { try { const d = await (await fetch('/api/account/me', { cache: 'no-store' })).json(); setUser(d.user); setWl(d.wishlist ?? []); setAddr(d.addresses ?? []); } catch { /* offline */ } setReady(true); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  /** Returns true when the item is now saved. Sends signed-out visitors to sign in. */
  const toggle = useCallback(async (id: number) => {
    if (!user) { window.location.href = '/account/login?next=' + encodeURIComponent(location.pathname); return false; }
    const on = !wishlist.includes(id); setWl((w) => (on ? [...w, id] : w.filter((x) => x !== id)));
    const r = await fetch('/api/account/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: id, on }) });
    if (!r.ok) { setWl((w) => (on ? w.filter((x) => x !== id) : [...w, id])); return !on; } return on;
  }, [user, wishlist]);
  const v = useMemo(() => ({ user, ready, wishlist, addresses, toggle, refresh }), [user, ready, wishlist, addresses, toggle, refresh]);
  return <C.Provider value={v}>{children}</C.Provider>;
}
