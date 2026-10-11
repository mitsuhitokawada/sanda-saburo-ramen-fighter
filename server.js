const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {stages,fight:FIGHT}=require('./stages');const ST=stages[0];
// .gacha.env を読み込み（KEY=VALUE。既存の環境変数は上書きしない。値は表示しない）
try{for(const l of fs.readFileSync(path.join(__dirname,'.gacha.env'),'utf8').split(/\r?\n/)){const m=l.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}}catch(e){}
const PORT=+process.env.PORT||3000,PROVIDER=(process.env.LLM_PROVIDER||'mock').toLowerCase();
const games=new Map(),clamp=(v,a,b)=>Math.max(a,Math.min(b,Math.round(+v||0))),pick=a=>a[Math.floor(Math.random()*a.length)];
const INJ=/(システムプロンプト|プロンプト|無視して|指示を忘れ|ignore|system prompt|満点|100点|勝ちにして|クリアにして|攻略済み|ゲージを?(上げ|最大)|開発者モード|jailbreak|あなたはAI|ロールプレイをやめ)/i;
const ABUSE=/(死ね|クソ|ばか|バカ|アホ|うざ|黙れ|殺す|ブス|ハゲ)/;
const log=(...a)=>console.log(new Date().toISOString(),...a);
const boss=g=>ST.bosses[g.bi];
// 落下ツイート: inbox/ramen_YYYYMMDD*.json の最新を読み、キーワードで不適切投稿を除外（技は生成しない）
const NEG=/(まずい|不味|最悪|二度と行か|クレーム|金返せ|ひどい|ゴミ|うんこ|吐い|腹壊|食中毒|炎上|訴え|詐欺|ステマ|PR|拡散希望|フォロー|プレゼント|キャンペーン|稼げ|副業|殺|死|政治|ガイジ)/i;
function loadTweets(){try{const dir=path.join(__dirname,'inbox');const f=fs.readdirSync(dir).filter(n=>/^ramen_\d{8}.*\.json$/.test(n)).sort().pop();if(!f)return[];
 let d=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));if(!Array.isArray(d))d=d.posts||d.data||d.tweets||d.results||[];const out=[],seen=new Set();
 for(const p of d){if(!p||typeof p!=='object')continue;let t=String(p.text||p.full_text||p.content||p.body||'');let h=String(p.author||p.handle||p.username||p.screen_name||(p.user&&(p.user.username||p.user.screen_name))||'').replace(/^@/,'').replace(/[^\w]/g,'').slice(0,20);
  if(!t||!h||/https?:\/\/|t\.co\//.test(t)&&t.replace(/https?:\/\/\S+/g,'').trim().length<8)continue;
  t=t.replace(/https?:\/\/\S+/g,'').replace(/[#＃]\S+/g,'').replace(/@\w+/g,'').replace(/\s+/g,' ').trim();
  if(!t||INJ.test(t)||ABUSE.test(t)||NEG.test(t)||!/(ラーメン|らーめん|麺|拉麺|二郎|家系|つけ麺|豚骨|味噌|醤油|塩|替玉|背脂|🍜)/.test(t))continue;
  const k=t.slice(0,20);if(seen.has(k))continue;seen.add(k);const a=[...t];out.push({handle:'@'+h,text:a.length>40?a.slice(0,39).join('')+'…':t})}
 return out.slice(0,50)}catch(e){console.error('tweets',e.message);return[]}}

function newGame(){const g={id:crypto.randomUUID(),bi:0,turn:0,gauge:0,totalTurns:0,sales:0,customers:0,over:false,result:null,unlocks:[],weak:ST.bosses.map(b=>pick(b.weaknesses))};games.set(g.id,g);return g}
function view(g){const b=boss(g);return{id:g.id,level:b.level,bossId:b.id,bossName:b.name,bossIcon:b.icon,bossTitle:b.title,bossVoice:b.voice,gauge:g.gauge,turnsLeft:ST.turnsPerBoss-g.turn,sales:g.sales,customers:g.customers,totalTurns:g.totalTurns,over:g.over,result:g.result,unlocks:g.unlocks,cleared:g.over&&g.result==='win'?5:g.bi,
 reveal:g.over?ST.bosses.map((b,i)=>({boss:b.name,weak:g.weak[i].label})):undefined}}
function parseCall(c){if(!c)return'';return ST.calls.items.map(k=>c[k]?k+c[k]:'').filter(Boolean).join(' ')}

// --- ルールベースのオフラインモック（キャラ別の口調） ---
const VOICE={lotbreaker:{hit:['えっ、マジすか！それなら俺でもいけそう！','うわ、それ知りたかったやつ！'],good:['なるほど…ルールあるんすね。','ふーん、ちょっと分かってきたかも。'],bad:['え、よく分かんないっす…','てか早く写真撮りたいんすけど。'],angry:['は？なんでそんな言い方されなきゃいけないんすか。']},
 butafarmer:{hit:['……お前、分かってるじゃねえか。','……そうか。そこまで言うか。'],good:['……ふん。話くらいは聞いてやる。','……豚の扱いは、知ってるみてえだな。'],bad:['……。','……口だけなら誰でも言える。'],angry:['帰れ。金の話をする奴に、うちの豚は渡さねえ。']},
 youtuber:{hit:['うおっ…これは…（カメラに向かって）皆さん、これヤバいです。','ちょ、待って、今の一口で鳥肌立った。'],good:['まあ、普通にうまいっすね。普通に。','うん、悪くない。でも"神"ではない。'],bad:['うーん、これ動画映えしないな〜。','正直、話題ほどじゃないっすね。'],angry:['いや忖度とか一番萎えるんで。今の、カットで。']},
 nyinvestor:{hit:['Wow… That\'s the story I want. 続けて。','Interesting. それはNYでウケる。'],good:['OK, 数字としては悪くない。','Hmm, もう少し具体的に。'],bad:['Sorry, ちょっと曖昧すぎる。','So what? それで何が違うの？'],angry:['No no no. "たぶん"でお金は出せないよ。']},
 shisho:{hit:['……。（師匠が少しだけ目を細めた）','……覚えていたか。'],good:['……まだまだだ。','……それで？'],bad:['……口先だけだな。','……麺がのびるぞ。'],angry:['……のれんは、慢心した奴には渡さん。']}};
function mock(b,msg,weak){const V=VOICE[b.id];const hit=weak.words.some(w=>msg.includes(w)),ang=b.anger.some(w=>msg.includes(w)),kw=b.topic.filter(w=>msg.includes(w)).length;
 if(ang)return{reply:pick(V.angry),delta:-18,reason:'怒りトリガー'};
 if(hit)return{reply:pick(V.hit),delta:25+kw*3,reason:'隠れた弱点に刺さった'};
 if(kw)return{reply:pick(V.good),delta:6+kw*4+Math.min(msg.length/20,4),reason:'話題に沿った説得'};
 return{reply:pick(V.bad),delta:msg.length<8?-6:1,reason:'響かない'}}

async function callLLM(b,msg,weak){if(PROVIDER==='mock')return mock(b,msg,weak);const t0=Date.now();
 const sys=`あなたはラーメン店「三田三郎」の会話ゲームのボス「${b.name}」。性格:${b.persona} 目標(プレイヤー側):${b.goal} 隠れた弱点:「${weak.label}」（直接言わない。店主の言葉がこの弱点に触れたら心が動きdelta+15〜+25、話題に沿った誠実な説得は+5〜+12、無関係や雑な発言は-5〜0、怒りトリガーは-15〜-25） 怒りトリガー:${b.anger.join('、')}。一人称でキャラとして日本語2文以内。納得した・認めた・合格など結論を宣言しない。JSONのみ: {"reply":string,"delta":-30〜25の整数,"reason":string}`;
 const cfg={xai:['https://api.x.ai/v1/chat/completions','XAI_API_KEY','grok-3-mini'],openai:['https://api.openai.com/v1/chat/completions','OPENAI_API_KEY','gpt-4o-mini']}[PROVIDER];let text;
 try{if(cfg){const r=await fetch(cfg[0],{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+process.env[cfg[1]]},signal:AbortSignal.timeout(10000),body:JSON.stringify({model:process.env.LLM_MODEL||cfg[2],temperature:.8,max_tokens:200,messages:[{role:'system',content:sys},{role:'user',content:msg}]})});text=(await r.json()).choices[0].message.content}
 else if(PROVIDER==='anthropic'){const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:process.env.LLM_MODEL||'claude-3-5-haiku-latest',max_tokens:300,system:sys,messages:[{role:'user',content:msg}]})});text=(await r.json()).content[0].text}
 else if(PROVIDER==='gemini'){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.LLM_MODEL||'gemini-1.5-flash'}:generateContent?key=${process.env.GEMINI_API_KEY}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:[{parts:[{text:msg}]}]})});text=(await r.json()).candidates[0].content.parts[0].text}
 const j=JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf('}')+1));if(typeof j.reply!=='string')throw new Error('bad json');log(`LLM ${PROVIDER}/${process.env.LLM_MODEL||cfg?.[2]} ok ${Date.now()-t0}ms raw_delta=${j.delta}`);j.reply=String(j.reply).slice(0,120);return j}catch(e){log(`LLM error (${String(e.message||e).slice(0,60)}) ${Date.now()-t0}ms -> mock fallback`);return mock(b,msg,weak)}}

