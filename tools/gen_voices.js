// 固定セリフを TTS（TTS_PROVIDER=gemini|xai, 既定 gemini）で事前生成 → public/assets/voice/<char>/<hash>.mp3 + manifest.json
// 使い方: bash -lc 'node tools/gen_voices.js'  （GEMINI_API_KEY/XAI_API_KEY は env。既存ファイルはスキップ。THROTTLE_MS で間隔調整）
const fs=require('fs'),path=require('path');const S=require('../stages.js');const {norm,key,tts,lastStat}=require('../lib/voice');
const F=S.fight,ST=S.stages[0],V=F.tts.speakers,SUP=F.tts.superStyle,OUT=path.join(__dirname,'../public/assets/voice');
const lines=[];const PRI=process.env.PRIORITY_FIRST!=='0';const add=(c,t,sup)=>{t=norm(t);if(t&&!lines.some(l=>l.c===c&&l.t===t))lines.push({c,t,sup})};
for(const r of F.roster){add(r.id,r.line);r.specials.forEach(s=>add(r.id,s.name+'！',1));r.sa.forEach(n=>add(r.id,n+'！',1))}
for(const b of ST.bosses){add(b.id,b.opening);add(b.id,b.win.replace(/^.*?「|」$/g,''));if(F.bosses[b.id])add(b.id,F.bosses[b.id].move+'！',1);
 for(const w of b.weaknesses)for(const h of w.hints){const m=h.match(/^(仕入れBot|接客Bot|常連)/);const k=m?{仕入れBot:'shiire',接客Bot:'sekkyaku',常連:'joren'}[m[1]]:'sekkyaku';add(k,h.replace(/^(仕入れBot|接客Bot|常連)/,'').replace(/^「(.*)」$/,'$1'))}}
try{const mv=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/moves.json'),'utf8'));for(const m of (mv.moves||mv)){if(m&&m.char&&m.name&&V[m.char]){add(m.char,m.name+'！',1);add('announcer',m.name+'、解放！')}}}catch{}
add('announcer','ラウンドワン、ファイト！');add('announcer','ケーオー！');add('announcer','タイムアップ！');
for(const r of F.roster)for(const b of ST.bosses)add('announcer',r.name+' 対 '+b.name);
// 現状: Gemini は必殺技/超必殺/ガチャ技の叫びと実況のみ。その他は xAI（既存mp3を再利用）
if(PRI){const core=['ラウンドワン、ファイト！','ケーオー！','タイムアップ！'];const rank=l=>l.c==='announcer'&&core.includes(l.t)?0:l.c==='announcer'?2:l.sup?1:3;lines.sort((a,b)=>rank(a)-rank(b))}
const spkFor=(c,sup)=>{const s=V[c];return sup?{...s,gemini:{...s.gemini,style:s.gemini.style+'。'+SUP}}:s};
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),TH=+process.env.THROTTLE_MS||7000;
(async()=>{const man={};let chars=0,made=0,skip=0,fail=0,byProv={};
 for(const {c,t,sup} of lines){const v=spkFor(c,sup);const pv=(sup||c==='announcer')?undefined:'xai';const f=`${c}/${key(v,t,pv)}.mp3`,p=path.join(OUT,f);(man[c]??={})[t]=f;
  if(fs.existsSync(p)){skip++;continue}fs.mkdirSync(path.dirname(p),{recursive:true});
  const t0=Date.now();try{const r=await tts(v,t,pv);const want=pv||require('../lib/voice').PROV();const out=r.prov===want?p:path.join(OUT,`${c}/${key(v,t,r.prov)}.mp3`);fs.writeFileSync(out,r.buf);if(out!==p)man[c][t]=path.relative(OUT,out);byProv[r.prov]=(byProv[r.prov]||0)+1;chars+=[...t].length;made++;console.log(made,r.prov,c,t)}catch(e){fail++;console.error('FAIL',c,t,e.message);delete man[c][t]}
  await sleep(Math.max(0,TH-(Date.now()-t0)))}
 fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(man,null,1));
 console.log(`lines=${lines.length} generated=${made} skipped=${skip} failed=${fail} chars=${chars} byProvider=${JSON.stringify(byProv)} retries429=${lastStat.retries429}`)})();
