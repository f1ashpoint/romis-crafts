'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
/** Adds .in to every .reveal element as it scrolls into view. Without JS, or with reduced motion, content is simply visible. */
export default function RevealOnScroll() {
  const path = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.in)'));
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((e) => io.observe(e)); return () => io.disconnect();
  }, [path]);
  return null;
}
