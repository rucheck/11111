'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const CONTENT=Object.fromEntries(['questions','story','readers','editor','endings','events'].map(f=>[f,JSON.parse(fs.readFileSync(path.join(__dirname,'content',f+'.json'),'utf8'))]));
const code=['save.js','app.js','pacing.js'].map(f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8')).join('\n');
function run(length,specificity,genre){
  const app={innerHTML:'',scrollTop:0};const doc={querySelector:s=>s==='#app'?app:null,querySelectorAll:()=>[],addEventListener:()=>{}};
  const g=new Function('window','document',code+'\nreturn {get:()=>state,act:(a,v,i)=>act(a,{dataset:{val:v,idx:i}})};')({CONTENT,scrollTo:()=>{}},doc);
  const click=(a,v,i)=>g.act(a,v,i);
  assert(app.innerHTML.includes('new-title'));
  click('startPrologue');assert.equal(g.get().phase,'prologue');click('nextPrologue');click('nextPrologue');
  assert(app.innerHTML.includes('知乎模式')&&app.innerHTML.includes('本地模式'));
  click('chooseStartMode','local');assert.equal(g.get().phase,'draw');assert.equal(g.get().generationMode,'local');
  click('toSetup');click('pickLength',length);click('pickGenre',genre);click('pickTheme','真相');click('nextSetup');click('pickRoute','quality');click('startGame');
  const count={short:6,medium:9,long:12}[length],beats={short:4,medium:5,long:6}[length];
  for(let c=0;c<count;c++){
    assert.equal(g.get().phase,'map');
    if(c===0){
      click('openOverlay','map');assert(app.innerHTML.includes('故事地图'));click('closeOverlay');
      click('openOverlay','status');assert(app.innerHTML.includes('当前状态'));click('closeOverlay');
    }
    click('toWorkbench');assert.equal(g.get().workbenchStep,0);click('plan',c%2?'修复关系':'追寻事实');assert.equal(g.get().workbenchStep,1);
    click('prepare',null,2);click('prepare',null,0);
    click('nextWorkbench');assert.equal(g.get().workbenchStep,2);click('pickSpec',specificity);
    click('enterChapter');assert.equal(g.get().phase,'transition');click('continueTransition');
    for(let b=0;b<beats;b++){
      assert.equal(g.get().phase,'chapter');assert(g.get().currentChapter.decisions.length>=3);
      if(c>0&&b===0)assert(app.innerHTML.includes('前情承接'));
      click('makeDecision',null,b%2);assert.equal(g.get().phase,'consequence');
      const n=g.get().currentChapter.steps.length;click('makeDecision',null,0);assert.equal(g.get().currentChapter.steps.length,n);
      click('nextBeat');
    }
    assert.equal(g.get().phase,'transition');click('continueTransition');assert.equal(g.get().phase,'manuscript');
    for(const step of g.get().currentChapter.steps)assert(g.get().currentChapter.prose.join('').includes(step.result));
    click('publish');assert.equal(g.get().phase,'feedback');
    assert(app.innerHTML.includes('decision-console')&&app.innerHTML.includes('当前路线'));
    assert.equal((app.innerHTML.match(/class="author-action /g)||[]).length,6);
    assert(app.innerHTML.includes('effect-chip')&&!/[⚡🔥✒🎨📝💬🫀]/u.test(app.innerHTML));
    const n=g.get().chapters.length;click('publish');assert.equal(g.get().chapters.length,n);
    click('authorDecide',null,c%6);assert.equal(g.get().phase,'transition');click('continueTransition');
    assert.equal(g.get().storyBible.length,c+1);assert.equal(g.get().storyBible[c].decisions.length,beats);assert(g.get().memory[c].includes('行动链'));
    for(const val of Object.values(g.get().resources))assert(val>=0&&val<=100);
  }
  assert.equal(g.get().phase,'crisis');click('finalChoice',null,0);assert.equal(g.get().phase,'ending');
  assert.equal(g.get().day,0);assert.equal(g.get().chapters.reduce((n,c)=>n+c.steps.length,0),count*beats);
  assert(!/\{(?:npc|protagonist|place|goal)\}/.test(app.innerHTML));
}
let total=0;for(const length of ['short','medium','long'])for(const spec of ['specific','balanced','broad'])for(const genre of Object.keys(CONTENT.story.genres)){run(length,spec,genre);total++;}
const {validatePlan,parseLooseJson,cliContent,cliError}=require('./server');
assert.throws(()=>validatePlan('{"beats":[]}',3));assert.throws(()=>validatePlan('not json',3));
const option={kind:'核实事实',hint:'增加线索',text:'检查记录',result:'找到矛盾',trust:0,evidence:1,quality:1,heat:0,energy:-1};
const generated={beats:Array.from({length:4},()=>({situation:'新的情境',options:Array.from({length:5},()=>option)}))};
assert.equal(validatePlan('日志\n```json\n'+JSON.stringify(generated)+'\n```\n完成',4).beats.length,4);
assert.equal(parseLooseJson('prefix '+JSON.stringify({ok:true})+' suffix').ok,true);
assert.equal(parseLooseJson('{"ok":true,}').ok,true);
assert.equal(parseLooseJson(JSON.stringify(JSON.stringify({nested:true}))).nested,true);
assert.equal(JSON.parse(cliContent(JSON.stringify({choices:[{message:{content:JSON.stringify(generated)}}]}))).beats.length,4);
assert.equal(JSON.parse(cliContent(JSON.stringify({output_text:JSON.stringify(generated)}))).beats.length,4);
assert.equal(cliError({code:4},'{"ok":false,"error":{"message":"直答额度不足"}}',''),'知乎服务额度不足，请稍后重试或切换本地模式。');
assert.equal(cliError({code:7},'',''),'当前运行身份无法访问知乎 CLI 凭据库。');
assert.equal(cliError({code:3},'{"ok":false,"error":{"code":"ENV_SHADOWS_KEYCHAIN"}}',''),'环境凭据覆盖了系统凭据库，请检查运行环境配置。');
console.log(`${total} full runs passed: all lengths, genres and specificity settings; phase guards, resource bounds and chapter validation passed.`);
