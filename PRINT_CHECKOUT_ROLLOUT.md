# Hexfield build 293: learning repair and print checkout

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

## Cloudflare deploy

The public site is served by Cloudflare Worker `hexfield` with `./public` assets.
Changes have been pushed to GitHub main. Cloudflare Workers Builds exposes **no automatic GitHub build triggers for this Worker**; its deployment source is **wrangler**. A Wrangler deployment was observed after the latest GitHub commit, but the exact served asset bytes have not been independently verified.

Deploy from the current repo checkout when needed:

```sh
git pull origin main
npx wrangler deploy
```

Then verify `https://hexfield.org/build.txt` returns `293` and that page source loads `hexfield-integrations.js` before `app.js`. Check Supabase `hexfield_render_signatures` grows after fresh paintings.

## Not changed

- Autonomous taste cycles remain off on phones to prevent earlier observed freezes. Manual generation and human feedback still work.
- No previous human observations, art archive rows, or existing print orders were deleted.
- No Stripe live payments or Prodigi orders have been issued.
