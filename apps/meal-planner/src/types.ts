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
  | "大豆"
  | "くるみ";

export const ALL_ALLERGENS: Allergen[] = [
  "卵",
  "乳",
  "小麦",
  "そば",
  "落花生",
  "えび",
  "かに",
  "大豆",
  "くるみ",
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

/** ジャンルの好み。「和」などを選ぶと、その日を多め（7日のうち4日）にする */
export type GenrePref = "おまかせ" | Genre;
export const GENRE_PREFS: GenrePref[] = ["おまかせ", "和", "洋", "中"];

export interface PlannerInput {
  adults: number; // 1..10
  children: number; // 0..10（0.5人前で計算）
  genrePref: GenrePref;
  excludeAllergens: Allergen[]; // 除外アレルゲン（必ず守る）
  dislikes: string[]; // 苦手な食材（分類名または自由入力の言葉）
  pantry: string[]; // 冷蔵庫の残り（使う料理を優先）
  withSide: boolean; // 副菜をつける
  withSoup: boolean; // 汁物をつける
  quickOnly: boolean; // 20分以内の料理だけ
  seed: number; // 組み合わせの番号（同じなら同じ献立）
}

export interface DayPlan {
  day: number; // 1..7（月〜日）
  genre: Genre; // その日に割り当てたジャンル
  main: Recipe;
  side?: Recipe;
  soup?: Recipe;
}

export interface ShoppingItem {
  name: string;
  qty: number;
  unit: string;
  category: ShoppingCategory;
}

export interface PantryUse {
  term: string;
  /** 料理データの材料に無い言葉（例: リンゴ） */
  unknown: boolean;
  /** 使った料理（曜日と料理名） */
  used: { day: number; recipe: string }[];
  /** 使う料理はあるが、アレルギー・苦手・時短の条件で外れた */
  blocked: boolean;
}

export interface WeeklyPlan {
  days: DayPlan[];
  shopping: ShoppingItem[];
  warnings: string[];
  notes: string[];
  pantry: PantryUse[];
}
