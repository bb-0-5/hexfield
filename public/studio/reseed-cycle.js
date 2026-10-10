/* 333 / one button explores every real brush family and typography.
 * An ordinal maps to a reproducible design experiment; no 14 sliders.
 * Coprime family counts ensure every cross-combination is visited.
 */
import {STYLE_PRESETS} from './style-presets.js';
import {TYPE_GRAMMARS} from './type-genome.js';
export const RESEED_TYPE_ORDER=Object.freeze([
 'bubble','block','rounded','architectural','kinetic','split'
]);
const safe=n=>Math.max(1,Math.floor(Number(n)||1));
export function reseedProfile(ordinal=1){
 const index=safe(ordinal)-1;
 const available=RESEED_TYPE_ORDER.filter(x=>TYPE_GRAMMARS.includes(x));
 const paint=STYLE_PRESETS[index%STYLE_PRESETS.length];
 return {ordinal:index+1,style:paint.id,
  grammar:available[index%available.length],
  chapter:Math.floor(index/(STYLE_PRESETS.length*available.length))};
}
