/* 盐选人生：90天写作生存战 —— 游戏引擎与界面 */
'use strict';

const CONTENT = window.CONTENT;

/* ============ 常量 ============ */
const GENRES  = ["悬疑反转","都市情感","女性成长","民俗怪谈","职场冲突","历史脑洞"];
const THEMES  = ["真相","尊严","牺牲","亲密关系","现实困境"];
const QUESTION_PROMPTS = {
  "悬疑反转":["你经历过最惊心动魄的一件事是什么？","你遇到过哪些细思极恐的巧合？","你有没有怀疑过身边最熟悉的人？"],
  "都市情感":["你在感情里最无能为力的瞬间是什么？","哪一刻让你意识到一段关系已经结束了？","你见过最沉默的告别是什么？"],
  "女性成长":["你做过最不被理解、但从未后悔的决定是什么？","你在哪一刻决定不再忍了？","一个人真正强大起来是什么感觉？"],
  "民俗怪谈":["你遇到过最诡异、至今无法解释的事是什么？","你家乡有哪些不能随便触犯的规矩？","你听过最让人后背发凉的真实经历是什么？"],
  "职场冲突":["你在职场经历过最惊心动魄的反击是什么？","你见过最令人窒息的职场博弈是什么？","哪一刻让你决定不再替别人背锅？"],
  "历史脑洞":["如果忠诚和活下去只能选一个，你会怎么选？","历史上有哪些身不由己的瞬间让你久久不能平静？","如果一纸命令可能改变所有人的命运，你会服从吗？"],
};
const ROUTES = [
  { key:"traffic",     name:"流量路线", desc:"热门标签、强冲突、快速更新",   color:"#e0533f" },
  { key:"quality",     name:"质量路线", desc:"伏笔、人物、慢热铺垫",         color:"#2f7fd0" },
  { key:"controversy", name:"争议路线", desc:"灰色主题、道德冲突、出圈",     color:"#8a55c9" },
  { key:"commercial",  name:"商业路线", desc:"迎合编辑、强化爽点、适配盐选", color:"#e08a2e" },
  { key:"self",        name:"自我路线", desc:"坚持原主题与个人风格",         color:"#1f9e7d" },
];
const ROUTE_MAP = Object.fromEntries(ROUTES.map(r=>[r.key,r]));
const STAGES = ["起步期","增长期","危机期","收束期"];
const SPECIFICS = [
  { key:"specific", label:"具体", hint:"3 个聚焦行动 · 稳定推进主线，每一步都说明可能影响", cost:15, choices:3, heat:1, quality:1 },
  { key:"balanced", label:"适中", hint:"4 个差异行动 · 主线与关系可以局部偏离", cost:20, choices:4, heat:0, quality:0 },
  { key:"broad",    label:"宽泛", hint:"5 个开放行动 · 可观察、绕行或触发隐藏事件", cost:25, choices:5, heat:0, quality:0 },
];
const RES_DEFS = [
  { key:"action",  label:"行动力",   icon:"bolt" },
  { key:"energy",  label:"精力",     icon:"heart" },
  { key:"heat",    label:"热度",     icon:"trend" },
  { key:"quality", label:"质量",     icon:"feather" },
  { key:"style",   label:"作者风格", icon:"spark" },
  { key:"sign",    label:"签约概率", icon:"contract" },
];
let CHAPTERS = [
  { day:90, stage:"起步期" },
  { day:72, stage:"起步期" },
  { day:54, stage:"增长期" },
  { day:36, stage:"危机期" },
  { day:18, stage:"危机期" },
];
const CRISIS_DAY = 6;

const AUTHOR_DECISIONS = [
  { key:"ignore", label:"置之不理",    desc:"让子弹飞一会",  eff:{heat:0,quality:0,energy:1,style:1,sign:0}, route:"self",        note:"“评论区的声音，可以听，但不必都回。”" },
  { key:"reply",  label:"回复读者",    desc:"下场互动带热度", eff:{heat:2,quality:0,energy:-1,style:0,sign:0}, route:"traffic",     note:"“作者本尊下场，评论区瞬间热闹起来。”" },
  { key:"argue",  label:"公开争论",    desc:"硬刚，也引来争议",eff:{heat:3,quality:-1,energy:-2,style:1,sign:-1}, route:"controversy", note:"“你把一条评论顶成了热帖。”" },
  { key:"revise", label:"修改大纲",    desc:"顺着反馈微调走向",eff:{heat:1,quality:1,energy:-1,style:-1,sign:1}, route:"commercial",  note:"“大纲改了一处，也埋下新的变量。”" },
  { key:"cater",  label:"迎合评论",    desc:"按读者想要的方向写",eff:{heat:3,quality:-2,energy:-1,style:-3,sign:1}, route:"traffic", note:"“热度上来了，可笔下的东西渐渐不是你原本想写的。”" },
  { key:"stick",  label:"坚持原计划",  desc:"不改，写完再看",  eff:{heat:-1,quality:2,energy:0,style:3,sign:0}, route:"self",      note:"“你压住了改稿的冲动，故事还握在你手里。”" },
];

const FALLBACK = {
  protagonist:"她", npc:"那个人", npc2:"另一个人", place:"这座城市",
  theme:"命运", goal:"这一章的目标", decision:"那个选择", cliff:"那个悬念", route:"自己的路", genre:"这个故事",
};

/* ============ 状态 ============ */
let state = null;
let drawTypingToken = 0;

