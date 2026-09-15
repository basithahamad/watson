// Shared data access for Watson & Watson Associates.
//
// Two documents:
//   site.json     page copy (headings, body text, button labels, lists)
//   content.json  speakers + testimonials
//
// Vercel Blob when BLOB_READ_WRITE_TOKEN is present, otherwise the checked-in
// file under data/. The checked-in file is also the seed and the fallback: if
// Blob has never been written we serve it, so a fresh deploy is never blank.
import fs from 'node:fs';
import path from 'node:path';

export const ADMIN_CODE = process.env.ADMIN_CODE || 'watson2026';

const DOCS = {
  site: { blob: 'watson-watson/site.json', local: 'site.json' },
  content: { blob: 'watson-watson/content.json', local: 'content.json' }
};

function seedPath(name) {
  return path.join(process.cwd(), 'data', DOCS[name].local);
}

function seed(name) {
  try { return JSON.parse(fs.readFileSync(seedPath(name), 'utf8')); }
  catch { return name === 'content' ? { speakers: [], testimonials: [] } : {}; }
}

export async function read(name) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: DOCS[name].blob });
      const hit = blobs.find(b => b.pathname === DOCS[name].blob);
      if (!hit) return seed(name);
      const r = await fetch(hit.url, { cache: 'no-store' });
      return await r.json();
    } catch {
      return seed(name);
    }
  }
  return seed(name);
}

export async function write(name, doc) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    await put(DOCS[name].blob, JSON.stringify(doc, null, 2), {
      access: 'public', contentType: 'application/json',
      addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 0
    });
  } else {
    fs.mkdirSync(path.dirname(seedPath(name)), { recursive: true });
    fs.writeFileSync(seedPath(name), JSON.stringify(doc, null, 2));
  }
  return doc;
}

export function authorised(request) {
  return request.headers.get('x-admin-code') === ADMIN_CODE;
}

// Shallow merge per top-level section so a partial save can't blank the rest.
export function merge(base, incoming) {
  const out = { ...base };
  for (const [k, v] of Object.entries(incoming || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = { ...(base[k] || {}), ...v };
    else out[k] = v;
  }
  return out;
}
