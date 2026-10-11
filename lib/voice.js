// TTS 共通: テキスト正規化・キャッシュキー・xAI TTS 呼び出し
const crypto=require('crypto');
const norm=t=>String(t||'').replace(/[（(].*?[)）]/g,'').replace(/\s+/g,' ').trim();
const key=(voice,text)=>crypto.createHash('sha1').update(voice+'|ja|'+text).digest('hex').slice(0,16);
async function tts(voice,text){const r=await fetch('https://api.x.ai/v1/tts',{method:'POST',headers:{Authorization:'Bearer '+process.env.XAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({text,voice_id:voice,language:'ja'}),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw new Error('tts '+r.status+' '+(await r.text()).slice(0,200));const b=Buffer.from(await r.arrayBuffer());if(b.length<200)throw new Error('tts short body');return b}
module.exports={norm,key,tts};