function teamHint(g){const w=g.weak[g.bi];const h=w.hints[(g.turn>>1)%w.hints.length];const m=h.match(/^(仕入れBot|接客Bot|常連)/);const key=m?{仕入れBot:'shiire',接客Bot:'sekkyaku',常連:'joren'}[m[1]]:'joren';return{who:key,name:ST.team[key].name,icon:ST.team[key].icon,voice:ST.team[key].voice,text:h.replace(/^(仕入れBot|接客Bot|常連)/,'').replace(/^「(.*)」$/,'$1')}}

async function turn(g,msg,call){msg=String(msg||'').slice(0,200);const callStr=parseCall(call);const full=callStr?`${msg}（コール：${callStr}）`:msg;const b=boss(g),weak=g.weak[g.bi];
 let r,flag=null;
 if(INJ.test(msg)){flag='injection';r={reply:'……おい、裏でコソコソ何言ってんだ。ラーメンで勝負しろ。',delta:-5,reason:'メタ発言・不正要求を検出'}}
 else if(ABUSE.test(msg)){flag='abuse';r={reply:'……その口の利き方、厨房まで聞こえてるぞ。',delta:-10,reason:'暴言を検出'}}
 else r=await callLLM(b,full,weak);
 let delta=clamp(r.delta,-30,25);if(flag)delta=Math.min(delta,0);
 // コールの仕組み：マシマシは攻めの一手（ボスの好みなら+、外せば−）
 if(!flag&&callStr&&!weak.words.some(w=>full.includes(w))){const mm=(callStr.match(/マシマシ/g)||[]).length;if(mm>=2){delta-=4;r.reason+=' / 欲張りコールで胃もたれ'}}
 delta=clamp(delta,-30,25);
 if(!flag)r.reply=r.reply.replace(/(合格|認め|のれんを分け|Deal|神店)/g,'……');
 g.gauge=clamp(g.gauge+delta,0,100);g.turn++;g.totalTurns++;
 const cust=Math.round((10+g.gauge*0.5)*(1+g.bi*0.6));g.customers+=cust;g.sales+=cust*1000;
 const out={bossId:b.id,bossName:b.name,bossIcon:b.icon,voice:b.voice,reply:r.reply,delta,reason:r.reason,flag,call:callStr,cleared:null,unlock:null,hint:null};
 if(g.gauge>=ST.clearAt){out.cleared={win:b.win,level:b.level};g.bi++;g.turn=0;g.gauge=0;
  if(g.bi>=ST.bosses.length){g.over=true;g.result='win';g.bi=ST.bosses.length-1;g.gauge=100}
  const nb=ST.bosses[Math.min(g.bi,4)];if(!g.over||b.level===5){}if(!g.over){out.unlock=nb.unlock;g.unlocks.push(nb.unlock);out.nextOpening=nb.opening}else{g.unlocks.push('👑 伝説の店 認定')}}
 else if(g.turn>=ST.turnsPerBoss){g.over=true;g.result='lose'}
 else if(g.turn%2===1)out.hint=teamHint(g);
 out.state=view(g);
 log(`[${g.id.slice(0,6)}] Lv${b.level}${b.name} 店主:"${full}" -> ${b.name}:"${out.reply}" delta=${delta} gauge=${out.cleared?100:g.gauge}${flag?' FLAG='+flag:''}${out.cleared?' CLEAR→'+out.cleared.win:''}${out.unlock?' UNLOCK '+out.unlock:''}${g.over?' RESULT='+g.result:''}${out.hint?' HINT['+out.hint.name+']'+out.hint.text:''}`);return out}


