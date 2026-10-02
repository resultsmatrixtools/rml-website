/**
 * HubSpot Forms Submission API v3 (BRIEF.md §5).
 *
 * This module runs in the browser: the site is a static build, so there is
 * no server to post to. Forms POST straight to HubSpot's public submission
 * endpoint, which needs no API key — the portal ID and form GUID are the
 * credentials, which is why they are safe as `PUBLIC_` env vars.
 *
 * Tracking association: HubSpot's tracker (loaded only after cookie consent,
 * see ConsentBanner.astro) sets a `hubspotutk` cookie. Passing it back as
 * `context.hutk` is what stitches a submission onto that visitor's page-view
 * history. Visitors who declined cookies have no `hutk`; their submission
 * still creates the contact, just without the browsing timeline.
 */

import { crmEnabled, submitLead, type CrmForm } from './crm';

const PORTAL_ID: string = import.meta.env.PUBLIC_HUBSPOT_PORTAL_ID ?? '';

/** One GUID per HubSpot form. Created in HubSpot; see README runbook. */
const FORM_GUIDS: Record<FormKey, string> = {
  contact: import.meta.env.PUBLIC_HUBSPOT_FORM_GUID_CONTACT ?? '',
  resource: import.meta.env.PUBLIC_HUBSPOT_FORM_GUID_RESOURCE ?? '',
  consult: import.meta.env.PUBLIC_HUBSPOT_FORM_GUID_CONSULT ?? '',
};

/** HubSpot's internal industry option values, as the CRM endpoint's labels. */
const CRM_INDUSTRY: Record<string, string> = {
  gov: 'Government',
  ngo: 'Non-governmental Organizations',
  healthcare: 'Healthcare',
  education: 'Education',
  environment: 'Environment',
  'private-sector': 'Private Sector',
  consult: 'Consulting',

};

export type FormKey = 'contact' | 'resource' | 'consult';

/** Contact object type in HubSpot's CRM object taxonomy. */
const CONTACT_OBJECT_TYPE_ID = '0-1';

const SUBMIT_TIMEOUT_MS = 15_000;

export type SubmitResult = { ok: true } | { ok: false; reason: 'unconfigured' | 'invalid' | 'network' };

/** Reads the HubSpot tracking cookie, absent unless the visitor accepted cookies. */
function readTrackingCookie(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Submits one form to HubSpot. Empty values are dropped rather than sent as
 * blanks, so an optional field left alone never overwrites an existing
 * property on a returning contact.
 */
export async function submitForm(
  key: FormKey,
  values: Record<string, string | undefined>,
  pageName: string,
  options: { marketingConsent?: boolean } = {},
): Promise<SubmitResult> {
  // When the CRM endpoint is configured it is the system of record; HubSpot is
  // then only a best-effort second post, and only while the dual-post flag is on.
  if (crmEnabled) {
    const crmForm: Record<FormKey, CrmForm> = {
      contact: 'contact',
      resource: 'resource',
      consult: 'consultation',
    };
    const { firstname, lastname, company, ...rest } = values;
    const fields: Record<string, string> = {};
    const name = [firstname, lastname].filter(Boolean).join(' ');
    if (name) fields.name = name;
    if (company) fields.organisation = company;
    for (const [k, v] of Object.entries(rest)) if (v?.trim()) fields[k] = v.trim();
    if (fields.industry) fields.industry = CRM_INDUSTRY[fields.industry] ?? '';
    // The offline consultation path is bank transfer / invoice only (BRIEF.md §6).
    if (fields.payment_method) fields.payment_method = 'bank_transfer';

    const marketingConsent = options.marketingConsent === true;
    const result = await submitLead(crmForm[key], fields, marketingConsent);
    // HubSpot is a marketing list too: copy a lead there only when they agreed to
    // marketing, so a non-subscriber never reaches it.
    if (result.ok && marketingConsent && import.meta.env.PUBLIC_HUBSPOT_DUAL_POST === 'true') {
      void submitHubspot(key, values, pageName);
    }
    return result;
  }

  return submitHubspot(key, values, pageName);
}

async function submitHubspot(
  key: FormKey,
  values: Record<string, string | undefined>,
  pageName: string,
): Promise<SubmitResult> {
  const formGuid = FORM_GUIDS[key];

  if (!PORTAL_ID || !formGuid) {
    console.error(
      `[rml] HubSpot ${key} form is not configured — set PUBLIC_HUBSPOT_PORTAL_ID and ` +
        `PUBLIC_HUBSPOT_FORM_GUID_${key.toUpperCase()} at build time (see README).`,
    );
    return { ok: false, reason: 'unconfigured' };
  }

  const fields = Object.entries(values)
    .filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
    .map(([name, value]) => ({
      objectTypeId: CONTACT_OBJECT_TYPE_ID,
      name,
      value: value.trim(),
    }));

  const hutk = readTrackingCookie();

  let response: Response;
  try {
    response = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${formGuid}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields,
          context: {
            ...(hutk ? { hutk } : {}),
            pageUri: window.location.href,
            pageName,
          },
        }),
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
      },
    );
  } catch (error) {
    console.error('[rml] HubSpot submission could not be sent:', error);
    return { ok: false, reason: 'network' };
  }

  if (response.ok) return { ok: true };

  // HubSpot returns a JSON body naming the offending fields — worth logging,
  // because "create the custom property" is the usual fix and it is invisible
  // from the visitor's side.
  const detail = await response.text().catch(() => '');
  console.error(`[rml] HubSpot rejected the ${key} submission (${response.status}):`, detail);

  return { ok: false, reason: response.status === 400 ? 'invalid' : 'network' };
}

/**
 * Splits a single free-text name field into HubSpot's `firstname`/`lastname`.
 * One visible name field is friendlier than two; HubSpot wants them apart.
 * A mononym fills `firstname` only.
 */
export function splitName(fullName: string): { firstname?: string; lastname?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  return { firstname: parts[0], lastname: parts.slice(1).join(' ') || undefined };
}
