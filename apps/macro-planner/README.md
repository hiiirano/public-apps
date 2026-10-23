# PFC・TDEE計算（macro-planner）

体のことを入れるだけで、1日の目標カロリーと、たんぱく質・脂質・炭水化物（PFC）の量がわかるアプリ。「ごはん何杯分」のたとえつき。食べたものの記録もできる。登録不要・データはこの端末の中だけ。

ライブ: https://hiiirano.github.io/public-apps/macro-planner/

## 書類
- [要件定義（計算の式と根拠を含む）](docs/01_要件定義.md)
- [画面仕様](docs/02_画面仕様.md)
- [テスト計画と結果](docs/03_テスト計画と結果.md)
- [リリースノート](docs/04_リリースノート.md)
- [絵の発注書](docs/ART_PROMPT.md)

## 開発
```bash
npm install
npm run dev        # 開発サーバー
npm test           # 計算の単体・ランダムテスト
npm run build
npx vite preview --port 4312 --host 127.0.0.1 &
npm run test:e2e   # ブラウザでの動作・画面・axe・通信・オフライン
```

計算は一般的な式による目安で、医療・栄養指導ではありません。
