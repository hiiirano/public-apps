# ヒエヒエ冷蔵庫（fridge-puzzle）— しょうもなゲーム #01

冷蔵庫の中を入れかえて、同じ物を1段ずつそろえるパズル（3面）。クリアすると突然「この冷蔵庫の持ち主は誰？」と聞かれる。手に持っている物は、正解と一切関係ない。登録不要・通信なし・オフライン対応。

公開: https://hiiirano.github.io/public-apps/fridge-puzzle/

## 開発
```bash
npm install
npm run dev        # 開発サーバー
npm test           # 判定・生成・偏り・共有URL・保存の単体テスト
npm run build      # 公開用（dist/）
npm run preview &  # http://127.0.0.1:4318/
npm run test:e2e   # 通しプレイ・画面・アクセシビリティ・通信・オフラインの検査
npm run fonts -- <フォントのフォルダ>   # 画面の文言を変えたらフォントを作り直す
```

## 構成
| ファイル | 役割 |
|---|---|
| src/game.ts | 盤面の生成・最短手数とヒント・候補と正解・共有URL・保存の検査（純関数） |
| src/main.ts | 画面 |
| src/style.css | 見た目（ゲームコーナー案 D） |
| src/fonts/ | 画面の文字だけに絞ったフォント（OFL） |
| public/sw.js | オフライン対応 |
| public/art/ | 絵（出典は LICENSES.md） |
| docs/ | 要件定義・画面仕様・テスト・リリースノート・絵のプロンプト |
| docs/history/ | 前の版の企画書と絵 |
