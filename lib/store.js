// Shared data access for Watson & Watson Associates.
//
// Backed by MySQL. `read`/`write` keep the same two logical documents the rest of
// the app expects, so the public page and the API routes are unchanged:
//
//   read('site')     → { topbar: {...}, hero: {...}, ... }  one key per section
//   read('content')  → { speakers: [...], testimonials: [...] }
//
// Writes run in a transaction, so a concurrent save can no longer half-apply or
// silently clobber another editor's work — which is what the previous
// read-modify-write against a JSON blob did.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.js';

/** Constant-time compare of the admin code. Fails closed when ADMIN_CODE is unset. */
export function authorised(request) {
  const expected = process.env.ADMIN_CODE;
  if (!expected) return false;
  const digest = v => crypto.createHash('sha256').update(String(v)).digest();
  return crypto.timingSafeEqual(
    digest(request.headers.get('x-admin-code') || ''),
    digest(expected)
  );
}

export async function read(name) {
  return name === 'site' ? readSite() : readContent();
}

export async function write(name, doc) {
  return name === 'site' ? writeSite(doc) : writeContent(doc);
}

// ── site copy ────────────────────────────────────────────────────────────────

// New fields added to data/site.json appear automatically, filled in UNDER
// whatever is stored, so a release never has to push the seed over the live
// document — doing that overwrote the client's edits.
//
// Stored values always win, including empty ones: clearing a field in the admin
// must not resurrect the default. Arrays are taken whole from the stored
// document, so deleting a row sticks.
function withDefaults(defaults, stored) {
  if (!defaults || typeof defaults !== 'object' || Array.isArray(defaults)) return stored;
  if (stored === undefined) return defaults;
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return stored;

  const out = { ...defaults };
  for (const key of Object.keys(stored)) out[key] = withDefaults(defaults[key], stored[key]);
  return out;
}

let seedCache;
function siteDefaults() {
  if (seedCache === undefined) {
    try {
      seedCache = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'site.json'), 'utf8'));
    } catch {
      seedCache = {};
    }
  }
  return seedCache;
}

async function readSite() {
  const [rows] = await db().query('SELECT section, data FROM site_content');
  const stored = {};
  for (const r of rows) stored[r.section] = asJson(r.data) ?? {};
  return withDefaults(siteDefaults(), stored);
}

// Upserts only the sections present in `partial`, so a form that posts one
// section can't blank the others. This replaces the old shallow `merge` —
// the database does it atomically instead of us doing read-then-write.
async function writeSite(partial) {
  const sections = Object.entries(partial || {})
    .filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v));

  await tx(async conn => {
    for (const [section, data] of sections) {
      await conn.execute(
        `INSERT INTO site_content (section, data) VALUES (?, CAST(? AS JSON))
         ON DUPLICATE KEY UPDATE data = VALUES(data)`,
        [section.slice(0, 64), JSON.stringify(data)]
      );
    }
  });
  return readSite();
}

// ── speakers + testimonials ──────────────────────────────────────────────────

async function readContent() {
  const [[speakers], [testimonials]] = await Promise.all([
    db().query(
      'SELECT slug AS id, name, `role`, bio, topics, image_url AS image FROM speakers ORDER BY sort_order, id'
    ),
    db().query(
      'SELECT slug AS id, quote, name, title, image_url AS image FROM testimonials ORDER BY sort_order, id'
    )
  ]);

  return {
    speakers: speakers.map(s => ({ ...s, topics: asJson(s.topics) ?? [] })),
    testimonials
  };
}

// The admin always posts the full list, so each array is synced as a set: upsert
// by slug (preserving id and created_at) then drop rows no longer present.
async function writeContent(doc) {
  const speakers = Array.isArray(doc?.speakers) ? doc.speakers : null;
  const testimonials = Array.isArray(doc?.testimonials) ? doc.testimonials : null;

  await tx(async conn => {
    if (speakers) {
      await syncSet(conn, 'speakers', speakers, (s, i) => [
        ['name', str(s.name, 200)],
        ['`role`', str(s.role, 200)],
        ['bio', str(s.bio, 65535)],
        ['topics', JSON.stringify(Array.isArray(s.topics) ? s.topics.map(t => str(t, 120)) : [])],
        ['image_url', str(s.image, 500)],
        ['sort_order', i]
      ]);
    }
    if (testimonials) {
      await syncSet(conn, 'testimonials', testimonials, (t, i) => [
        ['quote', str(t.quote, 65535)],
        ['name', str(t.name, 200)],
        ['title', str(t.title, 200)],
        ['image_url', str(t.image, 500)],
        ['sort_order', i]
      ]);
    }
  });
  return readContent();
}

async function syncSet(conn, table, items, columnsOf) {
  const slugs = [];

  for (const [i, item] of items.entries()) {
    const cols = columnsOf(item, i);
    const slug = str(item.id, 160) || slugify(item.name || item.quote);
    slugs.push(slug);

    const names = ['slug', ...cols.map(([c]) => c)];
    // topics is the only JSON column either table has.
    const values = ['?', ...cols.map(([c]) => (c === 'topics' ? 'CAST(? AS JSON)' : '?'))];
    const updates = cols.map(([c]) => `${c} = VALUES(${c})`);

    await conn.execute(
      `INSERT INTO ${table} (${names.join(', ')}) VALUES (${values.join(', ')})
       ON DUPLICATE KEY UPDATE ${updates.join(', ')}`,
      [slug, ...cols.map(([, v]) => v)]
    );
  }

  if (!slugs.length) {
    await conn.query(`DELETE FROM ${table}`);
    return;
  }
  await conn.execute(
    `DELETE FROM ${table} WHERE slug NOT IN (${slugs.map(() => '?').join(',')})`,
    slugs
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function tx(fn) {
  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    await fn(conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

// mysql2 parses JSON columns already; tolerate a string in case a column was
// created as TEXT by an older hand-run migration.
function asJson(v) {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return null; }
}

function str(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : v == null ? '' : String(v).slice(0, max);
}

function slugify(s) {
  const base = str(s, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${base || 'item'}-${crypto.randomBytes(2).toString('hex')}`;
}

/* -------------------------------------------------------------- subscribers */

// Returns false when the address was already on the list. The public form
// reports success either way — whether someone is already subscribed is not
// something an anonymous visitor should be able to probe.
export async function addSubscriber(email, name) {
  const [res] = await db().execute(
    'INSERT IGNORE INTO subscribers (email, name) VALUES (?, ?)',
    [email.trim().toLowerCase(), name?.trim() || null]
  );
  return res.affectedRows > 0;
}

export async function listSubscribers() {
  const [rows] = await db().execute(
    'SELECT id, email, name, created_at FROM subscribers ORDER BY created_at DESC'
  );
  return rows.map(r => ({
    id: r.id, email: r.email, name: r.name,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at
  }));
}
