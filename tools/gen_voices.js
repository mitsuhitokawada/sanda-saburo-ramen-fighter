// 固定セリフを xAI TTS で事前生成 → public/assets/voice/<char>/<hash>.mp3 + manifest.json
// 使い方: bash -lc 'node tools/gen_voices.js'  （XAI_API_KEY は env。既存ファイルはスキップ）
const fs=require('fs'),path=require('path');const S=require('../stages.js');const {norm,key,tts}=require('../lib/voice');
const F=S.fight,ST=S.stages[0],V=F.tts.voices,OUT=path.join(__dirname,'../public/assets/voice');
const lines=[];const add=(c,t)=>{t=norm(t);if(t&&!lines.some(l=>l.c===c&&l.t===t))lines.push({c,t})};
for(const r of F.roster){add(r.id,r.line);r.specials.forEach(s=>add(r.id,s.name));r.sa.forEach(n=>add(r.id,n+'！'))}
for(const b of ST.bosses){add(b.id,b.opening);add(b.id,b.win.replace(/^.*?「|」$/g,''));if(F.bosses[b.id])add(b.id,F.bosses[b.id].move);
 for(const w of b.weaknesses)for(const h of w.hints){const m=h.match(/^(仕入れBot|接客Bot|常連)/);const k=m?{仕入れBot:'shiire',接客Bot:'sekkyaku',常連:'joren'}[m[1]]:'sekkyaku';add(k,h.replace(/^(仕入れBot|接客Bot|常連)/,'').replace(/^「(.*)」$/,'$1'))}}
try{const mv=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/moves.json'),'utf8'));for(const m of (mv.moves||mv)){if(m&&m.char&&m.name&&V[m.char]){add(m.char,m.name);add('announcer',m.name+'、解放！')}}}catch{}
add('announcer','ラウンドワン、ファイト！');add('announcer','ケーオー！');add('announcer','タイムアップ！');
for(const r of F.roster)for(const b of ST.bosses)add('announcer',r.name+' 対 '+b.name);
(async()=>{const man={};let chars=0,made=0,skip=0;
 for(const {c,t} of lines){const v=V[c];const f=`${c}/${key(v,t)}.mp3`,p=path.join(OUT,f);(man[c]??={})[t]=f;
  if(fs.existsSync(p)){skip++;continue}fs.mkdirSync(path.dirname(p),{recursive:true});
  try{fs.writeFileSync(p,await tts(v,t));chars+=[...t].length;made++}catch(e){console.error('FAIL',c,t,e.message);delete man[c][t]}}
 fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(man,null,1));
 console.log(`lines=${lines.length} generated=${made} skipped=${skip} chars_spent=${chars} est=$${(chars*15/1e6).toFixed(4)}`)})();