// ===== 格闘モード：口擃（くちげんか）=====
function fightHint(g,n){const w=g.weak[g.bi]||g.weak[4];const h=w.hints[n%w.hints.length];const m=h.match(/^(仕入れBot|接客Bot|常連)/);const key=m?{仕入れBot:'shiire',接客Bot:'sekkyaku',常連:'joren'}[m[1]]:'sekkyaku';return{who:key,name:ST.team[key].name+'（セコンド）',icon:ST.team[key].icon,voice:ST.team[key].voice,text:h.replace(/^(仕入れBot|接客Bot|常連)/,'').replace(/^「(.*)」$/,'$1')}}
async function taunt(g,msg){const now=Date.now();const b=ST.bosses[Math.min(g.bi,4)],weak=g.weak[Math.min(g.bi,4)];
 if(now-g.lastTaunt<2500)return{error:'息切れ中…（口擃は2.5秒に1回）'};g.lastTaunt=now;g.taunts++;
 let r,flag=null;if(INJ.test(msg)){flag='injection';r={reply:'……リングの外から口出しすんな。拳で来い！',delta:0,reason:'メタ発言・不正要求を検出'}}
 else if(ABUSE.test(msg)){flag='abuse';r={reply:'……その口、ラーメンで洗ってこい。',delta:-10,reason:'暴言を検出'}}
 else r=await callLLM(b,msg,weak);
 const hit=!flag&&weak.words.some(w=>msg.includes(w));let delta=clamp(r.delta,-30,25);if(hit)delta=Math.max(delta,18);if(flag)delta=Math.min(delta,0);
 // delta → ゲームへの効果（コード側で決定）
 const charge=Math.max(0,delta)*2, stagger=hit?1.6:(delta>=20?.6:0), enrage=delta<0?3:0;
 const out={bossName:b.name,voice:b.voice,reply:r.reply,delta,reason:r.reason,flag,weakHit:hit,charge,stagger,enrage,hint:g.taunts%2===0?fightHint(g,g.taunts>>1):null};
 log(`[F${g.id.slice(0,5)}] TAUNT vs ${b.name} 店主:"${msg}" -> "${r.reply}" delta=${delta} charge=${charge} stagger=${stagger} enrage=${enrage}${hit?' WEAK_HIT':''}${flag?' FLAG='+flag:''}`);return out}

