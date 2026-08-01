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

- Add both people as collaborators on `resultsmatrixtools/rml-website` with
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

Forms are custom-built and post straight to the HubSpot Forms Submission API
v3 from the browser (`src/lib/hubspot.ts`) — no HubSpot form widget is embedded,
so the site keeps its own markup and styling. The portal ID and form GUIDs are
not secrets: they are what the public submission endpoint uses to identify the
form, which is why they ship as `PUBLIC_` variables.

**1. Portal ID.** In HubSpot, *Settings → Account Management → Account
Information*, or read it from the number in any HubSpot URL. Set it as
`PUBLIC_HUBSPOT_PORTAL_ID`.

**2. Create the custom contact properties** the forms write to (*Settings →
Data Management → Properties → Create property*, object type Contact):

| Property (internal name) | Type | Used by |
|---|---|---|
| `subject` | Single-line text | Contact form |
| `resource_slug` | Single-line text | Resource download form |

`industry` is a HubSpot default dropdown property. A dropdown is validated
against its **internal option values**, not its labels, and a value the
property does not know is rejected — taking the whole submission with it, not
just that one field. The `industries` array at the top of
`src/pages/contact.astro` therefore carries an explicit `label` (what the
visitor sees) and `value` (what HubSpot stores) per option, and must stay in
sync with the property:

| Label shown on the form | Internal value sent |
|---|---|
| Government | `gov` |
| Non-governmental Organizations | `ngo` |
| Healthcare | `healthcare` |
| Education | `education` |
| Environment | `environment` |
| Private Sector | `private-sector` |
| Consulting | `consult` |

Changing the options in HubSpot without changing this array (or vice versa) is
a silent lead-loss bug: the form keeps working and every affected submission is
rejected. Note this list supersedes the five industries named in BRIEF.md §2 —
"Shipping and Logistics" was dropped and Environment, Private Sector, and
Consulting added, per the client's HubSpot property (2026-07-25).

**3. Create one form per flow** (*Marketing → Forms → Create form → Embedded
form*). The form's own layout does not matter — only its fields, because the
site renders its own UI — but every property the site sends must exist as a
field on the form, or HubSpot rejects the submission.

| Form | Env var | Fields to add |
|---|---|---|
| Contact | `PUBLIC_HUBSPOT_FORM_GUID_CONTACT` | `firstname`, `lastname`, `email`, `company`, `phone`, `industry`, `subject`, `message` |
| Resource download | `PUBLIC_HUBSPOT_FORM_GUID_RESOURCE` | `firstname`, `lastname`, `email`, `company`, `resource_slug` |
| Consultation request | `PUBLIC_HUBSPOT_FORM_GUID_CONSULT` | `firstname`, `lastname`, `email`, `company`, `phone`, `session_focus`, `payment_method` |

The consultation form needs two more custom Contact properties, both **single-line
text**: `session_focus` and `payment_method`. Text rather than dropdown on
purpose — a dropdown is validated against its internal option values and a
mismatch rejects the whole submission, so free text removes a class of silent
lead loss. `payment_method` is always sent as `Bank transfer/invoice`; the
online-payment path leaves the site entirely, so it never reaches this form.

**Two form settings that silently break API submissions.** Both cost real
debugging time on the contact and resource forms, so check them on every form
you create:

1. **CAPTCHA must be off.** A form with bot protection enabled returns
   `FORM_HAS_RECAPTCHA_ENABLED` and refuses every API submission. HubSpot's
   CAPTCHA only works with their embedded widget, which this site does not use.
   The honeypot field on each form is the spam defence.
2. **Use the Contact property `company`, not the Company object's `name`.**
   Searching "company name" in the form editor offers both. Picking the Company
   one (object `0-2`) makes every submission fail with
   `Error in 'fields.0-2/name'. Required field '0-2/name' is missing`, because
   the site sends organization as a Contact property (object `0-1`).

To debug a failing form without touching code, POST the payload straight at the
API and read the JSON error, which names the offending field:

```sh
curl -s -X POST -H "Content-Type: application/json" \
  -d @payload.json \
  "https://api.hsforms.com/submissions/v3/integration/submit/<portalId>/<formGuid>"
```

