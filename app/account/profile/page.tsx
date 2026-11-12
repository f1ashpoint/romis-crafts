import { redirect } from 'next/navigation';
import AccountNav from '@/components/AccountNav';
import ProfileForm from '@/components/ProfileForm';
import { getCustomer } from '@/lib/customer';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your profile', robots: { index: false } };
export default async function Profile() { const c = await getCustomer(); if (!c) redirect('/account/login?next=/account/profile'); return (<div className="section"><AccountNav here="/account/profile" name={c.name} /><ProfileForm name={c.name} phone={c.phone} email={c.email} /></div>); }