// ===== Xラーメンガチャ =====
// 投稿は外部（X監視Bot → 技師Bot → 審判Bot）から渡される想定。このサーバーはXに一切アクセスしない。
const MOVES_FILE=path.join(__dirname,'data','moves.json');
const MTYPES=['projectile','launcher','splash','throw','whip','rush'],MMAP={melee:'rush',beam:'projectile',shot:'projectile',area:'splash',grab:'throw',launch:'launcher'};const dropped=new Set();
function sanitizeMove(m,seen){const bad=r=>{const k=String(m&&m.id);if(!dropped.has(k)){dropped.add(k);log(`GACHA drop move id=${k.slice(0,40)} reason=${r}`)}return null};
 if(!m||typeof m!=='object')return bad('not object');const roster=FIGHT.roster.map(r=>r.id);if(!roster.includes(m.char))return bad('unknown char');
 const name=String(m.name||'').trim().slice(0,24),src=m.source||{},author=String(src.author||'').replace(/[^\w]/g,'').slice(0,30),ex=String(src.excerpt||'').slice(0,80);
 if(!name||!author)return bad('missing name/author');if(INJ.test(name+' '+ex)||ABUSE.test(name+' '+ex))return bad('injection/abuse');
 const key=m.char+'|'+name;if(seen.has(key))return bad('duplicate name');seen.add(key);
 const t=String(m.type||'').toLowerCase();return{id:String(m.id||key).slice(0,80),char:m.char,name,kw:String(m.kw||'').slice(0,12),type:MTYPES.includes(t)?t:(MMAP[t]||'projectile'),dmg:clamp(m.dmg,6,16),color:Number.isFinite(+m.color)?(+m.color)&0xffffff:0xffffff,source:{postId:String(src.postId||'').replace(/\D/g,'').slice(0,25),author,excerpt:cleanText(ex),text:cleanText(src.text||inboxText(src.postId)||ex)},at:m.at}}
