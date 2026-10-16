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
camera.position.set(1.15, 1.55, 9.6);
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

function outlineGeometry(variant) {
  const width = 6.7, height = 2.85, depth = 0.92;
  if (variant === 0) return new THREE.BoxGeometry(width, height, depth);
  const hw = width / 2, hh = height / 2;
  const shape = new THREE.Shape();
  if (variant === 1) {
    const k = 0.32;
    shape.moveTo(-hw + k, -hh);
    shape.lineTo(hw - k, -hh);
    shape.lineTo(hw, -hh + k);
    shape.lineTo(hw, hh - k);
    shape.lineTo(hw - k, hh);
    shape.lineTo(-hw + k, hh);
    shape.lineTo(-hw, hh - k);
    shape.lineTo(-hw, -hh + k);
    shape.closePath();
  } else {
    const r = 0.4;
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    shape.closePath();
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, curveSegments: 6, bevelEnabled: false
  });
  geometry.translate(0, 0, -depth / 2);
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
    color, metalness: (seed % 3 === 1) ? 0.67 : 0.18,
    roughness: (seed % 3 === 1) ? 0.34 : 0.63,
    side: THREE.DoubleSide
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
  const baseGeo = outlineGeometry(currentSeed % 3);
  const engravingDepth = 0.25 + (currentSeed % 4) * 0.035;
  const textGeo = makeCutter(word, font, engravingDepth);
  const nextMaterials = createMaterials(currentSeed);
  let result = null, sourceMesh = null;
  try {
    const baseBrush = new Brush(baseGeo, nextMaterials[0]);
    baseBrush.updateMatrixWorld(true);
    const textBrush = new Brush(textGeo, nextMaterials[1]);
    // Plate front is z=+0.46. The cutter starts below the face, and extends
    // beyond it by 0.12, avoiding coplanar CSG surfaces.
    textBrush.position.z = 0.46 - engravingDepth;
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
  const formNames = ['RECTANGULAR SOLID', 'CHAMFERED SOLID', 'ROUNDED SOLID'];
  formName.textContent = formNames[currentSeed % 3];
  materialName.textContent = (currentSeed % 3 === 1 ? 'METALLIC' : 'MATTE') + ' / ' +
    colors[currentSeed % colors.length].toUpperCase();
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
  setStatus('Building first physical carving…');
  await rebuild();
} catch (error) {
  setStatus('3D unavailable: ' + (error?.message || error), true);
  exportButton.disabled = true;
}
