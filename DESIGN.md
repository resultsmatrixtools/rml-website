---
name: Results Matrix Limited
description: Premium-firm restraint for a Caribbean development consultancy — cobalt authority, hairline precision, evidence-first.
colors:
  boardroom-blue: "#0057a8"
  deep-boardroom: "#0a2f5a"
  boardroom-ink: "#063a71"
  caribbean-teal: "#1d7a75"
  growth-green: "#78c275"
  ink-slate: "#334155"
  muted-slate: "#475569"
  hairline: "#e2e8f0"
  surface-white: "#ffffff"
  mist-blue: "#eff6fc"
typography:
  display:
    fontFamily: "'Montserrat', 'Segoe UI', system-ui, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 1.3rem + 4vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Montserrat', 'Segoe UI', system-ui, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "'Montserrat', 'Segoe UI', system-ui, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  prose:
    fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "'Montserrat', 'Segoe UI', system-ui, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "0.25rem"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.boardroom-ink}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "#02458c"
  button-outline:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-slate}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
---

# Design System: Results Matrix Limited

## 1. Overview

**Creative North Star: "The Evidence Chamber"**

The interface is rigor made visible. Every surface behaves like a well-prepared
evidence base: flat, precisely ruled, unhurried, with nothing decorative
standing between the reader and the finding. The register is premium-firm
restraint — confident whitespace, strong typographic hierarchy, quietly
expensive — calibrated for procurement officers and permanent secretaries who
equate polish with competence. Color is inherited from the RML logo, not
invented: cobalt Boardroom Blue carries authority, Caribbean Teal appears as a
measured secondary voice, and the logo's lime Growth Green is quarantined to
data contexts where growth is literally what is being shown.

This system explicitly rejects the startup-flashy vocabulary (gradient
theatrics, animated counters, urgency patterns), the broken Elementor
aesthetic it replaces (widget clutter, orphaned fragments, wall-of-bullets),
and the generic template-consultancy look of stock-photo handshakes and empty
superlatives. Restraint here is a strategic claim: the design must survive the
scrutiny of an institutional buyer.

**Key Characteristics:**
- Flat, hairline-separated surfaces; shadows reserved for true overlays
- Deep cobalt panels (hero, footer) bracketing white working space
- One accent at a time; color always means something
- Color-shift hover feedback; movement only at entrances (The Entrance-Only Rule)
- WCAG 2.1 AA contrast as a floor, not a target

## 2. Colors

A two-voice palette drawn directly from the RML logo — cobalt blue in
command, teal in support — over cool slate neutrals.

