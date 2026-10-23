# 暗記カード（flashcards）

紙の単語カードのように1枚ずつめくって覚えるアプリ。忘れかけたころに、同じカードをもう一度出す。表と裏を貼り付けてまとめて作成でき、見本の単語帳つき。登録不要・通信なし・オフライン対応。

公開: https://hiiirano.github.io/public-apps/flashcards/

## 開発
```bash
npm install
npm run dev        # 開発サーバー（4316）
npm test           # 純関数の単体テスト＋ランダムテスト
npm run build      # 公開用（dist/）
npm run preview &  # http://127.0.0.1:4316/
npm run test:e2e   # 動作・画面・アクセシビリティ・通信・オフラインの検査
npm run fonts -- <フォントのフォルダ>   # 画面の文言を変えたらフォントを作り直す
```

## 構成
| ファイル | 役割 |
|---|---|
| src/srs.ts | 次に出す日の計算・今日めくるカード・つづけた日数（純関数） |
| src/parse.ts | 貼り付けた文字からカードを作る（純関数） |
| src/storage.ts | 端末への保存と検査、書き出し・読み込み、v1 の引き継ぎ |
| src/samples.ts | 見本の単語帳 |
| src/main.ts | 画面 |
| src/style.css | 見た目 |
| src/fonts/ | 画面の文字だけに絞ったフォント（OFL） |
| public/sw.js | オフライン対応 |
| public/art/ | 絵（出典は LICENSES.md） |
| docs/ | 要件定義・画面仕様・テスト・リリースノート・絵の発注書 |
