import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, verifySession } from '@/lib/auth';
import LogoutButton from '../../../components/admin/LogoutButton';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
const NAV: [string, string][] = [['/admin/dashboard', 'Dashboard'], ['/admin/products', 'Products and stock'], ['/admin/categories', 'Categories'], ['/admin/orders', 'Orders'], ['/admin/customers', 'Customers and rewards'], ['/admin/enquiries', 'Custom enquiries'], ['/admin/store', 'Store details'], ['/admin/settings', 'Shipping and GST'], ['/admin/account', 'Account and admins']];
export default async function Panel({ children }: { children: React.ReactNode }) {
  if (!(await verifySession((await cookies()).get(ADMIN_COOKIE)?.value))) redirect('/admin/login');
  return (<div className="admin"><nav aria-label="Admin">{NAV.map(([h, t]) => <Link key={h} href={h}>{t}</Link>)}<a href="/" target="_blank" rel="noopener">View shop</a><LogoutButton /></nav><div>{children}</div></div>);
}
