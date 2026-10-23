// 帳面の集計（純関数）
import type { Book, CategoryId, Expense } from "./types";
import { CATEGORY_IDS } from "./types";
import { monthOf } from "./dates";

/**
 * その月に効いている予算。その月に決めた値、なければ前の月から引き継いだ値。
 * 0 は「予算なし」。どこにもなければ null。
 */
export function budgetFor(budgets: Record<string, number>, month: string): number | null {
  let best: string | null = null;
  for (const k of Object.keys(budgets)) if (k <= month && (best === null || k > best)) best = k;
  if (best === null) return null;
  const v = budgets[best];
  return v > 0 ? v : null;
}

/** 予算がその月で決めたものか、前の月からの引き継ぎか */
export function budgetSource(budgets: Record<string, number>, month: string): "this" | "carried" | "none" {
  if (month in budgets) return budgets[month] > 0 ? "this" : "none";
  return budgetFor(budgets, month) === null ? "none" : "carried";
}

export function expensesOfMonth(expenses: readonly Expense[], month: string): Expense[] {
  return expenses.filter((e) => monthOf(e.date) === month);
}

/** 新しい日付が上、同じ日は後から書いたものが上 */
export function sortNewestFirst(expenses: readonly Expense[]): Expense[] {
  return [...expenses].sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : b.at - a.at));
}

export interface DayGroup {
  date: string;
  total: number;
  items: Expense[];
}

export function groupByDay(expenses: readonly Expense[]): DayGroup[] {
  const out: DayGroup[] = [];
  for (const e of sortNewestFirst(expenses)) {
    const last = out[out.length - 1];
    if (last && last.date === e.date) {
      last.items.push(e);
      last.total += e.amount;
    } else out.push({ date: e.date, total: e.amount, items: [e] });
  }
  return out;
}

export interface CategoryTotal {
  cat: CategoryId;
  total: number;
  count: number;
  /** 合計に対する割合（0〜1） */
  share: number;
}

/** 費目ごとの合計。多い順。0 の費目は出さない */
export function totalsByCategory(expenses: readonly Expense[]): CategoryTotal[] {
  const sum = new Map<CategoryId, { total: number; count: number }>();
  let all = 0;
  for (const e of expenses) {
    const s = sum.get(e.cat) ?? { total: 0, count: 0 };
    s.total += e.amount;
    s.count += 1;
    sum.set(e.cat, s);
    all += e.amount;
  }
  return CATEGORY_IDS.filter((c) => sum.has(c))
    .map((cat) => ({ cat, ...sum.get(cat)!, share: all > 0 ? sum.get(cat)!.total / all : 0 }))
    .sort((a, b) => b.total - a.total || CATEGORY_IDS.indexOf(a.cat) - CATEGORY_IDS.indexOf(b.cat));
}

export const emptyBook = (): Book => ({ expenses: [], budgets: {} });

export function addExpense(book: Book, e: Expense): Book {
  return { ...book, expenses: [...book.expenses, e] };
}

export function updateExpense(book: Book, id: string, patch: Partial<Omit<Expense, "id">>): Book {
  return { ...book, expenses: book.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}

export function removeExpense(book: Book, id: string): Book {
  return { ...book, expenses: book.expenses.filter((e) => e.id !== id) };
}

/** その月からの予算を決める。null は「この月から予算なし」 */
export function setBudget(book: Book, month: string, value: number | null): Book {
  return { ...book, budgets: { ...book.budgets, [month]: value ?? 0 } };
}
