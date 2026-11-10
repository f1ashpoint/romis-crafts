import { handle, json } from '@/lib/http';
import { createEnquiry, enquiryRateLimit } from '@/lib/enquiries';

export const POST = handle(async (req) => {
  enquiryRateLimit(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local');
  await createEnquiry(await req.json());
  return json({ ok: true }, 201);
});
