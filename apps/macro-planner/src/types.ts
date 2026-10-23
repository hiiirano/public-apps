// PFC・TDEE計算 — 型と範囲
// データはこの端末の localStorage にだけ保存する。

export type Sex = "male" | "female";

/** 活動量（TDEE = 基礎代謝 × 活動係数） */
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export const ACTIVITIES: readonly ActivityLevel[] = ["sedentary", "light", "moderate", "active", "athlete"];

/** 目的（目標カロリーの増減） */
export type Goal = "cut" | "maintain" | "bulk";
export const GOALS: readonly Goal[] = ["cut", "maintain", "bulk"];

/** 計算に使う、そろった体の情報 */
export interface Profile {
  sex: Sex;
  age: number; // 歳（整数）
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  /** たんぱく質 = 体重(kg) × これ（g） */
  proteinPerKg: number;
  /** 脂質が目標カロリーに占める割合（%・整数） */
  fatPercent: number;
}

/** 入力の途中の値。未入力は null（そろうまで計算しない） */
export interface ProfileDraft {
  sex: Sex | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activity: ActivityLevel;
  goal: Goal;
  proteinPerKg: number;
  fatPercent: number;
}

/** 入力できる範囲 */
export const RANGE = {
  age: { min: 18, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 250 },
  proteinPerKg: { min: 0.8, max: 2.5 },
  fatPercent: { min: 15, max: 40 },
} as const;

/** kcal と PFC(g)。目標・食べた合計・残りに使う */
export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

/** 食べたもの1件。date は "YYYY-MM-DD" */
export interface FoodEntry extends Macros {
  id: string;
  name: string;
  date: string;
  createdAt: number;
}

export interface State {
  draft: ProfileDraft;
  log: FoodEntry[];
}

export const NAME_MAX = 30;
export const LOG_MAX = 3000;
export const ENTRY_MAX = { kcal: 5000, g: 500 } as const;
