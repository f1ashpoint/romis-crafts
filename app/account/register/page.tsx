import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { getCustomer } from '@/lib/customer';
export const metadata = { title: 'Create account', robots: { index: false } };
const safe = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/account');
export default async function Register({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safe((await searchParams).next); if (await getCustomer()) redirect(next);
  return (<div className="section" style={{ maxWidth: 460 }}><h1>Create your account</h1><p className="note">Save favourites, track orders and reorder in a tap.</p><AuthForm mode="register" next={next} /></div>);
}
