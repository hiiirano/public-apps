// 保存内容の検査と、書き出し・読み込み（JSON / CSV）。純関数だけ。
import type { Book, CategoryId, Expense } from "./types";
import { CATEGORIES, isCategoryId, MAX_AMOUNT, MAX_BUDGET, MAX_EXPENSES, MEMO_MAX } from "./types";
import { isDateKey, isMonthKey } from "./dates";

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

export const isId = (v: unknown): v is string => typeof v === "string" && /^[\w-]{1,60}$/.test(v);

/** メモを整える（改行・制御文字をのぞき、長さを切る） */
export function cleanMemo(v: unknown): string {
  if (typeof v !== "string") return "";
  return [...v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim()].slice(0, MEMO_MAX).join("").trim();
}

export function isExpense(x: unknown): x is Expense {
  const e = x as Expense;
  return (
    !!e &&
    typeof e === "object" &&
    isId(e.id) &&
    isDateKey(e.date) &&
    isInt(e.amount, 1, MAX_AMOUNT) &&
    isCategoryId(e.cat) &&
    typeof e.memo === "string" &&
    [...e.memo].length <= MEMO_MAX &&
    typeof e.at === "number" &&
    Number.isFinite(e.at)
  );
}

function cleanBudgets(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) if (isMonthKey(k) && isInt(v, 0, MAX_BUDGET)) out[k] = v;
  return out;
}

/**
 * 保存された帳面を検査して読む。
 * 全体の形が違えば null（呼び出し側で初期状態にする）。1件ずつの不正はその件だけ捨て、数を返す。
 * 件数の上限はここでは当てない（保存済みの記録を黙って捨てないため。上限は書く・読み込むときに当てる）。
 */
export function parseBook(raw: unknown): { book: Book; dropped: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { expenses?: unknown; budgets?: unknown };
  if (!Array.isArray(r.expenses)) return null;
  const seen = new Set<string>();
  const expenses: Expense[] = [];
  let dropped = 0;
  for (const e of r.expenses) {
    if (isExpense(e) && !seen.has(e.id)) {
      seen.add(e.id);
      expenses.push({ id: e.id, date: e.date, amount: e.amount, cat: e.cat, memo: e.memo, at: e.at });
    } else dropped++;
  }
  return { book: { expenses, budgets: cleanBudgets(r.budgets) }, dropped };
}

// ---- 前の版（v1: 4分類）からの引き継ぎ ----
const OLD_CATEGORIES = ["必需", "娯楽", "文化", "予備"];

/** v1 の支出1件を今の形に。費目は「その他」にし、元の分類をメモの頭に残す */
export function migrateOldExpense(x: unknown, newId: () => string): Expense | null {
  const o = x as Record<string, unknown>;
  if (!o || typeof o !== "object") return null;
  const amount = Math.round(Number(o.amount));
  if (!isDateKey(o.date) || !isInt(amount, 1, MAX_AMOUNT)) return null;
  const old = typeof o.category === "string" && OLD_CATEGORIES.includes(o.category) ? o.category : "";
  const memo = cleanMemo(`${old ? `[${old}] ` : ""}${typeof o.memo === "string" ? o.memo : ""}`);
  const at = Date.parse(String(o.createdAt));
  return { id: isId(o.id) ? o.id : newId(), date: o.date, amount, cat: "other", memo, at: Number.isFinite(at) ? at : 0 };
}

/** v1 の月予算（収入 − 貯金目標、なければ4分類の合計）を、月の予算に */
export function migrateOldBudgets(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, any>)) {
    if (!isMonthKey(k) || !v || typeof v !== "object") continue;
    const income = Math.round(Number(v.income)) || 0;
    const save = Math.round(Number(v.savingsGoal)) || 0;
    const parts = v.budgets && typeof v.budgets === "object" ? Object.values(v.budgets).reduce<number>((s, n) => s + (Math.round(Number(n)) || 0), 0) : 0;
    const value = income - save > 0 ? income - save : parts;
    if (isInt(value, 1, MAX_BUDGET)) out[k] = value;
  }
  return out;
}

// ---- 書き出し ----
export const BACKUP_APP = "kakeibo";
export const BACKUP_VERSION = 2;

export function toBackupJson(book: Book, exportedAt: string): string {
  const expenses = [...book.expenses].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.at - b.at));
  return JSON.stringify({ app: BACKUP_APP, version: BACKUP_VERSION, exportedAt, expenses, budgets: book.budgets }, null, 1);
}

const labelOf = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!.label;

/** 表計算ソフトで式として動かないよう、= + - @ で始まるメモの頭に ' を付ける（' で始まるものにも付け、読み込みで1つ外す） */
function csvCell(s: string): string {
  const safe = /^[=+\-@']/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const CSV_HEADER = ["日付", "金額", "費目", "メモ", "id"];

/** CSV（Excel で文字化けしないよう、先頭の BOM は呼び出し側で付ける） */
export function toCsv(expenses: readonly Expense[]): string {
  const rows = [...expenses]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.at - b.at))
    .map((e) => [e.date, String(e.amount), labelOf(e.cat), csvCell(e.memo), e.id].join(","));
  return [CSV_HEADER.join(","), ...rows].join("\r\n") + "\r\n";
}

