import { redirect } from 'next/navigation';
import AccountNav from '@/components/AccountNav';
import AddressManager from '@/components/AddressManager';
import { getCustomer, listAddresses } from '@/lib/customer';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your addresses', robots: { index: false } };
export default async function Addresses() { const c = await getCustomer(); if (!c) redirect('/account/login?next=/account/addresses'); return (<div className="section"><AccountNav here="/account/addresses" name={c.name} /><AddressManager initial={await listAddresses(c.id)} /></div>); }
