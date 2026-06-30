// localStorage 永続化（読み込み失敗時は壊さず空にフォールバック）

import {
  type Category,
  type Expense,
  type ExpenseDraft,
  type MonthBudget,
  ALL_CATEGORIES,
  emptyBudget,
} from "./types";

const EXPENSES_KEY = "kakeibo.expenses";
const BUDGETS_KEY = "kakeibo.budgets";

/** 軽量な一意ID */
export function newId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `ex_${Date.now().toString(36)}_${rand}`;
}

/** 0以上の整数に丸める（NaN/負は0） */
function toYen(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function isCategory(v: unknown): v is Category {
  return ALL_CATEGORIES.includes(v as Category);
}

/** "YYYY-MM-DD" らしき文字列か（厳密な実在日チェックは core 側） */
function looksLikeDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

/** 任意の入力を ExpenseDraft に正規化 */
export function normalizeDraft(d: Partial<ExpenseDraft>): ExpenseDraft {
  const date = (d.date ?? "").toString().trim();
  return {
    date: looksLikeDate(date) ? date : todayYmd(),
    amount: toYen(d.amount),
    category: isCategory(d.category) ? d.category : "必需",
    memo: d.memo ? d.memo.toString().trim() : undefined,
  };
}

/** 端末ローカルの今日を YYYY-MM-DD で */
export function todayYmd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isExpense(x: unknown): x is Expense {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.date === "string" &&
    typeof o.amount === "number" &&
    isCategory(o.category)
  );
}

export function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isExpense).map((e) => ({
      ...e,
      amount: toYen(e.amount),
      memo: e.memo ? String(e.memo) : undefined,
      createdAt: e.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch {
    // 容量超過等は黙って無視（UIは継続動作）
  }
}

/** Draft から新規 Expense を生成 */
export function makeExpense(draft: ExpenseDraft): Expense {
  return { ...draft, id: newId(), createdAt: new Date().toISOString() };
}

// ---- 月予算（月キー → MonthBudget の辞書で保持） ----

function isMonthBudget(x: unknown): x is MonthBudget {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.month === "string" && typeof o.budgets === "object";
}

export function loadBudgets(): Record<string, MonthBudget> {
  try {
    const raw = localStorage.getItem(BUDGETS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: Record<string, MonthBudget> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (isMonthBudget(v)) out[k] = normalizeBudget(v);
    }
    return out;
  } catch {
    return {};
  }
}

/** 欠損カテゴリ予算を0で補完し数値を正規化 */
export function normalizeBudget(b: MonthBudget): MonthBudget {
  const budgets = { 必需: 0, 娯楽: 0, 文化: 0, 予備: 0 } as Record<
    Category,
    number
  >;
  for (const c of ALL_CATEGORIES) budgets[c] = toYen(b.budgets?.[c]);
  return {
    month: b.month,
    income: toYen(b.income),
    savingsGoal: toYen(b.savingsGoal),
    budgets,
  };
}

export function saveBudgets(budgets: Record<string, MonthBudget>): void {
  try {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  } catch {
    // 無視
  }
}

/** 指定月の予算を取り出す（無ければ空の既定） */
export function budgetFor(
  budgets: Record<string, MonthBudget>,
  month: string,
): MonthBudget {
  return budgets[month] ? normalizeBudget(budgets[month]) : emptyBudget(month);
}
