# PFC・TDEE計算（macro-planner） — SPEC

## ねらい

「自分は1日どれくらい食べていいのか（目標カロリー）」と「タンパク質・脂質・炭水化物(PFC)の内訳」を、
身長体重・活動量・目標を入れるだけで出し、食事ログで残量を追える小さなアプリ。

王者（MyFitnessPal 等）の弱点 → 本アプリの方針:

- **アカウント必須・食品DBサーバー前提・広告/有料** → **アカウント不要**。計算は端末内で完結し、**データはこの端末のブラウザ（localStorage）だけ**。
- 計算過程がブラックボックス → **式を明示**（Mifflin-St Jeor / Atwater係数）。純関数でユニットテスト済み、誰でも検証できる。
- 重い → 静的SPA・無料・インストール不要・オフライン動作。

## 決定的コアの見せ場：TDEE → 目標カロリー → PFC配分

```
1. BMR（基礎代謝）= Mifflin-St Jeor 式
   男性: 10·kg + 6.25·cm − 5·age + 5
   女性: 10·kg + 6.25·cm − 5·age − 161
2. TDEE（総消費）= BMR × 活動係数
   sedentary 1.2 / light 1.375 / moderate 1.55 / active 1.725 / athlete 1.9
3. 目標カロリー = TDEE × (1 + 目標補正率)
   cut −20% / maintain ±0 / bulk +10%
4. PFC(g):
   - タンパク質 = proteinPerKg × 体重（既定 2.0 g/kg）
   - 脂質       = 目標kcal × fatPercent ÷ 9（既定 25%）
   - 炭水化物   = 残りカロリー ÷ 4（負にはしない）
```

丸め・下限クランプの都合で PFC 由来カロリー合計は目標 kcal と数十kcal ずれることがあるが、
実運用では許容範囲（`macroKcal` で実値を確認可）。**ここがコアの見せ場**で、端末日付に非依存・純関数。

### 食事ログ集計

- `FoodEntry { name, kcal, protein, fat, carbs, date }` を localStorage に蓄積。
- `sumEntries` で当日合計、`remaining` = 目標 − 摂取（負なら超過）。
- kcal 未入力時は PFC から Atwater係数で補完（`macroKcal`）。

## データモデル

- `Profile`: { sex, age, heightCm, weightKg, activity, goal, proteinPerKg, fatPercent }
- `MacroTargets`: { kcal, protein, fat, carbs }（目標・合計・残量の共通型）
- `FoodEntry`: { id, name, kcal, protein, fat, carbs, date(YYYY-MM-DD), createdAt }
- すべて localStorage に保存（キー: `macro.profile` / `macro.log` / `macro.llm`）。

## 機能範囲（MVP）

1. プロフィール入力 → BMR/TDEE/目標カロリー/目標PFC/BMI をリアルタイム表示
2. 食事ログ：日付ごとに食品を追加/削除、残量をバー表示（超過は赤）
3. 任意 LLM：食事メモ（「鶏むね肉200g、白米150g…」）を貼ると各食品の kcal/PFC を推定して追加
4. JSON エクスポート/インポート（バックアップ・端末移行）

## 非機能

- 静的SPA（Vite + TypeScript・strict）。実行時 LLM 不要でフル動作。
- コアは純関数（`macro.ts`）でユニットテスト。端末日付に非依存。
- 一般的な推定式であり医療・栄養指導ではない旨をフッターに明記。
- 公開：GitHub Pages（`base: "./"`）。`deploy.sh` の gh-pages 配信に1ブロック追加。

## アーキテクチャ（kakeibo/warikan 雛形踏襲）

```
apps/macro-planner/
  index.html / package.json / tsconfig.json / vite.config.ts
  src/
    types.ts        # Profile/MacroTargets/FoodEntry
    macro.ts        # 決定的純関数コア（BMR/TDEE/目標PFC/集計/BMI）
    macro.test.ts   # ユニットテスト（tsx）
    storage.ts      # localStorage 永続化 + 正規化 + 既定プロフィール
    llm.ts          # 任意 LLM（食事メモ→kcal/PFC推定）
    main.ts         # 素DOM UI（full re-render）
    style.css
  SPEC.md / README.md
```
