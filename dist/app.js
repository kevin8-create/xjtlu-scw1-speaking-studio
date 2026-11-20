(() => {
"use strict";

const bank = window.SCW_BANK;
const learning = window.SCW_LEARNING;
const app = document.getElementById("app");
const notice = document.getElementById("notice");
const actionLabels = ["List / Define", "Explain", "Suggest", "Argue / Speculate"];
const topicNames = {University:"大学生活",Communication:"表达与沟通",Health:"健康",Jobs:"工作",People:"人物",Environment:"环境",Technology:"科技",Education:"教育",Places:"地点",Change:"变化"};
const views = ["home","practice","bank","toolkit","words","skills","library","plan","sources"];
const dayMs = 86400000;
const storageKey = "scw1-studio-v1";
const baseDate = Date.UTC(2026, 10, 20);
let saved = readSaved();
let view = "home";
let session = null;
let clockLoop = null;
let messageTimeout = null;
let bankFilters = {source:"all", type:"all", search:""};
let modelVoice = null;
let audioUrl = "";
let recorder = null;
let recorderStream = null;
let recordingRequest = 0;

function readSaved() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {done:stored.done || {}, plan:stored.plan || {}, reviews:stored.reviews || {}, start:stored.start || "", focusHistory:Array.isArray(stored.focusHistory) ? stored.focusHistory : []};
  } catch { return {done:{},plan:{},reviews:{},start:"",focusHistory:[]}; }
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); return true; }
  catch { flash("浏览器暂时无法保存进度 / Progress could not be saved in this browser."); return false; }
}
function flash(message) {
  clearTimeout(messageTimeout);
  notice.textContent = message;
  notice.hidden = false;
  messageTimeout = setTimeout(() => { notice.hidden = true; }, 3200);
}
function daysSince(date, from = baseDate) { return Math.floor((Date.parse(date+"T00:00:00Z") - from)/dayMs); }
function shanghaiDate() {
  const parts = new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts();
  const date = Object.fromEntries(parts.map(({type,value})=>[type,value]));
  return date.year + "-" + date.month + "-" + date.day;
}
function mod(index,length) { return ((index % length) + length) % length; }
function pick(list,index) { return list[mod(index,list.length)]; }
function isCore(item) { return ["official","teacher"].includes(item.source); }
function different(a,b) { return a.topic.trim().toLowerCase() !== b.topic.trim().toLowerCase(); }
function drawDaily(date) {
  const offset = daysSince(date);
  const position = mod(offset,14);
  const cycle = Math.floor(offset/14);
  const supplementDays = [3,7,10,13];
  const isExtra = supplementDays.includes(position);
  const coreIndex = position - supplementDays.filter(day => day < position).length;
  const coreTalks = bank.talks.filter(x=>x.source==="teacher");
  const coreInterviews = bank.interviews.filter(x=>x.source==="teacher");
  const extras = bank.talks.filter(x=>!isCore(x));
  const extraInterviews = bank.interviews.filter(x=>!isCore(x));
  if(!isExtra || !extras.length || !extraInterviews.length) {
    const talk=pick(coreTalks,cycle+coreIndex);
    const interview=pick(coreInterviews,cycle+coreIndex+3);
    return {talk,interview:different(talk,interview)?interview:coreInterviews.find(item=>different(talk,item)),date};
  }
  const chosen=new Set();
  for(let slot=0; slot<supplementDays.length; slot++) {
    const talk=pick(extras,cycle*4+slot);
    const pool=extraInterviews.filter(item=>different(talk,item) && !chosen.has(item.id));
    const interview=pick(pool.length?pool:extraInterviews.filter(item=>different(talk,item)),cycle*4+slot+3);
    if(supplementDays[slot]===position) return {talk,interview,date};
    chosen.add(interview.id);
  }
}
function optionsFor(list,pinned,index, allowed=()=>true) {
  const filtered = list.filter(item=>allowed(item));
  const first = pinned && filtered.includes(pinned) ? pinned : pick(filtered,index);
  const alternatives = filtered.filter(item=>different(item,first));
  return alternatives.length ? [first,pick(alternatives,index+2)] : [first];
}
function mockDraw(date) {
  const anchor=drawDaily(date);
  const index=daysSince(date);
  return {
    talkOptions:optionsFor(bank.talks.filter(isCore),anchor.talk,index),
    interviews:bank.interviews.filter(isCore),
    interviewAnchor:anchor.interview
  };
}
function h(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]);
}
function lang(value) { return '<span lang="en">'+h(value)+'</span>'; }
function btn(label,action,style="primary",value="") {
  return '<button type="button" class="btn '+style+'" data-action="'+h(action)+'"'+(value?' data-value="'+h(value)+'"':"")+'>'+label+'</button>';
}
function navLink(label,target,style="secondary") {
  return '<a href="#'+target+'" data-view="'+target+'" class="btn '+style+'">'+label+'</a>';
}
function heading(en,zh,desc) {
  return '<header class="page-head"><p class="eyebrow">'+h(en)+'</p><h1>'+h(zh)+'</h1><p class="muted">'+desc+'</p></header>';
}
function section(en,zh,description="") {
  return '<div class="section-head"><div><p class="eyebrow">'+h(en)+'</p><h2>'+h(zh)+'</h2>'+(description?'<p class="muted">'+description+'</p>':'')+'</div></div>';
}
function sourceLabel(key) { return bank.sources[key]?.label || key; }
function sourcePill(item) { return '<span class="pill '+(isCore(item)?"official":"supplement")+'">'+h(sourceLabel(item.source))+'</span>'; }
function topic(item) { return h(topicNames[item.topic] || item.topic)+' · '+lang(item.topic); }
function appendLines(items=[]) { return items.length?'<ul class="source-list">'+items.map(text=>'<li>'+h(text)+'</li>').join("")+'</ul>':""; }
function textBlock(title, lines) {
  return '<div class="card"><h3>'+h(title)+'</h3>'+appendLines(lines)+'</div>';
}
function timeText(seconds) { return Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0"); }

function moduleLinks() {
  const modules=[
    ["words","Aa","每日词卡","Vocabulary","将一个新搭配用进今天的回答。","Use a new collocation in your answer."],
    ["skills","◖))","每日读听","Reading & listening","听一遍抓主旨，再找支持观点的细节。","Listen for the main idea and one detail."],
    ["library","“”","引文与视频","Media library","借用一个观点，讲出你自己的例子。","Borrow an idea and add your own example."],
    ["plan","14","两周重点","Your plan","根据最近的自评决定下一次练什么。","Choose your next drill from recent ratings."]
  ];
  return '<div class="module-grid">'+modules.map(([route,mark,zh,en,tip,sub])=>
    '<a class="module-card mod-'+route+'" href="#'+route+'" data-view="'+route+'"><span class="module-mark" aria-hidden="true">'+mark+'</span><span class="module-title">'+zh+'<small lang="en">'+en+'</small></span><span class="module-desc">'+tip+'<small lang="en">'+sub+'</small></span><span class="module-arrow" aria-hidden="true">↗</span></a>'
  ).join("")+'</div>';
}

function renderHome() {
  const date=shanghaiDate();
  const {talk,interview}=drawDaily(date);
  const completed=saved.done[date];
  const active=session && session.stage!=="review";
  const wave=[16,24,30,18,44,64,44,78,53,25,40,70,92,76,46,67,100,70,29,49,78,52,31,73,90,66,38,60,42,19,30,45,27,18];
  const numberDone=Object.keys(saved.done).length;
  const durationRows=[["准备 · Prepare","1:00"],["陈述 · Individual talk","2:00"],["访谈 · Interview","4:00"]];
  const status=completed?"今日已练 / Practised today":"每日固定抽题 · 上海时区 / Daily draw · Shanghai time";
  return '<section class="hero"><div class="hero-content"><p class="eyebrow">XJTLU YEAR 1 · SCW1</p><h1 lang="en">Speaking practice<span class="hero-stop">.</span></h1><p class="subtitle">西交利物浦大一口语训练。先开口，再对照范文。</p><p class="translation" lang="en">Speak first. Review a model, pick one improvement, then try it again.</p><div class="button-row">'+(active?navLink("继续本轮 / Resume","practice","primary"):btn(completed?"重练今日 / Replay today":"开始今日练习 / Start today","daily"))+btn("考试模拟 / Full mock","mock","secondary")+'</div></div><div class="hero-side"><div class="wave" aria-hidden="true">'+wave.map(n=>'<i style="--wave:'+n+'%"></i>').join("")+'</div><div class="duration-list">'+durationRows.map(([name,time])=>'<div class="duration-row"><span>'+name+'</span><strong>'+time+'</strong></div>').join("")+'</div></div></section>'+
    section("TODAY'S DRAW","今日抽题",h(date)+" · "+status)+'<div class="grid three-col"><article class="card"><p class="eyebrow">PART 1 · 1 PROMPT</p><h3>'+topic(talk)+'</h3><p class="muted">个人陈述 / Individual talk</p>'+sourcePill(talk)+'</article><article class="card"><p class="eyebrow">PART 2 · '+interview.questions.length+' QUESTIONS</p><h3>'+topic(interview)+'</h3><p class="muted">访谈主题 / Interview topic</p>'+sourcePill(interview)+'</article><article class="card accent"><p class="eyebrow">YOUR PRACTICE</p><h3>'+numberDone+' 天已练 · '+numberDone+' day'+(numberDone===1?"":"s")+'</h3><p class="muted">用两周计划搭配今日抽题。 / Pair the daily draw with your 14-day plan.</p>'+navLink("查看复习计划 / View plan","plan","quiet small")+'</article></div>'+
    section("STUDY DESK","今天还可以练什么")+moduleLinks()+window.SCW_FOCUS.renderHome(saved.focusHistory,date)+section("FEEDBACK PRIORITIES","按老师反馈练三件事")+'<div class="grid three-col">'+[
      ["Part 1","理由后给一个具体镜头。","A real situation, an action, and a result."],
      ["Q2 · Explain","把抽象结果讲到听得见。","Explain how it happens and what changes."],
      ["Q3 + Q4","每题准备两个不同支撑点。","Give two distinct suggestions or reasons."]
    ].map(([label,zh,en])=>'<article class="card"><p class="eyebrow">'+label+'</p><h3>'+zh+'</h3><p class="muted" lang="en">'+en+'</p></article>').join("")+'</div>';
}

function canVoice() { return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window; }
function stopVoice() { if(canVoice()) window.speechSynthesis.cancel(); modelVoice=null; }
function speak(text,rate=.9,onFail=()=>{}) {
  if(!canVoice()) { onFail(); return; }
  stopVoice();
  const synth=window.speechSynthesis;
  const options=synth.getVoices();
  const voice=options.find(x=>x.lang==="en-GB" && x.localService) || options.find(x=>x.lang==="en-US" && x.localService) || options.find(x=>x.lang==="en-GB") || options.find(x=>x.lang.startsWith("en"));
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang="en-GB"; utterance.rate=rate;
  if(voice) utterance.voice=voice;
  utterance.onerror=event=>{ if(!["interrupted","canceled"].includes(event.error)) onFail(); };
  utterance.onend=()=>{ if(modelVoice===utterance) modelVoice=null; };
  modelVoice=utterance;
  synth.speak(utterance);
}
function askQuestion() {
  const current=session;
  const index=current.q;
  speak(current.interview.questions[index].prompt,.9,()=>{
    if(session===current && current.q===index && current.stage==="interview") {
      current.textVisible=true; if(view==="practice") render();
      flash("朗读不可用，已显示题目 / Audio unavailable. The question is shown.");
    }
  });
}
function stopRecording() {
  recordingRequest++;
  if(recorder && recorder.state!=="inactive") recorder.stop();
  recorderStream?.getTracks().forEach(track=>track.stop());
  recorderStream=null;
}
function releaseAudio() { if(audioUrl) URL.revokeObjectURL(audioUrl); audioUrl=""; }
async function record() {
  if(recorder?.state==="recording") { stopRecording(); return; }
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    flash("此浏览器不支持录音 / Recording is unavailable in this browser."); return;
  }
  const request=++recordingRequest;
  const current=session;
  try {
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    if(request!==recordingRequest || session!==current || current.stage==="review") { stream.getTracks().forEach(track=>track.stop()); return; }
    const parts=[];
    recorderStream=stream;
    recorder=new MediaRecorder(stream);
    recorder.ondataavailable=event=>{ if(event.data.size) parts.push(event.data); };
    recorder.onstop=()=>{
      if(session!==current || !parts.length) return;
      releaseAudio();
      audioUrl=URL.createObjectURL(new Blob(parts,{type:parts[0].type||"audio/webm"}));
      current.audioExtension=parts[0].type.includes("mp4") ? "m4a" : parts[0].type.includes("ogg") ? "ogg" : "webm";
      if(view==="practice") render();
    };
    recorder.start();
    render();
  } catch {
    recorderStream?.getTracks().forEach(track=>track.stop());
    recorderStream=null;
    flash("麦克风未开启，计时练习仍可继续 / Microphone is unavailable. You can still practise.");
  }
}
function newSession(mode,item) {
  clearInterval(clockLoop);
  stopVoice();
  stopRecording();
  releaseAudio();
  const date=shanghaiDate();
  const daily=drawDaily(date);
  const mock=mockDraw(date);
  session={
    mode,date,stage:mode==="mock"?"talk-choice":mode==="interview"?"interview-ready":"prep-ready",
    talk:mode==="interview"?null:(item && mode==="talk"?item:daily.talk),
    interview:mode==="talk"?null:(item && mode==="interview"?item:daily.interview),
    talkOptions:mock.talkOptions,interviewPool:mock.interviews,interviewAnchor:mock.interviewAnchor,
    q:0,deadline:0,duration:0,notes:"",textVisible:false,attempted:false
  };
  go("practice");
}
function countDown(stage,seconds) {
  stopVoice();
  session.stage=stage; session.duration=seconds; session.deadline=Date.now()+seconds*1000;
  if(stage==="talk" || stage==="interview") session.attempted=true;
  if(view==="practice") render(true);
  clearInterval(clockLoop); clockLoop=setInterval(updateClock,200);
}
function updateClock() {
  if(!session?.deadline) return;
  const seconds=Math.max(0,Math.ceil((session.deadline-Date.now())/1000));
  const display=document.getElementById("timer");
  if(display) { display.textContent=timeText(seconds); display.dataset.low=seconds<=10; }
  const meter=document.getElementById("timer-fill");
  if(meter) meter.style.width=(seconds/session.duration*100)+"%";
  if(seconds) return;
  if(session.stage==="prep") finishPrep();
  else if(session.stage==="talk") finishTalk();
  else if(session.stage==="interview") finishSession();
}
function enterStage(stage) {
  clearInterval(clockLoop);
  stopVoice();
  session.deadline=0; session.stage=stage;
  if(view==="practice") render(true);
}
function finishPrep() { enterStage("talk-ready"); }
function finishTalk() {
  if(session.mode==="talk") { finishSession(); return; }
  if(session.mode==="mock") {
    session.interviewOptions=optionsFor(session.interviewPool,session.interviewAnchor,daysSince(session.date),item=>different(session.talk,item));
    enterStage("interview-choice");
  } else enterStage("interview-ready");
}
function finishSession() {
  stopRecording();
  if(session.attempted && session.mode==="daily") {
    saved.done[session.date]={talk:session.talk.id,interview:session.interview.id};
    persist();
  }
  enterStage("review");
}
function goQuestion() {
  stopVoice();
  if(session.q+1>=session.interview.questions.length) { finishSession(); return; }
  session.q++; session.textVisible=false;
  render(true);
  askQuestion();
}
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) updateClock(); });

