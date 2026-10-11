# 三田三郎 〜ラーメン格闘伝〜

Grok Bot Tokyo Hackathon（2026/10/11）提出作品。二郎インスパイアの架空ラーメン店「三田三郎」を舞台にした HD-2D 風格闘ゲームと、それを裏で運営する Grok Bot チーム。

## 遊び方
```
node server.js   # http://localhost:3000/
LLM_PROVIDER=xai XAI_API_KEY=... node server.js  # 本物のLLMで口撃判定
```
- 矢印: 移動 / J: 連打でコンボ / K: 必殺技 / L: 超必殺 / 後ろ: ガード / Enter: 口撃(テキスト) / V: 音声
- C: カメラを回して3D空間を確認

## Botチーム
- X監視Bot: Xのラーメン系ポストを5分おきに収集
- 技師Bot: ポストから新技を生成
- 審判Bot: 荒らし・強すぎる技を弾いて `/api/gacha/ingest` に投入
- 対戦中、その日のラーメンのつぶやきが背景に降ってくる
- 「今すぐガチャ」ボタン → Webhook でBotチームを起動、数十秒で対戦中に新技が降ってくる

## デモ動画
https://youtu.be/0TzF4r0DIY8
