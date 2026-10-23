# 在庫管理（pantry-tracker）

冷蔵庫・冷凍庫・棚にある物を絵で並べ、期限の近さを色と言葉（「今日まで」「あと2日」）で見せるアプリ。よく買う物はボタン1つで入れられ、「使い切った」「捨てた」を記録して買いすぎに気づける。書き出し・読み込み対応。登録不要・通信なし・オフライン対応。

公開: https://hiiirano.github.io/public-apps/pantry-tracker/

## 開発
```bash
npm install
npm run dev        # 開発サーバー
npm test           # 純関数の単体テスト＋ランダムテスト
npm run build      # 公開用（dist/）
npx vite preview --port 4315 --host 127.0.0.1 &
npm run test:e2e   # 動作・画面・アクセシビリティ・通信・オフラインの検査
npm run fonts -- <フォントのフォルダ>   # 画面の文言を変えたらフォントを作り直す
```

## 構成
| ファイル | 役割 |
|---|---|
| src/dates.ts | 日付の計算（時差・月末・うるう年。純関数） |
| src/pantry.ts | 期限の判定・操作・30日の集計（純関数） |
| src/catalog.ts | 置き場所・食材の絵・よく買う物 |
| src/storage.ts | 端末への保存と検査、書き出し・読み込み、古い形式の移しかえ |
| src/main.ts | 画面 |
| src/style.css | 見た目 |
| src/fonts/ | 画面の文字だけに絞ったフォント（OFL） |
| public/sw.js | オフライン対応 |
| public/art/ | 食材の絵（出典は LICENSES.md） |
| docs/ | 要件定義・画面仕様・テスト・リリースノート・絵の指示書 |