function clock(seconds, active=false) {
  return '<div class="clock-meta"><div class="clock" id="timer" aria-label="剩余时间 / Time remaining">'+timeText(seconds)+'</div><span class="pill">'+(active?"倒计时 / Running":"准备就绪 / Ready")+'</span></div><div class="progress-track" aria-hidden="true"><div id="timer-fill" style="width:'+Math.floor(seconds/(session.duration || seconds)*100)+'%"></div></div>';
}
function talkPrompt() { return sourcePill(session.talk)+'<h2 class="question" lang="en">'+h(session.talk.prompt)+'</h2>'; }
function notesField() {
  return '<label class="form-field"><strong>关键词 / Key words</strong><span class="translation">用三个词记下情境、动作和结果。 / Note the situation, action, and result.</span><textarea id="prep-notes" maxlength="600" placeholder="Situation · action · result">'+h(session.notes)+'</textarea></label>';
}
function choices(items,action) {
  return '<div class="choice-grid">'+items.map(item=>'<button type="button" class="choice" data-action="'+action+'" data-value="'+h(item.id)+'"><span>'+topic(item)+'</span>'+sourcePill(item)+'</button>').join("")+'</div>';
}
function recordControl() {
  return ["talk-ready","talk","interview-ready","interview"].includes(session.stage) ?
    btn(recorder?.state==="recording"?"停止录音 / Stop recording":"录音 / Record","record","quiet small") : "";
}
function practiceRail() {
  return '<aside class="stack"><div class="rail"><p class="eyebrow">SESSION</p><h3>'+({daily:"今日练习 / Daily practice",mock:"考试模拟 / Full mock",talk:"陈述专项 / Talk drill",interview:"访谈专项 / Interview drill"}[session.mode])+'</h3>'+
    (session.talk?'<p>Part 1 · '+topic(session.talk)+'</p>':"")+(session.interview && ["interview","interview-ready","review"].includes(session.stage)?'<p>Part 2 · '+topic(session.interview)+'</p>':"")+
    (session.notes?'<p class="notes-copy"><strong>关键词 / Key words</strong><br>'+h(session.notes)+'</p>':"")+
    '<p class="translation">可选录音仅在本页临时播放，复盘后可下载。 / Optional recording stays on this page until you download it.</p></div><div class="rail"><p class="eyebrow">SPEAKING SHAPE</p><p>观点 → 原因 → 具体例子 → 意义</p><p lang="en">Answer → reason → concrete example → takeaway</p></div></aside>';
}
function renderPractice() {
  if(!session) return heading("PRACTICE","选一种练法","每日抽题适合稳定练习，完整模拟按考试流程走一轮。 / Use the daily draw for routine practice and the full mock to rehearse the test.")+
    '<div class="grid two-col"><article class="card"><h2>每日练习</h2><p>Daily practice · 1 个陈述主题 + 1 个不同的访谈主题。</p>'+btn("开始今日练习 / Start today","daily")+'</article><article class="card accent"><h2>考试模拟</h2><p>Full mock · 两部分分别从两个主题中选一个。访谈逐题朗读。</p>'+btn("开始模拟 / Start mock","mock")+'</article></div>';
  if(session.stage==="review") return renderReview();
  const headings = {
    "talk-choice":["01 / CHOOSE A TOPIC","选个人陈述主题"],
    "prep-ready":["01 / PREPARATION","个人陈述"],
    "prep":["01 / PREPARATION","准备个人陈述"],
    "talk-ready":["01 / START SPEAKING","开始陈述"],
    "talk":["01 / INDIVIDUAL TALK","个人陈述"],
    "interview-choice":["02 / CHOOSE A TOPIC","选访谈主题"],
    "interview-ready":["02 / INTERVIEW","准备进入访谈"],
    "interview":["02 / INTERVIEW","访谈"]
  };
  const [en,zh]=headings[session.stage];
  let body="";
  switch(session.stage) {
    case "talk-choice":
      body='<h2>请选择一个主题 / Choose one topic</h2><p class="muted">选定后显示题目，开始 1 分钟准备。 / Your prompt appears before the one-minute preparation.</p>'+choices(session.talkOptions,"pick-talk");
      break;
    case "prep-ready":
      body=clock(60)+(session.mode==="mock"?'<p class="muted">点开始准备后显示题目。 / Start the timer to see your prompt.</p>':talkPrompt())+btn("开始 1 分钟准备 / Start preparation","prep");
      break;
    case "prep":
      body=clock(remaining(),true)+talkPrompt()+notesField()+btn("准备好了 / Finish prep","finish-prep","secondary");
      break;
    case "talk-ready":
      body=clock(120)+talkPrompt()+'<p class="muted">先把题目读出来，再启动陈述计时。 / Read the prompt aloud, then start the talk timer.</p><div class="button-row">'+btn("开始 2 分钟陈述 / Start talk","talk")+recordControl()+'</div>';
      break;
    case "talk":
      body=clock(remaining(),true)+talkPrompt()+'<p class="muted">加入一个场景和结果，留一句话收束。 / Give a situation and result, and leave time for one closing sentence.</p><div class="button-row">'+btn("结束陈述 / Finish talk","finish-talk","secondary")+recordControl()+'</div>';
      break;
    case "interview-choice":
      body='<h2>请选择一个不同主题 / Choose a different topic</h2>'+choices(session.interviewOptions,"pick-interview");
      break;
    case "interview-ready":
      body=clock(240)+sourcePill(session.interview)+'<h2>'+topic(session.interview)+'</h2><p class="muted">访谈共用 4 分钟。开始后听第一题，需要时可重听或展开题目。 / All questions share four minutes. Listen first, replay or reveal the text if needed.</p><div class="button-row">'+btn("开始 4 分钟访谈 / Start interview","interview")+recordControl()+'</div>';
      break;
    case "interview": {
      const current=session.interview.questions[session.q];
      const last=session.q+1===session.interview.questions.length;
      body=clock(remaining(),true)+'<p class="eyebrow">QUESTION '+(session.q+1)+' / '+session.interview.questions.length+'</p>'+
        (session.textVisible?'<h2 class="question" lang="en">'+h(current.prompt)+'</h2>':'<h2 class="question">先听题 / Listen first</h2>')+
        '<div class="button-row">'+btn(last?"结束访谈 / Finish interview":"下一题 / Next question","next-q")+btn("重听 / Replay","ask","secondary")+btn(session.textVisible?"隐藏题目 / Hide text":"显示题目 / Show text","toggle-text","quiet")+recordControl()+'</div>';
      break;
    }
  }
  return heading(en,zh,"模拟计时依照学校 SCW1 任务单。 / Timed to the university SCW1 task sheet.")+
    '<div class="practice-layout"><section class="panel" id="practice-panel" tabindex="-1">'+body+'</section>'+practiceRail()+'</div>';
}
function remaining() { return Math.max(0,Math.ceil((session.deadline-Date.now())/1000)); }
function modelText(item) {
  const paragraphs=Array.isArray(item.answer)?item.answer:[item.answer];
  return paragraphs.map(p=>'<p lang="en">'+h(p)+'</p>').join("");
}
function extraExamples(examples=[]) {
  return examples.length?'<div class="kit-item"><strong>替换示例 / Alternative examples</strong>'+examples.map(ex=>'<p>'+h(ex.label)+'<br>'+lang(ex.text)+'</p>').join("")+'</div>':"";
}
function talkModel(talk, showButton=false) {
  return '<div class="model">'+modelText(talk)+'<div class="kit-item"><strong>答案路线 / Answer cues</strong><p>'+talk.cues.map(h).join(" · ")+'</p></div><div class="kit-item"><strong>常用短语 / Useful phrases</strong>'+appendLines(talk.phrases)+'</div>'+extraExamples(talk.examples)+
    (showButton?btn("朗读范文 / Read model aloud","voice-talk","quiet small",talk.id):"")+'</div>';
}
function interviewModels(set, open=false) {
  return set.questions.map((item,index)=>'<details class="answer-details"'+(open && index===0?" open":"")+'><summary><span class="eyebrow">Q'+(index+1)+' · '+h(actionLabels[index])+'</span><br>'+lang(item.prompt)+'</summary><div class="model">'+modelText(item)+appendLines(item.phrases)+extraExamples(item.examples)+btn("朗读范文 / Read model aloud","voice-interview","quiet small",set.id+"|"+index)+'</div></details>').join("")+extraExamples(set.examples);
}
function reviewKey() { return [session.date,session.mode,session.talk?.id,session.interview?.id].join("|"); }
function renderReview() {
  const details=saved.reviews[reviewKey()] || {checked:[],note:""};
  const rubric=learning.rubric.map((row,i)=>'<label class="check-row"><input type="checkbox" data-check="'+i+'"'+(details.checked.includes(i)?" checked":"")+'><span><strong>'+h(row.label)+'</strong><small>'+h(row.tip)+'</small></span></label>').join("");
  return heading("REVIEW YOUR ROUND","练后复盘","先对照范文找一个可以马上改的点，再用自己的话重讲一遍。 / Pick one change from the model, then answer again in your own words.")+
    (audioUrl?'<section class="card"><h3>本轮录音 / Your recording</h3><audio controls src="'+h(audioUrl)+'"></audio><a class="btn quiet small" href="'+h(audioUrl)+'" download="scw1-'+session.date+'.'+session.audioExtension+'">下载录音 / Download recording</a></section>':"")+
    '<div class="practice-layout review-layout"><div class="stack">'+
    (session.talk?'<article class="panel"><p class="eyebrow">PART 1 · MODEL TALK</p><h2 lang="en">'+h(session.talk.prompt)+'</h2>'+sourcePill(session.talk)+talkModel(session.talk,true)+'</article>':"")+
    (session.interview?'<article class="panel"><p class="eyebrow">PART 2 · MODEL ANSWERS</p><h2>'+topic(session.interview)+'</h2>'+sourcePill(session.interview)+interviewModels(session.interview,true)+'</article>':"")+
    '<div class="button-row">'+btn("重练这组题 / Try again","retry")+navLink("打开口语素材 / Open toolkit","toolkit","secondary")+'</div></div>'+
    '<aside class="card"><p class="eyebrow">17-POINT SELF-CHECK</p><h3>按课堂反馈自查</h3><p class="translation">勾选你能在录音中听见的表现。 / Check what you can hear in your answer.</p><details class="answer-details"><summary>展开 17 项 / Open all 17</summary><div class="checklist">'+rubric+'</div></details><label class="form-field"><strong>下次只改一件事 / One change for next time</strong><textarea id="review-notes" maxlength="700" placeholder="Example: In Q2, show what happens after…">'+h(details.note)+'</textarea></label>'+window.SCW_FOCUS.renderReview(saved.focusHistory,shanghaiDate())+btn("保存复盘 / Save review","save-review","quiet small")+'</aside></div>'+window.SCW_LIBRARY.related(session.talk?.topic, session.interview?.topic);
}
function bankMatch(item) {
  if(bankFilters.source==="core" && !isCore(item)) return false;
  if(bankFilters.source==="extra" && isCore(item)) return false;
  const query=bankFilters.search.trim().toLowerCase();
  return !query || [item.topic,topicNames[item.topic],sourceLabel(item.source),item.reference,item.prompt,...(item.questions||[]).map(x=>x.prompt)].some(value=>String(value||"").toLowerCase().includes(query));
}
function bankItems() {
  const talks=bankFilters.type==="interview"?[]:bank.talks.filter(bankMatch);
  const interviews=bankFilters.type==="talk"?[]:bank.interviews.filter(bankMatch);
  const cards=[...talks.map(item=>({item,kind:"talk"})),...interviews.map(item=>({item,kind:"interview"}))].sort((a,b)=>Number(isCore(b.item))-Number(isCore(a.item)));
  return '<p class="muted" role="status">'+cards.length+' 组 / '+cards.length+' cards</p>'+
    (cards.length?'<div class="grid two-col bank-grid">'+cards.map(({item,kind})=>'<article class="card topic-card"><p class="eyebrow">'+(kind==="talk"?"PART 1 · INDIVIDUAL TALK":"PART 2 · INTERVIEW")+'</p><h3>'+topic(item)+'</h3>'+sourcePill(item)+
    (kind==="talk"?'<p lang="en"><strong>'+h(item.prompt)+'</strong></p>':'<p class="muted">'+item.questions.length+' 问 / '+item.questions.length+' questions</p>')+
    '<p class="translation">'+h(item.reference)+'</p>'+
    btn("限时练这组 / Practise","bank-"+kind,"secondary small",item.id)+
    '<details class="answer-details"><summary>浏览题目与范文 / Preview prompts and models</summary>'+(kind==="talk"?talkModel(item,true):interviewModels(item))+'</details></article>').join("")+'</div>':'<p class="empty">没有匹配的题目。 / No matching prompts.</p>');
}
function selected(value,current) { return value===current?" selected":""; }
function renderBank() {
  return heading("QUESTION BANK","口语题库","老师练习题排在前面。课堂 PPT、模考和复习资料题用于加练。 / Teacher practice comes first. Slides and other mocks add variety.")+
    '<div class="form-row"><label>搜索 / Search<input type="search" id="search-bank" value="'+h(bankFilters.search)+'" placeholder="Technology · 科技 · campus"></label>'+
    '<label>题型 / Part<select id="filter-type">'+[["all","全部 / Both parts"],["talk","个人陈述 / Talk"],["interview","访谈 / Interview"]].map(([v,a])=>'<option value="'+v+'"'+selected(v,bankFilters.type)+'>'+a+'</option>').join("")+'</select></label>'+
    '<label>来源 / Source<select id="filter-source">'+[["all","全部 / All"],["core","任务单与老师核心题 / Core"],["extra","补充题 / Supplemental"]].map(([v,a])=>'<option value="'+v+'"'+selected(v,bankFilters.source)+'>'+a+'</option>').join("")+'</select></label></div><section id="bank-results" aria-label="题库结果 / Question bank results">'+bankItems()+'</section>';
}
function renderToolkit() {
  return heading("LANGUAGE TOOLKIT","口语素材与句式","每次挑一个句式和一个能换题使用的例子。 / Take one pattern and one example you can adapt to another topic.")+
    '<div class="kit-grid">'+learning.toolkit.map(block=>'<article class="card"><h2 class="multiline">'+h(block.title)+'</h2><p class="muted multiline">'+h(block.note)+'</p>'+block.items.map(item=>'<div class="kit-item"><strong>'+h(item.label)+'</strong><p class="phrase">'+h(item.phrase)+'</p><p lang="en">'+h(item.example)+'</p></div>').join("")+'</article>').join("")+'</div>'+
    section("FROM THE CLASSROOM","课上练过的五种方法")+
    '<div class="grid two-col">'+bank.classroom.map(drill=>'<article class="card"><p class="eyebrow">'+h(drill.unit)+'</p><h3>'+h(drill.title)+'</h3><p>'+h(drill.practice)+'</p></article>').join("")+'</div>'+
    section("EVIDENCE-BASED PRACTICE","想在短期内练得更好？")+
    '<div class="grid two-col">'+learning.methods.map(method=>'<article class="card"><h3 class="multiline">'+h(method.title)+'</h3><p class="multiline">'+h(method.description)+'</p><p><a href="'+h(method.url)+'" target="_blank" rel="noreferrer">'+h(method.source)+'</a></p></article>').join("")+'</div>';
}
function renderPlan() {
  const date=shanghaiDate();
  const start=saved.start||date;
  const active=Math.min(13,Math.max(0,daysSince(date,Date.parse(start+"T00:00:00Z"))));
  const done=Object.values(saved.plan).filter(Boolean).length;
  return heading("14-DAY PLAN","两周复习计划","每天约 17–20 分钟。若考试在两周内，先做第 1、4–7、12–14 天的训练。 / Practise for about 17–20 minutes a day. If your test is sooner, prioritise Days 1, 4–7 and 12–14.")+
    '<div class="rail"><p><strong>'+done+' / 14</strong> 天完成 / days complete</p><div class="progress-track" aria-hidden="true"><div style="width:'+Math.round(done/14*100)+'%"></div></div><p class="translation">计划起始 / Plan start · '+h(start)+'</p><div class="button-row">'+btn("今日抽题 / Start today","daily","primary small")+btn("考试模拟 / Full mock","mock","secondary small")+'</div></div>'+
    window.SCW_FOCUS.renderPlan(saved.focusHistory,date,active+1)+
    '<div class="card plan-input"><h3>给今天的口语加一份输入 / Add input to today’s speaking</h3><p>口语核心练习约 17–20 分钟。有余力时，加 5 分钟词卡和约 12 分钟读听，把一个新表达用进同一道题。<br><span lang="en">Allow 17–20 minutes for speaking. For a longer session, add five minutes of vocabulary and about twelve minutes of reading and listening. Reuse one expression in your answer.</span></p><div class="button-row">'+navLink("词卡 / Words","words","quiet small")+navLink("每日读听 / Daily input","skills","quiet small")+'</div></div>'+
    [0,1].map(week=>section("WEEK "+(week+1),week===0?"第一周 · 建立答题习惯":"第二周 · 换题与模拟")+
    '<div class="timeline stack">'+learning.days.slice(week*7,(week+1)*7).map((day,i)=>{
      const index=week*7+i;
      return '<details class="card"'+(active===index?" open":"")+'><summary>Day '+(index+1)+' · '+h(day.title.replace(/\n/g," / "))+(saved.plan[index]?' · ✓':'')+'</summary><p class="multiline muted">'+h(day.focus)+'</p><ol class="source-list">'+day.steps.map(step=>'<li class="multiline"><strong>'+h(step.label)+'</strong><br>'+h(step.text)+'</li>').join("")+'</ol><div class="rail multiline">'+h(day.success)+'</div><label class="check-row"><input type="checkbox" data-day="'+index+'"'+(saved.plan[index]?" checked":"")+'><span>标记完成 / Mark complete</span></label></details>';
    }).join("")+'</div>').join("");
}
function renderSources() {
  const lmo="https://core.xjtlu.edu.cn/course/view.php?id=1276";
  const official="https://www.xjtlu.edu.cn/en/study/departments/global-cultures-and-languages-hub/english-language-centre/elc-learning-teaching/year-one-eap";
  return heading("SOURCES & FORMAT","考试依据与题目来源","西交利物浦大学大一 EAP 2026/27 学年第一学期 · SCW1 口语。 / XJTLU Year 1 EAP, Semester 1, 2026/27 · Speaking Coursework 1.")+
    '<div class="grid two-col"><article class="panel"><p class="eyebrow">XJTLU TASK SHEET</p><h2>正式考试安排</h2><ul class="source-list"><li>第 12 周，2026 年 11 月 30 日至 12 月 4 日，口试约 8 分钟，占模块成绩 15%。<br><span lang="en">Week 12, 30 November to 4 December 2026. Approximately eight minutes, worth 15% of the module mark.</span></li><li>Part 1：两个主题选一，1 分钟准备。读出题目后计时，陈述最多 2 分钟。<br><span lang="en">Choose one of two topics, prepare for one minute, and speak for up to two minutes after reading out the prompt.</span></li><li>Part 2：从另外两个主题中选一，最多四问，共用四分钟，无额外准备时间。<br><span lang="en">Choose one of two different topics. Up to four questions share four minutes, with no preparation time.</span></li><li>个人场次、教室以及最新通知请在 e-Bridge 或课程公告中确认。<br><span lang="en">Confirm your individual time, room and updates in e-Bridge or course announcements.</span></li></ul><p><a href="'+official+'" target="_blank" rel="noreferrer">XJTLU Year One EAP · 学校官网</a></p><p><a href="'+lmo+'" target="_blank" rel="noreferrer">Learning Mall Core · EAP043 课程</a></p><p class="translation">已确认课程入口。当前无法读取登录后的附件与公告，考试说明来自你此前提供的官方任务单。 / The course entry was located. Signed-in files and announcements were inaccessible. The exam format comes from the task sheet you supplied.</p></article>'+
    '<article class="panel"><p class="eyebrow">PRACTICE MATERIALS</p><h2>题目从哪里来</h2><p>课程手册第 11 页核对了十个主题和各周口语技能。课堂练习对应 EAP043 Student Book Units 1–5。<br><span lang="en">Page 11 of the EAP043 Module Handbook confirms the ten topics and weekly speaking skills. Classroom activities are drawn from Student Book Units 1–5.</span></p><ul class="source-list">'+Object.values(bank.sources).map(item=>'<li><strong>'+h(item.label)+'</strong><br>'+h(item.note)+'</li>').join("")+'</ul><p class="translation">范文是为练习编写的示范。题目用于备考，具体考试以现场抽到的题目为准。 / Model answers were written for practice. Respond to the question you are given in the test.</p></article></div>';
}

