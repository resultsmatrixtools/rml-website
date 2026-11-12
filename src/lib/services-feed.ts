/**
 * Loads the services at build time from the CRM's public `crm-services` feed.
 *
 * The site is static: pages are generated once per build, so a change made in
 * the CRM reaches the site on the next build (the deploy script rebuilds when
 * the feed changes; see scripts/cron_deploy.sh).
 *
 * Failure rules, because a build that quietly publishes an empty services page
 * is worse than one that stops:
 *   - no feed address configured (local work, no CRM): an empty list, with a note;
 *   - the feed cannot be read or is malformed: the build fails, loudly.
 */

import { parseFeed, routableServices, type ServiceFeed } from './services';

const TIMEOUT_MS = 15_000;

/** PUBLIC_CRM_SERVICES_URL, or the lead-capture address with its last segment swapped. */
export function servicesFeedUrl(): string {
  const explicit: string = import.meta.env.PUBLIC_CRM_SERVICES_URL ?? '';
  if (explicit) return explicit;
  const capture: string = import.meta.env.PUBLIC_CRM_ENDPOINT ?? '';
  return capture.replace(/\/lead-capture\/?$/, '/crm-services');
}

let cached: Promise<ServiceFeed> | undefined;

/** One fetch per build, shared by every page that needs the services. */
export function loadServices(): Promise<ServiceFeed> {
  cached ??= fetchServices();
  return cached;
}

async function fetchServices(): Promise<ServiceFeed> {
  const url = servicesFeedUrl();
  if (!url) {
    console.warn('[rml] No CRM address set (PUBLIC_CRM_ENDPOINT or PUBLIC_CRM_SERVICES_URL): building with no services.');
    return { currency: 'USD', services: [] };
  }
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    throw new Error(`Could not reach the services feed at ${url}: ${(error as Error).message}`);
  }
  if (!response.ok) throw new Error(`The services feed answered ${response.status}`);
  const feed = parseFeed(await response.json());
  return { ...feed, services: routableServices(feed.services) };
}
