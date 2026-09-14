/* 抽查一次完整对局的关键文本（简化版） */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const files = ['questions','story','readers','editor','endings','events'];
const CONTENT = {};
for (const f of files) CONTENT[f] = JSON.parse(fs.readFileSync(path.join(ROOT,'content',f+'.json'),'utf8'));
const code = ['app.js','pacing.js'].map(f=>fs.readFileSync(path.join(ROOT,'src',f),'utf8')).join('\n');

let handlers = {};
const appEl = { innerHTML:'', scrollTop:0 };
const documentStub = {
  querySelector:(s)=> s==='#app'?appEl:null,
  querySelectorAll:()=>[],
  addEventListener:(ev,fn)=>{handlers[ev]=fn;},
};
const windowStub = { CONTENT, scrollTo:()=>{}, addEventListener:()=>{} };
new Function('window','document', code)(windowStub, documentStub);

function click(action,val,idx){ handlers.click({preventDefault:()=>{},target:{closest:()=>({dataset:{action,val,idx}})}}); return appEl.innerHTML; }
function strip(html){ return html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function grab(html, token){
  const re = new RegExp(`class="[^"]*\\b${token}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/`, 'g');
  const m = re.exec(html);
  return m ? strip(m[1]) : '(none)';
}

click('startPrologue');click('nextPrologue');click('nextPrologue');click('chooseStartMode','local');
console.log('=== 抽题 ===');
console.log(grab(appEl.innerHTML,'qcard-title'));
console.log('类型:', grab(appEl.innerHTML,'qtag'));

click('toSetup'); click('pickLength','short');click('nextSetup');click('startGame');
click('toWorkbench');
console.log('\n=== 第1章 工作台 ===');
console.log('步骤:', grab(appEl.innerHTML,'wizard-title'));

click('plan','追寻事实');click('prepare',null,'2');click('nextWorkbench');
click('enterChapter');
click('continueTransition');
console.log('场景:', grab(appEl.innerHTML,'story-meta'));
console.log('情境:', grab(appEl.innerHTML,'story-text'));
console.log('选项A:', grab(appEl.innerHTML,'choice').split('  ')[0]);

click('makeDecision', null, '0');
click('nextBeat');click('makeDecision',null,'0');click('nextBeat');click('makeDecision',null,'0');click('nextBeat');click('makeDecision',null,'0');click('nextBeat');click('continueTransition');
console.log('\n--- AI 续写正文 ---');
console.log(grab(appEl.innerHTML,'ms-body'));

click('publish');
console.log('\n--- AI 读者评论 ---');
const fb = appEl.innerHTML;
const cre = /class="comment-body"[^>]*>([\s\S]*?)<\/div>/g;
let m, i=0;
while((m=cre.exec(fb)) && i<5){ console.log('·', strip(m[1])); i++; }

click('authorDecide', null, '0');
click('continueTransition');
for(let c=2;c<=6;c++){ click('toWorkbench');click('plan','追寻事实');click('prepare',null,'2');click('nextWorkbench');click('enterChapter');click('continueTransition'); for(let b=0;b<4;b++){click('makeDecision',null,'0');click('nextBeat');}click('continueTransition'); click('publish'); click('authorDecide',null,'0');click('continueTransition'); }
click('finalChoice', null, '0');
const end = appEl.innerHTML;
console.log('\n=== 结局 ===');
console.log('结局:', grab(end,'profile-ending'));
console.log('判词:', grab(end,'profile-verdict'));
console.log('封面:', grab(end,'book-cover-title'));

console.log('\n=== 占位符泄漏检查（全页）===');
const leaks = end.match(/\{[a-z]+\}/g) || [];
console.log(leaks.length ? leaks : '无泄漏');
