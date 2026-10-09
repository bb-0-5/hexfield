/* Hexfield integration bridge (build 293).
 * Network transport fixes are intentionally isolated from the enormous painter.
 * This script loads after HexfieldWords and before app.js. */
(() => {
  "use strict";
  const API = "https://uiobhojjgtsvyzuzqqiy.supabase.co";
  const checkoutEndpoint = API + "/functions/v1/hexfield-print-checkout";
  const originalFetch = globalThis.fetch.bind(globalThis);
  const routes = {
    "/rest/v1/rpc/sample_hexfield_signatures": "archive-read",
    "/rest/v1/hexfield_signatures": "archive-write",
    "/rest/v1/hexfield_sim_progress": "progress-read",
    "/rest/v1/hexfield_taste_profiles": "private-taste-read",
  };
  globalThis.fetch = function hexfieldFetch(input, init = {}) {
    const url = typeof input === "string" ? input : input?.url;
    const path = typeof url === "string" && url.startsWith(API)
      ? new URL(url).pathname : "";
    const mode = routes[path];
    const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (!mode || (mode === "private-taste-read" && method !== "GET")) return originalFetch(input, init);
    return (async () => {
      // Anonymous Supabase Auth is an authenticated RLS identity. The publishable
      // API key alone is NOT one, even if it was historically sent as a Bearer.
      const session = await ensureTasteSession();
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      headers.set("Authorization", "Bearer " + session.access_token);
      let target = url;
      if (mode === "archive-write") target = API + "/rest/v1/hexfield_render_signatures";
      if (mode === "private-taste-read") {
        const scoped = new URL(url);
        // RLS enforces ownership too. This explicit filter prevents accidentally
        // treating another visitor's first row as your model if a policy regresses.
        scoped.searchParams.set("user_id", "eq." + session.user.id);
        target = scoped.toString();
      }
      const res = await originalFetch(target, { ...init, headers });
      if (!res.ok && (mode === "archive-write" || mode === "archive-read")) {
        console.warn("hexfield shared archive:", mode, "HTTP", res.status);
      }
      return res;
    })();
  };

  // The lexicon's three-context gate must survive reload. The original caller
  // only saved the state after an actual weight update, discarding observations
  // #1 and #2; saving on any context mutation fixes it without changing the
  // anti-collapse algorithm.
  const words = globalThis.HexfieldWords;
  if (words && typeof words.driftObserve === "function" &&
      typeof words.driftExport === "function") {
    const observe = words.driftObserve;
    words.driftObserve = function (...args) {
      const before = JSON.stringify(words.driftExport());
      const result = observe.apply(this, args);
      const after = JSON.stringify(words.driftExport());
      if (after !== before) {
        try { localStorage.setItem("hexfield.word-drift.v1", after); } catch {}
      }
      return result;
    };
  }

  const testing = new URLSearchParams(location.search).has("stripe_test");
  let inFlight = false;
  function status(message) {
    const host = document.getElementById("exportStatus");
    if (host) host.textContent = message;
  }
  // Existing app.js attaches the former Shopify handler to its dynamic button.
  // Capture prevents that checkout from ever opening while the Stripe migration
  // is being verified. In production, deliberately fail closed.
  document.addEventListener("click", async (event) => {
    const button = event.target instanceof Element ? event.target.closest("#buy") : null;
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!testing) {
      status("Print checkout is in Stripe testing. Live payment and delivery are not yet available.");
      return;
    }
    if (inFlight || !globalThis.__hexfield?.getCurrent?.()) return;
    inFlight = true;
    button.disabled = true;
    try {
      const fmtKey = document.getElementById("format")?.value;
      if (fmtKey !== "print" && fmtKey !== "logo") {
        throw new Error("Choose portrait or square print format.");
      }
      const fmt = FORMATS[fmtKey];
      status("Preparing Stripe TEST print " + fmt.ew + " x " + fmt.eh + "...");
      // Use the painter's canonical printing path and archive bucket.
      const blob = await renderPrintBlob(fmt);
      const artwork = globalThis.__hexfield.getCurrent();
      const hash = await ensureRenderHash(artwork);
      status("Uploading artwork for sandbox checkout...");
      const design_url = await uploadDesign(blob, hash);
      status("Creating Stripe sandbox session...");
      const res = await originalFetch(checkoutEndpoint + "/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: fmtKey, design_url }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.mode !== "sandbox" || !payload.checkout_url) {
        throw new Error(payload.error || "Stripe sandbox checkout unavailable");
      }
      status("Opening Stripe TEST checkout — no real charges...");
      location.assign(payload.checkout_url);
    } catch (error) {
      console.error("Hexfield Stripe sandbox:", error);
      status("TEST checkout unavailable: " + (error?.message || String(error)));
    } finally {
      inFlight = false;
      button.disabled = false;
    }
  }, true);

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("buy");
    if (btn) {
      btn.textContent = testing ? "STRIPE TEST CHECKOUT" : "PRINT ORDERS NOT YET LIVE";
      btn.setAttribute("aria-label", testing ? "Test Stripe Checkout — no real payment" : "Live print sales are not available yet");
    }
    const params = new URLSearchParams(location.search);
    if (params.get("print_checkout") === "success") {
      status("Stripe test checkout returned. The verified webhook records paid sandbox orders; no physical print is ordered.");
    } else if (params.get("print_checkout") === "cancel") {
      status("Stripe test checkout was cancelled.");
    }
  });
})();
