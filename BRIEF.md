# Build Brief: resultsmatrix.com Rebuild

**Client:** Results Matrix Limited (RML) — Caribbean development solutions firm across four practice areas: Strategy & Advisory, Research & Data Analytics, Monitoring, Evaluation & Learning (MEL), and ICT Consulting, Project Management & Systems Development
**Replaces:** WordPress/Elementor site on DigitalOcean (broken header/footer, plugin rot)
**Objective:** Modern, fast, zero-maintenance static site that positions RML credibly with government ministries, international development organizations (UNICEF, UNFPA, UNDP, EU/RESEMBID, CDB), and private-sector clients — and functions as a lead-generation engine.

---

## 1. Tech Stack (fixed decisions — do not substitute)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Astro** (latest stable) | Static output only (`output: 'static'`). No SSR. |
| Styling | **Tailwind CSS** | Via official Astro integration. |
| Blog | **Astro Content Collections** | Markdown files in `src/content/blog/`. |
| CMS | **Sveltia CMS** (fall back to Decap CMS if Sveltia blocks) | Admin at `/admin`. Git-backed. Editorial workflow enabled. |
| Auth for CMS | GitHub OAuth via a small self-hosted OAuth proxy | Deployable as a DigitalOcean Function or on existing droplet. |
| CRM / forms | **HubSpot free tier** | Forms Submission API v3 (custom-styled forms, no embedded HubSpot widgets). Site-wide tracking script. |
| Payments (online) | **eZeePayments or WiPay** — decision pending; external payment link | Site links out via env var; no payment processing in the codebase. Swappable without code changes. |
| Payments (offline) | Bank transfer / invoice — request form on site | Consultation-request HubSpot form; invoicing and confirmation handled manually off-site. |
| Scheduling | HubSpot free meeting scheduler link (external) | Delivered post-payment; not on public nav. |
| Hosting | **DigitalOcean App Platform** — static site | Auto-deploy from GitHub `main`. `staging` branch → staging app. |
| Repo | GitHub, private | `main` = production, `staging` = preview. |

**Explicitly out of scope:** WordPress migration tooling, databases, SSR, user accounts on the public site, payment webhooks/one-time booking links (may come later — leave a TODO comment where the consultation confirmation logic would hook in), any paid SaaS beyond the free tiers named above.

---

## 2. Site Structure

```
/                → Home
/services                    → Practice areas overview
/services/strategy-advisory  → Strategy & Advisory
/services/research-analytics → Research and Data Analytics
/services/mel                → Monitoring, Evaluation, and Learning (MEL)
/services/ict-systems        → ICT Consulting, Project Management & Systems Development
/work            → Selected engagements / case summaries
/about           → Firm profile, principal consultant
/blog            → Listing (paginated), tags
/blog/[slug]     → Individual posts
/resources       → Downloadable materials (gated — see §5)
/consultations   → Paid advisory sessions offer (see §6)
/contact         → Contact form
/privacy         → Privacy & cookie policy (required by HubSpot tracking)
/admin           → Sveltia/Decap CMS (noindex)
404              → Custom page
```

**Content migration — source inventory and per-page instructions:**

Source pages on the live site (fetch these for the copy; the `?page_id=` URLs redirect to canonical paths):

| Source | Canonical URL | New route | Treatment |
|---|---|---|---|
| Home (page_id=1612) | resultsmatrix.com/ | `/` | Rework (see below) |
| Strategy & Advisory (1495) | /strategy-and-advisory/ | `/services/strategy-advisory` | Port with restructuring |
| Research & Data Analytics (1516) | /services-research-and-data-analytics/ | `/services/research-analytics` | Port with restructuring |
| MEL (1363) | /services-monitoring-evaluation-and-learning/ | `/services/mel` | Port with restructuring |
| — (new) | — | `/services/ict-systems` | New — use **Appendix C** |
| About Us (1771) | /about-us/ | `/about` | Port + expand (client TODOs) |
| Contact (84) | /contact-layout-2/ | `/contact` | Port form fields |
| Privacy Policy (3) | /privacy-policy/ | `/privacy` | **Do not port — rewrite** |