/** CSV を行と列に（"" のくくり・改行入りのセルに対応） */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** 読み込んだ1件。id がない行は null（中身が同じものがあればとばす） */
export interface Incoming {
  expenses: { e: Expense; hadId: boolean }[];
  budgets: Record<string, number>;
  /** 読めなかった行の数 */
  bad: number;
}

export class ImportError extends Error {}

function catFromText(v: string): { cat: CategoryId; note: string } {
  const t = v.trim();
  const hit = CATEGORIES.find((c) => c.label === t || c.id === t);
  if (hit) return { cat: hit.id, note: "" };
  return { cat: "other", note: t ? `[${t}] ` : "" };
}

/** 日付の揺れ（2026/1/5 など）を YYYY-MM-DD に */
function normDate(v: string): string {
  const m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(v.normalize("NFKC").trim());
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : "";
}

export function importCsv(text: string, newId: () => string, now: number): Incoming {
  const rows = parseCsv(text);
  if (rows.length === 0) throw new ImportError("ファイルが空です。");
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => head.findIndex((h) => names.includes(h));
  const ci = { date: col("日付", "date"), amount: col("金額", "amount"), cat: col("費目", "category", "分類"), memo: col("メモ", "memo"), id: col("id") };
  if (ci.date < 0 || ci.amount < 0) throw new ImportError("「日付」と「金額」の列が見つかりません。");
  const out: Incoming = { expenses: [], budgets: {}, bad: 0 };
  rows.slice(1).forEach((r, i) => {
    const date = normDate(r[ci.date] ?? "");
    const amount = Number((r[ci.amount] ?? "").normalize("NFKC").replace(/[,\s円¥]/g, ""));
    if (!isDateKey(date) || !isInt(amount, 1, MAX_AMOUNT)) {
      out.bad++;
      return;
    }
    const { cat, note } = catFromText(ci.cat >= 0 ? (r[ci.cat] ?? "") : "");
    let memo = ci.memo >= 0 ? (r[ci.memo] ?? "") : "";
    if (/^'[=+\-@']/.test(memo)) memo = memo.slice(1);
    const rawId = ci.id >= 0 ? (r[ci.id] ?? "").trim() : "";
    const hadId = isId(rawId);
    out.expenses.push({ e: { id: hadId ? rawId : newId(), date, amount, cat, memo: cleanMemo(note + memo), at: now + i }, hadId });
  });
  return out;
}

export function importJson(text: string, newId: () => string): Incoming {
  let raw: any;
  try {
    raw = JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    throw new ImportError("JSON として読めませんでした。");
  }
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.expenses))
    throw new ImportError("この家計簿のファイルではないようです。");
  const out: Incoming = { expenses: [], budgets: {}, bad: 0 };
  const isOld = raw.expenses.some((e: any) => e && typeof e === "object" && "category" in e && !("cat" in e));
  for (const e of raw.expenses) {
    if (isOld) {
      const m = migrateOldExpense(e, newId);
      if (m) out.expenses.push({ e: m, hadId: true });
      else out.bad++;
    } else if (isExpense(e)) out.expenses.push({ e: { ...e }, hadId: true });
    else out.bad++;
  }
  out.budgets = isOld ? migrateOldBudgets(raw.budgets) : cleanBudgets(raw.budgets);
  return out;
}

/** ファイル名と中身から JSON か CSV かを決めて読む */
export function importFile(name: string, text: string, newId: () => string, now: number): Incoming {
  const looksJson = /\.json$/i.test(name) || /^\s*[{[]/.test(text.replace(/^﻿/, ""));
  return looksJson ? importJson(text, newId) : importCsv(text, newId, now);
}

const contentKey = (e: Expense) => `${e.date}|${e.amount}|${e.cat}|${e.memo}`;

export interface MergeResult {
  book: Book;
  added: number;
  /** すでにあったのでとばした数 */
  same: number;
  /** 上限をこえて入らなかった数 */
  full: number;
}

/**
 * 読み込んだものを帳面に足す。
 * - 同じ id の記録はとばす（同じファイルを2回読んでも増えない）
 * - id のない行（よそで作った CSV）は、日付・金額・費目・メモが全部同じ記録があればとばす
 * - 予算は、ファイルにある月の分を上書きする
 */
export function mergeIncoming(book: Book, inc: Incoming): MergeResult {
  const ids = new Set(book.expenses.map((e) => e.id));
  const keys = new Set(book.expenses.map(contentKey));
  const expenses = [...book.expenses];
  let added = 0;
  let same = 0;
  let full = 0;
  for (const { e, hadId } of inc.expenses) {
    if (ids.has(e.id) || (!hadId && keys.has(contentKey(e)))) {
      same++;
      continue;
    }
    if (expenses.length >= MAX_EXPENSES) {
      full++;
      continue;
    }
    expenses.push(e);
    ids.add(e.id);
    added++;
  }
  return { book: { expenses, budgets: { ...book.budgets, ...inc.budgets } }, added, same, full };
}
