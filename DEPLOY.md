# Deploy — Watson & Watson Associates

One **Next.js app** on a VPS, behind nginx, with **MySQL 8** for content and the
server's own disk for uploaded images.

| | Watson & Watson |
|---|---|
| Local dev | `npm run dev` → http://localhost:8743 |
| Public site | `/` |
| CMS admin | `/admin` |
| Content API | `/api/content` (speakers + testimonials) |
| Site copy API | `/api/site` |
| Upload API | `/api/upload` |
| Uploaded images | `/uploads/<hash>.jpg` — served by nginx from `UPLOAD_DIR` |

> **History:** this app previously ran on Vercel, storing content as JSON in Vercel
> Blob and uploaded photos as base64 strings inside that JSON. It now uses MySQL
> and real files on disk. `@vercel/blob`, `BLOB_READ_WRITE_TOKEN` and the Vercel
> Root Directory setting are all gone — **this app can no longer be deployed to
> Vercel**, which has no MySQL and a read-only filesystem.

Public pages are **server components** that query MySQL per request, so content
published in the admin appears on the next request with no rebuild. There is no
visitor login.

---

## Where content lives

| Data | Home | Why |
|---|---|---|
| Page copy (headings, body, labels) | `site_content` — one **JSON column** per section | Genuinely document-shaped: nested, heterogeneous, arrays of differing shape. Splitting it into columns would recreate the key-value sprawl we're avoiding, and `siteSchema.js` would need a migration per new field. |
| Speakers, testimonials | `speakers`, `testimonials` tables | Uniform records. Real columns, real constraints, `sort_order` for ordering. |
| Uploaded photos | Files in `UPLOAD_DIR`, URL in `image_url` | Images are files. The database stores a path, never bytes. |

`data/*.json` is now **seed data only** — used once by `npm run db:migrate` to
populate an empty database. It is no longer read at runtime and is no longer a
fallback: if MySQL is unreachable, pages error rather than silently serving stale
copy. That's deliberate — the old fallback could mask a dead database for weeks.

---

## Setup

### 1. MySQL

```sql
CREATE DATABASE watson CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'watson'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL PRIVILEGES ON watson.* TO 'watson'@'localhost';
FLUSH PRIVILEGES;
```

MySQL **8.0+** (5.7 works — both use the `JSON` column type).

### 2. Environment

```
cp .env.example .env
```

Fill in all three:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | `mysql://watson:PASSWORD@127.0.0.1:3306/watson` |
| `ADMIN_CODE` | Password for `/admin`. **No fallback** — unset means every admin request is rejected. Generate: `node -e "console.log(require('crypto').randomBytes(9).toString('base64url'))"` |
| `UPLOAD_DIR` | e.g. `/var/www/watson/uploads`. **Must be outside the repo** — anything under `public/` is part of the build and gets wiped on the next deploy, taking the client's photos with it. |

> Never commit `.env`. It's gitignored; keep the values in a password manager.

```
sudo mkdir -p /var/www/watson/uploads
sudo chown <app-user>: /var/www/watson/uploads
```

### 3. Schema + seed

```
npm ci
npm run db:migrate     # creates tables, seeds from data/*.json if empty
npm run build
```

`db:migrate` is idempotent and re-runnable: the DDL is `CREATE TABLE IF NOT
EXISTS`, and seeding is skipped once rows exist, so it will never overwrite live
content.

### 4. Run it

`/etc/systemd/system/watson.service`:

```ini
[Unit]
Description=Watson & Watson site
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/srv/watson
EnvironmentFile=/srv/watson/.env
ExecStart=/usr/bin/npm run start
Restart=always

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl enable --now watson
```

### 5. nginx

```nginx
server {
  listen 443 ssl http2;
  server_name watsonwatsonassociates.com;

  # Uploaded photos come straight off disk — Node never sees these requests.
  # The trailing slashes matter.
  location /uploads/ {
    alias /var/www/watson/uploads/;
    # Filenames are content hashes, so a URL's contents never change.
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
  }

  location / {
    proxy_pass http://127.0.0.1:8743;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # nginx defaults to 1MB, which would reject photo uploads with a 413.
  client_max_body_size 12M;
}
```

> If `/uploads/` is not configured, images still work — the app has a fallback
> route handler that streams them from `UPLOAD_DIR`. It's just slower, because
> every image request goes through Node. nginx takes precedence when present.

### 6. Smoke test

```
curl -s https://watsonwatsonassociates.com/api/site | head -c 200    # 200 + JSON
curl -X PUT https://watsonwatsonassociates.com/api/site \
  -H 'content-type: application/json' -d '{}'                        # 401
curl -X POST https://watsonwatsonassociates.com/api/upload           # 401
```

Then open `/admin`, sign in, upload a speaker photo, and confirm:

1. The photo appears on `/`.
2. Its URL is `/uploads/<hash>.jpg` — **not** a `data:` URL.
3. The file exists in `UPLOAD_DIR` on the server.
4. `SELECT image_url FROM speakers;` shows the path, and the row is small.

---

## Backups

There is now real state in two places. Both need backing up:

```bash
mysqldump --single-transaction --default-character-set=utf8mb4 watson > watson-$(date +%F).sql
tar czf watson-uploads-$(date +%F).tar.gz -C /var/www/watson uploads
```

A database dump alone will restore the site with broken images.

---

## Project layout

```
app/
  layout.js               fonts + metadata
  globals.css             the original stylesheet, unchanged
  page.js                 public home page (server component)
  icons.js                inline SVG for services + contact
  ContactForm.js          contact + newsletter form components
  admin/                  CMS admin (client component) + admin.css + siteSchema.js
  api/content/route.js    speakers + testimonials
  api/site/route.js       page copy
  api/upload/route.js     photo upload → returns a public URL
  uploads/[...path]/      dev/no-nginx fallback for serving uploaded files
lib/db.js                 MySQL pool
lib/store.js              read/write for the two logical documents; auth
lib/uploads.js            file validation, hashing, path safety
db/schema.sql             DDL
scripts/migrate.mjs       apply schema + seed an empty database
data/*.json               seed data (migration only — not read at runtime)
public/assets/img/        design images shipped with the repo
```

## What the client can edit

The admin's **Site Content** tab covers the wording on the public page — headings,
body copy, button labels, contact details, footer. Repeatable blocks (services,
book endorsements, hero statistics, contact rows, social links) and the speakers
and testimonials lists can be added, removed and reordered.

Layout, colours, fonts and section order are deliberately not editable.

To expose a new field: add it to `SITE_SCHEMA` in `app/admin/siteSchema.js`, render
it in `app/page.js`, and seed it in `data/site.json`. No migration needed — the
section is a JSON column.

## Still outstanding

- The contact and newsletter forms are placeholders; nothing is sent or stored.
- No mobile navigation: `globals.css` hides the nav below 920px with no
  hamburger replacement.
- Privacy Policy and Terms of Use link to `#`.
- Uploaded files are never garbage-collected — replacing a photo leaves the old
  file on disk.
