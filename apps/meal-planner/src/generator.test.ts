// 簡易テスト（tsx で実行: npm test）
import { generateWeeklyPlan, filterRecipes } from "./generator";
import { MAIN_RECIPES } from "./data/recipes";
import type { PlannerInput } from "./types";

let failed = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed++;
}

const base: PlannerInput = {
  adults: 2,
  children: 1,
  genres: [],
  excludeAllergens: [],
  ngKeywords: [],
  withSide: true,
  quickOnly: false,
  pantry: [],
  seed: 42,
};

// 1. 7日分そろう
const p = generateWeeklyPlan(base);
check("7日分の主菜が生成される", p.days.length === 7);
check("各日に副菜が付く(withSide)", p.days.every((d) => !!d.side));

// 2. 決定性: 同じseedで同じ結果
const p2 = generateWeeklyPlan(base);
check(
  "同seedで同一結果（決定的）",
  JSON.stringify(p.days.map((d) => d.main.id)) ===
    JSON.stringify(p2.days.map((d) => d.main.id)),
);

// 3. 別seedで（多くの場合）異なる
const p3 = generateWeeklyPlan({ ...base, seed: 7 });
check(
  "別seedで献立が変わる",
  JSON.stringify(p.days.map((d) => d.main.id)) !==
    JSON.stringify(p3.days.map((d) => d.main.id)),
);

// 4. 主菜は週内重複なし（候補が十分あるとき）
const ids = p.days.map((d) => d.main.id);
check("主菜が週内で重複しない", new Set(ids).size === 7);

// 5. ハードフィルタ: 卵・乳・小麦を除外したら、その主菜は出ない
const allergyInput: PlannerInput = {
  ...base,
  excludeAllergens: ["卵", "乳", "小麦"],
};
const ap = generateWeeklyPlan(allergyInput);
const allMainsOk = ap.days.every(
  (d) => !d.main.allergens.some((a) => ["卵", "乳", "小麦"].includes(a)),
);
const allSidesOk = ap.days.every(
  (d) => !d.side || !d.side.allergens.some((a) => ["卵", "乳", "小麦"].includes(a)),
);
check("アレルギー除外が主菜に効く", allMainsOk);
check("アレルギー除外が副菜に効く", allSidesOk);

// 6. NG食材: 「えび」を指定するとエビフライが出ない
const ngInput: PlannerInput = { ...base, ngKeywords: ["えび"], seed: 99 };
const ng = generateWeeklyPlan(ngInput);
check(
  "NG食材(えび)が献立から除外される",
  ng.days.every((d) => !d.main.name.includes("エビ")),
);

// 7. ジャンル絞り込み: 和のみ
const washoku = filterRecipes(MAIN_RECIPES, { ...base, genres: ["和"] });
check("ジャンル絞り込みで和食のみ", washoku.every((r) => r.genre === "和"));

// 8. 時短: quickOnly で全て QUICK_MIN 以内
const quick = generateWeeklyPlan({ ...base, quickOnly: true });
check("時短モードで主菜が20分以内", quick.days.every((d) => d.main.timeMin <= 20));

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
