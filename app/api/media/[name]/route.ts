import fs from 'fs';
import path from 'path';
import { uploadDir } from '@/lib/media';
const types: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
export async function GET(_r: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (process.env.VERCEL) return new Response('Not found', { status: 404 });
  if (!/^[a-f0-9]{24}\.(png|jpg|webp)$/.test(name)) return new Response('Not found', { status: 404 });
  try {
    const buf = fs.readFileSync(path.join(uploadDir(), name));
    return new Response(new Uint8Array(buf), { headers: { 'Content-Type': types[name.split('.')[1]], 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch { return new Response('Not found', { status: 404 }); }
}
