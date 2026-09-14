'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const apiCode = fs.readFileSync(path.join(__dirname,'src','api.js'),'utf8');
const ApiConfig = new Function('location',`${apiCode}\nreturn ApiConfig;`)(null);
const PUBLIC_BASE = 'https://yanxuan-writer-production.up.railway.app';

test('GitHub Pages uses the single Railway API base URL',()=>{
  const githubPages = {protocol:'https:',hostname:'rucheck.github.io'};
  assert.equal(ApiConfig.baseUrl(githubPages),PUBLIC_BASE);
  assert.equal(ApiConfig.url('/api/status',githubPages),`${PUBLIC_BASE}/api/status`);
  assert.equal(ApiConfig.url('/api/chapter',githubPages),`${PUBLIC_BASE}/api/chapter`);
  assert.equal(ApiConfig.url('/api/chapter/job%201',githubPages),`${PUBLIC_BASE}/api/chapter/job%201`);
});

test('localhost, loopback and file pages keep same-origin API paths',()=>{
  for(const runtimeLocation of [
    {protocol:'http:',hostname:'localhost'},
    {protocol:'http:',hostname:'127.0.0.1'},
    {protocol:'file:',hostname:''},
    {protocol:'https:',hostname:'preview.example'}
  ]){
    assert.equal(ApiConfig.baseUrl(runtimeLocation),'');
    assert.equal(ApiConfig.url('/api/status',runtimeLocation),'/api/status');
  }
  assert.equal(ApiConfig.baseUrl({hostname:'rucheck.github.io.attacker.example'}),'');
});

test('API URL builder rejects non-API paths',()=>{
  assert.throws(()=>ApiConfig.url('/assets/file.js'),/API path/);
  assert.throws(()=>ApiConfig.url('api/status'),/API path/);
});

test('status, chapter creation and job polling use expected URLs without a real generation call',async()=>{
  const githubPages = {hostname:'rucheck.github.io'};
  const calls=[];
  const mockFetch=async(url,options={})=>{
    calls.push({url,options});
    if(url.endsWith('/api/chapter'))return {status:202,ok:true,json:async()=>({ok:true,jobId:'mock-job'})};
    if(url.endsWith('/api/chapter/mock-job'))return {status:200,ok:true,json:async()=>({ok:true,beats:[]})};
    return {status:200,ok:true,json:async()=>({ok:true,usage:{remaining:2}})};
  };

  await mockFetch(ApiConfig.url('/api/status',githubPages),{cache:'no-store'});
  const accepted=await mockFetch(ApiConfig.url('/api/chapter',githubPages),{
    method:'POST',headers:{'Content-Type':'application/json'},body:'{}'
  });
  const job=(await accepted.json()).jobId;
  await mockFetch(ApiConfig.url(`/api/chapter/${encodeURIComponent(job)}`,githubPages),{cache:'no-store'});

  assert.deepEqual(calls.map(call=>call.url),[
    `${PUBLIC_BASE}/api/status`,
    `${PUBLIC_BASE}/api/chapter`,
    `${PUBLIC_BASE}/api/chapter/mock-job`
  ]);
  assert.equal(calls[1].options.method,'POST');
  assert.equal(calls[1].options.headers['Content-Type'],'application/json');
});

test('all pacing fetch calls go through ApiConfig.url',()=>{
  const pacing=fs.readFileSync(path.join(__dirname,'src','pacing.js'),'utf8');
  const calls=[...pacing.matchAll(/fetch\(([^,\n]+)/g)].map(match=>match[1]);
  assert.equal(calls.length,3);
  assert(calls.every(call=>call.startsWith('ApiConfig.url(')));
  assert.equal(pacing.includes(PUBLIC_BASE),false);
});

test('network failure reaches the existing recovery UI and can switch to local mode',async()=>{
  const CONTENT=Object.fromEntries(['questions','story','readers','editor','endings','events'].map(file=>[
    file,JSON.parse(fs.readFileSync(path.join(__dirname,'content',`${file}.json`),'utf8'))
  ]));
  const code=['api.js','save.js','app.js','pacing.js'].map(file=>fs.readFileSync(path.join(__dirname,'src',file),'utf8')).join('\n');
  const app={innerHTML:'',scrollTop:0};
  const document={querySelector:selector=>selector==='#app'?app:null,querySelectorAll:()=>[],addEventListener:()=>{}};
  const runtimeLocation={protocol:'https:',hostname:'rucheck.github.io'};
  const calls=[];
  const mockFetch=async(url,options={})=>{
    calls.push({url,method:options.method||'GET',body:options.body});
    if(url===`${PUBLIC_BASE}/api/status`)return {ok:true,json:async()=>({ok:true,usage:{limit:2,used:0,remaining:2}})};
    if(url===`${PUBLIC_BASE}/api/chapter`&&options.method==='POST')throw new TypeError('Failed to fetch');
    throw new Error(`Unexpected mock request: ${url}`);
  };
  const game=new Function('window','document','location','fetch',`${code}\nreturn {get:()=>state,html:()=>document.querySelector('#app').innerHTML,act:(action,val,idx)=>act(action,{dataset:{val,idx}})};`)(
    {CONTENT,scrollTo:()=>{}},document,runtimeLocation,mockFetch
  );
  const click=(action,val,idx)=>game.act(action,val,idx);

  click('startPrologue');click('nextPrologue');click('nextPrologue');click('chooseStartMode','zhihu');
  click('toSetup');click('pickLength','short');click('pickGenre','悬疑反转');click('nextSetup');click('startGame');
  click('toWorkbench');click('plan','追寻事实');click('closeOverlay');click('nextWorkbench');click('pickSpec','balanced');
  await click('enterChapter');

  assert.equal(game.get().phase,'generationError');
  assert(game.get().generationError.includes('无法连接知乎生成服务'));
  assert(game.html().includes('切换本地模式'));
  click('localChapter');
  assert.equal(game.get().generationMode,'local');
  assert.notEqual(game.get().phase,'generationError');
  const chapterCall=calls.find(call=>call.url===`${PUBLIC_BASE}/api/chapter`&&call.method==='POST');
  assert(chapterCall);
  const payload=JSON.parse(chapterCall.body);
  assert.deepEqual(Object.keys(payload).sort(),[
    'beats','chapter','chapters','continuity','editor','evidence','feedback','genre','history','plan','question','storyBible','tone','trust'
  ]);
  assert.equal(typeof payload.question.protagonist.secret,'string');
  assert.equal(payload.genre,'悬疑反转');
  assert.equal(payload.beats,4);
  assert.equal(typeof payload.editor,'string');
  assert.equal(calls.some(call=>call.url.includes('/api/chapter/')),false);
});
