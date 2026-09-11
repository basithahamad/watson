// The H.E.L.F Review — demo content server
// Serves the static site + a tiny JSON API for article CRUD (data/articles.json).
// Demo auth only: mutations require header  x-admin-code: helf2026
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA = path.join(DATA_DIR, 'articles.json');
const ADMIN_CODE = 'helf2026';
const PORT = 8742;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain'
};

function loadArticles() {
  try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch { return []; }
}
function saveArticles(list) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(list, null, 2));
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}
function readBody(req, cb) {
  let buf = '';
  let size = 0;
  req.on('data', c => {
    size += c.length;
    if (size > 25 * 1024 * 1024) { req.destroy(); return; } // 25MB cap (data-URI images)
    buf += c;
  });
  req.on('end', () => {
    try { cb(null, JSON.parse(buf || '{}')); } catch (e) { cb(e); }
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);

  // ── API ──────────────────────────────────────────
  if (parts[0] === 'api' && parts[1] === 'articles') {
    const id = parts[2] ? decodeURIComponent(parts[2]) : null;

    if (req.method === 'GET') {
      const list = loadArticles();
      if (id) {
        const a = list.find(x => x.id === id);
        return a ? json(res, 200, a) : json(res, 404, { error: 'not found' });
      }
      return json(res, 200, list);
    }

    if (req.headers['x-admin-code'] !== ADMIN_CODE)
      return json(res, 401, { error: 'unauthorized' });

    if (req.method === 'POST') {
      return readBody(req, (err, body) => {
        if (err || !body.title) return json(res, 400, { error: 'title required' });
        const list = loadArticles();
        const slug = (body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article');
        let newId = slug, n = 2;
        while (list.some(a => a.id === newId)) newId = slug + '-' + n++;
        const article = { ...body, id: newId, createdAt: new Date().toISOString() };
        if (article.featured) list.forEach(a => a.featured = false);
        list.unshift(article);
        saveArticles(list);
        return json(res, 201, article);
      });
    }

    if (req.method === 'PUT' && id) {
      return readBody(req, (err, body) => {
        if (err) return json(res, 400, { error: 'bad json' });
        const list = loadArticles();
        const i = list.findIndex(a => a.id === id);
        if (i === -1) return json(res, 404, { error: 'not found' });
        const updated = { ...list[i], ...body, id };
        if (updated.featured) list.forEach(a => a.featured = false);
        list[i] = updated;
        saveArticles(list);
        return json(res, 200, updated);
      });
    }

    if (req.method === 'DELETE' && id) {
      const list = loadArticles();
      const next = list.filter(a => a.id !== id);
      if (next.length === list.length) return json(res, 404, { error: 'not found' });
      saveArticles(next);
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: 'method not allowed' });
  }

  // ── Static files ─────────────────────────────────
  let file = url.pathname === '/' ? '/helf-news.html' : decodeURIComponent(url.pathname);
  const full = path.normalize(path.join(ROOT, file));
  if (!full.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
});

server.listen(PORT, () => console.log('H.E.L.F Review demo server on http://localhost:' + PORT));
