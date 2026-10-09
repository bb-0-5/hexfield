/* HEXFIELD 309 / phi-guided counterfactual construction
 * A recipe mutation changes real geometry or executed pigment in the
 * renderer. It does not recolour an already-rendered bitmap just to trick
 * the taste meter. Every branch inherits the last seed, word and rules.
 */
import {GOLD,GOLD_MINOR} from './golden-taste.js';
import {evolveSeed} from './nonredundancy.js';
import {mutateGenome} from './evolution.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const PLACEMENTS=[
 {shiftX:-GOLD_MINOR*.40,shiftY:-GOLD_MINOR*.24,heightScale:1.28,widthScale:1,weightScale:1,accentShare:GOLD_MINOR},
 {shiftX:GOLD_MINOR*.40,shiftY:GOLD_MINOR*.24,heightScale:1.28,widthScale:1,weightScale:1,accentShare:GOLD},
 {shiftX:0,shiftY:-GOLD_MINOR*.43,heightScale:1.50,widthScale:.94,weightScale:1.12,accentShare:GOLD_MINOR},
 {shiftX:0,shiftY:GOLD_MINOR*.43,heightScale:1.50,widthScale:.94,weightScale:1.12,accentShare:GOLD},
 {shiftX:-GOLD_MINOR*.28,shiftY:GOLD_MINOR*.30,heightScale:1.37,widthScale:1.08,weightScale:1.22,accentShare:GOLD_MINOR},
 {shiftX:GOLD_MINOR*.28,shiftY:-GOLD_MINOR*.30,heightScale:1.37,widthScale:.86,weightScale:1.22,accentShare:GOLD},
 {shiftX:0,shiftY:0,heightScale:1.58,widthScale:.80,weightScale:.89,accentShare:GOLD_MINOR},
 {shiftX:-GOLD_MINOR*.20,shiftY:0,heightScale:1.20,widthScale:1.07,weightScale:1.30,accentShare:GOLD},
 {shiftX:GOLD_MINOR*.20,shiftY:0,heightScale:1.20,widthScale:1.07,weightScale:1.30,accentShare:GOLD_MINOR}
];
export const PHI_BRANCHES=PLACEMENTS.length;
export function refineGoldenRecipe(parent,index=0,{target='geometry'}={}){
 if(!parent?.genome||!['lettering','landscape'].includes(parent.mode))
   throw Error('Refinement needs an existing procedural landscape or letterform');
 const step=((Math.trunc(index)%PHI_BRANCHES)+PHI_BRANCHES)%PHI_BRANCHES;
 const generation=(Number(parent.genome.generation)||0)+1;
 const derived=evolveSeed(parent.seed,generation,step,'phi-counterfactual-'+target);
 const candidate=structuredClone(parent);
 candidate.seed=derived;
 candidate.parentSeed=parent.seed>>>0;
 candidate.goldenRefinement={target,step,parentSeed:parent.seed>>>0};
 candidate.experiment='phi-refinement';
 candidate.genome={...structuredClone(parent.genome),generation,origin:'phi-refinement',
   seed:derived};
 if(parent.mode==='lettering'){
   // Preserve exact anatomy, text and requested glyph constraints.
   candidate.phiComposition={...PLACEMENTS[step]};
   const indexes=[0,.2,.4,.6,.8,.13,.33,.53,.73];
   candidate.genome.color=indexes[step];
   if(target==='color')candidate.phiComposition.accentShare=
     step%2?GOLD:GOLD_MINOR;
   if(target==='coupling')candidate.phiComposition.shiftY=
     clamp(candidate.phiComposition.shiftY+
       (step%2?.06:-.06),-.24,.24);
   // Distribute palette using the ACTUAL stroke programme; do not touch
   // the genotype's named anatomical laws or make one part disappear.
   candidate.genome.anatomy=structuredClone(parent.genome.anatomy);
   candidate.anatomy=structuredClone(parent.anatomy||parent.genome.anatomy);
 }else{
   // Landscape is already a full procedural world. Mutation changes
   // real geometry/light/surface construction, with no destructive pixel
   // postprocessing and no violation of an explicitly locked visual law.
   const focus=target==='geometry'?'structure':
     target==='color'?'light':['surface','structure','light'][step%3];
   candidate.genome=mutateGenome(parent.genome,focus,derived);
   candidate.genome.origin='phi-'+focus;
   candidate.genome.color=[.08,.21,.34,.47,.60,.73,.86,.96,.13][step];
   candidate.constraint=parent.constraint?structuredClone(parent.constraint):null;
 }
 return candidate;
}
