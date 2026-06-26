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
export function servingsFor(input: PlannerInput): number {
  return input.adults + input.children * 0.5;
}

function roundQty(qty: number, unit: string): number {
  // 個数系の単位はあまり細かくしない（小数1桁→端数は0.5刻みに寄せる）
  const countish = ["個", "本", "枚", "玉", "丁", "尾", "缶", "袋", "束", "片", "切れ"];
  if (countish.includes(unit)) {
    return Math.round(qty * 2) / 2;
  }
  return Math.round(qty * 10) / 10;
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
    addRecipe(d.main);
    if (d.side) addRecipe(d.side);
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
