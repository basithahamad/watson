# Deploy — both sites

Two **separate** Vercel projects from this one repo. Each subfolder is its own site.

| | The H.E.L.F Review | Watson & Watson |
|---|---|---|
| Vercel Root Directory | `helf-review` | `watson-watson` |
| Local dev | `npm run dev` → http://localhost:8742 | `npm run dev` → http://localhost:8743 |
| Admin page | `/admin.html` | `/admin.html` |
| Content API | `/api/articles` | `/api/content` |

Framework Preset: **Other**. No build command, no output directory — Vercel serves the
static files and turns `api/*.js` into serverless functions automatically.

---

## Steps (repeat for each site)

**1. Push this repo to GitHub.**

**2. Vercel → Add New → Project → import the repo.**
Under *Root Directory* click **Edit** and pick `helf-review` (or `watson-watson`).
Do this before the first deploy — it's fiddly to change after.

**3. Create the Blob store.**
Project → **Storage** → Create Database → **Blob** → Connect.
This injects `BLOB_READ_WRITE_TOKEN` automatically. Don't set it by hand.

> Without this token the API silently falls back to writing a local file, which on
> Vercel means **edits vanish on the next deploy**. This step is not optional.

**4. Set the admin password.**
Project → Settings → Environment Variables → add `ADMIN_CODE` for all environments.
Use a different value per site.

Generate one:
```
node -e "console.log(require('crypto').randomBytes(9).toString('base64url'))"
```

> **Never commit the value.** Keep it in Vercel's env settings and your password
> manager only — this file is in the repo.

> **This is the important one.** The code falls back to a hardcoded default if the
> variable is missing — see `api/articles.js:11` and `api/content.js:9`. Those
> defaults are in the repo, so anyone reading it could edit the live site.
> Set `ADMIN_CODE` or don't go live.

**5. Redeploy** after adding env vars — they only apply to new deployments.

**6. Smoke test:**
```
curl https://YOUR-SITE.vercel.app/api/articles                 # 200 + JSON
curl -X POST https://YOUR-SITE.vercel.app/api/articles \
  -H 'content-type: application/json' -d '{"title":"x"}'       # 401 unauthorized
```
Then open `/admin.html`, enter the admin code, add a test post, confirm it appears on
the homepage, and delete it.

---

## Handing over to the client

Send Jamal: the site URL, the `/admin.html` URL, and the admin code. One shared code per
site — there are no individual user accounts.

## Known limits

- **One shared password per site.** No user accounts, no password reset, no rate limiting.
- **Images are stored inline** as base64 in the content JSON (auto-downscaled to 1600px,
  JPEG 0.85 — `admin.html:236`). Comfortable to roughly 50 articles; past that the
  homepage payload gets heavy and images should move to Blob URLs.
- **No drafts, preview, or revisions.** Saving publishes immediately.

If the client ever needs drafts or revisions, the cheapest upgrade is headless WordPress
as the backend — the front-ends only touch the data layer in three places
(`helf-review/index.html:485`, `helf-review/article.html:89`,
`watson-watson/index.html:552`), so the design and this Vercel setup stay as they are.
