/**
 * The services RML sells, as published by the CRM (PRISM `crm-services`).
 *
 * Pure helpers only: no environment, no network, no DOM. Fetching lives in
 * services-feed.ts. Everything here is covered by services.test.ts.
 *
 * Prices are for display. The amount charged is always worked out again by the
 * CRM when a request comes in, from the service id, the organization type and
 * the extras chosen (see lead-capture), so nothing here is ever sent as a price.
 */

export type OrgType = 'standard' | 'ngo';

/** Wording for the organization-type choice. One place to change it. */
export const ORG_TYPES: readonly { value: OrgType; label: string; short: string; note: string }[] = [
  { value: 'standard', label: 'Government, private sector or other', short: 'Standard price', note: 'Showing standard prices.' },
  { value: 'ngo', label: 'NGO or non-profit', short: 'NGO or non-profit price', note: 'Showing NGO and non-profit prices.' },
];

export interface ServiceAddon {
  id: string;
  name: string;
  price: number;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  summary: string;
  /** Paragraphs, already split. Empty means the section is left out. */
  description: string[];
  deliveryDays: number | null;
  /** No fixed price: the visitor asks for a proposal. */
  quoted: boolean;
  /** Billed monthly rather than once. */
  recurring: boolean;
  /** Null for a quoted service. */
  price: { standard: number; ngo: number } | null;
  addons: ServiceAddon[];
  /** "What you receive". */
  deliverables: string[];
  /** "What to bring". */
  bring: string[];
}

export interface ServiceFeed {
  currency: 'USD' | 'JMD';
  services: Service[];
  /** How many entries in the feed were unusable and left out. */
  dropped: number;
}

type Raw = Record<string, unknown>;
const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim()) : [];
/** Lowercase words joined by single hyphens: safe as a URL path and as a file name. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Ids travel in a comma-separated list, so they may not contain a comma or anything odd. */
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const money = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;

/** Reads one service from the feed, or null when it is unusable. */
export function parseService(raw: unknown): Service | null {
  if (!isObject(raw)) return null;
  const id = str(raw.id);
  const slug = str(raw.slug);
  const name = str(raw.name);
  if (!ID.test(id) || !SLUG.test(slug) || !name) return null;

  const quoted = raw.quoted === true;
  let price: Service['price'] = null;
  if (!quoted) {
    if (!isObject(raw.price)) return null; // a fixed-price service with no price is never shown
    const standard = money(raw.price.standard);
    const ngo = money(raw.price.ngo);
    if (standard === null || ngo === null) return null;
    price = { standard, ngo };
  }

  const addons: ServiceAddon[] = [];
  for (const a of Array.isArray(raw.addons) ? raw.addons : []) {
    if (!isObject(a)) continue;
    const addonPrice = money(a.price);
    if (ID.test(str(a.id)) && str(a.name) && addonPrice !== null) addons.push({ id: str(a.id), name: str(a.name), price: addonPrice });
  }

  const days = raw.delivery_days;
  return {
    id,
    slug,
    name,
    summary: str(raw.summary),
    description: strings(raw.description),
    deliveryDays: typeof days === 'number' && Number.isInteger(days) && days > 0 ? days : null,
    quoted,
    recurring: raw.recurring === true,
    price,
    addons,
    deliverables: strings(raw.deliverables),
    bring: strings(raw.bring),
  };
}

/** Reads the whole feed. Throws on a shape that is not a feed at all; drops single bad services. */
export function parseFeed(raw: unknown): ServiceFeed {
  if (!isObject(raw) || !Array.isArray(raw.services)) throw new Error('The services feed is not in the expected shape');
  const currency = raw.currency === 'JMD' ? 'JMD' : raw.currency === 'USD' ? 'USD' : null;
  if (!currency) throw new Error('The services feed has an unknown currency');
  const services: Service[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  for (const entry of raw.services) {
    const service = parseService(entry);
    // A repeated id or slug would make one page silently overwrite another.
    if (!service || seenIds.has(service.id) || seenSlugs.has(service.slug)) continue;
    seenIds.add(service.id);
    seenSlugs.add(service.slug);
    services.push(service);
  }
  const dropped = raw.services.length - services.length;
  // A feed that lists services but yields none means the shape changed, not that nothing is for sale.
  if (raw.services.length > 0 && services.length === 0) {
    throw new Error('Every service in the feed was unusable; the feed shape has probably changed');
  }
  return { currency, services, dropped };
}

/** Slugs the site already uses under /consultations/. A service with one of these is left out. */
export const RESERVED_SLUGS: readonly string[] = ['thanks', 'widget-test'];

export function routableServices(services: Service[]): Service[] {
  return services.filter((s) => !RESERVED_SLUGS.includes(s.slug));
}

const SYMBOL: Record<ServiceFeed['currency'], string> = { USD: 'US$', JMD: 'J$' };

export function formatMoney(amount: number, currency: ServiceFeed['currency']): string {
  const whole = Number.isInteger(amount);
  const text = amount.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${SYMBOL[currency]}${text}`;
}

export function priceFor(service: Service, org: OrgType): number | null {
  if (!service.price) return null;
  return org === 'ngo' ? service.price.ngo : service.price.standard;
}

/** The chosen price plus the extras ticked. Null for a quoted service. Unknown extra ids are ignored. */
export function totalFor(service: Service, org: OrgType, addonIds: string[]): number | null {
  const base = priceFor(service, org);
  if (base === null) return null;
  const cents = service.addons
    .filter((a) => addonIds.includes(a.id))
    .reduce((sum, a) => sum + Math.round(a.price * 100), 0);
  return (Math.round(base * 100) + cents) / 100;
}

/** True when the two organization types pay different amounts for this service. */
export function pricesDiffer(service: Service): boolean {
  return service.price !== null && service.price.ngo !== service.price.standard;
}

export function deliveryLabel(service: Service): string {
  if (service.recurring) return 'Billed monthly';
  if (service.deliveryDays) return `${service.deliveryDays} working days`;
  return 'Scoped to your brief';
}
