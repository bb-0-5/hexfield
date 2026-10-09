import assert from 'node:assert/strict';
import {makeGenome,mutateGenome,proposeExperiments,programKey,methodDistance,
  methodDescription,evaluateSurface,randomFrom,sampleGenome,geneFeatures} from '../public/studio/evolution.js';

for(const discipline of ['landscape','lettering']){
  for(let seed=1;seed<90;seed++){
    const g=makeGenome(discipline,seed);
    assert.deepEqual(g,makeGenome(discipline,seed),'seeded programs must reproduce');
    assert.deepEqual(evaluateSurface(g),[]);
    const trials=proposeExperiments(g,seed*137);
    assert.equal(trials.length,3);
    assert.equal(new Set(trials.map(t=>programKey(t.genome))).size,3,'distinct counterfactuals');
    for(const t of trials){
      assert.equal(t.genome.kind,discipline);
      assert.ok(t.genome.generation > g.generation);
      assert.notEqual(programKey(t.genome),programKey(g),'reject must change procedure');
      assert.deepEqual(evaluateSurface(t.genome),[]);
      assert.ok(methodDescription(t.genome).length>10);
      assert.ok(Object.keys(geneFeatures(t.genome)).length>=3);
    }
    const recipe={mode:discipline,genome:g,scene:'coast',mood:'mist',text:'HEXFIELD',seed};
    assert.ok(Buffer.byteLength(JSON.stringify(recipe))<4000,'fits human vote record');
  }
  const kept=[{genome:makeGenome(discipline,1),score:3},
    {genome:makeGenome(discipline,2),score:1}];
  for(let seed=1;seed<=40;seed++){
    const next=sampleGenome(kept,discipline,seed);
    assert.deepEqual(evaluateSurface(next),[]);
  }
}
console.log('Evolvable procedural genome tests passed.');
