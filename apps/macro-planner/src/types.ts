// macro-planner — ドメイン型定義
//
// データはすべて端末内 localStorage に保存。サーバー送信なし。
// 計算コア（macro.ts）は Profile を受け取り MacroTargets を返す純関数群。

/** 生物学的性別（BMR式の係数に使う。表示は「男性/女性」） */
export type Sex = "male" | "female";

/** 活動レベル（TDEE = BMR × 活動係数） */
export type ActivityLevel =
  | "sedentary" // ほぼ運動なし・デスクワーク
  | "light" // 週1-3回の軽い運動
  | "moderate" // 週3-5回の運動
  | "active" // 週6-7回の運動
  | "athlete"; // 1日2回の激しい運動・肉体労働

/** 目標（目標カロリーの補正方向） */
export type Goal = "cut" | "maintain" | "bulk";

/** ユーザープロフィール。ここから目標カロリーとPFCが決まる。 */
export interface Profile {
  sex: Sex;
  age: number; // 歳
  heightCm: number; // cm
  weightKg: number; // kg
  activity: ActivityLevel;
  goal: Goal;
  /** タンパク質目標 = proteinPerKg × 体重(kg)。既定 2.0 g/kg */
  proteinPerKg: number;
  /** 脂質が総カロリーに占める割合(0..1)。既定 0.25 */
  fatPercent: number;
}

/** 1日の目標（または食事合計）。すべて整数。 */
export interface MacroTargets {
  kcal: number;
  protein: number; // g
  fat: number; // g
  carbs: number; // g
}

/** 食事ログの1エントリ。date は "YYYY-MM-DD"（当日集計に使う）。 */
export interface FoodEntry {
  id: string;
  name: string;
  kcal: number;
  protein: number; // g
  fat: number; // g
  carbs: number; // g
  date: string; // YYYY-MM-DD
  createdAt: number;
}
