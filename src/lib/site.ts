/**
 * Environment identity for the current build (BRIEF.md §8).
 *
 * Staging and production are the same `astro build`; they differ only by
 * PUBLIC_SITE_URL, which the DO app specs set per environment. Anything
 * that isn't the production domain (staging app URL, local dev) is treated
 * as non-production: drafts render, and the build is kept out of search
 * indexes via robots.txt and a per-page `noindex` directive.
 */
export const PRODUCTION_ORIGIN = 'https://resultsmatrix.com';

const configuredOrigin = (import.meta.env.PUBLIC_SITE_URL ?? '').replace(/\/+$/, '');

export const IS_PRODUCTION = configuredOrigin === PRODUCTION_ORIGIN;

/** Legal name, used in JSON-LD and structured metadata. */
export const ORGANIZATION_NAME = 'Results Matrix Limited';

/** Short name for title suffixes and og:site_name. */
export const SITE_NAME = 'Results Matrix';

/** Effective date shown on every legal page. Bump when any policy text changes. */
export const LEGAL_EFFECTIVE_DATE = 'October 26, 2026';

/**
 * Online payment provider (eZeePayments or WiPay — BRIEF.md §1, undecided).
 * Replace with the provider's name once chosen; the legal pages read it from
 * here. Until then the bracketed text renders on purpose so it can't ship by
 * accident.
 */
export const PAYMENT_PROVIDER = '[Payment Provider]';
