# その場の割り勘（warikan）

飲み会・食事のお会計を、幹事がスマホ1台で30秒で割り勘するアプリ。多め・少なめ・おごり、端数の丸め、幹事のおつりまで計算して、LINEに貼る文をコピーできる。登録不要・通信なし・オフライン対応。

公開: https://hiiirano.github.io/public-apps/warikan/

## 開発
```bash
npm install
npm run dev        # 開発サーバー
npm test           # 計算の単体テスト＋ランダム1万件
npm run build      # 公開用（dist/）
npx vite preview --port 4310 --host 127.0.0.1 &
npm run test:e2e   # 動作・画面・アクセシビリティ・通信・オフラインの検査
npm run fonts -- <フォントのフォルダ>   # 画面の文言を変えたらフォントを作り直す
```

## 構成
| ファイル | 役割 |
|---|---|
| src/warikan.ts | 計算（整数の円だけで計算）と LINE の文 |
| src/money.ts | 金額の読み取りと表示 |
| src/storage.ts | 端末への保存と検証 |
| src/main.ts | 画面 |
| src/style.css | 見た目 |
| src/fonts/ | 画面の文字だけに絞ったフォント（OFL） |
| public/sw.js | オフライン対応 |
| public/art/ | イラスト（出典は LICENSES.md） |
| docs/ | 要件定義・画面仕様・テスト・リリースノート |
