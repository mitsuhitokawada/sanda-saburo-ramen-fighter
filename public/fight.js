import * as THREE from './vendor/three.module.js';
const $=s=>document.querySelector(s);
const Q=new URLSearchParams(location.search),DEMO=Q.get('demo'),REC=Q.get('rec')==='1';if(DEMO)document.body.classList.add('demo');
let INIT=null,muted=!!DEMO,AC=null;
// ================= 音 =================
function tone(f,t,d,type='square',v=.08,f2){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;const s=AC.currentTime+t;if(f2)o.frequency.exponentialRampToValueAtTime(f2,s+d);g.gain.value=v;o.connect(g).connect(AC.destination);o.start(s);g.gain.exponentialRampToValueAtTime(.001,s+d);o.stop(s+d)}catch(e){}}
const sfx={hit(){if(!muted){tone(180,0,.12,'square',.12,60)}},block(){if(!muted)tone(900,0,.06,'triangle',.08)},whiff(){if(!muted)tone(400,0,.08,'sine',.04,200)},ticket(){if(!muted){tone(1200,0,.07);tone(900,.09,.07)}},
 special(){if(!muted){tone(300,0,.4,'sawtooth',.08,1200);tone(600,.05,.3,'square',.05,1800)}},sa(){if(!muted)[262,330,392,523,659,784].forEach((f,i)=>tone(f,i*.07,.4,'sawtooth',.07))},ko(){if(!muted){tone(120,0,1.2,'sawtooth',.15,30)}},levelup(){if(!muted)[523,659,784,1047,1319].forEach((f,i)=>tone(f,i*.11,.35,'triangle',.12))},select(){if(!muted)tone(700,0,.05,'square',.06)}};
function ssSpeak(text,v){if(!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.pitch=v?.pitch??1;u.rate=v?.rate??1;const jv=speechSynthesis.getVoices().find(x=>x.lang.startsWith('ja'));if(jv)u.voice=jv;speechSynthesis.speak(u)}
// TTS（Gemini/xAI）: 事前生成mp3（manifest）→ /api/tts（動的・サーバーキャッシュ）→ speechSynthesis の順。常に1本だけ再生（重ならない）
let VMAN={};fetch('/assets/voice/manifest.json').then(r=>r.ok?r.json():{}).then(m=>VMAN=m).catch(()=>{});
const VA=new Audio();let vseq=0;const vnorm=t=>String(t||'').replace(/[（(].*?[)）]/g,'').replace(/\s+/g,' ').trim();
window.__voice={speak:(...a)=>speak(...a),get man(){return VMAN},VA};
function stopVoice(){vseq++;try{VA.pause()}catch{}window.speechSynthesis?.cancel()}
async function speak(text,v,cid){if(muted)return;const t=vnorm(text);if(!t)return;stopVoice();const my=vseq;
 try{let url;const pre=cid&&VMAN[cid]?.[t];if(pre)url='/assets/voice/'+pre;else if(cid){const r=await fetch('/api/tts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({charId:cid,text:t})});if(!r.ok)throw new Error('tts '+r.status);url=URL.createObjectURL(await r.blob())}else throw new Error('no voice');
  if(my!==vseq||muted)return;VA.src=url;await VA.play()}catch(e){if(my===vseq&&!muted)ssSpeak(t,v)}}

// ================= ピクセルスプライト =================
function drawChar(ctx,c,pose,f=0){ctx.clearRect(0,0,32,48);const R=(x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(x,y,w,h)};const o='#1a1008';
 let dx=pose==='hit'?-2:0,dy=pose==='crouch'||pose==='lowp'||pose==='lowk'||pose==='cguard'?8:0;const C=c.colors;
 // 脚
 if(pose==='kick'||pose==='over'){R(11,28,5,14,C.pants);R(17+dx,25,14,5,C.pants);R(30,24,2,7,o)}
 else if(pose==='lowk'){R(10,36,5,8,C.pants);R(15,40,16,4,C.pants);R(30,39,2,5,o)}
 else if(pose==='jump'){R(11,28,5,8,C.pants);R(17,28,5,8,C.pants);R(10,36,6,2,o);R(17,36,6,2,o)}
 else if(dy){R(9,38,6,6,C.pants);R(18,38,6,6,C.pants);R(8,44,7,2,o);R(18,44,7,2,o)}
 else{const w=pose==='walk'?(f?2:-2):0;R(11+dx-w,28,5,15,C.pants);R(17+dx+w,28,5,15,C.pants);R(10+dx-w,43,7,3,o);R(17+dx+w,43,7,3,o)}
 const by=dy;
 // 胴
 R(10+dx,14+by,12,15-(dy?1:0),C.body);R(10+dx,26+by,12,2,C.accent);if(c.tie)R(15+dx,15+by,2,9,C.accent);
 if(c.id==='tenshu'||c.id==='deshi')R(12+dx,18+by,8,10,'#f4f4f4');
 // 頭
 R(11+dx,4+by,10,10,C.skin);R(11+dx,3+by,10,3,C.hair);R(11+dx,3+by,2,7,C.hair);R(18+dx,8+by,2,2,o);R(17+dx,12+by,3,1,'#a33');
 if(c.glasses){R(15+dx,7+by,6,3,o);R(16+dx,8+by,2,1,'#6cf')}if(c.beard)R(12+dx,11+by,9,4,C.hair);
 if(c.hat==='towel'){R(10+dx,3+by,12,3,'#fff');R(9+dx,4+by,2,4,C.accent)}else if(c.hat==='cap'){R(10+dx,1+by,12,4,C.accent);R(21+dx,4+by,5,2,C.accent)}else if(c.hat==='straw'){R(6+dx,4+by,20,2,'#d9b55a');R(11+dx,1+by,10,4,'#e8c96a')}
 // 腕
 const arm=(x,y,w,h)=>{R(x,y,w,h,C.body);};
 if(pose==='punch'||pose==='lowp'){R(8+dx,16+by,3,9,C.body);arm(21,16+by,9,3);R(29,15+by,4,5,C.skin)}
 else if(pose==='special'||pose==='sa'){arm(21,15+by,9,3);arm(21,19+by,9,3);R(29,14+by,3,9,C.skin)}
 else if(pose==='guard'||pose==='cguard'){arm(20+dx,10+by,3,10);arm(23+dx,11+by,3,9);R(20+dx,9+by,6,3,C.skin)}
 else if(pose==='throw'){arm(21,8+by,4,9);R(21,5+by,5,4,C.skin);R(8,8+by,3,9,C.body)}
 else if(pose==='hit'){R(6+dx,10,3,10,C.body);R(21+dx,12,3,9,C.body)}
 else{const s=pose==='idle'&&f?1:0;R(8+dx,15+by+s,3,11,C.body);R(21+dx,15+by+s,3,11,C.body);R(8+dx,25+by+s,3,3,C.skin);R(21+dx,25+by+s,3,3,C.skin)}
 // 輪郭（簡易）
 const im=ctx.getImageData(0,0,32,48),d=im.data,out=new Uint8ClampedArray(d);for(let y=0;y<48;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;if(d[i+3])continue;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+a,Y=y+b;if(X<0||Y<0||X>31||Y>47)continue;if(d[(Y*32+X)*4+3]){out[i]=26;out[i+1]=16;out[i+2]=8;out[i+3]=255;break}}}im.data.set(out);ctx.putImageData(im,0,0)}
const POSES=['idle','idle1','walk','walk1','punch','kick','over','crouch','lowp','lowk','guard','cguard','hit','jump','special','sa','throw'];
// ---- 外部キャラ画像（public/assets/chars/<id>/*.png）。無ければ手続き生成にフォールバック ----
let ASSETS={};const IMG={};
const POSEFILE={idle:['idle'],idle1:['idle2','idle'],walk:['walk','idle'],walk1:['walk2','walk','idle'],punch:['punch','attack','idle'],kick:['kick','attack','idle'],over:['overhead','kick','attack','idle'],crouch:['crouch','idle'],lowp:['lowpunch','crouch','attack','idle'],lowk:['lowkick','crouch','attack','idle'],guard:['guard','idle'],cguard:['crouchguard','guard','crouch','idle'],hit:['hit','idle'],jump:['jump','idle'],special:['special','attack','idle'],sa:['super','special','attack','idle'],throw:['throw','attack','idle'],ko:['ko','hit','idle']};
function assetFor(id,names){const L=ASSETS[id]||[];for(const n of names){const f=L.find(x=>x.replace(/\.\w+$/,'')===n);if(f)return`/assets/chars/${id}/${f}`}return null}
const IMGD={};function loadImg(u){return IMG[u]||(IMG[u]=new Promise(r=>{const i=new Image();i.onload=()=>{IMGD[u]=i;r(i)};i.onerror=()=>r(null);i.src=u}))}
async function loadAssets(){try{ASSETS=await (await fetch('/api/assets')).json()}catch(e){ASSETS={}}const all=[];for(const id in ASSETS)for(const f of ASSETS[id])all.push(loadImg(`/assets/chars/${id}/${f}`));await Promise.all(all)}
function applyAssets(c,t){for(const p of Object.keys(POSEFILE)){const u=assetFor(c.id,POSEFILE[p]);if(!u)continue;const exact=u.includes('/'+POSEFILE[p][0]+'.');const put=img=>{if(!img)return;t._fb=t._fb||{};t._fb[p]=!exact;t._img=true;const tx=new THREE.Texture(img);tx.needsUpdate=true;tx.magFilter=THREE.NearestFilter;tx.minFilter=THREE.LinearFilter;tx.colorSpace=THREE.SRGBColorSpace;tx.canvas=img;t[p]=tx};if(IMGD[u])put(IMGD[u]);else loadImg(u).then(put)}}
function makeTextures(c){const t={};for(const p of POSES){const cv=document.createElement('canvas');cv.width=32;cv.height=48;const base=p.replace(/1$/,'');drawChar(cv.getContext('2d'),c,base,p.endsWith('1')?1:0);const tx=new THREE.CanvasTexture(cv);tx.magFilter=tx.minFilter=THREE.NearestFilter;tx.colorSpace=THREE.SRGBColorSpace;t[p]=tx;t[p].canvas=cv}t.ko=t.hit;applyAssets(c,t);return t}
function portrait(cv,c,lock){const x=cv.getContext('2d');const pu=assetFor(c.id,cv.width===cv.height?['portrait','idle']:['vs','idle']);if(pu){loadImg(pu).then(img=>{if(!img)return;x.clearRect(0,0,cv.width,cv.height);x.imageSmoothingEnabled=true;const s=Math.min(cv.width/img.width,cv.height/img.height);x.drawImage(img,(cv.width-img.width*s)/2,(cv.height-img.height*s)/2,img.width*s,img.height*s);if(lock){x.globalCompositeOperation='source-atop';x.fillStyle='#000';x.fillRect(0,0,cv.width,cv.height);x.globalCompositeOperation='source-over'}})}const tmp=document.createElement('canvas');tmp.width=32;tmp.height=48;drawChar(tmp.getContext('2d'),c,'idle');x.imageSmoothingEnabled=false;x.clearRect(0,0,cv.width,cv.height);
 if(cv.width===cv.height)x.drawImage(tmp,6,0,20,20,0,0,cv.width,cv.height);else x.drawImage(tmp,0,0,cv.width,cv.height);if(lock){x.globalCompositeOperation='source-atop';x.fillStyle='#000';x.fillRect(0,0,cv.width,cv.height);x.globalCompositeOperation='source-over'}}

// ================= three.js：HD-2D レンダラ =================
const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:!!DEMO});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;$('#gl').append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(30,1,.1,200);
let rt;const postMat=new THREE.ShaderMaterial({uniforms:{t:{value:null},res:{value:new THREE.Vector2(1,1)},focus:{value:.42},band:{value:.16},amt:{value:1}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`uniform sampler2D t;uniform vec2 res;uniform float focus,band,amt;varying vec2 v;
 void main(){float k=smoothstep(band,band+.32,abs(v.y-focus))*amt;vec2 px=1./res*(res.y/700.);vec3 c=texture2D(t,v).rgb,acc=c,bl=vec3(0.);float n=1.;
 for(int i=0;i<12;i++){float a=float(i)*2.39996;float r=sqrt(float(i)+.5)/3.5;vec2 o=vec2(cos(a),sin(a))*r;vec3 s=texture2D(t,v+o*px*6.*k).rgb;acc+=s;n+=1.;vec3 b=texture2D(t,v+o*px*22.).rgb;bl+=max(b-.62,0.);}
 vec3 col=acc/n+bl*.16;float vg=smoothstep(1.15,.35,length(v-.5));col*=mix(.55,1.,vg);col=pow(col,vec3(.95));gl_FragColor=vec4(col,1.);}`});
const pq=new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat),pscene=new THREE.Scene(),pcam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);pscene.add(pq);
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();const pr=renderer.getPixelRatio();rt?.dispose();rt=new THREE.WebGLRenderTarget(w*pr,h*pr,{samples:0});rt.texture.colorSpace=THREE.SRGBColorSpace;postMat.uniforms.res.value.set(w*pr,h*pr)}
addEventListener('resize',resize);resize();
let scene=new THREE.Scene();
function render(){postMat.uniforms.t.value=rt.texture;renderer.setRenderTarget(rt);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(pscene,pcam)}

