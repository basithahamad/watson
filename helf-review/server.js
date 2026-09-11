// Local dev server for The H.E.L.F Review (mirrors the Vercel setup: static files + /api/articles).
// Production runs on Vercel where api/articles.js handles the same routes.
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROUTES = {
  '/api/articles': require('./api/articles.js'),
  '/api/site': require('./api/site.js')
};

const ROOT = __dirname;
const PORT = 8742;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  const handler = ROUTES[url.pathname];
  if (handler) {
    // shim Vercel's (req, res) interface
    req.query = Object.fromEntries(url.searchParams);
    res.status = c => { res.statusCode = c; return res; };
    res.json = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
    let buf = '';
    req.on('data', c => { buf += c; if (buf.length > 25e6) req.destroy(); });
    req.on('end', () => {
      try { req.body = buf ? JSON.parse(buf) : {}; } catch { req.body = {}; }
      handler(req, res);
    });
    return;
  }

  let file = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const full = path.normalize(path.join(ROOT, file));
  if (!full.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log('H.E.L.F Review dev server → http://localhost:' + PORT));
