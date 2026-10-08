// Hexfield physical-print Stripe Checkout. Strictly SANDBOX until a separately audited live rollout.
// Secrets: STRIPE_SECRET_KEY (sk_test_...), STRIPE_WEBHOOK_SECRET (whsec_...).
// Never dispatches physical orders. Supplier integration requires its own tested deployment.
const PROJECT = "https://uiobhojjgtsvyzuzqqiy.supabase.co";
const PRICES: Record<string,string> = {
  print: "price_1UOQxTFwuvPcXFqd1h7mdlkl",
  logo: "price_1UOQxWFwuvPcXFqdSqO3nVQc",
};
const ORIGINS = ["https://hexfield.org", "https://www.hexfield.org"];
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ORIGINS.includes(origin) ? origin : ORIGINS[0],
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
});
const json = (body: unknown, status=200, origin: string | null=null) =>
  new Response(JSON.stringify(body), {status,headers:{"Content-Type":"application/json",...cors(origin),"Cache-Control":"no-store"}});
const encode = (data: Record<string,string>) => new URLSearchParams(data).toString();
const allowedDesign = (s: unknown): s is string => {
  if (typeof s !== "string" || s.length > 250) return false;
  try {
    const u = new URL(s);
    return u.origin === PROJECT && u.search === "" && u.hash === "" &&
      /^\/storage\/v1\/object\/public\/museum\/designs\/[a-f0-9]{64}\.png$/.test(u.pathname);
  } catch { return false; }
};
const stripeCall = async (url: string, key: string, form?: Record<string,string>) => {
  const res = await fetch("https://api.stripe.com/v1/" + url, {
    method:form ? "POST":"GET",
    headers:{Authorization:"Bearer "+key,...(form?{"Content-Type":"application/x-www-form-urlencoded"}:{})},
    ...(form?{body:encode(form)}:{}),
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error("Stripe "+res.status+": "+(data?.error?.message || "request failed"));
  return data;
};
async function validStripeWebhook(raw: string, signature: string, secret: string) {
  const fields = Object.fromEntries(signature.split(",").map(entry=>{const [k,...v]=entry.trim().split("=");return [k,v.join("=")];}));
  const ts = Number(fields.t);
  if (!ts || Math.abs(Math.floor(Date.now()/1000)-ts)>300 || !fields.v1) return false;
  const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(String(ts)+"."+raw)));
  const claimed = fields.v1;
  if (!/^[a-f0-9]{64}$/i.test(claimed)) return false;
  let diff = 0;
  for(let i=0;i<32;i++) diff|=digest[i]^parseInt(claimed.slice(2*i,2*i+2),16);
  return diff===0;
}
Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const url = new URL(req.url);
  const path = url.pathname;
  if (req.method==="OPTIONS") return new Response(null,{status:204,headers:cors(origin)});
  if (req.method==="GET" && path.endsWith("/config")) {
    return json({mode:"sandbox", live:false, ready: !!Deno.env.get("STRIPE_SECRET_KEY")?.startsWith("sk_test_"),
      fulfillment:"not_configured", message:"Stripe sandbox only. No real charges or physical orders."},200,origin);
  }
  const key = Deno.env.get("STRIPE_SECRET_KEY") || "";
  if (req.method==="POST" && path.endsWith("/webhook")) {
    const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    if (!signingSecret) return json({error:"webhook secret not configured"},503);
    const raw = await req.text();
    if (raw.length>1_000_000 ||
       !(await validStripeWebhook(raw,req.headers.get("stripe-signature")||"",signingSecret)))
      return json({error:"invalid webhook signature"},400);
    let event: any;
    try { event=JSON.parse(raw); } catch { return json({error:"invalid event JSON"},400); }
    if (!["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event?.type))
      return json({received:true,ignored:true});
    const s = event?.data?.object || {};
    if (s.payment_status!=="paid" || s.livemode!==false ||
        s.metadata?.app!=="hexfield" || !PRICES[s.metadata?.format])
      return json({received:true,ignored:true});
    const designUrl = s.metadata.design_url;
    if (!allowedDesign(designUrl)) return json({error:"untrusted design"},400);
    // Verify against Stripe itself; never trust only the webhook's embedded item metadata.
    let session: any;
    try { session = await stripeCall("checkout/sessions/"+encodeURIComponent(s.id),key); }
    catch { return json({error:"Stripe session verification failed"},503); }
    if (session.payment_status!=="paid" || session.livemode!==false ||
        session.metadata?.app!=="hexfield" || session.metadata?.design_url!==designUrl)
      return json({error:"session verification mismatch"},400);
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
    if (!service) return json({error:"order ledger unavailable"},503);
    const row = {
      stripe_checkout_session_id:String(session.id), stripe_event_id:String(event.id),
      format:String(session.metadata.format), design_url:designUrl, amount_total:session.amount_total,
      currency:session.currency, payment_status:"paid",
      customer_email:session.customer_details?.email || null,
      shipping:session.collected_information?.shipping_details || session.shipping_details || null,
      stripe_session:{id:session.id,livemode:session.livemode,payment_status:session.payment_status},
      updated_at:new Date().toISOString(),
    };
    const saved = await fetch(PROJECT+"/rest/v1/hexfield_print_orders?on_conflict=stripe_checkout_session_id",{
      method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,
        "Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify(row),
    });
    if (!saved.ok) return json({error:"order ledger write failed"},503);
    return json({received:true,recorded:true,fulfillment:"manual_review_only"});
  }
  if (req.method!=="POST" || !path.endsWith("/checkout")) return json({error:"not found"},404,origin);
  if (!origin || !ORIGINS.includes(origin)) return json({error:"origin not permitted"},403,origin);
  if (!key.startsWith("sk_test_")) return json({error:"Stripe print sandbox unavailable"},503,origin);
  const raw = await req.text();
  if(raw.length>4000) return json({error:"request too large"},413,origin);
  let body: any;
  try {body=JSON.parse(raw);}catch{return json({error:"invalid JSON"},400,origin);}
  const format = body?.format;
  if (!PRICES[format] || !allowedDesign(body?.design_url))
    return json({error:"invalid print format or design URL"},400,origin);
  try {
    const img = await fetch(body.design_url,{method:"HEAD",signal:AbortSignal.timeout(8000)});
    if (!img.ok || !(img.headers.get("content-type")||"").includes("image/png"))
      return json({error:"uploaded artwork not available"},400,origin);
    const session = await stripeCall("checkout/sessions",key,{
      mode:"payment",
      "line_items[0][price]":PRICES[format],
      "line_items[0][quantity]":"1",
      "shipping_address_collection[allowed_countries][0]":"AU",
      "shipping_address_collection[allowed_countries][1]":"NZ",
      "shipping_address_collection[allowed_countries][2]":"US",
      "shipping_address_collection[allowed_countries][3]":"GB",
      "shipping_address_collection[allowed_countries][4]":"CA",
      success_url:"https://hexfield.org/?print_checkout=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url:"https://hexfield.org/?print_checkout=cancel",
      "metadata[app]":"hexfield",
      "metadata[format]":format,
      "metadata[design_url]":body.design_url,
      "metadata[render_hash]":body.design_url.split("/").at(-1)?.replace(/\.png$/,"") || "",
      "integration_identifier":"hexfieldprintab",
    });
    if (!/^https:\/\/(checkout|billing)\.stripe\.com\//.test(session.url||""))
      return json({error:"invalid Checkout redirect"},502,origin);
    return json({checkout_url:session.url,mode:"sandbox",session_id:session.id},200,origin);
  } catch(e) { console.error("print checkout error", String(e)); return json({error:"print checkout could not be created"},502,origin); }
});
