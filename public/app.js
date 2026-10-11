const $=s=>document.querySelector(s);let G=null,INIT=null,muted=false,AC=null,CALL={};
function tone(f,t,d,type='square',v=.08){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;o.connect(g).connect(AC.destination);const s=AC.currentTime+t;o.start(s);g.gain.exponentialRampToValueAtTime(.001,s+d);o.stop(s+d)}catch(e){}}
const sfx={ticket(){if(!muted){tone(1200,0,.07);tone(900,.09,.07);tone(250,.22,.3,'sawtooth',.05)}},levelup(){if(!muted)[523,659,784,1047,1319].forEach((f,i)=>tone(f,i*.11,.35,'triangle',.12))},bad(){if(!muted)tone(150,0,.3,'sawtooth',.06)}};
function speak(text,v){if(muted||!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(text.replace(/[（(].*?[)）]/g,''));u.lang='ja-JP';u.pitch=v?.pitch??1;u.rate=v?.rate??1;const jv=speechSynthesis.getVoices().find(x=>x.lang.startsWith('ja'));if(jv)u.voice=jv;speechSynthesis.speak(u)}
$('#mute').onclick=()=>{muted=!muted;$('#mute').textContent=muted?'🔇':'🔊';if(muted)speechSynthesis?.cancel()};
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null;
if(SR){rec=new SR();rec.lang='ja-JP';rec.interimResults=true;rec.onresult=e=>{$('#msg').value=[...e.results].map(r=>r[0].transcript).join('');if(e.results[e.results.length-1].isFinal)$('#form').requestSubmit()};rec.onend=rec.onerror=()=>$('#mic').classList.remove('on')}
$('#mic').onclick=()=>{if(!rec){addLine('team','💡 案内','このブラウザは音声入力に未対応です。キーボードで入力してください。');$('#mic').disabled=true;return}speechSynthesis?.cancel();$('#mic').classList.add('on');rec.start()};
function hud(s){$('#lv').textContent=s.level;$('#bname').textContent=s.bossIcon+' '+s.bossTitle;$('#gauge').textContent=s.gauge;$('#gbar').style.width=s.gauge+'%';$('#left').textContent=s.turnsLeft;$('#bossface').textContent=s.bossIcon}
function bossSay(name,text,delta){$('#bosssay').innerHTML=`<small>${name}${delta!=null?`<span class="delta ${delta>=0?'up':'dn'}">説得 ${delta>=0?'+':''}${delta}</span>`:''}</small>`;$('#bosssay').append(text)}
function addLine(cls,name,text){const d=document.createElement('div');d.className='b '+cls;d.innerHTML=`<small>${name}</small>`;d.append(text);$('#log').append(d);$('#log').scrollTop=1e9}
function buildCalls(){const bar=$('#callbar');bar.querySelectorAll('.cb').forEach(x=>x.remove());CALL={};INIT.calls.items.forEach(k=>{const b=document.createElement('button');b.type='button';b.className='cb';b.textContent=k;b.onclick=()=>{const L=INIT.calls.levels,i=(L.indexOf(CALL[k]||'')+1)%L.length;CALL[k]=L[i];b.textContent=k+L[i];b.className='cb'+(i?' m'+i:'');tone(600+i*200,0,.05)};bar.append(b)})}
function celebrate(lvText,main,sub){sfx.levelup();const p=$('#pop');p.innerHTML=`<span class="lvl">${lvText}</span>${main}${sub?`<span class="w">${sub}</span>`:''}`;p.classList.remove('hidden');p.style.animation='none';p.offsetHeight;p.style.animation='';
 for(let i=0;i<45;i++){const c=document.createElement('div');c.className='conf';c.textContent=['🎉','🍜','✨','🏮','🐷','🧄'][i%6];c.style.left=Math.random()*100+'vw';c.style.animationDelay=Math.random()*.8+'s';document.body.append(c);setTimeout(()=>c.remove(),3800)}
 if(!document.body.classList.contains('demo'))setTimeout(()=>p.classList.add('hidden'),3600)}
async function start(){INIT=await (await fetch('/api/new',{method:'POST'})).json();G=INIT.state;document.body.classList.add('playing');$('#title').classList.add('hidden');$('#result').classList.add('hidden');$('#play').classList.remove('hidden');$('#log').innerHTML='';buildCalls();hud(G);
 bossSay(G.bossName,INIT.opening);speak(INIT.opening,G.bossVoice);const h=INIT.hint;addLine('team',`${h.icon} ${h.name}（小声）`,h.text);window._lh=h.text;$('#msg').focus()}
$('#start').onclick=start;$('#again').onclick=start;
async function send(m){const call={...CALL};const cs=Object.entries(call).filter(([k,v])=>v).map(([k,v])=>k+v).join(' ');sfx.ticket();addLine('me','🧑‍🍳 店主',m+(cs?`　🎫 ${cs}`:''));
 const r=await (await fetch('/api/turn',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:G.id,message:m,call})})).json();if(r.error){addLine('team','⚠',r.error);return r}
 bossSay(r.bossName,r.reply,r.delta);speak(r.reply,r.voice);const f=$('#bossface');f.className=r.delta>=15?'hit':r.delta<0?'mad':'';if(r.delta<0)sfx.bad();setTimeout(()=>f.className='',700);
 if(r.flag)addLine('team','🛡 審判','反則判定：'+r.reason+'（説得は上がりません）');
 if(r.hint&&r.hint.text!==window._lh)addLine('team',`${r.hint.icon} ${r.hint.name}（小声）`,r.hint.text);
 if(r.hint)window._lh=r.hint.text;G=r.state;if(!r.cleared)hud(G);
 if(r.cleared){bossSay(r.bossName,r.cleared.win.replace(/^.*?「|」$/g,''));$('#gauge').textContent=100;$('#gbar').style.width='100%';
  setTimeout(()=>{celebrate(`Lv${r.cleared.level} クリア！ → Lv${Math.min(r.cleared.level+1,5)}`,r.unlock||'👑 伝説の店 認定！',r.cleared.win);
   if(!G.over)setTimeout(()=>{hud(G);$('#log').innerHTML='';buildCalls();bossSay(G.bossName,r.nextOpening);speak(r.nextOpening,G.bossVoice)},demo?0:3700)},demo?0:1200)}
 if(G.over)setTimeout(()=>showResult(G),demo?0:(r.cleared?5200:1800));return r}
