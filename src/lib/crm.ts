/**
 * Posts a form to the PRISM `lead-capture` endpoint (the CRM). The endpoint
 * verifies the Turnstile token server-side; without a valid one it answers 400.
 */
import { resetTurnstile, turnstileToken } from './turnstile';

const CRM_ENDPOINT: string = import.meta.env.PUBLIC_CRM_ENDPOINT ?? '';
const SUBMIT_TIMEOUT_MS = 15_000;

export type CrmForm = 'contact' | 'resource' | 'consultation';
export type CrmResult =
  | { ok: true; paymentUrl?: string }
  | { ok: false; reason: 'unconfigured' | 'invalid' | 'network' };

/**
 * The only places a visitor may be sent to pay. lead-capture generates this URL
 * itself, but a page that redirects to whatever a response says is one bug away
 * from an open redirect, so the destination is checked here too.
 */
const PAYMENT_HOST = /^([a-z0-9-]+\.)*dimepay\.(app|net|com)$/i;

export function safePaymentUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && PAYMENT_HOST.test(url.hostname) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export const crmEnabled = CRM_ENDPOINT !== '';

export async function submitLead(
  form: CrmForm,
  fields: Record<string, string>,
  marketingConsent: boolean,
): Promise<CrmResult> {
  if (!CRM_ENDPOINT) return { ok: false, reason: 'unconfigured' };

  try {
    const response = await fetch(CRM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form,
        fields,
        marketing_consent: marketingConsent,
        page_url: window.location.href,
        referrer: document.referrer,
        website: '',
        turnstile_token: turnstileToken() ?? '',
      }),
      signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
    });
    if (response.ok) {
      // Only a consultation that chose card and has an online price gets a URL;
      // every other accepted post is a bare { ok: true }.
      const body = (await response.json().catch(() => null)) as { payment_url?: unknown } | null;
      const paymentUrl = safePaymentUrl(body?.payment_url);
      return paymentUrl ? { ok: true, paymentUrl } : { ok: true };
    }
    console.error(`[rml] lead-capture rejected the ${form} submission (${response.status})`);
    return { ok: false, reason: response.status === 400 ? 'invalid' : 'network' };
  } catch (error) {
    console.error('[rml] lead-capture submission could not be sent:', error);
    return { ok: false, reason: 'network' };
  } finally {
    resetTurnstile();
  }
}
