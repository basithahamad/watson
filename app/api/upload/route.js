import { authorised } from '../../../lib/store';
import { save, UploadError, MAX_BYTES } from '../../../lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!authorised(request)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let form;
  try { form = await request.formData(); }
  catch { return Response.json({ error: 'expected multipart/form-data' }, { status: 400 }); }

  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return Response.json({ error: 'no file in the "file" field' }, { status: 400 });
  }

  try {
    return Response.json({ url: await save(file) });
  } catch (err) {
    if (err instanceof UploadError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error('upload failed', err);
    return Response.json({ error: 'could not store the file' }, { status: 500 });
  }
}

export function GET() {
  return Response.json({ maxBytes: MAX_BYTES, accept: ['image/jpeg', 'image/png', 'image/webp'] });
}
