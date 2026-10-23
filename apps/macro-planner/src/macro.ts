// PFC・TDEE計算 — 計算の純関数（画面・保存・日付に依存しない）
// 式の根拠は docs/01_要件定義.md「5. 計算のきまり」。
import type { ActivityLevel, FoodEntry, Goal, Macros, Profile, ProfileDraft } from "./types";
import { RANGE } from "./types";

/** 活動係数（TDEE = 基礎代謝 × これ） */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

/** 目的ごとの増減（TDEE に対する割合） */
export const GOAL_RATES: Record<Goal, number> = { cut: -0.2, maintain: 0, bulk: 0.1 };

/** 1g あたりの kcal（アトウォーター係数） */
export const KCAL_PER_G = { protein: 4, fat: 9, carbs: 4 } as const;

/** 国の目安（日本人の食事摂取基準 2020年版・2025年版のエネルギー産生栄養素バランス、目標量 %） */
export const BALANCE_RANGE = {
  protein: { min: 13, max: 20 },
  fat: { min: 20, max: 30 },
  carbs: { min: 50, max: 65 },
} as const;

export const DEFAULT_PROTEIN_PER_KG = 1.5;
export const DEFAULT_FAT_PERCENT = 25;

/** 基礎代謝（Mifflin-St Jeor 式）。丸めない */
export function bmr(p: Pick<Profile, "sex" | "age" | "heightCm" | "weightKg">): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === "male" ? base + 5 : base - 161;
}

/** 1日の消費カロリー（TDEE）。丸めない */
export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_FACTORS[p.activity];
}

export interface CalorieTarget {
  kcal: number;
  /** へらすとき、基礎代謝を下回らないよう引き上げたら true */
  raisedToBmr: boolean;
}

/** 目標カロリー = TDEE ×（1 + 増減）。へらすときも基礎代謝は下回らない。整数 */
export function targetCalories(p: Profile): CalorieTarget {
  const raw = tdee(p) * (1 + GOAL_RATES[p.goal]);
  const floor = bmr(p);
  if (p.goal === "cut" && raw < floor) return { kcal: Math.round(floor), raisedToBmr: true };
  return { kcal: Math.round(raw), raisedToBmr: false };
}

/**
 * 目標の PFC(g)。
 * たんぱく質 = 体重 × g/kg、脂質 = 目標kcal × %、炭水化物 = 残りの kcal ÷ 4（0 未満にしない）
 */
export function macroTargets(p: Profile): Macros & { raisedToBmr: boolean; carbsShort: boolean } {
  const { kcal, raisedToBmr } = targetCalories(p);
  const protein = Math.round(p.proteinPerKg * p.weightKg);
  const fat = Math.round((kcal * p.fatPercent) / 100 / KCAL_PER_G.fat);
  const rest = kcal - protein * KCAL_PER_G.protein - fat * KCAL_PER_G.fat;
  const carbs = Math.max(0, Math.round(rest / KCAL_PER_G.carbs));
  return { kcal, protein, fat, carbs, raisedToBmr, carbsShort: rest < 0 };
}

/** PFC(g) から kcal を出す（整数） */
export function macroKcal(m: Pick<Macros, "protein" | "fat" | "carbs">): number {
  return Math.round(m.protein * KCAL_PER_G.protein + m.fat * KCAL_PER_G.fat + m.carbs * KCAL_PER_G.carbs);
}

/**
 * PFC それぞれが kcal に占める割合（%）。整数で、合計はちょうど 100。
 * すべて 0 なら [0, 0, 0]。端数は大きい順に配る（最大剰余法）。
 */
export function pfcRatio(m: Pick<Macros, "protein" | "fat" | "carbs">): { protein: number; fat: number; carbs: number } {
  const parts = [m.protein * KCAL_PER_G.protein, m.fat * KCAL_PER_G.fat, m.carbs * KCAL_PER_G.carbs].map((v) =>
    Math.max(0, v),
  );
  const total = parts[0] + parts[1] + parts[2];
  if (total <= 0) return { protein: 0, fat: 0, carbs: 0 };
  const exact = parts.map((v) => (v / total) * 100);
  const floor = exact.map(Math.floor);
  let left = 100 - floor.reduce((a, b) => a + b, 0);
  const order = [0, 1, 2].sort((a, b) => exact[b] - floor[b] - (exact[a] - floor[a]) || a - b);
  for (const i of order) {
    if (left <= 0) break;
    floor[i] += 1;
    left -= 1;
  }
  return { protein: floor[0], fat: floor[1], carbs: floor[2] };
}

export type BalanceKey = keyof typeof BALANCE_RANGE;

/** 国の目安から外れた栄養素と向き（多い / 少ない） */
export function balanceNotes(m: Pick<Macros, "protein" | "fat" | "carbs">): Array<{ key: BalanceKey; dir: "high" | "low" }> {
  const r = pfcRatio(m);
  const out: Array<{ key: BalanceKey; dir: "high" | "low" }> = [];
  for (const key of ["protein", "fat", "carbs"] as const) {
    if (r[key] < BALANCE_RANGE[key].min) out.push({ key, dir: "low" });
    else if (r[key] > BALANCE_RANGE[key].max) out.push({ key, dir: "high" });
  }
  return out;
}

