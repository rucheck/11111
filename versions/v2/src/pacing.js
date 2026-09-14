/* 连载节奏、双层过场与持续叙事。复用基础资源与结局渲染。 */
const LENGTHS = {
  short:{name:'短篇', chapters:6, beats:4, tone:'克制现实', desc:'24 次故事决策 · 每章四幕，聚焦一条冲突并完整落下后果。'},
  medium:{name:'中篇', chapters:9, beats:5, tone:'层层反转', desc:'45 次故事决策 · 每章五幕，关系、线索与回收彼此咬合。'},
  long:{name:'长篇', chapters:12, beats:6, tone:'戏剧升级', desc:'72 次故事决策 · 每章六幕，多方卷入并形成连锁反转。'},
};
const STORY_ARCS = {
  '悬疑反转':{object:'一份时间对不上的出入记录', question:'记录中的空白究竟在保护谁', turns:['门禁记录被人改过，原始记录却还留在旧设备里。','证人承认自己撒过谎，但坚持那是为了保护一个无辜的人。','两份证词终于指向同一个时间点，谁也无法再用巧合解释。'], stakes:['对方要求在天亮前私下谈一次。','第二名证人收到警告，调查开始牵连身边的人。','记录突然被公开，所有涉事者都必须当众给出解释。']},
  '都市情感':{object:'一张未被提起的共同支出凭据', question:'两个人对这段关系的承诺是否相同', turns:['凭据背面的日期，是两个人约好重新开始的那一天。','对方承认隐瞒了一笔支出，却不愿说明收款人是谁。','一段被误解的旧约定浮出水面，信任需要重新谈判。'], stakes:['今晚的饭局变成了两个人的摊牌。','家人开始介入，私人承诺成了共同的压力。','一场公开的庆祝被迫中止，双方要在众人面前重新选择。']},
  '女性成长':{object:'一份被代签的机会确认书', question:'谁有权替她决定下一段人生', turns:['确认书已经交出，但接收方还留着更改决定的期限。','熟悉的人说这是为她好，却拿不出她曾同意的证据。','另一位被劝退的申请者愿意作证，代价是一起面对质疑。'], stakes:['她需要在一次家庭谈话中说清自己的决定。','机会的竞争者也被卷入，支持与利益开始冲突。','名单即将公开，她必须在现场要求重新确认资格。']},
  '民俗怪谈':{object:'一本多出陌生名字的值夜簿', question:'旧规矩究竟约束人还是保护人', turns:['新写下的名字在旧簿中出现过，旁边还留着一笔划痕。','守夜人承认规矩改过一次，但所有人都避谈修改的原因。','被封住的门后传出熟悉的敲击声，与簿中的记号完全相同。'], stakes:['这一夜，只需决定是否打开那扇门。','同样的记号出现在邻居门前，规矩开始影响更多人。','全镇灯火同时熄灭，守夜簿的最后一页必须有人写下。']},
  '职场冲突':{object:'一份署名被替换的项目底稿', question:'成果与责任为何总落在不同的人身上', turns:['底稿的版本历史里，还留着最初提交人的名字。','同事承认看见过修改，却担心作证会影响自己的续约。','交付时间逼近，客户要求原作者到场解释关键决策。'], stakes:['一次小组会议足以决定谁来承担责任。','两个部门互相推诿，原本的盟友开始各自保全。','客户与管理层同时到场，隐瞒的版本差异被投上屏幕。']},
  '历史脑洞':{object:'一份印记不符的调令', question:'服从眼前的命令是否背离最初的职责', turns:['调令上的印记来自已经撤换的旧衙署。','送信人承认换过马匹，却不肯交代途中见过谁。','另一份调令抵达，两个命令只能执行其中之一。'], stakes:['城门关闭前，必须给送信人一个答复。','两处驻地等待不同命令，迟疑也会造成后果。','使者与守军当面对质，一纸命令足以改变整座城的归属。']},
};
const originalBoot = boot, originalAct = act, originalWorkbench = openWorkbench;
const originalPublish = publish, originalAuthor = authorDecide, originalFinal = finalChoice;
const originalRenderWB = renderWorkbench, originalRenderSetup = renderSetup, originalFeedback = renderFeedback, originalEnding = renderEnding;
function mode(){ return LENGTHS[state.length || 'medium']; }
function setSchedule(){
  CHAPTERS = Array.from({length:mode().chapters},(_,i)=>{
    const day=90-Math.round(i*82/(mode().chapters-1));
    return {day,stage:day>60?'起步期':day>30?'增长期':day>10?'危机期':'收束期'};
  });
}
async function refreshUsage(){
  if(typeof fetch==='undefined'||typeof location==='undefined'||location.protocol==='file:')return;
  try{
    const r=await fetch('/api/status',{cache:'no-store'}),data=await r.json();
    if(r.ok&&data.usage){state.zhihuUsage=data.usage;if(['prologue','workbench','map'].includes(state.phase))render();}
  }catch{}
}
boot = function(){
  originalBoot();
  Object.assign(state,{length:'medium',memory:[],storyBible:[],trust:0,evidence:0,prep:0,feedbackKey:'stick',transition:null,chapterPlan:'追寻事实',generationMode:'zhihu',generationJob:'',zhihuUsage:{limit:5000,used:0,remaining:5000,date:''},prologueStep:0,setupStep:0,workbenchStep:0,overlay:'',uiNotice:''});
  setSchedule(); render(); refreshUsage();
};
function mascot(kind='待机_5秒_320x320_20fps_透明.gif'){
  return `<img class="kanshan" src="assets/liu-kanshan/animations/${kind}" alt="刘看山写作助手" width="160" height="160">`;
}
function bridge(target,title,body){ state.transition={target,title,body}; state.phase='transition'; }
screens.transition = ()=>`<section class="passage"><div class="passage-line"></div>${mascot()}<span class="eyebrow">${state.transition.target==='chapter'?'进入小说':'回到书桌'}</span><h1>${esc(state.transition.title)}</h1><p>${esc(state.transition.body)}</p><button class="btn btn--primary" data-action="continueTransition">继续</button></section>`;
screens.title = ()=>`<section class="new-title"><div class="title-copy"><span class="eyebrow">知乎盐选互动叙事 / 90 DAYS</span><h1>盐选人生<span>写下故事，<br>也被故事改变。</span></h1><button class="btn btn--primary btn--big" data-action="startPrologue">开始游戏 →</button></div><div class="title-art"><div class="art-book"><span>未完成的<br>第九十天</span></div>${mascot('电脑_6秒_320x320_20fps_透明.gif')}<span class="art-note">距交稿还有 <b>90</b> 天</span></div></section>`;
const PROLOGUE=[
  {tag:'知乎盐选写手 · 匿名用户',title:'谢邀。人在第九十天，稿子还没活过来。',body:'起初，你以为这只是一次普通更新。直到评论区里，有人叫出了一个尚未写下的名字。',visual:'question'},
  {tag:'高赞回答 · 修改于昨夜',title:'后来我才知道，故事并不是写给人看的。',body:'至少，不全是。每次按下发布，纸页背面都会多出一扇门。',visual:'manuscript'},
  {tag:'该问题已被折叠',title:'门后的人，和你用着同一双手。',body:'你替他做选择。他替你承担后果。至于谁才是作者——写到最后再说。',visual:'portal'},
];
screens.prologue=()=>{const item=PROLOGUE[state.prologueStep],last=state.prologueStep===PROLOGUE.length-1;return `<section class="prologue prologue--${item.visual}"><div class="prologue-no">0${state.prologueStep+1}</div><div class="prologue-copy"><span>${item.tag}</span><h1>${item.title}</h1><p>${item.body}</p>${last?`<div class="start-modes"><button data-action="chooseStartMode" data-val="zhihu" ${(state.zhihuUsage?.remaining??5000)<=0?'disabled':''}>知乎模式 <b>${Math.max(0,state.zhihuUsage?.remaining??5000)}</b></button><button data-action="chooseStartMode" data-val="local">本地模式 <b>∞</b></button></div>`:`<button class="prologue-next" data-action="nextPrologue">继续 →</button>`}</div><div class="prologue-art"><div class="prologue-paper"></div>${mascot(item.visual==='portal'?'晃悠_320x320_3秒_20fps_透明.gif':'电脑_6秒_320x320_20fps_透明.gif')}</div><div class="prologue-dots">${PROLOGUE.map((_,i)=>`<i class="${i===state.prologueStep?'on':''}"></i>`).join('')}</div></section>`;};
function setupShell(step,title,body){return `<section class="screen setup-wizard"><div class="wizard-top"><span>开局设置 ${step}/3</span><div>${[1,2,3].map(i=>`<i class="${i<=step?'on':''}"></i>`).join('')}</div></div><h1 class="wizard-title">${title}</h1>${body}</section>`;}
screens.setup = ()=>{
  if(state.setupStep===0)return setupShell(1,'这次写多长？',`<div class="wizard-grid">${Object.entries(LENGTHS).map(([key,m])=>`<button class="wizard-card" data-action="pickLength" data-val="${key}"><b>${m.name}</b><span>${m.chapters} 章 · ${m.chapters*m.beats} 次选择</span></button>`).join('')}</div>`);
  if(state.setupStep===1)return setupShell(2,'故事写什么？',`<div class="setup-question">${esc(state.question.title)}</div><div class="wizard-block"><b>类型</b><div class="chip-row">${GENRES.map(g=>`<button class="chip ${g===state.genre?'chip--on':''}" data-action="pickGenre" data-val="${esc(g)}">${esc(g)}</button>`).join('')}</div></div><div class="wizard-block"><b>主题</b><div class="chip-row">${THEMES.map(t=>`<button class="chip ${t===state.theme?'chip--on':''}" data-action="pickTheme" data-val="${esc(t)}">${esc(t)}</button>`).join('')}</div></div><div class="wizard-actions"><button class="btn btn--ghost" data-action="setupBack">上一步</button><button class="btn btn--primary" data-action="nextSetup">下一步</button></div>`);
  return setupShell(3,'你准备怎么写？',`<div class="wizard-grid route-wizard">${ROUTES.map(r=>`<button class="wizard-card ${r.key===state.routeLean?'selected':''}" data-action="pickRoute" data-val="${r.key}"><b>${esc(r.name)}</b><span>${esc(r.desc)}</span></button>`).join('')}</div><label class="pen-label">笔名<input class="pen-input" id="penName" maxlength="12" value="${esc(state.penName)}"></label><div class="wizard-actions"><button class="btn btn--ghost" data-action="setupBack">上一步</button><button class="btn btn--primary" data-action="startGame">进入第 90 天</button></div>`);
};
screens.map = ()=>`<section class="screen"><div class="map-heading"><div><span class="eyebrow">连载计划 / ${mode().name}</span><h1>还剩 ${state.day} 天，<br>故事正在向你索要答案。</h1></div>${mascot()}</div><div class="chapter-track">${CHAPTERS.map((c,i)=>`<div class="track-node ${i===state.chapterIndex?'current':''} ${i<state.chapterIndex?'complete':''}"><small>D-${c.day} · ${c.stage}</small><b>第 ${i+1} 章</b><span>${i<state.chapterIndex?'已归档':i===state.chapterIndex?'正在书写':'尚未发生'}</span></div>`).join('')}</div><div class="map-summary"><h3>上一章留下了什么</h3><p>${esc(state.memory.at(-1)||state.question.premise)}</p><p>行动力 ${state.resources.action} · 精力 ${state.resources.energy} · ${ROUTE_MAP[dominantRouteKey()].name}</p></div><button class="btn btn--primary btn--big" data-action="toWorkbench">打开第 ${state.chapterIndex+1} 章工作台 →</button></section>`;
const PREP = [
  {label:'整理伏笔',detail:'行动力 −8 / 质量 +3 / 线索 +1',effect:{quality:3},action:-8},
  {label:'和读者聊聊',detail:'行动力 −8 / 热度 +3 / 精力 −2',effect:{heat:3,energy:-2},action:-8},
  {label:'休息一晚',detail:'行动力 +12 / 精力 +8 / 热度 −1',effect:{energy:8,heat:-1},action:12},
];
function usageLabel(){
  const u=state.zhihuUsage||{limit:5000,used:0,remaining:5000};
  return `今日剩余 ${Math.max(0,u.remaining)} / ${u.limit} 次`;
}
function workbenchShell(step,title,body){return `<section class="screen chapter-wizard"><div class="wizard-top"><span>第 ${state.currentChapter.num} 章 · ${step}/3</span><div>${[1,2,3].map(i=>`<i class="${i<=step?'on':''}"></i>`).join('')}</div></div><h1 class="wizard-title">${title}</h1>${body}</section>`;}
screens.workbench = ()=>{
  const ch=state.currentChapter;
  if(state.workbenchStep===0)return workbenchShell(1,'这一章往哪里写？',`<div class="continuity-card"><span>前情</span><p>${esc(state.memory.at(-1)||state.question.premise)}</p></div><div class="wizard-grid intent-grid">${['追寻事实','修复关系','正面冲突'].map((plan,i)=>`<button class="wizard-card intent-card" data-action="plan" data-val="${plan}"><b>${plan}</b><span>${['查清矛盾，增加线索','推进人物关系','让冲突立即发生'][i]}</span></button>`).join('')}</div>`);
  if(state.workbenchStep===1)return workbenchShell(2,'写之前做什么？',`<div class="prep-count">${state.prep}/2</div><div class="wizard-grid">${PREP.map((p,i)=>`<button class="wizard-card prep-card" data-action="prepare" data-idx="${i}" ${state.prep>=2||state.resources.action+p.action<0?'disabled':''}><b>${p.label}</b><span>${p.detail}</span></button>`).join('')}</div>${state.prepNote?`<div class="action-result">${esc(state.prepNote)}</div>`:''}<div class="wizard-actions"><button class="btn btn--ghost" data-action="workbenchBack">上一步</button><button class="btn btn--primary" data-action="nextWorkbench">${state.prep?'下一步':'跳过'}</button></div>`);
  return workbenchShell(3,'给主角多少自由？',`<div class="wizard-grid script-grid">${SPECIFICS.map(s=>`<button class="wizard-card ${ch.specificity===s.key?'selected':''}" data-action="pickSpec" data-val="${s.key}"><b>${s.label}</b><span>${s.choices} 个选项 · −${s.cost} 行动力</span></button>`).join('')}</div><div class="chapter-ready"><span>${esc(state.chapterPlan)}</span><b>${state.generationMode==='local'?'本地模式':usageLabel()}</b></div>${state.uiNotice?`<div class="ui-notice">${esc(state.uiNotice)}</div>`:''}<div class="wizard-actions"><button class="btn btn--ghost" data-action="workbenchBack">上一步</button><button class="btn btn--primary btn--big" data-action="enterChapter">进入故事</button></div>`);
};
openWorkbench = function(){ originalWorkbench(); if(state.phase==='workbench'){
  state.prep=0;state.prepNote='';state.workbenchStep=0;state.currentChapter.steps=[];state.currentChapter.beat=0;
  state.currentChapter.scene={...state.currentChapter.scene,name:state.question.setting};
  state.currentChapter.goal=`${['建立疑问','寻找证人','承担代价','发现矛盾','追问动机','兑现承诺'][state.chapterIndex%6]}：${STORY_ARCS[state.genre].question}`;
  state.currentChapter.before={...state.resources};
}};
function chapterIntro(){
  const a=STORY_ARCS[state.genre], ch=state.currentChapter;
  const ctx=baseCtx(ch.scene);
  const carry=state.memory.length?`上一章留下的事实仍在起作用：${state.memory.at(-1)}`:state.question.premise;
  return `${fill(ch.scene.desc,ctx)} ${carry} ${ctx.npc}把${a.object}放到面前，等着你先开口。`;
}
enterChapter = function(){
  const ch=state.currentChapter,s=SPECIFICS.find(x=>x.key===ch.specificity);
  if(state.phase!=='workbench') return;
  if(state.resources.action<s.cost){ state.prepNote='行动力不足，可休息一晚；若已用完准备次数，可低效更新。';return; }
  state.resources.action-=s.cost;applyEffect({energy:-3,quality:state.resources.energy<30?-2:0});
  ch.plan=state.chapterPlan;ch.intro=ch.generated?ch.generated.beats[0].situation:chapterIntro();ch.steps=[];ch.beat=0;
  if(s.key==='broad'&&Math.random()<0.3)state.pendingEvent=pick(CONTENT.events.events);
  bridge('chapter','笔尖停下，你走进了故事。',`现在你是${state.question.protagonist.role}。作者希望你${ch.plan}；接下来 ${mode().beats} 幕，由你承担行动的后果。`);
};
function beatText(){
  const ch=state.currentChapter,a=STORY_ARCS[state.genre];
  if(ch.generated){return (ch.beat?ch.steps.at(-1).result+'\n\n':'')+ch.generated.beats[ch.beat].situation;}
  if(ch.beat===0)return ch.intro;
  const last=ch.steps.at(-1);
  const development=ch.beat===mode().beats-1?a.stakes[Object.keys(LENGTHS).indexOf(state.length)]:a.turns[(state.chapterIndex+ch.beat-1)%a.turns.length];
  return `${last.result} ${development} ${state.trust>0?'对方愿意留下来把事情说完。':'对方始终留意着门口，谈话随时可能中止。'}`;
}
function options(){
  const a=STORY_ARCS[state.genre],ctx=baseCtx(state.currentChapter.scene),b=state.currentChapter.beat;
  const pool=[
    {kind:'核实事实',hint:'增加线索，可能损伤信任',text:`核对${a.object}，要求补全${b?'刚才遗漏的细节':'来龙去脉'}`,effect:{quality:1,heat:0},evidence:1,trust:-1,result:`你把疑点逐一写下。${ctx.npc}终于指出了其中一个被忽略的细节；这条记录会保留在后续调查中。`},
    {kind:'建立信任',hint:'改善关系，保留后续合作',text:`让${ctx.npc}先解释，${state.trust>0?'延续上次的约定':'给对方一次坦白的机会'}`,effect:{style:1,energy:1},trust:1,evidence:0,result:`你没有打断。${ctx.npc}说完了最难开口的部分，并答应下次带来另一位知情人。你们的信任增加了。`},
    {kind:'正面对质',hint:state.evidence>1?'证据充分，推动主线':'证据不足，风险较高',text:state.evidence>1?'带着已经核实的记录当面对质':'先试探对方，承担证据不足的风险',effect:{heat:2,energy:-1,quality:state.evidence>1?1:-1},trust:-1,evidence:0,result:state.evidence>1?'你按顺序摆出记录，对方没能解释其中的矛盾，答应在下一次会面补充证词。':'对方抓住了证据里的空白，拒绝继续回答。冲突升级了，你需要更多事实才能推进。'},
    {kind:'探索支线',hint:'获得另一种说法，消耗精力',text:`暂时离开，找${ctx.npc2}核实另一种说法`,effect:{quality:1,energy:-1},trust:0,evidence:1,result:`你找到${ctx.npc2}，得到了一份不同的说法。这条支线进入了你的行动记录，也让原先的判断不再那么确定。`},
    {kind:'观察等待',hint:'保留主动权，热度可能下降',text:`先不表态，观察${ctx.npc}会如何处理眼前的压力`,effect:{style:1,heat:-1,energy:1},trust:0,evidence:0,result:`你把沉默留在现场。${ctx.npc}误以为你已经掌握更多事实，主动暴露了一个前后不一致的细节；代价是局面暂时没有向前推进。`},
  ];
  // 作者方向和上章反馈决定选项排序；具体度限制可探索分支。
  const preferred=state.chapterPlan==='修复关系'?1:state.chapterPlan==='正面冲突'?2:0;
  const order=[preferred,...[0,1,2,3,4].filter(i=>i!==preferred)];
  if(['cater','reply','argue'].includes(state.feedbackKey)&&preferred!==2){order.splice(order.indexOf(2),1);order.splice(1,0,2);}
  const configured=SPECIFICS.find(s=>s.key===state.currentChapter.specificity).choices;
  const count=state.resources.energy<25?Math.max(3,configured-1):configured;
  return order.slice(0,count).map(i=>{
    const generated=state.currentChapter.generated?.beats?.[b]?.options?.[i];
    return generated?{...pool[i],...generated,kind:generated.kind||pool[i].kind,hint:generated.hint||pool[i].hint}:pool[i];
  });
}
const BEAT_NAMES=['抵达','试探','交锋','追问','转折','余波'];
function effectText(d){
  const tags=[];
  if(d.evidence>0)tags.push('线索 +1');
  if(d.trust>0)tags.push('关系改善');
  if(d.trust<0)tags.push('关系承压');
  if(d.effect?.heat>0)tags.push('热度上升');
  if(d.effect?.quality>0)tags.push('质量提升');
  if(d.effect?.energy<0)tags.push('消耗精力');
  return tags.slice(0,2).join(' · ')||'影响将在选择后揭晓';
}
screens.chapter = ()=>{
  const ch=state.currentChapter,previous=state.storyBible.at(-1);ch.choiceLocked=false;ch.decisions=options();
  const carry=previous?`<div class="story-continuity"><b>前情承接 · 第 ${previous.chapter} 章</b><span>${esc(trunc(previous.lastResult,120))}</span><small>未解决：${esc(trunc(previous.cliff,72))}</small></div>`:'';
  return `<section class="story-stage"><div class="story-sky"></div><div class="story-meta"><span>小说世界 / ${esc(ch.scene.name)}</span><span>第 ${ch.num} 章 · ${ch.beat+1}/${mode().beats} 幕</span></div><div class="beat-progress" aria-label="章节进度">${Array.from({length:mode().beats},(_,i)=>`<span class="${i<ch.beat?'done':i===ch.beat?'current':''}"><i></i>${BEAT_NAMES[i]||`第${i+1}幕`}</span>`).join('')}</div><article class="story-panel"><span class="eyebrow">${BEAT_NAMES[ch.beat]||`第 ${ch.beat+1} 幕`} · ${mode().tone}</span><h1>${esc(STORY_ARCS[state.genre].question)}？</h1>${carry}<p class="story-text">${esc(beatText())}</p><div class="story-facts"><span>关系 <b>${state.trust>0?'逐步信任':state.trust<0?'有所戒备':'尚未明朗'}</b></span><span>已核实线索 <b>${state.evidence}</b></span><span>作者意图 <b>${esc(ch.plan)}</b></span><span>${previous?'上章回应':'本章任务'} <b>${esc(previous?previous.authorResponse:'建立人物与核心冲突')}</b></span></div><div class="decision-brief"><b>你怎么做？</b></div>${state.uiNotice?`<div class="ui-notice" role="alert">${esc(state.uiNotice)}</div>`:''}<div class="story-options">${ch.decisions.map((d,i)=>`<button type="button" class="choice choice--${i}" data-action="makeDecision" data-idx="${i}" aria-label="${String.fromCharCode(65+i)}：${esc(d.text)}"><span class="choice-idx">${String.fromCharCode(65+i)}</span><span class="choice-copy"><b>${esc(d.kind||'采取行动')}</b><span>${esc(d.text)}</span><small>${esc(d.hint||effectText(d))}</small></span><span class="choice-impact">${esc(effectText(d))}</span></button>`).join('')}</div></article></section>`;
};
makeDecision = function(idx){
  if(state.phase!=='chapter')return;
  const ch=state.currentChapter,d=ch.decisions[idx];
  if(ch.choiceLocked)return;
  if(!d){state.uiNotice='这个选项已失效，页面已为你刷新。';render();return;}
  ch.choiceLocked=true;state.uiNotice='';
  ch.decision={...d,consequence:d.result};
  applyEffect(d.effect);state.trust+=d.trust;state.evidence+=d.evidence;
  ch.steps.push({kind:d.kind||'行动',text:d.text,result:d.result,situation:beatText(),impact:effectText(d)});
  state.phase='consequence';
};
screens.consequence = ()=>{const step=state.currentChapter.steps.at(-1);return `<section class="passage consequence"><div class="consequence-mark">✓</div><span class="eyebrow">${esc(step.kind)} / 第 ${state.currentChapter.beat+1} 幕</span><h2>${esc(step.text)}</h2><p>${esc(step.result)}</p><div class="memory-slip"><b>${esc(step.impact)}</b></div><button class="btn btn--primary btn--big" data-action="nextBeat">${state.currentChapter.beat+1<mode().beats?'继续 →':'回到书桌 →'}</button></section>`;};
generateProse = function(ch){
  ch.prose=[ch.intro,...ch.steps.flatMap((s,i)=>[`${BEAT_NAMES[i]||`第${i+1}幕`}：${s.situation}`,`你选择了「${s.text}」。${s.result}`])];
  ch.prose=[...new Set(ch.prose)];
  ch.cliffHook=state.question.mystery||STORY_ARCS[state.genre].question;
  ch.prose.push(`这一章停在了这里：${ch.cliffHook}。${state.trust>0?'有人愿意同你一起寻找答案。':'下一次开口，可能需要付出更大的代价。'}`);
};
publish = function(){
  if(state.phase!=='manuscript')return;
  const ch=state.currentChapter,s=SPECIFICS.find(x=>x.key===ch.specificity);
  // 基础 publish 会重复加末次决策的热度和质量，抵消后仅结算具体度。
  const effect=ch.decision.effect;ch.decision.effect={};originalPublish();ch.decision.effect=effect;
  ch.delta=Object.fromEntries(Object.keys(state.resources).map(k=>[k,state.resources[k]-ch.before[k]]));
  ch.comments.unshift({reader:'追读的老朋友',personaShort:'记得你的承诺',text:`这一章你选择了「${ch.steps.at(-1).text}」。${state.memory.length?'上一章留下的「'+state.memory.at(-1)+'」还没过去，':'从开篇走到这里，'}希望下一章认真回应「${ch.cliffHook}」。`});
};
authorDecide = function(idx){
  if(state.phase!=='feedback')return;
  const a=AUTHOR_DECISIONS[idx];if(!a)return;
  state.feedbackKey=a.key;
  const ch=state.currentChapter,last=ch.steps.at(-1);
  const actionTrail=ch.steps.map((step,i)=>`${i+1}.${step.kind}：${trunc(step.result,90)}`).join('；');
  const memory=`第${ch.num}章行动链：${actionTrail}。最终结果：${trunc(last.result,180)} 未解决的问题：${ch.cliffHook}。作者回应：${a.label}。`;
  state.memory.push(memory);
  state.storyBible.push({chapter:ch.num,goal:ch.goal,decisions:ch.steps.map(step=>({kind:step.kind,text:trunc(step.text,90),result:trunc(step.result,120)})),lastAction:last.text,lastResult:last.result,cliff:ch.cliffHook,authorResponse:a.label,trust:state.trust,evidence:state.evidence});
  originalAuthor(idx);state.resources.action=clamp(state.resources.action+20,0,100);
  bridge(state.phase,'关掉评论区，留下一条新的承诺。',`${a.note} 下一章的选项会回应你这次的「${a.label}」。${state.chapterIndex<CHAPTERS.length?'日历翻到剩余 '+state.day+' 天。':'接下来为作品写下最终答案。'}`);
};
finalChoice = function(idx){
  if(state.phase!=='crisis')return;
  const d=state.crisisChoices[idx];if(!d)return;
  state.novelEnding=fill(d.consequence,baseCtx(state.currentScene));originalFinal(idx);
};
screens.ending = ()=>`<section class="screen novel-ending"><span class="eyebrow">作品结局</span><h2>最后一页，终于有了答案。</h2><p>${esc(state.novelEnding||'')}</p><p>${mode().chapters} 章 · ${mode().chapters*mode().beats} 次主角决策 · ${state.evidence} 条核实线索</p></section>`+originalEnding();
act = function(action,el){
  if(action==='startPrologue'&&state.phase==='title'){state.phase='prologue';state.prologueStep=0;render();return;}
  if(action==='nextPrologue'&&state.phase==='prologue'){state.prologueStep=Math.min(PROLOGUE.length-1,state.prologueStep+1);render();return;}
  if(action==='chooseStartMode'&&state.phase==='prologue'){
    if(el.dataset.val==='zhihu'&&(state.zhihuUsage?.remaining??5000)<=0)return;
    state.generationMode=el.dataset.val==='local'?'local':'zhihu';drawQuestion();render();return;
  }
  if(action==='openOverlay'&&state.question){state.overlay=el.dataset.val;render();return;}
  if(action==='closeOverlay'){state.overlay='';render();return;}
  if(action==='toSetup'&&state.phase==='draw'){state.setupStep=0;state.phase='setup';render();return;}
  if(action==='pickLength'&&state.phase==='setup'&&state.setupStep===0){state.length=el.dataset.val;setSchedule();state.setupStep=1;render();return;}
  if(action==='nextSetup'&&state.phase==='setup'){state.setupStep=Math.min(2,state.setupStep+1);render();return;}
  if(action==='setupBack'&&state.phase==='setup'){state.setupStep=Math.max(0,state.setupStep-1);render();return;}
  if(action==='continueTransition'&&state.phase==='transition'){state.phase=state.transition.target;state.transition=null;render();return;}
  if(action==='plan'&&state.phase==='workbench'&&state.workbenchStep===0){state.chapterPlan=el.dataset.val;state.workbenchStep=1;render();return;}
  if(action==='prepare'&&state.phase==='workbench'&&state.workbenchStep===1){
    const i=+el.dataset.idx,p=PREP[i];if(!p||state.prep>=2||state.resources.action+p.action<0)return;
    state.prep++;state.resources.action=clamp(state.resources.action+p.action,0,100);applyEffect(p.effect);if(i===0)state.evidence++;
    state.prepNote=`已完成「${p.label}」`;render();return;
  }
  if(action==='nextWorkbench'&&state.phase==='workbench'&&state.workbenchStep===1){state.workbenchStep=2;render();return;}
  if(action==='workbenchBack'&&state.phase==='workbench'){state.workbenchStep=Math.max(0,state.workbenchStep-1);render();return;}
  if(action==='pickSpec'&&state.phase==='workbench'){if(state.workbenchStep!==2)return;state.currentChapter.specificity=el.dataset.val;render();return;}
  if(action==='nextBeat'&&state.phase==='consequence'){
    const ch=state.currentChapter;ch.beat++;ch.choiceLocked=false;
    if(ch.beat<mode().beats)state.phase='chapter';else{generateProse(ch);bridge('manuscript','角色的经历，变成你桌上的手稿。','你重新成为作者。读完这一章，决定是否发布，再面对读者的反应。');}render();return;
  }
  if(action==='pickRoute'&&state.phase==='setup'){state.routeLean=el.dataset.val;state.routeAffinity={traffic:0,quality:0,controversy:0,commercial:0,self:0};state.routeAffinity[el.dataset.val]=8;render();return;}
  if(action==='enterChapter'&&state.phase==='workbench'){
    if(state.workbenchStep!==2)return;
    if(state.resources.action<SPECIFICS.find(s=>s.key===state.currentChapter.specificity).cost&&state.prep>=2){state.resources.action=25;applyEffect({quality:-4,energy:-8});}
  }
  return originalAct(action,el);
};
function mapOverlay(){
  const completed=state.chapters.length,current=state.currentChapter&&!state.chapters.includes(state.currentChapter)?state.currentChapter.steps?.length||0:0;
  const done=Math.min(mode().chapters*mode().beats,completed*mode().beats+current),percent=Math.round(done/(mode().chapters*mode().beats)*100);
  return `<div class="game-overlay" role="dialog" aria-modal="true"><div class="overlay-panel map-panel"><button class="overlay-close" data-action="closeOverlay">×</button><span class="overlay-kicker">故事地图 · ${percent}%</span><h2>${mode().chapters} 章 / ${mode().chapters*mode().beats} 次选择</h2><div class="overlay-progress"><i style="width:${percent}%"></i></div><div class="overlay-chapters">${CHAPTERS.map((chapter,i)=>`<div class="${i<completed?'done':i===state.chapterIndex?'current':''}"><b>${i+1}</b><span>D-${chapter.day}</span></div>`).join('')}</div><div class="map-now"><b>${state.phase==='chapter'||state.phase==='consequence'?`第 ${state.currentChapter.num} 章 · 第 ${state.currentChapter.beat+1} 幕`:`第 ${Math.min(state.chapterIndex+1,mode().chapters)} 章`}</b><span>${esc(state.currentChapter?.goal||state.memory.at(-1)||state.question.premise)}</span></div></div></div>`;
}
function statusOverlay(){
  const modeValue=state.generationMode==='local'?'本地模式 · 不限次数':`知乎模式 · ${usageLabel()}`;
  return `<div class="game-overlay" role="dialog" aria-modal="true"><div class="overlay-panel status-panel"><button class="overlay-close" data-action="closeOverlay">×</button><span class="overlay-kicker">当前状态</span><h2>${esc(state.penName)} · D-${state.day}</h2><div class="status-resources">${RES_DEFS.map(item=>`<div><span>${item.label}</span><b>${Math.round(state.resources[item.key])}</b><i><em style="width:${state.resources[item.key]}%;background:${resColor(item.key)}"></em></i></div>`).join('')}</div><div class="status-facts"><span>模式 <b>${modeValue}</b></span><span>路线 <b>${ROUTE_MAP[dominantRouteKey()].name}</b></span><span>关系 <b>${state.trust}</b></span><span>线索 <b>${state.evidence}</b></span></div>${state.currentChapter?`<div class="status-goal"><b>当前目标</b><span>${esc(state.currentChapter.goal)}</span></div>`:''}</div></div>`;
}
const baseRender=render;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state?.overlay){state.overlay='';render();}});
render = function(){
  baseRender();
  const el=$('#app');if(!state.question||['title','prologue','draw','setup'].includes(state.phase))return;
  const inner=['chapter','consequence'].includes(state.phase);
  const modeText=state.generationMode==='local'?'本地模式 · 不限次数':`知乎模式 · ${usageLabel()}`;
  el.innerHTML=`<header class="identity game-nav ${inner?'identity-story':''}"><div class="nav-left"><button data-action="openOverlay" data-val="map">← 返回地图</button><button data-action="openOverlay" data-val="status">当前状态</button></div><b>${inner?'小说世界 · 你是主角':'作者世界 · 你是写手'}</b><span class="identity-mode">${modeText}</span></header>`+el.innerHTML+(state.overlay==='map'?mapOverlay():state.overlay==='status'?statusOverlay():'');
};
screens.manuscript = ()=>renderManuscript().replace('AI 续写 · 章节成稿','作者世界 · 审阅本章').replace('AI 依大纲、人物状态与已埋伏笔续写。','正文根据本章行动记录整理。');
function authorImpact(eff){
  return Object.entries(eff).filter(([,value])=>value).map(([key,value])=>`${RES_DEFS.find(item=>item.key===key)?.label||key} ${value>0?'+':''}${value}`).join(' · ')||'资源不变';
}
screens.feedback = ()=>{
  let html=originalFeedback();
  html=html.replace('<div class="doc-block"><div class="doc-h">作者层决策</div>', '<div class="doc-block author-decision-block"><div class="author-decision-head"><div class="doc-h">作者层决策</div></div>');
  return html.replace(/<button class="author-choice" data-action="authorDecide" data-idx="(\d+)">([\s\S]*?)<\/button>/g,(match,index,body)=>{const decision=AUTHOR_DECISIONS[Number(index)];return `<button class="author-choice" data-action="authorDecide" data-idx="${index}">${body}<small>${esc(authorImpact(decision.eff))}</small><em>写入下一章</em></button>`;});
};
const enterLocal=enterChapter;
const pollDelay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitForGeneration(ch,jobId){
  try{
    while(true){
      await pollDelay(1200);
      const r=await fetch(`/api/chapter/${encodeURIComponent(jobId)}`,{cache:'no-store'});
      let data;try{data=await r.json();}catch{throw Error('本地生成服务返回了无法识别的内容。');}
      if(data.usage)state.zhihuUsage=data.usage;
      if(r.status===202)continue;
      if(!r.ok){state.generationJob='';throw Error(data.error||'生成失败');}
      state.generationJob='';ch.generated=data;
      if(state.memory.length)ch.generated.beats[0].situation=`承接上章：${state.memory.at(-1)}\n\n${ch.generated.beats[0].situation}`;
      state.phase='workbench';enterLocal();render();return;
    }
  }catch(e){
    const network=/network|fetch|网络请求|failed/i.test(String(e.message));
    state.generationError=network?'本地生成服务连接中断。任务可能仍在继续。':e.message;
    state.phase='generationError';render();
  }
}
enterChapter = function(){
  if(state.phase!=='workbench')return;
  const cost=SPECIFICS.find(s=>s.key===state.currentChapter.specificity).cost;
  if(state.resources.action<cost){enterLocal();return;}
  if(state.generationMode==='local'){enterLocal();render();return;}
  if((state.zhihuUsage?.remaining??5000)<=0){state.uiNotice='今日知乎模式次数已用完，请切换到本地模式。';render();return;}
  if(typeof fetch==='undefined'||typeof location==='undefined'||location.protocol==='file:'){enterLocal();return;}
  return (async()=>{
    const ch=state.currentChapter;state.phase='generating';state.generationError='';render();
    try{
      const r=await fetch('/api/chapter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({genre:state.genre,question:state.question,chapter:ch.num,chapters:mode().chapters,beats:mode().beats,tone:mode().tone,plan:state.chapterPlan,history:state.memory.slice(-6),storyBible:state.storyBible.slice(-6),continuity:{lastChapter:state.storyBible.at(-1)||null,openThreads:state.foreshadowing.slice(-5),relationship:state.trust,evidence:state.evidence},editor:state.pendingDemand?.constraint,feedback:state.feedbackKey,trust:state.trust,evidence:state.evidence})});
      let data;try{data=await r.json();}catch{throw Error('本地生成服务返回了无法识别的内容。');}
      if(data.usage)state.zhihuUsage=data.usage;if(!r.ok)throw Error(data.error||'生成失败');
      if(!data.jobId)throw Error('本地生成服务没有返回任务编号。');
      state.generationJob=data.jobId;return waitForGeneration(ch,data.jobId);
    }catch(e){
      const network=/network|fetch|网络请求|failed/i.test(String(e.message));
      state.generationError=network?'无法连接本地生成服务，请刷新页面后重试。':e.message;state.phase='generationError';render();
    }
  })();
};
screens.generating=()=>`<section class="passage">${mascot('电脑_6秒_320x320_20fps_透明.gif')}<span class="eyebrow">知乎模式</span><h2>正在写下一章。</h2><p>今日剩余 ${state.zhihuUsage?.remaining??5000} 次</p></section>`;
screens.generationError=()=>`<section class="passage"><h2>这一页暂时没写出来。</h2><p>${esc(state.generationError)}</p><button class="btn btn--primary" data-action="retryGeneration">${state.generationJob?'继续等待':'重新构思'}</button><button class="btn btn--ghost" data-action="localChapter">切换本地模式</button></section>`;
const beforeRemoteAct=act;
act=function(action,el){
  if(state.phase==='generationError'&&action==='retryGeneration'){
    if(state.generationJob){state.phase='generating';render();return waitForGeneration(state.currentChapter,state.generationJob);}
    state.phase='workbench';return enterChapter();
  }
  if(state.phase==='generationError'&&action==='localChapter'){state.generationJob='';state.generationMode='local';state.phase='workbench';enterLocal();render();return;}
  return beforeRemoteAct(action,el);
};
boot();
