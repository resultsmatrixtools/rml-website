'use strict';

/**
 * GitHub OAuth proxy for Decap CMS on DigitalOcean Functions.
 *
 * One web function handles both legs of the flow (the GitHub OAuth App's
 * callback URL is this function's own URL, so GitHub returns here):
 *   1. No ?code param  → set a state cookie and redirect to GitHub's
 *      authorize screen.
 *   2. ?code present   → verify state, exchange the code for a token, and
 *      return a page that hands the token to the CMS window via the
 *      standard Decap postMessage handshake.
 *
 * The token is only posted to origins whose host matches ALLOWED_DOMAINS.
 */

const crypto = require('crypto');

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

function hostAllowed(host, allowedList) {
  return allowedList.some((pattern) => {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1); // ".example.com"
      return host.endsWith(suffix) && host.length > suffix.length;
    }
    return host === pattern;
  });
}

function parseCookies(header) {
  return Object.fromEntries(
    (header || '')
      .split(';')
      .map((part) => part.trim().split('='))
      .filter((pair) => pair.length === 2),
  );
}

function htmlResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
    body,
  };
}

/** Page that completes the Decap handshake in the CMS-opened popup. */
function handshakePage(message, allowedDomains) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Authorizing…</title></head>
<body>
<p>Authorizing… you can close this window if it does not close itself.</p>
<script>
  (function () {
    var allowed = ${JSON.stringify(allowedDomains)};
    function hostAllowed(host) {
      return allowed.some(function (p) {
        if (p.indexOf('*.') === 0) {
          var suffix = p.slice(1);
          return host.length > suffix.length && host.indexOf(suffix, host.length - suffix.length) !== -1;
        }
        return host === p;
      });
    }
    function receive(e) {
      var host;
      try { host = new URL(e.origin).host; } catch (err) { return; }
      if (!hostAllowed(host)) return;
      window.removeEventListener('message', receive);
      e.source.postMessage(${JSON.stringify(message)}, e.origin);
    }
    window.addEventListener('message', receive);
    if (window.opener) window.opener.postMessage('authorizing:github', '*');
  })();
</script>
</body></html>`;
}

async function main(args) {
  const clientId = args.GITHUB_CLIENT_ID;
  const clientSecret = args.GITHUB_CLIENT_SECRET;
  const allowedDomains = (args.ALLOWED_DOMAINS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!clientId || !clientSecret) {
    return htmlResponse(500, '<p>OAuth proxy is not configured (missing client ID/secret).</p>');
  }

  const headers = args.__ow_headers || {};

  // ---- Leg 2: GitHub redirected back with a code -------------------------
  if (args.code) {
    const cookies = parseCookies(headers.cookie);
    if (!args.state || !cookies.decap_oauth_state || cookies.decap_oauth_state !== args.state) {
      return htmlResponse(400, '<p>State mismatch — please close this window and try signing in again.</p>');
    }

    let payload;
    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: args.code,
        }),
      });
      payload = await tokenRes.json();
    } catch (error) {
      payload = { error: 'network_error', error_description: String(error) };
    }

    const clearState = {
      'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax',
    };

    if (!payload.access_token) {
      const reason = payload.error_description || payload.error || 'unknown error';
      return htmlResponse(
        200,
        handshakePage(`authorization:github:error:${JSON.stringify({ message: reason })}`, allowedDomains),
        clearState,
      );
    }

    return htmlResponse(
      200,
      handshakePage(
        `authorization:github:success:${JSON.stringify({ token: payload.access_token, provider: 'github' })}`,
        allowedDomains,
      ),
      clearState,
    );
  }

  // ---- Leg 1: start — redirect to GitHub's authorize screen --------------
  // Optional guard: refuse to start the flow for unknown sites.
  if (args.site_id && !hostAllowed(args.site_id, allowedDomains)) {
    return htmlResponse(403, `<p>Site ${escapeHtml(args.site_id)} is not allowed to use this proxy.</p>`);
  }

  const state = crypto.randomBytes(16).toString('hex');
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('scope', 'repo,user');
  authorizeUrl.searchParams.set('state', state);
  // No redirect_uri: GitHub falls back to the OAuth App's registered
  // callback URL, which must be this function's URL.

  return {
    statusCode: 302,
    headers: {
      Location: authorizeUrl.toString(),
      'Set-Cookie': `decap_oauth_state=${state}; Max-Age=600; Path=/; Secure; HttpOnly; SameSite=Lax`,
      'Cache-Control': 'no-store',
    },
    body: '',
  };
}

exports.main = main;
