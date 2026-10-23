// 端末への保存（localStorage）。読み込み時に形と範囲を検査し、壊れていれば初期状態にする。
import type { Allergen, GenrePref, PlannerInput } from "./types";
import { ALL_ALLERGENS, GENRE_PREFS } from "./types";

export const KEY = "meal-planner.v3";
const OLD_KEYS = ["meal-planner.input", "meal-planner.result.v1", "meal-planner.result.v2", "meal-planner.llm"];
const TERM_MAX = 20;
const LIST_MAX = 30;

export interface State {
  input: PlannerInput;
  /** 「この日を変える」を押した回数（曜日 1..7 → 回数） */
  swaps: Record<number, number>;
  /** 買い物リストで買ったもの（材料名__単位） */
  checked: string[];
}

export function defaultInput(seed = 1): PlannerInput {
  return {
    adults: 2,
    children: 1,
    genrePref: "おまかせ",
    excludeAllergens: [],
    dislikes: [],
    pantry: [],
    withSide: true,
    withSoup: true,
    quickOnly: false,
    seed,
  };
}

export function freshState(seed = 1): State {
  return { input: defaultInput(seed), swaps: {}, checked: [] };
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

function terms(a: unknown): string[] | null {
  if (!Array.isArray(a) || a.length > LIST_MAX) return null;
  if (!a.every((x) => typeof x === "string" && x.trim().length > 0 && x.length <= TERM_MAX)) return null;
  return a.map((x: string) => x.trim());
}

export function validInput(v: any): PlannerInput | null {
  if (!v || typeof v !== "object") return null;
  const dislikes = terms(v.dislikes);
  const pantry = terms(v.pantry);
  if (
    !isInt(v.adults, 1, 10) ||
    !isInt(v.children, 0, 10) ||
    !GENRE_PREFS.includes(v.genrePref) ||
    !Array.isArray(v.excludeAllergens) ||
    !v.excludeAllergens.every((a: unknown) => ALL_ALLERGENS.includes(a as Allergen)) ||
    !dislikes ||
    !pantry ||
    typeof v.withSide !== "boolean" ||
    typeof v.withSoup !== "boolean" ||
    typeof v.quickOnly !== "boolean" ||
    !isInt(v.seed, 0, 0xffffffff)
  )
    return null;
  return {
    adults: v.adults,
    children: v.children,
    genrePref: v.genrePref as GenrePref,
    excludeAllergens: [...new Set(v.excludeAllergens as Allergen[])],
    dislikes,
    pantry,
    withSide: v.withSide,
    withSoup: v.withSoup,
    quickOnly: v.quickOnly,
    seed: v.seed,
  };
}

/** 保存内容を検証して読む。壊れていたり古い形式なら初期状態 */
export function parseState(raw: string | null, seed = 1): State {
  try {
    const s = JSON.parse(raw ?? "null");
    const input = validInput(s?.input);
    if (!s || s.v !== 3 || !input) return freshState(seed);
    const swaps: Record<number, number> = {};
    if (s.swaps && typeof s.swaps === "object" && !Array.isArray(s.swaps)) {
      for (const [k, n] of Object.entries(s.swaps)) if (isInt(Number(k), 1, 7) && isInt(n, 1, 50)) swaps[Number(k)] = n as number;
    }
    const checked = Array.isArray(s.checked) ? s.checked.filter((x: unknown) => typeof x === "string" && x.length <= 60).slice(0, 300) : [];
    return { input, swaps, checked };
  } catch {
    return freshState(seed);
  }
}

/**
 * 前の版（v2）の入力を引き継ぐ。アレルギーの設定は安全のため必ず引き継ぐ。
 * ジャンルは1つだけ選んでいれば「多め」に、それ以外は「おまかせ」にする。
 */
export function migrateOld(raw: string | null, seed = 1): State | null {
  try {
    const o = JSON.parse(raw ?? "null");
    if (!o || typeof o !== "object") return null;
    const base = defaultInput(seed);
    const list = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === "string" && !!x.trim() && x.length <= TERM_MAX).map((x) => x.trim()).slice(0, LIST_MAX) : []);
    const genres = list(o.genres);
    const input: PlannerInput = {
      ...base,
      adults: isInt(o.adults, 1, 10) ? o.adults : base.adults,
      children: isInt(o.children, 0, 10) ? o.children : base.children,
      genrePref: genres.length === 1 && GENRE_PREFS.includes(genres[0] as GenrePref) ? (genres[0] as GenrePref) : "おまかせ",
      excludeAllergens: list(o.excludeAllergens).filter((a): a is Allergen => ALL_ALLERGENS.includes(a as Allergen)),
      dislikes: list(o.ngKeywords),
      pantry: list(o.pantry),
      withSide: o.withSide !== false,
      quickOnly: o.quickOnly === true,
    };
    return { input, swaps: {}, checked: [] };
  } catch {
    return null;
  }
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * 読み込む。前の版の保存があれば引き継ぎ、新しい形で保存できたときだけ古いキーを消す。
 * 保存できなかったときは古いキーを残し（次回も引き継げるように）、引き継いだ内容で動かす。
 */
export function load(seed = 1, store?: StorageLike): State {
  try {
    const st = store ?? globalThis.localStorage;
    const raw = st.getItem(KEY);
    if (raw) return parseState(raw, seed);
    const old = migrateOld(st.getItem("meal-planner.input"), seed);
    const next = old ?? freshState(seed);
    if (old && !save(next, st)) return next;
    try {
      for (const k of OLD_KEYS) st.removeItem(k);
    } catch {
      /* 消せなくても動作に影響しない */
    }
    return next;
  } catch {
    return freshState(seed);
  }
}

/** 保存できたら true。保存できない環境でも献立は作れる */
export function save(s: State, store?: StorageLike): boolean {
  try {
    (store ?? globalThis.localStorage).setItem(KEY, JSON.stringify({ v: 3, ...s }));
    return true;
  } catch {
    return false;
  }
}
