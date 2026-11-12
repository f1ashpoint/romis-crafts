'use client';
import { useState } from 'react';
import { useAccount } from './AccountProvider';
export default function WishButton({ productId, name, label }: { productId: number; name: string; label?: boolean }) {
  const { wishlist, toggle } = useAccount(); const on = wishlist.includes(productId); const [pop, setPop] = useState(false);
  return (<button type="button" className={`heart${on ? ' on' : ''}${pop ? ' pop' : ''}${label ? ' lbl' : ''}`} aria-pressed={on} aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
    onClick={async (e) => { e.preventDefault(); e.stopPropagation(); setPop(true); setTimeout(() => setPop(false), 450); await toggle(productId); }}>
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6 5c2 0 3.4 1 4 2.2h4C14.6 6 16 5 18 5c3.3 0 5.1 3.4 3.6 6.8C19.5 16.400 12 21 12 21z" /></svg>{label && <span>{on ? 'Saved' : 'Save to wishlist'}</span>}</button>);
}
