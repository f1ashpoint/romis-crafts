'use client';
import { useState } from 'react';
import { useCart } from './CartProvider';
export default function ReorderButton({ items }: { items: { variantId: number; qty: number; engraving?: string }[] }) {
  const cart = useCart(); const [done, setDone] = useState(false);
  return <button type="button" className="btn sm alt" onClick={() => { for (const i of items) cart.add({ variantId: i.variantId, qty: i.qty, engraving: i.engraving || undefined }); setDone(true); setTimeout(() => (window.location.href = '/cart'), 500); }}>{done ? 'Added' : 'Order again'}</button>;
}
