# 割り勘/立替精算（warikan） — SPEC

## ねらい

旅行・飲み会・同棲などで発生する「誰が何を立て替えたか → 最終的に誰が誰にいくら払えば精算できるか」を、
Splitwise 等の弱点を**真逆の思想**で突いて解く小さなアプリ。

王者（Splitwise 等）の弱点 → 本アプリの方針:

- **全員アカウント必須**（招待・登録しないと割り勘に参加できない） → **アカウント不要**。幹事1人が入力し、結果を **URL で共有**するだけ。受け取った側も登録不要。
- 有料プラン・広告・プライバシー懸念 → **データはこの端末のブラウザ（localStorage）だけ**。サーバー送信ゼロ。共有は状態をURLにエンコードして渡す（誰のサーバーにも保存されない）。
- 多機能で重い → 静的SPA・無料・インストール不要・オフライン動作。

## 決定的コアの見せ場：債務最小化（debt minimization）

N人がそれぞれ立て替えた額から、**精算の送金回数を最小化**する「誰 → 誰へ いくら」を計算する純関数。

```
1. 各メンバーの収支 net[i] = (立て替えた合計) − (自分が負担すべき合計)
   - net > 0 … 受け取る側（債権者）
   - net < 0 … 支払う側（債務者）
   - Σ net = 0（端数は後述で吸収）
2. 債務者(負)と債権者(正)を額の大きい順に貪欲マッチング
   - 最大の債務者が最大の債権者へ min(|debtor|, creditor) を送金
   - 片方がゼロになったら次へ。これを全員ゼロになるまで繰り返す
3. 出力 = Settlement[] { from, to, amount }（送金リスト）
```

貪欲法は厳密な最小回数（部分和問題＝NP困難）ではないが、実用上ほぼ最小に収束し、
「全員が全員に払う」素朴割り勘の O(N²) 送金を大幅に削減する。**ここがコアの見せ場**。

### 負担割合（誰がいくら負担すべきか）

各支出 `Expense` は「誰が払ったか(payer)」「誰の分か(participants)」を持つ。

- **均等割り**（デフォルト）: 金額を participants で等分。端数は決定的ルールで配分（先頭メンバーから1円ずつ／基準は payer ではなく id 昇順で安定化）。
- **比率/金額指定**（任意）: participants ごとに重み or 固定額を指定できる（MVP は均等割り＋任意の個別金額のみ）。

端数処理は引数化し（`roundingUnit` = 1円既定）、テストで端末非依存に検証する。

## データモデル

- `Member`: { id, name }
- `Expense`: { id, title, amount(整数), payerId, participantIds[], createdAt, shares?: Record<memberId, number> }
  - `shares` 省略時は participantIds で均等割り。指定時はその金額（合計=amount を検証）。
- `Group`: { id, name, members: Member[], expenses: Expense[], updatedAt }
- すべて localStorage に保存。複数グループを保持（グループ切替）。

## URL 共有モデル

- グループ状態（members + expenses）を JSON → 圧縮（軽量・依存なしの自前 or `encodeURIComponent(btoa(...))`）→ `#data=...` のハッシュに載せる。
- 受け取り側は URL を開くと**読み取り専用プレビュー**で精算結果を確認。「自分の端末に取り込む」で localStorage に保存も可。
- サーバー不要・誰のアカウントも要らない。URL が長すぎる場合は警告（メンバー/支出が多い大規模は対象外と割り切る）。

## 機能範囲（MVP）

1. グループ作成・メンバー追加/削除
2. 支出の追加/編集/削除（タイトル・金額・payer・participants・任意の個別金額）
3. 精算結果：各人の収支（net）と、**最小送金リスト**（誰 → 誰 いくら）
4. URL 共有（リンク生成 / リンクを開いて読み取り専用プレビュー → 取り込み）
5. JSON エクスポート/インポート（バックアップ・端末移行）
6. 任意 LLM：明細テキストを貼ると支出を自動抽出（OpenAI互換・キーは localStorage のみ）

## 非機能

- 静的SPA（Vite + TypeScript・strict）。実行時 LLM 不要でフル動作。
- コアは純関数（`warikan.ts`）でユニットテスト。端数・端末日付に非依存（基準値を引数化）。
- 公開：GitHub Pages（`base: "./"`）。`deploy.sh` の gh-pages 配信に1ブロック追加。

## アーキテクチャ（kakeibo 雛形踏襲）

```
apps/warikan/
  index.html / package.json / tsconfig.json / vite.config.ts
  src/
    types.ts        # Member/Expense/Group/Settlement
    warikan.ts      # 決定的純関数コア（収支計算/債務最小化/均等割り端数処理）
    warikan.test.ts # ユニットテスト（tsx）
    storage.ts      # localStorage 永続化 + 正規化
    share.ts        # URL エンコード/デコード（状態 ⇄ #data=...）
    llm.ts          # 任意 LLM（明細→支出抽出）
    main.ts         # 素DOM UI（full re-render）
    style.css
  SPEC.md / README.md
```
