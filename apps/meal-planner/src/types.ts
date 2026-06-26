// 週間献立プランナー 型定義

export type ShoppingCategory =
  | "野菜"
  | "肉・魚"
  | "乳・卵"
  | "主食"
  | "調味料"
  | "その他";

export type Genre = "和" | "洋" | "中";

/** 主菜の偏り回避に使うカテゴリ */
export type MainType = "肉" | "魚" | "麺" | "卵" | "豆腐";

/** 特定原材料（ハードフィルタ対象） */
export type Allergen =
  | "卵"
  | "乳"
  | "小麦"
  | "そば"
  | "落花生"
  | "えび"
  | "かに"
  | "大豆";

export const ALL_ALLERGENS: Allergen[] = [
  "卵",
  "乳",
  "小麦",
  "そば",
  "落花生",
  "えび",
  "かに",
  "大豆",
];

export const ALL_GENRES: Genre[] = ["和", "洋", "中"];

export interface Ingredient {
  name: string;
  qty: number; // servingsBase 人前あたりの量
  unit: string; // g / 個 / 大さじ / ml / 枚 など
  category: ShoppingCategory;
}

export interface Recipe {
  id: string;
  name: string;
  role: "main" | "side";
  genre: Genre;
  mainType?: MainType; // role === "main" のみ
  timeMin: number;
  allergens: Allergen[];
  servingsBase: number; // ingredients が何人前か
  ingredients: Ingredient[];
}

export interface PlannerInput {
  adults: number;
  children: number;
  genres: Genre[]; // 選択ジャンル傾向（空なら全部）
  excludeAllergens: Allergen[]; // 除外アレルゲン
  ngKeywords: string[]; // NG食材（材料名 or レシピ名に含むと除外）
  withSide: boolean; // 主菜＋副菜にするか
  quickOnly: boolean; // 時短（timeMin <= QUICK_MIN）のみ
  pantry: string[]; // 冷蔵庫の残り（含むレシピを優先）
  seed: number; // 再現性のための乱数シード
}

export interface DayPlan {
  day: number; // 1..7
  main: Recipe;
  side?: Recipe;
}

export interface ShoppingItem {
  name: string;
  qty: number;
  unit: string;
  category: ShoppingCategory;
}

export interface WeeklyPlan {
  days: DayPlan[];
  shopping: ShoppingItem[];
  comment: string;
  warnings: string[]; // 候補不足など
}
