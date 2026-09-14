'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const GENRES=['悬疑反转','都市情感','女性成长','民俗怪谈','职场冲突','历史脑洞'];

// 1) 校验并合并走向
const twists={};
for(const g of GENRES){
  const arr=JSON.parse(fs.readFileSync(path.join(__dirname,'twists_'+g+'.json'),'utf8'));
  if(!Array.isArray(arr)||arr.length<30) throw new Error(`twist ${g} count ${arr.length}`);
  if(arr.some(t=>typeof t!=='string'||!t.trim()||/\{/.test(t))) throw new Error(`twist ${g} invalid`);
  twists[g]=arr;
}

// 2) 校验并合并选项
const options=[],seen=new Set();
for(const f of fs.readdirSync(__dirname).filter(f=>/^options_\d+\.json$/.test(f))){
  const arr=JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'));
  for(const o of arr){
    for(const k of ['kind','type','lead','hint','text','result']) if(typeof o[k]!=='string'||!o[k].trim()) throw new Error(`${f} 缺字段 ${k}`);
    const eff=o.effect||{};
    for(const k of ['heat','quality','energy','sign']) if(typeof eff[k]!=='number'||eff[k]<-3||eff[k]>3) throw new Error(`${f} effect.${k}`);
    if(typeof eff.style!=='number'||eff.style<-5||eff.style>5) throw new Error(`${f} effect.style`);
    if(![-1,0,1].includes(o.trust)) throw new Error(`${f} trust`);
    if(![0,1].includes(o.evidence)) throw new Error(`${f} evidence`);
    const ph=(o.text+o.result+o.lead).match(/\{(\w+)\}/g)||[];
    if(ph.some(p=>!['{npc}','{npc2}','{object}'].includes(p))) throw new Error(`${f} 非法占位符 ${ph}`);
    let kind=o.kind, n=2;
    while(seen.has(kind)) kind=o.kind+(n++);
    o.kind=kind;
    seen.add(kind);
    options.push(o);
  }
}

const out='/* 扩充走向库与选项库（由 _gen/*.json 自动合并生成，勿手改） */\n'+
  'const EXTRA_TWISTS = '+JSON.stringify(twists)+';\n'+
  'const EXTRA_OPTIONS = '+JSON.stringify(options)+';\n';
fs.writeFileSync(path.join(ROOT,'src','library.js'),out,'utf8');
console.log('走向总数:', Object.values(twists).reduce((n,a)=>n+a.length,0));
console.log('选项总数:', options.length);
console.log('written src/library.js:', out.length, 'bytes');
