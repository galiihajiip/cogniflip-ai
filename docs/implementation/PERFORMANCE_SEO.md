# Performance, SEO and Production Quality (BLOCK 55)

Measured 2026-10-13 on macOS (Apple silicon), Node 24.18.1, `next build` and `next start` locally (no network throttling). No Lighthouse run was performed, so no Lighthouse score is claimed.

## Measurements (actual)
| What | Value | How |
|---|---|---|
| Client JS loaded by `/` | 6 files, **170 KiB gzipped** | `curl` of the page's `<script src>` files from `next start` |
| All client JS in `.next/static` | 556.7 KiB raw / 171.1 KiB gzip | `find .next/static -name '*.js'` + gzip |
| CSS | 7.6 KiB raw | same |
| Server-rendered routes | `/` dynamic; `robots.txt`, `sitemap.xml`, `/_not-found` static; 26 API routes dynamic | `next build` route table |

The 170 KiB is the Next.js/React runtime itself; there is no application UI code yet. This is the baseline to compare against once screens exist.

## SEO and indexing
- Metadata: title template, description, `applicationName`, Open Graph (`id_ID`, website), `metadataBase` from `APP_BASE_URL`, `<html lang="id">`.
- `robots.txt`: allow `/`, **disallow `/api/`**. `sitemap.xml` lists only the public home page; learner sessions, profiles and history are never listed.
- API responses send `cache-control: no-store` (no public caching of private data).
- Security headers: see `SECURITY_AUDIT.md`.

## Deferred until the UI exists (D-009)
- Lazy-loading the code editor (CodeMirror per BLOCK 03), image and font optimisation, favicon/OG image, layout-shift checks, semantic headings beyond the placeholder `<h1>`.
- Re-measure the bundle and run Lighthouse on the deployed URL; record the device, network and command.
