#!/usr/bin/env python3
"""Painting benchmark: the same scenes, painted the same way, compared at equal effort.

Each run opens the studio in a fresh headless browser with Math.random seeded
(so the field, the plan and every choice come out the same), Supabase blocked
and storage empty, types a fixed seed text and description, starts a new
painting and lets the painter work. When it has laid 1000, 2000 and 3000
strokes the canvas is measured against the reference it is painting toward:

  error      mean |canvas - reference| over the picture (0-255, lower is better)
  edge       the same within 3 px of the named things' outlines (crispness)
  width      mean width of the strokes laid so far (px; broader = fewer, surer marks)

A configuration is a line of JavaScript run before the painting starts, so a
change can be switched off or tuned without editing the app, e.g.

  python3 tools/paint_bench.py --config base= --config off="ORDER.on = false"

Usage:
  python3 tools/paint_bench.py [--config NAME=JS ...] [--repeats 2] [--parallel 4]
                               [--scenes all|NAME,NAME] [--manner painterly] [--json out.json]

Needs Python Playwright and a Chromium (PLAYWRIGHT_CHROMIUM may name its binary).
"""
import argparse, contextlib, glob, json, os, socket, statistics, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

SCENES = {
    "peak": ("PEAK", "mountains and a boat at sunset"),
    "tree": ("TREE", "a tree on a hill by a lake"),
    "town": ("TOWN", "a house and a cat in a field"),
    "night": ("MOON", "a lighthouse by the sea at night"),
}
CHECKPOINTS = [1000, 2000, 3000]
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")

# Every source of chance the studio draws on: Math.random and crypto's
# (the start's variation nonce and the autonomous studio's picks use it).
SEED_JS = """(() => {
  let s = %d >>> 0;
  const next = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  Math.random = next;
  if (globalThis.crypto) {
    crypto.getRandomValues = (array) => {
      const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(next() * 256);
      return array;
    };
  }
})();"""

METRICS_JS = """() => {
  const W = view.width, H = view.height, ref = strokePainter.enhanced, scene = strokePainter.plan?.scene;
  if (!ref || ref.length !== W * H * 4) return null;
  const can = vctx.getImageData(0, 0, W, H).data, cover = scene?.layer?.cover?.length === W * H ? scene.layer.cover : null;
  let all = 0, n = 0, edge = 0, ne = 0;
  for (let y = 3; y < H - 3; y += 2) for (let x = 3; x < W - 3; x += 2) {
    const i = y * W + x, o = i * 4;
    const d = (Math.abs(can[o] - ref[o]) + Math.abs(can[o + 1] - ref[o + 1]) + Math.abs(can[o + 2] - ref[o + 2])) / 3;
    all += d; n++;
    if (cover) {
      const c = cover[i] > 128;
      if (c !== (cover[i - 3] > 128) || c !== (cover[i + 3] > 128) || c !== (cover[i - 3 * W] > 128) || c !== (cover[i + 3 * W] > 128)) { edge += d; ne++; }
    }
  }
  const marks = strokeLog.strokes.filter((s) => !s.patch);
  return { strokes: strokePainter.strokes, error: all / n, edge: ne ? edge / ne : null,
    width: marks.reduce((sum, s) => sum + s.width, 0) / Math.max(1, marks.length) };
}"""


def chromium_path():
    if os.environ.get("PLAYWRIGHT_CHROMIUM"):
        return os.environ["PLAYWRIGHT_CHROMIUM"]
    found = sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome"))
    return found[-1] if found else None


@contextlib.contextmanager
def serve(root):
    sock = socket.socket(); sock.bind(("127.0.0.1", 0)); port = sock.getsockname()[1]; sock.close()
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", root],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            with contextlib.suppress(OSError), socket.create_connection(("127.0.0.1", port), timeout=0.2):
                break
            time.sleep(0.1)
        yield "http://127.0.0.1:%d/index.html" % port
    finally:
        proc.terminate()


