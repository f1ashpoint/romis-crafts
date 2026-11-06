import { getInvoiceView, renderInvoicePdf } from '@/lib/invoice';
import { logError } from '@/lib/log';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const v = await getInvoiceView((await params).token);
    if (!v) return new Response('Invoice not found. It is issued once payment is confirmed.', { status: 404 });
    const pdf = await renderInvoicePdf(v);
    return new Response(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="invoice-${v.invoice.number.replace(/\//g, '-')}.pdf"`, 'Cache-Control': 'private, no-store' } });
  } catch (e) { logError('invoice pdf failed', e); return new Response('Could not generate the invoice right now.', { status: 500 }); }
}
