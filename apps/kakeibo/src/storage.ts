// 端末への保存（localStorage）。保存できない環境でも画面は使える。
import type { Book } from "./types";
import { emptyBook } from "./book";
import { migrateOldBudgets, migrateOldExpense, parseBook } from "./transfer";

export const KEY = "kakeibo.notebook.v2";
/** 形が壊れていたときに、消さずに取っておく場所 */
export const BROKEN_KEY = "kakeibo.notebook.v2.broken";
/** 前の版の保存先 */
export const OLD_KEYS = { expenses: "kakeibo.expenses", budgets: "kakeibo.budgets", llm: "kakeibo.llm" };

let seq = 0;
export const newId = (): string =>
  `e${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** 文字列から帳面を読む。壊れていれば初期状態 */
export function parseStored(raw: string | null): { book: Book; dropped: number; broken: boolean } {
  if (raw === null) return { book: emptyBook(), dropped: 0, broken: false };
  try {
    const r = parseBook(JSON.parse(raw));
    if (r) return { ...r, broken: false };
  } catch {
    /* 下へ */
  }
  return { book: emptyBook(), dropped: 0, broken: true };
}

/** 前の版（v1）の保存内容を今の形に */
export function migrateV1(rawExpenses: string | null, rawBudgets: string | null): Book | null {
  if (rawExpenses === null && rawBudgets === null) return null;
  const book = emptyBook();
  try {
    const list = JSON.parse(rawExpenses ?? "[]");
    if (Array.isArray(list))
      for (const x of list) {
        const e = migrateOldExpense(x, newId);
        if (e) book.expenses.push(e);
      }
  } catch {
    /* 読めない分はあきらめる */
  }
  try {
    book.budgets = migrateOldBudgets(JSON.parse(rawBudgets ?? "{}"));
  } catch {
    /* 同上 */
  }
  return parseBook(book)?.book ?? emptyBook();
}

export interface Loaded {
  book: Book;
  /** 捨てた件数（壊れた行） */
  dropped: number;
  /** 前の版から引き継いだ */
  migrated: boolean;
  /** 全体が壊れていて、初期状態にした */
  broken: boolean;
}

/** localStorage と同じ形の入れ物（テストで差し替えられるように） */
export type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function tryWrite(fn: () => void): boolean {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
}

/**
 * 帳面を読む。読むのに失敗したときだけ初期状態にする。
 * 前の版から引き継いだ帳面は、新しいキーへの保存に失敗しても（容量不足など）そのまま返し、
 * 前の版のデータは消さずに残す（次に開いたとき、もう一度引き継げる）。
 */
export function loadFrom(kv: KV): Loaded {
  let raw: string | null;
  let oldExpenses: string | null = null;
  let oldBudgets: string | null = null;
  try {
    raw = kv.getItem(KEY);
    if (raw === null) {
      oldExpenses = kv.getItem(OLD_KEYS.expenses);
      oldBudgets = kv.getItem(OLD_KEYS.budgets);
    }
  } catch {
    return { book: emptyBook(), dropped: 0, migrated: false, broken: false };
  }
  // 前の版の AI 連携のキー（API キー）は、ここで消す
  tryWrite(() => kv.removeItem(OLD_KEYS.llm));
  if (raw === null) {
    const old = migrateV1(oldExpenses, oldBudgets);
    if (old) {
      const saved = tryWrite(() => kv.setItem(KEY, JSON.stringify(old)));
      if (saved) {
        tryWrite(() => kv.removeItem(OLD_KEYS.expenses));
        tryWrite(() => kv.removeItem(OLD_KEYS.budgets));
      }
      return { book: old, dropped: 0, migrated: true, broken: false };
    }
  }
  const r = parseStored(raw);
  if (r.broken && raw !== null) tryWrite(() => kv.setItem(BROKEN_KEY, raw as string));
  return { ...r, migrated: false };
}

export function load(): Loaded {
  try {
    return loadFrom(localStorage);
  } catch {
    // localStorage そのものに触れない環境
    return { book: emptyBook(), dropped: 0, migrated: false, broken: false };
  }
}

/** 保存できたら true */
export function save(book: Book): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(book));
    return true;
  } catch {
    return false;
  }
}
