import { z } from 'zod';
import { getDb } from './db';
import { HttpError } from './http';

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please tell us your name').max(100),
  email: z.string().trim().toLowerCase().max(160).refine((v) => v === '' || /^\S+@\S+\.\S+$/.test(v), 'Enter a valid email address').default(''),
  phone: z.string().trim().transform((s) => s.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '')).refine((v) => v === '' || /^[6-9][0-9]{9}$/.test(v), 'Enter a valid 10-digit Indian mobile number').default(''),
  occasion: z.string().trim().max(80).default(''),
  budget: z.string().trim().max(60).default(''),
  neededBy: z.string().trim().max(40).default(''),
  message: z.string().trim().min(10, 'Please describe what you have in mind (at least a few words)').max(2000),
  website: z.string().max(200).optional(), // honeypot: real people leave this empty
}).refine((v) => v.email || v.phone, { message: 'Please give an email or a phone number so we can reply.', path: ['email'] });

const hits = new Map<string, { n: number; reset: number }>();
export function enquiryRateLimit(key: string, now = Date.now()) {
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + 3600_000 }); return; }
  if (++h.n > 5) throw new HttpError(429, 'You have sent a few requests already. Please wait a while, or message us on Instagram.');
}

export async function createEnquiry(raw: unknown): Promise<number> {
  const b = enquirySchema.parse(raw);
  if (b.website) return 0; // bot: pretend it worked
  return (await getDb()).insert('INSERT INTO enquiries (name, email, phone, occasion, budget, needed_by, message) VALUES (?,?,?,?,?,?,?)', b.name, b.email, b.phone, b.occasion, b.budget, b.neededBy, b.message);
}
export const ENQUIRY_STATUSES = ['new', 'in_progress', 'done'] as const;
