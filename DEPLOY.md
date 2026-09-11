# Deploy — both sites

Two **independent Next.js apps** in one repo. Each is its own Vercel project.

| | The H.E.L.F Review | Watson & Watson |
|---|---|---|
| Vercel Root Directory | `helf-review` | `watson-watson` |
| Local dev | `npm run dev` → http://localhost:8742 | `npm run dev` → http://localhost:8743 |
| Public site | `/` | `/` |
| Article page | `/article/<id>` | — |
| CMS admin | `/admin` | `/admin` |
| Content API | `/api/articles` | `/api/content` |
| Site copy API | `/api/site` | `/api/site` |

Next.js 16 (App Router). Vercel auto-detects the framework — no build settings to
configure beyond the Root Directory.

Public pages are **server components**: they read the JSON directly through
`lib/store.js` and render on the server, so content published in the admin appears
on the next request with no rebuild. There is no visitor login on either site.

---

## Steps (repeat for each site)

**1. Push this repo to GitHub.**

**2. Vercel → Add New → Project → import the repo.**
Under *Root Directory* click **Edit** and pick `helf-review` (or `watson-watson`).
Do this before the first deploy — it's fiddly to change after.

**3. Create the Blob store.**
Project → **Storage** → Create Database → **Blob** → Connect.
This injects `BLOB_READ_WRITE_TOKEN` automatically. Don't set it by hand.

> Without this token the app falls back to the checked-in `data/*.json`, which on
> Vercel is a read-only filesystem — **edits will not persist**. Not optional.

**4. Set the admin password.**
Project → Settings → Environment Variables → add `ADMIN_CODE` for all environments.
Use a different value per site. Generate one:
```
node -e "console.log(require('crypto').randomBytes(9).toString('base64url'))"
```

> **Never commit the value.** Keep it in Vercel's env settings and your password
> manager only — this file is in the repo.

> The code falls back to a hardcoded default if the variable is missing (see
> `lib/store.js`). That default is in the repo, so anyone reading it could edit the
> live site. Set `ADMIN_CODE` or don't go live.

**5. Redeploy** after adding env vars — they only apply to new deployments.

**6. Smoke test:**
```
curl https://YOUR-SITE.vercel.app/api/site                      # 200 + JSON
curl -X PUT https://YOUR-SITE.vercel.app/api/site \
  -H 'content-type: application/json' -d '{}'                   # 401 unauthorized
```
Then open `/admin`, sign in, make a small edit, publish, and confirm it appears on `/`.

---

## Project layout

```
<site>/
  app/
    layout.js          fonts + metadata
    globals.css        the original stylesheet, unchanged
    page.js            public home page (server component)
    article/[id]/      article page            (HELF only)
    admin/             CMS admin (client component) + admin.css + siteSchema.js
    api/…/route.js     route handlers
  lib/store.js         Blob in production, data/*.json in dev; auth + merge helpers
  data/*.json          seed and fallback content
  public/assets/img/   images
```

## What the client can edit

Both admins have a **Site Content** tab covering the wording on the public page —
headings, body copy, button labels, contact details, footer. Watson's repeatable
blocks (services, book endorsements, hero statistics, contact rows, social links)
and HELF's commentary cards can be added, removed and reordered.

HELF additionally has full article management: create, edit, delete, feature on the
homepage, and **Draft / Published** status. Drafts are filtered out in the API, so
draft content is never sent to a visitor and a direct link returns 404.

Layout, colours, fonts and section order are deliberately not editable.

To expose a new field: add it to `SITE_SCHEMA` in `app/admin/siteSchema.js`, render
it in `app/page.js`, and seed it in `data/site.json`.

## Known limits

- **One shared password per site.** No user accounts, no password reset, no rate
  limiting.
- **Images are stored inline** as base64 in the content JSON (auto-downscaled to
  1600px, JPEG 0.85). Comfortable to roughly 50 articles; past that the payload gets
  heavy and images should move to Blob URLs.
- **No revision history.** Saving overwrites.
- **The contact and newsletter forms are not wired up** — they show a placeholder
  alert and nothing is sent or stored. HELF's search box does nothing.
- **`next` is pinned to 16.3.4.** The 16.3.5 SWC binary for win32-x64 is missing from
  the npm registry (the version resolves but the tarball 404s), which breaks local
  builds on Windows. Revisit when 16.3.6 ships.
- **The flagship "Lightning in a Bottle" article is still a static file** at
  `public/article-lightning-in-a-bottle.html`, not CMS content — its `url` field
  points there. New articles created in the admin use `/article/<id>` and are fully
  CMS-managed.
