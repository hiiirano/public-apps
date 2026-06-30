// kakeibo 決定的コアロジック（純関数・副作用なし・LLM不要）

import {
  type Category,
  type CategoryStatus,
  type Expense,
  type MonthBudget,
  type MonthSummary,
  ALL_CATEGORIES,
} from "./types";

/** YYYY-MM 形式か */
export function isMonthKey(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s.trim());
}

/** Date → "YYYY-MM" */
export function monthKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** "YYYY-MM-DD" → その属する月キー "YYYY-MM"（不正は ""） */
export function monthOfDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  return m ? `${m[1]}-${m[2]}` : "";
}

/** 月キーの日数（2026-02 → 28/29 を正しく返す） */
export function daysInMonth(month: string): number {
  const m = /^(\d{4})-(\d{2})$/.exec(month.trim());
  if (!m) return 30;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  // 翌月0日 = 当月末日
  return new Date(y, mo, 0).getDate();
}

/**
 * 月内の経過日数。
 * today がその月より前 → 0、月内 → 日(1..末)、月より後 → 月の日数。
 * バーンレート予測の分母に使う（0除算回避は呼び出し側で clamp 済み前提だが、ここでも下限1）。
 */
export function daysElapsed(month: string, today: Date): number {
  const cur = monthKeyOf(today);
  const total = daysInMonth(month);
  if (cur < month) return 0;
  if (cur > month) return total;
  return Math.min(today.getDate(), total);
}

/** 使えるお金 = 収入 − 貯金目標（マイナスにはしない） */
export function availableToSpend(budget: MonthBudget): number {
  return Math.max(0, budget.income - budget.savingsGoal);
}

/** 4分類予算の合計 */
export function budgetTotal(budget: MonthBudget): number {
  return ALL_CATEGORIES.reduce((s, c) => s + (budget.budgets[c] || 0), 0);
}

/** 指定月の支出だけ抽出 */
export function expensesOfMonth(expenses: Expense[], month: string): Expense[] {
  return expenses.filter((e) => monthOfDate(e.date) === month);
}

/** カテゴリ別の実支出合計（指定月） */
export function sumByCategory(
  expenses: Expense[],
  month: string,
): Record<Category, number> {
  const out: Record<Category, number> = { 必需: 0, 娯楽: 0, 文化: 0, 予備: 0 };
  for (const e of expensesOfMonth(expenses, month)) {
    out[e.category] = (out[e.category] || 0) + (e.amount || 0);
  }
  return out;
}

/**
 * バーンレート予測：これまでの支出ペースを月末まで線形外挿する。
 * 経過0日（月初前）なら予測は0（まだ判断材料なし）。
 */
export function projectSpend(
  spent: number,
  month: string,
  today: Date,
): number {
  const elapsed = daysElapsed(month, today);
  if (elapsed <= 0) return 0;
  const total = daysInMonth(month);
  return Math.round((spent / elapsed) * total);
}

/** 1カテゴリの消化状況を算出 */
export function categoryStatus(
  category: Category,
  budget: number,
  spent: number,
  month: string,
  today: Date,
): CategoryStatus {
  const projected = projectSpend(spent, month, today);
  const ratio = budget > 0 ? spent / budget : spent > 0 ? Infinity : 0;
  return {
    category,
    budget,
    spent,
    remaining: budget - spent,
    ratio,
    projected,
    overBudget: spent > budget,
    // 予算0は「上限0」とみなし、支出があれば予測超過扱い
    projectedOver: budget > 0 ? projected > budget : spent > 0,
  };
}

/** 月次サマリ（ダッシュボードの単一ソース） */
export function summarize(
  budget: MonthBudget,
  expenses: Expense[],
  today: Date,
): MonthSummary {
  const month = budget.month;
  const spentMap = sumByCategory(expenses, month);
  const byCategory = ALL_CATEGORIES.map((c) =>
    categoryStatus(c, budget.budgets[c] || 0, spentMap[c] || 0, month, today),
  );

  const spentTotal = byCategory.reduce((s, c) => s + c.spent, 0);
  const projectedSpent = projectSpend(spentTotal, month, today);
  const available = availableToSpend(budget);
  const projectedSavings = budget.income - projectedSpent;

  return {
    month,
    income: budget.income,
    savingsGoal: budget.savingsGoal,
    available,
    budgetTotal: budgetTotal(budget),
    spentTotal,
    remainingTotal: available - spentTotal,
    projectedSpent,
    projectedSavings,
    savingsOnTrack: projectedSavings >= budget.savingsGoal,
    byCategory,
  };
}

/** 支出を日付の新しい順（同日は作成の新しい順）に並べる（非破壊） */
export function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
  });
}

/** 金額を「¥1,234」表記に */
export function yen(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}¥${Math.abs(Math.round(n)).toLocaleString("ja-JP")}`;
}

/** CSV 文字列を生成（Excel/Numbers で開ける。UTF-8 BOM は呼び出し側で付与） */
export function toCsv(expenses: Expense[]): string {
  const head = ["date", "amount", "category", "memo"];
  const esc = (s: string): string =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const rows = sortExpenses(expenses).map((e) =>
    [e.date, String(e.amount), e.category, esc(e.memo ?? "")].join(","),
  );
  return [head.join(","), ...rows].join("\n");
}