function render(focus=false) {
  const today=shanghaiDate();
  const handlers={home:renderHome,practice:renderPractice,bank:renderBank,toolkit:renderToolkit,plan:renderPlan,sources:renderSources,
    words:()=>heading("VOCABULARY","每日词卡","先回忆意思，再说一句贴近自己生活的英文。 / Recall the meaning and use the word in a sentence about your life.")+window.SCW_WORD_APP.render(today),
    skills:()=>heading("DAILY INPUT","每日阅读与听力","读一篇，听一段，把其中一个细节讲给考官听。 / Read, listen and use one detail to support a spoken answer.")+window.SCW_INPUT.render(today,saved.start||today),
    library:()=>heading("MEDIA LIBRARY","引文与视频素材","选一个考试主题，用自己的话复述观点，再接一个大学生活中的例子。 / Pick a topic, paraphrase an idea and connect it to student life.")+window.SCW_LIBRARY.render()
  };
  app.dataset.view=view;
  app.innerHTML=handlers[view]();
  for(const link of document.querySelectorAll("nav [data-view]")) {
    if(link.dataset.view===view) link.setAttribute("aria-current","page");
    else link.removeAttribute("aria-current");
  }
  if(focus) (document.getElementById("practice-panel")||app).focus({preventScroll:true});
}
function go(next) {
  if(!views.includes(next)) return;
  if(next!==view) stopVoice();
  view=next;
  if(["plan","skills","practice","words"].includes(view) && !saved.start) { saved.start=shanghaiDate(); persist(); }
  if(location.hash!=="#"+next) location.hash=next;
  render(true);
  window.scrollTo({top:0});
}
function retry() {
  const before=session;
  newSession(before.mode,before.mode==="talk"?before.talk:before.interview);
  if(before.mode==="daily") { session.date=before.date; session.talk=before.talk; session.interview=before.interview; render(true); }
  if(before.mode==="mock") { session.date=before.date; session.talkOptions=before.talkOptions; session.interviewPool=before.interviewPool; session.interviewAnchor=before.interviewAnchor; render(true); }
}
function saveFocusRatings() {
  const ratings={};
  for(const field of document.querySelectorAll("[data-focus-rating]")) {
    if(field.value) ratings[field.dataset.focusRating]=field.value;
  }
  saved.focusHistory=window.SCW_FOCUS.record(saved.focusHistory,shanghaiDate(),ratings);
  return Object.keys(ratings).length;
}
const actions={
  "save-focus":()=>{
    if(!saveFocusRatings()) { flash("请选择今天练过的一项 / Choose a skill you practised today."); return; }
    if(persist()) { render(); flash("已更新两周建议 / Your two-week focus is updated."); }
  },
  daily:()=>newSession("daily"),
  mock:()=>newSession("mock"),
  "pick-talk":id=>{ session.talk=session.talkOptions.find(item=>item.id===id); countDown("prep",60); },
  prep:()=>countDown("prep",60),
  "finish-prep":finishPrep,
  talk:()=>countDown("talk",120),
  "finish-talk":finishTalk,
  "pick-interview":id=>{ session.interview=session.interviewOptions.find(item=>item.id===id); enterStage("interview-ready"); },
  interview:()=>{ countDown("interview",240); askQuestion(); },
  ask:askQuestion,
  "next-q":goQuestion,
  "toggle-text":()=>{ session.textVisible=!session.textVisible; render(true); },
  retry,
  record,
  "bank-talk":id=>newSession("talk",bank.talks.find(item=>item.id===id)),
  "bank-interview":id=>newSession("interview",bank.interviews.find(item=>item.id===id)),
  "save-review":()=>{
    const checked=Array.from(document.querySelectorAll("[data-check]:checked"),item=>Number(item.dataset.check));
    saved.reviews[reviewKey()]={checked,note:document.getElementById("review-notes").value};
    saveFocusRatings();
    if(persist()) { render(); flash("已保存复盘 / Review saved on this browser."); }
  },
  "voice-talk":id=>speak(bank.talks.find(x=>x.id===id).answer.join(" "),.9,()=>flash("当前浏览器不能朗读 / Read-aloud is unavailable.")),
  "voice-interview":id=>{
    const [set,index]=id.split("|");
    const answer=bank.interviews.find(x=>x.id===set).questions[Number(index)].answer;
    speak(Array.isArray(answer)?answer.join(" "):answer,.9,()=>flash("当前浏览器不能朗读 / Read-aloud is unavailable."));
  }
};
document.addEventListener("click",event=>{
  const link=event.target.closest("[data-view]");
  if(link && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    event.preventDefault(); go(link.dataset.view); return;
  }
  const button=event.target.closest("[data-action]");
  if(button && actions[button.dataset.action]) actions[button.dataset.action](button.dataset.value);
});
document.addEventListener("input",event=>{
  const target=event.target;
  if(target.id==="prep-notes" && session) session.notes=target.value;
  if(target.id==="search-bank") {
    bankFilters.search=target.value; document.getElementById("bank-results").innerHTML=bankItems();
  }
});
document.addEventListener("change",event=>{
  const target=event.target;
  if(target.id==="filter-type" || target.id==="filter-source") {
    bankFilters[target.id==="filter-type"?"type":"source"]=target.value;
    document.getElementById("bank-results").innerHTML=bankItems();
  }
  if(target.dataset.day!==undefined) {
    if(target.checked) saved.plan[target.dataset.day]=true; else delete saved.plan[target.dataset.day];
    if(persist()) flash(target.checked?"已标记完成 / Day marked complete.":"已取消标记 / Completion removed.");
    const open=[...document.querySelectorAll(".timeline details")].map(item=>item.open);
    render();
    document.querySelectorAll(".timeline details").forEach((item,i)=>{ item.open=open[i]; });
    document.querySelector('[data-day="'+target.dataset.day+'"]')?.focus({preventScroll:true});
  }
});
window.addEventListener("hashchange",()=>{
  const next=location.hash.slice(1);
  if(views.includes(next) && next!==view) go(next);
});
if(!bank?.talks?.length || !learning?.days?.length) {
  app.innerHTML='<p class="card">无法加载题库，请重新打开完整网站文件。 / Unable to load the bank. Open the complete site bundle.</p>';
  return;
}
go(views.includes(location.hash.slice(1))?location.hash.slice(1):"home");
})();
