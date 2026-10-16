/* A shape stack is the quarry. A lettering template supplies a continuous
 * spine; the quarry's real alpha and colour seams constrain its cut contour.
 * No font is painted on top of the result. Masks are measured at a fixed
 * working size so screen, source comparison and PNG export share one cut. */
(function (root) {
  "use strict";
  const VERSION = 1;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cleanText = (v) => String(v || "HEXFIELD").normalize("NFKC").toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, 24) || "HEXFIELD";
  const makeCanvas = (w, h) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h; return c;
  };
  function hashBytes(bytes) {
    let h = 2166136261;
    for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i], 16777619);
    return (h >>> 0).toString(36).padStart(7, "0");
  }
  function random(seed) {
    let s = Number(seed) >>> 0;
    return () => {
      s += 0x6D2B79F5; let t = s;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function createStack(shapes, { seed = 1, aspect = 4.4, width = 880 } = {}) {
    const w = clamp(Math.round(width), 240, 1320);
    const h = clamp(Math.round(w / Math.max(1, aspect)), 96, 600);
    const canvas = makeCanvas(w, h), ctx = canvas.getContext("2d", { willReadFrequently: true });
    const material = (shapes || []).map((x) => x?.canvas || x)
      .filter((x) => x?.width > 0 && x?.height > 0);
    if (!material.length) return { canvas, sourceFingerprint: "empty", placements: [] };
    const sourceProbe = makeCanvas(24 * material.length, 24), pg = sourceProbe.getContext("2d");
    material.forEach((shape, i) => pg.drawImage(shape, i * 24, 0, 24, 24));
    const sourceFingerprint = hashBytes(pg.getImageData(0, 0, sourceProbe.width, 24).data);
    sourceProbe.width = 0;
    const rng = random((Number(seed) || 0) ^ parseInt(sourceFingerprint, 36));
    const count = Math.max(14, Math.min(24, material.length * 2));
    const placements = [];
    // Overlap actual silhouettes into one continuous working mass. The pieces
    // keep their aspect, pigment and alpha; nothing fills their empty corners.
    for (let i = 0; i < count; i++) {
      const index = Math.floor(rng() * material.length), shape = material[index];
      const naturalAspect = shape.width / Math.max(1, shape.height);
      const height = h * (.96 + rng() * .36);
      const dw = clamp(height * naturalAspect, w * .13, w * .29);
      const dh = Math.min(h * 1.38, dw / Math.max(.3, naturalAspect));
      const x = w * (.07 + .86 * i / (count - 1));
      const y = h * (.50 + (rng() - .5) * .12);
      const rotation = (rng() - .5) * .50;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
      ctx.drawImage(shape, -dw / 2, -dh / 2, dw, dh); ctx.restore();
      placements.push({ source: index, x: x / w, y: y / h, w: dw / w, h: dh / h, rotation });
    }
    return { canvas, sourceFingerprint, placements };
  }
  function sourceMeasures(data, w, h) {
    const occupancy = new Uint8Array(w * h), edge = new Float32Array(w * h);
    const columns = new Float64Array(w), rows = new Float64Array(h);
    let sx = 0, sy = 0, mass = 0, dxTotal = 0, dyTotal = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x, a = data[p * 4 + 3]; occupancy[p] = a;
      if (a < 16) continue;
      const weight = a / 255;
      columns[x] += weight; rows[y] += weight; mass += weight;
      sx += x * weight; sy += y * weight;
      if (!x || !y || x === w - 1 || y === h - 1) continue;
      const left = (p - 1) * 4, right = (p + 1) * 4;
      const top = (p - w) * 4, bottom = (p + w) * 4;
      const difference = (a, b) => Math.abs(data[a] - data[b]) +
        Math.abs(data[a + 1] - data[b + 1]) + Math.abs(data[a + 2] - data[b + 2]) +
        Math.abs(data[a + 3] - data[b + 3]);
      const dx = difference(left, right), dy = difference(top, bottom);
      edge[p] = Math.min(1, (dx + dy) / 320); dxTotal += dx; dyTotal += dy;
    }
    return { occupancy, edge, columns, rows, mass,
      cx: mass ? sx / mass : w / 2, cy: mass ? sy / mass : h / 2,
      axis: (dxTotal - dyTotal) / Math.max(1, dxTotal + dyTotal) };
  }
  function templateLayout(w, h, text, template, measures) {
    const chars = [...text], condensed = template === "condensed";
    const widths = chars.map((ch) => ch === " " ? .43 : "MW".includes(ch) ? .93 : "I1".includes(ch) ? .45 : condensed ? .58 : .72);
    const total = widths.reduce((a, b) => a + b, 0) + .20 * (chars.length - 1);
    const size = Math.min(h * .59, w * .80 / Math.max(1, total));
    const full = total * size;
    let x = clamp(measures.cx - full / 2, w * .065, w * .935 - full);
    const top = clamp(measures.cy - size / 2, h * .16, h * .84 - size);
    const bounds = [];
    for (let i = 0; i < chars.length; i++) {
      const gw = widths[i] * size;
      let density = 0, balance = 0, n = 0;
      const left = Math.max(0, Math.floor(x)), right = Math.min(w - 1, Math.ceil(x + gw));
      for (let xx = left; xx <= right; xx++) {
        density += measures.columns[xx] / h;
        balance += (xx - x - gw / 2) * measures.columns[xx] / h; n++;
      }
      const shear = clamp(balance / Math.max(1, density * gw) * .24 + measures.axis * .045, -.10, .10);
      bounds.push({ ch: chars[i], x, y: top, w: gw, h: size, shear,
        weight: .90 + clamp(density / Math.max(1, n), 0, 1) * .16 });
      x += gw + size * .20;
    }
    return bounds;
  }
  function drawTemplate(w, h, bounds, skeletons, template, thickness) {
    const canvas = makeCanvas(w, h), ctx = canvas.getContext("2d");
    ctx.strokeStyle = "white"; ctx.lineJoin = template === "rounded" ? "round" : "bevel";
    ctx.lineCap = template === "rounded" ? "round" : "butt";
    for (const b of bounds) {
      if (b.ch === " " || !skeletons[b.ch]) continue;
      ctx.save(); ctx.translate(b.x, b.y); ctx.transform(1, 0, b.shear, 1, -b.shear * b.h / 2, 0);
      ctx.lineWidth = b.h * thickness * b.weight;
      for (const stroke of skeletons[b.ch]) {
        ctx.beginPath();
        for (const command of stroke) {
          if (command[0] === "M") ctx.moveTo(command[1] * b.w, command[2] * b.h);
          else if (command[0] === "L") ctx.lineTo(command[1] * b.w, command[2] * b.h);
          else if (command[0] === "Q") ctx.quadraticCurveTo(command[1] * b.w, command[2] * b.h, command[3] * b.w, command[4] * b.h);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    const rgba = ctx.getImageData(0, 0, w, h).data, mask = new Uint8Array(w * h);
    for (let i = 0; i < mask.length; i++) mask[i] = rgba[i * 4 + 3];
    canvas.width = 0; return mask;
  }
  function derive(canvas, { text = "HEXFIELD", template = "block", skeletons = {} } = {}) {
    text = cleanText(text); template = ["block", "rounded", "condensed"].includes(template) ? template : "block";
    const w = canvas.width, h = canvas.height;
    const source = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    const measures = sourceMeasures(source, w, h);
    const glyphBounds = templateLayout(w, h, text, template, measures);
    const weight = template === "rounded" ? .143 : .147;
    const core = drawTemplate(w, h, glyphBounds, skeletons, template, weight * .62);
    const widths = [.62, .78, .94, 1.10, 1.28].map((scale) =>
      drawTemplate(w, h, glyphBounds, skeletons, template, weight * scale));
    const middle = widths[2], templateMask = widths[4];
    const cutMask = new Uint8Array(w * h), protectedMask = new Uint8Array(w * h);
    let changedPixels = 0, constrainedPixels = 0, protectedPixels = 0, contact = 0, spine = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x, occupied = measures.occupancy[p];
      if (core[p] > 128) { spine++; if (occupied > 128) contact++; }
      if (!templateMask[p] || !occupied) continue;
      // Seam strength changes the OUTLINE of this particular letter. A thin
      // protected spine stays continuous; all expansion fits inside the
      // counter-safe outer template and inside actual source material.
      const density = measures.columns[x] / Math.max(1, h);
      const seam = measures.edge[p];
      const amount = clamp(.12 + density * .60 + seam * .26, 0, 1);
      const at = amount * (widths.length - 1), lower = Math.floor(at), upper = Math.min(widths.length - 1, lower + 1);
      // Interpolate adjacent antialiased outlines, not the opacity of a wide
      // ring. Interior material is fully removed up to its measured contour.
      const alpha = Math.round(widths[lower][p] * (1 - (at - lower)) + widths[upper][p] * (at - lower));
      cutMask[p] = Math.min(occupied, Math.max(core[p], alpha));
      protectedMask[p] = Math.min(occupied, core[p]);
      if (cutMask[p] > 8) changedPixels++;
      if (protectedMask[p] > 128) protectedPixels++;
      if (Math.abs(cutMask[p] - Math.min(occupied, middle[p])) > 12) constrainedPixels++;
    }
    return { version: VERSION, w, h, text, template, sourceFingerprint: hashBytes(source),
      stackFingerprint: hashBytes(source), maskFingerprint: hashBytes(cutMask),
      changedPixels, constrainedPixels, protectedPixels,
      materialCoverage: measures.mass / Math.max(1, w * h),
      skeletonContact: contact / Math.max(1, spine),
      glyphBounds, cutMask, protectedMask, templateMask, occupancy: measures.occupancy };
  }
  function carveLayer(canvas, plan) {
    const out = makeCanvas(canvas.width, canvas.height), ctx = out.getContext("2d");
    ctx.drawImage(canvas, 0, 0);
    const mask = makeCanvas(plan.w, plan.h), mg = mask.getContext("2d"), image = mg.createImageData(plan.w, plan.h);
    for (let i = 0; i < plan.cutMask.length; i++) image.data[i * 4 + 3] = plan.cutMask[i];
    mg.putImageData(image, 0, 0);
    ctx.globalCompositeOperation = "destination-out"; ctx.drawImage(mask, 0, 0, out.width, out.height);
    ctx.globalCompositeOperation = "source-over"; mask.width = 0;
    return out;
  }
  function compose(ctx, W, H, options = {}) {
    const stack = options.stack || createStack(options.shapes, { seed: options.seed, aspect: W / H });
    const plan = derive(stack.canvas, options);
    plan.harvestFingerprint = stack.sourceFingerprint;
    plan.mode = options.mode === "off" ? "off" : "carve";
    plan.shapeCount = stack.placements?.length || 0;
    const carved = plan.mode === "carve" ? carveLayer(stack.canvas, plan) : stack.canvas;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#eee8dd"; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(carved, 0, 0, W, H); ctx.restore();
    if (carved !== stack.canvas) carved.width = 0;
    return plan;
  }
  root.HexfieldCarving = { VERSION, cleanText, createStack, derive, carveLayer, compose };
})(typeof window === "undefined" ? globalThis : window);
