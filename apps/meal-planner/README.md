# 週間献立プランナー（meal-planner）

家族の人数・アレルギー・苦手なもの・冷蔵庫の残りから、7日分の夕食（主菜・副菜・汁物）と買い物リストを作るアプリ。料理の絵を大きく並べて1週間を眺められる。登録不要・通信なし・オフライン対応。

公開: https://hiiirano.github.io/public-apps/meal-planner/

## 開発
```bash
npm install
npm run dev        # 開発サーバー
npm test           # 判定の単体テスト＋ランダム3,000通り＋料理データの検査
npm run build      # 公開用（dist/）
npx vite preview --port 4314 --host 127.0.0.1 &
npm run test:e2e   # 動作・画面・アクセシビリティ・通信・オフラインの検査
npm run fonts -- <フォントのフォルダ>   # 画面の文言・料理名を変えたらフォントを作り直す
```

## 構成
| ファイル | 役割 |
|---|---|
| src/foods.ts | 食材の分類と言い換え辞書、照合（苦手・残り物） |
| src/generator.ts | 献立を組む（ジャンルの日数・主菜＋副菜＋汁物・この日を変える・残り物の報告） |
| src/shopping.ts | 買い物リストの集計と量の表示 |
| src/storage.ts | 端末への保存と検証、前の版からの引き継ぎ |
| src/art.ts | 料理・食材と絵の対応 |
| src/data/ | 料理149品（分量は2人前）と材料の辞書（単位・売り場・アレルゲン） |
| src/main.ts / style.css | 画面と見た目 |
| src/fonts/ | 画面の文字だけに絞ったフォント（OFL） |
| public/sw.js | オフライン対応 |
| public/art/ | 絵（出典は LICENSES.md） |
| docs/ | 要件定義・画面仕様・テスト・リリースノート・絵の差し替え指示書 |

料理を足すときは `src/data/recipes.ts` と `src/data/ingredients.ts` を更新し、`npm test` を実行する（アレルゲンの漏れは辞書とは別の規則でも検査する）。
