// kakeibo 型定義

/** 家計簿の4分類 */
export type Category = "必需" | "娯楽" | "文化" | "予備";

export const ALL_CATEGORIES: Category[] = ["必需", "娯楽", "文化", "予備"];

/** 各分類の意味（UI のヒント用） */
export const CATEGORY_HINT: Record<Category, string> = {
  必需: "生きるのに必要（食費・家賃・光熱・交通・医療）",
  娯楽: "欲しいけど無くても困らない（外食・買い物・サブスク・趣味）",
  文化: "心を豊かに（書籍・映画・習い事・美術）",
  予備: "突発・想定外（冠婚葬祭・修理・急な出費）",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  必需: "🍚",
  娯楽: "🎉",
  文化: "📚",
  予備: "🧰",
};

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // 円・0以上の整数
  category: Category;
  memo?: string;
  createdAt: string; // ISO
}

/** 追加/編集フォームから渡る、id/タイムスタンプ抜きの値 */
export type ExpenseDraft = Omit<Expense, "id" | "createdAt">;

/** 月ごとの予算設定 */
export interface MonthBudget {
  month: string; // YYYY-MM
  income: number; // 今月の収入
  savingsGoal: number; // 貯金目標
  budgets: Record<Category, number>; // 4分類への配分
}

/** 空の予算（既定値） */
export function emptyBudget(month: string): MonthBudget {
  return {
    month,
    income: 0,
    savingsGoal: 0,
    budgets: { 必需: 0, 娯楽: 0, 文化: 0, 予備: 0 },
  };
}

/** 1カテゴリの予算消化状況（kakeibo.ts が算出） */
export interface CategoryStatus {
  category: Category;
  budget: number; // 設定予算
  spent: number; // 当月の実支出
  remaining: number; // budget - spent（マイナスは超過）
  ratio: number; // spent / budget（budget=0 は spent>0 で Infinity 相当→1超扱い）
  projected: number; // 月末着地予測（バーンレート）
  overBudget: boolean; // すでに予算超過
  projectedOver: boolean; // このペースだと月末に超過
}

/** ダッシュボード用サマリ */
export interface MonthSummary {
  month: string;
  income: number;
  savingsGoal: number;
  available: number; // income - savingsGoal
  budgetTotal: number; // 4分類予算の合計
  spentTotal: number; // 当月の総支出
  remainingTotal: number; // available - spentTotal
  projectedSpent: number; // 月末の総支出予測
  projectedSavings: number; // income - projectedSpent（貯金見込み）
  savingsOnTrack: boolean; // projectedSavings >= savingsGoal
  byCategory: CategoryStatus[];
}
