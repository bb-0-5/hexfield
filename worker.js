// Hexfield shut down by its owner, 15 October 2026.
// Intentionally return a real 404 for ALL requests (pages, assets and API).
// Historical source remains in Git until the repo is deleted by the owner.
const HTML='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>404 — Hexfield</title><style>html{background:#111;color:#eee;font:16px system-ui,sans-serif}body{margin:0;min-height:95vh;display:grid;place-items:center}main{text-align:center}h1{font-size:68px;margin:0}p{opacity:.75}</style></head><body><main><h1>404</h1><p>Hexfield is offline.</p></main></body></html>';
export default {
  async fetch(request) {
    return new Response(request.method==='HEAD'?null:HTML,{
      status:404,
      headers:{
        'Content-Type':'text/html; charset=utf-8',
        'Cache-Control':'no-store, max-age=0, must-revalidate',
        'X-Robots-Tag':'noindex, nofollow, noarchive',
        'X-Hexfield-Status':'offline'
      }
    });
  }
};
