// macro-planner — 決定的純関数コア
//
// 実行時 LLM 不要・副作用なし・端末日付非依存。ここがアプリの見せ場:
//   1) BMR（基礎代謝）を Mifflin-St Jeor 式で求める
//   2) TDEE（総消費カロリー）= BMR × 活動係数
//   3) 目標カロリー = TDEE を目標(減量/維持/増量)で補正
//   4) PFC 配分 = タンパク質(体重比) + 脂質(カロリー比) → 残りを炭水化物
//   5) 食事ログの合計・残量を集計
//
// 医療アドバイスではなく一般的な推定式。テストで端末非依存に検証する。

import type {
  ActivityLevel,
  FoodEntry,
  Goal,
  MacroTargets,
  Profile,
} from "./types";

/** 活動係数（TDEE = BMR × これ） */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

/** 目標ごとのカロリー補正率（TDEE に対する増減） */
export const GOAL_RATES: Record<Goal, number> = {
  cut: -0.2, // 減量: −20%
  maintain: 0, // 維持: ±0
  bulk: 0.1, // 増量: +10%
};

/** 1gあたりのカロリー（Atwater係数） */
export const KCAL_PER_G = { protein: 4, fat: 9, carbs: 4 } as const;

/**
 * 基礎代謝(BMR) — Mifflin-St Jeor 式。
 *   男性: 10·kg + 6.25·cm − 5·age + 5
 *   女性: 10·kg + 6.25·cm − 5·age − 161
 * 返り値は kcal（丸めなし・後段でまとめて丸める）。
 */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === "male" ? base + 5 : base - 161;
}

/** 総消費カロリー(TDEE) = BMR × 活動係数。 */
export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_FACTORS[p.activity];
}

/** 目標カロリー = TDEE × (1 + 目標補正率)。整数に丸める。 */
export function targetCalories(p: Profile): number {
  return Math.round(tdee(p) * (1 + GOAL_RATES[p.goal]));
}

/**
 * 目標PFC(g)。
 * - タンパク質 = proteinPerKg × 体重（体重比で決める）
 * - 脂質       = 目標カロリー × fatPercent ÷ 9
 * - 炭水化物   = 残りカロリー ÷ 4（負にはしない）
 *
 * 丸め・下限クランプの都合で PFC 由来カロリー合計は目標 kcal と数十kcal
 * ずれることがある（macroKcal で実値を確認できる）。実運用では許容範囲。
 */
export function macroTargets(p: Profile): MacroTargets {
  const kcal = targetCalories(p);
  const protein = Math.max(0, Math.round(p.proteinPerKg * p.weightKg));
  const fat = Math.max(0, Math.round((kcal * p.fatPercent) / KCAL_PER_G.fat));
  const carbsKcal =
    kcal - protein * KCAL_PER_G.protein - fat * KCAL_PER_G.fat;
  const carbs = Math.max(0, Math.round(carbsKcal / KCAL_PER_G.carbs));
  return { kcal, protein, fat, carbs };
}

/** PFC(g) から算出カロリー。エントリの kcal 未入力時の補完にも使う。 */
export function macroKcal(m: {
  protein: number;
  fat: number;
  carbs: number;
}): number {
  return Math.round(
    m.protein * KCAL_PER_G.protein +
      m.fat * KCAL_PER_G.fat +
      m.carbs * KCAL_PER_G.carbs,
  );
}

/** 食事ログの合計（kcal と PFC）。空なら全ゼロ。 */
export function sumEntries(entries: FoodEntry[]): MacroTargets {
  return entries.reduce<MacroTargets>(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      fat: acc.fat + e.fat,
      carbs: acc.carbs + e.carbs,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

/** 残量 = 目標 − 摂取。負なら超過。 */
export function remaining(
  target: MacroTargets,
  consumed: MacroTargets,
): MacroTargets {
  return {
    kcal: target.kcal - consumed.kcal,
    protein: target.protein - consumed.protein,
    fat: target.fat - consumed.fat,
    carbs: target.carbs - consumed.carbs,
  };
}

/** 指定日付("YYYY-MM-DD")のエントリだけ抽出。 */
export function entriesForDate(
  entries: FoodEntry[],
  date: string,
): FoodEntry[] {
  return entries.filter((e) => e.date === date);
}

/** BMI = kg ÷ (m^2)。おまけの体格指標（小数第1位）。 */
export function bmi(p: Profile): number {
  const m = p.heightCm / 100;
  if (m <= 0) return 0;
  return Math.round((p.weightKg / (m * m)) * 10) / 10;
}

/** BMI カテゴリ（日本肥満学会基準）。 */
export function bmiCategory(value: number): string {
  if (value <= 0) return "—";
  if (value < 18.5) return "低体重";
  if (value < 25) return "普通体重";
  if (value < 30) return "肥満(1度)";
  if (value < 35) return "肥満(2度)";
  if (value < 40) return "肥満(3度)";
  return "肥満(4度)";
}
