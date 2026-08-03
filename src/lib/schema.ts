/**
 * JSON-LD builders (BRIEF.md §8, SEO pass).
 *
 * Every value here is a verified fact already published on the site — the
 * footer's contact details, the pages' own copy. Per CLAUDE.md, structured
 * data never asserts client names, credentials, awards, or statistics that
 * have not been cleared; those stay out of the graph until they are.
 */
import { ORGANIZATION_NAME, PRODUCTION_ORIGIN } from './site';

const abs = (path: string, site: URL | undefined) => new URL(path, site ?? PRODUCTION_ORIGIN).href;

const ORGANIZATION_ID = `${PRODUCTION_ORIGIN}/#organization`;

/** The firm itself. Emitted once, on the home page, and referenced by @id elsewhere. */
export function organizationSchema(site: URL | undefined, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: ORGANIZATION_NAME,
    alternateName: 'RML',
    url: abs('/', site),
    logo: abs('/icon-512.png', site),
    image: abs('/og-default.png', site),
    description,
    email: 'info@resultsmatrix.com',
    telephone: '+1-876-298-6545',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'JM',
    },
    areaServed: {
      '@type': 'Place',
      name: 'Caribbean',
    },
  };
}

/** Enables the sitelinks search box and names the site distinctly from the firm. */
export function webSiteSchema(site: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${PRODUCTION_ORIGIN}/#website`,
    name: ORGANIZATION_NAME,
    url: abs('/', site),
    inLanguage: 'en',
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/** A service RML offers, for the four practice-area pages. */
export function serviceSchema(
  site: URL | undefined,
  { name, description, path }: { name: string; description: string; path: string }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: abs(path, site),
    serviceType: name,
    provider: { '@id': ORGANIZATION_ID },
    areaServed: { '@type': 'Place', name: 'Caribbean' },
  };
}

export function blogPostingSchema(
  site: URL | undefined,
  post: {
    title: string;
    description: string;
    path: string;
    author: string;
    pubDate: Date;
    updatedDate?: Date;
    tags?: string[];
    image?: string;
  }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: abs(post.path, site),
    mainEntityOfPage: { '@type': 'WebPage', '@id': abs(post.path, site) },
    datePublished: post.pubDate.toISOString(),
    dateModified: (post.updatedDate ?? post.pubDate).toISOString(),
    author: { '@type': 'Person', name: post.author },
    publisher: { '@id': ORGANIZATION_ID },
    image: abs(post.image ?? '/og-default.png', site),
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
    inLanguage: 'en',
  };
}

/** Trail from the home page to the current page. Pass the intermediate crumbs only. */
export function breadcrumbSchema(
  site: URL | undefined,
  crumbs: { name: string; path: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...crumbs].map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: abs(crumb.path, site),
    })),
  };
}