/* ============ 工具 ============ */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const rand = (n) => Math.floor(Math.random()*n);
const pick = (arr) => arr[rand(arr.length)];
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const UI_ICONS = {
  bolt:'<path d="M13 2 4.8 13H11l-1 9 8.2-11H12l1-9Z"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  trend:'<path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
  feather:'<path d="M20.2 4.8c-4.4-4.4-12.6.8-14.9 5.9-1 2.3-.9 4.5-.2 6.1L3 21l4.2-2.1c1.6.7 3.8.8 6.1-.2 5.1-2.3 10.3-9.9 6.9-13.9Z"/><path d="m7 17 8-8M9.5 14.5H15V9"/>',
  spark:'<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
  contract:'<path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h7M9 16h7"/>',
  map:'<path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3z"/><path d="M8 3v15M16 6v15"/>',
  status:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  guide:'<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22z"/>',
  arrowRight:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft:'<path d="M19 12H5M11 18l-6-6 6-6"/>',
  infinity:'<path d="M18.5 7.5c-3.5 0-5 4.5-6.5 4.5s-3-4.5-6.5-4.5a4.5 4.5 0 0 0 0 9c3.5 0 5-4.5 6.5-4.5s3 4.5 6.5 4.5a4.5 4.5 0 0 0 0-9Z"/>',
  cloud:'<path d="M17.5 19H7a5 5 0 0 1-.8-9.9A7 7 0 0 1 19.8 11a4 4 0 0 1-2.3 8Z"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z"/><path d="M8 7h8M8 11h6"/>',
  message:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/>',
  alert:'<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17.5v.5"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
};
function uiIcon(name, cls='ui-icon'){
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${UI_ICONS[name]||UI_ICONS.spark}</svg>`;
}
const shuffle = (arr) => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];} return a; };

function fill(t, ctx){
  if (t == null) return '';
  let s = String(t);
  for (let i=0;i<4;i++){
    const before = s;
    s = s.replace(/\{(\w+)\}/g, (m,k) => {
      const v = ctx[k];
      if (v !== undefined && v !== '') return v;
      return FALLBACK[k] ?? '';
    });
    if (s === before) break;
  }
  return s;
}

/* ============ 上下文构造 ============ */
function baseCtx(scene){
  const q = state.question;
  const npc0 = q.npc[0] || {name:'那个人'};
  const npc1 = q.npc[1] || npc0;
  return {
    protagonist: q.protagonist.role,
    npc: npc0.name, npc2: npc1.name,
    place: scene ? scene.name : q.setting,
    theme: state.theme, genre: state.genre,
    route: ROUTE_MAP[dominantRouteKey()].name,
    goal: '', decision: '', cliff: '',
  };
}

function dominantRouteKey(){
  let best='self', bv=-1;
  for (const k in state.routeAffinity){ if (state.routeAffinity[k] > bv){ bv=state.routeAffinity[k]; best=k; } }
  return best;
}

function chapterCtx(ch){
  const ctx = baseCtx(ch.scene);
  ctx.goal = ch.goal;
  ctx.decision = ch.decision ? fill(ch.decision.text, ctx) : '';
  ctx.cliff = trimTerminalPunctuation(ch.cliffHook || ch.goal);
  return ctx;
}

function trimTerminalPunctuation(value){
  return String(value||'').trim().replace(/[，,。；;：:！？!?、]+$/u,'');
}

/* ============ 渲染入口 ============ */
function render(){
  const typingToken = ++drawTypingToken;
  const app = $('#app');
  app.innerHTML = screens[state.phase]();
  app.scrollTop = 0;
  window.scrollTo(0,0);
  if(state.phase==='draw'&&!state.drawFast&&typeof window.setTimeout==='function')window.setTimeout(()=>startDrawTypewriter(typingToken),90);
}

const screens = {
  title: renderTitle,
  draw: renderDraw,
  setup: renderSetup,
  map: renderMap,
  workbench: renderWorkbench,
  chapter: renderChapter,
  manuscript: renderManuscript,
  feedback: renderFeedback,
  crisis: renderCrisis,
  ending: renderEnding,
};

/* ============ 界面：标题 ============ */
function renderTitle(){
  return `
  <div class="screen screen--title">
    <div class="paper">
      <div class="masthead">
        <div class="masthead-brand">知 乎 · 盐 选</div>
        <div class="masthead-date">写作生存战 · 90 DAYS</div>
      </div>
      <div class="title-hero">
        <div class="title-kicker">一款「写小说」的互动叙事游戏</div>
        <h1 class="title-main">盐选人生</h1>
        <div class="title-sub">90天写作生存战</div>
        <p class="title-line">你写下的每一个选择，都会同时改变小说的命运<br>与作者的命运。</p>
        <div class="stamp stamp--big">存 稿<br>待 续</div>
      </div>
      <button class="btn btn--primary btn--big" data-action="toDraw">开 始 写 作</button>
      <div class="title-foot">双操作层 · 剧本具体度 · 倒置爬塔 · AI 读者反馈闭环</div>
    </div>
  </div>`;
}

/* ============ 界面：抽题 ============ */
function renderDraw(){
  const q = state.question;
  const answer = drawAnswer(q);
  const prompt = state.drawPrompt || QUESTION_PROMPTS[q.genre]?.[0] || '你有什么至今难忘的经历？';
  return `
  <div class="draw-screen ${state.drawFast?'is-fast is-complete':''}">
    <div class="draw-ambient" aria-hidden="true"><i></i><i></i><i></i></div>
    <header class="draw-heading"><span>知乎 · 为你推荐</span><b>${esc(q.genre)}</b></header>
    <main class="qa-thread">
      <article class="question-post">
        <div class="qa-person"><span class="zh-avatar" aria-hidden="true"><i></i></span><div><b>知乎用户</b><small>${esc(q.setting)} · 刚刚提问</small></div></div>
        <h1>${esc(prompt)}</h1>
        <div class="question-stats"><span>等待回答</span><i></i><span>关注问题</span></div>
      </article>
      <article class="kanshan-answer">
        <div class="qa-person"><img src="assets/liu-kanshan/animations/打招呼_4秒_320x320_20fps_透明.gif" alt="刘看山"><div><b>刘看山</b><small>知乎官方账号 · 正在回答</small></div><span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>
        <p class="typed-answer"><span class="typed-answer-text">${state.drawFast?esc(answer):''}</span><span class="typing-caret" aria-hidden="true"></span></p>
      </article>
    </main>
    <div class="draw-controls">
      <button class="btn btn--ghost" data-action="redraw">换一个问题</button>
      <button class="btn btn--primary" data-action="toSetup">就从这个回答开始</button>
    </div>
    <div class="enter-hint"><span>ENTER</span> 显示完整回答</div>
    <div class="sr-only" aria-live="polite">刘看山正在回答问题</div>
  </div>`;
}

function drawAnswer(q){
  const story = String(q.premise||'').replace(/贯穿悬念[：:].*$/u,'').trim();
  return `谢邀。\n\n${q.title}\n\n${q.hook}\n\n${story}`;
}

function startDrawTypewriter(token){
  if(token!==drawTypingToken||state.phase!=='draw'||state.drawFast)return;
  const holder=document.querySelector('.typed-answer-text'),screen=document.querySelector('.draw-screen');
  if(!holder||!screen)return;
  const chars=[...drawAnswer(state.question)];let index=0;
  holder.textContent='';
  const step=()=>{
    if(token!==drawTypingToken||state.phase!=='draw'||state.drawFast)return;
    holder.textContent+=chars[index++]||'';
    if(index>=chars.length){screen.classList.add('is-complete');return;}
    const char=chars[index-1],pause=/[。！？]/u.test(char)?210:/[，；：\n]/u.test(char)?95:30;
    window.setTimeout(step,pause);
  };
  step();
}

function finishDrawTypewriter(){
  state.drawFast=true;drawTypingToken++;
  const holder=document.querySelector('.typed-answer-text'),screen=document.querySelector('.draw-screen');
  if(holder&&screen){holder.textContent=drawAnswer(state.question);screen.classList.add('is-fast','is-complete');}
  else render();
}

function questionCard(q, big){
  return `
  <div class="qcard ${big?'qcard--big':''}">
    <div class="qcard-head">
      <div class="qcard-avatar">${esc(q.protagonist.role.slice(0,1))}</div>
      <div class="qcard-meta">
        <div class="qcard-author">匿名写手</div>
        <div class="qcard-sub">${esc(q.setting)}</div>
      </div>
      <span class="qtag">${esc(q.genre)}</span>
    </div>
    <h2 class="qcard-title">${esc(q.title)}</h2>
    <p class="qcard-hook">${esc(q.hook)}</p>
    <p class="qcard-premise">${esc(q.premise)}</p>
  </div>`;
}

/* ============ 界面：开局设置 ============ */
function renderSetup(){
  const q = state.question;
  return `
  <div class="screen screen--center">
    <div class="phase-tag">第 1 步 · 确定你的写作身份</div>
    <div class="setup-grid">
      <div class="setup-q">${questionCard(q, false)}</div>
      <div class="setup-opts">
        <div class="opt-group">
          <div class="opt-label">故事类型 <span class="opt-hint">（决定叙事走向，默认取自题目）</span></div>
          <div class="chip-row" data-action="pickGenre">
            ${GENRES.map(g=>`<button class="chip ${g===state.genre?'chip--on':''}" data-action="pickGenre" data-val="${esc(g)}">${esc(g)}</button>`).join('')}
          </div>
        </div>
        <div class="opt-group">
          <div class="opt-label">核心主题</div>
          <div class="chip-row">
            ${THEMES.map(t=>`<button class="chip ${t===state.theme?'chip--on':''}" data-action="pickTheme" data-val="${esc(t)}">${esc(t)}</button>`).join('')}
          </div>
        </div>
        <div class="opt-group">
          <div class="opt-label">初始写作策略</div>
          <div class="route-cards">
            ${ROUTES.map(r=>`<button class="route-card ${r.key===state.routeLean?'route-card--on':''}" data-action="pickRoute" data-val="${r.key}" style="--rc:${r.color}">
              <b>${esc(r.name)}</b><span>${esc(r.desc)}</span></button>`).join('')}
          </div>
        </div>
        <div class="opt-group opt-group--name">
          <div class="opt-label">你的笔名</div>
          <input class="pen-input" id="penName" maxlength="12" placeholder="输入笔名，回车确认" value="${esc(state.penName)}">
        </div>
        <button class="btn btn--primary btn--big" data-action="startGame">进入 90 天倒计时</button>
      </div>
    </div>
  </div>`;
}

/* ============ 界面：地图（思维导图 + 倒置爬塔） ============ */
function renderMap(){
  const q = state.question;
  const dom = dominantRouteKey();
  const nodeCards = [];
  for (let i=0;i<CHAPTERS.length;i++){
    const done = i < state.chapterIndex;
    const cur = i === state.chapterIndex;
    nodeCards.push(`<div class="tower-node ${done?'is-done':''} ${cur?'is-now':''}">
      <div class="tn-day">D-${CHAPTERS[i].day}</div>
      <div class="tn-stage">${CHAPTERS[i].stage}</div>
      <div class="tn-dot"></div>
      <div class="tn-state">${done?'已写':cur?'进行中':'未写'}</div>
    </div>`);
  }
  nodeCards.push(`<div class="tower-node tower-node--crisis ${state.chapterIndex>=CHAPTERS.length?'is-done':''} ${state.chapterIndex===CHAPTERS.length?'is-now':''}">
    <div class="tn-day">D-${CRISIS_DAY}</div>
    <div class="tn-stage">收束期</div>
    <div class="tn-dot"></div>
    <div class="tn-state">${state.chapterIndex>=CHAPTERS.length?'已写':'最终危机'}</div>
  </div>`);

  const branches = ROUTES.map((r,i)=>{
    const ang = -90 + i*72;
    const rad = ang*Math.PI/180;
    const x = 130 + 95*Math.cos(rad), y = 130 + 95*Math.sin(rad);
    const active = r.key===dom;
    return `<g>
      <line x1="130" y1="130" x2="${x}" y2="${y}" class="mind-branch ${active?'is-active':''}" stroke="${r.color}"/>
      <circle cx="${x}" cy="${y}" r="27" fill="${r.color}" fill-opacity="${active?0.95:0.22}" stroke="${r.color}"/>
      <text x="${x}" y="${y+4}" class="mind-route">${r.name.slice(0,2)}</text>
      <text x="${x}" y="${y+17}" class="mind-route-sub">${active?'← 当前':''}</text>
    </g>`;
  }).join('');

  return `
  <div class="screen screen--map">
    <div class="map-head">
      <div class="map-day">第 <b>${state.day}</b> 天</div>
      <div class="map-sub">倒置爬塔 · 第 ${Math.min(state.chapterIndex+1,6)} / 6 节点</div>
    </div>
    <div class="map-body">
      <div class="mindmap">
        <svg viewBox="0 0 260 260" class="mindmap-svg">${branches}</svg>
        <div class="mindmap-root">
          <div class="mr-tag">${esc(q.genre)}</div>
          <div class="mr-title">${esc(trunc(q.title, 14))}</div>
        </div>
      </div>
      <div class="tower">
        <div class="tower-title">创作路线图</div>
        <div class="tower-list">${nodeCards.join('')}</div>
        <div class="map-route-now">当前路线倾向：<b style="color:${ROUTE_MAP[dom].color}">${ROUTE_MAP[dom].name}</b></div>
      </div>
    </div>
    <button class="btn btn--primary btn--big" data-action="toWorkbench">
      ${state.chapterIndex>=CHAPTERS.length ? '进入最终危机' : `写第 ${state.chapterIndex+1} 章`}
    </button>
  </div>`;
}

/* ============ 界面：外层工作台（三栏） ============ */
function renderWorkbench(){
  const ch = state.currentChapter;
  const res = state.resources;
  const q = state.question;
  const demand = state.pendingDemand;

  const outlineItems = state.outline.map(o=>`<li>${esc(o)}</li>`).join('');
  const charItems = [q.protagonist, ...q.npc].map(c=>`<div class="char-row"><span class="char-role">${esc(c.role)}</span><span class="char-goal">${esc(c.want||c.goal||'')}</span></div>`).join('');
  const foreItems = state.foreshadowing.map(f=>`<li>${esc(f)}</li>`).join('') || '<li class="dim">还没有埋下伏笔</li>';

  const bars = RES_DEFS.map(r=>`
    <div class="bar-row">
      <div class="bar-label"><span class="bar-icon">${uiIcon(r.icon)}</span>${r.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${clamp(res[r.key],0,100)}%;background:${resColor(r.key)}"></div></div>
      <div class="bar-val">${Math.round(res[r.key])}</div>
    </div>`).join('');

  const spark = sparkline(state.heatHistory);

  return `
  <div class="screen screen--wb">
    <div class="wb-top">
      <div class="wb-day">D-${state.day}</div>
      <div class="wb-goal-line">本章目标：<b>${esc(ch.goal)}</b></div>
      <div class="wb-stage">${ch.stage}</div>
    </div>
    <div class="wb">
      <div class="wb-col wb-doc">
        <div class="col-title">📄 文档</div>
        <div class="doc-block"><div class="doc-h">故事大纲</div><ul class="doc-list">${outlineItems}</ul></div>
        <div class="doc-block"><div class="doc-h">人物状态</div><div class="char-list">${charItems}</div></div>
        <div class="doc-block"><div class="doc-h">已埋伏笔</div><ul class="doc-list">${foreItems}</ul></div>
        <div class="doc-block">
          <div class="doc-h">剧本具体度</div>
          <div class="spec-row">
            ${SPECIFICS.map(s=>`<button class="spec ${ch.specificity===s.key?'spec--on':''}" data-action="pickSpec" data-val="${s.key}">
              <b>${s.label}</b><span>${s.hint}</span></button>`).join('')}
          </div>
        </div>
        <button class="btn btn--primary btn--big" data-action="enterChapter">进入章节 <span class="cost">(-${SPECIFICS.find(s=>s.key===ch.specificity).cost} 行动力)</span></button>
      </div>

      <div class="wb-col wb-data">
        <div class="col-title">📊 数据</div>
        <div class="bars">${bars}</div>
        <div class="doc-block"><div class="doc-h">热度曲线</div>${spark}</div>
        ${demand ? `<div class="editor-card"><div class="editor-h">编辑要求 · ${demand.stage}</div><p>${esc(fill(demand.text, baseCtx(ch.scene)))}</p><div class="editor-constraint">✍ 本章约束：${esc(fill(demand.constraint, baseCtx(ch.scene)))}</div></div>` : ''}
        <div class="tip-box">${esc(ch.stage==='危机期'?'⚠ 精力与舆论压力上升，选择要更谨慎。':'每次进入章节消耗行动力；精力过低会降低写作质量。')}</div>
      </div>

      <div class="wb-col wb-comments">
        <div class="col-title">${uiIcon('message')} 评论区</div>
        <div class="comment-list">
          ${state.chapters.length===0 ? '<div class="dim">还没有读者。发布第一章后，AI 读者会带着立场涌进来。</div>' : renderComments(state.chapters[state.chapters.length-1].comments, true)}
        </div>
      </div>
    </div>
  </div>`;
}

function renderComments(comments, compact){
  return comments.map(c=>`
    <div class="comment ${compact?'comment--compact':''}">
      <div class="comment-head"><span class="comment-name">${esc(c.reader)}</span><span class="comment-role">${esc(c.personaShort)}</span></div>
      <div class="comment-body">${esc(c.text)}</div>
    </div>`).join('');
}

/* ============ 界面：内层章节（都市剧场） ============ */
function renderChapter(){
  const ch = state.currentChapter;
  const s = SPECIFICS.find(s=>s.key===ch.specificity);
  const ctx = baseCtx(ch.scene);
  ctx.goal = ch.goal;
  ctx.cliff = ch.goal;

  return `
  <div class="screen screen--scene">
    <div class="scene scene--${moodKey(ch.scene.mood)}">
      <div class="scene-grad"></div>
      <div class="scene-city">${citySilhouette()}</div>
      <div class="scene-rain"></div>
      <div class="scene-vignette"></div>
      <div class="scene-bar scene-bar--top">${esc(ch.scene.name)} · ${esc(ch.scene.mood)}</div>
      <div class="scene-bar scene-bar--bottom">内层 · 主角视角</div>

      <div class="scene-stage">
        <div class="stage-kicker">D-${state.day} · ${esc(state.genre)} · 剧本具体度「${s.label}」</div>
        <p class="stage-situation">${esc(fill(ch.scene.desc, ctx))}</p>
        <p class="stage-goal">本章目标：${esc(fill(ch.goal, ctx))}</p>
        <div class="stage-choices">
          ${ch.decisions.map((d,i)=>`<button class="choice" data-action="makeDecision" data-idx="${i}">
            <span class="choice-idx">${String.fromCharCode(65+i)}</span><span>${esc(fill(d.text, ctx))}</span>
          </button>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

/* ============ 界面：AI 续写手稿 ============ */
function renderManuscript(){
  const ch = state.currentChapter;
  const paras = ch.prose.map(p=>`<p>${esc(p)}</p>`).join('');
  return `
  <div class="screen screen--center">
    <div class="phase-tag">AI 续写 · 章节成稿</div>
    <div class="manuscript">
      <div class="ms-head">
        <span class="ms-ch">第 ${ch.num} 章</span>
        <span class="ms-title">${esc(ch.goal)}</span>
        <span class="stamp stamp--red">草 稿</span>
      </div>
      <div class="ms-body">${paras}</div>
      <div class="ms-ann">红笔批注：本章为「${SPECIFICS.find(s=>s.key===ch.specificity).label}」剧本，AI 依大纲、人物状态与已埋伏笔续写。</div>
    </div>
    <div class="btn-row">
      <button class="btn btn--primary btn--big" data-action="publish">发 布 章 节</button>
    </div>
  </div>`;
}

/* ============ 界面：反馈（评论 + 作者决策） ============ */
function renderFeedback(){
  const ch = state.currentChapter;
  const dom = dominantRouteKey();
  return `
  <div class="screen screen--center">
    <div class="phase-tag">发布第 ${ch.num} 章 · 读者反馈</div>
    <div class="fb-grid">
      <div class="fb-comments">
        <div class="col-title">${uiIcon('message')} AI 读者评论（${ch.comments.length}）</div>
        <div class="comment-list">${renderComments(ch.comments, false)}</div>
      </div>
      <div class="fb-side">
        <div class="doc-block"><div class="doc-h">本章数据变动</div>${renderDelta(ch.delta)}</div>
        ${ch.event ? `<div class="event-card"><div class="event-h">${uiIcon('alert')} 突发事件 · ${esc(ch.event.name)}</div><p>${esc(fill(ch.event.desc, chapterCtx(ch)))}</p></div>` : ''}
        <div class="doc-block"><div class="doc-h">作者层决策</div>
          <div class="author-choices">
            ${AUTHOR_DECISIONS.map((a,i)=>`<button class="author-choice" data-action="authorDecide" data-idx="${i}">
              <b>${esc(a.label)}</b><span>${esc(a.desc)}</span></button>`).join('')}
          </div>
        </div>
        <div class="tip-box">当前路线倾向：<b style="color:${ROUTE_MAP[dom].color}">${ROUTE_MAP[dom].name}</b>。你的选择会塑造作者风格与下一章走向。</div>
      </div>
    </div>
  </div>`;
}

function renderDelta(delta){
  if(!delta) return '<div class="dim">无</div>';
  const rows=[];
  for(const k in delta){
    const v=delta[k];
    if(!v) continue;
    const def=RES_DEFS.find(r=>r.key===k);
    rows.push(`<div class="delta-row"><span>${def?def.label:k}</span><b class="${v>0?'up':'down'}">${v>0?'+':''}${v}</b></div>`);
  }
  return rows.join('');
}

/* ============ 界面：最终危机 ============ */
function renderCrisis(){
  const ctx = baseCtx(state.currentScene || {name: state.question.setting});
  ctx.goal = '收束全篇';
  ctx.cliff = '最终结局';
  return `
  <div class="screen screen--center crisis-screen">
    <header class="crisis-heading">
      <span class="phase-tag">D-${CRISIS_DAY} · 最终危机</span>
      <h1>最后一章，<br>你准备怎样落笔？</h1>
      <p>这次选择会同时决定作品的结局，以及你作为作者留下的名字。</p>
    </header>
    <div class="crisis-card">
      <div class="event-h"><span>${uiIcon('alert')}</span><b>${esc(fill(state.crisisComplication, ctx))}</b></div>
      <p class="crisis-desc">第 0 天将至。现在，你需要为这部作品与自己的写作生涯，做最后一个决定。</p>
    </div>
    <div class="stage-choices stage-choices--final">
      ${state.crisisChoices.map((d,i)=>`<button class="choice crisis-choice" data-action="finalChoice" data-idx="${i}">
        <span class="choice-idx">${String.fromCharCode(65+i)}</span><span class="crisis-choice-copy"><b>${esc(fill(d.text, ctx))}</b><small>${effectChips(d.effect,true)}</small></span>${uiIcon('arrowRight')}
      </button>`).join('')}
    </div>
  </div>`;
}

/* ============ 界面：结局 ============ */
function renderEnding(){
  const e = state.ending;
  const lastCh = state.chapters[state.chapters.length-1];
  const ctx = lastCh ? chapterCtx(lastCh) : baseCtx(state.currentScene || {name: state.question.setting});
  ctx.route = ROUTE_MAP[dominantRouteKey()].name;

  const novel = state.chapters.map(c=>`<div class="report-ch"><div class="report-ch-h">第 ${c.num} 章 · ${esc(c.goal)}</div>${c.prose.map(p=>`<p>${esc(p)}</p>`).join('')}</div>`).join('');
  const decisions = state.chapters.map(c=>`<div class="report-row"><b>第${c.num}章</b>${c.steps.map((s,i)=>`<p>第 ${i+1} 幕：${esc(s.text)}<br>${esc(s.result)}</p>`).join('')}<p>作者回应：${esc(c.authorDecision.label)}</p></div>`).join('');
  const comments = state.highlightComments.map(c=>`<div class="report-row">【${esc(c.reader)}】${esc(c.text)}</div>`).join('');

  return `
  <div class="screen screen--ending">
    <div class="end-hero">
      <div class="book-cover">
        <div class="book-cover-art">
          <div class="book-cover-tag">${esc(state.genre)}</div>
          <div class="book-cover-title">${esc(fill(e.cover.title, ctx))}</div>
          <div class="book-cover-tagline">${esc(fill(e.cover.tagline, ctx))}</div>
        </div>
        <div class="book-spine">${esc(fill(e.cover.spine, ctx))}</div>
      </div>
      <div class="author-profile">
        <div class="profile-head">
          <div class="profile-avatar">${esc(state.penName.slice(0,1)||'我')}</div>
          <div>
            <div class="profile-name">${esc(state.penName)}</div>
            <div class="profile-ending">${esc(e.title)}</div>
          </div>
          <div class="stamp stamp--gold">完 结</div>
        </div>
        <p class="profile-subtitle">${esc(e.subtitle)}</p>
        <div class="profile-traits">${e.archive.traits.map(t=>`<span class="trait">${esc(t)}</span>`).join('')}</div>
        <div class="profile-verdict">${esc(fill(e.archive.verdict, ctx))}</div>
        <div class="profile-style">${esc(fill(e.archive.styleLine, ctx))}</div>
      </div>
    </div>

    <div class="report">
      <div class="report-title">📋 最终报告</div>
      <div class="report-grid">
        <div class="report-section"><div class="report-h">作品封面与作者档案</div>
          <div class="report-cover-note">作品《${esc(fill(e.cover.title, ctx))}》 · 作者 ${esc(state.penName)} · ${esc(e.title)}</div>
          <div class="report-afterword"><b>作者后记</b><p>${esc(fill(e.archive.afterword, ctx))}</p></div>
        </div>
        <div class="report-section"><div class="report-h">热度曲线</div>${sparkline(state.heatHistory, 300, 90)}</div>
        <div class="report-section"><div class="report-h">章节决策记录</div>${decisions}</div>
        <div class="report-section"><div class="report-h">评论精选</div>${comments || '<div class="dim">无</div>'}</div>
        <div class="report-section report-section--wide"><div class="report-h">完整短篇小说</div>${novel}</div>
      </div>
    </div>

    <div class="end-quote">“你没有写出读者最想看的故事，<br>但写出了你最不愿意放弃的故事。”</div>
    <div class="btn-row"><button class="btn btn--primary btn--big" data-action="replay">再 来 一 次</button></div>
  </div>`;
}

/* ============ 子渲染：柱状/曲线 ============ */
function sparkline(data, w, h){
  w = w || 260; h = h || 60;
  const max = Math.max(100, ...data);
  const n = data.length;
  const pts = data.map((v,i)=>{
    const x = n<=1 ? 0 : i*(w/(n-1));
    const y = h - (v/max)*(h-8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length-1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polyline fill="none" stroke="#e0533f" stroke-width="2" points="${pts.join(' ')}"/>
    ${last?`<circle cx="${last.split(',')[0]}" cy="${last.split(',')[1]}" r="3" fill="#e0533f"/>`:''}
  </svg>`;
}

function citySilhouette(){
  // 半写实都市剪影（随机化楼群）
  let b = '';
  for(let i=0;i<14;i++){
    const h = 12 + rand(46);
    const w = 6 + rand(5);
    const x = i*(100/14);
    const lit = rand(10)>4;
    let win='';
    if(lit){ for(let r=0;r<3;r++){ win += `<rect x="${(x+w*0.2).toFixed(1)}" y="${(h*0.2+r*1.4).toFixed(1)}" width="${(w*0.5).toFixed(1)}" height="0.8" fill="#ffd98a" opacity="0.8"/>`; } }
    b += `<rect x="${x.toFixed(1)}" y="${(60-h).toFixed(1)}" width="${w}" height="${h}" fill="#0f1420" opacity="0.9"/>${win}`;
  }
  return `<svg class="scene-city-svg" viewBox="0 0 100 60" preserveAspectRatio="none">${b}</svg>`;
}

function moodKey(mood){
  const map = {"压抑":"cold","凝重":"cold","不安":"cold","紧张":"tense","诡异":"dark","森然":"dark","阴冷":"dark","毛骨悚然":"dark","疲惫":"cold","疏离":"cold","酸涩":"warm","僵持":"cold","恍惚":"warm","隐忍":"warm","窒息":"warm","松动":"warm","自由":"dawn","焦灼":"tense","孤立":"cold","暗流":"cold","憋闷":"cold","错愕":"tense","紧绷":"tense","苍凉":"warm","震撼":"dawn"};
  return map[mood] || 'cold';
}

function resColor(key){
  const c = {action:"#3d8bfd",energy:"#16a085",heat:"#e0533f",quality:"#8a55c9",style:"#e08a2e",sign:"#d4a017"};
  return c[key]||'#888';
}

function trunc(s, n){ s = String(s||''); return s.length>n ? s.slice(0,n)+'…' : s; }

/* ============ 动作 ============ */
function act(action, el){
  switch(action){
    case 'toDraw': drawQuestion(); render(); break;
    case 'redraw': drawQuestion(); render(); break;
    case 'toSetup': state.phase='setup'; render(); break;
    case 'pickGenre': state.genre = el.dataset.val; render(); break;
    case 'pickTheme': state.theme = el.dataset.val; render(); break;
    case 'pickRoute': state.routeLean = el.dataset.val; state.routeAffinity[el.dataset.val]+=8; render(); break;
    case 'startGame': {
      const pn = $('#penName'); if(pn && pn.value.trim()) state.penName = pn.value.trim();
      state.phase='map'; state.chapterIndex=0; state.day=CHAPTERS[0].day; render(); break;
    }
    case 'toWorkbench': openWorkbench(); render(); break;
    case 'pickSpec': state.currentChapter.specificity = el.dataset.val; render(); break;
    case 'enterChapter': return enterChapter();
    case 'makeDecision': makeDecision(+el.dataset.idx); render(); break;
    case 'publish': publish(); render(); break;
    case 'authorDecide': authorDecide(+el.dataset.idx); render(); break;
    case 'finalChoice': finalChoice(+el.dataset.idx); render(); break;
    case 'replay': boot(); render(); break;
  }
}

const pendingActions = new Set();
document.addEventListener('click', (e)=>{
  const origin = e.target;
  const t = origin && typeof origin.closest==='function' ? origin.closest('[data-action]') : null;
  if(!t || t.disabled || t.getAttribute?.('aria-disabled')==='true') return;
  e.preventDefault();
  const action = t.dataset.action;
  const guarded = ['enterChapter','makeDecision','nextBeat','publish','authorDecide','finalChoice'].includes(action);
  if(guarded && pendingActions.has(action)) return;
  if(guarded){
    pendingActions.add(action);
    t.classList?.add('is-pressed');
    t.setAttribute?.('aria-busy','true');
  }
  let result;
  try{ result = act(action, t); }
  catch(err){
    if(state){ state.uiNotice = err?.message || '这次操作没有完成，请再试一次。'; render(); }
    pendingActions.delete(action);
    return;
  }
  if(result && typeof result.then==='function'){
    Promise.resolve(result).catch((err)=>{
      if(state){ state.uiNotice = err?.message || '这次操作没有完成，请再试一次。'; render(); }
    }).finally(()=>pendingActions.delete(action));
  }else pendingActions.delete(action);
});
document.addEventListener('keydown', (e)=>{
  if(state?.phase==='draw'&&e.key==='Enter'&&!e.altKey&&!e.ctrlKey&&!e.metaKey){
    if(!state.drawFast){e.preventDefault();finishDrawTypewriter();}
    return;
  }
  if(state?.overlay || state?.phase!=='chapter' || e.altKey || e.ctrlKey || e.metaKey) return;
  const keys = ['1','2','3','4','5','a','b','c','d','e'];
  const pos = keys.indexOf(String(e.key).toLowerCase());
  if(pos<0) return;
  const idx = pos%5;
  const t = document.querySelector(`[data-action="makeDecision"][data-idx="${idx}"]`);
  if(t){ e.preventDefault(); t.click(); }
});
document.addEventListener('input', (e)=>{
  if(e.target && e.target.id==='penName'){ state.penName = e.target.value; persistGame(); }
});

/* ============ 游戏逻辑 ============ */
function drawQuestion(){
  state.question = pick(CONTENT.questions.questions);
  state.genre = state.question.genre;
  state.theme = state.question.theme;
  state.drawPrompt = pick(QUESTION_PROMPTS[state.question.genre]||['你有什么至今难忘的经历？']);
  state.drawFast = false;
  state.phase = 'draw';
}

function openWorkbench(){
  const i = state.chapterIndex;
  const isCrisis = i >= CHAPTERS.length;
  if(isCrisis){
    openCrisis();
    return;
  }
  const meta = CHAPTERS[i];
  state.day = meta.day;
  const genre = CONTENT.story.genres[state.genre];
  const scene = pick(genre.scenes);
  const ctx0 = baseCtx(scene);
  // 挑一个本章目标（填充占位符，避免重复）
  const filledGoals = genre.chapterGoals.map(g=>fill(g, ctx0));
  const used = new Set(state.outline.map(o=>o.split('：')[0]));
  const avail = filledGoals.filter(g=>!used.has(g));
  const goal = pick(avail.length?avail:filledGoals);
  state.currentChapter = {
    num: i+1,
    day: meta.day,
    stage: meta.stage,
    scene, goal,
    specificity: 'balanced',
    decisions: [],
    prose: [], comments: [], delta: null, event: null, authorDecision: null,
  };
  state.pendingDemand = pickEditorDemand(meta.stage);
  state.phase = 'workbench';
}

function pickEditorDemand(stage){
  const ds = CONTENT.editor.demands.filter(d=>d.stage===stage);
  if(!ds.length) return null;
  const match = ds.filter(d=>condMatches(d.condition));
  const pool = match.length?match:ds;
  return pick(pool);
}
function condMatches(c){
  if(!c) return true;
  for(const k in c){
    const r = state.resources[k] ?? 0;
    if(c[k].lt!==undefined && r>=c[k].lt) return false;
    if(c[k].gt!==undefined && r<=c[k].gt) return false;
  }
  return true;
}

function enterChapter(){
  const ch = state.currentChapter;
  const s = SPECIFICS.find(s=>s.key===ch.specificity);
  // 消耗行动力
  state.resources.action -= s.cost;
  // 精力低 → 质量惩罚
  if(state.resources.energy < 30) state.resources.quality -= 2;
  // 选择决策
  const genre = CONTENT.story.genres[state.genre];
  ch.decisions = pickDecisions(genre.decisions, s.choices);
  state.phase = 'chapter';
}
function pickDecisions(pool, n){
  const shuffled = shuffle(pool);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function makeDecision(idx){
  const ch = state.currentChapter;
  const d = ch.decisions[idx];
  ch.decision = d;
  applyEffect(d.effect);
  // 宽泛 → 触发隐藏事件概率
  const s = SPECIFICS.find(s=>s.key===ch.specificity);
  if(s.key==='broad' && Math.random()<0.4 && state.pendingEvent==null){
    state.pendingEvent = pick(CONTENT.events.events);
  }
  generateProse(ch);
  state.phase = 'manuscript';
}

function generateProse(ch){
  const genre = CONTENT.story.genres[state.genre];
  const ctx = baseCtx(ch.scene);
  ctx.goal = ch.goal;
  ctx.decision = fill(ch.decision.text, ctx);
  ctx.cliff = ch.goal;
  const open = fill(pick(genre.openings), ctx);
  const sceneLine = fill(ch.scene.desc, ctx);
  const consLine = fill(ch.decision.consequence, ctx);
  const body = fill(pick(genre.bodies), ctx);
  const cliffRaw = fill(pick(genre.cliffhangers), ctx);
  ch.prose = [open, sceneLine + '　' + consLine, body, cliffRaw];
  ch.cliffHook = ch.goal;
}

function applyEffect(eff){
  if(!eff) return;
  const map = {heat:'heat',quality:'quality',energy:'energy',sign:'sign',style:'style'};
  for(const k in map){
    const v = eff[k];
    if(v) state.resources[map[k]] = clamp(state.resources[map[k]]+v, 0, 100);
  }
  // 行动力变动（某些事件/决策没有，忽略）
}

function publish(){
  const ch = state.currentChapter;
  // 数据变动
  const s = SPECIFICS.find(s=>s.key===ch.specificity);
  const baseDelta = { heat: s.heat + (ch.decision.effect.heat||0), quality: s.quality + (ch.decision.effect.quality||0) };
  // 应用具体度加成（已在上一步 applyEffect 应用了 decision effect，这里补具体度差）
  ch.delta = { heat: baseDelta.heat, quality: baseDelta.quality, energy: -(s.cost>20?1:0) };
  state.resources.heat = clamp(state.resources.heat + ch.delta.heat, 0, 100);
  state.resources.quality = clamp(state.resources.quality + ch.delta.quality, 0, 100);
  // 突发事件
  if(state.pendingEvent){
    ch.event = state.pendingEvent;
    applyEffect(ch.event.effect);
    state.pendingEvent = null;
  }
  // 记录
  ch.comments = generateComments(ch);
  state.heatHistory.push(state.resources.heat);
  state.chapters.push(ch);
  // 大纲/伏笔积累
  const octx = chapterCtx(ch);
  if(!state.outline.some(o=>o.startsWith(ch.goal))) state.outline.push(`${ch.goal}：${fill(ch.decision.consequence, octx).slice(0,18)}`);
  state.foreshadowing.push(ch.cliffHook);
  state.phase = 'feedback';
}

function generateComments(ch){
  const ctx = chapterCtx(ch);
  const readers = CONTENT.readers.readers;
  const n = 3 + rand(3); // 3-5
  const weighted = [];
  readers.forEach(r=>{ const w = Math.round((r.weight||1)*10); for(let i=0;i<w;i++) weighted.push(r); });
  const chosen = [];
  const seen = new Set();
  while(chosen.length < n && weighted.length){
    const r = pick(weighted);
    if(seen.has(r.id) && Math.random()<0.6) continue;
    seen.add(r.id);
    chosen.push({ reader:r.id, personaShort: r.persona.slice(0,14), text: fill(pick(r.templates), ctx) });
  }
  return chosen;
}

function authorDecide(idx){
  const ch = state.chapters[state.chapters.length-1];
  const a = AUTHOR_DECISIONS[idx];
  ch.authorDecision = a;
  applyEffect(a.eff);
  state.routeAffinity[a.route] += 3;
  if(a.key==='cater') state.aiReliance += 1;
  if(a.key==='stick') state.aiReliance = Math.max(0, state.aiReliance-1);
  // 精选评论（供结局）
  if(ch.comments.length){
    const memorable = pick(ch.comments);
    state.highlightComments.push(memorable);
  }
  // 下一章
  state.chapterIndex += 1;
  if(state.chapterIndex >= CHAPTERS.length){
    state.day = CRISIS_DAY;
    openCrisis();
  } else {
    state.day = CHAPTERS[state.chapterIndex].day;
    state.phase = 'map';
  }
}

function openCrisis(){
  const c = CONTENT.story.crisis;
  state.crisisComplication = pick(c.complications);
  state.crisisChoices = c.finalChoices.slice();
  state.currentScene = { name: state.question.setting };
  state.phase = 'crisis';
}

function finalChoice(idx){
  const d = state.crisisChoices[idx];
  applyEffect(d.effect);
  if(d.effect.style < 0) state.aiReliance += 1;
  state.heatHistory.push(state.resources.heat);
  state.ending = resolveEnding();
  state.day = 0;
  state.phase = 'ending';
}

function resolveEnding(){
  const sorted = [...CONTENT.endings.endings].sort((a,b)=>(b.priority||0)-(a.priority||0));
  for(const e of sorted){
    if(e.default) continue;
    if(condGte(e.condition)) return e;
  }
  return CONTENT.endings.endings.find(e=>e.default);
}
function condGte(c){
  if(!c) return true;
  for(const k in c){
    const r = state.resources[k] ?? 0;
    if(c[k].gte!==undefined && r < c[k].gte) return false;
  }
  return true;
}

/* ============ 启动 ============ */
function boot(){
  state = {
    phase:'title',
    question:null, genre:'悬疑反转', theme:'真相', routeLean:'quality', penName:'匿名写手',
    day:90, chapterIndex:0,
    resources:{ action:100, energy:80, heat:10, quality:60, style:50, sign:10 },
    routeAffinity:{ traffic:0, quality:5, controversy:0, commercial:0, self:2 },
    aiReliance:0,
    chapters:[], outline:[], foreshadowing:[], highlightComments:[],
    heatHistory:[10],
    currentChapter:null, pendingDemand:null, pendingEvent:null,
    crisisComplication:null, crisisChoices:[], ending:null, currentScene:null,
  };
  render();
}

// 初始化由 pacing.js 完成，确保篇幅与叙事系统就绪。

/* ============ 预览钩子（截图 / 直达：index.html#scene | #map | #ending） ============ */
if (false && typeof location !== 'undefined' && location.hash){
  const h = location.hash.slice(1);
  if (h === 'scene'){
    drawQuestion();
    state.phase='map'; state.chapterIndex=0; state.day=CHAPTERS[0].day;
    openWorkbench(); enterChapter(); render();
  } else if (h === 'map'){
    drawQuestion();
    state.phase='map'; state.chapterIndex=0; state.day=CHAPTERS[0].day; render();
  } else if (h === 'ending'){
    drawQuestion();
    state.phase='map'; state.chapterIndex=0; state.day=CHAPTERS[0].day;
    for(let i=0;i<5;i++){ openWorkbench(); enterChapter(); makeDecision(0); publish(); authorDecide(0); }
    finalChoice(0); render();
  }
}
