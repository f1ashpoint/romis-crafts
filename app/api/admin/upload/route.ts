import { handle, json, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { saveUpload } from '@/lib/media';

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) throw new HttpError(400, 'Choose an image to upload.');
  try { return json({ url: await saveUpload(Buffer.from(await file.arrayBuffer())) }, 201); }
  catch (e) {
    const m = (e as Error).message;
    if (m === 'too_large') throw new HttpError(413, 'Image is larger than 5 MB.');
    if (m === 'bad_type') throw new HttpError(415, 'Only PNG, JPEG or WebP images are accepted.');
    if (m === 'storage_not_configured') throw new HttpError(503, 'Image storage is not set up yet. Add a Vercel Blob store to this project (see the README).');
    throw e;
  }
});
