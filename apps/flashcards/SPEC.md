# 暗記カード（AI生成ファースト） — SPEC

## 一言

テキストやノートを貼ると **AI が Q&A カードを自動生成**し、**SM-2 間隔反復**で復習できる、
ログイン不要・インストール不要の静的 Web アプリ。

## 背景 / なぜ作るか

- コミュニティで広まった「AI活用事例」の頻出テーマ（学習・暗記・クイズ）に当たる。
- 既存王者（Anki / AnkiDroid）の弱点は **カード作成が面倒**・**ログイン/同期/インストールが要る**。
- ここを「開いた瞬間使える × カード作成を AI に任せられる」で埋める。Anki を置き換えるのではなく、
  **思い立った瞬間に作って覚え始められる低摩擦レイヤー**を狙う。
- 目的は2つ：(1) beads 実戦投入の素振り、(2) 多くの人に配れる無料ツール。

## スコープ（MVP に入れる）

- デッキ（カードの束）の作成・選択・削除。
- カードの手動追加（表/裏）。
- **AI 生成パネル（主機能）**：ノート/テキストを貼る → 任意 LLM で Q&A カード案を抽出 →
  プレビューで取捨選択 → デッキに追加。
- 学習セッション：今日の対象カード（期限到来＋新規）を 1 枚ずつ表示 →
  裏を表示 → **4段階自己評価（もう一度 / むずかしい / ふつう / かんたん）**。
- SM-2 による次回出題日の決定的計算（LLM 不要・オフライン動作）。
- localStorage 永続化（デッキ・カード・SRS 状態・LLM 設定）。
- JSON でのエクスポート / インポート（バックアップ・端末間移行の手段）。

## スコープ外（MVP では作らない）

- サーバ / アカウント / クラウド同期（端末間同期は JSON 手動移行で代替）。
- 画像・音声カード、穴埋め(cloze)、サブデッキ階層。
- 学習統計の詳細グラフ、ヒートマップ。
- サブデイ（分単位）の学習ステップ。スケジュールは **日単位**で扱う。

## アーキテクチャ方針（pantry-tracker 踏襲）

- Vite + TypeScript の静的 SPA。`base: "./"` で相対パス出力（GitHub Pages のサブパスで動く）。
- レイヤ分離：
  - `types.ts` … 型・定数・サンプルデッキ seed。
  - `srs.ts` … **決定的コア**（純関数・副作用なし・LLM不要）。SM-2 と出題抽出・集計。
  - `storage.ts` … localStorage 永続化と正規化（壊れた値は既定で補完）。
  - `llm.ts` … 任意 LLM 拡張（OpenAI 互換 Chat Completions）。未設定なら呼ばれない。
  - `main.ts` … 素 DOM UI（full re-render 方式）。
- API キーは当該ブラウザの localStorage のみに保存。サーバには送らない。

## 決定的コア（SM-2）の仕様

カードの SRS 状態：

```
repetitions: number  // 連続正答回数（again で 0 に戻る）
interval:    number  // 次回までの日数
easeFactor:  number  // 易しさ係数（初期 2.5・下限 1.3）
due:         string  // YYYY-MM-DD（次回出題日）。未学習カードは未設定=即出題
```

4 段階評価 → SM-2 quality へのマッピング：

| ボタン       | quality | 挙動 |
|--------------|---------|------|
| もう一度     | 2       | lapse: repetitions=0, interval=1（翌日）, EF 減 |
| むずかしい   | 3       | 正答だが EF 減りめ |
| ふつう       | 4       | 標準 |
| かんたん     | 5       | EF 増えめ |

SM-2 本体（quality < 3 = lapse / それ以外 = 正答）：

```
if quality < 3:
  repetitions = 0
  interval    = 1
else:
  if repetitions == 0: interval = 1
  elif repetitions == 1: interval = 6
  else: interval = round(interval * easeFactor)
  repetitions += 1
easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
easeFactor = max(1.3, easeFactor)
due = today + interval 日
```

出題対象（今日の学習キュー）：

- **新規**（due 未設定）… 即出題。
- **復習**（due <= today）… 出題。
- 並び：復習（due が古い順）→ 新規。
- セッション内で「もう一度」を押したカードは、永続スケジュールは翌日でも、
  **当セッションの末尾に再投入**して取りこぼしを防ぐ（in-memory のみ・非永続）。

## AI 生成（任意・主機能だが無くてもコアは動く）

- 入力：自由テキスト/ノート。
- 出力：`{"cards":[{"front":"問い","back":"答え"}]}` を期待し、コードフェンス等は許容してパース。
- 失敗してもコアに影響させない（呼び出し側で握りつぶし、UI でメッセージ表示）。
- 生成結果は**プレビュー**してユーザーが取捨選択してから追加（生成丸呑みしない）。

## 受け入れ基準

- LLM 未設定でも：デッキ作成・手動カード追加・学習・SM-2 スケジュールが完全動作。
- `srs.ts` の純関数にユニットテスト（境界含む）が通る（pantry-tracker 同様 tsx 実行）。
- `npm run build`（tsc --noEmit + vite build）が strict で通る。
- ブラウザ実機で：AI 生成 → プレビュー追加 → 学習 → 4段階評価 → 翌日反映、を確認。
- export → import でデータが復元できる。

## 公開

- `apps/flashcards/`。`deploy.sh` に build + staging を追記、`deploy/index.html` に 1 ブロック追加。
- ライブ予定：https://hiiirano.github.io/public-apps/flashcards/
