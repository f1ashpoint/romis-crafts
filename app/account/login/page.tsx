import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { getCustomer } from '@/lib/customer';
export const metadata = { title: 'Sign in', robots: { index: false } };
const safe = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/account');
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safe((await searchParams).next); if (await getCustomer()) redirect(next);
  return (<div className="section" style={{ maxWidth: 460 }}><h1>Sign in</h1><p className="note">See your orders, keep a wishlist and check out faster.</p><AuthForm mode="login" next={next} /></div>);
}
