import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const uploadDir = () => path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || './data/uploads');
const MAX = 5 * 1024 * 1024;
/** Detect image type from magic bytes, never from the client-provided type or name. */
export function sniff(buf: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}
const CONTENT_TYPE = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' } as const;

/**
 * Stores an uploaded image and returns the URL to save on the product.
 * With BLOB_READ_WRITE_TOKEN (Vercel Blob) the file goes to Blob and the public https URL is returned.
 * Without it, files go to ./data/uploads and are served by /api/media (local development only: Vercel's disk is temporary).
 */
export async function saveUpload(buf: Buffer): Promise<string> {
  if (buf.length > MAX) throw new Error('too_large');
  const ext = sniff(buf); if (!ext) throw new Error('bad_type');
  const name = crypto.randomBytes(12).toString('hex') + '.' + ext;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const r = await put(`products/${name}`, buf, { access: 'public', contentType: CONTENT_TYPE[ext], addRandomSuffix: false });
    return r.url;
  }
  if (process.env.VERCEL) throw new Error('storage_not_configured');
  fs.mkdirSync(uploadDir(), { recursive: true });
  fs.writeFileSync(path.join(uploadDir(), name), buf);
  return `/api/media/${name}`;
}
