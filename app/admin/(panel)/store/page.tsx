import StoreForm from '../../../../components/admin/StoreForm';
import { getStore } from '../../../../lib/config';
export const dynamic = 'force-dynamic';
export default async function Store() { return <StoreForm initial={await getStore()} />; }
