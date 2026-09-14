/* 本地存档：只持久化游戏状态，不读取或保存任何认证信息。 */
'use strict';

const SaveSystem = (()=>{
  const SAVE_VERSION = 1;
  const STORAGE_KEY = 'yanxuan-life.save.v1';
  const MAX_SAVE_SIZE = 4_500_000;
  const PHASES = new Set(['title','prologue','draw','setup','map','workbench','transition','chapter','consequence','manuscript','feedback','crisis','ending','generating','generationError']);
  const GENRES = new Set(['悬疑反转','都市情感','女性成长','民俗怪谈','职场冲突','历史脑洞']);
  const THEMES = new Set(['真相','尊严','牺牲','亲密关系','现实困境']);
  const ROUTES = ['traffic','quality','controversy','commercial','self'];
  const LENGTHS = {short:{chapters:6,beats:4},medium:{chapters:9,beats:5},long:{chapters:12,beats:6}};
  const SPECIFICS = new Set(['specific','balanced','broad']);
  const STATE_FIELDS = [
    'phase','genre','theme','routeLean','penName','day','chapterIndex','resources','routeAffinity','aiReliance',
    'chapters','outline','foreshadowing','highlightComments','heatHistory','currentChapter','crisisComplication',
    'currentScene','length','memory','storyBible','trust','evidence','prep','feedbackKey','transition','chapterPlan',
    'generationMode','generationJob','zhihuUsage','prologueStep','setupStep','workbenchStep','prepNote',
    'generationError','novelEnding'
  ];
  const SENSITIVE_KEYS = new Set(['accesssecret','zhihuaccesssecret','zhihuclisecret','oauthtoken','apikey','authorization','credential','credentials','password','token']);

  const isObject = value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const isInteger = (value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
  const isFiniteNumber = (value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
  const isString = (value,max=200000)=>typeof value==='string'&&value.length<=max;

  function isSafeTree(value,depth=0){
    if(depth>14)return false;
    if(value===null||typeof value==='boolean')return true;
    if(typeof value==='number')return Number.isFinite(value);
    if(typeof value==='string')return value.length<=200000;
    if(Array.isArray(value))return value.length<=600&&value.every(item=>isSafeTree(item,depth+1));
    if(!isObject(value))return false;
    const entries=Object.entries(value);
    if(entries.length>120)return false;
    return entries.every(([key,item])=>{
      const normalized=key.toLowerCase().replace(/[^a-z0-9]/g,'');
      return !SENSITIVE_KEYS.has(normalized)&&isSafeTree(item,depth+1);
    });
  }

  function validResources(resources){
    const keys=['action','energy','heat','quality','style','sign'];
    return isObject(resources)&&keys.every(key=>isFiniteNumber(resources[key],0,100));
  }

  function validRoutes(routes){
    return isObject(routes)&&ROUTES.every(key=>isFiniteNumber(routes[key],0,200));
  }

  function validChapter(chapter,chapterCount,beatCount){
    if(chapter===null)return true;
    if(!isObject(chapter)||!isInteger(chapter.num,1,chapterCount)||!isInteger(chapter.day,0,90))return false;
    if(!isString(chapter.stage,20)||!isString(chapter.goal,1000)||!SPECIFICS.has(chapter.specificity))return false;
    if(!Array.isArray(chapter.decisions)||!Array.isArray(chapter.prose)||!Array.isArray(chapter.comments))return false;
    if(chapter.steps!==undefined&&(!Array.isArray(chapter.steps)||chapter.steps.length>beatCount))return false;
    if(chapter.beat!==undefined&&!isInteger(chapter.beat,0,beatCount))return false;
    return isSafeTree(chapter);
  }

  function validZhihuUsage(usage){
    return isObject(usage)&&isFiniteNumber(usage.limit,0,1000000)&&isFiniteNumber(usage.used,0,1000000)&&
      isFiniteNumber(usage.remaining,0,1000000)&&isString(usage.date,40);
  }

  function validGame(game){
    if(!isObject(game)||!PHASES.has(game.phase)||!GENRES.has(game.genre)||!THEMES.has(game.theme))return false;
    if(!ROUTES.includes(game.routeLean)||!isString(game.penName,12)||!LENGTHS[game.length])return false;
    const config=LENGTHS[game.length];
    if(!isInteger(game.day,0,90)||!isInteger(game.chapterIndex,0,config.chapters))return false;
    if(!validResources(game.resources)||!validRoutes(game.routeAffinity))return false;
    if(!isInteger(game.aiReliance,0,config.chapters+4)||!isFiniteNumber(game.trust,-200,200)||!isInteger(game.evidence,0,500))return false;
    if(!isInteger(game.prep,0,2)||!isInteger(game.prologueStep,0,2)||!isInteger(game.setupStep,0,2)||!isInteger(game.workbenchStep,0,2))return false;
    if(!['local','zhihu'].includes(game.generationMode)||!isString(game.generationJob,200)||!isString(game.feedbackKey,40)||!isString(game.chapterPlan,100))return false;
    if(game.questionId!==null&&!isString(game.questionId,80))return false;
    if(!['title','prologue'].includes(game.phase)&&game.questionId===null)return false;
    for(const field of ['pendingDemandId','pendingEventId','endingId'])if(game[field]!==null&&!isString(game[field],80))return false;
    for(const field of ['chapters','outline','foreshadowing','highlightComments','heatHistory','memory','storyBible'])if(!Array.isArray(game[field]))return false;
    if(game.chapters.length>config.chapters||game.chapters.length>game.chapterIndex+1||game.memory.length>config.chapters||game.storyBible.length>config.chapters)return false;
    if(game.outline.length>config.chapters||game.foreshadowing.length>config.chapters||game.highlightComments.length>config.chapters)return false;
    if(game.heatHistory.length<1||game.heatHistory.length>config.chapters+2||!game.heatHistory.every(value=>isFiniteNumber(value,0,100)))return false;
    if(!game.chapters.every(chapter=>validChapter(chapter,config.chapters,config.beats))||!validChapter(game.currentChapter,config.chapters,config.beats))return false;
    if(!validZhihuUsage(game.zhihuUsage))return false;
    if(game.transition!==null){
      if(!isObject(game.transition)||!['chapter','manuscript','map','crisis'].includes(game.transition.target)||!isString(game.transition.title,500)||!isString(game.transition.body,2000))return false;
    }
    if(game.phase==='transition'&&game.transition===null)return false;
    if(['workbench','chapter','consequence','manuscript','feedback','generating','generationError'].includes(game.phase)&&game.currentChapter===null)return false;
    if(game.phase==='ending'&&game.endingId===null)return false;
    return isSafeTree(game);
  }

  function snapshot(state){
    if(!isObject(state))return null;
    const game={};
    for(const field of STATE_FIELDS)game[field]=state[field]??({prepNote:'',generationError:'',novelEnding:'',generationJob:''}[field]??null);
    game.questionId=state.question?.id||null;
    game.pendingDemandId=state.pendingDemand?.id||null;
    game.pendingEventId=state.pendingEvent?.id||null;
    game.endingId=state.ending?.id||null;
    try{return JSON.parse(JSON.stringify(game));}catch{return null;}
  }

  function storage(){
    try{return typeof window!=='undefined'&&window.localStorage?window.localStorage:null;}catch{return null;}
  }

  function saveGame(state){
    try{
      const game=snapshot(state);
      if(!game||!validGame(game))return false;
      const serialized=JSON.stringify({saveVersion:SAVE_VERSION,savedAt:new Date().toISOString(),game});
      if(serialized.length>MAX_SAVE_SIZE)return false;
      const target=storage();if(!target)return false;
      target.setItem(STORAGE_KEY,serialized);
      return true;
    }catch{return false;}
  }

  function loadGame(){
    try{
      const target=storage();if(!target)return null;
      const raw=target.getItem(STORAGE_KEY);
      if(!raw||raw.length>MAX_SAVE_SIZE)return null;
      const record=JSON.parse(raw);
      if(!isObject(record)||record.saveVersion!==SAVE_VERSION||!validGame(record.game))return null;
      return JSON.parse(JSON.stringify(record.game));
    }catch{return null;}
  }

  function hasSave(){return loadGame()!==null;}
  function clearSave(){
    try{const target=storage();if(!target)return false;target.removeItem(STORAGE_KEY);return true;}catch{return false;}
  }

  return {SAVE_VERSION,STORAGE_KEY,saveGame,loadGame,hasSave,clearSave};
})();

function persistGame(){
  try{return typeof state!=='undefined'&&state?SaveSystem.saveGame(state):false;}catch{return false;}
}
