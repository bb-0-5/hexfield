/* HEXFIELD 327 — visibly different, repeatable executable style configurations.
 * The style names are contracts for REAL mark/law/rework operations.
 * The same immutable source + style + seed + words gives the same pixels.
 */
import {makeRecipe} from './rule-engine.js';
export const STYLE_PRESETS=Object.freeze([
 Object.freeze({id:'ink',name:'INK DRAWING',
   mark:'hatch',law:'density_contrast',secondary:'none',
   mix:'edges',rework:'none'}),
 Object.freeze({id:'stipple',name:'POINTILLIST',
   mark:'dots',law:'no_shading',secondary:'none',
   mix:'quilt',rework:'none'}),
 Object.freeze({id:'poster',name:'CUT PAPER',
   mark:'cutout',law:'no_shading',secondary:'no_curves',
   mix:'cutaway',rework:'none'}),
 Object.freeze({id:'engrave',name:'ENGRAVED',
   mark:'carve',law:'bright_shadow',secondary:'density_contrast',
   mix:'relief',rework:'none'}),
 Object.freeze({id:'expression',name:'GESTURAL',
   mark:'invented',law:'warm_cool_swap',secondary:'unclosed_forms',
   mix:'dissonance',rework:'misread'})
]);
export const ABSTRACTION_LEVELS=Object.freeze({
 gentle:Object.freeze({name:'LOW / RECOGNISABLE',description:
  'Retain a clear reference, remove destructive reabstraction and preserve structure.'}),
 balanced:Object.freeze({name:'MEDIUM / TRANSFORM',description:
  'Allow more procedural mixing without flattening the reference into coarse masses.'}),
 wild:Object.freeze({name:'HIGH / EXPERIMENTAL',description:
  'Let source fragments, distorted space and material reabstraction compete.'})
});
export const styleById=id=>STYLE_PRESETS.find(s=>s.id===id)||STYLE_PRESETS[0];
export function nextStyle(id='ink'){
 const i=STYLE_PRESETS.findIndex(p=>p.id===id);
 return STYLE_PRESETS[(i+1+STYLE_PRESETS.length)%STYLE_PRESETS.length];
}
export function applyStyleRecipe(recipe,{
 style='ink',abstraction='gentle'
}={}){
 const preset=styleById(style),level=abstraction in ABSTRACTION_LEVELS?
  abstraction:'gentle';
 recipe.primary=preset.law;
 recipe.secondary=preset.secondary;
 recipe.mark=preset.mark;
 // A style change must NOT fall back to hybrid with 15 different
 // mark languages: that defeated reproducible visible stylistic identity.
 recipe.rework=level==='gentle'?'none':
  level==='balanced'?(preset.rework==='misread'?'none':preset.rework):
  preset.rework==='none'?'abstract_masses':preset.rework;
 recipe.styleId=preset.id;
 recipe.abstractionLevel=level;
 return recipe;
}
export function styleRecipe({style='ink',abstraction='gentle',seed=1,
 subject='sphere',generation=1,parentId=null}={}){
 const preset=styleById(style),value=Number(seed)>>>0;
 const recipe=makeRecipe({
  id:'style-'+preset.id+'-'+value.toString(36),
  seed:value,subject,
  generation,parentId,
  primary:preset.law,secondary:preset.secondary,
  mark:preset.mark,rework:'none'
 });
 return applyStyleRecipe(recipe,{style:preset.id,abstraction});
}
export function styleReference(inputs,{abstraction='gentle'}={}){
 if(abstraction!=='gentle')return null;
 const preferred=['upload','imagination','reality','terrain','parent'];
 for(const key of preferred){
  const found=inputs?.find(x=>x.name===key&&x.canvas?.getContext);
  if(found)return found;
 }
 return null;
}
export function styleCaption({style='ink',abstraction='gentle',seed=1}={}){
 return styleById(style).name+' / '+
  (ABSTRACTION_LEVELS[abstraction]?.name||ABSTRACTION_LEVELS.gentle.name)+
  ' / SEED '+(Number(seed)>>>0).toString(16).padStart(8,'0').toUpperCase();
}
