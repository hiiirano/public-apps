// 献立を組む（純関数）。同じ入力と番号（seed）なら、いつも同じ献立になる。
import type { DayPlan, Genre, GenrePref, PantryUse, PlannerInput, Recipe } from "./types";
import { ALL_GENRES } from "./types";
import { MAIN_RECIPES, RECIPES, SIDE_RECIPES, SOUP_RECIPES } from "./data/recipes";
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
export const isSoupyMain = (r: Recipe): boolean => /ラーメン|担々麺|肉うどん|月見そば/.test(r.name);

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

function pickMain(pools: Pools, genre: Genre, used: Set<string>, prev: Recipe[], ctx: Ctx, avoid: Set<string>, strict: boolean): Recipe | undefined {
  const free = (r: Recipe) => !used.has(r.id) && !avoid.has(r.id);
  let cands = pools.mains.filter((r) => r.genre === genre && free(r));
  if (!cands.length) cands = pools.mains.filter(free);
  // 「この日を変える」では、ほかの日と重なるくらいなら変えない
  if (!cands.length && strict) return undefined;
  if (!cands.length) cands = pools.mains.filter((r) => !avoid.has(r.id));
  if (!cands.length) cands = pools.mains;
  const [p1, p2] = [prev.at(-1), prev.at(-2)];
  return best(cands, (r) =>
    pantryScore(r, ctx) +
    (r.genre === genre ? 200 : 0) +
    (p1 && r.mainType === p1.mainType ? -60 : 0) +
    (p2 && r.mainType === p2.mainType ? -15 : 0) +
    ctx.rng() * 30,
  );
}

function pickExtra(pool: Recipe[], main: Recipe, other: Recipe | undefined, used: Set<string>, ctx: Ctx, avoid: Set<string>): Recipe | undefined {
  if (!pool.length) return undefined;
  let cands = pool.filter((r) => !used.has(r.id) && !avoid.has(r.id));
  if (!cands.length) cands = pool.filter((r) => !avoid.has(r.id));
  if (!cands.length) cands = pool;
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

function pickDay(pools: Pools, genre: Genre, used: Set<string>, prev: Recipe[], ctx: Ctx, avoid = new Set<string>(), strict = false): Omit<DayPlan, "day"> | undefined {
  const main = pickMain(pools, genre, used, prev, ctx, avoid, strict);
  if (!main) return undefined;
  markCovered(main, ctx);
  const side = ctx.input.withSide ? pickExtra(pools.sides, main, undefined, used, ctx, avoid) : undefined;
  markCovered(side, ctx);
  const soup = ctx.input.withSoup && !isSoupyMain(main) ? pickExtra(pools.soups, main, side, used, ctx, avoid) : undefined;
  markCovered(soup, ctx);
  return { genre, main, side, soup };
}

export interface GenerateResult {
  days: DayPlan[];
  warnings: string[];
  notes: string[];
  pantry: PantryUse[];
}

/** 週の献立を作る。swaps は「この日を変える」を押した回数（曜日の番号 1..7 → 回数） */
export function generateWeeklyPlan(input: PlannerInput, swaps: Record<number, number> = {}): GenerateResult {
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

  // 「この日を変える」: ほかの日と重ならない別の組み合わせにする
  for (const [dayStr, times] of Object.entries(swaps)) {
    const idx = Number(dayStr) - 1;
    if (!(idx >= 0 && idx < DAYS) || !(times > 0)) continue;
    for (let k = 1; k <= Math.min(times, 50); k++) {
      const others = new Set(days.filter((_, i) => i !== idx).flatMap((x) => [x.main.id, x.side?.id, x.soup?.id]).filter((x): x is string => !!x));
      const cur = days[idx];
      const avoid = new Set([cur.main.id, cur.side?.id, cur.soup?.id].filter((x): x is string => !!x));
      const swapCtx: Ctx = { input, pantry, covered: new Set(), rng: mulberry32((input.seed * 31 + (idx + 1) * 1009 + k * 7919) >>> 0) };
      // 主菜が変えられない（候補が1品だけ）のときは、そのまま
      const pick = pickDay(pools, cur.genre, others, days.slice(0, idx).map((x) => x.main), swapCtx, avoid, true);
      if (pick) days[idx] = { day: idx + 1, ...pick };
    }
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
export function pantryReport(days: DayPlan[], input: PlannerInput): PantryUse[] {
  const allowed = filterRecipes(RECIPES, input);
  return input.pantry.map((term) => {
    const res = resolveTerm(term);
    const used: PantryUse["used"] = [];
    for (const d of days)
      for (const r of [d.main, d.side, d.soup]) if (r && recipeMatches(r, res, false)) used.push({ day: d.day, recipe: r.name });
    return {
      term,
      unknown: res.ingredients.length === 0,
      used,
      blocked: res.ingredients.length > 0 && !allowed.some((r) => recipeMatches(r, res, false)),
    };
  });
}

/** 苦手な言葉ごとに、外れる料理の数（画面の説明用） */
export function dislikeCount(term: string): number {
  const res = resolveTerm(term);
  return RECIPES.filter((r) => recipeMatches(r, res, true)).length;
}
