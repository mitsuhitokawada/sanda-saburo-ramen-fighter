// TTS 共通: テキスト正規化・キャッシュキー・Gemini/xAI TTS 呼び出し
// TTS_PROVIDER=gemini|xai（既定 gemini）。gemini 失敗時は xAI にフォールバック。
const crypto=require('crypto'),{execFileSync}=require('child_process');
const PROV=()=>(process.env.TTS_PROVIDER||'gemini').toLowerCase();
const GMODELS=()=>(process.env.GEMINI_TTS_MODEL?[process.env.GEMINI_TTS_MODEL]:[]).concat(['gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview','gemini-3.8-flash-tts']).filter((v,i,a)=>a.indexOf(v)===i);
const norm=t=>String(t||'').replace(/[（(].*?[)）]/g,'').replace(/\s+/g,' ').trim();
// spk = {gemini:{voice,style}, xai:'voice_id'}
const key=(spk,text,prov=PROV())=>{const id=prov==='gemini'&&spk.gemini?`gemini|${spk.gemini.voice}|${spk.gemini.style}`:`${spk.xai||spk}`;return crypto.createHash('sha1').update(id+'|ja|'+text).digest('hex').slice(0,16)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function xai(voice,text){const r=await fetch('https://api.x.ai/v1/tts',{method:'POST',headers:{Authorization:'Bearer '+process.env.XAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({text,voice_id:voice,language:'ja'}),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw new Error('xai tts '+r.status+' '+(await r.text()).slice(0,200));const b=Buffer.from(await r.arrayBuffer());if(b.length<200)throw new Error('tts short body');return b}
function toMp3(buf,mime){const raw=/wav/i.test(mime)?['-f','wav']:['-f','s16le','-ar',(String(mime).match(/rate=(\d+)/)||[,'24000'])[1],'-ac','1'];
 return execFileSync('ffmpeg',['-hide_banner','-loglevel','error',...raw,'-i','pipe:0','-codec:a','libmp3lame','-b:a','64k','-f','mp3','pipe:1'],{input:buf,maxBuffer:64<<20})}
let lastStat={retries429:0};
async function gemini(g,text,{retries=6}={}){if(!process.env.GEMINI_API_KEY)throw new Error('no GEMINI_API_KEY');
 const prompt=`Say in Japanese, speaking as: ${g.style}. Speak ONLY the quoted line, with strong emotion and intonation: 「${text}」`;
 const models=GMODELS();let err;
 for(let a=0;a<retries;a++){const model=models[Math.min(Math.floor(a/2),models.length-1)];
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:g.voice}}}}}),signal:AbortSignal.timeout(60000)}).catch(e=>({ok:false,status:0,text:async()=>e.message}));
  if(r.status===429||r.status>=500||r.status===0){lastStat.retries429+=r.status===429;const body=await r.text();err=new Error('gemini '+r.status+' '+body.slice(0,160));if(/PerDay/.test(body)){lastStat.daily=(lastStat.daily||0)+1;a=Math.max(a,Math.floor(a/2)*2+1);continue}const m=err.message.match(/retry in ([\d.]+)s/i);await sleep(m?Math.min(+m[1]*1000+500,65000):Math.min(4000*2**a,40000));continue}
  if(!r.ok)throw new Error('gemini '+r.status+' '+(await r.text()).slice(0,200));
  const d=await r.json();const p=d.candidates?.[0]?.content?.parts?.find(x=>x.inlineData)?.inlineData;
  if(!p){err=new Error('gemini no audio '+(d.candidates?.[0]?.finishReason||''));await sleep(1000);continue}
  const mp3=toMp3(Buffer.from(p.data,'base64'),p.mimeType);const dur=+execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0','-i','pipe:0'],{input:mp3}).toString();
  if(dur>2+0.4*[...text].length){err=new Error('gemini audio too long ('+dur.toFixed(1)+'s, likely read the style prompt)');continue}
  return mp3}
 throw err}
async function tts(spk,text,force){const prov=force||PROV();
 if(prov==='gemini'&&spk.gemini){try{return {buf:await gemini(spk.gemini,text),prov:'gemini'}}catch(e){if(!process.env.XAI_API_KEY||!spk.xai)throw e;console.error('gemini tts failed, fallback xai:',e.message)}}
 return {buf:await xai(spk.xai||spk,text),prov:'xai'}}
module.exports={norm,key,tts,gemini,xai,PROV,lastStat};
