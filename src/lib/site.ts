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