def run_one(url, scene, config_js, seed, manner, cap_seconds):
    from playwright.sync_api import sync_playwright
    seed_text, words = SCENES[scene]
    with sync_playwright() as p:
        exe = chromium_path()
        browser = p.chromium.launch(**({"executable_path": exe} if exe else {}), args=["--no-sandbox"])
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        ctx.add_init_script(SEED_JS % seed)
        page = ctx.new_page()
        page.route("**/*supabase*/**", lambda r: r.abort())
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)[:200]))
        page.goto(url, wait_until="load")
        page.wait_for_timeout(1500)
        # The background taste simulation keeps learning (and so changing the
        # painter's choices) at whatever pace the machine allows: off.
        # Nor do the growers' shelves fill in the background (a bare shelf
        # paints the written drawing, the same every run).
        setup = ("if (typeof headlessSim !== 'undefined') { headlessSim.running = false; clearTimeout(headlessSim.timer); }; "
                 "if (typeof growing !== 'undefined') { growing.running = false; clearTimeout(growing.timer); }; " + (config_js or ""))
        if manner:
            setup += "; choosePlanManner = () => HexfieldCraft.manner(%s);" % json.dumps(manner)
        if setup.strip():
            page.evaluate("() => { %s }" % setup)
        page.fill("#seed", "")
        page.type("#seed", seed_text, delay=5)
        page.evaluate("(w) => { const b = document.getElementById('wordPrompt'); b.value = w; b.dispatchEvent(new Event('input', { bubbles: true })); }", words)
        page.wait_for_timeout(1200)
        page.click("#reseedNow", force=True)
        start, marks, pending = time.time(), {}, list(CHECKPOINTS)
        while pending and time.time() - start < cap_seconds:
            page.wait_for_timeout(250)
            done = page.evaluate("() => strokePainter.strokes || 0")
            while pending and done >= pending[0]:
                m = page.evaluate(METRICS_JS)
                if m:
                    m["seconds"] = round(time.time() - start, 1)
                    marks[pending[0]] = m
                pending.pop(0)
        browser.close()
        return {"scene": scene, "marks": marks, "errors": errors}


def summarise(results, configs):
    """Per configuration and checkpoint: means over scenes and repeats, and each
    configuration's change against the first, scene by scene."""
    lines = []
    keys = ["error", "edge", "width", "seconds"]
    for cp in CHECKPOINTS:
        lines.append("\n== at %d strokes ==" % cp)
        lines.append("%-14s" % "config" + "".join("%12s" % k for k in keys) + "%8s" % "runs")
        base = configs[0]
        for name in configs:
            rows = [r["marks"][cp] for r in results[name] if cp in r["marks"]]
            if not rows:
                lines.append("%-14s  (none reached)" % name); continue
            means = {k: statistics.mean([r[k] for r in rows if r.get(k) is not None]) if any(r.get(k) is not None for r in rows) else None for k in keys}
            lines.append("%-14s" % name + "".join(("%12.2f" % means[k]) if means[k] is not None else "%12s" % "-" for k in keys) + "%8d" % len(rows))
        # Scene by scene, against the first configuration.
        for name in configs[1:]:
            diffs = []
            for scene in sorted({r["scene"] for r in results[name]}):
                a = [r["marks"][cp] for r in results[base] if r["scene"] == scene and cp in r["marks"]]
                b = [r["marks"][cp] for r in results[name] if r["scene"] == scene and cp in r["marks"]]
                if a and b:
                    de = statistics.mean([x["error"] for x in b]) - statistics.mean([x["error"] for x in a])
                    ea = [x["edge"] for x in a if x.get("edge") is not None]; eb = [x["edge"] for x in b if x.get("edge") is not None]
                    dd = (statistics.mean(eb) - statistics.mean(ea)) if ea and eb else None
                    diffs.append("%s err %+.2f%s" % (scene, de, (" edge %+.2f" % dd) if dd is not None else ""))
            if diffs:
                lines.append("  %s vs %s: %s" % (name, base, " | ".join(diffs)))
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", action="append", default=[], help="NAME=JS, run before painting (first is the baseline)")
    ap.add_argument("--repeats", type=int, default=2)
    ap.add_argument("--parallel", type=int, default=4)
    ap.add_argument("--scenes", default="all")
    ap.add_argument("--manner", default="painterly", help="force a manner for comparability ('' to let it choose)")
    ap.add_argument("--cap", type=float, default=240, help="seconds a run may take at most")
    ap.add_argument("--json", default=None)
    args = ap.parse_args()
    configs = [c.split("=", 1) for c in (args.config or ["base="])]
    names = [n for n, _ in configs]
    scenes = list(SCENES) if args.scenes == "all" else args.scenes.split(",")
    jobs = [(name, js, scene, rep) for name, js in configs for scene in scenes for rep in range(args.repeats)]
    results = {name: [] for name in names}
    with serve(os.path.abspath(ROOT)) as url, ThreadPoolExecutor(max_workers=args.parallel) as pool:
        futures = {pool.submit(run_one, url, scene, js, 1000 + rep * 7919, args.manner or None, args.cap): (name, scene, rep)
                   for name, js, scene, rep in jobs}
        for fut, (name, scene, rep) in futures.items():
            res = fut.result()
            results[name].append(res)
            print("%-12s %-6s #%d %s%s" % (name, scene, rep, json.dumps({k: {kk: round(vv, 2) if isinstance(vv, float) else vv for kk, vv in v.items()} for k, v in res["marks"].items()}),
                                          (" ERRORS " + "; ".join(res["errors"])) if res["errors"] else ""), flush=True)
    print(summarise(results, names))
    if args.json:
        with open(args.json, "w") as f:
            json.dump(results, f, indent=1)


if __name__ == "__main__":
    main()
