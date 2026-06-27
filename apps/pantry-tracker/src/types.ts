// pantry-tracker 型定義

export type Category =
  | "食品"
  | "飲料"
  | "調味料"
  | "冷凍"
  | "日用品"
  | "その他";

export type Location = "冷蔵" | "冷凍" | "常温" | "その他";

/** 緊急度（期限と基準日の差で決まる） */
export type Urgency = "expired" | "soon" | "near" | "ok";

export const ALL_CATEGORIES: Category[] = [
  "食品",
  "飲料",
  "調味料",
  "冷凍",
  "日用品",
  "その他",
];

export const ALL_LOCATIONS: Location[] = ["冷蔵", "冷凍", "常温", "その他"];

/** 単位の入力候補（datalist用） */
export const UNIT_SUGGESTIONS: string[] = [
  "個",
  "本",
  "袋",
  "パック",
  "枚",
  "g",
  "kg",
  "ml",
  "L",
  "缶",
  "箱",
];

export interface Item {
  id: string;
  name: string;
  qty: number;
  unit: string;
  category: Category;
  location: Location;
  expiry?: string; // YYYY-MM-DD（任意）
  minQty: number; // 0 なら残量アラート無効
  note?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** 追加/編集フォームから渡る、id/タイムスタンプ抜きの値 */
export type ItemDraft = Omit<Item, "id" | "createdAt" | "updatedAt">;

/** 緊急度のしきい値（日数） */
export const SOON_DAYS = 2; // 0..2 日 → soon
export const NEAR_DAYS = 6; // 3..6 日 → near（7日以上は ok）

/** 緊急度ごとの表示優先順位（小さいほど上） */
export const URGENCY_ORDER: Record<Urgency, number> = {
  expired: 0,
  soon: 1,
  near: 2,
  ok: 3,
};

export interface Summary {
  total: number;
  expired: number;
  soon: number; // 期限切れを含まない 0..2 日
  lowStock: number;
  byCategory: Record<string, number>;
  byLocation: Record<string, number>;
}
