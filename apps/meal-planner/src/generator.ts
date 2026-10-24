// 献立を組む（純関数）。同じ入力と番号（seed）なら、いつも同じ献立になる。
import type { DayPlan, Genre, GenrePref, LightMeal, Meal, PantryUse, PlannerInput, Recipe } from "./types";
import { ALL_GENRES, mealsOf } from "./types";
import { BREAKFAST_RECIPES, BSIDE_RECIPES, LUNCH_RECIPES, MAIN_RECIPES, RECIPES, SIDE_RECIPES, SOUP_RECIPES } from "./data/recipes";
import { recipeMatches, resolveTerm, type Resolved } from "./foods";

export const QUICK_MIN = 20;
export const DAYS = 7;
/** 「多め」にしたジャンルの日数 */
export const PREFERRED_DAYS = 4;

/** 再現性のための簡易乱数（mulberry32） */
export function mulberry32(seed: number): () => number {
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

/** スープ仕立ての麺（汁物を重ねない） */
export const isSoupyMain = (r: Recipe): boolean => /ラーメン|担々麺|肉うどん|月見そば|きつねうどん|カレーうどん|親子うどん|ちゃんぽん|がゆ|雑炊|茶漬け/.test(r.name);

/** 苦手な食材で外れるか（材料で判定。材料に無い言葉は料理名でも判定） */
export function hitsDislike(r: Recipe, dislikes: Resolved[]): boolean {
  return dislikes.some((d) => recipeMatches(r, d, true));
}

/** 必ず守る条件（アレルギー・苦手・時短）で絞る。ジャンルでは絞らない */
export function filterRecipes(recipes: Recipe[], input: PlannerInput): Recipe[] {
  const dislikes = input.dislikes.map(resolveTerm);
  return recipes.filter((r) => {
    // アレルギーは疑わしければ除外（料理データ側で加工品も多めに登録している）
    if (r.allergens.some((a) => input.excludeAllergens.includes(a))) return false;
    if (hitsDislike(r, dislikes)) return false;
    if (input.quickOnly && r.timeMin > QUICK_MIN) return false;
    return true;
  });
}

/** 7日のジャンルの日数を決める。おまかせは 3・2・2、「和」などは 4・2・1 */
export function genreCounts(pref: GenrePref, rng: () => number): Record<Genre, number> {
  const counts = { 和: 0, 洋: 0, 中: 0 } as Record<Genre, number>;
  if (pref === "おまかせ") {
    const order = shuffle(ALL_GENRES, rng);
    counts[order[0]] = 3;
    counts[order[1]] = 2;
    counts[order[2]] = 2;
  } else {
    counts[pref] = PREFERRED_DAYS;
    const others = shuffle(ALL_GENRES.filter((g) => g !== pref), rng);
    counts[others[0]] = 2;
    counts[others[1]] = 1;
  }
  return counts;
}

/** 候補の数に合わせて日数を直す。足りない分は好みのジャンル→候補の多いジャンルへ回す */
export function fitCounts(
  counts: Record<Genre, number>,
  available: Record<Genre, number>,
  pref: GenrePref,
): Record<Genre, number> {
  const out = { ...counts };
  let spare = 0;
  for (const g of ALL_GENRES) {
    if (out[g] > available[g]) {
      spare += out[g] - available[g];
      out[g] = available[g];
    }
  }
  const order = [...ALL_GENRES].sort((a, b) => (b === pref ? 1 : 0) - (a === pref ? 1 : 0) || available[b] - out[b] - (available[a] - out[a]));
  // まず候補に空きがあるジャンルへ
  for (const g of order) {
    while (spare > 0 && out[g] < available[g]) {
      out[g]++;
      spare--;
    }
  }
  // それでも余れば（候補が7品未満）、候補のあるジャンルで重ねる
  const withAny = order.filter((g) => available[g] > 0);
  let i = 0;
  while (spare > 0 && withAny.length) {
    out[withAny[i % withAny.length]]++;
    spare--;
    i++;
  }
  return out;
}

/** 日数を7日に並べる。同じジャンルが3日続かないように */
export function arrangeGenres(counts: Record<Genre, number>, rng: () => number): Genre[] {
  const bag: Genre[] = ALL_GENRES.flatMap((g) => new Array<Genre>(counts[g]).fill(g));
  const ok = (s: Genre[]) => s.every((g, i) => i < 2 || !(s[i - 1] === g && s[i - 2] === g));
  for (let t = 0; t < 300; t++) {
    const s = shuffle(bag, rng);
    if (ok(s)) return s;
  }
  // 並べられないとき（1ジャンルしか候補が無いなど）は、そのまま
  return bag;
}

const KEY_SKIP = new Set(["しょうが", "にんにく", "唐辛子", "レモン", "かつお節", "片栗粉", "小麦粉", "パン粉", "長ねぎ"]);
/** 料理の「中身」になる材料（調味料・薬味を除く） */
function keyIngredients(r: Recipe): string[] {
  return r.ingredients.filter((i) => i.category !== "調味料" && !KEY_SKIP.has(i.name)).map((i) => i.name);
}
function overlap(a: Recipe, b: Recipe | undefined): number {
  if (!b) return 0;
  const k = new Set(keyIngredients(b));
  return keyIngredients(a).filter((n) => k.has(n)).length;
}

interface Ctx {
  input: PlannerInput;
  pantry: Resolved[];
  covered: Set<number>;
  rng: () => number;
}

function pantryScore(r: Recipe, ctx: Ctx): number {
  let s = 0;
  ctx.pantry.forEach((p, i) => {
    if (recipeMatches(r, p, false) && !ctx.covered.has(i)) s += 100;
  });
  return s;
}
function markCovered(r: Recipe | undefined, ctx: Ctx) {
  if (!r) return;
  ctx.pantry.forEach((p, i) => {
    if (recipeMatches(r, p, false)) ctx.covered.add(i);
  });
}
function best(cands: Recipe[], score: (r: Recipe) => number): Recipe | undefined {
  let top: Recipe | undefined;
  let topScore = -Infinity;
  for (const r of cands) {
    const s = score(r);
    if (s > topScore) {
      topScore = s;
      top = r;
    }
  }
  return top;
}

interface Pools {
  mains: Recipe[];
  sides: Recipe[];
  soups: Recipe[];
}

/** 朝食・昼食の候補 */
interface LightPools {
  mains: Recipe[];
  extras: Recipe[];
}

function pickMain(pool: Recipe[], genre: Genre, used: Set<string>, prev: Recipe[], ctx: Ctx, avoid: Set<string>, strict: boolean, against: Recipe[] = []): Recipe | undefined {
  const free = (r: Recipe) => !used.has(r.id) && !avoid.has(r.id);
  let cands = pool.filter((r) => r.genre === genre && free(r));
  if (!cands.length) cands = pool.filter(free);
  // 「この日を変える」では、ほかの日と重なるくらいなら変えない
  if (!cands.length && strict) return undefined;
  if (!cands.length) cands = pool.filter((r) => !avoid.has(r.id));
  if (!cands.length) cands = pool;
  const [p1, p2] = [prev.at(-1), prev.at(-2)];
  return best(cands, (r) =>
    pantryScore(r, ctx) -
    against.reduce((n, a) => n + 40 * overlap(r, a), 0) +
    (r.genre === genre ? 200 : 0) +
    (p1 && r.mainType === p1.mainType ? -60 : 0) +
    (p2 && r.mainType === p2.mainType ? -15 : 0) +
    ctx.rng() * 30,
  );
}

function pickExtra(pool: Recipe[], main: Recipe, other: Recipe | undefined, used: Set<string>, ctx: Ctx, avoid: Set<string>, sameDay: Set<string> = new Set()): Recipe | undefined {
  if (!pool.length) return undefined;
  let cands = pool.filter((r) => !used.has(r.id) && !avoid.has(r.id));
  if (!cands.length) cands = pool.filter((r) => !avoid.has(r.id));
  // 同じ日に同じ料理は出さない（ほかに候補が無ければ付けない）
  if (!cands.length) cands = pool.filter((r) => !sameDay.has(r.id));
  const eggMain = main.ingredients.some((i) => i.name === "卵");
  return best(cands, (r) =>
    pantryScore(r, ctx) +
    (r.genre === main.genre ? 40 : 0) -
    60 * overlap(r, main) -
    60 * overlap(r, other) -
    (eggMain && r.ingredients.some((i) => i.name === "卵") ? 40 : 0) +
    ctx.rng() * 30,
  );
}

function pickDay(pools: Pools, genre: Genre, used: Set<string>, prev: Recipe[], ctx: Ctx, avoid = new Set<string>(), strict = false, hard = new Set<string>()): Omit<DayPlan, "day"> | undefined {
  const main = pickMain(pools.mains, genre, used, prev, ctx, avoid, strict);
  if (!main) return undefined;
  markCovered(main, ctx);
  const side = ctx.input.withSide ? pickExtra(pools.sides, main, undefined, used, ctx, avoid, hard) : undefined;
  markCovered(side, ctx);
  const soup = ctx.input.withSoup && !isSoupyMain(main) ? pickExtra(pools.soups, main, side, used, ctx, avoid, hard) : undefined;
  markCovered(soup, ctx);
  return { genre, main, side, soup };
}

/** 朝食（主食＋おかず1品）・昼食（1品＋汁物）を選ぶ。その日の夕食とは材料・料理を重ねない */
function pickLight(meal: "朝" | "昼", pools: LightPools, genre: Genre, used: Set<string>, prev: Recipe[], ctx: Ctx, sameDay: Recipe[], avoid = new Set<string>(), strict = false): LightMeal | undefined {
  const dayIds = new Set([...avoid, ...sameDay.map((r) => r.id)]);
  const main = pickMain(pools.mains, genre, used, prev, ctx, avoid, strict, sameDay);
  if (!main) return undefined;
  markCovered(main, ctx);
  const wantExtra = meal === "朝" ? true : ctx.input.withSoup && !isSoupyMain(main);
  const extraPool = meal === "朝" && isSoupyMain(main) ? pools.extras.filter((r) => !isSoup(r)) : pools.extras;
  const side = wantExtra ? pickExtra(extraPool, main, sameDay[0], used, ctx, dayIds, new Set(sameDay.map((r) => r.id))) : undefined;
  markCovered(side, ctx);
  return { genre, main, side };
}

const isSoup = (r: Recipe) => SOUP_RECIPES.includes(r) || /スープ|汁/.test(r.name);

function lightSchedule(pref: GenrePref, pool: Recipe[], seed: number): Genre[] {
  const rng = mulberry32(seed);
  const available = Object.fromEntries(ALL_GENRES.map((g) => [g, pool.filter((r) => r.genre === g).length])) as Record<Genre, number>;
  return arrangeGenres(fitCounts(genreCounts(pref, rng), available, pref), rng);
}

export interface GenerateResult {
  days: DayPlan[];
  warnings: string[];
  notes: string[];
  pantry: PantryUse[];
}

/**
 * 週の献立を作る。swaps は「変える」を押した回数。
 * キーは 夕食が曜日の番号（"1"〜"7"）、朝食・昼食は "1朝"・"1昼" のように食事を付ける。
 */
export function generateWeeklyPlan(input: PlannerInput, swaps: Record<string, number> = {}): GenerateResult {
  const rng = mulberry32(input.seed);
  const warnings: string[] = [];
  const notes: string[] = [];
  const pools: Pools = {
    mains: filterRecipes(MAIN_RECIPES, input),
    sides: filterRecipes(SIDE_RECIPES, input),
    soups: filterRecipes(SOUP_RECIPES, input),
  };
  const pantry = input.pantry.map(resolveTerm);
  const ctx: Ctx = { input, pantry, covered: new Set(), rng };

  if (!pools.mains.length) {
    warnings.push("条件に合う主菜がありません。苦手なものや「20分以内」を見直してください（アレルギーの条件はゆるめません）。");
    return { days: [], warnings, notes, pantry: pantryReport([], input) };
  }

  const available = Object.fromEntries(ALL_GENRES.map((g) => [g, pools.mains.filter((r) => r.genre === g).length])) as Record<Genre, number>;
  const counts = fitCounts(genreCounts(input.genrePref, rng), available, input.genrePref);
  const schedule = arrangeGenres(counts, rng);

  const days: DayPlan[] = [];
  const used = new Set<string>();
  for (let d = 0; d < DAYS; d++) {
    const pick = pickDay(pools, schedule[d], used, days.map((x) => x.main), ctx)!;
    days.push({ day: d + 1, ...pick });
    for (const r of [pick.main, pick.side, pick.soup]) if (r) used.add(r.id);
  }

  // 朝食・昼食（夕食とは別の乱数で選ぶので、朝昼を足しても夕食の献立は変わらない）
  const meals = mealsOf(input.mealSet);
  const light: Record<"朝" | "昼", LightPools> = {
    朝: { mains: filterRecipes(BREAKFAST_RECIPES, input), extras: [...filterRecipes(BSIDE_RECIPES, input), ...pools.soups.filter((r) => r.timeMin <= 10)] },
    昼: { mains: filterRecipes(LUNCH_RECIPES, input), extras: pools.soups },
  };
  const KEY = { 朝: "breakfast", 昼: "lunch" } as const;
  const SALT = { 朝: 0x9e3779b9, 昼: 0x85ebca6b } as const;
  /** その日の、指定した食事以外の料理（同じ日に同じ料理・材料を重ねないため） */
  const sameDay = (d: DayPlan, except: Meal): Recipe[] =>
    [
      ...(except === "晩" ? [] : [d.main, d.side, d.soup]),
      ...(except === "朝" ? [] : [d.breakfast?.main, d.breakfast?.side]),
      ...(except === "昼" ? [] : [d.lunch?.main, d.lunch?.side]),
    ].filter((r): r is Recipe => !!r);
  const lightOn = (meal: "朝" | "昼") => meals.includes(meal) && light[meal].mains.length > 0;
  for (const meal of ["朝", "昼"] as const) {
    if (!meals.includes(meal)) continue;
    const key = KEY[meal];
    const lp = light[meal];
    if (!lp.mains.length) {
      warnings.push(`条件に合う${meal === "朝" ? "朝食" : "昼食"}がないため、${meal === "朝" ? "朝食" : "昼食"}は出していません。`);
      continue;
    }
    const schedule = lightSchedule(input.genrePref, lp.mains, (input.seed ^ SALT[meal]) >>> 0);
    const lctx: Ctx = { ...ctx, rng: mulberry32((input.seed * 7 + SALT[meal]) >>> 0) };
    const usedL = new Set<string>();
    for (let d = 0; d < DAYS; d++) {
      const prev = days.slice(0, d).map((x) => x[key]?.main).filter((r): r is Recipe => !!r);
      const pick = pickLight(meal, lp, schedule[d], usedL, prev, lctx, sameDay(days[d], meal));
      if (pick) {
        days[d][key] = pick;
        usedL.add(pick.main.id);
        if (pick.side) usedL.add(pick.side.id);
      }
    }
  }

  // 「変える」: その食事だけを、ほかの日と重ならない別の組み合わせにする（ほかの食事は変えない）
  for (const [k, times] of Object.entries(swaps)) {
    const m = /^([1-7])(朝|昼)?$/.exec(k);
    if (!m || !(times > 0)) continue;
    const idx = Number(m[1]) - 1;
    const meal: Meal = (m[2] as Meal | undefined) ?? "晩";
    if (meal !== "晩" && !lightOn(meal)) continue;
    const history = new Set<string>();
    for (let t = 1; t <= Math.min(times, 50); t++) {
      const rng = mulberry32((input.seed * 31 + (idx + 1) * 1009 + t * 7919 + (meal === "晩" ? 0 : SALT[meal])) >>> 0);
      const sctx: Ctx = { input, pantry, covered: new Set(), rng };
      const fixed = sameDay(days[idx], meal);
      if (meal === "晩") {
        const cur = days[idx];
        const ids = [cur.main.id, cur.side?.id, cur.soup?.id].filter((x): x is string => !!x);
        const others = new Set(days.filter((_, i) => i !== idx).flatMap((x) => [x.main.id, x.side?.id, x.soup?.id]).filter((x): x is string => !!x));
        // 押すたびに、まだ出していない組み合わせへ（一巡したら最初から）
        ids.forEach((id) => history.add(id));
        if (!pools.mains.some((r) => r.genre === cur.genre && !history.has(r.id) && !others.has(r.id))) {
          history.clear();
          ids.forEach((id) => history.add(id));
        }
        const avoid = new Set([...history, ...fixed.map((r) => r.id)]);
        // 主菜が変えられない（候補が1品だけ）のときは、そのまま
        const pick = pickDay(pools, cur.genre, others, days.slice(0, idx).map((x) => x.main), sctx, avoid, true, new Set(fixed.map((r) => r.id)));
        if (pick) days[idx] = { ...days[idx], ...pick, day: idx + 1 };
      } else {
        const key = KEY[meal];
        const lp = light[meal];
        const cur = days[idx][key];
        if (!cur) break;
        const ids = [cur.main.id, cur.side?.id].filter((x): x is string => !!x);
        const others = new Set(days.filter((_, i) => i !== idx).flatMap((x) => [x[key]?.main.id, x[key]?.side?.id]).filter((x): x is string => !!x));
        ids.forEach((id) => history.add(id));
        if (!lp.mains.some((r) => r.genre === cur.genre && !history.has(r.id) && !others.has(r.id))) {
          history.clear();
          ids.forEach((id) => history.add(id));
        }
        const prev = days.slice(0, idx).map((x) => x[key]?.main).filter((r): r is Recipe => !!r);
        const pick = pickLight(meal, lp, cur.genre, others, prev, sctx, fixed, new Set(history), true);
        if (pick) days[idx][key] = pick;
      }
    }
  }

  for (const meal of ["朝", "昼"] as const) {
    if (!lightOn(meal)) continue;
    const key = KEY[meal];
    const n = light[meal].mains.length;
    const label = meal === "朝" ? "朝食" : "昼食";
    if (n < DAYS) notes.push(`条件に合う${label}が${n}品だけのため、同じものが出る日があります。`);
    else if (new Set(days.map((d) => d[key]?.main.id)).size < DAYS) notes.push(`${label}は候補が少ないため、同じものが出る日があります。`);
  }

  if (new Set(days.map((d) => d.main.id)).size < DAYS) warnings.push("条件に合う主菜が少ないため、同じ主菜が2回以上出ています。");
  if (input.genrePref !== "おまかせ") {
    const n = days.filter((d) => d.main.genre === input.genrePref).length;
    if (n < PREFERRED_DAYS) warnings.push(`条件に合う${genreName(input.genrePref)}が少ないため、${genreName(input.genrePref)}は${n}日になりました。`);
  }
  if (input.withSide && !pools.sides.length) warnings.push("条件に合う副菜がないため、副菜はつけていません。");
  if (input.withSoup && !pools.soups.length) notes.push("条件に合う汁物がないため、汁物はつけていません。");
  if (input.withSoup && days.some((d) => isSoupyMain(d.main))) notes.push("ラーメン・うどんなど汁のある麺の日は、汁物をつけていません。");

  return { days, warnings, notes, pantry: pantryReport(days, input) };
}

export const genreName = (g: Genre): string => ({ 和: "和食", 洋: "洋食", 中: "中華" })[g];

/** 冷蔵庫の残りを、どの日のどの料理で使ったか */
/** その日の料理（朝→昼→晩の順） */
export function dayRecipes(d: DayPlan): { meal: Meal; recipe: Recipe }[] {
  const out: { meal: Meal; recipe: Recipe }[] = [];
  for (const r of [d.breakfast?.main, d.breakfast?.side]) if (r) out.push({ meal: "朝", recipe: r });
  for (const r of [d.lunch?.main, d.lunch?.side]) if (r) out.push({ meal: "昼", recipe: r });
  for (const r of [d.main, d.side, d.soup]) if (r) out.push({ meal: "晩", recipe: r });
  return out;
}

const ROLE_MEAL: Record<Recipe["role"], Meal[]> = { main: ["晩"], side: ["晩", "朝", "昼"], breakfast: ["朝"], bside: ["朝"], lunch: ["昼"] };

/** 冷蔵庫の残りを、どの日のどの料理で使ったか */
export function pantryReport(days: DayPlan[], input: PlannerInput): PantryUse[] {
  const meals = mealsOf(input.mealSet);
  const allowedAll = filterRecipes(RECIPES, input);
  const allowed = allowedAll.filter((r) => ROLE_MEAL[r.role].some((m) => meals.includes(m)));
  return input.pantry.map((term) => {
    const res = resolveTerm(term);
    const used: PantryUse["used"] = [];
    for (const d of days)
      for (const { meal, recipe } of dayRecipes(d)) if (recipeMatches(recipe, res, false)) used.push({ day: d.day, meal, recipe: recipe.name });
    const known = res.ingredients.length > 0;
    const inSelected = allowed.some((r) => recipeMatches(r, res, false));
    return {
      term,
      unknown: !known,
      used,
      blocked: known && !inSelected,
      otherMeals: known && !inSelected && allowedAll.some((r) => recipeMatches(r, res, false)),
    };
  });
}

/** 苦手な言葉ごとに、外れる料理の数（画面の説明用） */
export function dislikeCount(term: string): number {
  const res = resolveTerm(term);
  return RECIPES.filter((r) => recipeMatches(r, res, true)).length;
}