- **Home:** Keep hero headline ("Our Expertise, Your Insights for Action") and subhead, and update the practice-area teaser section from three to **four** cards (add ICT Consulting, Project Management & Systems Development). Keep the positioning paragraph but broaden its practice-area list to four. **Drop entirely:** the "Your Business is Our Business" heading, the broken "0 %" counter, and the orphaned "Client Focused / Data / Strategic / Global" widget fragments — these are Elementor debris, not content. Add a CTA band linking to `/consultations` and `/resources`.
- **Four service pages:** The three ported pages' copy is strong and comprehensive — preserve substance verbatim where possible. The presentational problem is wall-of-bullets: render each sub-service block (e.g. "Baseline Studies", "Theory of Change Development") as an expandable card/accordion with the intro paragraph and Value Proposition always visible. Keep every "Value Proposition" line — they carry the differentiation. Keep OECD-DAC, SIDS, and Caribbean-context references intact. The new fourth page (Appendix C) follows the same accordion pattern and Value Proposition convention for consistency. Each page ends with a contact CTA (replacing the repeated "Get in touch" links).
- **About:** Use the final copy in **Appendix A** as written. Bracketed fields (client list clearance, principal profile) must be resolved by the client before launch — do not launch with placeholders visible. Move phone (876 298 6545) and email into the global footer.
- **Contact:** Rebuild the form with the existing fields — name, email, organization, phone, industry dropdown (Healthcare, Government, Shipping and Logistics, Non-governmental Organizations, Education), subject, message — mapped to HubSpot contact properties (industry as a dropdown property). Keep the "schedule a free discovery session" framing.
- **Privacy Policy:** Do not port the existing page (generator boilerplate that misstates actual practices). Publish the new policy in **Appendix B** at `/privacy`, inserting the launch date. Requires legal review before DNS cutover.
- **New pages with no existing copy** (`/resources`, `/consultations`, `/work`): scaffold with structure and placeholder copy clearly marked for client replacement. If `/work` has no approved case content at launch, exclude it from nav rather than shipping a thin page.

---

## 3. Design Direction

