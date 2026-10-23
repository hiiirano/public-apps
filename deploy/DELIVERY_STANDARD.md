# 納品レベルの基準（2026-10-23）

見本は `apps/warikan`（v3.0.1）。迷ったら warikan と同じやり方にする。

## 1. 書類（`apps/<slug>/docs/`）
warikan の docs と同じ4点を、同じ見出し・同じ書き方（短い日本語、表を多用）で作る。
1. `01_要件定義.md` — 目的・想定する場面・やらないこと・利用者・機能要件（F番号）・非機能要件・受け入れ基準（AC番号）・納品物・素材・合意した事項
2. `02_画面仕様.md` — 画面の並び・区画ごとの部品・状態（空・エラー・正常）・見た目（色トークン・書体・角丸）・保存する内容
3. `03_テスト計画と結果.md` — T1〜T10 の種類・結果・見つけた不具合（B番号）と対応・実機チェック表・利用者テスト手順・再実行のしかた
4. `04_リリースノート.md` — 版・できること・前の版から変わったこと・既知の問題
README.md と SPEC.md は docs を指す短いものに書き換える。

## 2. 作り
- Vite + 素の TypeScript。計算・判定は純関数のファイルに分け、画面（main.ts）から切り離す。
- 保存は localStorage。キーに版を付け（例 `gym-log.v2`）、読み込み時に形と範囲を検査し、壊れていれば初期状態にする。保存できない環境でも使える。
- 利用者の入力を画面に出すときは必ず無害化する（innerHTML に生で入れない）。
- **API キーが要る機能・外部 AI 連携は削除する**（llm.ts など）。代わりに端末内でできること（見本データ、貼り付け取り込みなど）で補う。
- 外部への通信 0 件。フォントは Google Fonts（OFL）から画面の文字だけに絞った woff2 を同梱（warikan の `scripts/subset-fonts.py` を流用。fonttools は `/private/tmp/claude-501/-Users-thm4/5bd1c2ad-3701-4092-ae22-cb1ad63b7748/scratchpad/venv/bin/python` に入っている。元の ttf は github.com/google/fonts から取る）。
- 公開ビルドだけ CSP の meta を入れる（warikan の `vite.config.ts` と同じ）。
- PWA: `public/manifest.webmanifest`・アイコン（192/512/apple-touch/favicon）・`public/sw.js`（stale-while-revalidate、warikan と同じ）。base は相対（`./`）。
- 素材の権利表記は画面に出さない。`public/art/LICENSES.md` と各ライセンス本文を同梱する。
- アイコンは Tabler Icons（MIT）を `icons.ts` にインラインで（warikan と同じ）。
- 絵: 当面は Microsoft Fluent Emoji（MIT、3D か Color）をローカルに置いて使ってよい。あとで ChatGPT の絵に差し替えるため、`docs/ART_PROMPT.md` に「必要な絵の一覧（ファイル名・大きさ・用途）」と ChatGPT に渡すプロンプト（同じ画風で1枚のシートにまとめて描かせる。背景は無地の白）を書く。

## 3. 見た目
- アプリごとにコンセプトと色を変える（指示書のコンセプトに従う）。warikan のオレンジ・クリームをまねしない。
- 押せるものは 44×44px 以上、入力欄の文字は 16px 以上、本文は 16px 以上。
- 320 / 390 / 768 / 1280px、ライト / ダークで崩れない。PC 幅では2列などで横幅を生かす。
- コントラスト 4.5:1 以上（WCAG 2.2 AA）。キーボードだけで全操作できる。

## 4. テスト（すべて合格させる）
- `npm test`: 純関数の単体テスト。計算・判定にはランダム（性質）テストも入れる。
- `npm run test:e2e`（`tests/e2e.mjs`、warikan のものを土台に）:
  - 主な操作の流れを実際のブラウザでクリックして確認（ラベルをクリック。force は使わない）
  - 4幅 × ライト/ダークの画面検査（横はみ出し・44px 未満・16px 未満の入力・重なり）
  - axe-core（WCAG 2.0/2.1/2.2 A・AA）違反 0
  - 外部への通信 0 件
  - オフラインで再読み込みしても使える
- devDependencies: playwright 1.58.2、axe-core 4、tsx。プレビューのポートはアプリごとに別（指示書の番号）。
- 最後にスクリーンショットを自分の目で見て、変なところを直す（T10）。

## 5. やらないこと
- git の commit / push、`deploy.sh` の実行、`deploy/` と他のアプリのフォルダの変更（取りまとめ役がやる）。
- `apps/_shared` の変更（読むのはよい）。
