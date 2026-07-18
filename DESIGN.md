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
    fontFamily: "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
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
- Refined, color-shift-only interaction feedback
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

**Display Font:** Segoe UI (system-ui, Helvetica Neue, Arial fallbacks)
**Body Font:** Same family — single-stack system typography.

**Character:** A deliberate interim choice: fast, native, and neutral while
the brand's licensed typeface decision is pending. Hierarchy is carried
entirely by weight and scale contrast (700 vs 400), which must stay legible
when a distinctive family replaces the stack.

### Hierarchy
- **Display** (700, clamp(2.25rem, 5vw, 3rem), 1.15, -0.025em): Hero
  headlines on Deep Boardroom panels. White text; add breathing room —
  light-on-dark needs the taller line-height.
- **Headline** (700, 1.5rem, 1.3): Section heads on white, set in Deep
  Boardroom blue or Ink Slate.
- **Body** (400, 1rem, 1.625): Ink Slate on white, max 65–75ch.
- **Label** (600, 0.875rem, 0.05em tracking, uppercase): Tiny wayfinding
  only — footer column heads. Nowhere else.

### Named Rules
**The Quiet Caps Rule.** Uppercase tracked labels exist only as wayfinding
inside dense structures (the footer). Never as eyebrows above section
headings — sections open with the heading itself.

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

Refined and restrained: minimal chrome, precise spacing, color-shift-only
feedback. Nothing moves except color, and every state change runs through
the standard 150ms ease.

### Buttons
- **Shape:** Barely-softened corners (0.25rem radius)
- **Primary:** Boardroom Ink (#063a71) fill, white 600-weight text,
  8px × 16px padding; hover shifts to #02458c. No transforms, no shadows.
- **Hover / Focus:** Color transition (150ms); focus renders the global
  2px Caribbean Teal outline, offset 2px.
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
- **Do** keep interaction feedback to color shifts at 150ms with visible
  teal focus outlines.
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
- **Don't** invent client names, credentials, statistics, or project claims
  — an empty proof slot is always better than a fabricated one.
