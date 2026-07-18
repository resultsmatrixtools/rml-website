# resultsmatrix.com

Static marketing site for **Results Matrix Limited (RML)** — Caribbean development
solutions firm (Strategy & Advisory, Research & Data Analytics, MEL).

Built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com),
hosted on DigitalOcean App Platform as a static site. Blog content is managed via
Decap CMS at `/admin` (git-backed, editorial workflow; Sveltia planned once its
1.0 ships workflow support). Forms and analytics run on HubSpot (free tier). See
`BRIEF.md` for the full build specification.

## Development

```sh
npm install
npm run dev       # dev server at localhost:4321
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

Requires Node 22+.

## Branches & deployment

| Branch | Deploys to | Spec |
|---|---|---|
| `main` | Production app | `.do/app.yaml` |
| `staging` | Staging app (draft posts visible) | `.do/app-staging.yaml` |

Both apps auto-deploy on push via DigitalOcean App Platform. Create them with
`doctl apps create --spec <file>` or by pasting the spec in the DO dashboard.

## Environment variables

All variables are **build-time** and injected by DigitalOcean App Platform
(set values in the DO dashboard — never commit them). For local work, copy
`.env.example` to `.env`. See `.env.example` for descriptions.

| Variable | Purpose |
|---|---|
| `PUBLIC_HUBSPOT_PORTAL_ID` | HubSpot account ID (tracking script + Forms API) |
| `PUBLIC_HUBSPOT_FORM_GUID_CONTACT` | Form GUID — contact form |
| `PUBLIC_HUBSPOT_FORM_GUID_RESOURCE` | Form GUID — gated resource downloads |
| `PUBLIC_HUBSPOT_FORM_GUID_CONSULT` | Form GUID — consultation requests |
| `PUBLIC_CONSULTATION_PAYMENT_URL` | External payment link (unset/`#` → "coming soon") |
| `PUBLIC_SITE_URL` | Canonical site URL (differs prod vs staging) |

## Blog & drafts

Posts are markdown files in `src/content/blog/` (schema in
`src/content.config.ts`: title, description, pubDate, updatedDate?, author,
tags[], heroImage? + heroImageAlt, draft). Blog images live in
`src/assets/blog/`.

**Draft behavior:** `draft: true` posts build on staging and locally but are
excluded from production. The switch is `PUBLIC_SITE_URL` — a build where it
equals `https://resultsmatrix.com` is production (drafts excluded); anything
else (staging app URL, unset/local) shows drafts with a visible "Draft"
badge. New posts default to `draft: true`. The RSS feed (`/rss.xml`) only
ever contains published posts. The three `sample-*.md` posts are permanent
drafts for staging demonstration — delete them once real content exists.

## Runbook

> Sections below are completed in later build phases (BRIEF.md §8).

### CMS: Decap at /admin — OAuth app, proxy function, and roles

The CMS is **Decap CMS** (git-backed, editorial workflow). Sveltia CMS was
the first choice but does not yet support the editorial workflow required by
the brief; its config format is compatible, so revisit at Sveltia 1.0 by
swapping the script tag in `public/admin/index.html`.

**1. Create the GitHub OAuth App** (any org admin, once):

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Application name: `RML Content Manager` · Homepage URL:
   `https://resultsmatrix.com`.
3. Authorization callback URL: **the OAuth proxy function URL** (from step 2
   below). If you create the OAuth App first, use a placeholder and update it
   after deploying the function. One OAuth App serves production, staging,
   and local — the callback is the proxy, not the site.
4. Note the Client ID and generate a Client Secret.

**2. Deploy the OAuth proxy** (DigitalOcean Function, once):

```sh
doctl serverless install                 # first time only
doctl serverless connect                 # create/select a namespace
cp functions/.env.example functions/.env # fill in client ID/secret
doctl serverless deploy functions
doctl serverless functions get auth/oauth --url
```

The printed URL (e.g.
`https://faas-nyc1-abc123.doserverless.co/api/v1/web/fn-xxxx/auth/oauth`) is
both the **OAuth App callback URL** (paste into step 1) and the CMS backend
endpoint: put its origin in `base_url` and its path in `auth_endpoint` in
`public/admin/config.yml`, commit, deploy.

**3. Roles — writer and reviewer** (repo settings, once):

- Add both people as collaborators on `results-matrix/rml-website` with
  **Write** access (the CMS needs it to create content branches for both).
- Protect the `main` branch: Settings → Branches → add a ruleset/protection
  rule on `main` requiring **1 approving review** before merging and
  blocking direct pushes. This is what makes the roles real: the **writer**
  can draft and submit but cannot publish; the **reviewer** approves the
  review, which allows the merge.
- One person can hold both roles — approvals aside, give them admin/bypass
  on the protection rule (or allow self-merge without review) and they can
  write and publish alone.
- Neither role ever uses git directly: they log in at `/admin` with GitHub
  and work on the Workflow board (Draft → In Review → Ready → publish).

**4. How publishing works (two gates):**

1. **Editorial workflow** controls when content reaches `main`: saving in
   the CMS creates a content branch/PR; "publish" merges it (after review
   approval) and production redeploys automatically.
2. **The `draft` flag** controls production visibility after merge: posts
   with `draft: true` render only on staging (with a Draft badge); flipping
   the toggle off and publishing makes them live. RSS only ever includes
   published, non-draft posts.

To preview merged drafts on the staging site, sync the `staging` branch from
`main` (open a `main → staging` PR on GitHub, or `git checkout staging &&
git merge main && git push`). The `/admin` UI on both production and staging
commits to `main` — there is one editorial pipeline.

### HubSpot: form GUID setup

_TODO (Phase 6): how to create each HubSpot form, find its GUID, map contact
properties (including the industry dropdown and `resource_slug`), and where to
set the env vars._

### Adding a resource PDF

_TODO (Phase 6): drop the PDF in `public/downloads/` with a slug+hash filename,
add the resource card entry, redeploy._

### Changing the consultation payment link

_TODO (Phase 7): update `PUBLIC_CONSULTATION_PAYMENT_URL` in the DO app settings
and redeploy — no code change required._

### DNS cutover checklist (from old WordPress droplet)

_TODO (Phase 8): pre-flight acceptance checks, adding the custom domain to the
production app, DNS record changes, TLS, post-cutover verification, and
decommissioning the WordPress droplet. The old site stays live until the new
site passes acceptance on staging._
