# Build 306 — Buy from an Australian printer, not from Hexfield

## Decision

Hexfield is **an artwork studio, not a print retailer**.

A visitor who wants a physical print chooses one of two independent
Australian print shops. Hexfield prepares the image on the visitor's
device and offers the supplier's own checkout. The visitor **uploads
the downloaded PNG directly on that supplier's website** and chooses
paper, size and shipping. The supplier takes their payment and personal
details, manufactures, ships and handles order problems.

Hexfield:
- does not charge the customer;
- does not set print retail prices;
- does not take a percentage or affiliate payment;
- does not accept customer address, phone or billing details;
- does not create supplier orders, delivery tickets or invoices;
- does not send user content automatically to a third-party supplier.

No print company account or Stripe live key is required merely to link
to these independent retail ordering pages.

## Verified Australian consumer-print vendors

- **PosterFactory**, Marrickville NSW: https://posterfactory.com.au/product/custom-prints/
  Upload image, choose custom size and paper, pay and ship directly.
- **Frameshop**, Roselands NSW: https://www.frameshop.com.au/shop/photo-printing/fine-art-prints
  Upload image, choose fine-art printing and framing options, then buy
  and receive it through Frameshop.

These are not formal contracted fulfilment partners or automatic APIs.
There is **no verified Australian consumer checkout deep-link protocol
which preloads a Hexfield image URL** at these suppliers. In particular,
do not represent the local PNG download as an automatic vendor upload.
Getting to a true no-extra-upload handoff would require supplier support
for image URL import, direct checkout links or a supplier-approved
consumer referral integration. Trade-only APIs would still make
Hexfield the merchant, which is not the requested model.

## How the site works

A visible **PRINT DIRECT WITH AUSTRALIAN PRINTER** action exists in
the experimental archive, Rule Studio, AI IMAGINE, landscape and logo
workspaces. It opens a print referral dialog and the visitor chooses:

- *Print on paper:* PosterFactory.
- *Print and frame:* Frameshop.

The selected artwork is converted to PNG and downloaded locally. The
supplier ordering page opens in a separate tab, or a direct link is shown
if the browser blocks popups. The dialog explicitly tells the visitor
to upload the just-downloaded PNG at the supplier.

The landscape and logo output uses the existing **procedural studio
export renderer** (2400x1480 or 1480x1480 for square marks).
The historic archive uses its existing native export path (master,
portrait or square) and offers a choice between its original high-res
master and the rendered rule-overlay. Rule Studio content is resampled
to 2400x1500 only for printer upload compatibility and is **not**
presented as new detail; the buyer sees a source-resolution warning.

## Existing commerce systems

The previously implemented `supabase/functions/hexfield-print-checkout`
is Stripe **sandbox only**, not a live physical order system.
Its test mode remains accessible to developers through `?stripe_test=1`;
ordinary visitors to the live archive instead take the non-commerce
printer referral route. The previous Shopify click handler remains
suppressed in the capture-phase bridge. No migration, Supabase
customer table, payment secret, or printer API key was added for this
handoff.

If Hexfield ever starts receiving commissions, royalties or print-sale
revenue, tax and merchant responsibilities need reconsideration rather
than pretending a referral is a hobby.

## Regression verification

Run `node --experimental-default-type=module tests/print-handoff.test.mjs`
to validate the allowlisted HTTPS Australian supplier URLs, the
no-checkout/no-shipping policy, public referral buttons for all studios,
and the live archive's separation from its old internal BUY handler.
The GitHub Actions studio workflow runs it along with rendering and
model security tests.
