# 家計簿（kakeibo） — SPEC

## ねらい

MoneyForward 等の自動家計簿アプリの弱点を**真逆の思想**で突く、小さな家計簿アプリ。

王者の弱点 → 本アプリの方針:

- 口座/カード連携が必須・プライバシー懸念 → **アカウント不要・データはこの端末のブラウザ（localStorage）だけ**。サーバー送信ゼロ。
- 自動集計で「考えなくなる」 → 伝統的「家計簿（kakeibo）」の**手入力＋4分類＋月末リフレクション**で“お金と向き合う”体験を設計。
- 有料・多機能で重い → 静的SPA・無料・インストール不要・オフライン動作。

## 家計簿4分類（決定的モデル）

支出を 4 つに分類する（家計簿メソッドの定番）:

| 分類 | 意味 | 例 |
|---|---|---|
| 必需 | 生きるのに必要 | 食費・家賃・光熱・交通・医療 |
| 娯楽 | 欲しいけど無くても困らない | 外食・買い物・サブスク・趣味 |
| 文化 | 心を豊かに | 書籍・映画・習い事・美術 |
| 予備 | 突発・想定外 | 冠婚葬祭・修理・医療外の急な出費 |

## 月予算モデル（逆算）

```
使えるお金 = 今月の収入 − 貯金目標
4分類の予算 = 使えるお金 を各カテゴリへ配分（ユーザー任意・合計が使えるお金を超えたら警告）
```

## 決定的コアの見せ場：予算ペース判定（バーンレート予測）

各カテゴリについて、月の経過日数から月末着地を線形予測する純関数:

```
経過日数 = clamp(今日の日, 1, 月の日数)
予測着地 = これまでの支出 / 経過日数 × 月の日数
判定: 予測着地 > 予算 なら「このペースだと予算オーバー」警告
```

これにより「まだ予算は残っているが、ペースが速すぎる」を月の途中で気づける。MoneyForward の事後集計にない**先回り**が差別化点。

## データモデル

- `Expense`: { id, date(YYYY-MM-DD), amount(円・整数), category(4分類), memo?, createdAt }
- `MonthBudget`: { month(YYYY-MM), income, savingsGoal, budgets: Record<Category, number> }
- すべて localStorage に保存。月キーで複数月を保持。

## 機能範囲（MVP）

1. 月の設定（収入・貯金目標・4分類予算）
2. 支出の追加/編集/削除（日付・金額・分類・メモ）
3. ダッシュボード：使えるお金・カテゴリ別 消化率・**予算ペース警告**・貯金達成見込み
4. 月末リフレクション集計（実績 vs 予算、貯金できたか、4つの問い）
5. JSON / CSV エクスポート（端末間移行・バックアップ）
6. 任意 LLM：明細/レシートのテキストを貼ると支出を自動抽出（OpenAI互換・キーは localStorage のみ）

## 非機能

- 静的SPA（Vite + TypeScript・strict）。実行時 LLM 不要でフル動作。
- コアは純関数（`kakeibo.ts`）でユニットテスト。基準日を引数化し端末日付に非依存。
- 公開：GitHub Pages（`base: "./"`）。`deploy.sh` の gh-pages 配信に1ブロック追加。

## アーキテクチャ（pantry-tracker 雛形踏襲）

```
apps/kakeibo/
  index.html / package.json / tsconfig.json / vite.config.ts
  src/
    types.ts        # Category(4分類)/Expense/MonthBudget
    kakeibo.ts      # 決定的純関数コア（配分/集計/バーンレート/サマリ）
    kakeibo.test.ts # ユニットテスト（tsx）
    storage.ts      # localStorage 永続化 + 正規化
    llm.ts          # 任意 LLM（明細→支出抽出）
    main.ts         # 素DOM UI（full re-render）
    style.css
  SPEC.md / README.md
```
