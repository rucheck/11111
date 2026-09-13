/* 连载节奏、双层过场与持续叙事。复用基础资源与结局渲染。 */
const LENGTHS = {
  short:{name:'短篇', chapters:6, beats:3, tone:'克制现实', desc:'18 次故事决策 · 聚焦一条冲突，后果落在身边的人。'},
  medium:{name:'中篇', chapters:9, beats:4, tone:'层层反转', desc:'36 次故事决策 · 关系与线索交织，秘密逐步扩散。'},
  long:{name:'长篇', chapters:12, beats:5, tone:'戏剧升级', desc:'60 次故事决策 · 多方卷入，公开冲突与连锁反转。'},
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
const originalRenderWB = renderWorkbench, originalRenderSetup = renderSetup, originalEnding = renderEnding;
function mode(){ return LENGTHS[state.length || 'medium']; }
function setSchedule(){
  CHAPTERS = Array.from({length:mode().chapters},(_,i)=>{
    const day=90-Math.round(i*82/(mode().chapters-1));
    return {day,stage:day>60?'起步期':day>30?'增长期':day>10?'危机期':'收束期'};
  });
}
boot = function(){
  originalBoot();
  Object.assign(state,{length:'medium',memory:[],trust:0,evidence:0,prep:0,feedbackKey:'stick',transition:null,chapterPlan:'追寻事实'});
  setSchedule(); render();
};
function mascot(kind='待机_5秒_320x320_20fps_透明.gif'){
  return `<img class="kanshan" src="assets/liu-kanshan/animations/${kind}" alt="刘看山写作助手" width="160" height="160">`;
}
function bridge(target,title,body){ state.transition={target,title,body}; state.phase='transition'; }
screens.transition = ()=>`<section class="passage"><div class="passage-line"></div>${mascot()}<span class="eyebrow">视角切换 · ${state.transition.target==='chapter'?'进入小说':'回到书桌'}</span><h1>${esc(state.transition.title)}</h1><p>${esc(state.transition.body)}</p><button class="btn btn--primary" data-action="continueTransition">${state.transition.target==='chapter'?'以主角身份进入':'继续'}</button><small>可直接继续 · 动画不阻挡操作</small></section>`;
screens.title = ()=>`<section class="new-title"><div class="title-copy"><span class="eyebrow">一部小说，两种人生 / 90 DAYS</span><h1>盐选人生<span>写下故事，<br>也被故事改变。</span></h1><p>白天，你在书桌前决定故事的方向。<br>夜里，你走进自己写下的世界，承担每一个选择。</p><button class="btn btn--primary btn--big" data-action="toDraw">翻开我的第一章 →</button><div class="title-foot">制定剧本 · 进入故事 · 承担后果 · 面对读者</div></div><div class="title-art"><div class="art-book"><span>未完成的<br>第九十天</span><small>一份等待你署名的手稿</small></div>${mascot('电脑_6秒_320x320_20fps_透明.gif')}<span class="art-note">距交稿还有 <b>90</b> 天</span></div></section>`;
screens.setup = ()=>originalRenderSetup().replace('<div class="setup-grid">',`<div class="length-grid">${Object.entries(LENGTHS).map(([key,m])=>`<button class="length-card ${state.length===key?'selected':''}" data-action="pickLength" data-val="${key}" aria-pressed="${state.length===key}"><span>${m.name} / ${m.chapters} 章</span><h3>${m.tone}</h3><p>${m.desc}</p><small>每章 ${m.beats} 次主角决策 + 作者规划与反馈</small></button>`).join('')}</div><div class="setup-grid">`);
screens.map = ()=>`<section class="screen"><div class="map-heading"><div><span class="eyebrow">连载计划 / ${mode().name}</span><h1>还剩 ${state.day} 天，<br>故事正在向你索要答案。</h1></div>${mascot()}</div><div class="chapter-track">${CHAPTERS.map((c,i)=>`<div class="track-node ${i===state.chapterIndex?'current':''} ${i<state.chapterIndex?'complete':''}"><small>D-${c.day} · ${c.stage}</small><b>第 ${i+1} 章</b><span>${i<state.chapterIndex?'已归档':i===state.chapterIndex?'正在书写':'尚未发生'}</span></div>`).join('')}</div><div class="map-summary"><h3>上一章留下了什么</h3><p>${esc(state.memory.at(-1)||state.question.premise)}</p><p>行动力 ${state.resources.action} · 精力 ${state.resources.energy} · ${ROUTE_MAP[dominantRouteKey()].name}</p></div><button class="btn btn--primary btn--big" data-action="toWorkbench">打开第 ${state.chapterIndex+1} 章工作台 →</button></section>`;
const PREP = [
  {label:'整理伏笔',detail:'行动力 −8 / 质量 +3 / 线索 +1',effect:{quality:3},action:-8},
  {label:'和读者聊聊',detail:'行动力 −8 / 热度 +3 / 精力 −2',effect:{heat:3,energy:-2},action:-8},
  {label:'休息一晚',detail:'行动力 +12 / 精力 +8 / 热度 −1',effect:{energy:8,heat:-1},action:12},
];
screens.workbench = ()=>`<section class="screen planning"><div class="eyebrow">作者准备 / 第 ${state.currentChapter.num} 章</div><h2>先想清楚，这一章要留下什么。</h2><p>${esc(state.memory.at(-1)||state.question.premise)}</p><div class="plan-row">${['追寻事实','修复关系','正面冲突'].map(p=>`<button class="chip ${state.chapterPlan===p?'chip--on':''}" data-action="plan" data-val="${p}">${p}</button>`).join('')}</div><div class="prep-grid">${PREP.map((p,i)=>`<button class="prep-card" data-action="prepare" data-idx="${i}" ${state.prep>=2||state.resources.action+p.action<0?'disabled':''}><b>${p.label}</b><span>${p.detail}</span></button>`).join('')}</div><small>本章准备 ${state.prep}/2 · 可直接开始写作 · ${esc(state.prepNote||'')}</small></section>`+originalRenderWB();
openWorkbench = function(){ originalWorkbench(); if(state.phase==='workbench'){
  state.prep=0;state.prepNote='';state.currentChapter.steps=[];state.currentChapter.beat=0;
  state.currentChapter.scene={...state.currentChapter.scene,name:state.question.setting};
  state.currentChapter.goal=`${['建立疑问','寻找证人','承担代价','发现矛盾','追问动机','兑现承诺'][state.chapterIndex%6]}：${STORY_ARCS[state.genre].question}`;
  state.currentChapter.before={...state.resources};
}};
function chapterIntro(){
  const a=STORY_ARCS[state.genre], ch=state.currentChapter;
  const ctx=baseCtx(ch.scene);
  return `${fill(ch.scene.desc,ctx)} ${state.memory.length?'上一次的选择仍在起作用：'+state.memory.at(-1):state.question.premise} ${ctx.npc}把${a.object}放到面前，等着你先开口。`;
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
    {text:`核对${a.object}，要求补全${b?'刚才遗漏的细节':'来龙去脉'}`,effect:{quality:1,heat:0},evidence:1,trust:-1,result:`你把疑点逐一写下。${ctx.npc}终于指出了其中一个被忽略的细节；这条记录会保留在后续调查中。`},
    {text:`让${ctx.npc}先解释，${state.trust>0?'延续上次的约定':'给对方一次坦白的机会'}`,effect:{style:1,energy:1},trust:1,evidence:0,result:`你没有打断。${ctx.npc}说完了最难开口的部分，并答应下次带来另一位知情人。你们的信任增加了。`},
    {text:state.evidence>1?'带着已经核实的记录当面对质':'先试探对方，承担证据不足的风险',effect:{heat:2,energy:-1,quality:state.evidence>1?1:-1},trust:-1,evidence:0,result:state.evidence>1?'你按顺序摆出记录，对方没能解释其中的矛盾，答应在下一次会面补充证词。':'对方抓住了证据里的空白，拒绝继续回答。冲突升级了，你需要更多事实才能推进。'},
    {text:`暂时离开，找${ctx.npc2}核实另一种说法`,effect:{quality:1,energy:-1},trust:0,evidence:1,result:`你找到${ctx.npc2}，得到了一份不同的说法。这条支线进入了你的行动记录，也让原先的判断不再那么确定。`},
  ];
  // 作者方向和上章反馈决定选项排序；具体度限制可探索分支。
  const preferred=state.chapterPlan==='修复关系'?1:state.chapterPlan==='正面冲突'?2:0;
  const order=[preferred,...[0,1,2,3].filter(i=>i!==preferred)];
  if(['cater','reply','argue'].includes(state.feedbackKey)&&preferred!==2){order.splice(order.indexOf(2),1);order.splice(1,0,2);}
  const count=state.resources.energy<25?2:SPECIFICS.find(s=>s.key===state.currentChapter.specificity).choices;
  return order.slice(0,count).map(i=>state.currentChapter.generated?.beats[b].options[i]||pool[i]);
}
screens.chapter = ()=>{ const ch=state.currentChapter; ch.decisions=options(); return `<section class="story-stage"><div class="story-sky"></div><div class="story-meta"><span>小说世界 / ${esc(ch.scene.name)}</span><span>第 ${ch.num} 章 · ${ch.beat+1}/${mode().beats} 幕</span></div><article class="story-panel"><span class="eyebrow">${['抵达','试探','交锋','转折','余波'][ch.beat]} · ${mode().tone}</span><h1>${esc(STORY_ARCS[state.genre].question)}？</h1><p class="story-text">${esc(beatText())}</p><div class="story-facts">关系：${state.trust>0?'逐步信任':state.trust<0?'有所戒备':'尚未明朗'} · 已核实线索 ${state.evidence}<br>作者意图：${esc(ch.plan)} · 上章反馈：${esc(AUTHOR_DECISIONS.find(a=>a.key===state.feedbackKey).label)}</div><div class="story-options">${ch.decisions.map((d,i)=>`<button class="choice" data-action="makeDecision" data-idx="${i}"><span class="choice-idx">${String.fromCharCode(65+i)}</span><span>${esc(d.text)}</span></button>`).join('')}</div></article></section>`; };
makeDecision = function(idx){
  if(state.phase!=='chapter')return;
  const ch=state.currentChapter,d=ch.decisions[idx];if(!d)return;
  ch.decision={...d,consequence:d.result};
  applyEffect(d.effect);state.trust+=d.trust;state.evidence+=d.evidence;
  ch.steps.push({text:d.text,result:d.result,situation:beatText()});
  state.phase='consequence';
};
screens.consequence = ()=>`<section class="passage consequence"><span class="eyebrow">选择已经发生 / 第 ${state.currentChapter.beat+1} 幕</span><h2>${esc(state.currentChapter.steps.at(-1).text)}</h2><p>${esc(state.currentChapter.steps.at(-1).result)}</p><small>这次行动将写入本章，并被后续剧情记住。</small><button class="btn btn--primary" data-action="nextBeat">${state.currentChapter.beat+1<mode().beats?'看看接下来发生什么 →':'收起这一幕，回到书桌 →'}</button></section>`;
generateProse = function(ch){
  ch.prose=[ch.intro,...ch.steps.flatMap(s=>[s.situation,s.result])];
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
  state.feedbackKey=a.key;state.memory.push(state.currentChapter.steps.map(s=>s.result).join(' '));
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
  if(action==='pickLength'&&state.phase==='setup'){state.length=el.dataset.val;setSchedule();render();return;}
  if(action==='continueTransition'&&state.phase==='transition'){state.phase=state.transition.target;state.transition=null;render();return;}
  if(action==='plan'&&state.phase==='workbench'){state.chapterPlan=el.dataset.val;render();return;}
  if(action==='prepare'&&state.phase==='workbench'){
    const i=+el.dataset.idx,p=PREP[i];if(!p||state.prep>=2||state.resources.action+p.action<0)return;
    state.prep++;state.resources.action=clamp(state.resources.action+p.action,0,100);applyEffect(p.effect);if(i===0)state.evidence++;
    state.prepNote=`已完成「${p.label}」`;render();return;
  }
  if(action==='nextBeat'&&state.phase==='consequence'){
    const ch=state.currentChapter;ch.beat++;
    if(ch.beat<mode().beats)state.phase='chapter';else{generateProse(ch);bridge('manuscript','角色的经历，变成你桌上的手稿。','你重新成为作者。读完这一章，决定是否发布，再面对读者的反应。');}render();return;
  }
  if(action==='pickRoute'&&state.phase==='setup'){state.routeLean=el.dataset.val;state.routeAffinity={traffic:0,quality:0,controversy:0,commercial:0,self:0};state.routeAffinity[el.dataset.val]=8;render();return;}
  if(action==='enterChapter'&&state.phase==='workbench'&&state.resources.action<SPECIFICS.find(s=>s.key===state.currentChapter.specificity).cost&&state.prep>=2){state.resources.action=25;applyEffect({quality:-4,energy:-8});}
  originalAct(action,el);
};
const baseRender=render;
render = function(){
  baseRender();
  const el=$('#app');if(!state.question||['title','draw','setup'].includes(state.phase))return;
  const inner=['chapter','consequence'].includes(state.phase);
  el.innerHTML=`<header class="identity ${inner?'identity-story':''}"><b>${inner?'小说世界 · 你是主角':'作者世界 · 你是写手'}</b><span>${inner?esc(state.question.protagonist.role):esc(state.penName)} / D-${state.day}</span></header>`+el.innerHTML;
};
screens.manuscript = ()=>renderManuscript().replace('AI 续写 · 章节成稿','作者世界 · 审阅本章').replace('AI 依大纲、人物状态与已埋伏笔续写。','正文根据本章行动记录整理。');
const enterLocal=enterChapter;
enterChapter = async function(){
  if(state.phase!=='workbench')return;
  const cost=SPECIFICS.find(s=>s.key===state.currentChapter.specificity).cost;
  if(state.resources.action<cost){enterLocal();return;}
  if(typeof fetch==='undefined'||typeof location==='undefined'||location.protocol==='file:'){enterLocal();return;}
  const ch=state.currentChapter;state.phase='generating';state.generationError='';render();
  try{
    const r=await fetch('/api/chapter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({genre:state.genre,question:state.question,chapter:ch.num,chapters:mode().chapters,beats:mode().beats,tone:mode().tone,plan:state.chapterPlan,history:state.memory.slice(-4),editor:state.pendingDemand?.constraint,feedback:state.feedbackKey,trust:state.trust,evidence:state.evidence}),signal:AbortSignal.timeout(100000)});
    const data=await r.json();if(!r.ok)throw Error(data.error||'生成失败');ch.generated=data;
    state.phase='workbench';enterLocal();render();
  }catch(e){state.generationError=e.name==='TimeoutError'?'本章生成超时。':e.message;state.phase='generationError';render();}
};
screens.generating=()=>`<section class="passage">${mascot('电脑_6秒_320x320_20fps_透明.gif')}<span class="eyebrow">刘看山正在整理这一章</span><h2>让前面的选择，成为接下来的故事。</h2><p>正在参考知乎故事，并结合人物关系、作者意图和上一章的后果构思剧情。</p><small>通常需要几十秒；完成后会进入视角过场。</small></section>`;
screens.generationError=()=>`<section class="passage"><h2>这一页暂时没写出来。</h2><p>${esc(state.generationError)}</p><button class="btn btn--primary" data-action="retryGeneration">重新构思</button><button class="btn btn--ghost" data-action="localChapter">使用内置剧情继续本章</button></section>`;
const beforeRemoteAct=act;
act=function(action,el){
  if(state.phase==='generationError'&&action==='retryGeneration'){state.phase='workbench';enterChapter();return;}
  if(state.phase==='generationError'&&action==='localChapter'){state.phase='workbench';enterLocal();render();return;}
  beforeRemoteAct(action,el);
};
const manuscriptWithSource=screens.manuscript;
screens.manuscript=()=>manuscriptWithSource()+`<div class="screen source-note">${state.currentChapter.generated?`本章由知乎直答结合行动记录生成。节奏参考：${state.currentChapter.generated.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`).join('、')}。参考作品归原作者所有，本章为原创游戏剧情。`:'本章使用内置剧情。'}</div>`;
boot();
