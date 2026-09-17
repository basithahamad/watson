import { read, write, authorised } from '../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await read('content'), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request) {
  if (!authorised(request)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  // The admin probes this endpoint to check the access code, deliberately with a
  // body that fails here — validate before writing so that probe (or any other
  // malformed save) can't wipe the stored speakers and testimonials.
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return Response.json({ error: 'expected an object' }, { status: 400 });
  if (!Array.isArray(body.speakers) && !Array.isArray(body.testimonials))
    return Response.json({ error: 'expected speakers and/or testimonials' }, { status: 400 });

  // Each array is synced as a set inside one transaction; whichever key is absent
  // is left alone, so a partial save is safe.
  return Response.json(await write('content', body));
}
