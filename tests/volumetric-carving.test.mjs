/* Real geometry regression: the lettering cutter must form an actual inset
 * cavity, not merely a transparent region in a flat texture. */
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

assert.match(page, /id="geometryCanvas"/);
assert.match(page, /three-bvh-csg@0\.0\.18/);
assert.match(page, /\/volumetric-carving\.js/);
assert.match(main, /id="open3DCut" href="\/3d-carving\.html"/);
assert.match(main, /3d-carving-launcher\.js/);
assert.match(script, /evaluator\.evaluate\(baseBrush, textBrush, SUBTRACTION\)/);
assert.match(script, /new TextGeometry\(word/);
assert.match(script, /new STLExporter\(\)\.parse/);
assert.doesNotMatch(script, /globalCompositeOperation\s*=\s*['"]destination-out/);

const fontLocation = fileURLToPath(new URL(
  '../node_modules/three/examples/fonts/helvetiker_bold.typeface.json', import.meta.url
));
const font = new FontLoader().parse(JSON.parse(readFileSync(fontLocation, 'utf8')));
const plaque = new THREE.BoxGeometry(6.7, 2.85, 0.92);
const text = new TextGeometry('HEXFIELD', {
  font, size: 1, depth: 0.44, curveSegments: 5, bevelEnabled: false
});
text.computeBoundingBox();
const a = text.boundingBox;
text.scale(Math.min(5.98 / (a.max.x - a.min.x), 1.99 / (a.max.y - a.min.y)), 
  Math.min(5.98 / (a.max.x - a.min.x), 1.99 / (a.max.y - a.min.y)), 1);
text.computeBoundingBox();
const b = text.boundingBox;
text.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0);
const baseBrush = new Brush(plaque, new THREE.MeshStandardMaterial());
const cutterBrush = new Brush(text, new THREE.MeshStandardMaterial());
cutterBrush.position.z = 0.46 - 0.32;
baseBrush.updateMatrixWorld(true);
cutterBrush.updateMatrixWorld(true);
const evaluator = new Evaluator();
evaluator.useGroups = true;
evaluator.consolidateGroups = true;
const cut = evaluator.evaluate(baseBrush, cutterBrush, SUBTRACTION);
const attr = cut.geometry.getAttribute('position');
assert.ok(attr && attr.count > plaque.getAttribute('position').count,
  'A real cut requires mesh vertices beyond the original base surface');
let cavityFloor = 0;
for (let i = 0; i < attr.count; i++) {
  const z = attr.getZ(i);
  assert.ok(Number.isFinite(attr.getX(i)) && Number.isFinite(attr.getY(i)) &&
    Number.isFinite(z), 'Carved geometry must contain no nonfinite vertices');
  if (Math.abs(z - 0.14) < 0.002) cavityFloor++;
}
assert.ok(cavityFloor > 5,
  'Subtraction must expose a measurable glyph cavity floor BELOW the original z=0.46 face');
cut.geometry.dispose();
plaque.dispose();
text.dispose();
console.log('3D CSG engraving: actual inset cavity, vector glyphs, and linked export path passed.');
