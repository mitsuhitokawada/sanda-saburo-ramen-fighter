# キャラ画像の差し替え
public/assets/chars/<キャラid>/ に PNG（透過）を置くだけで反映。無いポーズは手続き生成ドットにフォールバック。
id: tenshu, deshi, banchou, tuber（プレイアブル） / lotbreaker, butafarmer, youtuber, nyinvestor, shisho（ボス）
ファイル名: portrait.png（正方形・セレクト枠/カットイン）, vs.png（任意・縦長）, select.png（任意・セレクト台座）,
 idle.png, idle2.png, walk.png, walk2.png, attack.png（パンチ/キック等の共通フォールバック）, punch.png, kick.png, overhead.png,
 crouch.png, lowpunch.png, lowkick.png, guard.png, crouchguard.png, hit.png, ko.png, jump.png, special.png, super.png, throw.png
推奨: 縦横比 2:3（例 256x384）、右向き、足元を画像下端に。左向きはコードで反転。
