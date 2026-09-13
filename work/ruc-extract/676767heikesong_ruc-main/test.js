/* 逻辑冒烟测试：无头 DOM 桩驱动整局流程 */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const files = ['questions','story','readers','editor','endings','events'];
const CONTENT = {};
for (const f of files) CONTENT[f] = JSON.parse(fs.readFileSync(path.join(ROOT,'content',f+'.json'),'utf8'));

const code = fs.readFileSync(path.join(ROOT,'src','app.js'),'utf8');

function makeRun(){
  let handlers = { click:null, input:null };
  const appEl = { innerHTML:'', scrollTop:0 };
  const documentStub = {
    querySelector: (s) => s === '#app' ? appEl : null,
    querySelectorAll: () => [],
    addEventListener: (ev,fn)=>{ handlers[ev]=fn; },
  };
  const windowStub = { CONTENT, scrollTo:()=>{}, addEventListener:()=>{} };
  const fn = new Function('window','document', code);
  fn(windowStub, documentStub);
  return {
    click(action, val, idx){
      const fake = { target:{ closest:()=>({ dataset:{ action, val, idx } }) } };
      handlers.click(fake);
      return appEl.innerHTML;
    },
    html(){ return appEl.innerHTML; },
  };
}

function assert(cond, msg){
  if(!cond) throw new Error('ASSERT FAIL: '+msg);
}

let failures = 0;
const RUNS = 80;
for(let r=0;r<RUNS;r++){
  try{
    const g = makeRun();
    let h = g.html();
    assert(h.includes('screen--title'), 'title renders');

    h = g.click('toDraw');
    assert(h.includes('qcard'), 'question drawn');

    h = g.click('toSetup');
    assert(h.includes('route-cards'), 'setup renders');

    h = g.click('startGame');
    assert(h.includes('screen--map'), 'map renders');

    // 5 章 + 危机 + 结局
    for(let c=1;c<=5;c++){
      h = g.click('toWorkbench');
      assert(h.includes('screen--wb'), `ch${c} workbench`);
      h = g.click('enterChapter');
      assert(h.includes('scene-stage') && h.includes('choice'), `ch${c} chapter decisions`);
      h = g.click('makeDecision', null, '0');
      assert(h.includes('manuscript') || h.includes('ms-body'), `ch${c} manuscript`);
      h = g.click('publish');
      assert(h.includes('comment-list'), `ch${c} feedback comments`);
      assert(h.includes('author-choice'), `ch${c} author decision`);
      h = g.click('authorDecide', null, '0');
    }

    // 第 5 章 authorDecide 后应进入危机
    h = g.html();
    assert(h.includes('stage-choices--final') || h.includes('最终危机') || h.includes('crisis'), 'crisis reached');

    h = g.click('finalChoice', null, '0');
    assert(h.includes('screen--ending'), 'ending renders');
    assert(h.includes('book-cover') && h.includes('author-profile'), 'ending cover+profile');
    assert(h.includes('report'), 'final report');
  }catch(e){
    failures++;
    console.log('RUN', r, 'FAILED:', e.message);
    if(failures>5) break;
  }
}

console.log(`done: ${RUNS} runs, ${failures} failures`);
process.exit(failures?1:0);