/** BMI（小数第1位） */
export function bmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  if (!(m > 0) || !(weightKg > 0)) return 0;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** BMI の区分（日本肥満学会） */
export function bmiCategory(value: number): string {
  if (!(value > 0)) return "—";
  if (value < 18.5) return "低体重";
  if (value < 25) return "普通体重";
  if (value < 30) return "肥満（1度）";
  if (value < 35) return "肥満（2度）";
  if (value < 40) return "肥満（3度）";
  return "肥満（4度）";
}

/** BMI 22 になる体重（小数第1位） */
export function standardWeight(heightCm: number): number {
  const m = heightCm / 100;
  return Math.round(22 * m * m * 10) / 10;
}

// ---- 数字が苦手な人向けの言い換え ----

/** 言い換えに使う食べ物（日本食品標準成分表 八訂 の値をもとにした目安） */
export const MEASURES = {
  /** ごはん 茶碗1杯 150g */
  rice: { kcal: 234, carbs: 55.7 },
  /** 食パン 6枚切り1枚 60g */
  bread: { carbs: 27.8 },
  /** 鶏むね肉（皮なし）100g */
  chicken: { protein: 23.3 },
  /** 卵 1個（可食部 50g） */
  egg: { protein: 6.1 },
  /** バター 大さじ1（12g） */
  butter: { fat: 9.7 },
} as const;

/** 0.5 きざみに丸める（言い換え用） */
export function roundHalf(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 2) / 2;
}

export interface Equivalents {
  perMealKcal: number;
  riceBowls: number;
  breadSlices: number;
  chickenGrams: number;
  eggs: number;
  butterSpoons: number;
}

/** 目標を身近な食べ物の量に言い換える */
export function equivalents(t: Macros): Equivalents {
  return {
    perMealKcal: Math.round(t.kcal / 3 / 10) * 10,
    riceBowls: roundHalf(t.kcal / MEASURES.rice.kcal),
    breadSlices: roundHalf(t.carbs / MEASURES.bread.carbs),
    chickenGrams: Math.round(((t.protein / MEASURES.chicken.protein) * 100) / 10) * 10,
    eggs: roundHalf(t.protein / MEASURES.egg.protein),
    butterSpoons: roundHalf(t.fat / MEASURES.butter.fat),
  };
}

// ---- 食べた記録 ----

export const ZERO: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

/** 合計（PFC は小数第1位まで） */
export function sumEntries(entries: Macros[]): Macros {
  const s = entries.reduce<Macros>(
    (a, e) => ({ kcal: a.kcal + e.kcal, protein: a.protein + e.protein, fat: a.fat + e.fat, carbs: a.carbs + e.carbs }),
    { ...ZERO },
  );
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return { kcal: Math.round(s.kcal), protein: r1(s.protein), fat: r1(s.fat), carbs: r1(s.carbs) };
}

/** 残り = 目標 − 食べた分（マイナスは食べすぎ） */
export function remaining(target: Macros, eaten: Macros): Macros {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    kcal: target.kcal - eaten.kcal,
    protein: r1(target.protein - eaten.protein),
    fat: r1(target.fat - eaten.fat),
    carbs: r1(target.carbs - eaten.carbs),
  };
}

export function entriesForDate<T extends Pick<FoodEntry, "date">>(entries: T[], date: string): T[] {
  return entries.filter((e) => e.date === date);
}

// ---- 入力の読み取り ----

/** 全角数字・全角ピリオド・カンマ・単位つき（「６５．５kg」）を数に。読めなければ NaN、空なら null */
export function parseNumber(raw: string): number | null {
  const s = raw
    .replace(/[０-９．，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,\s]/g, "")
    .replace(/(歳|才|cm|ｃｍ|センチ|kg|ｋｇ|キロ|kcal|g|ｇ|%|％)$/i, "");
  if (s === "") return null;
  if (!/^\d+(\.\d+)?$/.test(s) && !/^\.\d+$/.test(s)) return Number.NaN;
  return Number(s);
}

export type FieldKey = "age" | "heightCm" | "weightKg" | "proteinPerKg" | "fatPercent";

/** 1つの欄を読んで、範囲を調べる。null は未入力 */
export function readField(key: FieldKey, raw: string): { value: number | null; error: string } {
  const n = parseNumber(raw);
  if (n === null) return { value: null, error: "" };
  if (Number.isNaN(n)) return { value: null, error: "数字で入れてください。" };
  const r = RANGE[key];
  if (n < r.min || n > r.max) return { value: null, error: `${r.min}〜${r.max} の数で入れてください。` };
  const v = key === "age" || key === "fatPercent" ? Math.round(n) : Math.round(n * 10) / 10;
  return { value: v, error: "" };
}

/** 入力の途中から、計算できる Profile を作る。そろっていなければ null */
export function completeProfile(d: ProfileDraft): Profile | null {
  if (d.sex === null || d.age === null || d.heightCm === null || d.weightKg === null) return null;
  return {
    sex: d.sex,
    age: d.age,
    heightCm: d.heightCm,
    weightKg: d.weightKg,
    activity: d.activity,
    goal: d.goal,
    proteinPerKg: d.proteinPerKg,
    fatPercent: d.fatPercent,
  };
}
