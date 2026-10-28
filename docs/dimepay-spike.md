# DimePay sandbox spike — findings

Phase 1 of the payment integration. Everything below was observed against the
sandbox (`https://sandbox.api.dimepay.app/dapi/v1`) on 2026-10-28, not taken
from the docs. Where the docs and the sandbox disagree, the sandbox wins.

## Auth and signing

- Every request carries a `client_key` header (`ck_…`).
- The request body is `{ "lang": "en", "data": "<jwt>" }`. The JWT is HS256,
  signed with the secret key (`sk_…`), which must stay server-side.
- Secrets live in Supabase function secrets only. Never in a `PUBLIC_` variable
  or in the `.do/*.yaml` specs.

## Create a hosted payment page — `POST /payments/hosted-page`

Required JWT fields (validated by the API, not all documented):

| Field | Rule |
|---|---|
| `id` | Must be a UUID (this is our order id) |
| `currency`, `subtotal`, `total` | `total` in whole currency units (5000 = JMD 5,000) |
| `tax` | Required, a positive number (0 accepted) |
| `fulfilled` | Required boolean |
| `items` | Required, non-empty |
| `email` | Required, valid address |
| `ipAddress` | Required, valid IP |
| `referenceTransactionId` | Required string, 1–100 characters |

Optional: `billingPerson`, `redirectUrl`, `checkoutUrl`, `webhookUrl`. We send
all of them anyway.

Response: `body.response.order_url`, e.g.
`https://pay.sandbox.dimepay.app/e-order/<token>`. The last path segment is the
order token used for lookups.

After paying, the payer sees DimePay's own confirmation message. It does not
redirect to `redirectUrl`, so the return page cannot be relied on.

## Order lookup — `GET /orders/{jwt}`

The path segment is `jwt.sign(<token string>, secret)`: the token as a plain
string payload. Signing `{ token }` as an object returns 500, as does the raw
token. The response carries `order.status` (`PENDING`, then `COMPLETE`),
`order.origin_id` (our UUID), `total` and `currency`.

## Webhook

- `POST`, `Content-Type: application/json`, body `{ "payload": "<jwt>" }`.
  No signature header.
- The JWT is HS256 and verifies with our secret key; a wrong key is rejected.
  Verify it before reading anything.
- Decoded: `{ code: 200, status: "SUCCESS", details: { transaction }, subscriptionStatus, iat }`.
- `details.transaction`: `id` (transaction id, needed for refunds), `amount`,
  `currency`, `status` (`COMPLETE`), `entity_display_id` (Dime order token),
  `error_code`, `error_message`, and the order under `.order`.
- Our UUID is `order.origin_id` and `order.metadata.order_id`.
- `settled`, `captured` and `authorized` were all `false` on a COMPLETE
  payment in the sandbox. Rely on `status`, not on those flags.
- `order.status` inside the webhook is a stale `PENDING` snapshot. Re-fetch
  the order for the real status.
- Arrives about 5 seconds after payment. No retry seen on a 200 response.
  The POS docs say non-2xx responses are retried (counts unspecified).
- The payload contains the cardholder name, card BIN, last four digits and
  ZIP. Log ids and status only, and never store the full payload.

## Behaviours that shape the design

- **An order can be paid twice.** A second payment on an already-COMPLETE order
  succeeded and fired a second COMPLETE webhook with a new transaction id.
  Idempotency must key on the transaction id; a second COMPLETE on a paid
  order is a duplicate to alert on and refund.
- **Failed payments send no webhook.** A declined Amex produced nothing.
  Pending orders must expire on our side.
- **The sandbox does not validate the Visa test card's CVV or expiry.** Bad
  values were accepted. A decline cannot be simulated with that card.
- **Refunds send no webhook**, with or without `webhookUrl`/`webhook_url` in
  the refund JWT. Record refunds ourselves when we make the call.

## Refund — `PUT /payments/refund`

JWT `{ transaction_id, amount? }`. A partial refund works and returns
`status: "PARTIAL_REFUND"`. Omitting `amount` requests the full original
amount and fails with 400 if part has already been refunded.

## Recurring billing and saved cards (Phase 1b)

Created with `is_subscription: true`, `subscription_instructions`
(`recurring_frequency`, `billing_cycles`) and `tokenize: true` on the hosted page.

- The hosted page accepts the fields. The first attempt to pay hit a DimePay
  checkout crash (`INTERNAL_FUNCTION_INVOCATION_FAILED`); a retry on the same
  order succeeded and charged once.
- The first charge is taken at checkout. The first rebill is scheduled one
  period later (`billing_start_date`).
- **The webhook does carry subscription data, in a different shape.** (An
  earlier version of this note said it did not, and called the shape identical
  to a one-off payment. Both were wrong: only a few fields had been checked.)
  For a subscription's first payment:
  - `details.message` is `"SUBSCRIPTION_CREATED"` (DimePay labels events with
    this, so rebill and cancel events very likely exist under other labels).
  - `details.subscription` holds `id`, `token`, `status`, `billing_status`,
    `next_billing_date`, `cancel_at_period_end`, `billing_cycles` and more.
  - `details.transaction` is a raw serialised database model: the real fields
    are under `details.transaction.dataValues`, next to `_previousDataValues`,
    `_changed`, `isNewRecord` and similar. `order` sits on the outer object.
  - The top-level `subscriptionStatus` is still null.
- **The saved card token is not in the webhook.** It appears only when the order
  is fetched afterwards: `GET /orders/{jwt}` then returns `subscription_id` and a
  `subscription` object with `metadata.payment_token` (`card_…`).
- `billing_cycles` sent as 2 came back as 1. It appears to count total charges
  including the first (inference, not confirmed).
- **Charging a saved token works.** `POST /payments/sale` with
  `paymentParams: { source: "TOKEN", token: "card_…" }` returns the result
  synchronously (`COMPLETE`) and sends no webhook. Amounts and required fields
  are the same as the hosted page (UUID `id`, `ipAddress`,
  `referenceTransactionId`, `items`, `tax`, `fulfilled`, `email`).
- Not observable in one session: whether DimePay's scheduler charges the rebill
  on its own and what webhook (if any) that fires, and how a subscription is
  cancelled (no documented API).

## Reliability notes

- The sandbox order lookup (`GET /orders/{jwt}`) returned a plain-text
  `A server error has occurred` (5xx, not JSON) once during testing and
  succeeded on the next call. The checkout page also crashed once with
  `INTERNAL_FUNCTION_INVOCATION_FAILED`. Our client retries a 5xx or network
  failure on the lookup and treats a non-JSON body as a failure.
- Webhook retry behaviour on a non-2xx response is undocumented for the hosted
  page. The webhook therefore answers 503 (retry) only for failures a retry can
  fix, and a reconciliation job is worth adding so a lost webhook cannot leave a
  paid order showing as pending.

## Open items

- Rebill webhooks and a subscription cancel API (ask DimePay support).
- A sandbox card or amount that produces a decline.
- Webhook retry counts and intervals on non-2xx.
- Whether refunds made in the DimePay dashboard are visible to us (they send
  no webhook, so reconcile periodically).
