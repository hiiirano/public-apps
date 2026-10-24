import type {
  DayPlan,
  PlannerInput,
  ShoppingItem,
  ShoppingCategory,
} from "./types";

// 買い物リストでのカテゴリ表示順（スーパーの回遊順を意識）
const CATEGORY_ORDER: ShoppingCategory[] = [
  "野菜",
  "肉・魚",
  "乳・卵",
  "主食",
  "調味料",
  "その他",
];

/** 子どもは0.5人前換算で必要人数を出す */
export function servingsFor(input: Pick<PlannerInput, "adults" | "children">): number {
  return input.adults + input.children * 0.5;
}

/** 買う量は少し多めの切りのよい数にする（足りなくならないよう切り上げ） */
export function roundQty(qty: number, unit: string): number {
  const countish = ["個", "本", "枚", "玉", "丁", "尾", "缶", "袋", "束", "片", "切れ"];
  if (unit === "個") return Math.ceil(qty - 1e-9);
  if (countish.includes(unit)) return Math.ceil(qty * 2 - 1e-9) / 2;
  if (unit === "g" || unit === "ml") {
    if (qty >= 100) return Math.ceil(qty / 10 - 1e-9) * 10;
    if (qty >= 10) return Math.ceil(qty / 5 - 1e-9) * 5;
    return Math.ceil(qty - 1e-9);
  }
  return Math.ceil(qty * 10 - 1e-9) / 10;
}

/**
 * 1週間分の献立から買い物リストを集約する。
 * - 人数(servings)/レシピのservingsBase でスケール
 * - 同じ「材料名＋単位」を合算
 * - カテゴリ別にまとめて表示順でソート
 */
export function buildShoppingList(
  days: DayPlan[],
  input: PlannerInput,
): ShoppingItem[] {
  const servings = servingsFor(input);
  const map = new Map<string, ShoppingItem>();

  const addRecipe = (recipe: DayPlan["main"]) => {
    const factor = servings / recipe.servingsBase;
    for (const ing of recipe.ingredients) {
      // 「少々」など計量しない調味料は合算対象外（リストには1行だけ残す）
      const key = `${ing.name}__${ing.unit}`;
      const scaled = ing.unit === "少々" ? ing.qty : ing.qty * factor;
      const existing = map.get(key);
      if (existing) {
        existing.qty += scaled;
      } else {
        map.set(key, {
          name: ing.name,
          qty: scaled,
          unit: ing.unit,
          category: ing.category,
        });
      }
    }
  };

  for (const d of days) {
    for (const r of [d.breakfast?.main, d.breakfast?.side, d.lunch?.main, d.lunch?.side, d.main, d.side, d.soup]) if (r) addRecipe(r);
  }

  const items = [...map.values()].map((it) => ({
    ...it,
    qty: roundQty(it.qty, it.unit),
  }));

  items.sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name, "ja");
  });

  return items;
}

/** カテゴリ別にグルーピング（UI表示用） */
export function groupByCategory(
  items: ShoppingItem[],
): { category: ShoppingCategory; items: ShoppingItem[] }[] {
  const groups = new Map<ShoppingCategory, ShoppingItem[]>();
  for (const it of items) {
    const arr = groups.get(it.category) ?? [];
    arr.push(it);
    groups.set(it.category, arr);
  }
  return CATEGORY_ORDER.filter((c) => groups.has(c)).map((category) => ({
    category,
    items: groups.get(category)!,
  }));
}

/** 買い物リストの1行を区別するキー（チェックの保存に使う） */
export const itemKey = (it: Pick<ShoppingItem, "name" | "unit">): string => `${it.name}__${it.unit}`;

/** 量の表示（大さじ2、200g、1個 など） */
export function formatQuantity(q: number, unit: string): string {
  if (unit === "少々") return unit;
  const n = Number.isInteger(q) ? String(q) : q.toFixed(1).replace(/\.0$/, "");
  return ["大さじ", "小さじ"].includes(unit) ? `${unit}${n}` : `${n}${unit}`;
}
