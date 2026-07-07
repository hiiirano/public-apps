# 筋トレ記録（gym-log） — SPEC

## ねらい

ジム（チョコザップ）のマシントレと自重トレを、スマホでその場で記録する小さなアプリ。
「前回の重量・回数」を見ながら今日のセットを積み、上半身/下半身のローテーション提案まで出す。

王者（Strong 等）の弱点 → 本アプリの方針:

- **Android での Google Health（Health Connect）連携が弱い** → Phase 2 で Capacitor APK 化して
  ExerciseSession + セグメントを直接書き込む（本 Phase 1 はその土台となる PWA）。
- アカウント必須・サブスク → **アカウント不要・無料**。データは**この端末のブラウザ（localStorage）だけ**。
- 種目 DB が巨大で探しにくい → **プリセットは自重＋チョコザップ標準マシンだけ**に絞り、自由に追加・編集できる。

## 決定的コアの見せ場：今日のおすすめ（ローテーション提案）

`recommend(workouts, exercises, today)` — 端末日付に非依存の純関数。

```
1. 今日すでに記録がある            → rest「今日はトレーニング済み」
2. 昨日・一昨日と2日連続で記録あり → rest「2日連続。休養日がおすすめ」
3. それ以外 → 上半身/下半身のうち「最後にやってから日数が長い方」を提案
   - どちらも未記録 → upper（上半身から）
   - 同日タイ       → upper
   理由文に「◯日空いています（前回 M/D）」を添える
```

ワークアウトの「どの部位をやったか」は、1セット以上記録された種目の `group` の集合
（`core` はローテーション対象外。腹筋だけの日は上半身/下半身の鮮度に影響しない）。

### 前回値の表示（Strong の中核機能）

`lastSetsFor(workouts, exerciseId)` — その種目を最後にやったワークアウトのセット配列を返す。
記録中は各種目の下に「前回: 40kg×10, 40kg×8」を表示し、入力欄の placeholder にも前回値を入れる。

## データモデル

```ts
type MuscleGroup = "upper" | "lower" | "core";
type Metric = "reps" | "seconds";           // プランク等は秒数
interface Exercise {
  id: string; name: string;
  kind: "bodyweight" | "machine";
  group: MuscleGroup;
  metric: Metric;
  archived?: boolean;                        // 削除ではなくアーカイブ（履歴の参照を壊さない）
}
interface SetEntry { weight: number | null; reps: number }   // weight null = 自重
interface WorkoutExercise { exerciseId: string; sets: SetEntry[] }
interface Workout {
  id: string; date: string;                  // "YYYY-MM-DD"
  startedAt: number; endedAt: number | null; // epoch ms（Phase2でExerciseSessionの開始/終了に対応）
  exercises: WorkoutExercise[];
}
```

- localStorage キー: `gymlog.exercises.v1` / `gymlog.workouts.v1` / `gymlog.settings.v1`
- 初回起動時に自重7種＋チョコザップ標準マシン8種をシード（id は固定 slug。Phase2 の
  Health Connect セグメント種別マッピングを安定させるため）。

## 画面

下タブ4つ（片手・親指操作前提のモバイルファースト）:

1. **今日**: おすすめカード → 「トレーニング開始」/ 記録中 UI（種目追加・セット追加・前回値表示・経過時間）→ 終了。今週の回数・総ボリューム。
2. **履歴**: セッション一覧（日付・所要・種目×セット・ボリューム）。タップで詳細、削除可。
3. **種目**: グループ別一覧。追加・編集・アーカイブ。
4. **設定**: 画面スリープ防止（Wake Lock）、JSON エクスポート/インポート、CSV エクスポート。

- 記録中は Wake Lock（設定でON時）で画面が消えない。YouTube 等の音声再生とは競合しない（音を扱わない）。
- PWA: manifest + Service Worker（network-first、オフラインはキャッシュへフォールバック）。
  ホーム画面に追加すればアプリとして全画面起動。

## Phase 2 への足場（このリポジトリでは実装しない）

- `Workout.startedAt/endedAt` → Health Connect `ExerciseSessionRecord`
- `WorkoutExercise` → `ExerciseSegment`（種目種別＋レップ数。**重量は HC 標準に無い**のでアプリ内のみ）
- Capacitor でラップし APK サイドロード。Web 版はそのまま Pages 配信を続ける。

## テスト

`src/logic.test.ts`（`npm test` / tsx）: recommend の全分岐・lastSetsFor・volume・CSV 生成。