A rejected submission records nothing in HubSpot — which is why failed attempts
never appear under the form's Submissions tab. A **successful** one creates a
real contact, and HubSpot does not reject a malformed email address, so use an
obviously disposable address and delete the contact afterwards.

The single visible "Your name" field is split on the first space into
`firstname` / `lastname` (`splitName()` in `src/lib/hubspot.ts`) — one field is
friendlier to fill, and HubSpot wants the two apart. "Your organization" maps
to HubSpot's default `company` property.

**4. Find each GUID.** Publish the form, then take the UUID from its editor
URL (`.../forms/<portalId>/editor/<formGuid>/edit`) or from the *Embed code*
dialog's `formId`. Set the three env vars in the DO app settings for **both**
the production and staging apps, and in your local `.env`.

**5. Verify.** Submit each form on staging and confirm the contact appears in
HubSpot with every property populated. If a submission fails, the browser
console carries HubSpot's own rejection message, which names the offending
field — the usual cause is a missing custom property or an `industry` option
that does not match.

**Tracking association.** The tracker sets a `hubspotutk` cookie, and the site
passes it back as `context.hutk`, which is what attaches a submission to that
visitor's page-view history. The tracker only loads after the visitor accepts
cookies (`src/components/ConsentBanner.astro`), so a visitor who declined still
becomes a contact, just without the browsing timeline. This is intended.

**If the variables are unset at build time**, the submission code is stripped
as dead code and the forms show their error state (with the email fallback) on
every attempt. There is no runtime warning beyond a console message, so treat a
missing variable as a broken build — check the console on staging after any
change to the app spec.

### Adding a resource PDF

Resource cards are the `featuredResources` array at the top of
`src/pages/resources.astro`. Each card opens the gated form; on success the
visitor gets the download immediately.

1. Name the file `<slug>-<short hash>.pdf` — e.g.
   `rml-theory-of-change-worksheet-7f3a91.pdf`. Files in `public/` are served
   as-is and are technically public; the hash keeps the URL from being
   guessable off the card. Generate one with
   `openssl rand -hex 3`.
2. Drop it in `public/downloads/`.
3. Set that resource's `file` to `/downloads/<filename>` in the
   `featuredResources` array.
4. Commit and deploy — no other change is needed.

A resource whose `file` is `null` still captures the lead, but the card reads
"Sent by a consultant" and the confirmation promises a follow-up within one
business day instead of revealing a download. That is the correct state for a
toolkit that has not been cleared for publication yet — never point `file` at a
file that is not committed, or the download 404s after the visitor has already
handed over their details.

There is no automated email delivery: the HubSpot free tier has no workflow
automation, so the on-page reveal (or a consultant sending the file) is the
whole delivery mechanism.

### Changing the consultation payment link

`/consultations` offers two payment paths (BRIEF.md §6), deliberately of equal
weight — institutional clients usually cannot pay by card at all:

1. **Pay online** — a button to `PUBLIC_CONSULTATION_PAYMENT_URL`.
2. **Bank transfer / invoice** — the on-page request form at `#request-invoice`,
   posting to HubSpot. Always available.

To set or change the online payment link, edit `PUBLIC_CONSULTATION_PAYMENT_URL`
in `/var/www/resultsmatrix/.env` on the droplet and rebuild — no code change
required. Leave it unset or `#` and path 1 renders as "Online payment
integration coming soon" while path 2 keeps working.

Two rules that are not negotiable, both from the brief:

- **Banking details never appear on the site.** They go out with the invoice by
  email, after a request comes through the form.
- **The scheduling link is never rendered publicly.** It is sent to the payer
  once payment is confirmed. There is a marked `TODO` in
  `src/pages/consultations.astro` where a future payment-webhook function would
  mint a one-time booking link; that integration is explicitly out of scope.

### DNS cutover checklist (from old WordPress droplet)

_TODO (Phase 8): pre-flight acceptance checks, adding the custom domain to the
production app, DNS record changes, TLS, post-cutover verification, and
decommissioning the WordPress droplet. The old site stays live until the new
site passes acceptance on staging._
