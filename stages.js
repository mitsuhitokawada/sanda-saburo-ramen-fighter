// 「三田三郎」ステージ定義。ボス追加・差し替えはこのデータを足すだけ。
const W=(id,label,words,hints)=>({id,label,words,hints});
module.exports={stages:[{
 id:'mita-saburo',name:'ラーメン 三田三郎',turnsPerBoss:6,clearAt:100,
 calls:{items:['ニンニク','ヤサイ','アブラ','カラメ'],levels:['','マシ','マシマシ']},
 team:{ // 店主を支えるAIチーム。ヒントを小声で出す
  shiire:{name:'仕入れBot',icon:'📦',voice:{pitch:.8,rate:1}},
  sekkyaku:{name:'接客Bot',icon:'🙇',voice:{pitch:1.5,rate:1.15}},
  joren:{name:'常連さん',icon:'🧔',voice:{pitch:.9,rate:.95}}},
 bosses:[
 {level:1,id:'lotbreaker',name:'ロット乱し客',icon:'😤',title:'ロット乱し客をさばけ',voice:{pitch:1.3,rate:1.3},
  persona:'初来店で暗黙のルールを知らない若者。スマホを見ながら麺を残しそう。悪気はないがロットを乱す。',
  goal:'店主の説得でロットを乱さず完食し「また来ます」と言う',
  opening:'え、食券ってどれ？ てかコールって何？ 写真撮っていい？',
  topic:['食券','ロット','コール','ルール','ゆっくり','完食','説明','初めて','大丈夫','天地返し'],
  anger:['出ていけ','帰れ','素人','常識','早く食え','邪魔'],
  weaknesses:[W('praise','初心者扱いせず歓迎されたい',['ようこそ','歓迎','初めてでも','いらっしゃい','大歓迎'],['張り紙「初めての方、歓迎します（店主）」…まだ貼ってない','常連「俺も最初はキョドってたなあ…歓迎されて嬉しかったよ」']),
   W('tenchi','天地返しを教わりたい',['天地返し','ひっくり返','下から'],['常連「麺を下から引きずり出すのがコツなんだよ」','仕入れBot「あの子、ヤサイの山の前で固まっとるで」']),
   W('small','少なめにできると知りたい',['少なめ','麺半分','半分','量を減ら'],['接客Bot「あのお客様、量に不安そうです…」','張り紙「麺少なめ できます」（小さく）'])],
  win:'ロット乱し客「……完食っす。ごちそうさまでした！また来ます！」'},
 {level:2,id:'butafarmer',name:'頑固な豚の生産者',icon:'🐖',title:'幻の豚を仕入れろ',voice:{pitch:.6,rate:.85},unlock:'🐷 希少食材「幻の三田黒豚」をゲット！',
  persona:'山奥の養豚家。無口で頑固。金の話を嫌う。自分の豚が雑に扱われるのが何より許せない。',
  goal:'自慢の豚を店に卸すと約束させる',opening:'……うちの豚は、ラーメン屋になんか卸さねえ。',
  topic:['豚','チャーシュー','煮込','醤油','仕込み','大切','丁寧','育て','味','分厚'],
  anger:['安く','値引き','金なら','大量に','冷凍','どこでも同じ'],
  weaknesses:[W('family','亡き父の味を覚えていてほしい',['お父さん','親父','先代','受け継','伝統'],['常連「あの爺さんの親父さん、昔このへんで屋台やってたらしいぞ」','仕入れBot「トラックに古い屋台の写真が貼ってあったで」']),
   W('whole','一頭まるごと使い切ってほしい',['まるごと','全部使','骨まで','ゲンコツ','背脂も','余さず'],['仕入れBot「あの人、捨てる部位の話になると目ぇ光らせとった」','張り紙「スープはゲンコツから」']),
   W('visit','農場まで足を運んでほしい',['農場','会いに','行きます','見学','現場','足を運'],['接客Bot「生産者さん、遠くから来てくださったんですね…」','常連「電話一本で頼む奴は大嫌いなんだとよ」'])],
  win:'頑固な豚の生産者「……持ってけ。うちの豚、粗末にすんなよ。」'},
 {level:3,id:'youtuber',name:'大物ユーチューバー兼辛口評論家',icon:'📸',title:'有名人を唸らせろ',voice:{pitch:1.1,rate:1.2},unlock:'🌟 大物ユーチューバー来店！動画が100万再生で大行列！',
  persona:'登録者300万人。辛口レビューで有名。カメラ目線。媚びられると萎える。本物のジャンクさを求める。',
  goal:'動画で「神店」認定させる',opening:'はいどうも〜。今日は話題の三田三郎、正直どうなの？ってとこ、ガチで評価します。',
  topic:['極太','麺','豚','スープ','乳化','コール','ニンニク','ヤサイ','アブラ','カラメ','天地返し','ワシワシ'],
  anger:['宣伝して','いい評価','お金払う','高評価','忖度','金なら'],
  // 評論家の隠れた好み（Jiro世界）。コールで刺さる
  weaknesses:[W('abura','アブラマシマシの背脂',['アブラマシマシ','背脂'],['常連「あの人の過去動画、全部アブラまみれだよな」','接客Bot「カメラマンさんが『いつもアブラ多めで』って…」']),
   W('ninniku','ニンニクマシマシの暴力',['ニンニクマシマシ','刻みニンニク'],['張り紙「ニンニク、今日は青森産」','常連「あの人、口臭対策のガム持ち歩いてるらしい」']),
   W('gokubuto','極太ワシワシ麺',['極太','ワシワシ','オーション','自家製麺'],['仕入れBot「今朝の小麦、ええ粉入ったで」','常連「あの人、麺の硬さの話ばっかするよな」']),
   W('karame','カラメの非乳化スープ',['カラメマシ','カラメ','非乳化','醤油'],['接客Bot「あの方、テーブルの醤油ボトルずっと見てます…」','張り紙「カラメ、今日はキレてます」'])],
  win:'大物ユーチューバー「……これは、神店です。チャンネル登録者の皆さん、並んでください。」'},
 {level:4,id:'nyinvestor',name:'NYの投資家',icon:'💼',title:'NY支店の出資を勝ち取れ',voice:{pitch:.9,rate:1.05},unlock:'🗽 売上アップ！ニューヨークに海外支店をオープン！',
  persona:'ウォール街の投資家。日本語に英語が混じる。数字とストーリーを重視。曖昧な話を嫌う。',
  goal:'NY支店への出資にサインさせる',opening:'Hi, 店主さん。So、このジャンクなラーメン、NYでスケールすると思う？',
  topic:['売上','行列','数字','回転','利益','ブランド','体験','NY','ニューヨーク','計画','コスト','ロット'],
  anger:['なんとなく','たぶん','気合','根性だけ','わからない'],
  weaknesses:[W('story','創業ストーリーに弱い',['物語','ストーリー','夢','原点','創業','屋台'],['接客Bot「投資家さん、さっき昔の屋台の写真を撮ってました」','常連「あの人、自分も移民の息子なんだってさ」']),
   W('culture','コール文化の体験価値',['コール','体験','文化','儀式','呪文'],['仕入れBot「あの人、コール聞くたびメモしとる」','張り紙「Call: GARLIC? VEGETABLE?」（試作）']),
   W('vegan','ヴィーガン対応で市場拡大',['ヴィーガン','ビーガン','植物','ソイ','大豆'],['常連「NYって肉食わない人多いんだろ？」','接客Bot「投資家さん、豚抜きで…と小声で注文されてました」'])],
  win:'NYの投資家「Deal. 三田三郎 New York、やりましょう。」'},
 {level:5,id:'shisho',name:'師匠',icon:'👴',title:'師匠からのれんを分けてもらえ',voice:{pitch:.5,rate:.8},unlock:'🏮 師匠の許しを得て、弟子にのれん分け！三田三郎の味が全国へ！',
  persona:'三田三郎の元祖。寡黙で厳しい。技術より心を見る。弟子の慢心が大嫌い。',
  goal:'のれん分けを許させる',opening:'……で、お前。のれんを分けたいだと？',
  topic:['修行','感謝','お客','味','守','麺','豚','スープ','毎日','仕込み','初心'],
  anger:['もう十分','俺の方が','楽に','儲かる','超えた','簡単'],
  weaknesses:[W('first','最初の一杯を覚えているか',['最初の一杯','初めて食べ','あの日','原点'],['常連「師匠、昔の弟子が最初に作った丼をまだ持ってるらしい」','接客Bot「師匠、厨房の古い寸胴をずっと撫でてました」']),
   W('customer','客のための店',['お客さんのため','学生','腹いっぱい','安く','満腹'],['張り紙「学生 麺増し無料」（師匠の字）','常連「師匠は昔から貧乏学生に甘いんだよ」']),
   W('apprentice','弟子を育てる覚悟',['弟子','育て','次の世代','教え','若い'],['仕入れBot「師匠、若い弟子の話になると声が優しなるで」','常連「師匠も自分の師匠からのれんもらったんだよな」'])],
  win:'師匠「……持っていけ。三田三郎の、のれんだ。」'}
 ],
 winLine:'🏮 伝説達成！「三田三郎」は、のれん分けで全国へ。',
 loseLine:'閉店ガラガラ……ボスを攻略できなかった。また仕込みからやり直しだ。'
}]};
// ===== 格闘モード（HD-2D）用データ =====
module.exports.fight={
 roundTime:60,specialCost:50,
 player:{name:'店主',colors:{skin:'#f1c27d',body:'#ffffff',accent:'#f5d000',hair:'#222',pants:'#333'},hat:'towel'},
 specials:[ // key=キー割り当て
  {key:'1',id:'ninniku',name:'ニンニクマシマシ砲',dmg:14,type:'projectile',color:0xfff2b0},
  {key:'2',id:'yasai',name:'ヤサイタワー',dmg:16,type:'launcher',color:0x7dd35a},
  {key:'3',id:'abura',name:'アブラスプラッシュ',dmg:12,type:'splash',color:0xffe27a},
  {key:'4',id:'tenchi',name:'天地返し投げ',dmg:20,type:'throw',color:0xffffff},
  {key:'5',id:'men',name:'極太麺ムチ',dmg:15,type:'whip',color:0xf7d774}],
 tts:{language:'ja',voices:{tenshu:'rex',deshi:'leo',banchou:'atlas',tuber:'eve',lotbreaker:'cosmo',butafarmer:'orion',youtuber:'lux',nyinvestor:'perseus',shisho:'zagan',shiire:'helios',sekkyaku:'celeste',joren:'castor',announcer:'zenith'}}, // xAI TTS voice_id 割り当て
 seconds:['shiire','sekkyaku'],
 bosses:{
  lotbreaker:{stage:'shop',hp:90,speed:3.2,aggro:.45,dmg:.8,colors:{skin:'#f1c27d',body:'#4aa3ff',accent:'#ff5ea8',hair:'#c8732a',pants:'#2a3d6b'},hat:'cap',move:'スマホ連写フラッシュ',moveColor:0xaee6ff},
  butafarmer:{stage:'farm',hp:110,speed:2.4,aggro:.5,dmg:1.1,colors:{skin:'#d9a066',body:'#5b8c3a',accent:'#ffcc66',hair:'#777',pants:'#4b3621'},hat:'straw',move:'黒豚タックル',moveColor:0xff9eb5},
  youtuber:{stage:'studio',hp:110,speed:3.6,aggro:.6,dmg:1,colors:{skin:'#f3c9a0',body:'#e83a3a',accent:'#ffffff',hair:'#111',pants:'#222'},hat:'none',glasses:true,move:'炎上コメント弾',moveColor:0xff5533},
  nyinvestor:{stage:'ny',hp:120,speed:3,aggro:.6,dmg:1.15,colors:{skin:'#e8b88a',body:'#1d2b4f',accent:'#c9a227',hair:'#d9c27a',pants:'#1d2b4f'},hat:'none',tie:true,move:'ドル札ストーム',moveColor:0x7dff9a},
  shisho:{stage:'dojo',hp:140,speed:3.4,aggro:.7,dmg:1.3,colors:{skin:'#e0ac69',body:'#222222',accent:'#f5d000',hair:'#eeeeee',pants:'#222'},hat:'towel',beard:true,move:'秘伝・寸胴落とし',moveColor:0xffd000}
 }};
