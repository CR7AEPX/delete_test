(() => {
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STORAGE_KEY = "our-life-save-v1";
const state = {chapter:1,scene:"c1s1",history:[],stats:{closeness:0,trust:0,joy:0,calm:0,freedom:0,family:0},tags:[],settings:{fontSize:"normal",textSpeed:"24",contrast:"normal"},sound:false,typing:false,fullText:"",timer:null};
const chapters = window.OUR_LIFE_STORY.chapters;
const allScenes = chapters.flatMap(c=>c.scenes);
const sceneById = id => allScenes.find(s=>s.id===id);
const chapterById = id => chapters.find(c=>c.id===id);
const toast = message => {const el=$("#toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2300)};
const save = () => {try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){toast("Не удалось сохранить в браузере");}};
const load = () => {try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const data=JSON.parse(raw);Object.assign(state,data);}}catch(e){console.warn("Save data unavailable",e)}};
const openModal = id => $("#"+id).classList.remove("hidden");
const closeModal = id => $("#"+id).classList.add("hidden");
const currentChapter = () => chapterById(state.chapter)||chapters[0];
function renderChapters(){
 const grid=$("#chapterGrid");grid.innerHTML="";
 chapters.forEach(ch=>{
  const card=document.createElement("article");card.className="chapter-card";card.style.setProperty("--chapter-image",`url("${ch.image}")`);
  const unlocked=ch.id===1||state.history.some(h=>h.chapter>=ch.id-1);
  card.innerHTML=`<span class="chapter-number">${String(ch.id).padStart(2,"0")}</span><div><h3 class="chapter-title">${ch.title}</h3><div class="chapter-desc">${ch.desc}</div><div class="chapter-state">${unlocked?"ОТКРЫТЬ ГЛАВУ ↗":"СКОРО · ПРОДОЛЖЕНИЕ"}</div></div>`;
  card.addEventListener("click",()=>{if(unlocked){state.chapter=ch.id;state.scene=ch.scenes[0].id;startGame()}else toast("Сначала завершите предыдущую главу")});grid.append(card);
 });
}
function startGame(){ $("#gameScreen").classList.remove("hidden");document.body.style.overflow="hidden";renderScene();save(); }
function home(){ $("#gameScreen").classList.add("hidden");document.body.style.overflow="";renderChapters();save(); }
function renderScene(){
 const scene=sceneById(state.scene);if(!scene){toast("Сцена не найдена");return}
 const ch=chapterById(state.chapter)||chapters.find(c=>c.scenes.some(s=>s.id===scene.id))||chapters[0];
 state.chapter=ch.id;
 $("#gameChapterNo").textContent="ГЛАВА "+String(ch.id).padStart(2,"0");
 $("#gameChapterName").textContent=ch.title.toLocaleUpperCase("ru");
 $("#sceneCaption").textContent=scene.caption||"";
 if(scene.bg)$("#sceneBackdrop").style.backgroundImage=`url("${scene.bg}")`;
 $("#speaker").textContent=scene.speaker||"";
 const portrait=$("#characterPortrait");
 const portraitUrl=scene.portrait || (scene.speaker==="АННА" ? "https://images.unsplash.com/photo-1612693624119-f92568c19322?auto=format&fit=crop&w=1100&q=88" : "");
 portrait.classList.toggle("hidden",!portraitUrl);
 if(portraitUrl)portrait.style.backgroundImage=`url("${portraitUrl}")`;
 const bond=$("#bondStatus");
 if(bond)bond.textContent=`БЛИЗОСТЬ ${state.stats.closeness||0} · ДОВЕРИЕ ${state.stats.trust||0}`;
 $("#sceneCounter").textContent=`СЦЕНА ${String(ch.scenes.findIndex(s=>s.id===scene.id)+1).padStart(2,"0")} / ${String(ch.scenes.length).padStart(2,"0")}`;
 const index=allScenes.findIndex(s=>s.id===scene.id);$("#progressFill").style.width=((index+1)/allScenes.length*100)+"%";
 $("#choices").innerHTML="";
 $("#nextButton").classList.toggle("hidden",!!scene.choices);
 $("#nextButton").textContent=scene.ending?"В МЕНЮ  →":"ДАЛЕЕ  →";
 typeText(scene.text||"");
 if(scene.choices){scene.choices.forEach(choice=>{const b=document.createElement("button");b.className="choice-button";b.textContent=choice.text;b.addEventListener("click",()=>choose(choice,scene));$("#choices").append(b)});}
 if(scene.ending){const b=document.createElement("button");b.className="choice-button";b.textContent="Сохранить момент и вернуться в меню";b.addEventListener("click",()=>{state.history.push({chapter:state.chapter,scene:scene.id,text:scene.text,caption:scene.caption});save();home();toast(scene.final?`Финал: ${scene.final}`:"Глава завершена")});$("#choices").append(b)}
 save();
}
function typeText(text){
 clearInterval(state.timer);const el=$("#dialogueText");state.fullText=text;state.typing=true;
 const speed=Number(state.settings.textSpeed||0);
 if(speed===0){el.textContent=text;state.typing=false;return}
 el.textContent="";let i=0;
 state.timer=setInterval(()=>{el.textContent+=text.charAt(i++);if(i>=text.length){clearInterval(state.timer);state.typing=false}},speed);
}
function choose(choice,scene){
 clearInterval(state.timer);
 Object.entries(choice.effects||{}).forEach(([key,val])=>state.stats[key]=(state.stats[key]||0)+val);
 if(choice.tag)state.tags.push(choice.tag);
 if(state.scene==="c12s2"){
   const bond=(state.stats.closeness||0)+(state.stats.trust||0);
   if(bond<10 && choice.to==="ending_happy")choice.to="ending_repair";
   if(bond<7 && choice.to==="ending_growth")choice.to="ending_apart";
 }
 state.history.push({chapter:state.chapter,scene:scene.id,text:scene.text,choice:choice.text,caption:scene.caption});
 state.scene=choice.to;renderScene();
}
function next(){
 if(state.typing){clearInterval(state.timer);$("#dialogueText").textContent=state.fullText;state.typing=false;return}
 const scene=sceneById(state.scene);if(!scene)return;
 if(scene.ending){home();return}
 if(scene.next){state.history.push({chapter:state.chapter,scene:scene.id,text:scene.text,caption:scene.caption});state.scene=scene.next;renderScene()}
}
function showSearch(query=""){
 const q=query.trim().toLocaleLowerCase("ru");const results=[];
 chapters.forEach(ch=>{if(!q||ch.title.toLocaleLowerCase("ru").includes(q)||ch.desc.toLocaleLowerCase("ru").includes(q))results.push({title:`Глава ${ch.id}: ${ch.title}`,desc:ch.desc,scene:ch.scenes[0].id,chapter:ch.id});ch.scenes.forEach(sc=>{const hay=[sc.speaker,sc.caption,sc.text,...(sc.choices||[]).map(x=>x.text)].join(" ").toLocaleLowerCase("ru");if(q&&hay.includes(q))results.push({title:sc.caption||sc.speaker,desc:(sc.text||"").slice(0,145)+"…",scene:sc.id,chapter:ch.id})})});
 const box=$("#searchResults");box.innerHTML="";
 if(!q){box.innerHTML='<p class="muted">Введите слово, имя персонажа или событие.</p>';return}
 results.slice(0,30).forEach(r=>{const item=document.createElement("div");item.className="result-item";const b=document.createElement("b"),s=document.createElement("span");b.textContent=r.title;s.textContent=r.desc;item.append(b,s);item.addEventListener("click",()=>{state.chapter=r.chapter;state.scene=r.scene;closeModal("searchModal");startGame()});box.append(item)});
 if(!results.length)box.innerHTML='<p class="muted">Ничего не найдено. Попробуйте другое слово.</p>';
}
function renderHistory(){
 const list=$("#historyList");list.innerHTML="";
 if(!state.history.length){list.innerHTML='<p class="muted">Здесь появятся сцены, которые вы уже прочитали.</p>';return}
 [...state.history].reverse().forEach(h=>{const row=document.createElement("div");row.className="history-item";const b=document.createElement("b"),s=document.createElement("span");b.textContent=`Глава ${h.chapter} · ${h.caption||"Воспоминание"}`;s.textContent=h.choice?`${h.text} Ваш выбор: ${h.choice}`:h.text;row.append(b,s);list.append(row)});
}
function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="our-life-save.json";a.click();URL.revokeObjectURL(a.href);toast("Файл сохранения подготовлен")}
function importSave(file){const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!data.scene||!data.chapter)throw Error("invalid");Object.assign(state,data);save();renderChapters();toast("Сохранение загружено")}catch(e){toast("Файл сохранения не распознан")}};reader.readAsText(file)}
function applySettings(){document.body.classList.toggle("large",state.settings.fontSize==="large");document.body.classList.toggle("xl",state.settings.fontSize==="xl");document.body.classList.toggle("high",state.settings.contrast==="high");}
function bind(){
 $("#startButton").onclick=()=>{state.chapter=1;state.scene="c1s1";startGame()};
 $("#continueButton").onclick=()=>{if(state.scene)startGame();else $("#startButton").click()};
 $("#backHome").onclick=home;$("#nextButton").onclick=next;
 $("#searchOpen").onclick=()=>{openModal("searchModal");$("#searchInput").focus()};
 $("#gameSearch").onclick=()=>openModal("searchModal");
 $("#searchInput").addEventListener("input",e=>showSearch(e.target.value));
 $("#settingsOpen").onclick=()=>openModal("settingsModal");$("#gameSettings").onclick=()=>openModal("settingsModal");
 $("#historyOpen").onclick=()=>{renderHistory();openModal("historyModal")};
 $("#aboutButton").onclick=()=>document.querySelector("#chapters").scrollIntoView({behavior:"smooth"});
 $$(".modal-close").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
 $$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModal(m.id)}));
 $("#saveSettings").onclick=()=>{state.settings.fontSize=$("#fontSize").value;state.settings.textSpeed=$("#textSpeed").value;state.settings.contrast=$("#contrast").value;applySettings();save();closeModal("settingsModal");toast("Настройки сохранены")};
 $("#exportSave").onclick=exportSave;$("#importSave").onchange=e=>{if(e.target.files[0])importSave(e.target.files[0])};
 $("#soundToggle").onclick=()=>{state.sound=!state.sound;$("#soundToggle").style.color=state.sound?"var(--gold)":"";toast(state.sound?"Звук интерфейса включён":"Звук выключен")};
 document.addEventListener("keydown",e=>{if(e.key==="Escape")$$(".modal").forEach(m=>m.classList.add("hidden"));if(e.key===" "&& !$("#gameScreen").classList.contains("hidden") && !e.target.matches("input,button")){e.preventDefault();next()}});
}
function init(){load();bind();renderChapters();applySettings();$("#fontSize").value=state.settings.fontSize;$("#textSpeed").value=state.settings.textSpeed;$("#contrast").value=state.settings.contrast;}
document.addEventListener("DOMContentLoaded",init);
})();