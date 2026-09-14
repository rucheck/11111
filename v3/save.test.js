'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const CONTENT=Object.fromEntries(['questions','story','readers','editor','endings','events'].map(f=>[f,JSON.parse(fs.readFileSync(path.join(__dirname,'content',f+'.json'),'utf8'))]));
const code=['save.js','app.js','library.js','pacing.js'].map(f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8')).join('\n');

class MemoryStorage{
  constructor(){this.data=new Map();}
  getItem(key){return this.data.has(key)?this.data.get(key):null;}
  setItem(key,value){this.data.set(key,String(value));}
  removeItem(key){this.data.delete(key);}
}

function createGame(localStorage){
  const app={innerHTML:'',scrollTop:0};
  const document={querySelector:s=>s==='#app'?app:null,querySelectorAll:()=>[],addEventListener:()=>{}};
  const window={CONTENT,localStorage,scrollTo:()=>{}};
  return new Function('window','document',code+'\nreturn {get:()=>state,act:(action,val,idx)=>act(action,{dataset:{val,idx}}),html:()=>document.querySelector("#app").innerHTML,save:SaveSystem};')(window,document);
}

function startShortGame(game){
  game.act('startPrologue');game.act('nextPrologue');game.act('nextPrologue');game.act('chooseStartMode','local');
  game.act('toSetup');game.act('pickLength','short');game.act('pickGenre','悬疑反转');game.act('pickTheme','真相');game.act('nextSetup');game.act('pickRoute','quality');game.act('startGame');
}

function openFirstChapter(game){
  game.act('toWorkbench');game.act('plan','追寻事实');game.act('prepare',null,2);game.act('prepare',null,0);game.act('nextWorkbench');game.act('pickSpec','specific');game.act('enterChapter');game.act('continueTransition');
}

const storage=new MemoryStorage();
const first=createGame(storage);
startShortGame(first);openFirstChapter(first);first.act('makeDecision',null,0);
const before=JSON.parse(JSON.stringify(first.get()));
assert.equal(before.phase,'consequence');
assert(first.save.hasSave());

// A：刷新后由标题页明确选择继续，章节、选择、资源和剧情状态一致。
const refreshed=createGame(storage);
assert.equal(refreshed.get().phase,'title');
assert(refreshed.html().includes('继续游戏')&&refreshed.html().includes('新游戏'));
refreshed.act('continueGame');
assert.equal(refreshed.get().phase,before.phase);
assert.equal(refreshed.get().chapterIndex,before.chapterIndex);
assert.deepEqual(refreshed.get().currentChapter.steps,before.currentChapter.steps);
assert.deepEqual(refreshed.get().resources,before.resources);
assert.deepEqual(refreshed.get().routeAffinity,before.routeAffinity);
assert.equal(refreshed.get().trust,before.trust);
assert.equal(refreshed.get().evidence,before.evidence);
console.log('A basic refresh recovery passed');

// B：销毁运行实例模拟关闭浏览器，再创建实例恢复同一中途状态。
const closedState=JSON.parse(JSON.stringify(refreshed.get()));
const reopened=createGame(storage);reopened.act('continueGame');
assert.equal(reopened.get().phase,closedState.phase);
assert.deepEqual(reopened.get().currentChapter.steps,closedState.currentChapter.steps);
console.log('B close and reopen recovery passed');

// C：完成一章进入下一章后恢复，跨章记忆和历史选择保持一致。
reopened.act('nextBeat');
for(let beat=1;beat<4;beat++){reopened.act('makeDecision',null,beat%3);reopened.act('nextBeat');}
reopened.act('continueTransition');reopened.act('publish');
const feedbackReload=createGame(storage);feedbackReload.act('continueGame');
assert.equal(feedbackReload.get().phase,'feedback');
assert.strictEqual(feedbackReload.get().currentChapter,feedbackReload.get().chapters.at(-1));
feedbackReload.act('authorDecide',null,1);feedbackReload.act('continueTransition');
assert.equal(feedbackReload.get().phase,'map');
const crossChapter=JSON.parse(JSON.stringify(feedbackReload.get()));
const nextSession=createGame(storage);nextSession.act('continueGame');
assert.equal(nextSession.get().chapterIndex,1);
assert.deepEqual(nextSession.get().storyBible,crossChapter.storyBible);
assert.deepEqual(nextSession.get().memory,crossChapter.memory);
assert.deepEqual(nextSession.get().chapters,crossChapter.chapters);
assert.equal(nextSession.get().trust,crossChapter.trust);
assert.equal(nextSession.get().evidence,crossChapter.evidence);
console.log('C cross-chapter recovery passed');

// D：新游戏替换旧存档，所有跨局状态归零且不混入旧章节。
const newGamePage=createGame(storage);
assert(newGamePage.html().includes('新游戏'));
newGamePage.act('newGame');
assert.equal(newGamePage.get().phase,'prologue');
assert.equal(newGamePage.get().question,null);
assert.deepEqual(newGamePage.get().chapters,[]);
assert.deepEqual(newGamePage.get().storyBible,[]);
assert.deepEqual(newGamePage.get().memory,[]);
assert.equal(newGamePage.get().trust,0);
assert.equal(newGamePage.get().evidence,0);
const freshStored=newGamePage.save.loadGame();
assert.equal(freshStored.phase,'prologue');
assert.deepEqual(freshStored.chapters,[]);
console.log('D new game clears prior progress passed');

// E：损坏、缺字段、不兼容和不可用的 localStorage 均安全回到标题页。
for(const bad of ['not-json',JSON.stringify({saveVersion:99,game:{}}),JSON.stringify({saveVersion:1,game:{phase:'chapter'}})]){
  const broken=new MemoryStorage();broken.setItem('yanxuan-life.save.v1',bad);
  const game=createGame(broken);assert.equal(game.get().phase,'title');assert(!game.html().includes('继续游戏'));assert(game.html().includes('开始游戏'));
}
const unavailable={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
const fallback=createGame(unavailable);assert.equal(fallback.get().phase,'title');fallback.act('startPrologue');assert.equal(fallback.get().phase,'prologue');
console.log('E damaged and unavailable storage fallback passed');

// 存档结构与安全边界。
const raw=storage.getItem('yanxuan-life.save.v1');
const record=JSON.parse(raw);
assert.equal(record.saveVersion,1);
assert(!raw.includes('ZHIHU_ACCESS_SECRET')&&!raw.includes('accessSecret')&&!raw.includes('oauthToken')&&!raw.includes('apiKey'));
console.log('saveVersion and credential exclusion passed');
