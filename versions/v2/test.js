'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const CONTENT=Object.fromEntries(['questions','story','readers','editor','endings','events'].map(f=>[f,JSON.parse(fs.readFileSync(path.join(__dirname,'content',f+'.json'),'utf8'))]));
const code=['api.js','save.js','app.js','pacing.js'].map(f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8')).join('\n');
function run(length,specificity,genre){
  const app={innerHTML:'',scrollTop:0};const doc={querySelector:s=>s==='#app'?app:null,querySelectorAll:()=>[],addEventListener:()=>{}};
  const g=new Function('window','document',code+'\nreturn {get:()=>state,answer:()=>drawAnswer(state.question),act:(a,v,i)=>act(a,{dataset:{val:v,idx:i}})};')({CONTENT,scrollTo:()=>{}},doc);
  const click=(a,v,i)=>g.act(a,v,i);
  assert(app.innerHTML.includes('new-title'));
  click('startPrologue');assert.equal(g.get().phase,'prologue');click('nextPrologue');click('nextPrologue');
  assert(app.innerHTML.includes('知乎模式')&&app.innerHTML.includes('本地模式'));
  click('chooseStartMode','local');assert.equal(g.get().phase,'draw');assert.equal(g.get().generationMode,'local');
  assert(app.innerHTML.includes('qa-thread')&&app.innerHTML.includes('typed-answer-text'));
  assert(g.answer().includes('谢邀。')&&g.answer().includes(g.get().question.title));
  assert.notEqual(g.get().drawPrompt,g.get().question.title);
  click('toSetup');click('pickLength',length);click('pickGenre',genre);click('pickTheme','真相');click('nextSetup');click('pickRoute','quality');click('startGame');
  const count={short:6,medium:9,long:12}[length],beats={short:4,medium:5,long:6}[length];
  for(let c=0;c<count;c++){
    assert.equal(g.get().phase,'map');
    if(c===0){
      click('openOverlay','map');assert(app.innerHTML.includes('故事地图'));click('closeOverlay');
      click('openOverlay','status');assert(app.innerHTML.includes('当前状态'));click('closeOverlay');
      click('openOverlay','tutorial');assert(app.innerHTML.includes('游戏教程')&&app.innerHTML.includes('一篇故事，两个身份'));click('closeOverlay');
    }
    click('toWorkbench');assert.equal(g.get().workbenchStep,0);click('plan',c%2?'修复关系':'追寻事实');assert.equal(g.get().workbenchStep,1);click('closeOverlay');
    click('prepare',null,2);click('prepare',null,0);
    click('nextWorkbench');assert.equal(g.get().workbenchStep,2);click('pickSpec',specificity);
    click('enterChapter');assert.equal(g.get().phase,'transition');assert(app.innerHTML.includes('realm-transition')&&app.innerHTML.includes('开始呼吸'));click('continueTransition');
    for(let b=0;b<beats;b++){
      assert.equal(g.get().phase,'chapter');assert(g.get().currentChapter.decisions.length>=3);assert(app.innerHTML.includes('story-atmosphere')&&app.innerHTML.includes('data-tension='));
      if(c>0&&b===0)assert(app.innerHTML.includes('前情承接'));
      click('makeDecision',null,b%2);assert.equal(g.get().phase,'consequence');assert(app.innerHTML.includes('consequence-stage')&&app.innerHTML.includes('suspense-motes'));
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
// 行动力不足时不得静默卡死：先弹窗确认，确认后走低效更新并离开工作台（回归测试）
{
  const app={innerHTML:'',scrollTop:0};const doc={querySelector:s=>s==='#app'?app:null,querySelectorAll:()=>[],addEventListener:()=>{}};
  const g=new Function('window','document',code+'\nreturn {get:()=>state,act:(a,v,i)=>act(a,{dataset:{val:v,idx:i}})};')({CONTENT,scrollTo:()=>{}},doc);
  const click=(a,v,i)=>g.act(a,v,i);
  click('startPrologue');click('nextPrologue');click('nextPrologue');click('chooseStartMode','local');
  click('toSetup');click('pickLength','short');click('pickGenre','悬疑反转');click('nextSetup');click('startGame');
  click('toWorkbench');click('plan','追寻事实');click('closeOverlay');click('nextWorkbench');click('pickSpec','broad');
  g.get().resources.action=3;
  click('enterChapter');
  assert.equal(g.get().phase,'workbench','行动力不足时应先停在 workbench 弹窗');
  assert.equal(g.get().overlay,'lowAction','应弹出低效更新确认框');
  click('confirmLowAction');
  assert.notEqual(g.get().phase,'workbench','确认低效更新后应离开 workbench');
  assert.equal(g.get().phase,'transition');
  assert(g.get().uiNotice.includes('低效更新'),'应提示低效更新兜底');
}
// 准备动作精力不足时点选应弹提示（回归测试）
{
  const app={innerHTML:'',scrollTop:0};const doc={querySelector:s=>s==='#app'?app:null,querySelectorAll:()=>[],addEventListener:()=>{}};
  const g=new Function('window','document',code+'\nreturn {get:()=>state,act:(a,v,i)=>act(a,{dataset:{val:v,idx:i}})};')({CONTENT,scrollTo:()=>{}},doc);
  const click=(a,v,i)=>g.act(a,v,i);
  click('startPrologue');click('nextPrologue');click('nextPrologue');click('chooseStartMode','local');
  click('toSetup');click('pickLength','short');click('pickGenre','悬疑反转');click('nextSetup');click('startGame');
  click('toWorkbench');click('plan','追寻事实');click('closeOverlay');
  g.get().resources.action=50;g.get().resources.energy=1;
  click('prepare',null,1);
  assert.equal(g.get().prep,0,'精力不足时不应执行「和读者聊聊」');
  assert.equal(g.get().overlay,'hint','精力不足点击时应弹提示');
  assert.equal(g.get().hintTitle,'精力不足','提示标题应为精力不足');
}
// 作者层决策精力不足时应弹提示（回归测试）
{
  const app={innerHTML:'',scrollTop:0};const doc={querySelector:s=>s==='#app'?app:null,querySelectorAll:()=>[],addEventListener:()=>{}};
  const g=new Function('window','document',code+'\nreturn {get:()=>state,act:(a,v,i)=>act(a,{dataset:{val:v,idx:i}})};')({CONTENT,scrollTo:()=>{}},doc);
  const click=(a,v,i)=>g.act(a,v,i);
  click('startPrologue');click('nextPrologue');click('nextPrologue');click('chooseStartMode','local');
  click('toSetup');click('pickLength','short');click('pickGenre','悬疑反转');click('nextSetup');click('startGame');
  click('toWorkbench');click('plan','追寻事实');click('closeOverlay');click('nextWorkbench');click('pickSpec','balanced');
  click('enterChapter');click('continueTransition');
  for(let b=0;b<4;b++){click('makeDecision',null,0);click('nextBeat');}
  click('continueTransition');click('publish');
  assert.equal(g.get().phase,'feedback','应到达作者层反馈');
  g.get().resources.energy=0;
  click('authorDecide',null,2);
  assert.equal(g.get().phase,'feedback','精力不足时不应执行作者决策');
  assert.equal(g.get().overlay,'hint','精力不足时应弹提示');
  assert.equal(g.get().hintTitle,'精力不足');
}
// 进入「写之前做什么」的提醒逻辑（回归测试）
{
  const app={innerHTML:'',scrollTop:0};const doc={querySelector:s=>s==='#app'?app:null,querySelectorAll:()=>[],addEventListener:()=>{}};
  const g=new Function('window','document',code+'\nreturn {get:()=>state,act:(a,v,i)=>act(a,{dataset:{val:v,idx:i}})};')({CONTENT,scrollTo:()=>{}},doc);
  const click=(a,v,i)=>g.act(a,v,i);
  click('startPrologue');click('nextPrologue');click('nextPrologue');click('chooseStartMode','local');
  click('toSetup');click('pickLength','short');click('pickGenre','悬疑反转');click('nextSetup');click('startGame');
  click('toWorkbench');click('plan','追寻事实');
  assert.equal(g.get().overlay,'prepAdvice','首次进入准备页应弹提醒');
  click('closeOverlay');
  g.get().prepAdvised=false;g.get().resources.action=20;
  click('workbenchBack');click('plan','追寻事实');
  assert.equal(g.get().overlay,'prepAdvice','行动力偏低时应再弹提醒');
  click('closeOverlay');
  g.get().prepAdvised=false;g.get().resources.action=80;g.get().resources.energy=80;
  click('workbenchBack');click('plan','追寻事实');
  assert.equal(g.get().overlay,'','资源充足时不应弹提醒');
}
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