### Primary
- **Boardroom Blue** (#0057a8): The brand's voice, sampled from the logo's
  arrow and wordmark. Links, active states, and brand moments on white. Its
  dark ramp does the heavy lifting: **Boardroom Ink** (#063a71) is the
  primary button fill, and **Deep Boardroom** (#0a2f5a) is the hero and
  footer panel ground.
- **Mist Blue** (#eff6fc): The only tinted background; quiet zones and
  active-state washes.

### Secondary
- **Caribbean Teal** (#1d7a75): Secondary emphasis — active nav states,
  inline link accents, the "Limited" wordmark note. Sampled from the logo
  grid's mid-band (#2b968f) and darkened to hold 4.5:1 on white.

### Tertiary
- **Growth Green** (#78c275): The logo grid's lime corner. Restricted to
  data visualizations, diagrams, and chart accents.

### Neutral
- **Ink Slate** (#334155): Body text on white.
- **Muted Slate** (#475569): Secondary text; never lighter than this on white.
- **Hairline** (#e2e8f0): Borders, dividers, and card outlines.
- **Surface White** (#ffffff): The working ground.

### Named Rules
**The Growth Restriction Rule.** Growth Green never appears on buttons,
links, navigation, headings, or backgrounds. It exists only inside data — 
charts, diagrams, the logo itself. If it's UI chrome, it isn't green.

**The One Voice Rule.** Blue is the brand's voice; teal is a supporting
remark. Teal covers at most 10% of any screen and never competes with blue
on the same element.

## 3. Typography

**Display & UI Font:** Montserrat (variable, self-hosted; Segoe UI /
system-ui fallback) — the brand logo's own wordmark face.
**Prose Font:** Source Serif 4 (variable, self-hosted, roman + italic;
Georgia fallback) — transitional serif for long-form reading.

**Character:** The typography of a well-set briefing document. Montserrat's
geometry carries the firm's precision through headings, navigation, and
interface chrome, and ties every page to the logo lockup. Source Serif 4
gives service copy, About, blog posts, and the privacy policy the
report-grade reading voice institutional clients recognize — geometric sans
against transitional serif, contrast on a real axis. Both load as single
variable woff2 files (~140KB total, latin subset, `font-display: swap`,
preloaded in the base layout); no third-party font requests.

### Hierarchy
- **Display** (700, clamp(2.5rem, 1.3rem + 4vw, 3.75rem), 1.12, -0.025em):
  Hero headlines on Deep Boardroom panels — the `text-display` utility,
  fluid between viewports. White text; sized to command the panel without
  crowding it.
- **Headline** (700, 1.5rem, 1.3): Section heads on white, set in Deep
  Boardroom blue or Ink Slate. Montserrat.
- **Body** (400, 1rem, 1.625): Montserrat, Ink Slate on white, max 65–75ch.
  The site-wide default (set on `body`); interface copy, teasers, forms.
- **Prose** (400, 1.125rem, 1.7): Source Serif 4 via `font-serif` — article
  and long-form page copy only. Italic available for emphasis and titles.
- **Label** (600, 0.875rem, 0.05em tracking, uppercase): Tiny wayfinding
  only — footer column heads. Nowhere else. Montserrat.

### Named Rules
**The Quiet Caps Rule.** Uppercase tracked labels exist only as wayfinding
inside dense structures (the footer). Never as eyebrows above section
headings — sections open with the heading itself.

**The Report Rule.** Source Serif 4 is for reading, not chrome: multi-
paragraph prose (service pages, About, blog posts, policy) sets in serif;
headings, navigation, buttons, forms, cards, and captions stay Montserrat.
If it's interface, it isn't serif.

## 4. Elevation

The system is flat. Depth is conveyed by hairline borders (#e2e8f0), ground
changes (white ↔ Mist Blue ↔ Deep Boardroom), and nothing else. In-flow
elements never cast shadows.

### Shadow Vocabulary
- **Overlay lift** (`box-shadow: 0 -4px 16px rgba(13, 27, 43, 0.08)`): The
  consent banner's soft edge. The pattern for anything that floats over the
  page: consent banner, future dialogs and popovers. Ambient, never structural.

### Named Rules
**The Overlay-Only Rule.** A shadow is an admission that the element has
left the page flow. If it sits in the document, it separates with a hairline
or a ground change instead.

## 5. Components

Refined and restrained: minimal chrome, precise spacing. Hover feedback is
still color-shift-only at 150ms; movement exists, but only where something
arrives.

**The Entrance-Only Rule.** Motion happens exactly three ways: when a page
arrives (the home hero's load sequence — text rises in a 90ms stagger while
the Matrix motif plots itself: cells cascade up the diagonal at 35ms/step,
the trendline draws over 800ms linear, dots land as it passes), when
content arrives in view (hairline grids fade in once via scroll reveal,
400ms, ≤60ms stagger — cells fade only, headings may rise 12px), and when
an overlay arrives (the consent banner rises from its bottom edge, 300ms).
Plus one interactive exception: pressable CTAs compress to scale(0.98) at
150ms (the `.press` utility). Nothing moves on hover, nothing loops,
nothing counts up, nothing parallaxes, and reveals never re-fire. The one
easing is the strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`
(`--ease-out-strong`); constant-motion drawing uses linear.
`prefers-reduced-motion` reduces every entrance to a quick opacity fade
and disables the press scale — gentler, never zero.

### Buttons
- **Shape:** Barely-softened corners (0.25rem radius)
- **Primary:** Boardroom Ink (#063a71) fill, white 600-weight text,
  8px × 16px padding; hover shifts to #02458c. No shadows; the only
  transform is the 0.98 press compression (`.press`).
- **Hover / Focus:** Color transition (150ms); focus renders the global
  2px Caribbean Teal outline, offset 2px. Press compresses to scale(0.98)
  at 150ms, disabled under reduced motion.
- **Outline (secondary):** White fill, hairline slate border (#cbd5e1), Ink
  Slate text; hover washes the ground to slate-50.

### Cards / Containers
- **Corner Style:** 0.25rem
- **Background:** White, or Mist Blue (#eff6fc) for active/selected washes
- **Shadow Strategy:** None — see The Overlay-Only Rule
- **Border:** 1px Hairline (#e2e8f0)
- **Internal Padding:** 16–24px

### Navigation
- **Desktop:** Muted-slate 500-weight links that darken to Deep Boardroom on
  hover; the active page holds Caribbean Teal. "Contact us" is the one
  primary-button CTA in the bar.
- **Mobile:** Full-width panel below the sticky header; 44px touch targets,
  service sub-links indented beneath Services, active page washed Mist
  Blue/teal. Hamburger swaps to a close glyph; Escape closes and returns
  focus.

### Logo
Vector recreation of the brand logo (traced from the client's raster
original, wordmark set in Montserrat Bold, OFL) lives in `src/assets/logo/`:
`rml-logo.svg` (full lockup, light backgrounds), `rml-logo-reverse.svg`
(white/ice wordmark for Deep Boardroom grounds), `rml-mark.svg` (grid+arrow
mark alone — header, favicons, small sizes). Transparent 2× PNGs sit
alongside for non-SVG contexts. The header pairs the mark with a styled text
wordmark; the footer uses the reverse lockup.

### Matrix Motif (signature)
`src/components/MatrixMotif.astro` — "The Results Matrix": an abstract 6×6
measurement field derived from the logo grid. Flat cells step through the
logo's own ramp (deep boardroom → cobalt → teal → lime at the upper-right
corner) with hand-placed jitter so it reads as observed data; the logo's
white swoosh is abstracted into a rising trendline over measured points.
Growth Green appears under the data-context exemption — this is a diagram,
not chrome. Rules: individually flat-filled cells only (never a CSS
gradient), never labeled with axes or numbers (an unlabeled motif can't
become an invented chart), desktop-only decoration (`aria-hidden`), and it
lives on Deep Boardroom grounds. Home-hero signature; reuse sparingly.
Sanctioned derivative: the 2×2 process glyph (home "How we work") fills one
cell per step along the same ramp — lime lands only on the final cell,
because completion is where growth shows. Glyphs may encode true sequences
or progress; never decoration.

### Facts Strip (proof)
`src/components/FactsStrip.astro` — the proof-slot pattern made real:
client-cleared figures in a hairline gap-px grid (white cells on the
Hairline ground, Boardroom Ink values at 1.875rem/700, muted-slate labels).
Figures enter this component only with written clearance; an empty slot
always beats an invented number. Shared verbatim by home and About so the
site never states two versions of a fact.

### Consent Banner (signature)
Fixed bottom overlay on white with the overlay-lift shadow: one sentence of
plain-language copy, a privacy link, Decline (outline) and Accept (primary)
side by side. The pattern template for any future floating surface.

## 6. Do's and Don'ts

### Do:
- **Do** hold body text at Ink Slate (#334155) or darker on white — 4.5:1 is
  the floor everywhere, including placeholder text.
- **Do** bracket pages with Deep Boardroom panels (hero, footer) and keep
  the working middle white and generous.
- **Do** use hairline borders and ground changes for every in-flow
  separation.
- **Do** keep hover feedback to color shifts at 150ms with visible teal
  focus outlines — movement belongs to entrances and the press only (The
  Entrance-Only Rule).
- **Do** leave clearly marked slots for proof (client names, testimonials)
  — and leave them empty until clearance.

### Don't:
- **Don't** use gradient theatrics, animated counters, or growth-hacking
  urgency patterns — the site must never read "startup-flashy".
- **Don't** recreate the Elementor failure it replaces: widget clutter,
  orphaned fragments, wall-of-bullets pages.
- **Don't** use stock-photo handshakes or empty superlatives.
- **Don't** put Growth Green on any interactive or structural element (The
  Growth Restriction Rule).
- **Don't** use colored side-stripe borders, gradient text, or glassmorphism
  anywhere.
- **Don't** add uppercase eyebrow labels above section headings (The Quiet
  Caps Rule).
- **Don't** animate hover states, loop ambient motion, re-fire reveals, or
  scroll-jack — and never ship an entrance without its reduced-motion
  opacity fallback.
- **Don't** invent client names, credentials, statistics, or project claims
  — an empty proof slot is always better than a fabricated one.
