# Draft: email to DimePay support

**To:** support@dimepay.net
**Subject:** Sandbox integration questions: webhooks for rebills, subscription cancellation, declines

Hello DimePay team,

We are integrating the hosted payment page, saved-card charges and recurring
billing for Results Matrix Limited, using the sandbox. The integration is going
well and most behaviour matches the documentation. We have five questions that
the documentation does not answer.

**1. Webhooks for subscriptions**
We created a weekly subscription (`is_subscription: true`, `tokenize: true`).
The webhook for the first payment had `details.message: "SUBSCRIPTION_CREATED"`
and a `details.subscription` object, which is helpful, but the top-level
`subscriptionStatus` was null. What `message` values and payloads are sent for:
- a scheduled rebill that succeeds,
- a rebill that fails or is declined, and
- a subscription that is cancelled or reaches its final billing date?
A sample payload for each would be very helpful.

We also noticed that in this subscription webhook `details.transaction` is a
serialised database model (`dataValues`, `_previousDataValues`, `_changed`,
`isNewRecord` and similar) instead of the plain object a one-off payment
sends. We handle both, but you may want to know it looks unintended.

**2. Cancelling or pausing a subscription**
Is there an API to cancel or pause a subscription (we saw `cancel_at_period_end`
and `pause_next_period` on the subscription object)? If so, what are the
endpoint and the JWT payload?

**3. Declined payments in the sandbox**
The sandbox accepted the Visa test card 4111 1111 1111 1111 with an incorrect
CVV and expiry date, so we cannot simulate a decline. Is there a test card,
CVV or amount that produces a decline, and does a declined or abandoned hosted
page payment ever send a webhook? In our tests a declined Amex sent none.

**4. Webhook retries**
When our endpoint returns a non-2xx response, how many times and at what
intervals is the webhook retried? Does the sandbox behave the same way as
production? Is there a fixed set of source IP addresses?

**5. Checkout error**
When paying a subscription order, the hosted page showed
`A server error has occurred INTERNAL_FUNCTION_INVOCATION_FAILED`
(ID `iad1::hq8qk-1793158077238-0eb716163362`, 2026-10-28, about 03:27 UTC).
Retrying the same link a few minutes later worked. Could you look into it?
The order was `90d53bac-bb9c-47aa-b5bc-853b1ce254a6`.

Two smaller points:
- The sandbox order lookup (`GET /orders/{jwt}`) intermittently returned the
  plain-text body `A server error has occurred` with a 5xx, then succeeded on
  the next call. We retry, but wanted to mention it.
- The Getting Started page gives two sandbox domains (`sandbox.api.dimepay.app`
  and `sandbox.api.dimepay.com`). We are using `.app`; please confirm that is
  correct.
- Our own tests showed that a hosted page order which is already COMPLETE can
  be paid a second time, creating a second transaction. Is that intended? We
  plan to guard against it on our side regardless.

Thank you,
[Name]
Results Matrix Limited
[Contact details]
