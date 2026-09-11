// Watson & Watson Associates — site content API (Vercel serverless function)
// Manages speakers + testimonials as one document.
// Storage: Vercel Blob when deployed, local file in dev.
// Routes:  GET /api/content   → full content document
//          PUT /api/content   → replace document (requires x-admin-code)
const fs = require('fs');
const path = require('path');

const ADMIN_CODE = process.env.ADMIN_CODE || 'watson2026';
const BLOB_PATH = 'watson-watson/content.json';
// resolve from this module, not cwd — dev server may be launched from the repo root
const LOCAL = path.join(__dirname, '..', 'data', 'content.json');

const SEED = { speakers: [], testimonials: [] };

async function load() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { list } = require('@vercel/blob');
    const { blobs } = await list({ prefix: BLOB_PATH });
    const b = blobs.find(x => x.pathname === BLOB_PATH);
    if (!b) return SEED;
    const r = await fetch(b.url, { cache: 'no-store' });
    return await r.json();
  }
  try { return JSON.parse(fs.readFileSync(LOCAL, 'utf8')); } catch { return SEED; }
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

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') return res.status(200).json(await load());

    if (req.headers['x-admin-code'] !== ADMIN_CODE)
      return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'PUT') {
      const body = req.body || {};
      const doc = {
        speakers: Array.isArray(body.speakers) ? body.speakers : [],
        testimonials: Array.isArray(body.testimonials) ? body.testimonials : []
      };
      await save(doc);
      return res.status(200).json(doc);
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
};
