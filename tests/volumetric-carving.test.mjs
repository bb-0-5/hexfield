/* Regression: the source-derived relief itself is a closed 3D mesh and the
 * CSG engraving cuts real cavity floors into it, not an unrelated box. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

const root = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const script = root('public/volumetric-carving.js');
const page = root('public/3d-carving.html');
const main = root('public/index.html');
const launcher = root('public/3d-carving-launcher.js');

assert.match(page, /id="geometryCanvas"/);
assert.match(page, /three-bvh-csg@0\.0\.18/);
assert.match(page, /src="\/3d-carving\.js"/);
assert.match(main, /id="open3DCut" href="\/3d-carving\.html"/);
assert.match(main, /3d-carving-launcher\.js/);
assert.match(launcher, /getStack\?\.\(\)\?\.canvas/);
assert.match(launcher, /uncut-hexfield-shapes/);
assert.match(script, /evaluator\.evaluate\(baseBrush, textBrush, SUBTRACTION\)/);
assert.match(script, /new TextGeometry\(word/);
assert.match(script, /new STLExporter\(\)\.parse/);
assert.match(script, /function reliefGeometry\(seed\)/);
assert.doesNotMatch(script, /globalCompositeOperation\s*=\s*['"]destination-out/);

// Execute the actual production geometry factory in isolation, with a small
// synthetic alpha-and-colour shape stack. This tests topology rather than
// depending on the page's WebGL renderer or external CDN at CI time.
const begin = script.indexOf('function reliefGeometry(seed) {');
const finish = script.indexOf('\nfunction makeCutter(word, font, depth) {', begin);
assert.ok(begin >= 0 && finish > begin, 'Production relief function is present');
const factorySource = script.slice(begin, finish);
const nx = 24, ny = 12;
const pixels = new Uint8ClampedArray((nx + 1) * (ny + 1) * 4);
for (let y = 0; y <= ny; y++) for (let x = 0; x <= nx; x++) {
  const i = (y * (nx + 1) + x) * 4;
  pixels[i] = 70 + (x * 11) % 160;
  pixels[i + 1] = 45 + (y * 13) % 170;
  pixels[i + 2] = 115 + (x * 3 + y * 7) % 115;
  pixels[i + 3] = y >= 1 + (x % 5 === 0 ? 1 : 0) &&
    y <= ny - 1 - (x % 6 === 0 ? 1 : 0) ? 255 : 0;
}
const relief = new Function('THREE','resolutionX','resolutionY','samplePixels',
  'frontFace',factorySource + '\nreturn reliefGeometry;')(
  THREE,nx,ny,pixels,0.46
);
const plaque = relief(0);
assert.ok(plaque.index && plaque.getAttribute('uv'));
plaque.computeBoundingBox();
assert.ok(plaque.boundingBox.max.z > .46, 'Pigment really raises the front surface');
assert.ok(plaque.boundingBox.min.z < -.45, 'A solid back exists');

// Each undirected edge occurs twice, with opposite directed orientations.
// This is the closed two-manifold topology required by CSG input.
const edges = new Map(), index = plaque.index;
for (let i = 0; i < index.count; i += 3) {
  const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
  for (const [from, to] of [[a,b],[b,c],[c,a]]) {
    const key = Math.min(from,to) + ',' + Math.max(from,to);
    const entry = edges.get(key) || {count:0,winding:0};
    entry.count++;
    entry.winding += from < to ? 1 : -1;
    edges.set(key,entry);
  }
}
for (const entry of edges.values()) {
  assert.equal(entry.count,2,'Every original solid edge has exactly two incident triangles');
  assert.equal(entry.winding,0,'Every shared edge has opposite triangle winding');
}

const fontLocation = fileURLToPath(new URL(
  '../node_modules/three/examples/fonts/helvetiker_bold.typeface.json', import.meta.url
));
const font = new FontLoader().parse(JSON.parse(readFileSync(fontLocation, 'utf8')));
const text = new TextGeometry('HEXFIELD', {
  font, size:1, depth:.7, curveSegments:5, bevelEnabled:false
});
text.computeBoundingBox();
const bounds = text.boundingBox;
const scale = Math.min(5.98 / (bounds.max.x - bounds.min.x),
  1.99 / (bounds.max.y - bounds.min.y));
text.scale(scale,scale,1);
text.computeBoundingBox();
const b = text.boundingBox;
text.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0);
const baseBrush = new Brush(plaque, new THREE.MeshStandardMaterial());
const cutterBrush = new Brush(text, new THREE.MeshStandardMaterial());
cutterBrush.position.z = .46 - .32;
baseBrush.updateMatrixWorld(true);
cutterBrush.updateMatrixWorld(true);
const evaluator = new Evaluator();
evaluator.useGroups = true;
evaluator.consolidateGroups = true;
const cut = evaluator.evaluate(baseBrush, cutterBrush, SUBTRACTION);
const attr = cut.geometry.getAttribute('position');
assert.ok(attr && attr.count > plaque.getAttribute('position').count,
  'CSG creates vertices beyond the source-derived relief mesh');
let cavityFloor = 0;
for (let i = 0; i < attr.count; i++) {
  const z = attr.getZ(i);
  assert.ok(Number.isFinite(attr.getX(i)) && Number.isFinite(attr.getY(i)) &&
    Number.isFinite(z), 'No nonfinite carved vertices');
  if (Math.abs(z - .14) < .002) cavityFloor++;
}
assert.ok(cavityFloor > 5,'Real glyph cavity floor lies below the source surface');
cut.geometry.dispose();
plaque.dispose();
text.dispose();
console.log('Hexfield volume: original solid edge manifold, alpha-derived outline, true inset text cavity and STL hook passed.');