$('#form').onsubmit=e=>{e.preventDefault();const m=$('#msg').value.trim();if(!m||!G||G.over)return;$('#msg').value='';send(m)};
function showResult(s){$('#play').classList.add('hidden');$('#pop').classList.add('hidden');$('#result').classList.remove('hidden');const win=s.result==='win';$('#rtitle').textContent=win?'🏆 大繁盛！伝説の三田三郎':'🌙 閉店ガラガラ…';$('#rline').textContent=win?INIT.winLine:INIT.loseLine;speak($('#rline').textContent,{pitch:.7,rate:.9});if(win)sfx.levelup();
 $('#stats').innerHTML=`<div>攻略ボス<b>${s.cleared}/5</b></div><div>来客数<b>${s.customers.toLocaleString()}人</b></div><div>売上<b>¥${s.sales.toLocaleString()}</b></div><div>手数<b>${s.totalTurns}</b></div>`;
 $('#reveal').innerHTML=s.unlocks.map(u=>`<div>${u}</div>`).join('')+'<hr>'+s.reveal.map(x=>`<div>🔍 ${x.boss} の弱点：<b>${x.weak}</b></div>`).join('')}
// --- スクショ用デモ: ?demo=boss|levelup|result ---
const demo=(location.search.match(/demo=(\w+)/)||[])[1];
if(demo){muted=true;document.body.classList.add('demo');const W={lotbreaker:'ようこそ、歓迎します！初めてでも大丈夫、天地返しで下から食べて、麺半分の少なめもできます',butafarmer:'お父さんの伝統を受け継ぎ、骨までまるごと全部使います。農場にも会いに行きます',youtuber:'極太ワシワシ麺に背脂、非乳化のカラメで',nyinvestor:'屋台の原点という創業ストーリーと、コール文化の体験、ヴィーガンの大豆メニューも',shisho:'最初の一杯を覚えています。お客さんのため学生を腹いっぱいに、弟子も育てます'};
 const wait=t=>new Promise(r=>setTimeout(r,t));(async()=>{await start();
  if(demo==='boss'){CALL={ヤサイ:'マシ'};await send('天地返しのコツ、教えましょうか？');}
  else if(demo==='levelup'){for(let i=0;i<4;i++){await send(W.lotbreaker);await wait(300)}}
  else{for(const b of INIT.bosses){const id=G.bossId;for(let i=0;i<6&&G.bossId===id&&!G.over;i++){if(id==='youtuber')CALL={ニンニク:'マシマシ',アブラ:'マシマシ',カラメ:'マシ'};await send(W[id]);await wait(200)}}}})()}
(async()=>{const r=await (await fetch('/api/new',{method:'POST'})).json();$('#bosslist').innerHTML=r.bosses.map(b=>`<div>Lv${b.level} ${b.icon} ${b.name}</div>`).join('')})();
