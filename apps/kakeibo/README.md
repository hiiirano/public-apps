# 家計簿ノート（kakeibo）

金額と費目をえらぶだけの家計簿。「このままだと月末いくらになるか」を図で見せ、使いすぎを月の途中で先回りして知らせる。登録不要・通信なし・オフライン対応。記録は端末の中だけ。JSON / CSV で書き出して、ほかの端末へ移せる。

公開: https://hiiirano.github.io/public-apps/kakeibo/

## 開発
```bash
npm install
npm run dev        # 開発サーバー
npm test           # 計算の単体テスト＋ランダムテスト
npm run build      # 公開用（dist/）
npx vite preview --port 4313 --host 127.0.0.1 &
npm run test:e2e   # 動作・画面・アクセシビリティ・通信・オフラインの検査
npm run fonts -- <フォントのフォルダ>   # 画面の文言を変えたらフォントを作り直す
```

## 構成
| ファイル | 役割 |
|---|---|
| src/pace.ts | 月末の見込み・判定・図の座標（純関数） |
| src/book.ts | 予算の引き継ぎ・費目ごと・日ごとの集計（純関数） |
| src/transfer.ts | 保存内容の検査、JSON / CSV の書き出し・読み込み、前の版の引き継ぎ（純関数） |
| src/dates.ts | 日付（うるう年・曜日・月の移動） |
| src/money.ts | 金額の読み取りと表示 |
| src/storage.ts | 端末への保存 |
| src/main.ts | 画面 |
| src/style.css | 見た目 |
| src/fonts/ | 画面の文字だけに絞った書体（OFL） |
| public/sw.js | オフライン対応 |
| public/art/ | 絵（出典は LICENSES.md） |
| docs/ | 要件定義・画面仕様・テスト・リリースノート・絵の差し替え指示 |
