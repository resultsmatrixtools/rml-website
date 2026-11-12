// Run with: npm test   (Node's built-in test runner; no extra dependencies)
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deliveryLabel, formatMoney, parseFeed, parseService, pricesDiffer, priceFor, routableServices, totalFor,
  type Service,
} from './services.ts';

const raw = (over: Record<string, unknown> = {}) => ({
  id: 'a1', slug: 'year-end-reporting-pack', name: 'Year-End Reporting Pack', summary: ' Short. ',
  description: ['One.', 'Two.'], delivery_days: 5, quoted: false, recurring: false,
  price: { standard: 2250, ngo: 1900 },
  addons: [{ id: 'x1', name: 'Board session', price: 400 }, { id: 'x2', name: 'Extra 2 reports', price: 750 }],
  deliverables: ['A report'], bring: ['A framework'], ...over,
});
const svc = (over: Record<string, unknown> = {}): Service => parseService(raw(over))!;

describe('parseService', () => {
  it('reads a service and trims its text', () => {
    const s = svc();
    assert.equal(s.summary, 'Short.');
    assert.deepEqual(s.price, { standard: 2250, ngo: 1900 });
    assert.equal(s.deliveryDays, 5);
    assert.equal(s.addons.length, 2);
  });
  it('drops a service with no id, slug or name', () => {
    assert.equal(parseService(raw({ id: '' })), null);
    assert.equal(parseService(raw({ slug: undefined })), null);
    assert.equal(parseService(raw({ name: '  ' })), null);
    assert.equal(parseService(null), null);
  });
  it('never shows a fixed-price service without a usable price', () => {
    assert.equal(parseService(raw({ price: null })), null);
    assert.equal(parseService(raw({ price: { standard: 'x', ngo: 1 } })), null);
    assert.equal(parseService(raw({ price: { standard: -1, ngo: 1 } })), null);
  });
  it('accepts a quoted service with no price', () => {
    const s = svc({ quoted: true, price: null });
    assert.equal(s.quoted, true);
    assert.equal(s.price, null);
  });
  it('skips a malformed extra but keeps the rest', () => {
    const s = svc({ addons: [{ id: 'x1', name: 'Good', price: 5 }, { id: '', name: 'No id', price: 1 }, { id: 'x3', name: 'Bad', price: 'free' }] });
    assert.deepEqual(s.addons, [{ id: 'x1', name: 'Good', price: 5 }]);
  });
  it('treats missing copy as empty so the page can leave the section out', () => {
    const s = svc({ description: undefined, deliverables: undefined, bring: undefined, summary: undefined });
    assert.deepEqual([s.summary, s.description, s.deliverables, s.bring], ['', [], [], []]);
  });
  it('refuses a slug or id that is not safe as a path or in a comma list', () => {
    for (const slug of ['Has Caps', 'a/b', '../x', 'a b', '-lead', 'trail-', 'double--hyphen', '']) {
      assert.equal(parseService(raw({ slug })), null, `slug ${slug}`);
    }
    assert.equal(parseService(raw({ id: 'has,comma' })), null);
    const s = svc({ addons: [{ id: 'bad,id', name: 'Extra', price: 5 }, { id: 'ok-1', name: 'Fine', price: 5 }] });
    assert.deepEqual(s.addons.map((a) => a.id), ['ok-1']);
  });
  it('ignores a delivery time that is not a positive whole number', () => {
    assert.equal(svc({ delivery_days: 0 }).deliveryDays, null);
    assert.equal(svc({ delivery_days: 2.5 }).deliveryDays, null);
  });
});

describe('parseFeed', () => {
  it('reads the currency and keeps only usable services', () => {
    const feed = parseFeed({ currency: 'USD', services: [raw(), { nonsense: true }] });
    assert.equal(feed.currency, 'USD');
    assert.equal(feed.services.length, 1);
    assert.equal(feed.dropped, 1);
  });
  it('keeps the first of two services that share a slug or an id', () => {
    const feed = parseFeed({ currency: 'USD', services: [raw(), raw({ id: 'b2' }), raw({ slug: 'other' })] });
    assert.deepEqual(feed.services.map((s) => s.id), ['a1']);
    assert.equal(feed.dropped, 2);
  });
  it('stops the build when the feed lists services but none are usable', () => {
    assert.throws(() => parseFeed({ currency: 'USD', services: [{ nonsense: true }] }), /unusable/);
  });
  it('refuses something that is not a feed, so a broken response stops the build', () => {
    assert.throws(() => parseFeed(null));
    assert.throws(() => parseFeed({ currency: 'USD' }));
    assert.throws(() => parseFeed({ currency: 'EUR', services: [] }));
  });
  it('accepts an empty list', () => {
    assert.deepEqual(parseFeed({ currency: 'JMD', services: [] }), { currency: 'JMD', services: [], dropped: 0 });
  });
});

describe('routableServices', () => {
  it('leaves out a slug the site already uses', () => {
    const list = [svc({ slug: 'thanks' }), svc({ slug: 'widget-test' }), svc({ slug: 'ok' })];
    assert.deepEqual(routableServices(list).map((s) => s.slug), ['ok']);
  });
});

describe('prices', () => {
  it('picks the price for the organization type', () => {
    assert.equal(priceFor(svc(), 'standard'), 2250);
    assert.equal(priceFor(svc(), 'ngo'), 1900);
    assert.equal(priceFor(svc({ quoted: true, price: null }), 'ngo'), null);
  });
  it('adds only the extras that belong to the service, in whole cents', () => {
    assert.equal(totalFor(svc(), 'ngo', ['x1', 'x2']), 3050);
    assert.equal(totalFor(svc(), 'standard', ['x1', 'not-an-extra']), 2650);
    assert.equal(totalFor(svc({ price: { standard: 0.1, ngo: 0.1 }, addons: [{ id: 'a', name: 'n', price: 0.2 }] }), 'standard', ['a']), 0.3);
  });
  it('has no total for a quoted service', () => {
    assert.equal(totalFor(svc({ quoted: true, price: null }), 'standard', []), null);
  });
  it('says when the two organization types pay differently', () => {
    assert.equal(pricesDiffer(svc()), true);
    assert.equal(pricesDiffer(svc({ price: { standard: 100, ngo: 100 } })), false);
    assert.equal(pricesDiffer(svc({ quoted: true, price: null })), false);
  });
});

describe('formatMoney', () => {
  it('shows whole amounts without decimals and others with two', () => {
    assert.equal(formatMoney(2250, 'USD'), 'US$2,250');
    assert.equal(formatMoney(1300.1, 'USD'), 'US$1,300.10');
    assert.equal(formatMoney(5000, 'JMD'), 'J$5,000');
  });
});

describe('deliveryLabel', () => {
  it('describes each kind of service', () => {
    assert.equal(deliveryLabel(svc()), '5 working days');
    assert.equal(deliveryLabel(svc({ recurring: true, delivery_days: null })), 'Billed monthly');
    assert.equal(deliveryLabel(svc({ quoted: true, price: null, delivery_days: null })), 'Scoped to your brief');
  });
});
