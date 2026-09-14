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
// 每个题材的“天马行空”走向：选择会把剧情推向其中一条，不再按固定模板推进。
const TWISTS={
  '悬疑反转':['真正的证据不在现场，而在那件你天天经过却从没怀疑过的旧物里。','监控里消失的那个人，当晚其实一直就站在你身后。','你反复核对的号码拨通后，接电话的，是十年前还没开始写这个故事的自己。','所有人都在说谎，因为真凶从来就不是一个人，而是每个人都各说了一半真话。','你终于拼出了真相，才发现最后缺的那一块，是你自己不肯承认的记忆。'],
  '都市情感':['那张凭据的收款人，竟是这段关系里你唯一没怀疑过的人。','你翻出五年前的聊天记录，才发现两个人都曾为对方删掉过同一句话。','一场无关的争吵突然停住，因为你们同时说出了一个早就被埋葬的名字。','对方在你转身要走时，第一次喊了你的全名。','你突然意识到，这段关系真正的第三方，是你们各自以为的“为你好”。'],
  '女性成长':['那张被代签的确认书背面，有一行只有你能看懂的、写给未来自己的话。','你以为是在争取一个机会，其实是在替三年前那个不敢开口的自己讨一个说法。','曾经劝你“稳定就好”的人，如今成了第一个向你打听怎么重新开始的人。','你撕掉那份“为你好”的清单，才发现清单背面写着你真正的名字。','这一次，你没有等任何人点头，就把自己的名字签了上去。'],
  '民俗怪谈':['值夜簿上多出的那个名字，笔迹和你的一模一样。','那扇被钉死的门，在你转身之后，自己开了一条缝。','你数了数村里的人，比昨天多了一个，谁都说“一直就是这么多”。','那口井照出的不是倒影，而是你还没做过的那个选择。','守夜到第四更，你听见屋里有人用你的声音，念出了下一句咒。'],
  '职场冲突':['那份被替换的底稿，真正的作者签名藏在版本历史的最底层。','你在茶水间听到的“自保”，其实是有人想借你的手，掀掉整张牌桌。','最不可能站你这边的人，忽然在你面前放下一份没人见过的原始文件。','你查到最后，发现这场甩锅早就在高层备了案，而你只是剧本里的一步。','离职申请递上去那天，猎头发来的职位，恰好是你最恨的人空出来的位子。'],
  '历史脑洞':['你改的那一步，让史书上从未出现的一个人，突然有了名字。','那枚印记，用的是二十年后才会铸造的官文格式。','送信人离开后，你发现自己的影子，多了一顶不属于这个朝代的帽子。','你终于明白，不是你在改写历史，而是历史一直在等你这颗棋子落位。','城门将闭，你看见对岸的旗帜，是你记忆里下一个朝代的颜色。'],
};
const NEXT_LEADS={
  '核实事实':'你顺藤摸瓜','建立信任':'对方终于松口','正面对质':'撕破脸之后','另寻知情人':'另一条线浮出水面','按兵不动':'沉默逼出的真相','追问证人':'证人扛不住','交换条件':'交易达成之后','求助同盟':'多了一个人入局',
};
// 合并扩充走向库（library.js 提供的 EXTRA_TWISTS，约 200 条）
if(typeof EXTRA_TWISTS!=='undefined'){for(const g in EXTRA_TWISTS){if(TWISTS[g])TWISTS[g]=TWISTS[g].concat(EXTRA_TWISTS[g]);}}
const originalBoot = boot, originalAct = act, originalWorkbench = openWorkbench;
const originalPublish = publish, originalAuthor = authorDecide, originalFinal = finalChoice;
const originalRenderWB = renderWorkbench, originalRenderSetup = renderSetup, originalFeedback = renderFeedback, originalEnding = renderEnding;
let resumableState = null;
let realmTransitionToken = 0;
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
  Object.assign(state,{length:'medium',memory:[],storyBible:[],trust:0,evidence:0,prep:0,feedbackKey:'stick',transition:null,chapterPlan:'追寻事实',generationMode:'zhihu',generationJob:'',zhihuUsage:{limit:5000,used:0,remaining:5000,date:''},prologueStep:0,setupStep:0,workbenchStep:0,overlay:'',lowActionConfirmed:false,prepAdvised:false,prepAdvisedEver:false,hintTitle:'',hintText:'',uiNotice:'',usedKinds:[]});
  setSchedule();
  resumableState=hydrateSavedGame(SaveSystem.loadGame());
  render();refreshUsage();
};

function hydrateSavedGame(saved){
  if(!saved)return null;
  try{
    const question=saved.questionId===null?null:CONTENT.questions.questions.find(item=>item.id===saved.questionId);
    const pendingDemand=saved.pendingDemandId===null?null:CONTENT.editor.demands.find(item=>item.id===saved.pendingDemandId);
    const pendingEvent=saved.pendingEventId===null?null:CONTENT.events.events.find(item=>item.id===saved.pendingEventId);
    const ending=saved.endingId===null?null:CONTENT.endings.endings.find(item=>item.id===saved.endingId);
    if((saved.questionId!==null&&!question)||(saved.pendingDemandId!==null&&!pendingDemand)||(saved.pendingEventId!==null&&!pendingEvent)||(saved.endingId!==null&&!ending))return null;
    const restored={...saved,question,pendingDemand,pendingEvent,ending,crisisChoices:CONTENT.story.crisis.finalChoices.slice(),overlay:'',uiNotice:''};
    delete restored.questionId;delete restored.pendingDemandId;delete restored.pendingEventId;delete restored.endingId;
    if(restored.currentChapter&&restored.chapters.length&&restored.chapters.at(-1).num===restored.currentChapter.num)restored.currentChapter=restored.chapters.at(-1);
    return restored;
  }catch{return null;}
}

function beginFreshGame(){
  SaveSystem.clearSave();resumableState=null;boot();state.phase='prologue';state.prologueStep=0;render();
}

