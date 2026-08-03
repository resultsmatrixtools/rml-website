import type { APIRoute } from 'astro';
import { IS_PRODUCTION } from '../lib/site';

// Generated rather than static so staging can lock itself out of search
// indexes (BRIEF.md §8: drafts must never surface publicly) and so the
// sitemap URL always matches the origin this build was made for.
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site);

  const body = IS_PRODUCTION
    ? [
        'User-agent: *',
        'Allow: /',
        // The CMS is a client-rendered admin shell — nothing to index, and
        // crawling it wastes budget on a page that needs auth to do anything.
        'Disallow: /admin/',
        '',
        `Sitemap: ${sitemapUrl}`,
        '',
      ].join('\n')
    : ['# Non-production build — not for indexing.', 'User-agent: *', 'Disallow: /', ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
