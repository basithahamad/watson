// The H.E.L.F Review — articles API (Vercel serverless function)
// Storage: Vercel Blob when deployed (BLOB_READ_WRITE_TOKEN present), local file in dev.
// Routes:  GET /api/articles          → list
//          GET /api/articles?id=X     → single
//          POST /api/articles         → create   (requires x-admin-code)
//          PUT /api/articles?id=X     → update   (requires x-admin-code)
//          DELETE /api/articles?id=X  → delete   (requires x-admin-code)
const fs = require('fs');
const path = require('path');

const ADMIN_CODE = process.env.ADMIN_CODE || 'helf2026';
const BLOB_PATH = 'helf-review/articles.json';
// resolve from this module, not cwd — dev server may be launched from the repo root
const LOCAL = path.join(__dirname, '..', 'data', 'articles.json');

const SEED = [
  {
    id: 'lightning-in-a-bottle',
    title: 'Lightning in a Bottle: How H.E.L.F. built the HBCU leadership pipeline that no one else would',
    category: 'Featured',
    author: 'Jamal Watson',
    date: 'September 5, 2026',
    excerpt: "A decade ago, four people sat in a small hotel suite in New Orleans with no name, no logo, and no guarantee that anyone would come back. What they built has quietly transformed who leads America's HBCUs.",
    image: 'assets/img/helf-feature.jpg',
    featured: true,
    url: 'article-lightning-in-a-bottle.html'
  }
];

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

async function save(listData) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = require('@vercel/blob');
    await put(BLOB_PATH, JSON.stringify(listData, null, 2), {
      access: 'public', contentType: 'application/json',
      addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 0
    });
  } else {
    fs.mkdirSync(path.dirname(LOCAL), { recursive: true });
    fs.writeFileSync(LOCAL, JSON.stringify(listData, null, 2));
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = req.query && req.query.id;

  try {
    if (req.method === 'GET') {
      const arts = await load();
      // Drafts are never served publicly. The admin sends its code on reads too,
      // so it still sees everything. Articles written before drafts existed have
      // no status and count as published.
      const isAdmin = req.headers['x-admin-code'] === ADMIN_CODE;
      const visible = isAdmin ? arts : arts.filter(a => a.status !== 'draft');
      if (id) {
        const a = visible.find(x => x.id === id);
        return a ? res.status(200).json(a) : res.status(404).json({ error: 'not found' });
      }
      return res.status(200).json(visible);
    }

    if (req.headers['x-admin-code'] !== ADMIN_CODE)
      return res.status(401).json({ error: 'unauthorized' });

    const body = req.body || {};

    if (req.method === 'POST') {
      if (!body.title) return res.status(400).json({ error: 'title required' });
      const arts = await load();
      const slug = (body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article');
      let newId = slug, n = 2;
      while (arts.some(a => a.id === newId)) newId = slug + '-' + n++;
      const article = { ...body, id: newId, createdAt: new Date().toISOString() };
      if (article.featured) arts.forEach(a => a.featured = false);
      arts.unshift(article);
      await save(arts);
      return res.status(201).json(article);
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const arts = await load();
      const i = arts.findIndex(a => a.id === id);
      if (i === -1) return res.status(404).json({ error: 'not found' });
      const updated = { ...arts[i], ...body, id };
      if (updated.featured) arts.forEach(a => a.featured = false);
      arts[i] = updated;
      await save(arts);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const arts = await load();
      const next = arts.filter(a => a.id !== id);
      if (next.length === arts.length) return res.status(404).json({ error: 'not found' });
      await save(next);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
};