function continueSavedGame(){
  if(!resumableState)return;
  state=resumableState;resumableState=null;setSchedule();render();refreshUsage();
  if(state.phase==='generating'){
    if(state.generationJob)return waitForGeneration(state.currentChapter,state.generationJob);
    state.phase='generationError';state.generationError='生成任务尚未建立，请重新构思或切换本地模式。';render();
  }
}
function mascot(kind='待机_5秒_320x320_20fps_透明.gif'){
  return `<img class="kanshan" src="assets/liu-kanshan/animations/${kind}" alt="刘看山写作助手" width="160" height="160">`;
}
const ROUTE_ICONS={traffic:'trend',quality:'feather',controversy:'alert',commercial:'contract',self:'compass'};
const PLAN_META={
  '追寻事实':{icon:'search',eyebrow:'调查',desc:'查清矛盾，增加可验证的线索',effect:'线索优先'},
  '修复关系':{icon:'users',eyebrow:'关系',desc:'让人物重新开口，改变彼此立场',effect:'关系优先'},
  '正面冲突':{icon:'alert',eyebrow:'冲突',desc:'立刻打破平衡，逼出真实动机',effect:'节奏优先'},
};
const AUTHOR_UI={
  ignore:{icon:'eye',tone:'calm',type:'观察',outcome:'保留创作主动权'},
  reply:{icon:'message',tone:'social',type:'互动',outcome:'用精力换取讨论'},
  argue:{icon:'alert',tone:'risk',type:'对抗',outcome:'高热度，也更失控'},
  revise:{icon:'edit',tone:'craft',type:'修订',outcome:'调整走向并靠近签约'},
  cater:{icon:'trend',tone:'risk',type:'迎合',outcome:'流量上涨，风格受损'},
  stick:{icon:'shield',tone:'craft',type:'坚持',outcome:'牺牲热度，稳住作品'},
};
function effectChips(effect,compact=false){
  return Object.entries(effect||{}).filter(([,value])=>value).map(([key,value])=>{
    const label=RES_DEFS.find(item=>item.key===key)?.label||key;
    return `<span class="effect-chip ${value>0?'is-up':'is-down'} ${compact?'is-compact':''}">${value>0?'+':''}${value} ${label}</span>`;
  }).join('')||'<span class="effect-chip is-neutral">状态不变</span>';
}
function bridge(target,title,body){ state.transition={target,title,body}; state.phase='transition'; }
screens.transition = ()=>{
  if(state.transition.target==='chapter')return `<section class="realm-transition" aria-label="从作者层进入主角层"><div class="realm-ink" aria-hidden="true"><i></i><i></i><i></i></div><div class="realm-copy"><span>AUTHOR / CHARACTER</span><h1>你写下的人，<br>开始呼吸。</h1><p>下一次睁眼，你在故事里。</p></div><button class="realm-skip" data-action="continueTransition" aria-label="跳过转场"><span>ENTER</span> 跳过</button></section>`;
  return `<section class="passage passage--bridge"><div class="transition-glyph">${uiIcon('feather')}</div>${mascot()}<span class="eyebrow">回到书桌</span><h1>${esc(state.transition.title)}</h1><p>${esc(state.transition.body)}</p><button class="btn btn--primary" data-action="continueTransition"><span>继续</span>${uiIcon('arrowRight')}</button></section>`;
};
screens.title = ()=>`<section class="new-title"><div class="title-copy"><span class="eyebrow">知乎盐选互动叙事 / 90 DAYS</span><h1>盐选人生<span>写下故事，<br>也被故事改变。</span></h1>${resumableState?`<div class="resume-card"><span class="resume-icon">${uiIcon('book')}</span><div><b>第 ${Math.min(resumableState.chapterIndex+1,LENGTHS[resumableState.length].chapters)} 章 · D-${resumableState.day}</b><span>上次写到这里，存档已留在当前浏览器。</span></div></div><div class="title-actions"><button class="btn btn--primary btn--big" data-action="continueGame"><span>继续游戏</span>${uiIcon('arrowRight')}</button><button class="btn btn--quiet" data-action="newGame">新游戏 · 清除存档</button></div>`:`<button class="btn btn--primary btn--big" data-action="startPrologue"><span>开始游戏</span>${uiIcon('arrowRight')}</button>`}</div><div class="title-art"><div class="art-orbit art-orbit--one"></div><div class="art-orbit art-orbit--two"></div><div class="art-book"><small>盐选连载 · 草稿</small><span>未完成的<br>第九十天</span><i></i></div>${mascot('电脑_6秒_320x320_20fps_透明.gif')}<span class="art-note">距交稿 <b>90</b> 天</span></div></section>`;
const PROLOGUE=[
  {tag:'知乎盐选写手 · 匿名用户',title:'谢邀。人在第九十天，稿子还没活过来。',body:'起初，你以为这只是一次普通更新。直到评论区里，有人叫出了一个尚未写下的名字。',visual:'question'},
  {tag:'高赞回答 · 修改于昨夜',title:'后来我才知道，故事并不是写给人看的。',body:'至少，不全是。每次按下发布，纸页背面都会多出一扇门。',visual:'manuscript'},
  {tag:'该问题已被折叠',title:'门后的人，和你用着同一双手。',body:'你替他做选择。他替你承担后果。至于谁才是作者——写到最后再说。',visual:'portal'},
];
screens.prologue=()=>{const item=PROLOGUE[state.prologueStep],last=state.prologueStep===PROLOGUE.length-1;return `<section class="prologue prologue--${item.visual}"><div class="prologue-no">0${state.prologueStep+1}</div><div class="prologue-copy"><span>${item.tag}</span><h1>${item.title}</h1><p>${item.body}</p>${last?`<div class="start-modes"><button class="mode-launch" data-action="chooseStartMode" data-val="zhihu" ${(state.zhihuUsage?.remaining??5000)<=0?'disabled':''}><span class="mode-launch-icon">${uiIcon('cloud')}</span><span><b>知乎模式</b><small>连接直答生成剧情</small></span><em>${Math.max(0,state.zhihuUsage?.remaining??5000)} 次</em></button><button class="mode-launch" data-action="chooseStartMode" data-val="local"><span class="mode-launch-icon">${uiIcon('infinity')}</span><span><b>本地模式</b><small>使用内置剧情</small></span><em>不限次</em></button></div>`:`<button class="prologue-next" data-action="nextPrologue"><span>继续</span>${uiIcon('arrowRight')}</button>`}</div><div class="prologue-art"><div class="prologue-paper"></div>${mascot(item.visual==='portal'?'晃悠_320x320_3秒_20fps_透明.gif':'电脑_6秒_320x320_20fps_透明.gif')}</div><div class="prologue-dots">${PROLOGUE.map((_,i)=>`<i class="${i===state.prologueStep?'on':''}"></i>`).join('')}</div></section>`;};
function setupShell(step,title,body){return `<section class="screen setup-wizard"><div class="wizard-top"><span>开局设置 ${step}/3</span><div>${[1,2,3].map(i=>`<i class="${i<=step?'on':''}"></i>`).join('')}</div></div><h1 class="wizard-title">${title}</h1>${body}</section>`;}
screens.setup = ()=>{
  if(state.setupStep===0)return setupShell(1,'这次写多长？',`<div class="wizard-grid length-wizard">${Object.entries(LENGTHS).map(([key,m],i)=>`<button class="wizard-card length-option" data-action="pickLength" data-val="${key}"><span class="wizard-card-icon">${uiIcon('book')}</span><small>0${i+1}</small><b>${m.name}</b><span>${m.chapters} 章 · ${m.chapters*m.beats} 次选择</span><i>${uiIcon('arrowRight')}</i></button>`).join('')}</div>`);
  if(state.setupStep===1)return setupShell(2,'故事写什么？',`<div class="setup-question">${esc(state.question.title)}</div><div class="wizard-block"><b>类型</b><div class="chip-row">${GENRES.map(g=>`<button class="chip ${g===state.genre?'chip--on':''}" data-action="pickGenre" data-val="${esc(g)}">${esc(g)}</button>`).join('')}</div></div><div class="wizard-block"><b>主题</b><div class="chip-row">${THEMES.map(t=>`<button class="chip ${t===state.theme?'chip--on':''}" data-action="pickTheme" data-val="${esc(t)}">${esc(t)}</button>`).join('')}</div></div><div class="wizard-actions"><button class="btn btn--ghost" data-action="setupBack">上一步</button><button class="btn btn--primary" data-action="nextSetup">下一步</button></div>`);
  return setupShell(3,'你准备怎么写？',`<div class="wizard-grid route-wizard">${ROUTES.map(r=>`<button class="wizard-card route-option ${r.key===state.routeLean?'selected':''}" data-action="pickRoute" data-val="${r.key}"><span class="wizard-card-icon">${uiIcon(ROUTE_ICONS[r.key])}</span><b>${esc(r.name)}</b><span>${esc(r.desc)}</span><i>${r.key===state.routeLean?uiIcon('check'):''}</i></button>`).join('')}</div><label class="pen-label"><span>笔名</span><input class="pen-input" id="penName" maxlength="12" value="${esc(state.penName)}"></label><div class="wizard-actions"><button class="btn btn--ghost" data-action="setupBack">${uiIcon('arrowLeft')}<span>上一步</span></button><button class="btn btn--primary" data-action="startGame"><span>进入第 90 天</span>${uiIcon('arrowRight')}</button></div>`);
};
screens.map = ()=>`<section class="screen map-screen"><div class="map-heading"><div><span class="eyebrow">连载计划 / ${mode().name}</span><h1>还剩 <b>${state.day}</b> 天。<br>下一章等你落笔。</h1></div>${mascot()}</div><div class="chapter-track" aria-label="章节进度">${CHAPTERS.map((c,i)=>`<div class="track-node ${i===state.chapterIndex?'current':''} ${i<state.chapterIndex?'complete':''}"><i>${i<state.chapterIndex?uiIcon('check'):i+1}</i><small>D-${c.day}</small><b>第 ${i+1} 章</b><span>${i<state.chapterIndex?'已归档':i===state.chapterIndex?c.stage:'未开启'}</span></div>`).join('')}</div><div class="map-focus"><div class="map-focus-icon">${uiIcon('feather')}</div><div><span>上一章留下的线索</span><p>${esc(state.memory.at(-1)||state.question.premise)}</p></div><dl><div><dt>${uiIcon('bolt')} 行动力</dt><dd>${state.resources.action}</dd></div><div><dt>${uiIcon('heart')} 精力</dt><dd>${state.resources.energy}</dd></div><div><dt>${uiIcon(ROUTE_ICONS[dominantRouteKey()])} 路线</dt><dd>${ROUTE_MAP[dominantRouteKey()].name}</dd></div></dl></div><div class="map-action"><button class="btn btn--primary btn--big" data-action="toWorkbench"><span>打开第 ${state.chapterIndex+1} 章工作台</span>${uiIcon('arrowRight')}</button></div></section>`;
const LOW_ACTION_WARN = 30;
const LOW_ENERGY_WARN = 10;
const PREP = [
  {label:'整理伏笔',detail:'行动力 −8 / 质量 +3 / 线索 +1',effect:{quality:3},action:-8},
  {label:'和读者聊聊',detail:'行动力 −8 / 热度 +3 / 精力 −2',effect:{heat:3,energy:-2},action:-8},
  {label:'休息一晚',detail:'行动力 +12 / 精力 +8 / 热度 −1',effect:{energy:8,heat:-1},action:12},
];
function prepBlocked(p){
  if(state.prep>=2)return true;
  if(state.resources.action+(p.action||0)<0)return true;
  if(state.resources.energy+(p.effect?.energy||0)<0)return true;
  return false;
}
function prepBlockReason(p){
  if(state.prep>=2)return {title:'准备次数已用完',text:'这一章的准备次数已经用完（2/2），先进入故事吧。'};
  if(state.resources.action+(p.action||0)<0)return {title:'行动力不足',text:`「${p.label}」需要 ${-p.action} 行动力，当前只剩 ${state.resources.action} 点（还差 ${-(state.resources.action+(p.action||0))} 点）。`};
  if(state.resources.energy+(p.effect?.energy||0)<0)return {title:'精力不足',text:`「${p.label}」需要 ${-(p.effect.energy)} 精力，当前只剩 ${state.resources.energy} 点（还差 ${-(state.resources.energy+(p.effect?.energy||0))} 点）。`};
  return {title:'暂时做不了',text:'这个准备动作现在无法执行。'};
}
function usageLabel(){
  const u=state.zhihuUsage||{limit:5000,used:0,remaining:5000};
  return `今日剩余 ${Math.max(0,u.remaining)} / ${u.limit} 次`;
}
function workbenchShell(step,title,body){return `<section class="screen chapter-wizard"><div class="wizard-top"><span>第 ${state.currentChapter.num} 章 · ${step}/3</span><div>${[1,2,3].map(i=>`<i class="${i<=step?'on':''}"></i>`).join('')}</div></div><h1 class="wizard-title">${title}</h1>${body}</section>`;}
screens.workbench = ()=>{
  const ch=state.currentChapter;
  if(state.workbenchStep===0)return workbenchShell(1,'这一章，先解决什么？',`<div class="continuity-card"><span>${uiIcon('book')} 前情</span><p>${esc(state.memory.at(-1)||state.question.premise)}</p></div><div class="intent-list">${Object.entries(PLAN_META).map(([plan,meta],i)=>`<button class="intent-option" data-action="plan" data-val="${plan}"><span class="intent-index">0${i+1}</span><span class="intent-icon">${uiIcon(meta.icon)}</span><span class="intent-copy"><small>${meta.eyebrow}</small><b>${plan}</b><em>${meta.desc}</em></span><span class="intent-effect">${meta.effect}</span>${uiIcon('arrowRight')}</button>`).join('')}</div>`);
  if(state.workbenchStep===1)return workbenchShell(2,'落笔前，怎样调整状态？',`<div class="prep-head"><div class="prep-slots"><span>本章可准备</span><i class="${state.prep>0?'filled':''}"></i><i class="${state.prep>1?'filled':''}"></i><b>${Math.max(0,2-state.prep)} 次</b></div><span>当前行动力 <b>${state.resources.action}</b></span></div><div class="prep-list">${PREP.map((p,i)=>{const icons=['search','message','heart'];const desc=['整理前文的伏笔与证据','观察读者正在争论什么','暂时离开书桌恢复状态'];return `<button class="prep-option" data-action="prepare" data-idx="${i}"><span class="prep-icon">${uiIcon(icons[i])}</span><span class="prep-copy"><b>${p.label}</b><small>${desc[i]}</small></span><span class="prep-effects">${effectChips({...p.effect,action:p.action},true)}</span>${uiIcon('arrowRight')}</button>`;}).join('')}</div>${state.prepNote?`<div class="action-result">${uiIcon('check')}<span>${esc(state.prepNote)}</span></div>`:''}<div class="wizard-actions"><button class="btn btn--ghost" data-action="workbenchBack">${uiIcon('arrowLeft')}<span>上一步</span></button><button class="btn btn--primary" data-action="nextWorkbench"><span>${state.prep?'下一步':'跳过准备'}</span>${uiIcon('arrowRight')}</button></div>`);
  return workbenchShell(3,'你替主角决定到哪一步？',`<div class="freedom-scale"><div class="freedom-axis"><span>作者控制更多</span><i></i><span>主角空间更大</span></div><div class="script-grid">${SPECIFICS.map((s,i)=>`<button class="script-option ${ch.specificity===s.key?'selected':''}" data-action="pickSpec" data-val="${s.key}"><span class="script-level">0${i+1}</span><b>${s.label}</b><small>${s.hint}</small><span class="script-meta"><em>${s.choices} 个选项</em><em>-${s.cost} 行动力</em></span><i>${ch.specificity===s.key?uiIcon('check'):''}</i></button>`).join('')}</div></div><div class="chapter-ready"><span><small>本章方向</small><b>${esc(state.chapterPlan)}</b></span><span><small>生成方式</small><b>${state.generationMode==='local'?`${uiIcon('infinity')} 本地模式`:`${uiIcon('cloud')} ${usageLabel()}`}</b></span></div>${state.uiNotice?`<div class="ui-notice">${esc(state.uiNotice)}</div>`:''}<div class="wizard-actions wizard-actions--enter"><button class="btn btn--ghost" data-action="workbenchBack">${uiIcon('arrowLeft')}<span>上一步</span></button><button class="btn btn--primary btn--big" data-action="enterChapter"><span>进入故事</span>${uiIcon('arrowRight')}</button></div>`);
};
openWorkbench = function(){ originalWorkbench(); if(state.phase==='workbench'){
  state.prep=0;state.prepAdvised=false;state.prepNote='';state.uiNotice='';state.workbenchStep=0;state.currentChapter.steps=[];state.currentChapter.beat=0;
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
  const ch=state.currentChapter;
  if(ch.generated){return (ch.beat?ch.steps.at(-1).result+'\n\n':'')+ch.generated.beats[ch.beat].situation;}
  if(ch.beat===0)return ch.intro;
  const last=ch.steps.at(-1);
  return `${last.next||last.result}${state.trust>0?'对方愿意留下来把事情说完。':'对方始终留意着门口，谈话随时可能中止。'}`;
}
function options(){
  const ch=state.currentChapter,b=ch.beat;
  const configured=SPECIFICS.find(s=>s.key===ch.specificity).choices;
  const count=state.resources.energy<25?Math.max(3,configured-1):configured;
  const generated=ch.generated?.beats?.[b]?.options;
  if(generated&&generated.length)return generated.slice(0,count);

  const a=STORY_ARCS[state.genre],ctx=baseCtx(ch.scene);
  const prev=ch.steps.at(-1)||null;
  const used=new Set(state.usedKinds||[]);
  const tr=state.trust,ev=state.evidence;
  const twists=TWISTS[state.genre]||TWISTS['悬疑反转'];
  const off=rand(twists.length);
  // 当前情境的“钩子”：第一幕围绕物件，之后围绕上一选择引出的走向。
  const hook=b===0?a.object:((prev&&prev.next)?prev.next.replace(/^[^：]*：/,'').replace(/[。！？]+$/,''):a.object);

  const ACTIONS=[
    {kind:'核实事实',type:'investigate',lead:'你顺藤摸瓜',hint:'增加线索 · 可能损伤信任',text:b===0?`核对${a.object}，补全来龙去脉`:`顺着「${trunc(hook,14)}」这条线，再核${a.object}`,effect:{quality:1,heat:0},evidence:1,trust:-1,result:`你把疑点逐一比对。${ctx.npc}脱口而出的一个细节和之前对不上，成了新的破口。`},
    {kind:'建立信任',type:'bond',lead:'对方终于松口',hint:'改善关系 · 保留合作',text:`让${ctx.npc}把话说完，${tr>0?'兑现上次的约定':'再给一次坦白的机会'}`,effect:{style:1,energy:1},trust:1,evidence:0,result:`你没有打断。${ctx.npc}讲完最难开口的部分，答应带${ctx.npc2}一同来。`},
    {kind:'正面对质',type:'confront',lead:'撕破脸之后',hint:ev>1?'证据充分 · 推进主线':'证据不足 · 风险较高',text:ev>1?'把已核实的记录当面摊开':'直接点破，赌对方会露出破绽',effect:{heat:2,energy:-1,quality:ev>1?1:-1},trust:-1,evidence:0,result:ev>1?'对方没能解释矛盾，只好答应下次补上证词。':'对方抓住证据里的空白反将一军，冲突随之升级。'},
    {kind:'另寻知情人',type:'investigate',lead:'另一条线浮出水面',hint:'线索 +1 · 消耗精力',text:`绕开${ctx.npc}，找${ctx.npc2}要另一份说法`,effect:{quality:1,energy:-1},trust:0,evidence:1,result:`${ctx.npc2}给出完全不同的版本。两条记录互相矛盾，至少有一方在说谎。`},
    {kind:'按兵不动',type:'calm',lead:'沉默逼出的真相',hint:'保留主动权 · 热度 −1',text:`先不表态，看${ctx.npc}如何应对「${trunc(hook,12)}」`,effect:{style:1,heat:-1,energy:1},trust:0,evidence:0,result:`沉默让${ctx.npc}先沉不住气，主动说漏了一个前后不一致的细节。`},
    {kind:'追问证人',type:'investigate',lead:'证人扛不住',hint:'线索 +1 · 关系承压',text:b===0?`追问${ctx.npc}当晚的去向`:`接着「${trunc(hook,12)}」继续追问${ctx.npc}`,effect:{heat:1,quality:1},trust:-1,evidence:1,result:`${ctx.npc}避而不答，却在离开前报出一个只有当事人知道的名字。`},
    {kind:'交换条件',type:'trade',lead:'交易达成之后',hint:'关系 +1 · 消耗精力',text:`用你掌握的消息，换${ctx.npc}手里的${a.object}线索`,effect:{quality:1,energy:-1},trust:1,evidence:1,result:`各退一步。${ctx.npc}把「${trunc(hook,10)}」的来由说了一半，留了最关键的一半。`},
    {kind:'求助同盟',type:'bond',lead:'多了一个人入局',hint:'关系 +1 · 热度 +1',text:`把${ctx.npc2}拉到同一边，一起压住${ctx.npc}`,effect:{heat:1,style:1},trust:1,evidence:0,result:`${ctx.npc2}点了头。多一个盟友，${ctx.npc}的态度明显软了下来。`},
  ];

  // 扩展选项（library.js 约 260 个）：填充占位符后与内置动作合并
  const EXTRA=(typeof EXTRA_OPTIONS!=='undefined')?EXTRA_OPTIONS:[];
  const ov={npc:ctx.npc,npc2:ctx.npc2,object:a.object};
  const ALL=ACTIONS.concat(EXTRA.map(o=>({...o,text:fill(o.text,ov),result:fill(o.result,ov),lead:fill(o.lead,ov)})));
  const build=ALL.map((d,i)=>({...d,next:`${d.lead||'你继续推进'}：${twists[(i+off)%twists.length]}`}));

  // 排序：作者方向优先 + 全局未用过的靠前 + 与上一步相同的降到最低；迎合/回复/争论时抬升对抗类。
  const PREF=state.chapterPlan==='修复关系'?'bond':state.chapterPlan==='正面冲突'?'confront':'investigate';
  const confrontational=['cater','reply','argue'].includes(state.feedbackKey);
  const scored=build.map((d,i)=>{
    let score=(d.type===PREF?1000:0)+(used.has(d.kind)?0:250)+(prev&&prev.kind===d.kind?-2000:0);
    if(confrontational&&d.type==='confront')score+=300;
    return {d,score:score-i*0.1};
  });
  scored.sort((x,y)=>y.score-x.score);
  return scored.slice(0,count).map(x=>x.d);
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
function narrativeVisualState(inner=false){
  const total=Math.max(1,mode().chapters),beatTotal=Math.max(1,mode().beats);
  const chapter=Math.min(total-1,Math.max(0,state.chapterIndex||0));
  const beat=state.currentChapter?.beat||0;
  const progress=Math.min(1,(chapter+Math.min(1,beat/beatTotal))/total);
  let tension=Math.min(4,Math.floor(progress*5));
  if(state.phase==='crisis')tension=4;
  if(state.currentChapter?.stage==='危机期'||state.currentChapter?.stage==='收束期')tension=Math.max(tension,3);
  if(state.currentChapter?.event||state.pendingEvent)tension=Math.min(4,tension+1);
  const mood=moodKey(state.currentChapter?.scene?.mood||'凝重');
  const condition=state.resources?.energy<28?'exhausted':state.trust<-2?'fractured':state.evidence>=Math.max(3,chapter+1)?'clue':'steady';
  return {tension,mood,condition,realm:inner?'story':'author'};
}
screens.chapter = ()=>{
  const ch=state.currentChapter,previous=state.storyBible.at(-1);ch.choiceLocked=false;ch.decisions=options();
  const carry=previous?`<div class="story-continuity"><b>前情承接 · 第 ${previous.chapter} 章</b><span>${esc(trunc(previous.lastResult,120))}</span><small>未解决：${esc(trunc(previous.cliff,72))}</small></div>`:'';
  const visual=narrativeVisualState(true);
  return `<section class="story-stage" data-tension="${visual.tension}" data-mood="${visual.mood}" data-condition="${visual.condition}"><div class="story-atmosphere" aria-hidden="true"><i class="story-light"></i><i class="story-shadow story-shadow--one"></i><i class="story-shadow story-shadow--two"></i><i class="story-horizon"></i><i class="story-weather"></i><i class="story-grain"></i></div><div class="story-sky"></div><div class="story-meta"><span>小说世界 / ${esc(ch.scene.name)}</span><span>第 ${ch.num} 章 · ${ch.beat+1}/${mode().beats} 幕</span></div><div class="beat-progress" aria-label="章节进度">${Array.from({length:mode().beats},(_,i)=>`<span class="${i<ch.beat?'done':i===ch.beat?'current':''}"><i></i>${BEAT_NAMES[i]||`第${i+1}幕`}</span>`).join('')}</div><article class="story-panel"><span class="eyebrow">${BEAT_NAMES[ch.beat]||`第 ${ch.beat+1} 幕`} · ${mode().tone}</span><h1>${esc(STORY_ARCS[state.genre].question)}？</h1>${carry}<p class="story-text">${esc(beatText())}</p><div class="story-facts"><span>关系 <b>${state.trust>0?'逐步信任':state.trust<0?'有所戒备':'尚未明朗'}</b></span><span>已核实线索 <b>${state.evidence}</b></span><span>作者意图 <b>${esc(ch.plan)}</b></span><span>${previous?'上章回应':'本章任务'} <b>${esc(previous?previous.authorResponse:'建立人物与核心冲突')}</b></span></div><div class="decision-brief"><b>你怎么做？</b></div>${state.uiNotice?`<div class="ui-notice" role="alert">${esc(state.uiNotice)}</div>`:''}<div class="story-options">${ch.decisions.map((d,i)=>`<button type="button" class="choice choice--${i}" data-action="makeDecision" data-idx="${i}" aria-label="${String.fromCharCode(65+i)}：${esc(d.text)}"><span class="choice-idx">${String.fromCharCode(65+i)}</span><span class="choice-copy"><b>${esc(d.kind||'采取行动')}</b><span>${esc(d.text)}</span><small>${esc(d.hint||effectText(d))}</small></span><span class="choice-impact">${esc(effectText(d))}</span></button>`).join('')}</div></article></section>`;
};
makeDecision = function(idx){
  if(state.phase!=='chapter')return;
  const ch=state.currentChapter,d=ch.decisions[idx];
  if(ch.choiceLocked)return;
  if(!d){state.uiNotice='这个选项已失效，页面已为你刷新。';render();return;}
  ch.choiceLocked=true;state.uiNotice='';
  ch.decision={...d,consequence:d.result};
  applyEffect(d.effect);state.trust+=d.trust;state.evidence+=d.evidence;
  if(d.kind){state.usedKinds=state.usedKinds||[];if(!state.usedKinds.includes(d.kind))state.usedKinds.push(d.kind);}
  ch.steps.push({kind:d.kind||'行动',text:d.text,result:d.result,next:d.next,impact:effectText(d)});
  state.phase='consequence';
};
screens.consequence = ()=>{
  const step=state.currentChapter.steps.at(-1),last=state.currentChapter.beat+1>=mode().beats,visual=narrativeVisualState(true);
  return `<section class="story-stage consequence-stage" data-tension="${visual.tension}" data-mood="${visual.mood}" data-condition="${visual.condition}"><div class="story-atmosphere" aria-hidden="true"><i class="story-light"></i><i class="story-shadow story-shadow--one"></i><i class="story-shadow story-shadow--two"></i><i class="story-horizon"></i><i class="story-weather"></i><i class="story-grain"></i></div><div class="story-sky"></div><div class="suspense-motes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="passage consequence"><div class="consequence-mark">${uiIcon('check')}</div><span class="eyebrow">${esc(step.kind)} / 第 ${state.currentChapter.beat+1} 幕</span><h2>${esc(step.text)}</h2><p>${esc(step.result)}</p><div class="memory-slip"><b>${esc(step.impact)}</b></div><button class="btn btn--primary btn--big" data-action="nextBeat"><span>${last?'回到书桌':'继续'}</span>${uiIcon('arrowRight')}</button></div></section>`;
};
generateProse = function(ch){
  const body=ch.steps.map((s,i)=>{const nxt=(s.next&&i<ch.steps.length-1)?`　${s.next}`:'';return `你${s.text}。${s.result}${nxt}`;});
  ch.prose=[ch.intro,...body];
  ch.cliffHook=state.question.mystery||STORY_ARCS[state.genre].question;
  ch.prose.push(`这一章停在「${ch.cliffHook.replace(/[。！？]+$/,'')}」。${state.trust>0?'有人愿意同你一起寻找答案。':'下一次开口，可能需要付出更大的代价。'}`);
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
  const energyCost=-(a.eff?.energy||0);
  if(energyCost>0&&state.resources.energy<energyCost){
    state.hintTitle='精力不足';state.hintText=`「${a.label}」需要 ${energyCost} 精力，当前只剩 ${state.resources.energy} 点（还差 ${energyCost-state.resources.energy} 点）。`;
    state.overlay='hint';render();return;
  }
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
  if(action==='confirmLowAction'&&state.overlay==='lowAction'){state.lowActionConfirmed=true;state.overlay='';enterChapter();return;}
  if(action==='toSetup'&&state.phase==='draw'){state.setupStep=0;state.phase='setup';render();return;}
  if(action==='pickLength'&&state.phase==='setup'&&state.setupStep===0){state.length=el.dataset.val;setSchedule();state.setupStep=1;render();return;}
  if(action==='nextSetup'&&state.phase==='setup'){state.setupStep=Math.min(2,state.setupStep+1);render();return;}
  if(action==='setupBack'&&state.phase==='setup'){state.setupStep=Math.max(0,state.setupStep-1);render();return;}
  if(action==='continueTransition'&&state.phase==='transition'){state.phase=state.transition.target;state.transition=null;render();return;}
  if(action==='plan'&&state.phase==='workbench'&&state.workbenchStep===0){
    state.chapterPlan=el.dataset.val;state.workbenchStep=1;
    // 每章最多弹一次：首次进入必弹（教学），之后仅在行动力/精力偏低时提醒
    if(!state.prepAdvised && (!state.prepAdvisedEver || state.resources.action<LOW_ACTION_WARN || state.resources.energy<LOW_ENERGY_WARN)){
      state.prepAdvised=true;state.prepAdvisedEver=true;state.overlay='prepAdvice';
    }
    render();return;
  }
  if(action==='prepare'&&state.phase==='workbench'&&state.workbenchStep===1){
    const i=+el.dataset.idx,p=PREP[i];if(!p)return;
    if(prepBlocked(p)){ const r=prepBlockReason(p); state.hintTitle=r.title; state.hintText=r.text; state.overlay='hint'; render(); return; }
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
  return originalAct(action,el);
};
function mapOverlay(){
  const completed=state.chapters.length,current=state.currentChapter&&!state.chapters.includes(state.currentChapter)?state.currentChapter.steps?.length||0:0;
  const done=Math.min(mode().chapters*mode().beats,completed*mode().beats+current),percent=Math.round(done/(mode().chapters*mode().beats)*100);
  return `<div class="game-overlay" role="dialog" aria-modal="true" aria-label="故事地图"><div class="overlay-panel map-panel"><button class="overlay-close" data-action="closeOverlay" aria-label="关闭">${uiIcon('close')}</button><div class="overlay-title"><span class="overlay-title-icon">${uiIcon('map')}</span><div><span class="overlay-kicker">故事地图</span><h2>连载完成 ${percent}%</h2></div><b>${done}<small>/ ${mode().chapters*mode().beats} 次选择</small></b></div><div class="overlay-progress"><i style="width:${percent}%"></i></div><div class="overlay-chapters">${CHAPTERS.map((chapter,i)=>`<div class="${i<completed?'done':i===state.chapterIndex?'current':''}"><i>${i<completed?uiIcon('check'):i+1}</i><b>第 ${i+1} 章</b><span>D-${chapter.day}</span></div>`).join('')}</div><div class="map-now"><span>${uiIcon('feather')}</span><div><small>此刻正在发生</small><b>${state.phase==='chapter'||state.phase==='consequence'?`第 ${state.currentChapter.num} 章 · 第 ${state.currentChapter.beat+1} 幕`:`第 ${Math.min(state.chapterIndex+1,mode().chapters)} 章`}</b><p>${esc(state.currentChapter?.goal||state.memory.at(-1)||state.question.premise)}</p></div></div></div></div>`;
}
function statusOverlay(){
  const modeValue=state.generationMode==='local'?'本地模式 · 不限次数':`知乎模式 · ${usageLabel()}`;
  return `<div class="game-overlay" role="dialog" aria-modal="true" aria-label="当前状态"><div class="overlay-panel status-panel"><button class="overlay-close" data-action="closeOverlay" aria-label="关闭">${uiIcon('close')}</button><div class="overlay-title"><span class="overlay-title-icon">${uiIcon('status')}</span><div><span class="overlay-kicker">当前状态</span><h2>${esc(state.penName)}</h2></div><b>D-${state.day}</b></div><div class="status-resources">${RES_DEFS.map(item=>`<div class="status-resource"><span class="status-resource-icon">${uiIcon(item.icon)}</span><span>${item.label}<i><em style="width:${state.resources[item.key]}%;background:${resColor(item.key)}"></em></i></span><b>${Math.round(state.resources[item.key])}</b></div>`).join('')}</div><div class="status-facts"><span>${uiIcon(state.generationMode==='local'?'infinity':'cloud')}<small>模式</small><b>${modeValue}</b></span><span>${uiIcon(ROUTE_ICONS[dominantRouteKey()])}<small>路线</small><b>${ROUTE_MAP[dominantRouteKey()].name}</b></span><span>${uiIcon('users')}<small>关系</small><b>${state.trust}</b></span><span>${uiIcon('search')}<small>线索</small><b>${state.evidence}</b></span></div>${state.currentChapter?`<div class="status-goal"><span>${uiIcon('compass')}</span><div><small>当前目标</small><b>${esc(state.currentChapter.goal)}</b></div></div>`:''}</div></div>`;
}
function lowActionOverlay(){
  const cost=SPECIFICS.find(s=>s.key===state.currentChapter.specificity).cost;
  const remain=Math.max(0,state.resources.action);
  return `<div class="game-overlay low-action-overlay" role="dialog" aria-modal="true"><div class="overlay-panel low-action-panel"><span class="overlay-kicker">⚠ 行动力不足</span><h2>剩余行动力 <b class="low-action-num">${remain}</b> <span class="low-action-sep">/ 本章需要</span> <b>${cost}</b></h2><p>直接进入将触发「低效更新」：<b>质量 −4、精力 −8</b>。确定要这样写这一章吗？</p><div class="wizard-actions"><button class="btn btn--ghost" data-action="closeOverlay">再想想</button><button class="btn btn--primary btn--danger" data-action="confirmLowAction">低效更新并进入</button></div></div></div>`;
}
function hintOverlay(){
  return `<div class="game-overlay" role="dialog" aria-modal="true"><div class="overlay-panel low-action-panel"><span class="overlay-kicker">⚠ 无法执行</span><h2>${esc(state.hintTitle||'暂时做不了')}</h2><p>${esc(state.hintText||'')}</p><div class="wizard-actions"><button class="btn btn--primary" data-action="closeOverlay">知道了</button></div></div></div>`;
}
function prepAdviceOverlay(){
  const a=Math.max(0,state.resources.action), e=Math.max(0,state.resources.energy);
  const lowA=a<LOW_ACTION_WARN, lowE=e<LOW_ENERGY_WARN;
  const warn=(lowA||lowE)?`当前${lowA?'行动力':'精力'}偏低，建议优先考虑「休息一晚」恢复后再选择。`:'准备动作会消耗对应资源，本章限 2 次，请谨慎选择。';
  return `<div class="game-overlay" role="dialog" aria-modal="true"><div class="overlay-panel low-action-panel"><span class="overlay-kicker">⚠ 选择前请注意</span><h2>先看看还剩多少</h2><p>剩余 <b>行动力 ${a}</b> · <b>精力 ${e}</b>。${warn}</p><div class="wizard-actions"><button class="btn btn--primary" data-action="closeOverlay">知道了，谨慎选择</button></div></div></div>`;
}
function tutorialOverlay(){
  const steps=[
    {icon:'feather',no:'01',title:'先以作者身份工作',body:'选择本章意图、安排准备，再决定给主角多少自由。'},
    {icon:'book',no:'02',title:'进入故事成为主角',body:'每一幕都要行动。选择会改变关系、线索和后续可走的分支。'},
    {icon:'message',no:'03',title:'发布后回应读者',body:'评论和突发事件会反过来影响作者状态，也会改写下一章。'},
    {icon:'map',no:'04',title:'让两个世界彼此推进',body:'地图看进度，状态看资源。越接近结局，光影与风险都会加深。'},
  ];
  return `<div class="game-overlay" role="dialog" aria-modal="true" aria-label="游戏教程"><div class="overlay-panel tutorial-panel"><button class="overlay-close" data-action="closeOverlay" aria-label="关闭">${uiIcon('close')}</button><div class="overlay-title"><span class="overlay-title-icon">${uiIcon('guide')}</span><div><span class="overlay-kicker">游戏教程</span><h2>一篇故事，两个身份。</h2></div></div><div class="tutorial-loop"><span>作者层</span>${uiIcon('arrowRight')}<span>主角层</span>${uiIcon('arrowRight')}<span>读者反馈</span>${uiIcon('arrowRight')}<span>下一章</span></div><div class="tutorial-grid">${steps.map(item=>`<article class="tutorial-step"><span class="tutorial-step-icon">${uiIcon(item.icon)}</span><small>${item.no}</small><h3>${item.title}</h3><p>${item.body}</p></article>`).join('')}</div><div class="tutorial-tip"><span>${uiIcon('spark')}</span><p><b>不必寻找“正确答案”。</b> 资源、人物关系和你坚持的写法，会共同决定结局。</p></div></div></div>`;
}
const baseRender=render;
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&state?.overlay){state.overlay='';render();return;}
  if(e.key==='Enter'&&state?.phase==='transition'&&state.transition?.target==='chapter'){e.preventDefault();act('continueTransition',{dataset:{}});}
});
render = function(){
  const transitionToken=++realmTransitionToken;
  baseRender();
  const el=$('#app');
  if(state.phase==='transition'&&state.transition?.target==='chapter'&&typeof window.setTimeout==='function'){
    window.setTimeout(()=>{if(transitionToken===realmTransitionToken&&state.phase==='transition'&&state.transition?.target==='chapter')act('continueTransition',{dataset:{}});},3000);
  }
  if(!state.question||['title','prologue','draw','setup'].includes(state.phase)){
    if(document.body){document.body.classList.remove('game-atmosphere');delete document.body.dataset.realm;delete document.body.dataset.tension;delete document.body.dataset.mood;delete document.body.dataset.condition;}
    return;
  }
  const enteringStory=state.phase==='transition'&&state.transition?.target==='chapter';
  const inner=['chapter','consequence'].includes(state.phase)||enteringStory;
  const visual=narrativeVisualState(inner);
  if(document.body){document.body.classList.add('game-atmosphere');document.body.dataset.realm=visual.realm;document.body.dataset.tension=visual.tension;document.body.dataset.mood=visual.mood;document.body.dataset.condition=visual.condition;}
  if(enteringStory)return;
  const modeText=state.generationMode==='local'?'本地模式 · 不限次数':`知乎模式 · ${usageLabel()}`;
  const mini=RES_DEFS.slice(0,3).map(item=>`<span class="hud-resource" title="${item.label}">${uiIcon(item.icon)}<b>${Math.round(state.resources[item.key])}</b></span>`).join('');
  const overlay=state.overlay==='map'?mapOverlay():state.overlay==='status'?statusOverlay():state.overlay==='tutorial'?tutorialOverlay():state.overlay==='lowAction'?lowActionOverlay():state.overlay==='hint'?hintOverlay():state.overlay==='prepAdvice'?prepAdviceOverlay():'';
  el.innerHTML=`<header class="identity game-nav ${inner?'identity-story':''}"><div class="nav-left"><button class="nav-tool" data-action="openOverlay" data-val="map" aria-label="打开故事地图">${uiIcon('map')}<span>地图</span></button><button class="nav-tool" data-action="openOverlay" data-val="status" aria-label="查看当前状态">${uiIcon('status')}<span>状态</span></button><button class="nav-tool" data-action="openOverlay" data-val="tutorial" aria-label="打开游戏教程">${uiIcon('guide')}<span>教程</span></button></div><div class="hud-context"><span>${inner?'小说世界':'作者工作台'}</span><b>${inner?'你是主角':esc(state.penName)}</b></div><div class="hud-resources">${mini}</div><span class="identity-mode">${modeText}</span></header>`+el.innerHTML+overlay;
};
screens.manuscript = ()=>renderManuscript().replace('AI 续写 · 章节成稿','作者世界 · 审阅本章').replace('AI 依大纲、人物状态与已埋伏笔续写。','正文根据本章行动记录整理。');
screens.feedback = ()=>{
  const ch=state.currentChapter,dom=dominantRouteKey(),route=ROUTE_MAP[dom];
  return `<section class="screen feedback-screen"><header class="feedback-head"><div><span class="eyebrow">第 ${ch.num} 章已发布</span><h1>评论区醒了。<br>下一步由作者决定。</h1></div><div class="chapter-pulse"><span>${uiIcon('trend')} 本章变化</span>${renderDelta(ch.delta)}</div></header><div class="feedback-layout"><section class="reader-panel"><div class="panel-title"><span>${uiIcon('message')}</span><div><b>读者评论</b><small>${ch.comments.length} 条新反馈</small></div></div><div class="comment-list">${renderComments(ch.comments,false)}</div></section><aside class="decision-console">${ch.event?`<div class="event-card"><div class="event-h">${uiIcon('alert')}<span>突发事件</span><b>${esc(ch.event.name)}</b></div><p>${esc(fill(ch.event.desc,chapterCtx(ch)))}</p></div>`:''}<div class="decision-console-head"><div><span>作者回应</span><h2>你准备怎么处理？</h2></div><span class="route-signal" style="--route:${route.color}">${uiIcon(ROUTE_ICONS[dom])}<small>当前路线</small><b>${route.name}</b></span></div><div class="author-actions">${AUTHOR_DECISIONS.map((a,i)=>{const meta=AUTHOR_UI[a.key];return `<button class="author-action author-action--${meta.tone}" data-action="authorDecide" data-idx="${i}"><span class="author-action-icon">${uiIcon(meta.icon)}</span><span class="author-action-copy"><small>${meta.type}</small><b>${esc(a.label)}</b><em>${esc(a.desc)} · ${meta.outcome}</em><span>${effectChips(a.eff,true)}</span></span><span class="author-action-route">${ROUTE_MAP[a.route].name}</span>${uiIcon('arrowRight')}</button>`;}).join('')}</div></aside></div></section>`;
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
  if(state.workbenchStep!==2)return;
  const cost=SPECIFICS.find(s=>s.key===state.currentChapter.specificity).cost;
  // 行动力不足：先弹窗确认，避免玩家顺手误触低效更新
  if(state.resources.action<cost && !state.lowActionConfirmed){
    state.overlay='lowAction'; render(); return;
  }
  // 已确认：走低效更新兜底，保证流程永不卡死
  if(state.resources.action<cost){
    state.lowActionConfirmed=false;
    state.resources.action=Math.max(cost,25);
    applyEffect({quality:-4,energy:-8});
    state.uiNotice='行动力不足，本章按低效更新结算：质量 −4、精力 −8。';
  }
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
      state.generationJob=data.jobId;persistGame();return waitForGeneration(ch,data.jobId);
    }catch(e){
      const network=/network|fetch|网络请求|failed/i.test(String(e.message));
      state.generationError=network?'无法连接本地生成服务，请刷新页面后重试。':e.message;state.phase='generationError';render();
    }
  })();
};
screens.generating=()=>`<section class="passage generation-state"><div class="generation-orbit"><span>${uiIcon('cloud')}</span>${mascot('电脑_6秒_320x320_20fps_透明.gif')}</div><span class="eyebrow">知乎模式</span><h2>正在写下一章。</h2><div class="generation-line"><i></i></div><p>今日剩余 <b>${state.zhihuUsage?.remaining??5000}</b> 次</p></section>`;
screens.generationError=()=>`<section class="passage generation-state generation-state--error"><div class="generation-error-icon">${uiIcon('alert')}</div><span class="eyebrow">生成中断</span><h2>这一页暂时没写出来。</h2><p>${esc(state.generationError)}</p><div class="btn-row"><button class="btn btn--primary" data-action="retryGeneration"><span>${state.generationJob?'继续等待':'重新构思'}</span>${uiIcon('arrowRight')}</button><button class="btn btn--ghost" data-action="localChapter">${uiIcon('infinity')}<span>切换本地模式</span></button></div></section>`;
const beforeRemoteAct=act;
act=function(action,el){
  if(state.phase==='generationError'&&action==='retryGeneration'){
    if(state.generationJob){state.phase='generating';render();return waitForGeneration(state.currentChapter,state.generationJob);}
    state.phase='workbench';return enterChapter();
  }
  if(state.phase==='generationError'&&action==='localChapter'){state.generationJob='';state.generationMode='local';state.phase='workbench';enterLocal();render();return;}
  return beforeRemoteAct(action,el);
};

const beforeSaveAct=act;
act=function(action,el){
  let result;
  if(action==='continueGame'&&state.phase==='title')result=continueSavedGame();
  else if((action==='newGame'&&state.phase==='title')||action==='replay')result=beginFreshGame();
  else result=beforeSaveAct(action,el);
  persistGame();
  if(result&&typeof result.then==='function')return Promise.resolve(result).finally(()=>persistGame());
  return result;
};
boot();
