// 家計簿の型と決まりごと

/** 費目。fixed は「月に1回の決まった支払い」として、月末の見込みでのばさない */
export const CATEGORIES = [
  { id: "food", label: "食費", hint: "スーパー・コンビニ", fixed: false },
  { id: "eatout", label: "外食", hint: "ランチ・カフェ", fixed: false },
  { id: "daily", label: "日用品", hint: "洗剤・服・雑貨", fixed: false },
  { id: "home", label: "住まい", hint: "家賃・光熱・通信", fixed: true },
  { id: "transit", label: "交通", hint: "電車・ガソリン", fixed: false },
  { id: "hobby", label: "趣味", hint: "本・映画・習い事", fixed: false },
  { id: "social", label: "交際", hint: "贈り物・会費", fixed: false },
  { id: "medical", label: "医療", hint: "病院・薬", fixed: false },
  { id: "other", label: "その他", hint: "どれでもないもの", fixed: false },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((c) => c.id);

export function categoryOf(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)!;
}

export function isCategoryId(v: unknown): v is CategoryId {
  return typeof v === "string" && (CATEGORY_IDS as readonly string[]).includes(v);
}

/** 1件の金額の上限（1億円未満） */
export const MAX_AMOUNT = 99_999_999;
/** 月の予算の上限 */
export const MAX_BUDGET = 999_999_999;
/** メモの長さ */
export const MEMO_MAX = 40;
/** 記録できる件数の上限（端末の保存容量のため） */
export const MAX_EXPENSES = 20_000;

export interface Expense {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** 1〜MAX_AMOUNT の整数の円 */
  amount: number;
  cat: CategoryId;
  memo: string;
  /** 書いた時刻（ミリ秒）。同じ日の並び順に使う */
  at: number;
}

/** 保存するもの全部 */
export interface Book {
  expenses: Expense[];
  /** "YYYY-MM" → その月からの予算（0 は「予算なし」） */
  budgets: Record<string, number>;
}
