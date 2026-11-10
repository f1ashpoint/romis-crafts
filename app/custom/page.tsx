import CustomForm from '@/components/CustomForm';
import { getStore } from '@/lib/config';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Custom orders', description: 'Tell us about the bouquet, gift or keepsake you would like made by hand.' };
export default async function Custom() {
  const st = await getStore();
  return (<div className="section" style={{ maxWidth: 780 }}>
    <p className="eyebrow">Made for you</p><h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>Custom orders</h1>
    <p className="lead">Bouquets in your colours, personalised gifts, wedding favours and hampers. Tell us what you have in mind and we will reply with ideas and a price.</p>
    <div className="box"><CustomForm /></div>
    <p className="note" style={{ marginTop: 16 }}>Prefer to chat? Message us on <a href={st.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>{st.whatsapp ? <> or <a href={`https://wa.me/${st.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></> : null}.</p></div>);
}
