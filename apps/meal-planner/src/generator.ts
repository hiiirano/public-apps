import type {
  Recipe,
  PlannerInput,
  DayPlan,
  MainType,
} from "./types";
import { MAIN_RECIPES, SIDE_RECIPES } from "./data/recipes";

export const QUICK_MIN = 20;
const DAYS = 7;

/** 再現性のための簡易PRNG（mulberry32） */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function matchesPantry(r: Recipe, pantry: string[]): boolean {
  if (pantry.length === 0) return false;
  return r.ingredients.some((ing) =>
    pantry.some((p) => p && ing.name.includes(p)),
  );
}

/** 入力に対するハードフィルタ（アレルギー / NG食材 / ジャンル / 時短） */
export function filterRecipes(recipes: Recipe[], input: PlannerInput): Recipe[] {
  return recipes.filter((r) => {
    // アレルギー：1つでも該当したら除外
    if (r.allergens.some((a) => input.excludeAllergens.includes(a))) return false;
    // NG食材：レシピ名 or 材料名に含めば除外
    if (
      input.ngKeywords.some(
        (kw) =>
          kw &&
          (r.name.includes(kw) || r.ingredients.some((i) => i.name.includes(kw))),
      )
    )
      return false;
    // ジャンル傾向（指定があれば絞る）
    if (input.genres.length > 0 && !input.genres.includes(r.genre)) return false;
    // 時短
    if (input.quickOnly && r.timeMin > QUICK_MIN) return false;
    return true;
  });
}

/** pantry一致を優先しつつシャッフルした候補列を返す */
function prioritize(
  recipes: Recipe[],
  input: PlannerInput,
  rng: () => number,
): Recipe[] {
  const match = shuffle(
    recipes.filter((r) => matchesPantry(r, input.pantry)),
    rng,
  );
  const rest = shuffle(
    recipes.filter((r) => !matchesPantry(r, input.pantry)),
    rng,
  );
  return [...match, ...rest];
}

/**
 * 主菜を7日分選ぶ。
 * - 同一主菜の週内重複を回避（候補が足りなければ循環）
 * - 連日で同じ mainType が続かないようにする（偏り回避）
 */
function pickMains(
  input: PlannerInput,
  rng: () => number,
): { mains: Recipe[]; warning?: string } {
  const filtered = filterRecipes(MAIN_RECIPES, input);
  if (filtered.length === 0) {
    return { mains: [], warning: "条件に合う主菜がありません。除外設定を緩めてください。" };
  }
  const pool = prioritize(filtered, input, rng);
  const result: Recipe[] = [];
  const used = new Set<string>();
  let lastType: MainType | undefined;

  for (let d = 0; d < DAYS; d++) {
    // 未使用 かつ 直前と別タイプ を最優先
    let pick =
      pool.find((r) => !used.has(r.id) && r.mainType !== lastType) ??
      pool.find((r) => !used.has(r.id));

    // 候補が尽きたら used をリセットして循環（重複を許容）
    if (!pick) {
      used.clear();
      pick =
        pool.find((r) => r.mainType !== lastType) ?? pool[0];
    }
    result.push(pick);
    used.add(pick.id);
    lastType = pick.mainType;
  }

  const warning =
    filtered.length < DAYS
      ? `条件に合う主菜が${filtered.length}種しかないため、一部の献立が重複しています。`
      : undefined;
  return { mains: result, warning };
}

/** 各日の副菜を選ぶ（その日の主菜とジャンルが近いものを優先・直前と重複回避） */
function pickSides(mains: Recipe[], input: PlannerInput, rng: () => number): (Recipe | undefined)[] {
  const filtered = filterRecipes(SIDE_RECIPES, input);
  if (filtered.length === 0) return mains.map(() => undefined);

  const pool = prioritize(filtered, input, rng);
  const used = new Set<string>();
  const sides: (Recipe | undefined)[] = [];
  let lastId: string | undefined;

  for (const main of mains) {
    const candidates = pool.filter((s) => !used.has(s.id) && s.id !== lastId);
    const list = candidates.length > 0 ? candidates : pool;
    // 同ジャンル優先
    const pick =
      list.find((s) => s.genre === main.genre) ?? list[0];
    sides.push(pick);
    if (pick) {
      used.add(pick.id);
      lastId = pick.id;
      if (used.size >= filtered.length) used.clear();
    }
  }
  return sides;
}

function buildComment(days: DayPlan[]): string {
  const genres = new Set(days.map((d) => d.main.genre));
  const quick = days.filter((d) => d.main.timeMin <= QUICK_MIN).length;
  const parts: string[] = [];
  parts.push(`主菜は${days.length}日分、ジャンルは${[...genres].join("・")}でバランスよく組みました。`);
  if (quick >= 4) parts.push(`${quick}日は20分以内で作れる時短メニューです。`);
  const fish = days.filter((d) => d.main.mainType === "魚").length;
  if (fish >= 2) parts.push(`お魚の日が${fish}日入っています。`);
  return parts.join(" ");
}

/** 週間献立（主菜＋任意で副菜）を生成する。買い物リストは shopping.ts 側で集約。 */
export function generateWeeklyPlan(input: PlannerInput): {
  days: DayPlan[];
  comment: string;
  warnings: string[];
} {
  const rng = mulberry32(input.seed);
  const warnings: string[] = [];

  const { mains, warning } = pickMains(input, rng);
  if (warning) warnings.push(warning);
  if (mains.length === 0) {
    return { days: [], comment: "", warnings };
  }

  const sides = input.withSide ? pickSides(mains, input, rng) : mains.map(() => undefined);

  const days: DayPlan[] = mains.map((main, i) => ({
    day: i + 1,
    main,
    side: sides[i],
  }));

  return { days, comment: buildComment(days), warnings };
}
