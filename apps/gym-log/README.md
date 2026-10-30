# 筋トレ記録 GYM LOG（gym-log）

ジムのマシンや自重トレの重さ・回数を、スマホでその場で記録するアプリ。マシン中心の種目を絵つきで最初から選べ、前回の記録が次のセットに入り、伸びたら「自己ベスト」「前回より上」と分かる。登録不要・通信なし・オフライン対応。

公開: https://hiiirano.github.io/public-apps/gym-log/

## 開発
```bash
npm install
npm run dev        # 開発サーバー
npm test           # 計算の単体テスト＋ランダムテスト
npm run build      # 公開用（dist/）
npx vite preview --port 4311 --host 127.0.0.1 &
npm run test:e2e   # 動作・画面・アクセシビリティ・通信・オフラインの検査
npm run fonts -- <フォントのフォルダ>   # 画面の文言を変えたらフォントを作り直す
```

## 構成
| ファイル | 役割 |
|---|---|
| src/logic.ts | 計算と判定（次の初期値・自己ベスト・前回比・まとめ・週・おすすめ・CSV） |
| src/storage.ts | 種目の見本、端末への保存と検査、前の版からの移行、バックアップ |
| src/demo.ts | 見本の記録 |
| src/art.ts | 種目の絵（public/art の webp を返す） |
| src/icons.ts | 操作アイコン（Tabler Icons） |
| src/main.ts | 画面 |
| src/style.css | 見た目 |
| src/fonts/ | 画面の文字だけに絞ったフォント（OFL） |
| public/sw.js | オフライン対応 |
| public/art/ | 素材の出典とライセンス |
| docs/ | 要件定義・画面仕様・テスト・リリースノート・絵の差し替え指示 |
