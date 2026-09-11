// The H.E.L.F Review — editable site copy (Vercel serverless function)
// Everything on the page that is words rather than layout. Structure stays fixed.
// Storage: Vercel Blob when deployed, local file in dev.
// Routes:  GET /api/site   → full copy document
//          PUT /api/site   → replace document (requires x-admin-code)
const fs = require('fs');
const path = require('path');

const ADMIN_CODE = process.env.ADMIN_CODE || 'helf2026';
const BLOB_PATH = 'helf-review/site.json';
// resolve from this module, not cwd — dev server may be launched from the repo root
const LOCAL = path.join(__dirname, '..', 'data', 'site.json');

// The checked-in file is the seed and the fallback. If the Blob has never been
// written, or a save arrives with keys missing, we fall back to it rather than
// serving a half-empty page.
function seed() {
  try { return JSON.parse(fs.readFileSync(LOCAL, 'utf8')); } catch { return {}; }
}

async function load() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { list } = require('@vercel/blob');
    const { blobs } = await list({ prefix: BLOB_PATH });
    const b = blobs.find(x => x.pathname === BLOB_PATH);
    if (!b) return seed();
    const r = await fetch(b.url, { cache: 'no-store' });
    return await r.json();
  }
  return seed();
}

async function save(doc) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = require('@vercel/blob');
    await put(BLOB_PATH, JSON.stringify(doc, null, 2), {
      access: 'public', contentType: 'application/json',
      addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 0
    });
  } else {
    fs.mkdirSync(path.dirname(LOCAL), { recursive: true });
    fs.writeFileSync(LOCAL, JSON.stringify(doc, null, 2));
  }
}

// Shallow merge per top-level section, so a partial save can't blank the rest
// of the page. Within a section the incoming value wins outright.
function merge(base, incoming) {
  const out = { ...base };
  for (const [k, v] of Object.entries(incoming || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = { ...(base[k] || {}), ...v };
    else out[k] = v;
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') return res.status(200).json(await load());

    if (req.headers['x-admin-code'] !== ADMIN_CODE)
      return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'PUT') {
      const body = req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body))
        return res.status(400).json({ error: 'expected an object' });
      const doc = merge(await load(), body);
      await save(doc);
      return res.status(200).json(doc);
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
};
