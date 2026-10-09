# Hexfield build 294: learning repair and print checkout

## Shipped to main

- Private taste data isolation: authenticated users can read only their own `hexfield_taste_profiles` row.
- New shared novelty vectors in `hexfield_render_signatures` (64-element JSON arrays), with owner-only inserts and an authenticated mixed recent/history sample RPC.
- `bump_hexfield_sim` atomic learning-count updates.
- Shared archive and counter reads use anonymous *Auth session JWTs*, not the public API key as a bearer token.
- Lexicon observation counts survive page reloads.
- Stripe print-checkout Edge Function: validated museum PNG URLs, server-owned sandbox price IDs, shipping address collection, Stripe-hosted Checkout, verified webhook handler, private paid-order ledger.
- Old Shopify Buy handler is intercepted at capture-phase and never receives a click.

## Stripe: TEST ONLY

The connected Stripe account is **Hexfield sandbox** (`acct_1ToMJoFwuvPcXFqd`, livemode=false).
The sandbox price IDs are:
- Portrait 15×18 in: `price_1UOQxTFwuvPcXFqd1h7mdlkl` — AUD 1.00 test amount
- Square 12×12 in: `price_1UOQxWFwuvPcXFqdSqO3nVQc` — AUD 1.00 test amount

The customer-visible button is explicitly **PRINT ORDERS NOT YET LIVE**, not a fake real checkout.
To try Stripe Checkout, open `https://hexfield.org/?stripe_test=1`, choose the portrait or square format, and click **STRIPE TEST CHECKOUT**.

The Checkout Edge Function is:
`https://uiobhojjgtsvyzuzqqiy.supabase.co/functions/v1/hexfield-print-checkout`

The function needs these secrets in Supabase **Bb5 / uiobhojjgtsvyzuzqqiy**:
- `STRIPE_SECRET_KEY`: a **test** restricted/secret key from the **same Stripe sandbox account**.
- `STRIPE_WEBHOOK_SECRET`: signing secret from the Stripe sandbox webhook destination below.
- Supabase service-role key is available by default to Edge Functions in normal Supabase environments.

Configure the sandbox Stripe webhook destination:
`https://uiobhojjgtsvyzuzqqiy.supabase.co/functions/v1/hexfield-print-checkout/webhook`
Subscribe to:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Do a real **sandbox** checkout and confirm a paid record appears in
`public.hexfield_print_orders`. The webhook is idempotent by checkout session ID.

**Physical fulfillment is intentionally NOT dispatched**. The current `hexfield-fulfil` receiver is a legacy Shopify webhook on a DIFFERENT, inactive Supabase project (`wjtrduojxyaeenifpxct`), so it cannot fulfill Stripe orders. Complete a verified Prodigi sandbox print order, configure real retail prices and shipping, connect the **live** Stripe account/keys, implement a separate verified paid-order fulfillment worker and test an end-to-end proof before enabling live sales. Do not simply rename the button to BUY or switch from `sk_test` to `sk_live`.

## Cloudflare deployment (automatic)

The public site is served by Cloudflare Worker `hexfield` with `./public` assets.
**Workers Builds IS connected to GitHub `bb-0-5/hexfield` on `main`, auto_build_enabled=true.**
The earlier statement that there were no automatic deploys was incorrect: the Worker tag is
`4b0933bada384ddeb63b191b7c56f2c4`, and Cloudflare recorded a successful push_event
build for commit `d7e5c3f59954d9cf4dc88517dd811ef8390e9179`.
Cloudflare invokes `npx wrangler deploy` as the deployment command. No manual deploy is needed for ordinary pushes.

Build 294 adds a shared novelty sampler over **both the pre-existing creations archive
(over 14,000 64-cell signatures) and the incremental signature table**. The sample RPC
returns 500 valid 64-cell signatures when tested against the live database. Personal taste
reads are also explicitly filtered to the authenticated visitor, in addition to RLS.
The two internal database trigger functions no longer expose EXECUTE to public roles.

Verify `https://hexfield.org/build.txt` returns `294` and the page loads
`hexfield-integrations.js` before `app.js`. Check the Cloudflare Workers Builds
status for the current `main` commit. The app deliberately disables unattended
autonomous cycles on phones to avoid freezing the visible painting; do not override
that without mobile performance measurements.

## Not changed

- Autonomous taste cycles remain off on phones to prevent earlier observed freezes. Manual generation and human feedback still work.
- No previous human observations, art archive rows, or existing print orders were deleted.
- No Stripe live payments or Prodigi orders have been issued.
