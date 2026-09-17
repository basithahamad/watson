import fs from 'node:fs/promises';
import { resolveInDir, contentTypeFor } from '../../../lib/uploads';

export const runtime = 'nodejs';

// In production nginx serves /uploads/ straight from disk and this never runs.
// It exists so `next dev` — and any deployment without nginx in front — still
// serves the client's photos.
export async function GET(_request, { params }) {
  const { path: parts = [] } = await params;

  const target = resolveInDir(parts);
  if (!target) return new Response('Not found', { status: 404 });

  try {
    const body = await fs.readFile(target);
    return new Response(body, {
      headers: {
        'Content-Type': contentTypeFor(target),
        // Filenames are content hashes, so a given URL never changes.
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