// ===== キャラクターセレクト（プレイアブル） =====
// specials: key 1-4。type: projectile|launcher|splash|throw|whip|rush。sa: 超必殺（SA1-3）
module.exports.fight.roster=[
 {id:'tenshu',name:'三田三郎の店主',alias:'極太の求道者',stats:{power:4,speed:3,mashi:5},voice:{pitch:.8,rate:1},line:'ニンニク入れますか？……答えは拳で聞こう。',
  colors:{skin:'#f1c27d',body:'#ffffff',accent:'#f5d000',hair:'#222',pants:'#333'},hat:'towel',
  specials:[{key:'1',name:'ニンニクマシマシ砲',type:'projectile',dmg:10,color:0xfff2b0},{key:'2',name:'ヤサイタワー',type:'launcher',dmg:12,color:0x7dd35a},{key:'3',name:'アブラスプラッシュ',type:'splash',dmg:11,color:0xffe27a},{key:'4',name:'天地返し投げ',type:'throw',dmg:15,color:0xffffff}],
  sa:['極太麺ムチ','全マシマシ・ロット崩し','秘伝・天地開闢']},
 {id:'deshi',name:'湯切り師匠風の弟子',alias:'湯切りの風',stats:{power:3,speed:5,mashi:3},voice:{pitch:1.2,rate:1.2},line:'湯切りは一瞬、勝負も一瞬っす！',
  colors:{skin:'#f3c9a0',body:'#2b2b2b',accent:'#e74c3c',hair:'#5a3a1a',pants:'#2b2b2b'},hat:'towel',
  specials:[{key:'1',name:'湯切りスラッシュ',type:'projectile',dmg:9,color:0xbfefff},{key:'2',name:'極太麺ムチ',type:'whip',dmg:11,color:0xf7d774},{key:'3',name:'替え玉ダッシュ',type:'rush',dmg:12,color:0xffffff},{key:'4',name:'天地返し投げ',type:'throw',dmg:14,color:0xffffff}],
  sa:['平ザル乱舞','湯切り百連','無限替え玉']},
 {id:'banchou',name:'ロット番長バイト',alias:'ロットの守護者',stats:{power:5,speed:2,mashi:4},voice:{pitch:.6,rate:.9},line:'ロットを乱す奴は、俺が許さねえ。',
  colors:{skin:'#c68642',body:'#f5d000',accent:'#111111',hair:'#111',pants:'#444'},hat:'cap',
  specials:[{key:'1',name:'食券タックル',type:'rush',dmg:13,color:0xffe066},{key:'2',name:'アブラスプラッシュ',type:'splash',dmg:12,color:0xffe27a},{key:'3',name:'ヤサイタワー',type:'launcher',dmg:13,color:0x7dd35a},{key:'4',name:'ロット固め',type:'throw',dmg:17,color:0xffffff}],
  sa:['ロット圧','満席の重圧','閉店ガラガラ']},
 {id:'tuber',name:'爆食ユーチューバー',alias:'胃袋ブラックホール',stats:{power:3,speed:4,mashi:5},voice:{pitch:1.4,rate:1.25},line:'はいどうも〜！今日は全マシマシでボコっていきます！',
  colors:{skin:'#f3c9a0',body:'#9b59b6',accent:'#ffffff',hair:'#ff7eb6',pants:'#222'},hat:'none',glasses:true,
  specials:[{key:'1',name:'撮影フラッシュ',type:'projectile',dmg:9,color:0xffffff},{key:'2',name:'ヤサイタワー',type:'launcher',dmg:12,color:0x7dd35a},{key:'3',name:'爆食吸引',type:'throw',dmg:15,color:0xff9eb5},{key:'4',name:'極太麺ムチ',type:'whip',dmg:11,color:0xf7d774}],
  sa:['バズり砲','100万再生ラッシュ','炎上フィナーレ']}
];
// ===== Xラーメンガチャ：キーワード → 技バリエーション =====
// pow は基礎威力。実際の威力はサーバー側で 6〜16 にクランプ。
module.exports.fight.gacha={
 keywords:[
  {kw:'背脂',type:'splash',pow:12,color:0xfff0b0,names:{tenshu:'背脂チャッチャ豪雨',deshi:'背脂スライド',banchou:'背脂ドリフト',tuber:'背脂シャワー配信'}},
  {kw:'ニンニク',type:'projectile',pow:11,color:0xfff2b0,names:{tenshu:'全ニンニク砲',deshi:'刻みニンニク手裏剣',banchou:'ニンニク鉄拳',tuber:'ニンニク爆食ビーム'}},
  {kw:'家系',type:'rush',pow:12,color:0xf5d000,names:{tenshu:'家系ほうれん草ラッシュ',deshi:'海苔三枚斬り',banchou:'家系ライス無限突進',tuber:'家系ライス爆食ダッシュ'}},
  {kw:'煮干し',type:'projectile',pow:10,color:0xc0d8ff,names:{tenshu:'煮干し弾幕',deshi:'セメント煮干し斬',banchou:'煮干しミサイル',tuber:'エグ煮干しビーム'}},
  {kw:'替玉',type:'rush',pow:10,color:0xffffff,names:{tenshu:'替玉連撃',deshi:'バリカタ替玉ダッシュ',banchou:'替玉タックル',tuber:'替玉10連チャレンジ'}},
  {kw:'味噌',type:'splash',pow:11,color:0xd9822b,names:{tenshu:'味噌バーナー',deshi:'炒め味噌旋風',banchou:'赤味噌プレス',tuber:'味噌ラーメン爆炎'}},
  {kw:'つけ麺',type:'whip',pow:12,color:0xe8c070,names:{tenshu:'極太つけ麺ムチ',deshi:'つけ麺二刀流',banchou:'つけ麺ロープ',tuber:'つけ麺すすりトルネード'}},
  {kw:'辛',type:'projectile',pow:13,color:0xff3300,names:{tenshu:'激辛マシマシ砲',deshi:'唐辛子手裏剣',banchou:'辛味噌鉄拳',tuber:'激辛チャレンジ炎上弾'}},
  {kw:'チャーシュー',type:'throw',pow:14,color:0xd08050,names:{tenshu:'豚ダブル投げ',deshi:'炙りチャーシュー返し',banchou:'厚切り豚プレス',tuber:'チャーシュー丼投げ'}},
  {kw:'乳化',type:'launcher',pow:12,color:0xfff8e0,names:{tenshu:'乳化スープ噴流',deshi:'乳化タイフーン',banchou:'ドロ乳化ガイザー',tuber:'乳化バズ噴水'}}
 ]};
