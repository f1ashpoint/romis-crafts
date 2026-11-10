import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import './globals.css';
import CartProvider from '@/components/CartProvider';
import CartLink from '@/components/CartLink';
import PrefsToggle from '@/components/PrefsToggle';
import { listCategories } from '@/lib/catalog';
import { getStore, getSettings } from '@/lib/config';
import { rupees } from '@/lib/money';
import { NOPERS_COOKIE } from '@/lib/behavior';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { default: 'Simply Romi | Handmade in Chennai', template: '%s | Simply Romi' }, description: 'Handmade gifts, bouquets and accessories from a small Chennai studio. A little luxury in every detail. Delivered across India.',
  ...(process.env.SITE_URL ? { metadataBase: new URL(process.env.SITE_URL) } : {}),
  openGraph: { siteName: 'Simply Romi', images: ['/logo.png'], type: 'website', locale: 'en_IN' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#36422b' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cats = await listCategories(); const s = await getSettings(); const st = await getStore();
  const persOn = !(await cookies()).get(NOPERS_COOKIE);
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Hanken+Grotesk:wght@400;600;700&display=swap" />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <CartProvider>
          <div className="topbar">Free shipping across India on orders of {rupees(s.freeShippingThresholdPaise)} and above. Prices include GST.</div>
          <header className="site"><div className="wrap bar">
            <Link href="/" className="logo"><img src="/mark.svg" alt="" width="46" height="46" />Simply Romi</Link>
            <nav className="main" aria-label="Categories">{cats.map((c) => <Link key={c.slug} href={`/category/${c.slug}`}>{c.name}</Link>)}<Link href="/custom">Custom orders</Link></nav>
            <CartLink />
          </div></header>
          <main id="main" className="wrap">{children}</main>
          <footer className="site"><div className="wrap">
            <div className="cols">
              <div><h3 style={{ color: '#fff' }}>{st.name}</h3><p>{st.address}</p>{st.gstin && <p>GSTIN: {st.gstin}</p>}<p>Country of origin: India. Sold and shipped within India only.</p></div>
              <div><h3 style={{ color: '#fff' }}>Help</h3><p><Link href="/policies">Shipping, returns, privacy</Link><br /><Link href="/loyalty">Studio Circle rewards</Link><br /><Link href="/custom">Custom orders</Link><br /><a href={st.instagram} target="_blank" rel="noopener noreferrer">Instagram @simplyromi.studio</a><br />{st.email}{st.phone ? <><br />{st.phone}</> : null}</p></div>
              <div><h3 style={{ color: '#fff' }}>Grievance Officer</h3><p>{st.grievanceName || 'Owner'}<br />{st.grievanceEmail}<br />We acknowledge complaints within 48 hours and resolve them within one month.</p></div>
            </div>
            <PrefsToggle initialOn={persOn} />
          </div></footer>
        {st.whatsapp && <a className="wa" href={`https://wa.me/${st.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">Chat on WhatsApp</a>}
        </CartProvider>
      </body>
    </html>
  );
}
