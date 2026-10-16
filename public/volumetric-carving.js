/*
 * Hexfield / volumetric carving experiment.
 * Real watertight glyph cutters are subtracted from a solid THREE.BufferGeometry.
 * Kept separate from the original 2D painter until the CSG path is verified.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#geometryCanvas');
const status = $('#geometryStatus');
const wordInput = $('#geometryWord');
const newForm = $('#geometryReseed');
const compare = $('#geometryCompare');
const exportButton = $('#geometryExport');
const formName = $('#geometryFormName');
const materialName = $('#geometryMaterialName');
const geometryInfo = $('#geometryInfo');
const cleanText = (value) => (String(value || 'HEXFIELD').normalize('NFKC')
  .toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ')
  .trim().slice(0, 24) || 'HEXFIELD');

function setStatus(message, failed = false) {
  status.textContent = message;
  status.dataset.error = String(failed);
}
function readStartingRecipe() {
  try {
    const result = JSON.parse(sessionStorage.getItem('hexfield:volumetric-source') || 'null');
    if (result && typeof result === 'object') return result;
  } catch {}
  return {};
}
const source = readStartingRecipe();
wordInput.value = cleanText(source.text || new URLSearchParams(location.search).get('text') || 'HEXFIELD');
const sourceColors = (Array.isArray(source.colors) ? source.colors : [])
  .filter((color) => typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color))
  .slice(0, 5);
const defaultColors = ['#428798', '#ca8960', '#7da596', '#a77fb6', '#d1b35f'];
const colors = sourceColors.length >= 2 ? sourceColors : defaultColors;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#101820');
const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
camera.position.set(3.15, 1.95, 9.3);
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, powerPreference: 'default'
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.14;
controls.enablePan = false;
controls.minDistance = 4.8;
controls.maxDistance = 15;
controls.minPolarAngle = 0.2;
controls.maxPolarAngle = Math.PI - 0.2;
controls.target.set(0, 0, 0);
const hemi = new THREE.HemisphereLight('#dff0ff', '#50402f', 2.2);
scene.add(hemi);
const key = new THREE.DirectionalLight('#fff4db', 4.1);
key.position.set(-3, 5, 8);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 7;
key.shadow.camera.bottom = -7;
key.shadow.bias = -0.00008;
scene.add(key);
const fill = new THREE.DirectionalLight('#9acdec', 1.9);
fill.position.set(4, -2, -3);
scene.add(fill);

let scheduled = 0;
function renderFrame() {
  scheduled = 0;
  controls.update();
  renderer.render(scene, camera);
}
function invalidate() {
  if (!scheduled) scheduled = requestAnimationFrame(renderFrame);
}
controls.addEventListener('change', invalidate);
const resize = () => {
  const box = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(box.width));
  const h = Math.max(1, Math.round(box.height));
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  invalidate();
};
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
else window.addEventListener('resize', resize);
resize();


let surfaceTexture = null;
let samplePixels = null;
let sourceIsHexfield = false;
const textureWidth = 640, textureHeight = 270;
const resolutionX = matchMedia('(pointer: coarse)').matches ? 34 : 54;
const resolutionY = Math.round(resolutionX * 2.85 / 6.7);
const frontFace = 0.46;
const polygonSeed = (seed) => {
  let x = (seed + 1) >>> 0;
  return () => {
    x += 0x6D2B79F5;
    let n = x;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
};
function generatedArtwork() {
  const c = document.createElement('canvas');
  c.width = textureWidth; c.height = textureHeight;
  const g = c.getContext('2d');
  g.fillStyle = '#192c33'; g.fillRect(0, 0, c.width, c.height);
  const rng = polygonSeed(17);
  for (let i = 0; i < 25; i++) {
    g.globalAlpha = .60 + rng() * .36;
    g.fillStyle = colors[i % colors.length];
    const x = c.width * (i / 25 + (rng() - .5) * .22);
    const y = c.height * (.15 + rng() * .7);
    const w = c.width * (.08 + rng() * .28);
    const h = c.height * (.18 + rng() * .56);
    g.save(); g.translate(x, y); g.rotate((rng() - .5) * 1.2);
    g.beginPath();
    g.moveTo(-w / 2, -h / 3); g.lineTo(w / 2, -h / 2);
    g.lineTo(w / 3, h / 2); g.lineTo(-w / 2, h / 3);
    g.closePath(); g.fill(); g.restore();
  }
  g.globalAlpha = 1;
  return c;
}
async function hydrateSourceArtwork() {
  let imageCanvas = generatedArtwork();
  const data = typeof source.image === 'string' && /^data:image\/(?:png|jpeg);base64,/.test(source.image)
    && source.image.length < 900000 ? source.image : null;
  if (data) {
    try {
      const img = new Image();
      img.src = data;
      await img.decode();
      const captured = document.createElement('canvas');
      captured.width = textureWidth; captured.height = textureHeight;
      captured.getContext('2d').drawImage(img, 0, 0, captured.width, captured.height);
      imageCanvas = captured;
      sourceIsHexfield = true;
    } catch (error) {
      console.warn('Hexfield artwork snapshot could not be decoded', error);
    }
  }
  const samplingCanvas = document.createElement('canvas');
  samplingCanvas.width = resolutionX + 1;
  samplingCanvas.height = resolutionY + 1;
  const g = samplingCanvas.getContext('2d', { willReadFrequently: true });
  g.drawImage(imageCanvas, 0, 0, samplingCanvas.width, samplingCanvas.height);
  samplePixels = g.getImageData(0, 0, samplingCanvas.width, samplingCanvas.height).data;
  surfaceTexture = new THREE.CanvasTexture(imageCanvas);
  surfaceTexture.colorSpace = THREE.SRGBColorSpace;
  surfaceTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
}
function reliefGeometry(seed) {
  if (!samplePixels) throw new Error('No source painting available for physical relief');
  const nx = resolutionX, ny = resolutionY;
  const width = 6.7, height = 2.85;
  const vertexCount = (nx + 1) * (ny + 1);
  const pos = new Float32Array(vertexCount * 2 * 3);
  const uvs = new Float32Array(vertexCount * 2 * 2);
  const indices = [];
  const idx = (x, y) => y * (nx + 1) + x;
  const src = (x, y) => ((ny - y) * (nx + 1) + x) * 4;
  const alphaAt = (x, y) => samplePixels[src(x, y) + 3];
  const reliefAt = (x, y) => {
    const offset = src(x, y);
    const r = samplePixels[offset] / 255, g = samplePixels[offset + 1] / 255;
    const b = samplePixels[offset + 2] / 255;
    const pigment = Math.max(r, g, b) - Math.min(r, g, b);
    const luminance = (r * .21 + g * .72 + b * .07);
    const variation = Math.sin((x / nx * 14 + seed * .35)) *
      Math.cos((y / ny * 11 - seed * .27));
    return .023 + pigment * .088 + luminance * .030 + variation * .013;
  };
  // Sample the true transparent quarry. Missing material must be missing
  // faces, not merely alpha-blended pigments over a solid rectangular plate.
  const shaped = sourceIsHexfield && source.sourceKind === 'uncut-hexfield-shapes';
  const occupancy = new Uint8Array(nx * ny);
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const coverage = (alphaAt(x, y) + alphaAt(x + 1, y) +
      alphaAt(x, y + 1) + alphaAt(x + 1, y + 1)) / 4;
    occupancy[y * nx + x] = !shaped || coverage >= 68 ? 1 : 0;
  }
  const cell = (x, y) => x < 0 || y < 0 || x >= nx || y >= ny ?
    0 : occupancy[y * nx + x];
  if (shaped) {
    // A diagonal-only contact is not a two-manifold boundary. Bridge it.
    for (let pass = 0; pass < 2; pass++)
      for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
        if (cell(x, y) && cell(x + 1, y + 1) &&
            !cell(x + 1, y) && !cell(x, y + 1)) occupancy[y * nx + x + 1] = 1;
        else if (cell(x + 1, y) && cell(x, y + 1) &&
          !cell(x, y) && !cell(x + 1, y + 1)) occupancy[y * nx + x] = 1;
      }
    // Small detached islands and one-cell debris are CSG instability hazards.
    // Keep the largest 4-connected volume as the print-oriented solid.
    const visited = new Uint8Array(occupancy.length);
    let largest = [];
    for (let i = 0; i < occupancy.length; i++) {
      if (!occupancy[i] || visited[i]) continue;
      const q = [i];
      visited[i] = 1;
      for (let at = 0; at < q.length; at++) {
        const n = q[at], cx = n % nx, cy = Math.floor(n / nx);
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const xx = cx + dx, yy = cy + dy, k = yy * nx + xx;
          if (xx < 0 || yy < 0 || xx >= nx || yy >= ny ||
              !occupancy[k] || visited[k]) continue;
          visited[k] = 1;
          q.push(k);
        }
      }
      if (q.length > largest.length) largest = q;
    }
    if (largest.length >= Math.ceil(occupancy.length * .14)) {
      occupancy.fill(0);
      for (const i of largest) occupancy[i] = 1;
    } else {
      // Never produce a broken or empty model from sparse source data.
      occupancy.fill(1);
    }
  }
  for (let y = 0; y <= ny; y++) {
    for (let x = 0; x <= nx; x++) {
      const i = idx(x, y), u = x / nx, v = y / ny;
      let px = (u - .5) * width, py = (v - .5) * height;
      const offset = src(x, y);
      const spread = (Math.max(samplePixels[offset], samplePixels[offset + 1], samplePixels[offset + 2]) -
        Math.min(samplePixels[offset], samplePixels[offset + 1], samplePixels[offset + 2])) / 255;
      const edgeMovement = .065 + .10 * spread +
        .032 * Math.sin(11 * u + 7 * v + seed * .41);
      if (x === 0) px += edgeMovement;
      if (x === nx) px -= edgeMovement;
      if (y === 0) py += edgeMovement * .66;
      if (y === ny) py -= edgeMovement * .66;
      pos[i * 3] = px;
      pos[i * 3 + 1] = py;
      pos[i * 3 + 2] = frontFace + reliefAt(x, y);
      pos[(vertexCount + i) * 3] = px;
      pos[(vertexCount + i) * 3 + 1] = py;
      pos[(vertexCount + i) * 3 + 2] = -.46;
      uvs[i * 2] = u; uvs[i * 2 + 1] = v;
      uvs[(vertexCount + i) * 2] = u;
      uvs[(vertexCount + i) * 2 + 1] = v;
    }
  }
  const wall = (a, b) => {
    indices.push(a, vertexCount + a, vertexCount + b, a, vertexCount + b, b);
  };
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      if (!cell(x, y)) continue;
      const a = idx(x, y), b = idx(x + 1, y);
      const c = idx(x, y + 1), d = idx(x + 1, y + 1);
      indices.push(a, b, d, a, d, c);
      indices.push(vertexCount + a, vertexCount + d, vertexCount + b,
        vertexCount + a, vertexCount + c, vertexCount + d);
      if (!cell(x, y - 1)) wall(a, b);
      if (!cell(x + 1, y)) wall(b, d);
      if (!cell(x, y + 1)) wall(d, c);
      if (!cell(x - 1, y)) wall(c, a);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function makeCutter(word, font, depth) {
  const geometry = new TextGeometry(word, {
    font,
    size: 1,
    depth: depth + 0.12,
    curveSegments: 5,
    bevelEnabled: false
  });
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  const w = bounds.max.x - bounds.min.x;
  const h = bounds.max.y - bounds.min.y;
  if (w < 0.001 || h < 0.001) throw new Error('The word has no measurable glyph outline');
  const scale = Math.min(5.98 / w, 1.99 / h);
  geometry.scale(scale, scale, 1);
  geometry.computeBoundingBox();
  const b = geometry.boundingBox;
  geometry.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0);
  return geometry;
}
function createMaterials(seed) {
  const color = colors[seed % colors.length];
  const base = new THREE.MeshStandardMaterial({
    color: surfaceTexture ? '#ffffff' : color,
    map: surfaceTexture, metalness: 0.06, roughness: 0.72,
    side: THREE.DoubleSide,
    alphaTest: sourceIsHexfield && source.sourceKind === 'uncut-hexfield-shapes' ? .07 : 0
  });
  const cavity = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.42),
    metalness: 0.18, roughness: 0.82, side: THREE.DoubleSide
  });
  return [base, cavity];
}
function disposeObject(mesh) {
  if (!mesh) return;
  scene.remove(mesh);
  mesh.geometry?.dispose();
}
function triangleCount(geometry) {
  const count = geometry.index ? geometry.index.count : geometry.attributes.position.count;
  const start = Math.max(0, geometry.drawRange.start || 0);
  const requested = geometry.drawRange.count;
  return Math.floor(Math.max(0, Math.min(count - start,
    Number.isFinite(requested) ? requested : count)) / 3);
}
function validateGeometry(geometry) {
  const attr = geometry.getAttribute('position');
  if (!attr || triangleCount(geometry) < 12) throw new Error('CSG returned an empty mesh');
  for (let i = 0; i < attr.count; i++) {
    if (!Number.isFinite(attr.getX(i)) || !Number.isFinite(attr.getY(i)) ||
        !Number.isFinite(attr.getZ(i))) throw new Error('CSG returned non-finite vertices');
  }
}
const evaluator = new Evaluator();
evaluator.useGroups = true;
evaluator.consolidateGroups = true;
let font = null;
let carved = null, plain = null, currentMaterials = [];
let currentWord = '', currentSeed = 0, buildSerial = 0;
let isComparing = false;
let pendingTimer = null;
async function rebuild() {
  if (!font) return;
  const build = ++buildSerial;
  const word = cleanText(wordInput.value);
  const started = performance.now();
  exportButton.disabled = true;
  setStatus('Cutting the actual mesh · vector glyphs → BVH → Boolean subtraction…');
  // Yield a frame for the status and cancel obsolete keystroke changes.
  await new Promise((resolve) => requestAnimationFrame(resolve));
  if (build !== buildSerial) return;
  const baseGeo = reliefGeometry(currentSeed);
  const engravingDepth = 0.25 + (currentSeed % 4) * 0.035;
  const textGeo = makeCutter(word, font, engravingDepth + 0.26);
  const nextMaterials = createMaterials(currentSeed);
  let result = null, sourceMesh = null;
  try {
    const baseBrush = new Brush(baseGeo, nextMaterials[0]);
    baseBrush.updateMatrixWorld(true);
    const textBrush = new Brush(textGeo, nextMaterials[1]);
    // Plate front is z=+0.46. The cutter starts below the face, and extends
    // beyond it by 0.12, avoiding coplanar CSG surfaces.
    textBrush.position.z = frontFace - engravingDepth;
    textBrush.updateMatrixWorld(true);
    result = evaluator.evaluate(baseBrush, textBrush, SUBTRACTION);
    validateGeometry(result.geometry);
    sourceMesh = new THREE.Mesh(baseGeo.clone(), nextMaterials[0]);
    sourceMesh.castShadow = true;
    sourceMesh.receiveShadow = true;
  } catch (error) {
    result?.geometry.dispose();
    sourceMesh?.geometry.dispose();
    nextMaterials.forEach((material) => material.dispose());
    setStatus('Geometry failed: ' + (error?.message || error), true);
    return;
  } finally {
    baseGeo.dispose();
    textGeo.dispose();
  }
  if (build !== buildSerial) {
    result.geometry.dispose();
    sourceMesh.geometry.dispose();
    nextMaterials.forEach((material) => material.dispose());
    return;
  }
  disposeObject(carved);
  disposeObject(plain);
  currentMaterials.forEach((material) => material.dispose());
  currentMaterials = nextMaterials;
  carved = result;
  carved.castShadow = true;
  carved.receiveShadow = true;
  plain = sourceMesh;
  scene.add(carved);
  scene.add(plain);
  currentWord = word;
  wordInput.value = word;
  setComparison(isComparing);
  formName.textContent = sourceIsHexfield ? 'YOUR CURRENT PAINTING / TRUE RELIEF' : 'AUTO-GENERATED PIGMENT / TRUE RELIEF';
  materialName.textContent = sourceIsHexfield ? 'HEXFIELD CANVAS COLOURS + SCULPTED DEPTH' : 'GENERATIVE PIGMENT + SCULPTED DEPTH';
  geometryInfo.textContent = triangleCount(result.geometry).toLocaleString() +
    ' triangles · ' + engravingDepth.toFixed(2) + ' units deep · ' +
    Math.round(performance.now() - started) + ' ms to bake';
  exportButton.disabled = false;
  setStatus('Physical cavity baked. Orbit to see its walls and parallax.');
  invalidate();
}
function setComparison(showSolid) {
  isComparing = Boolean(showSolid);
  if (carved) carved.visible = !isComparing;
  if (plain) plain.visible = isComparing;
  compare.textContent = isComparing ? 'SHOW CARVED SOLID' : 'SHOW UNCUT SOLID';
  invalidate();
}
function scheduleBuild() {
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => rebuild().catch(error =>
    setStatus('Geometry failed: ' + (error?.message || error), true)), 380);
}
wordInput.addEventListener('input', scheduleBuild);
wordInput.addEventListener('change', scheduleBuild);
$('#geometryForm').addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(pendingTimer);
  rebuild().catch(error => setStatus('Geometry failed: ' + (error?.message || error), true));
});
newForm.addEventListener('click', () => {
  currentSeed++;
  clearTimeout(pendingTimer);
  rebuild().catch(error => setStatus('Geometry failed: ' + (error?.message || error), true));
});
compare.addEventListener('click', () => setComparison(!isComparing));

// CSG may allocate oversized draw buffers. Trim to exactly the active draw
// range before passing to STLExporter; otherwise unused triangles can leak.
function printableMesh(source) {
  const geometry = source.geometry;
  const position = geometry.getAttribute('position');
  const indices = geometry.index;
  const max = indices ? indices.count : position.count;
  const start = Math.max(0, geometry.drawRange.start || 0);
  const count = Math.max(0, Math.min(max - start,
    Number.isFinite(geometry.drawRange.count) ? geometry.drawRange.count : max));
  const triangles = Math.floor(count / 3);
  const coords = new Float32Array(triangles * 9);
  for (let i = 0; i < triangles * 3; i++) {
    const v = indices ? indices.getX(start + i) : start + i;
    coords[i * 3] = position.getX(v);
    coords[i * 3 + 1] = position.getY(v);
    coords[i * 3 + 2] = position.getZ(v);
  }
  const trimmed = new THREE.BufferGeometry();
  trimmed.setAttribute('position', new THREE.BufferAttribute(coords, 3));
  trimmed.computeVertexNormals();
  const mesh = new THREE.Mesh(trimmed);
  mesh.updateMatrixWorld(true);
  return mesh;
}
exportButton.addEventListener('click', () => {
  if (!carved || exportButton.disabled) return;
  let trimmed;
  try {
    trimmed = printableMesh(carved);
    const data = new STLExporter().parse(trimmed, {binary: true});
    const url = URL.createObjectURL(new Blob([data], {type: 'model/stl'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hexfield-' + currentWord.toLowerCase().replace(/\s+/g, '-') + '-carved.stl';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (error) {
    setStatus('STL export failed: ' + (error?.message || error), true);
  } finally {
    trimmed?.geometry.dispose();
  }
});

try {
  setStatus('Loading vector glyphs and geometry tools…');
  const loader = new FontLoader();
  // Typeface JSON is a true vector font; the text mesh is not a canvas overlay.
  font = await loader.loadAsync(
    'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json'
  );
  setStatus('Reading artwork pixels and constructing the physical relief…');
  await hydrateSourceArtwork();
  setStatus('Building first physical carving…');
  await rebuild();
} catch (error) {
  setStatus('3D unavailable: ' + (error?.message || error), true);
  exportButton.disabled = true;
}
