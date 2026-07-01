// localStorage 永続化（読み込み失敗時は壊さず既定値にフォールバック）。
// データはこの端末のブラウザにだけ保存される。サーバ送信なし。

import type {
  ActivityLevel,
  FoodEntry,
  Goal,
  Profile,
  Sex,
} from "./types";

const PROFILE_KEY = "macro.profile";
const LOG_KEY = "macro.log";

/** 標準的な初期プロフィール（初回表示用） */
export const DEFAULT_PROFILE: Profile = {
  sex: "male",
  age: 30,
  heightCm: 170,
  weightKg: 65,
  activity: "moderate",
  goal: "maintain",
  proteinPerKg: 2.0,
  fatPercent: 0.25,
};

/** 軽量な一意ID（衝突しにくければ十分・暗号用途ではない） */
export function newId(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** 0以上に丸めた数値（NaN/負は0）。 */
function nonNeg(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

const SEXES: Sex[] = ["male", "female"];
const ACTIVITIES: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "athlete",
];
const GOALS: Goal[] = ["cut", "maintain", "bulk"];

function oneOf<T>(v: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

/** 任意入力を安全な Profile に正規化する（インポートの検疫に使う）。 */
export function normalizeProfile(raw: unknown): Profile {
  const p = (raw ?? {}) as Partial<Profile>;
  return {
    sex: oneOf(p.sex, SEXES, DEFAULT_PROFILE.sex),
    age: clamp(Math.round(num(p.age, DEFAULT_PROFILE.age)), 10, 100),
    heightCm: clamp(num(p.heightCm, DEFAULT_PROFILE.heightCm), 100, 250),
    weightKg: clamp(num(p.weightKg, DEFAULT_PROFILE.weightKg), 25, 300),
    activity: oneOf(p.activity, ACTIVITIES, DEFAULT_PROFILE.activity),
    goal: oneOf(p.goal, GOALS, DEFAULT_PROFILE.goal),
    proteinPerKg: clamp(
      num(p.proteinPerKg, DEFAULT_PROFILE.proteinPerKg),
      0.5,
      4,
    ),
    fatPercent: clamp(num(p.fatPercent, DEFAULT_PROFILE.fatPercent), 0.1, 0.6),
  };
}

/** 任意入力を安全な FoodEntry に正規化する。 */
export function normalizeEntry(raw: unknown): FoodEntry {
  const e = (raw ?? {}) as Partial<FoodEntry>;
  const protein = nonNeg(e.protein);
  const fat = nonNeg(e.fat);
  const carbs = nonNeg(e.carbs);
  return {
    id: str(e.id) || newId("f"),
    name: str(e.name).trim() || "食事",
    kcal: Math.round(nonNeg(e.kcal)),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    date: /^\d{4}-\d{2}-\d{2}$/.test(str(e.date)) ? str(e.date) : todayStr(),
    createdAt:
      typeof e.createdAt === "number" && Number.isFinite(e.createdAt)
        ? e.createdAt
        : Date.now(),
  };
}

/** 端末ローカルの当日 "YYYY-MM-DD"（UIの既定日に使う。コアは日付非依存）。 */
export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(p: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function loadLog(): FoodEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(normalizeEntry);
  } catch {
    return [];
  }
}

export function saveLog(entries: FoodEntry[]): void {
  localStorage.setItem(LOG_KEY, JSON.stringify(entries));
}