// ---- テクスチャ部品 ----
function ctex(w,h,fn,rep){const cv=document.createElement('canvas');cv.width=w;cv.height=h;fn(cv.getContext('2d'),w,h);const t=new THREE.CanvasTexture(cv);t.magFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...rep)}return t}
const wood=(a,b)=>ctex(32,32,(x)=>{x.fillStyle=a;x.fillRect(0,0,32,32);x.fillStyle=b;for(let i=0;i<4;i++){x.fillRect(0,i*8,32,1);x.fillRect((i*13)%32,i*8,1,8)}},[10,4]);
const sign=(txt,bg,fg,w=256,h=64,fs=40)=>ctex(w,h,(x)=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle=fg;x.font=`900 ${fs}px "Noto Sans CJK JP",sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,w/2,h/2+2)});
const box=(w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m};
const lam=(o)=>new THREE.MeshLambertMaterial(o),emi=(c)=>new THREE.MeshBasicMaterial({color:c});
let steams=[],lights=[];
function lantern(g,x,y,z,col=0xff3322){const l=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.7,8),emi(col));l.position.set(x,y,z);g.add(l);const p=new THREE.PointLight(col,6,9,1.6);p.position.set(x,y-.3,z+.4);g.add(p);lights.push({p,base:6,ph:Math.random()*9})}
function steamAt(g,x,y,z){for(let i=0;i<7;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({color:0xffffff,transparent:true,opacity:.25,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.set(x,y,z);s.userData={x,y,z,t:i/7};g.add(s);steams.push(s)}}
function buildStage(theme){const g=new THREE.Group();steams=[];lights=[];
 const sky={shop:0x2a160c,farm:0xf0a060,studio:0x0a0a18,ny:0x0b1530,dojo:0x1c140c}[theme];scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,18,46);
 g.add(new THREE.HemisphereLight(0xffeedd,0x332211,theme==='studio'||theme==='ny'?.7:1.0));const sun=new THREE.DirectionalLight(theme==='farm'?0xffc080:0xffe0b0,1.4);sun.position.set(-6,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-14,right:14,top:10,bottom:-6});g.add(sun);
 const floorT={shop:wood('#7a4a26','#5a3418'),farm:ctex(16,16,(x)=>{x.fillStyle='#5c9a3a';x.fillRect(0,0,16,16);x.fillStyle='#4c8a2a';x.fillRect(3,5,2,2);x.fillRect(11,11,2,2)},[30,12]),studio:ctex(16,16,(x)=>{x.fillStyle='#222';x.fillRect(0,0,16,16);x.fillStyle='#333';x.fillRect(0,0,8,8);x.fillRect(8,8,8,8)},[30,12]),ny:ctex(16,16,(x)=>{x.fillStyle='#444';x.fillRect(0,0,16,16);x.fillStyle='#555';x.fillRect(0,7,16,2)},[30,12]),dojo:ctex(32,16,(x)=>{x.fillStyle='#c9b46a';x.fillRect(0,0,32,16);x.fillStyle='#3a5a2a';x.fillRect(0,0,32,1);x.fillRect(0,0,1,16)},[14,10])}[theme];
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(60,24),lam({map:floorT}));fl.rotation.x=-Math.PI/2;fl.position.z=-4;fl.receiveShadow=true;g.add(fl);
 if(theme==='shop'||theme==='dojo'){const wall=box(40,10,.4,lam({map:theme==='dojo'?ctex(16,16,(x)=>{x.fillStyle='#f3ead0';x.fillRect(0,0,16,16);x.fillStyle='#6a4a2a';x.fillRect(0,0,16,1);x.fillRect(0,0,1,16)},[20,6]):wood('#8a5a32','#6a3e1e')}),0,5,-7);g.add(wall);
  const nb=box(6,1.6,.2,lam({map:sign('三田三郎','#f5d000','#111',256,64,48)}),0,6.3,-6.7);g.add(nb);
  if(theme==='shop'){g.add(box(18,1.2,1.4,lam({map:wood('#a06a3a','#7a4a26')}),0,.6,-5));for(let i=-3;i<=3;i++){const st=new THREE.Mesh(new THREE.CylinderGeometry(.35,.3,.9,8),lam({color:0xc0392b}));st.position.set(i*2.4,.45,-3.8);st.castShadow=true;g.add(st)}
   ['ニンニク入れますか？','ヤサイ','アブラ','カラメ','食券はこちら'].forEach((t,i)=>g.add(box(2.6,.7,.1,lam({map:sign(t,'#fff8e0','#a00',256,64,30)}),-8+i*4,4.2,-6.75)));
   const kenki=box(1.4,2.6,1,lam({color:0xdddddd}),-11,1.3,-4.5);g.add(kenki);g.add(box(1.1,.8,.05,emi(0x66ccff),-11,1.9,-3.98));
   for(let i=0;i<3;i++){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,1.3,12),lam({color:0x999999}));pot.position.set(-3+i*3,1.85,-5.6);g.add(pot);steamAt(g,-3+i*3,2.6,-5.6)}}
  else{const pot=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,3,16),lam({color:0x888888}));pot.position.set(0,1.5,-5.5);g.add(pot);steamAt(g,0,3.2,-5.5);for(let i=-2;i<=2;i++)g.add(box(1.4,3.2,.1,lam({map:sign(['麺','豚','脂','汁','魂'][i+2],'#1a1a1a','#f5d000',64,128,56)}),i*3.2+(i?0:9),6,-6.6))}
  [-9,-4.5,4.5,9].forEach(x=>lantern(g,x,5.4,-4.2));}
 if(theme==='farm'){g.add(box(14,6,6,lam({color:0xa0322a}),-6,3,-14));g.add(box(14.5,.6,6.5,lam({color:0xeeeeee}),-6,6.3,-14));for(let i=-12;i<12;i+=1.2)g.add(box(.2,1.2,.2,lam({color:0xe8d8b0}),i,.6,-6));g.add(box(24,.15,.15,lam({color:0xe8d8b0}),0,1,-6));
  for(let i=0;i<4;i++)g.add(box(1.6,1.2,1.2,lam({color:0xe0c060}),5+i*1.8,.6,-7.5+(i%2)));const s=new THREE.Mesh(new THREE.SphereGeometry(3,16,12),emi(0xffd27a));s.position.set(12,9,-30);g.add(s);lantern(g,8,3,-4,0xffaa44)}
 if(theme==='studio'){for(let i=-1;i<=1;i+=2){const r=new THREE.Mesh(new THREE.TorusGeometry(1.4,.12,8,32),emi(0xffffff));r.position.set(i*7,4,-4);g.add(r);const p=new THREE.PointLight(0xffffff,8,12);p.position.set(i*7,4,-3);g.add(p);lights.push({p,base:8,ph:i})}
  g.add(box(6,1.6,.2,emi(0xff2244),0,6,-8));g.add(box(5.6,1.2,.25,lam({map:sign('● LIVE 配信中','#ff2244','#fff',256,64,36)}),0,6,-7.85));for(let i=0;i<14;i++){const c=box(.3,.3,.3,emi([0x00ffff,0xff00ff,0xffff00][i%3]),-13+i*2,8,-9);g.add(c)}lantern(g,0,5,-3,0xff44ff)}
 if(theme==='ny'){const win=ctex(16,32,(x)=>{x.fillStyle='#1a2238';x.fillRect(0,0,16,32);for(let yy=1;yy<32;yy+=4)for(let xx=1;xx<16;xx+=4){x.fillStyle=Math.random()<.55?'#ffd27a':'#2a3450';x.fillRect(xx,yy,2,2)}},[1,1]);
  for(let i=-6;i<=6;i++){const h=8+((i*37)%7+7)%7*2.5;const b=box(3.2,h,3,new THREE.MeshLambertMaterial({map:win,emissive:0xffffff,emissiveMap:win,emissiveIntensity:.7}),i*3.6,h/2,-14-(i%2)*3);g.add(b)}
  g.add(box(3,1.2,1.5,lam({color:0xf5c400}),9,.7,-6));g.add(box(5,2,.2,lam({map:sign('MITA SABURO NY','#c9a227','#111',256,64,30)}),-5,5,-8));[-8,0,8].forEach(x=>lantern(g,x,5,-5,0xffcc66))}
 return g}

// ================= キャラクター =================
class Fighter{constructor(cfg,isBoss){this.cfg=cfg;this.isBoss=isBoss;this.tex=makeTextures(cfg);this.mat=new THREE.MeshLambertMaterial({map:this.tex.idle,transparent:true,alphaTest:.5,side:THREE.DoubleSide});
 this.art=!!assetFor(cfg.id,['idle']);this.H=this.art?3.7:3.6;this.mesh=new THREE.Mesh(this.art?new THREE.PlaneGeometry(3.7,3.7):new THREE.PlaneGeometry(2.4,3.6),this.mat);this.mesh.castShadow=true;this.mesh.position.y=1.8;this.g=new THREE.Group();this.g.add(this.mesh);
 const sh=new THREE.Mesh(new THREE.CircleGeometry(.8,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.35}));sh.rotation.x=-Math.PI/2;sh.position.y=.02;this.g.add(sh);this.reset(isBoss?4:-4)}
 reset(x){this.x=x;this.y=0;this.vy=0;this.face=this.isBoss?-1:1;this.hp=this.maxhp=this.cfg.hp||100;this.state='idle';this.st=0;this.atk=null;this.stun=0;this.cool=0;this.guarding=0;this.crouch=false;this.enrage=0;this.t=0;this.ko=false;this.mesh.rotation.z=0}
 pose(p){if(this.tex[p]&&this.mat.map!==this.tex[p]){this.mat.map=this.tex[p]}}
 sync(){this.g.position.set(this.x,this.y,0);let p=this.state;
  if(p==='idle')p=(Math.floor(this.t*3)%2)?'idle1':'idle';if(p==='walk')p=(Math.floor(this.t*8)%2)?'walk1':'walk';if(this.ko)p='ko';
  if(this.state==='attack')p=this.atk.pose;if(this.y>0.05&&this.state!=='attack'&&!this.ko)p='jump';if(this.guarding&&this.state!=='hit')p=this.crouch?'cguard':'guard';if(this.crouch&&p==='idle')p='crouch';this.pose(p);
  const fb=this.tex._fb&&this.tex._fb[p];let ox=0,rz=0,sy=1,sx=1,glow=0;const hh=this.H/2;
  if(fb){const T=this.state==='attack'?this.atk.t:0;const lunge=Math.min(1,T*8);
   if(['punch','kick','over','throw'].includes(p)){ox=.45*lunge;rz=-.14*lunge}else if(['lowp','lowk'].includes(p)){ox=.4*lunge;sy=.82;rz=-.08}else if(p==='crouch'||p==='cguard'){sy=.8}
   else if(p==='special'||p==='sa'){ox=.3;sx=sy=1.08;glow=.12+.08*Math.sin(this.t*30);rz=-.06}else if(p==='hit'){ox=-.3;rz=.18}else if(p==='guard'){ox=-.12;rz=.07}else if(p==='walk1'){sy=.98}else if(p==='idle1'){sy=1.015}}
  this.mesh.scale.set(this.face*sx,sy,1);this.mesh.position.x=this.face*ox;
  this.mesh.rotation.z=this.ko?this.face*Math.PI/2*Math.min(1,this.st*3):this.face*rz;this.mesh.position.y=this.ko?(this.art?.9:.7):hh*sy;this.gl=glow;const fl=this.flash>0?.8:(this.gl||0);this.mat.emissive.setRGB(1,this.flash>0?1:.85,this.flash>0?1:.4);this.mat.emissiveIntensity=fl}}

// ================= ゲーム状態 =================
const G={phase:'title',bi:0,me:null,boss:null,timer:60,mashi:6,burn:0,sa:0,combo:0,comboT:0,hitstop:0,shake:0,fx:[],orbit:false,orbitA:0,camX:0,frozen:0,total:{dmg:0,combo:0,taunts:0,time:0},chosen:0,keys:{}};
const BOSSCFG=()=>{const b=INIT.bosses[G.bi],f=INIT.fight.bosses[b.id];return{...f,id:b.id,name:b.name}};
function hud(){const m=G.me,b=G.boss;$('#hp1').style.width=Math.max(0,m.hp/m.maxhp*100)+'%';$('#hp2').style.width=Math.max(0,b.hp/b.maxhp*100)+'%';$('#timer').textContent=Math.ceil(G.timer);
 $('#mg').innerHTML=Array.from({length:6},(_,i)=>`<i class="${G.mashi>=i+1?'f':''}"></i>`).join('');$('#mg').classList.toggle('burn',G.burn>0);
 $('#sa1').style.width=(G.sa%100)+'%';const lv=Math.floor(G.sa/100);$('#san').textContent=`SA Lv${lv}${lv>=3?' MAX':''}`;if(lv>=3)$('#sa1').style.width='100%'}
function bubble(f,text,me){const e=document.createElement('div');e.className='bub'+(me?' me':'');e.innerHTML=`<small>${me?'店主の口擃':f.cfg.name}</small>`;e.append(text);$('#bubbles').append(e);e._f=f;e._t=DEMO?99:4.2;return e}
function banner(t){const b=$('#banner');b.textContent=t;b.classList.remove('hidden');b.style.animation='none';b.offsetHeight;b.style.animation='';if(!DEMO)setTimeout(()=>b.classList.add('hidden'),1200)}
function flash(){const f=$('#flash');f.style.opacity=.7;setTimeout(()=>f.style.opacity=0,60);if(DEMO)f.style.opacity=0}
function second(h){if(!h)return;const s=$('#second');s.innerHTML=`<small>${h.icon} ${h.name}</small>`;s.append(h.text);s.classList.remove('hidden');speak(h.text,h.voice,h.who)}

// ---- 攻撃定義（high/low/overhead） ----
const NORM={punch:{pose:'punch',start:.05,act:.12,rec:.18,range:1.7,dmg:5,h:'high'},kick:{pose:'kick',start:.1,act:.14,rec:.28,range:2.2,dmg:8,h:'high'},over:{pose:'over',start:.25,act:.12,rec:.3,range:2,dmg:9,h:'over'},lowp:{pose:'lowp',start:.05,act:.1,rec:.18,range:1.6,dmg:4,h:'low'},lowk:{pose:'lowk',start:.1,act:.14,rec:.3,range:2.3,dmg:7,h:'low'},throw:{pose:'throw',start:.08,act:.08,rec:.4,range:1.6,dmg:12,h:'throw'}};
function startAtk(f,a,extra){if(f.state==='attack'||f.stun>0||f.ko)return;f.state='attack';f.atk={...a,...extra,t:0,hit:false}}
function fxBox(x,y,col,life=.4,s=.6){const m=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.set(x,y,.3);scene.add(m);G.fx.push({m,life,max:life,vx:(Math.random()-.5)*6,vy:Math.random()*6,spin:1});return m}
function sparks(x,y,col,n=10){for(let i=0;i<n;i++)fxBox(x,y,col,.35+Math.random()*.25,.18+Math.random()*.2)}
function damage(att,def,dmg,h,opts={}){if(def.ko)return;const guardOK=def.guarding&&h!=='throw'&&!opts.unblock&&!(h==='low'&&!def.crouch)&&!(h==='over'&&def.crouch);
 const px=def.x-att.face*.3,py=def.y+(h==='low'?.8:2.2);
 if(guardOK){dmg*=.15;sfx.block();sparks(px,py,0x66ccff,6);def.x+=att.face*.25;if(!def.isBoss)G.mashi=Math.max(0,G.mashi-.25)}
 else{sfx.hit();sparks(px,py,opts.col||0xffdd66,opts.big?26:12);def.stun=opts.stun||.35;def.state='hit';def.flash=.08;def.x+=att.face*(opts.kb||.5);if(opts.launch){def.vy=opts.launch}G.hitstop=opts.big?.2:.07;G.shake=opts.big?.5:.18;
  if(att===G.me){G.combo=G.comboT>0?G.combo+1:1;G.comboT=.9;G.total.combo=Math.max(G.total.combo,G.combo);if(G.combo>=2){const c=$('#combo');c.textContent=`${G.combo} HIT COMBO!`;c.classList.remove('hidden')}G.sa=Math.min(300,G.sa+dmg*1.2)}else G.sa=Math.min(300,G.sa+dmg*.8)}
 dmg*=att.enrage>0?1.3:1;if(att.isBoss)dmg*=(att.cfg.dmg||1);def.hp-=dmg;if(att===G.me)G.total.dmg+=dmg;
 if(def.hp<=0){def.hp=0;KO(def)}}
// ---- 必殺技・SA ----
function special(f,sp,lvl=0){const isSA=lvl>0;const col=sp.color??0xffffff;sfx.special();if(f===G.me&&!DEMO||DEMO)banner((isSA?`SA${lvl} `:'')+sp.name+'！');if(!isSA)speak(sp.name+'！',f.cfg.voice,f.cfg.id);if(sp.source)toast('<small>📡 元のポスト</small>'+quoteCard(sp));
 const tgt=f===G.me?G.boss:G.me,dmg=(sp.dmg||10)*(isSA?1.6+lvl*.7:1),dist=Math.abs(tgt.x-f.x);startAtk(f,{pose:isSA?'sa':'special',start:.15,act:.01,rec:.35,range:0,dmg:0,h:'high'});
 const o={col,big:isSA||sp.type==='throw',stun:isSA?1.1:.6};
 if(sp.type==='projectile'||isSA&&lvl===1){const m=fxBox(f.x+f.face*1.2,2.2,col,3,isSA?1.4:.8);m.material.opacity=1;const L=new THREE.PointLight(col,10,7);m.add(L);G.fx[G.fx.length-1]={m,life:3,max:3,proj:{v:f.face*(isSA?14:10),owner:f,dmg,o}};}
 else if(sp.type==='launcher'){const x=tgt.x;for(let i=0;i<6;i++){const c=fxBox(x,.4+i*.6,col,1.2,.9);G.fx[G.fx.length-1].vx=0;G.fx[G.fx.length-1].vy=2}if(dist<7)setTimeout(()=>damage(f,tgt,dmg,'high',{...o,launch:10}),DEMO?0:150)}
 else if(sp.type==='splash'){sparks(f.x+f.face*1.8,1.6,col,40);if(dist<3.4)damage(f,tgt,dmg,'low',o)}
 else if(sp.type==='throw'){if(dist<2.4){damage(f,tgt,dmg,'throw',{...o,launch:12,kb:2.5});tgt.x=f.x-f.face*1.5;}else sfx.whiff()}
 else if(sp.type==='whip'){for(let i=1;i<9;i++)fxBox(f.x+f.face*i*.6,2.1+Math.sin(i)*.3,col,.5,.35);if(dist<5.5)damage(f,tgt,dmg,'high',{...o,kb:1.4})}
 else if(sp.type==='rush'){f.x+=f.face*Math.min(dist-1.2,5);sparks(f.x,1.5,col,20);if(dist<6.5)damage(f,tgt,dmg,'high',{...o,kb:2})}
 if(isSA){if(lvl>=2){for(let i=0;i<40;i++)fxBox(tgt.x+(Math.random()-.5)*4,Math.random()*5,[0xff00ff,0xffcc00,0x66ffff][i%3],1,.4);damage(f,tgt,dmg*.5,'high',{...o,unblock:lvl>=3,big:true})}}}
function cutin(f,name,lvl){const c=$('#cutin');c.classList.remove('gacha');$('#cutq').innerHTML='';portrait($('#cutc'),f.cfg);$('#cutl').textContent=`SUPER ART Lv${lvl}`;$('#cutn').textContent=name;c.classList.remove('hidden');sfx.sa();G.frozen=DEMO?0:1.0;if(!DEMO)setTimeout(()=>c.classList.add('hidden'),1000)}
function useSA(lvl){const m=G.me;if(G.sa<lvl*100||m.state==='attack'||m.stun>0)return;G.sa-=lvl*100;const nm=m.cfg.sa[lvl-1];cutin(m,nm,lvl);speak(nm+'！',m.cfg.voice,m.cfg.id);setTimeout(()=>special(m,{name:nm,type:lvl===1?'projectile':lvl===2?'rush':'launcher',dmg:14,color:[0xff66ff,0xffcc00,0xff3300][lvl-1]},lvl),DEMO?0:1000)}
function useSpecial(i){const m=G.me,sp=m.cfg.specials[i];if(!sp||m.state==='attack'||m.stun>0||m.ko)return;if(G.mashi<1){banner('マシマシ切れ！');return}G.mashi-=1;if(G.mashi<=0){G.burn=4}special(m,sp)}

// ---- KO ----
function KO(f){if(f.ko)return;f.ko=true;f.st=0;sfx.ko();speak('ケーオー！',null,'announcer');G.hitstop=.5;G.shake=.8;flash();$('#bigtext').textContent='K.O.';$('#bigtext').classList.remove('hidden');G.phase='ko';G.koT=0;G.winner=f===G.boss?'me':'boss'}
async function afterKO(){$('#bigtext').classList.add('hidden');$('#combo').classList.add('hidden');
 if(G.winner==='me'){const b=INIT.bosses[G.bi];const r=await post('/api/fight/clear',{id:INIT.id,bossIndex:G.bi});speak(b.win.replace(/^.*?「|」$/g,''),b.voice,b.id);
  const next=INIT.bosses[G.bi+1];const p=$('#pop');p.innerHTML=`<span class="l">Lv${b.level} クリア！ ${next?'→ Lv'+next.level:''}</span>${next?next.unlock:'👑 伝説の店 認定！'}<span class="w">${b.win}</span><button id="nx">${next?'次の相手へ':'結果を見る'}</button>`;p.classList.remove('hidden');sfx.levelup();confetti();
  G.reveal=r.reveal;G.nextHint=r.hint;$('#nx').onclick=()=>{p.classList.add('hidden');if(next){G.bi++;vsSplash()}else result(true)}}
 else result(false)}
function confetti(){for(let i=0;i<60;i++)fxBox((Math.random()-.5)*14,6+Math.random()*3,[0xffd000,0xff3355,0x33ddff,0xffffff][i%4],2.5,.25)}
function result(win){G.phase='result';$('#hud').classList.add('hidden');$('#taunt').classList.add('hidden');$('#second').classList.add('hidden');$('#result').classList.remove('hidden');
 $('#rtitle').textContent=win?'🏆 のれん分け達成！伝説の三田三郎':'🌙 閉店ガラガラ…';$('#rline').textContent=win?INIT.fight.winLine||'五人のボスを拳と口擃で制した！':`Lv${G.bi+1} ${INIT.bosses[G.bi].name} に敗北。仕込みからやり直しだ。`;
 $('#stats').innerHTML=`<div>撃破ボス<b>${G.bi+(win?1:0)}/5</b></div><div>総ダメージ<b>${Math.round(G.total.dmg)}</b></div><div>最大コンボ<b>${G.total.combo} HIT</b></div><div>口擃<b>${G.total.taunts}回</b></div>`;
 $('#reveal').innerHTML=(G.reveal||[]).map(x=>`<div>🔍 ${x.boss} の弱点：<b>${x.weak}</b></div>`).join('')}

// ---- 試合開始 ----
let stageGroup=null;
function startFight(){scene=new THREE.Scene();stageGroup=buildStage(BOSSCFG().stage);scene.add(stageGroup);
 const pc={...INIT.fight.roster[G.chosen],hp:100};const gm=myGacha(pc.id).at(-1);pc.gacha=myGacha(pc.id);if(gm)pc.specials=[...pc.specials,{key:'5',name:gm.name,type:gm.type,dmg:gm.dmg,color:gm.color,src:gm.source.author,source:gm.source}];G.me=new Fighter(pc,false);G.boss=new Fighter(BOSSCFG(),true);scene.add(G.me.g,G.boss.g);
 G.timer=INIT.fight.roundTime;G.mashi=6;G.burn=0;G.combo=0;G.fx=[];G.phase='fight';$('#bubbles').innerHTML='';$('#p1name').textContent='🧑‍🍳 '+pc.name;$('#bossname').textContent=INIT.bosses[G.bi].icon+' '+INIT.bosses[G.bi].name;$('#lvl').textContent=`Lv${G.bi+1} ${INIT.bosses[G.bi].title}`;
 ['#hud','#taunt'].forEach(s=>$(s).classList.remove('hidden'));$('#select').classList.add('hidden');$('#title').classList.add('hidden');banner('ROUND 1  FIGHT!');showGuide(6000);const b=INIT.bosses[G.bi];bubble(G.boss,b.opening);speak('ラウンドワン、ファイト！',null,'announcer');setTimeout(()=>speak(b.opening,b.voice,b.id),1700);setTimeout(()=>second(G.bi===0?INIT.hint:G.nextHint),DEMO?0:2500);hud()}
function vsSplash(){$('#guide').classList.add('hidden');$('#guide').classList.remove('sel');G.phase='vs';const me=INIT.fight.roster[G.chosen],b=BOSSCFG();portrait($('#vsl'),me);portrait($('#vsr'),b);$('#vsln').textContent=me.name;$('#vsrn').textContent=INIT.bosses[G.bi].name;$('#vsst').textContent=`Lv${G.bi+1}　${INIT.bosses[G.bi].title}`;$('#title').classList.add('hidden');$('#vs').classList.remove('hidden');$('#select').classList.add('hidden');sfx.sa();speak(me.name+' 対 '+INIT.bosses[G.bi].name,{pitch:.7,rate:1},'announcer');if(!DEMO)setTimeout(()=>{$('#vs').classList.add('hidden');startFight()},2200)}

// ---- ボスAI ----
function bossAI(dt){const b=G.boss,m=G.me;if(b.ko||m.ko)return;b.ai=(b.ai||0)-dt;b.spT=(b.spT??5)-dt;b.guarding=0;b.crouch=false;
 if(b.stun>0)return;const d=m.x-b.x,ad=Math.abs(d);b.face=Math.sign(d)||b.face;const c=b.cfg,ag=c.aggro+(b.enrage>0?.2:0);
 if(m.state==='attack'&&ad<2.6&&Math.random()<.5*ag){b.guarding=1;b.crouch=m.atk.h==='low';return}
 if(b.state==='attack')return;
 if(b.spT<=0&&ad>3){b.spT=6+Math.random()*4;special(b,{name:c.move,type:'projectile',dmg:9,color:c.moveColor});return}
 if(b.ai>0){if(b.mv)b.x+=b.mv*c.speed*dt;return}b.ai=.22+Math.random()*.25;b.mv=0;
 if(ad>2)b.mv=Math.sign(d)*(Math.random()<ag+.3?1:-.3);else if(Math.random()<ag){const pick=['punch','kick','lowk','over','throw','lowp'][Math.floor(Math.random()*6)];startAtk(b,NORM[pick])}else b.mv=-Math.sign(d)*.5}

// ---- 更新 ----
function step(dt){pollPad();if(G.jbuf&&G.me&&G.me.state!=='attack'&&G.phase==='fight'){G.jbuf=false;easyAttack()}G.t=(G.t||0)+dt;steams.forEach(s=>{const u=s.userData;u.t=(u.t+dt*.35)%1;s.position.set(u.x+Math.sin(u.t*6+u.x)*.3,u.y+u.t*3,u.z);s.scale.setScalar(.6+u.t*1.6);s.material.opacity=.28*(1-u.t)});lights.forEach(l=>l.p.intensity=l.base*(.85+.15*Math.sin(G.t*7+l.ph)+.05*Math.random()));
 for(let i=G.fx.length-1;i>=0;i--){const e=G.fx[i];e.life-=dt;if(e.proj){e.m.position.x+=e.proj.v*dt;e.m.rotation.x+=dt*8;const tg=e.proj.owner===G.me?G.boss:G.me;if(Math.abs(e.m.position.x-tg.x)<.9&&!tg.ko&&tg.y<1.5){damage(e.proj.owner,tg,e.proj.dmg,'high',e.proj.o);e.life=0}}else{e.m.position.x+=e.vx*dt;e.m.position.y+=e.vy*dt;e.vy-=12*dt;e.m.rotation.y+=dt*5}
  e.m.material.opacity=Math.max(0,e.life/e.max);if(e.life<=0){scene.remove(e.m);G.fx.splice(i,1)}}
 if(G.phase==='ko'){G.koT+=dt;G.me.flash-=dt;G.boss.flash-=dt;G.boss.st+=dt;G.me.st+=dt;[G.me,G.boss].forEach(f=>{f.vy-=25*dt;f.y=Math.max(0,f.y+f.vy*dt);f.sync()});if(G.koT>2.2&&!G.koDone){G.koDone=true;afterKO()}return}
 if(G.phase!=='fight')return;
 if(G.frozen>0){G.frozen-=dt;return}if(G.hitstop>0){G.hitstop-=dt;return}
 G.timer-=dt;G.total.time+=dt;if(G.timer<=0){G.timer=0;KO(G.me.hp/G.me.maxhp>=G.boss.hp/G.boss.maxhp?G.boss:G.me)}
 G.comboT-=dt;if(G.comboT<=0&&G.combo){G.combo=0;$('#combo').classList.add('hidden')}
 if(G.burn>0){G.burn-=dt;if(G.burn<=0)G.mashi=1}else G.mashi=Math.min(6,G.mashi+dt*.22);
 const m=G.me,b=G.boss,K=G.keys;const typing=document.activeElement===$('#tmsg');
 m.face=Math.sign(b.x-m.x)||1;
 if(m.stun<=0&&m.state!=='attack'&&!typing){const dir=(K.d?1:0)-(K.a?1:0);m.crouch=!!K.s;m.guarding=(dir===-m.face)?1:0;
  if(!m.crouch&&dir&&!(m.guarding&&m.y===0)){m.x+=dir*4.6*dt;m.state='walk'}else if(m.guarding&&!m.crouch){m.x-=m.face*1.5*dt;m.state='idle'}else m.state='idle';if(K.w&&m.y===0)m.vy=10}
 for(const f of[m,b]){f.t+=dt;f.flash=(f.flash||0)-dt;f.enrage-=dt;if(f.stun>0){f.stun-=dt;if(f.stun<=0&&f.state==='hit')f.state='idle'}
  if(f.state==='attack'){const a=f.atk;a.t+=dt;const o=f===m?b:m;if(!a.hit&&a.range&&a.t>=a.start&&a.t<=a.start+a.act){if(Math.abs(o.x-f.x)<a.range&&Math.abs(o.y-f.y)<2){a.hit=true;damage(f,o,a.dmg,a.h,a.h==='throw'?{kb:2,big:true,launch:6}:{})}}if(a.t>a.start+a.act+a.rec)f.state='idle'}
  f.vy-=25*dt;f.y=Math.max(0,f.y+f.vy*dt);if(f.y===0)f.vy=0;f.x=Math.max(-9,Math.min(9,f.x))}
 if(Math.abs(m.x-b.x)<1){const p=(1-Math.abs(m.x-b.x))/2;m.x-=m.face*p;b.x+=m.face*p}
 bossAI(dt);m.sync();b.sync();hud()}
function camUpdate(dt){const t=G.t||0;if(G.phase==='select'){camera.position.set(1.4+Math.sin(t*.2)*.3,2.4,11);camera.lookAt(1.4,1.7,0);postMat.uniforms.focus.value=.5;postMat.uniforms.band.value=.3;return}
 const mid=G.me?(G.me.x+G.boss.x)/2:0;G.camX+=(mid-G.camX)*Math.min(1,dt*3);const sh=G.shake>0?(G.shake-=dt,G.shake):0;
 if(G.orbit){G.orbitA+=dt*.6;const r=15;camera.position.set(G.camX+Math.sin(G.orbitA)*r,4.5+Math.sin(G.orbitA*.5),Math.cos(G.orbitA)*r)}else camera.position.set(G.camX+Math.sin(t*.4)*.35+(Math.random()-.5)*sh*.6,3.4+Math.sin(t*.3)*.12+(Math.random()-.5)*sh*.6,15.5);
 camera.lookAt(G.camX,1.9,0);if(G.me){const q=Math.atan2(camera.position.x-G.camX,camera.position.z);[G.me,G.boss].forEach(f=>f.g.rotation.y=q)}postMat.uniforms.focus.value=.42;postMat.uniforms.band.value=.16}
function bubbles(dt){document.querySelectorAll('.bub').forEach(e=>{e._t-=dt;if(e._t<=0)return e.remove();const f=e._f;const v=new THREE.Vector3(f.x,f.y+3.9,0).project(camera);e.style.left=Math.max(14,Math.min(86,(v.x+1)*50))+'%';e.style.top=((1-v.y)*50)+'%'})}
let last=performance.now();function loop(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(!DEMO){step(dt);if(G.phase==='select')selStep(dt)}camUpdate(DEMO?0:dt);bubbles(DEMO?0:dt);render();requestAnimationFrame(loop)}

// ================= キャラクターセレクト（3Dボクセル） =================
let sel=null;
function voxelModel(c){const cv=document.createElement('canvas');cv.width=32;cv.height=48;const x=cv.getContext('2d');drawChar(x,c,'idle');const d=x.getImageData(0,0,32,48).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;
 const depth=3,geo=new THREE.BoxGeometry(.1,.1,.1),mat=new THREE.MeshStandardMaterial({roughness:.6,metalness:.1}),im=new THREE.InstancedMesh(geo,mat,n*depth);const M=new THREE.Matrix4(),col=new THREE.Color();let k=0;
 for(let y=0;y<48;y++)for(let xx=0;xx<32;xx++){const i=(y*32+xx)*4;if(!d[i+3])continue;col.setRGB(d[i]/255,d[i+1]/255,d[i+2]/255,THREE.SRGBColorSpace);const z0=(xx>9&&xx<23&&y>2)?depth:1;for(let z=0;z<z0;z++){M.makeTranslation((xx-16)*.1,(47-y)*.1,(z-(z0-1)/2)*.1);im.setMatrixAt(k,M);im.setColorAt(k,col);k++}}im.count=k;im.castShadow=true;return im}
function buildSelect(){scene=new THREE.Scene();scene.background=new THREE.Color(0x120a06);scene.fog=new THREE.Fog(0x120a06,12,30);steams=[];lights=[];
 scene.add(new THREE.HemisphereLight(0xffeedd,0x221100,.6));const sp=new THREE.SpotLight(0xfff0cc,60,20,.5,.5,1.2);sp.position.set(0,9,4);sp.target.position.set(0,0,0);sp.castShadow=true;scene.add(sp,sp.target);
 const rim=new THREE.PointLight(0xff5500,20,10);rim.position.set(-3,3,-2);scene.add(rim);const rim2=new THREE.PointLight(0x3366ff,14,10);rim2.position.set(3,2,-2);scene.add(rim2);
 const ped=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2,.5,24),new THREE.MeshStandardMaterial({color:0x332211,roughness:.4,metalness:.5}));ped.position.y=.25;ped.receiveShadow=true;scene.add(ped);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.9,.05,8,48),emi(0xf5d000));ring.rotation.x=Math.PI/2;ring.position.y=.52;scene.add(ring);
 const bk=buildStage('shop');bk.position.set(0,0,-6);bk.scale.setScalar(.8);scene.add(bk);scene.background=new THREE.Color(0x120a06);
 const holder=new THREE.Group();holder.position.set(0,.5,0);scene.add(holder);sel={holder,i:0,model:null}}
function selShow(i){sel.i=i;const c=INIT.fight.roster[i];if(sel.model)sel.holder.remove(sel.model);const iu=assetFor(c.id,['select','idle']);
 if(iu){const g=new THREE.Group();const tx=new THREE.TextureLoader().load(iu);tx.colorSpace=THREE.SRGBColorSpace;tx.magFilter=THREE.NearestFilter;const m=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.4),new THREE.MeshLambertMaterial({map:tx,transparent:true,alphaTest:.4,side:THREE.DoubleSide}));m.position.y=1.7;g.add(m);sel.model=g}else{sel.model=voxelModel(c);sel.model.scale.setScalar(.55)}sel.holder.add(sel.model);
 document.querySelectorAll('.cell').forEach((e,j)=>e.classList.toggle('on',j===i));$('#cname').textContent=c.name;$('#calias').textContent='通り名：'+c.alias;
 const st=(l,v)=>`<div class="st"><b>${l}</b>${Array.from({length:5},(_,k)=>`<i class="${k<v?'':'off'}"></i>`).join('')}</div>`;$('#cstats').innerHTML=st('パワー',c.stats.power)+st('スピード',c.stats.speed)+st('マシマシ度',c.stats.mashi);
 $('#csp').innerHTML='必殺技：'+c.specials.map(s=>`[${s.key}] ${s.name}`).join('　')+`<br>超必殺：<b>${c.sa[2]}</b>`;$('#cline').textContent='「'+c.line+'」';showGacha(c);sfx.select();speak(c.line,c.voice,c.id)}
function selStep(dt){if(sel?.model)sel.model.rotation.y+=dt*.8;G.t=(G.t||0)+dt}
function openSelect(){G.phase='select';showGuide();$('#guide').classList.add('sel');$('#title').classList.add('hidden');$('#select').classList.remove('hidden');buildSelect();const grid=$('#grid');grid.innerHTML='';
 INIT.fight.roster.forEach((c,i)=>{const e=document.createElement('div');e.className='cell';const cv=document.createElement('canvas');cv.width=cv.height=160;portrait(cv,c);e.append(cv);e.insertAdjacentHTML('beforeend',`<span>${c.name}</span>`);e.onmouseenter=()=>selShow(i);e.onclick=()=>selShow(i);grid.append(e)});
 INIT.bosses.forEach(b=>{const e=document.createElement('div');e.className='cell lock';const cv=document.createElement('canvas');cv.width=cv.height=160;portrait(cv,{...INIT.fight.bosses[b.id],id:b.id},true);e.append(cv);e.insertAdjacentHTML('beforeend',`<span>？？？</span>`);e.title=b.name+'（ボス・未解放）';grid.append(e)});selShow(0)}
$('#pick').onclick=()=>{G.chosen=sel.i;G.bi=0;vsSplash()};

// ================= 入力 =================
const post=(u,b)=>fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b||{})}).then(r=>r.json());
const ARW={arrowleft:'a',arrowright:'d',arrowup:'w',arrowdown:'s'};
addEventListener('keydown',e=>{if(document.activeElement===$('#tmsg')){if(e.key==='Escape')$('#tmsg').blur();return}let k=e.key.toLowerCase();if(ARW[k]){e.preventDefault();k=ARW[k]}if(e.repeat&&'jkl'.includes(k))return;G.keys[k]=true;press(k)});
// ---- かんたん操作：J=攻撃(連打で自動コンボ) / K=必殺(方向で変化・X技がランダム) / L=超必殺 / 後ろ=自動ガード ----
const CHAIN=['punch','punch','kick'];
function mash(){const n=performance.now();G.mt=(G.mt||[]).filter(t=>n-t<1000);G.mt.push(n);if(G.mt.length>=4){G.sa=Math.min(300,G.sa+4);G.mashi=Math.min(6,G.mashi+.06);if(!G.mbT||n-G.mbT>1500){G.mbT=n;banner('連打ボーナス！')}}}
function easyAttack(){const m=G.me;if(m.ko)return;if(m.state==='attack'){G.jbuf=true;return}const now=G.t||0;if(now-(G.lastJ||-9)>.7)G.chain=0;G.lastJ=now;
 if(G.chain>=CHAIN.length){G.chain=0;if(G.mashi>=1){easySpecial(true);return}}const mv=CHAIN[G.chain++];startAtk(m,K('s')?(mv==='kick'?NORM.lowk:NORM.lowp):NORM[mv])}
function easySpecial(fromCombo){const m=G.me;const sp=m.cfg.specials;const fwd=K(m.face>0?'d':'a'),back=K(m.face>0?'a':'d');let i=K('s')?3:fwd?1:back?2:0;
 const gm=m.cfg.gacha||[];if(gm.length&&Math.random()<.35){const g=gm[Math.floor(Math.random()*gm.length)];if(m.state==='attack'||m.stun>0)return;if(G.mashi<1){banner('マシマシ切れ！');return}G.mashi-=1;const TY=['projectile','launcher','splash','throw','whip','rush'];special(m,{source:g.source,name:g.name,type:TY.includes(g.type)?g.type:(g.type==='melee'?'rush':'projectile'),dmg:Math.max(6,Math.min(16,+g.dmg||10)),color:g.color});toast(`📡 X由来の技！「${g.name}」<small>@${g.source.author}</small>`);return}
 if(fromCombo)m.state='idle';useSpecial(Math.min(i,sp.length-1))}
function easySuper(){const lv=Math.min(3,Math.floor(G.sa/100));if(lv>=1)useSA(lv);else banner('SAゲージが足りない！')}
function press(k){
 if(G.phase==='select'){if(k==='d')selShow((sel.i+1)%INIT.fight.roster.length);if(k==='a')selShow((sel.i+INIT.fight.roster.length-1)%INIT.fight.roster.length);if(k==='enter'||k==='j')$('#pick').click();return}
 if(G.phase==='title'&&(k==='enter'||k==='j')){$('#start').click();return}
 if(k==='m'){muted=!muted;stopVoice()}if(k==='c'){G.orbit=!G.orbit;banner(G.orbit?'📷 カメラ回転：これは本物の3D':'📷 カメラ戻す')}
 if(G.phase!=='fight')return;hideGuide();
 if(k==='enter'){$('#tmsg').focus();return}if(k==='v'){$('#mic').click();return}
 if('jkl'.includes(k))mash();
 if(k==='j')easyAttack();if(k==='k')easySpecial();if(k==='l')easySuper();
 // 旧操作（任意）
 if(k==='g')startAtk(G.me,NORM.throw);if('1234'.includes(k))useSpecial(+k-1);if(k==='5')useSpecial(4);if(k==='u')useSA(1);if(k==='i')useSA(2);if(k==='o')useSA(3)}
// ---- ゲームパッド（標準マッピング）：十字/左スティック=移動、A=攻撃 B=必殺 X/Y/RB=超必殺 START=決定 ----
const PADMAP={0:'j',1:'k',2:'l',3:'l',5:'l',9:'enter'};let padPrev={};
function pollPad(){const gp=navigator.getGamepads?.()[0];if(!gp)return;const ax=gp.axes[0]||0,ay=gp.axes[1]||0,b=i=>gp.buttons[i]?.pressed;
 G.keys.a=ax<-.5||b(14);G.keys.d=ax>.5||b(15);G.keys.w=ay<-.6||b(12);G.keys.s=ay>.6||b(13);
 for(const i in PADMAP){const on=b(+i);if(on&&!padPrev[i])press(PADMAP[i]);padPrev[i]=on}
 if(G.phase==='select'){for(const [i,k] of [[14,'a'],[15,'d']]){const on=b(i);if(on&&!padPrev['s'+i])press(k);padPrev['s'+i]=on}}}
// ---- 操作ガイド ----
function guideHTML(){return `<div class="gt">かんたん操作</div><div class="gr"><span class="kc">←</span><span class="kc">→</span><b>移動</b><span class="kc">↑</span><b>ジャンプ</b><span class="kc">↓</span><b>しゃがみ</b></div>
<div class="gr"><span class="kc big">J</span><b>攻撃<small>連打で自動コンボ！</small></b><span class="kc big">K</span><b>必殺技<small>方向キーで変化</small></b><span class="kc big">L</span><b>超必殺<small>ゲージMAXで</small></b></div>
<div class="gr"><span class="kc">←</span><b>相手と逆に押すと自動ガード</b><span class="kc">Enter</span><b>口擃（声は V）</b><span class="kc">🎮</span><b>パッドOK</b></div>`}
function showGuide(t){const g=$('#guide');g.innerHTML=guideHTML();g.classList.remove('hidden');clearTimeout(G.gT);if(t&&!DEMO)G.gT=setTimeout(hideGuide,t)}
function hideGuide(){if(G.phase==='fight'&&!DEMO)$('#guide').classList.add('hidden')}
const K=k=>G.keys[k];addEventListener('keyup',e=>{let k=e.key.toLowerCase();G.keys[ARW[k]||k]=false});
// 口擃（テキスト/音声）→ サーバーLLM/モック → delta(clamp済) → ゲージ・よろけ
async function taunt(msg){if(!msg||G.phase!=='fight')return;G.total.taunts++;bubble(G.me,msg,true);sfx.ticket();const r=await post('/api/fight/taunt',{id:INIT.id,message:msg});if(r.error){banner(r.error);return r}
 bubble(G.boss,r.reply);speak(r.reply,r.voice,INIT.bosses[Math.min(G.bi,4)].id);G.sa=Math.min(300,G.sa+r.charge);G.mashi=Math.min(6,G.mashi+r.charge/25);
 if(r.stagger){G.boss.stun=r.stagger;G.boss.state='hit';banner('グラッ！ 弱点に刺さった！');sparks(G.boss.x,3,0xff66ff,20)}else if(r.enrage){G.boss.enrage=r.enrage;banner(r.flag?'🛡 反則！ ゲージ増加なし':'😡 ボス激昂！')}else if(r.flag)banner('🛡 反則判定：ゲージ増加なし');
 if(r.hint)setTimeout(()=>second(r.hint),1500);hud();return r}
$('#taunt').onsubmit=e=>{e.preventDefault();const v=$('#tmsg').value.trim();$('#tmsg').value='';$('#tmsg').blur();taunt(v)};
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null;if(SR){rec=new SR();rec.lang='ja-JP';rec.onresult=e=>{taunt(e.results[0][0].transcript)};rec.onend=rec.onerror=()=>$('#mic').classList.remove('on')}
$('#mic').onclick=()=>{if(!rec){banner('音声入力は未対応：Enterで文字入力');return}$('#mic').classList.add('on');try{rec.start()}catch(e){}};
$('#start').onclick=()=>{sfx.select();openSelect()};$('#again').onclick=()=>location.reload();

// ================= 起動 =================
(async()=>{await loadAssets();INIT=await post('/api/fight/new');$('#bosslist').innerHTML=INIT.bosses.map(b=>`<div>Lv${b.level} ${b.icon} ${b.name}</div>`).join('');
 scene=new THREE.Scene();scene.add(buildStage('shop'));camera.position.set(0,3.4,15.5);camera.lookAt(0,1.9,0);
 if(DEMO)await demo();if(!REC)requestAnimationFrame(loop);else render()})();
window.__frame=dt=>{window.__advance(dt*1000);step(dt);if(G.phase==='select')selStep(dt);camUpdate(dt);bubbles(dt);render()};
// ---- スクショ用デモ（決定論的に数フレーム進めて静止） ----
async function demo(){const b=+(Q.get('b')||0);const run=(s)=>{for(let i=0;i<s*60;i++)step(1/60)};
 if(DEMO==='title'){steams.length&&run(1);return}
 if(DEMO==='select'){await loadGacha();openSelect();if(Q.get('g')){await $('#gbtn').onclick();}selShow(+(Q.get('c')||0));sel.model.rotation.y=.6;return}
 G.chosen=+(Q.get('c')||0);G.bi=b;if(DEMO==='vs'){vsSplash();return}
 startFight();$('#second').classList.add('hidden');if(!Q.get('guide'))$('#guide').classList.add('hidden');document.querySelectorAll('.bub').forEach(e=>e.remove());G.boss.ai=99;G.boss.spT=99;G.boss.cfg={...G.boss.cfg,aggro:-1};
 if(DEMO==='fight'){G.me.x=-3;G.boss.x=1.5;G.keys={};run(.3);startAtk(G.me,NORM.kick);run(.2);G.me.state='idle';run(.3);G.combo=0;G.comboT=0;
  G.me.x=-2.5;G.boss.x=2.2;G.sa=250;useSpecial(0);run(.12);startAtk(G.me,NORM.punch);damage(G.me,G.boss,5,'high');damage(G.me,G.boss,5,'high');G.hitstop=0;run(.15);G.boss.ai=99;G.me.state='special';
  const r=await taunt('天地返しのコツ教えてやるよ！ようこそ、初めてでも歓迎だ！');G.timer=43;hud();step(1/60);G.me.pose('special');}
 if(DEMO==='easy'){G.me.x=-2.2;G.boss.x=0;for(let n=0;n<4;n++){press('j');run(.45)}press('j');run(.2);press('j');press('k');run(.15);G.timer=51;hud();G.me.sync()}
 if(DEMO==='live'){G.me.x=-2.5;G.boss.x=1.5;gStatus('🤖 Botチームが検索中…（X監視Bot → 技師Bot → 審判Bot）');await pollGacha();const m=myGacha(G.me.cfg.id).find(x=>x.source.author==='lukaworld')||myGacha(G.me.cfg.id).at(-1);G.me.cfg.gacha=[m];gachaInterrupt(m);toast(`✨ K で使える新技：「${esc(m.name)}」`);run(.1)}
 if(DEMO==='sa'){G.me.x=-2;G.boss.x=1.6;G.sa=300;useSA(3);run(.3);G.me.pose('sa');}
 if(DEMO==='ko'){G.me.x=-1;G.boss.x=.6;G.boss.hp=3;startAtk(G.me,NORM.kick);run(.25);run(1.0);G.me.pose('kick');}
 if(DEMO==='clear'){G.boss.hp=1;damage(G.me,G.boss,10,'throw');run(2.4);await new Promise(r=>setTimeout(r,500))}}

// ================= Xラーメンガチャ =================
let GACHA=[];const myGacha=id=>GACHA.filter(m=>m.char===id);
async function loadGacha(){GACHA=(await (await fetch('/api/gacha/moves')).json()).moves||[]}
function showGacha(c){const L=myGacha(c.id);$('#cgacha').innerHTML=L.length?'<b>📡 X由来の新技</b>'+L.slice(-2).reverse().slice(0,2).map((m,i)=>`<div class="gm">${i?'':'[K] '}<b>${esc(m.name)}</b><small>（威力${m.dmg}）</small>${quoteCard(m)}</div>`).join(''):'<small>X由来の新技：まだなし（ガチャで解放）</small>'}
function toast(t){const e=document.createElement('div');e.className='toast';e.innerHTML=t;$('#toasts').append(e);if(!DEMO)setTimeout(()=>e.remove(),5000)}
$('#gbtn').onclick=async()=>{const fx=await (await fetch('/fixtures/x-sample.json')).json();const r=await post('/api/gacha/ingest',fx);await loadGacha();sfx.levelup();
 const cid=INIT.fight.roster[sel?.i||0].id;const mine=r.added.filter(m=>m.char===cid);const ids=fx.posts.map(p=>p.id);const show=mine.length?mine:myGacha(cid).filter(m=>ids.includes(m.source.postId));if(!show.length)toast('📡 新技なし');show.slice(0,3).forEach(m=>toast(`✨ 新技解放！「${m.name}」<small>由来: @${m.source.author} のポスト「${m.source.excerpt}」</small>`));
 r.rejected.filter(x=>x.reason!=='ラーメンキーワードなし').forEach(x=>toast(`🛡 審判Bot：@${x.author||x.id} を却下（${x.reason}）`));if(sel)selShow(sel.i)};
loadGacha();

const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cut=(t,n=60)=>{t=String(t||'');return [...t].length>n?[...t].slice(0,n).join('')+'…':t};
function quoteCard(m,cls=''){const s=m.source||{};return `<div class="qcard ${cls}"><div class="qh"><span class="qx">𝕏</span> @${esc(s.author)}</div><div class="qt">「${esc(cut(s.text||s.excerpt))}」</div></div>`}
// ================= ライブガチャ（5秒ポーリング）＆ 今すぐガチャ =================
let seenMoves=null,gWait=0;
function gStatus(t){document.querySelectorAll('.gstatus').forEach(e=>{e.textContent=t||'';e.classList.toggle('hidden',!t)})}
async function gachaTrigger(){if(gWait)return;const r=await post('/api/gacha/trigger');sfx.ticket();gWait=Date.now();gStatus('🤖 Botチームが検索中…（X監視Bot → 技師Bot → 審判Bot）');G.gReq=r.reqId;
 G.gTO=setTimeout(()=>{if(gWait){gWait=0;gStatus('⌛ 新技は見つからなかった（90秒タイムアウト）');setTimeout(()=>gStatus(''),4000)}},90000)}
$('#gnow').onclick=gachaTrigger;$('#gnow2').onclick=e=>{e.currentTarget.blur();gachaTrigger()};
function gachaInterrupt(m){const c=$('#cutin');const cv=$('#cutc');portrait(cv,G.me?G.me.cfg:INIT.fight.roster[sel?.i||0]);$('#cutl').textContent=`📡 @${m.source.author} さんのポストから新技解放！`;$('#cutn').textContent=m.name;$('#cutq').innerHTML=quoteCard(m,'big');c.classList.add('gacha');c.classList.remove('hidden');sfx.levelup();speak(m.name+'、解放！',{pitch:1.2,rate:1.1},'announcer');
 if(G.phase==='fight')G.frozen=DEMO?0:1.4;if(!DEMO)setTimeout(()=>c.classList.add('hidden'),1500)}
async function pollGacha(){try{const L=(await (await fetch('/api/gacha/moves')).json()).moves||[];if(!seenMoves){seenMoves=new Set(L.map(m=>m.id));GACHA=L;return}
 const fresh=L.filter(m=>!seenMoves.has(m.id));fresh.forEach(m=>seenMoves.add(m.id));GACHA=L;if(!fresh.length)return;
 const cid=G.phase==='fight'?G.me.cfg.id:INIT.fight.roster[sel?.i||0].id;const mine=fresh.filter(m=>m.char===cid);
 if(gWait){gWait=0;clearTimeout(G.gTO);gStatus('✅ 新技が届いた！');setTimeout(()=>gStatus(''),3000)}
 if(G.phase==='fight'&&mine.length){G.me.cfg.gacha=[...(G.me.cfg.gacha||[]),...mine];gachaInterrupt(mine.at(-1));toast(`✨ K で使える新技：「${esc(mine.at(-1).name)}」`)}
 else if(G.phase==='select'){mine.forEach(m=>toast(`✨ 新技解放！「${m.name}」<small>由来: @${m.source.author} のポスト</small>`));if(sel)selShow(sel.i)}}catch(e){}}
setInterval(pollGacha,5000);pollGacha();
window.__dbg={G,gachaInterrupt,myGacha,press,toast,esc,bubble,banner,sparks,hud,second,get GACHA(){return GACHA}};

// ── 落下ツイート（背景演出のみ。技は増えない）──
(()=>{const lay=document.createElement('div');lay.id='tweets';document.body.appendChild(lay);let pool=[],next=4,side=0;
 const load=()=>fetch('/api/tweets').then(r=>r.json()).then(d=>{pool=d.tweets||[]}).catch(()=>{});load();setInterval(load,60000);
 let last=performance.now();const tick=()=>{const now=performance.now(),dt=Math.min(.5,(now-last)/1000);last=now;
  const on=G.phase==='fight';lay.style.display=on?'':'none';
  if(on&&pool.length&&(next-=dt)<=0){next=6+Math.random()*4;if(lay.children.length<2){const t=pool[Math.random()*pool.length|0];
   const c=document.createElement('div');c.className='tw '+((side^=1)?'l':'r');c.innerHTML=`<b>${esc(t.handle)}</b><span>${esc(t.text)}</span>`;
   c.style.animationDuration='9s';c.addEventListener('animationend',()=>c.remove());lay.appendChild(c)}}
 };setInterval(tick,250);window.__tweets={lay,get pool(){return pool},spawn(){next=0}}})();
