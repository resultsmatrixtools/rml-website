/**
 * The visitor's organization type (standard or NGO), remembered for the visit.
 *
 * It decides which price the services pages show. It is kept in sessionStorage,
 * so it is gone when the tab closes and never leaves the browser: it is sent
 * only when the visitor submits a request. Every read and write is wrapped,
 * because storage can be blocked.
 *
 * The page's own markup carries both prices; CSS (see OrgTypeSwitch.astro)
 * shows the one that matches `<html data-org>`. Without JavaScript the
 * attribute is never set and both prices are shown with labels.
 */

export type OrgType = 'standard' | 'ngo';

const KEY = 'rml-org-type';

export function getOrgType(): OrgType {
  // What the page is showing wins. It is set on load from storage and on every click, so
  // when storage is blocked the visitor's choice still survives within the page and what
  // they were shown is what gets sent.
  const shown = document.documentElement.dataset.org;
  if (shown === 'ngo' || shown === 'standard') return shown;
  try {
    return sessionStorage.getItem(KEY) === 'ngo' ? 'ngo' : 'standard';
  } catch {
    return 'standard';
  }
}

/** Applies the choice to the page and tells anything listening. */
export function applyOrgType(org: OrgType): void {
  document.documentElement.dataset.org = org;
  document.querySelectorAll<HTMLElement>('[data-org-btn]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.orgBtn === org));
  });
  document.dispatchEvent(new CustomEvent<OrgType>('orgchange', { detail: org }));
}

export function setOrgType(org: OrgType): void {
  try {
    sessionStorage.setItem(KEY, org);
  } catch {
    /* storage blocked: the choice still applies to this page */
  }
  applyOrgType(org);
}
