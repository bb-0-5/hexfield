# Hexfield build 299 — from a fixed painting algorithm to an image model

## The problem solved

Builds 295–297 mutate procedural trees, but **all artworks** still pass through
one nearly-fixed pipeline: sky gradient → terrain bands → vegetation → glaze.
Changing its parameters cannot make the system discover oil paintings of an
abandoned tidal cinema, charcoal sketches of a flooded station or an entirely
new perspective. A pixel-distance metric does not invent that imagery.

## The replacement (default **IMAGINE** tab)

1. Wait for an explicit **PAINT A NEW IDEA** click (do not spend GPU inference
   when visitors merely open the page).
2. Acquire a Supabase anonymous session with the existing studio account.
3. The Cloudflare Worker checks the bearer via an authenticated PostgreSQL RPC,
   atomically reserving a generation slot (3/day/user, 60/day/site). The RPC
   rejects duplicate request IDs, including replayed HTTP calls.
4. A hosted **text model** receives the visitor's idea and recent *explicit*
   keep/reject/critique history, then proposes an unrestricted subject,
   composition, medium and image-generation prompt. It is explicitly instructed
   to break from rejected approaches instead of moving objects around.
5. A hosted **diffusion/flow image model** generates a new 1024×768 painting.
   It does **not** use the procedural terrain renderer or the owner's drawing
   reference library.
6. **REWORK THIS CANVAS** sends a downscaled PNG of the actual canvas as a
   reference image to the image editing model. This is not colour filtering.
7. KEEP/REJECT and optional natural-language explanations are stored locally,
   then synced to Supabase under owner-only RLS. A mini-thumbnail of kept
   pictures survives in this browser. Remote history is metadata/feedback,
   not the large generated image bytes.
8. Existing **PROCEDURAL** experiments, **LOGOS** and **legacy museum** remain
   accessible. Stripe/payment integrations are untouched.

## Model & cost boundaries

- Planner: `@cf/meta/llama-3.1-8b-instruct-fast` (fallback: direct image prompt with
  recent human dislikes still incorporated if planner errors).
- Painter/editor: `@cf/black-forest-labs/flux-2-klein-4b` via Workers AI binding.
- Exposes no API key or admin secret to browsers; credentials and daily quotas
  are checked on the server, not the client. No unchecked public GPU endpoint.
- Only explicit user clicks invoke inference. The shared quota is an absolute
  bound for this API, not a replacement for billing controls on the account.
- A failed inference may still consume one of the daily attempt slots.

## What learning means (honest limits)

Human feedback adapts the **art direction prompt** sent to the model. The
underlying image model weights are *not* fine-tuned. That can change the
subject, visual medium, style and perspective in a way the previous fixed
renderer could not. It does not establish artistic improvement without human
comparisons over time, and image generation is not deterministic.

## Tests

Run `node tests/imagination-worker.test.mjs` for API/auth/quotas/model/editing.
There is a browser mock integration test in `tests/browser_imagination.py` that
loads JS modules into an isolated browser origin and verifies rejection
reaches the next model request, rework sends pixels and both legacy modes work.
This mock does not demonstrate production model quality. Verify the actual
Cloudflare AI binding after deployment and test a real painting separately.
