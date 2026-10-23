// 端末への保存。読み込み時に形と範囲を検査し、壊れていれば初期状態にする。
// 保存できない環境（プライベートブラウズなど）でも計算はできる。
import type { FoodEntry, ProfileDraft, State } from "./types";
import { ACTIVITIES, ENTRY_MAX, GOALS, LOG_MAX, NAME_MAX, RANGE } from "./types";
import { DEFAULT_FAT_PERCENT, DEFAULT_PROTEIN_PER_KG } from "./macro";

export const KEY = "macro-planner.v2";
/** 前の版の保存キー。macro.llm には API キーが入っていたので、読まずに消す */
const OLD_KEYS = { profile: "macro.profile", log: "macro.log", llm: "macro.llm" };

let seq = 0;
export const newId = (): string =>
  `f${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function freshDraft(): ProfileDraft {
  return {
    sex: null,
    age: null,
    heightCm: null,
    weightKg: null,
    activity: "light",
    goal: "maintain",
    proteinPerKg: DEFAULT_PROTEIN_PER_KG,
    fatPercent: DEFAULT_FAT_PERCENT,
  };
}

export function freshState(): State {
  return { draft: freshDraft(), log: [] };
}

const inRange = (v: unknown, r: { min: number; max: number }): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= r.min && v <= r.max;
const nullOr = (v: unknown, r: { min: number; max: number }) => v === null || inRange(v, r);

function validDraft(d: any): d is ProfileDraft {
  return (
    d &&
    (d.sex === null || d.sex === "male" || d.sex === "female") &&
    nullOr(d.age, RANGE.age) &&
    nullOr(d.heightCm, RANGE.heightCm) &&
    nullOr(d.weightKg, RANGE.weightKg) &&
    ACTIVITIES.includes(d.activity) &&
    GOALS.includes(d.goal) &&
    inRange(d.proteinPerKg, RANGE.proteinPerKg) &&
    inRange(d.fatPercent, RANGE.fatPercent)
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validEntry(e: any): e is FoodEntry {
  const g = { min: 0, max: ENTRY_MAX.g };
  return (
    e &&
    typeof e.id === "string" &&
    e.id.length > 0 &&
    e.id.length <= 40 &&
    typeof e.name === "string" &&
    e.name.length > 0 &&
    e.name.length <= NAME_MAX &&
    inRange(e.kcal, { min: 0, max: ENTRY_MAX.kcal }) &&
    inRange(e.protein, g) &&
    inRange(e.fat, g) &&
    inRange(e.carbs, g) &&
    typeof e.date === "string" &&
    DATE_RE.test(e.date) &&
    typeof e.createdAt === "number" &&
    Number.isFinite(e.createdAt)
  );
}

const copyDraft = (d: ProfileDraft): ProfileDraft => ({ ...d });
const copyEntry = (e: FoodEntry): FoodEntry => ({
  id: e.id,
  name: e.name,
  kcal: e.kcal,
  protein: e.protein,
  fat: e.fat,
  carbs: e.carbs,
  date: e.date,
  createdAt: e.createdAt,
});

/** 保存内容を検査して読む。形が違えば初期状態。記録は正しいものだけ残す */
export function parseState(raw: string | null): State {
  try {
    const s = JSON.parse(raw ?? "null");
    if (!s || !validDraft(s.draft) || !Array.isArray(s.log)) return freshState();
    const log = s.log.filter(validEntry).slice(-LOG_MAX).map(copyEntry);
    return { draft: copyDraft(s.draft), log };
  } catch {
    return freshState();
  }
}

/** 前の版（macro.profile / macro.log）から体の情報と記録を引き継ぐ。読めないものは捨てる */
export function migrateOld(profileRaw: string | null, logRaw: string | null): State | null {
  if (profileRaw === null && logRaw === null) return null;
  const st = freshState();
  try {
    const p = JSON.parse(profileRaw ?? "null");
    if (p && typeof p === "object") {
      const d = st.draft;
      if (p.sex === "male" || p.sex === "female") d.sex = p.sex;
      if (inRange(p.age, RANGE.age)) d.age = Math.round(p.age);
      if (inRange(p.heightCm, RANGE.heightCm)) d.heightCm = Math.round(p.heightCm * 10) / 10;
      if (inRange(p.weightKg, RANGE.weightKg)) d.weightKg = Math.round(p.weightKg * 10) / 10;
      if (ACTIVITIES.includes(p.activity)) d.activity = p.activity;
      if (GOALS.includes(p.goal)) d.goal = p.goal;
    }
  } catch {
    /* 読めなければ初期値 */
  }
  try {
    const l = JSON.parse(logRaw ?? "null");
    if (Array.isArray(l))
      st.log = l
        .map((e: any) => (e && typeof e.name === "string" ? { ...e, name: e.name.trim().slice(0, NAME_MAX) } : e))
        .filter(validEntry)
        .slice(-LOG_MAX)
        .map(copyEntry);
  } catch {
    /* 読めなければ空 */
  }
  return st;
}

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null) return parseState(raw);
    const migrated = migrateOld(localStorage.getItem(OLD_KEYS.profile), localStorage.getItem(OLD_KEYS.log));
    for (const k of Object.values(OLD_KEYS)) localStorage.removeItem(k);
    return migrated ?? freshState();
  } catch {
    return freshState();
  }
}

/** 保存できたら true */
export function save(s: State): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

/** バックアップ用の文字列 */
export function exportText(s: State): string {
  return JSON.stringify({ app: "macro-planner", version: 2, ...s }, null, 2);
}

/** バックアップを読む。読めなければ null（v2 の形のみ） */
export function importText(text: string): State | null {
  try {
    const obj = JSON.parse(text);
    if (!obj || obj.app !== "macro-planner" || !validDraft(obj.draft) || !Array.isArray(obj.log)) return null;
    return parseState(JSON.stringify({ draft: obj.draft, log: obj.log }));
  } catch {
    return null;
  }
}

/** 端末の今日 "YYYY-MM-DD" */
export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
