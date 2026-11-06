import { handle, json } from '@/lib/http';
import { getPaymentProvider } from '@/lib/providers/payment';
import { markPaid, markFailed } from '@/lib/orders';

// Gateways POST here (webhook) or the sandbox pay page posts here. The provider verifies authenticity.
export const POST = handle(async (req) => {
  const provider = getPaymentProvider();
  const out = await provider.verifyCallback(await req.json(), req.headers);
  if (out.status === 'paid') await markPaid(out.orderToken, out.providerRef); else await markFailed(out.orderToken);
  return json({ ok: true, status: out.status });
});
