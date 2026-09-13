'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const CONTENT=Object.fromEntries(['questions','story','readers','editor','endings','events'].map(f=>[f,JSON.parse(fs.readFileSync(path.join(__dirname,'content',f+'.json'),'utf8'))]));
const code=['app.js','pacing.js'].map(f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8')).join('\n');
function run(length,specificity,genre){
  const app={innerHTML:'',scrollTop:0};const doc={querySelector:s=>s==='#app'?app:null,querySelectorAll:()=>[],addEventListener:()=>{}};
  const g=new Function('window','document',code+'\nreturn {get:()=>state,act:(a,v,i)=>act(a,{dataset:{val:v,idx:i}})};')({CONTENT,scrollTo:()=>{}},doc);
  const click=(a,v,i)=>g.act(a,v,i);
  assert(app.innerHTML.includes('new-title'));
  click('toDraw');click('toSetup');click('pickLength',length);click('pickGenre',genre);click('startGame');
  const count={short:6,medium:9,long:12}[length],beats={short:3,medium:4,long:5}[length];
  for(let c=0;c<count;c++){
    assert.equal(g.get().phase,'map');click('toWorkbench');click('pickSpec',specificity);
    click('prepare',null,2);click('prepare',null,0);
    click('enterChapter');assert.equal(g.get().phase,'transition');click('continueTransition');
    for(let b=0;b<beats;b++){
      assert.equal(g.get().phase,'chapter');assert(g.get().currentChapter.decisions.length>=2);
      click('makeDecision',null,b%2);assert.equal(g.get().phase,'consequence');
      const n=g.get().currentChapter.steps.length;click('makeDecision',null,0);assert.equal(g.get().currentChapter.steps.length,n);
      click('nextBeat');
    }
    assert.equal(g.get().phase,'transition');click('continueTransition');assert.equal(g.get().phase,'manuscript');
    for(const step of g.get().currentChapter.steps)assert(g.get().currentChapter.prose.join('').includes(step.result));
    click('publish');assert.equal(g.get().phase,'feedback');const n=g.get().chapters.length;click('publish');assert.equal(g.get().chapters.length,n);
    click('authorDecide',null,c%6);assert.equal(g.get().phase,'transition');click('continueTransition');
    for(const val of Object.values(g.get().resources))assert(val>=0&&val<=100);
  }
  assert.equal(g.get().phase,'crisis');click('finalChoice',null,0);assert.equal(g.get().phase,'ending');
  assert.equal(g.get().day,0);assert.equal(g.get().chapters.reduce((n,c)=>n+c.steps.length,0),count*beats);
  assert(!/\{(?:npc|protagonist|place|goal)\}/.test(app.innerHTML));
}
let total=0;for(const length of ['short','medium','long'])for(const spec of ['specific','balanced','broad'])for(const genre of Object.keys(CONTENT.story.genres)){run(length,spec,genre);total++;}
const {validatePlan}=require('./server');
assert.throws(()=>validatePlan('{"beats":[]}',3));assert.throws(()=>validatePlan('not json',3));
console.log(`${total} full runs passed: all lengths, genres and specificity settings; phase guards, resource bounds and chapter validation passed.`);
