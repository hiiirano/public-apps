import { buildPlan } from "./plan";
import { buildShoppingList, servingsFor } from "./shopping";
import type { PlannerInput, DayPlan } from "./types";
import { RECIPES } from "./data/recipes";

let failed = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed++;
}

const input: PlannerInput = {
  adults: 2,
  children: 2,
  genres: [],
  excludeAllergens: [],
  ngKeywords: [],
  withSide: true,
  quickOnly: false,
  pantry: [],
  seed: 42,
};

const plan = buildPlan(input);
check("買い物リストが生成される", plan.shopping.length > 0);
check(
  "同名・同単位の材料が合算される（重複行なし）",
  new Set(plan.shopping.map((i) => `${i.name}__${i.unit}`)).size ===
    plan.shopping.length,
);
check(
  "カテゴリ順で並ぶ（野菜が肉・魚より前 or 片方なし）",
  (() => {
    const cats = plan.shopping.map((i) => i.category);
    const firstVeg = cats.indexOf("野菜");
    const firstMeat = cats.indexOf("肉・魚");
    return firstVeg === -1 || firstMeat === -1 || firstVeg < firstMeat;
  })(),
);

// 人数スケール: 2人前基準を 3人前(大人2+子2*0.5=3)で 1.5倍
check("子ども0.5換算で必要人数=3", servingsFor(input) === 3);

// スケール検証: 単一レシピ（鶏もも肉250g/2人前）→ 3人前で375g
const teriyaki = RECIPES.find((r) => r.id === "m-teriyaki-chicken")!;
const oneDay: DayPlan[] = [{ day: 1, main: teriyaki }];
const list = buildShoppingList(oneDay, input);
const chicken = list.find((i) => i.name === "鶏もも肉")!;
check("人数スケールが量に反映(250g→375g)", chicken.qty === 375);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
