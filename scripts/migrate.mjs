// Creates the schema, then seeds from data/*.json when a table is still empty.
// Safe to re-run: the DDL is CREATE TABLE IF NOT EXISTS and seeding is skipped
// once rows exist, so this never overwrites live content.
//
//   npm run db:migrate
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { db } from '../lib/db.js';
import { write } from '../lib/store.js';

const ROOT = path.resolve(import.meta.dirname, '..');

async function applySchema() {
  const sql = await fs.readFile(path.join(ROOT, 'db', 'schema.sql'), 'utf8');
  // A dedicated connection: multipleStatements stays off on the app pool.
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true
  });
  try {
    await conn.query(sql);
    console.log('✓ schema applied');
  } finally {
    await conn.end();
  }
}

async function count(table) {
  const [[row]] = await db().query(`SELECT COUNT(*) AS n FROM ${table}`);
  return Number(row.n);
}

async function readSeed(file) {
  return JSON.parse(await fs.readFile(path.join(ROOT, 'data', file), 'utf8'));
}

async function seed() {
  if (await count('site_content') === 0) {
    const site = await readSeed('site.json');
    await write('site', site);
    console.log(`✓ seeded ${Object.keys(site).length} site sections`);
  } else {
    console.log('· site_content already has rows — left alone');
  }

  const existing = await count('speakers') + await count('testimonials');
  if (existing === 0) {
    const content = await readSeed('content.json');
    await write('content', content);
    console.log(
      `✓ seeded ${content.speakers?.length || 0} speakers, ${content.testimonials?.length || 0} testimonials`
    );
  } else {
    console.log('· speakers/testimonials already have rows — left alone');
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

try {
  await applySchema();
  await seed();
  console.log('\nDone.');
} catch (err) {
  console.error('\nMigration failed:', err.message);
  process.exitCode = 1;
} finally {
  await db().end().catch(() => {});
}
