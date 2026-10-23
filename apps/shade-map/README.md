# 日陰MAP 新宿β（shade-map）

新宿駅のまわりで、地下通路や屋根のある道を通って日なたを歩く時間を減らす「日陰の道」を、いちばん近い道とくらべるアプリ。日なたの時間・歩く時間・日陰の割合を札と手描きの絵地図で見せる。データは公式の地図から手で拾った目安で、建物の影・季節・時刻は計算しない。登録不要・通信なし・オフライン対応。

公開: https://hiiirano.github.io/public-apps/shade-map/

## 開発
```bash
npm install
npm run dev        # 開発サーバー
npm test           # 道さがしの単体テスト＋ランダムな街 3,000 個の性質テスト
npm run build      # 公開用（dist/）
npx vite preview --port 4317 --host 127.0.0.1 &
npm run test:e2e   # 動作・画面・アクセシビリティ・通信・オフラインの検査
npm run fonts -- <フォントのフォルダ>   # 画面の文言を変えたらフォントを作り直す
```

## 構成
| ファイル | 役割 |
|---|---|
| src/router.ts | 道さがし（純関数）・データの形の検査 |
| src/cities/shinjuku.ts | 新宿のデータ（地点・区間・根拠・出典） |
| src/storage.ts | 端末への保存と検証 |
| src/main.ts | 画面（絵地図の SVG を含む） |
| src/style.css | 見た目 |
| src/fonts/ | 画面の文字だけに絞ったフォント（OFL） |
| public/sw.js | オフライン対応 |
| public/art/ | 絵（出典は LICENSES.md） |
| docs/ | 要件定義・画面仕様・テスト・リリースノート・絵の発注書 |

データを直すときは docs/01_要件定義.md §3.1「作者が確かめること」を見る。
