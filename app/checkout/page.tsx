import CheckoutForm from '@/components/CheckoutForm';
import { getSettings } from '@/lib/config';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Checkout' };
export default async function Checkout() { return <div className="section" style={{ paddingTop: 24 }}><h1>Checkout</h1><CheckoutForm originState={(await getSettings()).originState} /></div>; }