- Audience is government and international development decision-makers: the register is **credible, precise, quietly confident** — not startup-flashy.
- Clean typographic hierarchy, generous whitespace, restrained palette (derive from existing RML brand colours if extractable; otherwise propose a deep blue/teal professional palette and flag for approval).
- Fully responsive; mobile nav must be flawless (the current site's broken header is the reason this project exists — treat header/footer as first-class deliverables with tests).
- Performance budget: Lighthouse ≥ 95 across the board on production build. No render-blocking third-party scripts except the HubSpot tracker (load deferred, after consent).
- Accessibility: WCAG 2.1 AA basics — semantic landmarks, focus states, contrast, alt text enforced in CMS config.

---

## 4. Blog & Editorial Workflow

**Roles: exactly one writer, one reviewer.**

- Content collection schema (`src/content/config.ts`): `title`, `description`, `pubDate`, `updatedDate?`, `author`, `tags[]`, `heroImage?`, `draft` (boolean, default `true`).
- `draft: true` posts are excluded from production builds but render on staging.
- Sveltia/Decap config:
  - `publish_mode: editorial_workflow` — posts move Draft → In Review → Ready; merges to `main` only on approval.
  - Writer and reviewer authenticate with their GitHub accounts (add both as repo collaborators; reviewer needs merge rights, writer does not).
  - Media library commits images to `src/assets/blog/`; enforce alt-text field.
- Generate: blog index with pagination, per-tag pages, RSS feed (`@astrojs/rss`), and OG images (static template acceptable; dynamic OG generation is a nice-to-have, not required).
- OAuth proxy: deploy the standard Decap/Sveltia GitHub OAuth handler as a DigitalOcean Function (or container on the existing droplet). Document the GitHub OAuth App setup steps in the README with exact callback URLs for production and staging.

---

## 5. Lead Capture & Gated Downloads (HubSpot)

- **Site-wide:** HubSpot tracking script in the base layout, loaded **only after cookie consent**. Implement a lightweight consent banner (no third-party consent SaaS) with accept/decline persisted in `localStorage` — note: consent state is the one legitimate localStorage use; everything else stays static.
- **Contact form (`/contact`):** custom Tailwind form → POST to HubSpot Forms Submission API v3 (`/submissions/v3/integration/submit/{portalId}/{formGuid}`). Include the `hutk` cookie in `context` when present. Honeypot field for spam. Portal ID and form GUIDs supplied via environment variables at build time.
- **Gated downloads (`/resources`):** each resource card opens a short form (name, organization, email + hidden `resource_slug` field mapped to a HubSpot contact property). On successful submission, reveal the download link on-page immediately (no email delivery — free tier has no workflow automation). PDFs live in `public/downloads/`; keep URLs unguessable-ish (slug + short hash) since they are technically public.
- Client-side JS for forms only — small vanilla or Astro island; no React runtime unless genuinely needed.

---

## 6. Paid Consultations Page

- `/consultations`: describes short "help desk" advisory sessions (M&E focus), pricing, what's included, and **two clearly presented payment paths**:
  1. **Pay online** — button linking to an external payment link (`PUBLIC_CONSULTATION_PAYMENT_URL`, provider TBD: eZeePayments or WiPay). If the env var is unset or `#`, render this option as "Online payment coming soon" and show only path 2.
  2. **Pay by bank transfer / request an invoice** — a consultation-request form (name, email, organization, phone, preferred session focus, payment method preselected as "Bank transfer/invoice") posting to HubSpot via Forms API (`PUBLIC_HUBSPOT_FORM_GUID_CONSULT`). Confirmation message on submit: "We'll send your invoice and banking details within one business day; your booking link follows once payment is confirmed." Do NOT publish banking details on the site.
- Copy must state both flows plainly: pay (either path) → receive scheduling link → book your slot. The scheduling link itself is **never** rendered on the public site.
- The offline path is not a fallback — institutional clients (ministries, IDOs) typically pay by invoice/transfer only. Give it equal visual weight.
- Leave a marked TODO where a future payment-webhook → one-time-booking-link function would integrate. Do not build it now.

---

## 7. SEO & Analytics

- Per-page titles/descriptions, canonical URLs, OpenGraph + Twitter cards, JSON-LD (`Organization` on home, `Article` on posts), `sitemap` integration, `robots.txt` (exclude `/admin`).
- HubSpot tracking doubles as analytics; no Google Analytics.

---

## 8. Delivery & Acceptance

**Phased build (commit per phase, keep staging deployable throughout):**
1. Scaffold: Astro + Tailwind + repo + DO App Platform wiring (main + staging).
2. Layout system: header, footer, nav (desktop + mobile), base layout, consent banner.
3. Core pages with migrated copy.
4. Blog: collections, listing, post template, RSS, tags.
5. CMS: Sveltia config, editorial workflow, OAuth proxy, role documentation.
6. HubSpot: tracker, contact form, gated resources.
7. Consultations page.
8. SEO pass, Lighthouse tuning, accessibility audit, 404, favicons.

**Acceptance criteria:**
- Header and footer render on every page, every viewport. (Non-negotiable.)
- Writer can log in at `/admin`, draft a post with images, submit for review; reviewer can approve and the post goes live on `main` deploy — with no Git knowledge required of the writer.
- Contact and resource form submissions appear as contacts in HubSpot with correct property mapping and tracking association.
- Draft posts visible on staging, absent from production.
- Lighthouse ≥ 95 (Performance, Accessibility, Best Practices, SEO) on home and a blog post.
- README documents: env vars, OAuth app setup, HubSpot form GUID setup, how to add a resource PDF, how to change the payment link, and the DNS cutover checklist from the old WordPress droplet.

**Environment variables (build-time):**
`PUBLIC_HUBSPOT_PORTAL_ID`, `PUBLIC_HUBSPOT_FORM_GUID_CONTACT`, `PUBLIC_HUBSPOT_FORM_GUID_RESOURCE`, `PUBLIC_HUBSPOT_FORM_GUID_CONSULT`, `PUBLIC_CONSULTATION_PAYMENT_URL`, `PUBLIC_SITE_URL`.

**DNS cutover:** document but do not execute — old WordPress site stays live until the new site passes acceptance on staging.

---

## Appendix A — About Page Copy (final draft; bracketed fields require client input)

> Implementation note: this replaces the "port + expand" instruction in §2. Use this copy as written. Bracketed `[...]` fields and flagged items must be confirmed by the client before launch.

### About Results Matrix

**Results Matrix Limited (RML)** is a Caribbean-based development solutions firm providing comprehensive consulting services across three integrated practice areas: **Strategy & Advisory**, **Research and Data Analytics**, and **Monitoring, Evaluation, and Learning (MEL)**.

We serve governments, regional organizations, international development organizations, NGOs, foundations, and social enterprises throughout the Caribbean and beyond, delivering evidence-based solutions that drive measurable development outcomes.

Unlike consulting firms that parachute in for short-term assignments, we bring sustained regional presence and intimate knowledge of Caribbean institutional landscapes, development challenges, and opportunities. We are not visitors to the Caribbean — we are part of the regional development ecosystem.

### Our Mission

To strengthen development outcomes across the Caribbean through consulting services that combine international excellence with deep regional expertise — delivering strategic planning, rigorous research, and world-class monitoring and evaluation that drive evidence-based decision-making.

### What Sets Us Apart

**Caribbean SIDS Specialization.** We understand the unique challenges facing Small Island Developing States — from climate vulnerability to middle-income classification constraints, Westminster parliamentary systems to regional development dynamics — because we live and work in this context daily.

**Integrated Practice Areas.** Strategy, research, and MEL are not separate silos at RML — they are one connected capability. The evidence our research generates feeds directly into the strategies we help design, and the M&E systems we build ensure those strategies are tracked, learned from, and adapted. Clients get coherence that fragmented, single-specialty engagements cannot deliver.

**Senior-Led, Technology-Enabled Delivery.** Every engagement is led by senior consultants — the people you meet in the proposal are the people who do the work. We pair that experience with modern tooling: interactive dashboards, mobile data collection, and information systems designed for the realities of Caribbean connectivity and capacity.

**Built for Use, Not for Shelves.** Every deliverable is designed around the decision it must inform. Our reports, frameworks, and systems are formatted for the officials, boards, and development partners who must act on them — practical, decision-ready, and sustainable within your team's capacity.

### Who We Work With

Our consultants have delivered engagements for and alongside government ministries, regional institutions, and international development partners including [Ministry of Health and Wellness (Jamaica), UNICEF, UNFPA, UNDP, the European Union / RESEMBID programme, and the Caribbean Development Bank]. <!-- TODO: client must confirm clearance to name each organization publicly; remove any not cleared -->

### Leadership

Curline Beckford, Senior RBM Consultant, leads RML's consulting practice with 20+ years of experience spanning Strategic Planning and Monitoring & Evaluation across the Caribbean. She holds MSc in International Business and has served as a boarad member of the Caribbean Evaluators International since xxx. <!-- TODO: client to supply profile details; do not launch with placeholders visible -->

*(Contact details — 876 298 6545, info@resultsmatrix.com — live in the global footer, not this page.)*

---

## Appendix B — Privacy Policy (new draft; replaces existing policy entirely)

> Implementation note: publish at `/privacy`. This draft reflects what the new site actually does and is anchored to the Jamaica Data Protection Act. **Requires legal review before launch.** Separately (outside this build): as a data controller under the DPA, RML should confirm its registration status with the Office of the Information Commissioner. <!-- TODO: legal review; confirm OIC registration -->

### Privacy Policy

**Effective date: July 18, 2026**

Results Matrix Limited ("RML", "we", "us") operates the website resultsmatrix.com (the "Site"). This policy explains what personal data we collect through the Site, why we collect it, how we protect it, and the rights you have over it.

We are the data controller for personal data collected through this Site:

**Results Matrix Limited** · Jamaica · info@resultsmatrix.com

#### What we collect

**Information you provide.** When you submit our contact form, request a downloadable resource, or book a consultation, we collect the details you enter: name, email address, organization, phone number, industry, and the content of your message. When you request a resource, we also record which resource you requested.

**Information collected automatically.** With your consent, the Site uses HubSpot's tracking cookie to collect usage data: pages visited, time on page, referring site, approximate location (from IP address), browser and device type. If you decline cookies via our consent banner, this tracking does not run. The Site also uses strictly necessary local storage to remember your consent choice.

We do **not** use advertising cookies, behavioral remarketing, or analytics beyond the above. We do not knowingly collect sensitive personal data through this Site, and no form on this Site asks for it.

#### Why we collect it and how we use it

We use personal data to: respond to your enquiries; deliver resources you request; schedule and administer consultations you book; send you relevant materials or updates where you have opted in (you can unsubscribe at any time via the link in any such email); and understand how the Site is used so we can improve it.

We process this data on the basis of your consent (tracking, marketing), the steps needed to respond to your request or enter into an engagement with you (enquiries, bookings), and our legitimate interest in operating and improving the Site.

We do not sell personal data.

#### Where your data goes

- **HubSpot** (our customer relationship management and forms provider) stores form submissions and, with consent, tracking data on our behalf. HubSpot stores data on servers located outside Jamaica (United States / European Union) under its own security and data-processing commitments.
- **Our hosting provider** (DigitalOcean) serves the Site and processes standard server logs.
- **Payment for consultations** is handled by our payment provider on its own platform; card details are entered there, never on this Site, and we never see or store them.

We share personal data with no other third parties except where required by law or valid order of a public authority.

If you access the Site from outside Jamaica, you understand that your data will be processed in Jamaica and in the jurisdictions where our service providers named above operate.

#### How long we keep it

We retain contact and enquiry records for as long as needed to handle your request and maintain our business relationship, and thereafter only as required for legal, accounting, or contractual purposes. Usage data is retained in aggregate form. You may request deletion at any time (see below).

#### Your rights under the Jamaica Data Protection Act

The Data Protection Act, 2020 gives you rights over your personal data, including the right to:

- be informed about how your data is processed (this policy);
- access a copy of the personal data we hold about you;
- have inaccurate data corrected, and in appropriate cases blocked, erased, or destroyed;
- object to processing for direct marketing purposes, which we will honor without exception;
- object to processing likely to cause you damage or distress;
- not be subject to decisions based solely on automated processing (we make none).

To exercise any of these rights, email **info@resultsmatrix.com**. We may ask you to verify your identity before acting on a request. You also have the right to lodge a complaint with Jamaica's **Office of the Information Commissioner**.

#### Visitors from the EU/EEA and UK

If the GDPR or UK GDPR applies to you, you have equivalent rights of access, rectification, erasure, restriction, portability, and objection, and the right to withdraw consent at any time without affecting prior processing. You may complain to your local supervisory authority. The legal bases described above (consent, contract, legitimate interests) apply to your data in the same way.

#### Security

We protect personal data through access controls, encrypted transmission (HTTPS), and reputable service providers. No internet transmission or storage method is completely secure, and we cannot guarantee absolute security, but we take commercially reasonable measures and will notify affected individuals and regulators of any breach as required by law.

#### Children

The Site is not directed at children under 18 and we do not knowingly collect their personal data. If you believe a child has provided us personal data, contact us and we will delete it.

#### Changes to this policy

We may update this policy from time to time. Material changes will be posted on this page with a revised effective date.

#### Contact

Questions about this policy or your personal data: **info@resultsmatrix.com**.

---

## Appendix C — ICT Consulting, Project Management & Systems Development (new service page copy)

> Implementation note: publish at `/services/ict-systems`, following the same structure and accordion pattern as the three existing service pages (intro paragraph, sub-service blocks with Value Proposition lines, closing CTA). Bracketed fields require client confirmation before launch — same treatment as Appendix A.

### ICT Consulting, Project Management & Systems Development

RML designs, builds, and manages information systems for organizations that cannot afford downtime, data loss, or a system nobody ends up using. This practice area sits alongside our Strategy & Advisory, Research & Data Analytics, and MEL work — and in most engagements, feeds directly into them: the systems we build are the ones that generate the data our M&E and research practices analyze.

**Core Services**

**ICT Strategy & Advisory.** We help organizations plan technology investments that match institutional capacity — not just what's technically possible, but what a team can realistically operate, maintain, and afford once the consultants leave. This includes systems assessments, digital transformation roadmaps, and vendor/technology selection support.
*Value Proposition:* Recommendations grounded in Caribbean institutional realities — bandwidth constraints, staffing levels, procurement cycles — rather than best-practice templates designed for better-resourced environments.

**Systems Development.** We design and build custom software: web applications, data platforms, and integrations between systems that were never meant to talk to each other. Recent and ongoing work spans multi-tenant government platforms, monitoring & evaluation software, and system-to-system integrations connecting enterprise and operational systems.
*Value Proposition:* Senior-led development — the person who scopes the system is the person who builds it — with modern, maintainable architecture chosen for longevity, not novelty.

**Health Information Systems.** A specialized strand of our systems work: supporting electronic health record implementation and interoperability between health information systems and laboratory/clinical platforms.
*Value Proposition:* Direct experience with the coordination challenge health information systems present — aligning multiple institutions, vendors, and clinical workflows around a single integration, not just the technical build.

**Project Management.** We manage ICT and development projects end-to-end: scoping, documentation (terms of reference, requirements, process documentation), stakeholder coordination across technical and non-technical parties, and delivery oversight through go-live.
*Value Proposition:* Process documentation and project artifacts built to the standard of institutional review from day one — not retrofitted for a ministry or development-partner audit after the fact.

**Systems Integration.** Where organizations run multiple systems — an ERP, a maintenance platform, a legacy database — that need to exchange data reliably, we document the workflow, design the integration approach, and manage the transition, including interim manual-process controls while a permanent integration is built.
*Value Proposition:* We document the *process*, not just the data flow — approval controls, exception handling, and monitoring responsibilities are designed in from the start, not discovered after go-live.


*(Contact details live in the global footer.)*