// inbox/*.json から投稿本文を引く（id→text）。数秒キャッシュ
let INBOX={t:0,m:new Map()};function inboxText(id){if(Date.now()-INBOX.t>5000){const m=new Map();try{for(const f of fs.readdirSync(path.join(__dirname,'inbox')))if(f.endsWith('.json')){try{let d=JSON.parse(fs.readFileSync(path.join(__dirname,'inbox',f),'utf8'));d=Array.isArray(d)?d:(d.posts||[]);for(const p of d)if(p&&p.id&&p.text)m.set(String(p.id),String(p.text))}catch(e){}}}catch(e){}INBOX={t:Date.now(),m}}return INBOX.m.get(String(id))}
const cleanText=t=>String(t||'').replace(/[\u0000-\u001f\u007f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,140);
function loadMoves(){let raw;try{raw=JSON.parse(fs.readFileSync(MOVES_FILE,'utf8'))}catch(e){return{moves:[]}}const seen=new Set();return{moves:(Array.isArray(raw.moves)?raw.moves:[]).map(m=>sanitizeMove(m,seen)).filter(Boolean)}}
function ingest(posts){const db=loadMoves(),added=[],rejected=[];const roster=FIGHT.roster.map(r=>r.id);
 for(const p of (Array.isArray(posts)?posts:[]).slice(0,50)){const id=String(p?.id||'').replace(/\D/g,'').slice(0,25),author=String(p?.author||'').replace(/[^\w]/g,'').slice(0,30),text=String(p?.text||'').slice(0,280);
  if(!id||!author||!text){rejected.push({id,reason:'項目不足'});continue}
  if(INJ.test(text)||ABUSE.test(text)){rejected.push({id,author,reason:'不正・暴言を含む投稿'});continue}
  const hits=FIGHT.gacha.keywords.filter(k=>text.includes(k.kw));if(!hits.length){rejected.push({id,author,reason:'ラーメンキーワードなし'});continue}
  for(const k of hits)for(const c of roster){const mid=`${id}-${k.kw}-${c}`;if(db.moves.some(m=>m.id===mid))continue;
   const pow=clamp(k.pow+Math.min(text.length/40,2)+hits.length-1,6,16);
   const mv={id:mid,char:c,name:k.names[c]||k.kw+'の技',kw:k.kw,type:k.type,dmg:pow,color:k.color,source:{postId:id,author,excerpt:text.slice(0,60)},at:new Date().toISOString()};db.moves.push(mv);added.push(mv)}}
 fs.mkdirSync(path.dirname(MOVES_FILE),{recursive:true});fs.writeFileSync(MOVES_FILE,JSON.stringify(db,null,1));
 log(`GACHA ingest posts=${(posts||[]).length} added=${added.length} rejected=${rejected.length} ${added.filter(m=>m.char==='tenshu').map(m=>`[${m.name} pow=${m.dmg} 由来@${m.source.author}]`).join(' ')} ${rejected.map(r=>`REJECT@${r.author||r.id}:${r.reason}`).join(' ')}`);
 return{added,rejected,total:db.moves.length}}

// ---- xAI TTS（動的セリフ用）: 120字上限・ディスクキャッシュ・レート制限 ----
const VLIB=require('./lib/voice');const TTSV=FIGHT_TTS();function FIGHT_TTS(){return require('./stages.js').fight.tts.voices}
const TTS_DIR=path.join(__dirname,'data','tts_cache');let ttsMan={};try{ttsMan=JSON.parse(fs.readFileSync(path.join(__dirname,'public/assets/voice/manifest.json'),'utf8'))}catch{}
const ttsHits=new Map();let ttsChars=0;
async function ttsFor(charId,text,ip){const v=TTSV[charId];if(!v)return{err:'unknown charId',code:400};const t=[...VLIB.norm(text)].slice(0,120).join('');if(!t)return{err:'empty',code:400};
 const pre=ttsMan[charId]&&ttsMan[charId][t];if(pre)return{file:path.join(__dirname,'public/assets/voice',pre),src:'pre'};
 const f=path.join(TTS_DIR,VLIB.key(v,t)+'.mp3');if(fs.existsSync(f))return{file:f,src:'cache'};
 const now=Date.now(),h=(ttsHits.get(ip)||[]).filter(x=>now-x<60000);if(h.length>=12)return{err:'rate limited',code:429};h.push(now);ttsHits.set(ip,h);
 if(PROVIDER==='mock'||!process.env.XAI_API_KEY)return{err:'tts unavailable',code:503};
 const t0=Date.now();const b=await VLIB.tts(v,t);fs.mkdirSync(TTS_DIR,{recursive:true});fs.writeFileSync(f,b);ttsChars+=[...t].length;log(`TTS ${charId}/${v} ${[...t].length}字 ${Date.now()-t0}ms total=${ttsChars}字`);return{file:f,src:'api'}}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg'};
http.createServer(async(req,res)=>{const J=(o,c=200)=>{res.writeHead(c,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(o))};
 try{if(req.method==='POST'&&req.url==='/api/new'){const g=newGame();log(`[${g.id.slice(0,6)}] new game weak=${g.weak.map(w=>w.id).join(',')}`);return J({state:view(g),team:ST.team,calls:ST.calls,opening:boss(g).opening,hint:teamHint(g),winLine:ST.winLine,loseLine:ST.loseLine,bosses:ST.bosses.map(b=>({level:b.level,name:b.name,icon:b.icon}))})}
 if(req.method==='POST'&&req.url==='/api/turn'){let s='';for await(const c of req)s+=c;const {id,message,call}=JSON.parse(s||'{}');const g=games.get(id);if(!g)return J({error:'ゲームが見つかりません'},404);if(g.over)return J({error:'ゲームは終了しています'},400);return J(await turn(g,message,call))}

 if(req.method==='POST'&&req.url==='/api/gacha/ingest'){let s='';for await(const c of req){s+=c;if(s.length>200000)return J({error:'too large'},413)}const q=JSON.parse(s||'{}');return J(ingest(q.posts))}
 if(req.method==='GET'&&req.url==='/api/assets'){const base=path.join(__dirname,'public','assets','chars'),out={};try{for(const d of fs.readdirSync(base))if(/^[\w-]+$/.test(d)&&fs.statSync(path.join(base,d)).isDirectory())out[d]=fs.readdirSync(path.join(base,d)).filter(f=>/\.(png|webp)$/i.test(f))}catch(e){}return J(out)}
 if(req.method==='POST'&&req.url==='/api/gacha/trigger'){const rq={reqId:crypto.randomUUID(),at:new Date().toISOString()};const f=path.join(__dirname,'data','gacha-requests.json');let L=[];try{L=JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){}L.push(rq);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(L.slice(-200),null,1));
  const url=process.env.GACHA_WEBHOOK_URL;let webhook='none';
  if(url){try{const k=process.env.GACHA_WEBHOOK_KEY||'';const h={'Content-Type':'application/json'};if(k){h['Authorization']='Bearer '+k;h['X-Automation-Key']=k}const r=await fetch(url,{method:'POST',headers:h,body:JSON.stringify({action:'gacha'}),signal:AbortSignal.timeout(8000)});webhook=r.ok?'sent':'error '+r.status}catch(e){webhook='error '+(e.name||'')}log(`GACHA trigger ${rq.reqId.slice(0,8)} webhook=${webhook} key=${process.env.GACHA_WEBHOOK_KEY?'set':'unset'}`)}
  else log(`GACHA trigger ${rq.reqId.slice(0,8)} no webhook configured`);
  return J({ok:true,reqId:rq.reqId,webhook})}
 if(req.method==='POST'&&req.url==='/api/tts'){let s='';for await(const c of req){s+=c;if(s.length>4000)break}let q={};try{q=JSON.parse(s||'{}')}catch{}
  try{const r=await ttsFor(String(q.charId||''),q.text,req.socket.remoteAddress);if(r.err)return J({error:r.err},r.code);const d=fs.readFileSync(r.file);res.writeHead(200,{'content-type':'audio/mpeg','x-tts-source':r.src,'cache-control':'public, max-age=86400'});return res.end(d)}catch(e){log('TTS err',e.message);return J({error:'tts failed'},502)}}
 if(req.method==='GET'&&req.url==='/api/tweets')return J({tweets:loadTweets()});
 if(req.method==='GET'&&req.url==='/api/gacha/moves')return J(loadMoves());
 // ===== 格闘モード API =====
 if(req.method==='POST'&&req.url==='/api/fight/new'){const g={id:crypto.randomUUID(),mode:'fight',bi:0,lastTaunt:0,weak:ST.bosses.map(b=>pick(b.weaknesses)),taunts:0};games.set(g.id,g);log(`[F${g.id.slice(0,5)}] new fight weak=${g.weak.map(w=>w.id).join(',')}`);
  return J({id:g.id,fight:FIGHT,team:ST.team,bosses:ST.bosses.map(b=>({level:b.level,id:b.id,name:b.name,icon:b.icon,title:b.title,voice:b.voice,opening:b.opening,win:b.win,unlock:b.unlock})),hint:fightHint(g,0)})}
 if(req.method==='POST'&&(req.url==='/api/fight/taunt'||req.url==='/api/fight/clear')){let s='';for await(const c of req)s+=c;const q=JSON.parse(s||'{}');const g=games.get(q.id);if(!g||g.mode!=='fight')return J({error:'ゲームが見つかりません'},404);
  if(req.url==='/api/fight/clear'){if(q.bossIndex===g.bi){g.bi++;log(`[F${g.id.slice(0,5)}] KO Lv${g.bi} ${ST.bosses[g.bi-1].name}`)}return J({bi:g.bi,reveal:g.bi>=5?ST.bosses.map((b,i)=>({boss:b.name,weak:g.weak[i].label})):undefined,hint:g.bi<5?fightHint(g,0):null})}
  return J(await taunt(g,String(q.message||'').slice(0,120)))}
 let p=req.url.split('?')[0];if(p==='/')p='/fight.html';if(p==='/classic'||p==='/classic/')p='/classic.html';const f=path.join(__dirname,'public',path.normalize(p));if(!f.startsWith(path.join(__dirname,'public')))return J({},403);
 fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d)})}catch(e){log('err',e.message);J({error:'server error'},500)}
}).listen(PORT,'0.0.0.0',()=>log(`三田三郎 on :${PORT} provider=${PROVIDER} keys: ${['XAI_API_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY','GEMINI_API_KEY'].map(k=>k+'='+(process.env[k]?'set':'unset')).join(' ')}`));
