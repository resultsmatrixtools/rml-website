/**
 * Cloudflare Turnstile, explicit-render. One widget per page: each page has
 * a single form, and a token is single-use, so the module keeps the current
 * one and `submitForm` (see crm.ts) reads and resets it.
 *
 * The site key is public. The matching secret lives only in the Supabase
 * `TURNSTILE_SECRET` function secret, checked by the `lead-capture` function.
 */

const SITE_KEY: string = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let widgetId: string | undefined;
let token: string | null = null;
let scriptPromise: Promise<void> | undefined;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed to load'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** Renders the widget into `container`. A no-op when no site key is configured. */
export async function mountTurnstile(container: HTMLElement): Promise<void> {
  if (!SITE_KEY) return;
  try {
    await loadScript();
  } catch (error) {
    console.error('[rml]', error);
    return;
  }
  if (!window.turnstile) return;
  widgetId = window.turnstile.render(container, {
    sitekey: SITE_KEY,
    callback: (value: string) => {
      token = value;
    },
    'expired-callback': () => {
      token = null;
    },
    'error-callback': () => {
      token = null;
    },
  });
}

/** The current token, or null while unsolved, expired or unconfigured. */
export function turnstileToken(): string | null {
  return token;
}

/** Tokens are single-use: call after every submission attempt. */
export function resetTurnstile(): void {
  token = null;
  if (widgetId !== undefined) window.turnstile?.reset(widgetId);
}
