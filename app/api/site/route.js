import { read, write, authorised } from '../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await read('site'), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request) {
  if (!authorised(request)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  // Reject anything that isn't a real document before writing, so a malformed
  // request can never blank the page copy.
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return Response.json({ error: 'expected an object' }, { status: 400 });

  // write() upserts only the sections present in the body, so a partial save
  // leaves the rest untouched without a read-modify-write round trip.
  return Response.json(await write('site', body));
}
