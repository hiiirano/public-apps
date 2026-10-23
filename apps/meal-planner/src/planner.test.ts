// 献立の判定・組み立て・保存の単体テストとランダム（性質）テスト。npm test で実行。
import type { Allergen, DayPlan, GenrePref, PlannerInput, Recipe } from "./types";
import { ALL_ALLERGENS, ALL_GENRES, GENRE_PREFS } from "./types";
import { addTerms, norm, recipeMatches, resolveTerm, splitTerms } from "./foods";
import { arrangeGenres, filterRecipes, fitCounts, generateWeeklyPlan, genreCounts, isSoupyMain, mulberry32, PREFERRED_DAYS } from "./generator";
import { buildPlan } from "./plan";
import { buildShoppingList, formatQuantity, roundQty, servingsFor } from "./shopping";
import { freshState, migrateOld, parseState } from "./storage";
import { MAIN_RECIPES, RECIPES, SIDE_RECIPES, SOUP_RECIPES, isSoup } from "./data/recipes";
import { INGREDIENTS } from "./data/ingredients";

let passed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = "") {
  if (cond) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}
const base = (o: Partial<PlannerInput> = {}): PlannerInput => ({ ...freshState().input, ...o });
const dishes = (d: DayPlan): Recipe[] => [d.main, d.side, d.soup].filter((r): r is Recipe => !!r);
const uses = (r: Recipe, names: string[]) => r.ingredients.some((i) => names.includes(i.name));
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

// ---- 言い換え辞書（不具合1・2の原因）----
const ing = (t: string) => resolveTerm(t).ingredients;
check("牛肉 → 牛こま切れ肉・合いびき肉", same(ing("牛肉"), ["牛こま切れ肉", "合いびき肉"]), ing("牛肉").join());
for (const t of ["ぎゅうにく", "ビーフ", "牛", "ギュウニク", "牛肉類"]) check(`${t} も牛肉`, same(ing(t), ing("牛肉")), ing(t).join());
for (const t of ["ネギ", "ねぎ", "葱", "長ネギ", "長ねぎ", "青ねぎ", "万能ねぎ", "小ねぎ", "ﾈｷﾞ"]) check(`${t} → 長ねぎのみ`, same(ing(t), ["長ねぎ"]), ing(t).join());
for (const t of ["玉ねぎ", "タマネギ", "たまねぎ", "玉葱", "オニオン"]) check(`${t} → 玉ねぎのみ`, same(ing(t), ["玉ねぎ"]), ing(t).join());
check("人参 → にんじん", same(ing("人参"), ["にんじん"]));
check("ニンジン → にんじん", same(ing("ニンジン"), ["にんじん"]));
check("きゃべつ・ｷｬﾍﾞﾂ → キャベツ", same(ing("きゃべつ"), ["キャベツ"]) && same(ing("ｷｬﾍﾞﾂ"), ["キャベツ"]));
check("豚肉にハム・ベーコンも入る", ["豚バラ肉", "合いびき肉", "ベーコン", "ハム"].every((n) => ing("豚肉").includes(n)));
check("鶏肉 → 鶏もも・むね・ひき", same(ing("チキン"), ["鶏もも肉", "鶏むね肉", "鶏ひき肉"]));
check("魚に えび は入らない", !ing("魚").includes("えび"));
check("海鮮に えび・いか・あさり", ["えび", "いか", "あさり", "鮭"].every((n) => ing("海鮮").includes(n)));
check("きのこ → 4種", same(ing("キノコ"), ["しめじ", "えのき", "しいたけ", "エリンギ"]));
check("リンゴ は料理データに無い", ing("リンゴ").length === 0 && !resolveTerm("リンゴ").known);
check("もも肉 は部分一致で鶏もも肉", same(ing("もも肉"), ["鶏もも肉"]));
check("1文字の未知語は部分一致しない", ing("な").length === 0);
check("ねぎの注意書きに玉ねぎ", (resolveTerm("ねぎ").note ?? "").includes("玉ねぎ"));
check("norm: 全角英数・空白", norm(" ＡＢＣ　ﾈｷﾞ ") === "abcねぎ");
check("区切り", splitTerms("キャベツ、リンゴ,ネギ　大根\n白菜").join() === "キャベツ,リンゴ,ネギ,大根,白菜");
check("同じ意味の言葉は1つに", addTerms(["ねぎ"], ["ネギ", "長葱", "玉ねぎ"]).join() === "ねぎ,玉ねぎ");
// 辞書の言葉はすべて実在する材料名を指す
for (const n of Object.keys(INGREDIENTS)) check(`材料名そのものが引ける: ${n}`, ing(n).includes(n));

// ---- 苦手なもの（不具合1）----
const noBeef = filterRecipes(RECIPES, base({ dislikes: ["牛肉"] }));
check("牛肉で牛こま切れ肉の料理が消える", !noBeef.some((r) => uses(r, ["牛こま切れ肉", "合いびき肉"])));
check("牛肉で肉じゃがが消える", !noBeef.some((r) => r.name === "肉じゃが"));
const noNegi = filterRecipes(RECIPES, base({ dislikes: ["ネギ"] }));
check("ネギで長ねぎの料理が消える", !noNegi.some((r) => uses(r, ["長ねぎ"])));
check("ネギでも玉ねぎの料理は残る", noNegi.some((r) => uses(r, ["玉ねぎ"])));
check("ネギでも『キャベツと玉ねぎの味噌汁』は残る", noNegi.some((r) => r.name === "キャベツと玉ねぎの味噌汁"));
const noCurry = filterRecipes(RECIPES, base({ dislikes: ["カレー"] }));
check("材料に無い言葉は料理名で外す（カレー）", !noCurry.some((r) => r.name.includes("カレー")) && noCurry.length > 100);
check("苦手なし・アレルギーなしなら全品", filterRecipes(RECIPES, base()).length === RECIPES.length);

// ---- 冷蔵庫の残り（不具合2）----
{
  const p = generateWeeklyPlan(base({ pantry: ["キャベツ", "リンゴ", "ネギ"] }));
  const by = (t: string) => p.pantry.find((x) => x.term === t)!;
  check("キャベツを使う", by("キャベツ").used.length >= 1, JSON.stringify(by("キャベツ")));
  check("ネギ（長ねぎ）を使う", by("ネギ").used.length >= 1, JSON.stringify(by("ネギ")));
  check("リンゴは使えないと分かる", by("リンゴ").unknown && by("リンゴ").used.length === 0);
  check("使った料理に本当に入っている", p.pantry.every((u) => u.used.every((x) => RECIPES.find((r) => r.name === x.recipe)!.ingredients.some((i) => resolveTerm(u.term).ingredients.includes(i.name)))));
  const blocked = generateWeeklyPlan(base({ pantry: ["くるみ"], excludeAllergens: ["くるみ"] }));
  check("アレルギーで使えない残り物は blocked", blocked.pantry[0].blocked && !blocked.pantry[0].used.length);
}
// 残り物にした材料は、条件で外れていない限り必ずどこかで使う（材料すべて × seed 3通り）
{
  let miss = "";
  for (const n of Object.keys(INGREDIENTS)) {
    if (!RECIPES.some((r) => uses(r, [n]))) continue;
    for (const seed of [1, 2, 3]) {
      const p = generateWeeklyPlan(base({ pantry: [n], seed }));
      if (!p.pantry[0].used.length && !p.pantry[0].blocked) miss += `${n}(seed${seed}) `;
    }
  }
  check("残り物はどれも1回以上使う", miss === "", miss);
}

// ---- ジャンル（不具合3）----
for (const pref of GENRE_PREFS) {
  let bad = "";
  for (let seed = 0; seed < 200; seed++) {
    const p = generateWeeklyPlan(base({ genrePref: pref, seed }));
    const c = ALL_GENRES.map((g) => p.days.filter((d) => d.main.genre === g).length);
    if (pref === "おまかせ") {
      if ([...c].sort().join() !== "2,2,3") bad += `${seed}:${c} `;
    } else {
      const own = c[ALL_GENRES.indexOf(pref)];
      if (own !== PREFERRED_DAYS || c.some((n) => n === 0)) bad += `${seed}:${c} `;
    }
    for (let i = 2; i < 7; i++) if (p.days[i].genre === p.days[i - 1].genre && p.days[i].genre === p.days[i - 2].genre) bad += `${seed}:3連続 `;
  }
  check(`ジャンル「${pref}」の日数と混ざり方（200通り）`, bad === "", bad.slice(0, 200));
}
check("和を選んでも洋・中が入る", (() => { const p = generateWeeklyPlan(base({ genrePref: "和" })); return p.days.some((d) => d.main.genre === "洋") && p.days.some((d) => d.main.genre === "中"); })());
check("候補が足りなければ他のジャンルに回す", (() => {
  const c = fitCounts({ 和: 4, 洋: 2, 中: 1 }, { 和: 2, 洋: 10, 中: 10 }, "和");
  return c.和 === 2 && c.洋 + c.中 === 5;
})());
check("候補7品未満なら重ねて7日", (() => { const c = fitCounts({ 和: 3, 洋: 2, 中: 2 }, { 和: 1, 洋: 1, 中: 0 }, "おまかせ"); return c.和 + c.洋 + c.中 === 7 && c.中 === 0; })());
check("並びは日数どおり", (() => { const s = arrangeGenres(genreCounts("洋", mulberry32(5)), mulberry32(6)); return s.length === 7 && s.filter((g) => g === "洋").length === 4; })());
{
  const noWa = generateWeeklyPlan(base({ genrePref: "和", dislikes: MAIN_RECIPES.filter((r) => r.genre === "和").map((r) => r.name) }));
  check("和の主菜が無いときは知らせる", noWa.days.length === 7 && noWa.warnings.some((w) => w.includes("和食")));
}

// ---- 1日の品数（不具合4）----
{
  const p = generateWeeklyPlan(base());
  check("7日分", p.days.length === 7);
  check("毎日 主菜＋副菜", p.days.every((d) => d.main.role === "main" && d.side && !isSoup(d.side)));
  check("汁物（汁のある麺の日以外）", p.days.every((d) => (isSoupyMain(d.main) ? !d.soup : !!d.soup && isSoup(d.soup))));
  check("副菜なし設定", generateWeeklyPlan(base({ withSide: false })).days.every((d) => !d.side && (d.soup || isSoupyMain(d.main))));
  check("汁物なし設定", generateWeeklyPlan(base({ withSoup: false })).days.every((d) => d.side && !d.soup));
  check("ラーメンの日は汁物なし", (() => {
    const ramen = generateWeeklyPlan(base({ dislikes: MAIN_RECIPES.filter((r) => r.name !== "醤油ラーメン").map((r) => r.name) }));
    return ramen.days.every((d) => d.main.name === "醤油ラーメン" && !d.soup) && ramen.warnings.length > 0;
  })());
}

// ---- 決定性・この日を変える ----
{
  const a = generateWeeklyPlan(base({ seed: 9 }));
  const b = generateWeeklyPlan(base({ seed: 9 }));
  check("同じ番号なら同じ献立", JSON.stringify(a.days) === JSON.stringify(b.days));
  check("別の番号なら変わる", JSON.stringify(a.days) !== JSON.stringify(generateWeeklyPlan(base({ seed: 10 })).days));
  const s = generateWeeklyPlan(base({ seed: 9 }), { 3: 1 });
  check("この日を変える: 3日目の主菜が変わる", s.days[2].main.id !== a.days[2].main.id);
  check("この日を変える: ほかの日はそのまま", [0, 1, 3, 4, 5, 6].every((i) => s.days[i].main.id === a.days[i].main.id));
  check("この日を変える: 同じジャンル", s.days[2].main.genre === a.days[2].genre);
  check("この日を変える: 週で主菜が重ならない", new Set(s.days.map((d) => d.main.id)).size === 7);
  const s2 = generateWeeklyPlan(base({ seed: 9 }), { 3: 2 });
  check("2回押すとさらに変わる", s2.days[2].main.id !== s.days[2].main.id);
}

// ---- ランダム（性質）テスト: アレルギー・苦手・時短は必ず守る ----
{
  const rnd = mulberry32(2026);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
  const words = ["牛肉", "豚肉", "鶏肉", "魚", "えび", "ねぎ", "玉ねぎ", "きのこ", "なす", "ピーマン", "トマト", "にんじん", "辛いもの", "卵", "豆腐", "カレー", "セロリ", "ごま", "乳製品", "貝"];
  const pantryWords = ["キャベツ", "リンゴ", "ネギ", "大根", "白菜", "じゃがいも", "鶏肉", "卵", "もやし", "トマト"];
  let runs = 0, empty = 0, bad = "";
  for (let n = 0; n < 3000; n++) {
    const allergens = ALL_ALLERGENS.filter(() => rnd() < 0.18) as Allergen[];
    const dislikes = words.filter(() => rnd() < 0.1);
    const input = base({
      seed: Math.floor(rnd() * 1e6),
      genrePref: pick(GENRE_PREFS) as GenrePref,
      excludeAllergens: allergens,
      dislikes,
      pantry: pantryWords.filter(() => rnd() < 0.2),
      withSide: rnd() < 0.8,
      withSoup: rnd() < 0.8,
      quickOnly: rnd() < 0.3,
      adults: 1 + Math.floor(rnd() * 10),
      children: Math.floor(rnd() * 11),
    });
    const swaps = rnd() < 0.3 ? { [1 + Math.floor(rnd() * 7)]: 1 + Math.floor(rnd() * 3) } : {};
    const p = buildPlan(input, swaps);
    runs++;
    const resolved = dislikes.map(resolveTerm);
    const pool = filterRecipes(MAIN_RECIPES, input);
    if (!p.days.length) {
      empty++;
      if (pool.length) bad += `候補があるのに空 `;
      if (!p.warnings.length) bad += `空なのに説明なし `;
      continue;
    }
    if (p.days.length !== 7) bad += `日数${p.days.length} `;
    for (const d of p.days)
      for (const r of dishes(d)) {
        if (r.allergens.some((a) => allergens.includes(a))) bad += `アレルギー:${r.name} `;
        if (resolved.some((x) => recipeMatches(r, x, true))) bad += `苦手:${r.name} `;
        if (input.quickOnly && r.timeMin > 20) bad += `時短:${r.name} `;
      }
    if (pool.length >= 7 && new Set(p.days.map((d) => d.main.id)).size !== 7) bad += `主菜重複(${pool.length}) `;
    if (input.withSide && filterRecipes(SIDE_RECIPES, input).length >= 7 && p.days.some((d) => !d.side)) bad += `副菜なし `;
    if (!input.withSoup && p.days.some((d) => d.soup)) bad += `汁物を付けた `;
    if (input.withSoup && filterRecipes(SOUP_RECIPES, input).length && p.days.some((d) => !d.soup && !isSoupyMain(d.main))) bad += `汁物なし `;
    // 買い物リスト: 量は正、同じ材料・単位は1行
    if (p.shopping.some((s) => !(s.qty > 0))) bad += `量0 `;
    if (p.shopping.some((s) => (s.unit === "個" && !Number.isInteger(s.qty)) || ((s.unit === "g" || s.unit === "ml") && s.qty >= 100 && s.qty % 10 !== 0))) bad += `量が細かい `;
    if (new Set(p.shopping.map((s) => s.name + s.unit)).size !== p.shopping.length) bad += `重複行 `;
    // 残り物の報告は実際の献立と一致
    for (const u of p.pantry) {
      const real = p.days.flatMap((d) => dishes(d).filter((r) => recipeMatches(r, resolveTerm(u.term), false)));
      if (real.length !== u.used.length) bad += `残り物の報告ずれ:${u.term} `;
    }
    if (bad.length > 300) break;
  }
  check(`ランダム ${runs} 通りで条件を必ず守る`, bad === "", bad.slice(0, 300));
  check("ランダムで献立ができた件数", runs - empty > 2500, `${runs - empty}`);
}

// ---- 買い物リスト ----
{
  const input = base({ adults: 2, children: 2 });
  check("子どもは0.5人前（大人2+子2=3）", servingsFor(input) === 3);
  const teriyaki = RECIPES.find((r) => r.name === "鶏の照り焼き")!;
  const miso = RECIPES.find((r) => r.name === "豆腐とわかめの味噌汁")!;
  const list = buildShoppingList([{ day: 1, genre: "和", main: teriyaki, soup: miso }], input);
  check("人数で量が変わる（300g→450g）", list.find((i) => i.name === "鶏もも肉")!.qty === 450);
  check("汁物の材料も入る", list.some((i) => i.name === "乾燥わかめ"));
  const p = buildPlan(base());
  check("同名・同単位は合算", new Set(p.shopping.map((i) => `${i.name}__${i.unit}`)).size === p.shopping.length);
  check("買う量は切り上げ（187.5g→190g・11.5個→12個・12.5g→15g・大さじ1.25→1.3）", roundQty(187.5, "g") === 190 && roundQty(11.5, "個") === 12 && roundQty(12.5, "g") === 15 && roundQty(1.25, "大さじ") === 1.3 && roundQty(450, "g") === 450);
  check("量の表示", formatQuantity(15, "大さじ") === "大さじ15" && formatQuantity(2.5, "個") === "2.5個" && formatQuantity(300, "g") === "300g");
}

// ---- 保存 ----
{
  const fresh = freshState();
  check("壊れた保存は初期状態", JSON.stringify(parseState("{oops")) === JSON.stringify(fresh));
  check("空は初期状態", JSON.stringify(parseState(null)) === JSON.stringify(fresh));
  const good = { v: 3, input: base({ adults: 3, dislikes: ["牛肉"], pantry: ["キャベツ"], excludeAllergens: ["卵"] }), swaps: { 2: 1 }, checked: ["鶏もも肉__g"] };
  const back = parseState(JSON.stringify(good));
  check("正しい保存は復元", back.input.adults === 3 && back.input.dislikes[0] === "牛肉" && back.swaps[2] === 1 && back.checked[0] === "鶏もも肉__g");
  check("人数が範囲外なら初期状態", parseState(JSON.stringify({ ...good, input: { ...good.input, adults: 99 } })).input.adults === 2);
  check("知らないアレルゲンなら初期状態", parseState(JSON.stringify({ ...good, input: { ...good.input, excludeAllergens: ["ごま"] } })).input.excludeAllergens.length === 0);
  check("版が違えば初期状態", parseState(JSON.stringify({ ...good, v: 2 })).input.adults === 2);
  check("曜日の範囲外の入れ替えは捨てる", Object.keys(parseState(JSON.stringify({ ...good, swaps: { 9: 1, 2: 1 } })).swaps).join() === "2");
  const old = migrateOld(JSON.stringify({ adults: 4, children: 1, genres: ["和"], excludeAllergens: ["卵", "そば", "x"], ngKeywords: ["牛肉"], pantry: ["キャベツ"], withSide: true, quickOnly: true, seed: 3 }));
  check("前の版からアレルギーを引き継ぐ", !!old && same(old.input.excludeAllergens, ["卵", "そば"]));
  check("前の版のジャンル1つは「多め」に", old?.input.genrePref === "和" && old.input.dislikes[0] === "牛肉" && old.input.quickOnly);
}

if (failures.length) {
  console.error(failures.slice(0, 30).map((f) => `  NG ${f}`).join("\n"));
  console.error(`\n${failures.length} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`${passed} checks passed（ランダム 3000 通り・ジャンル 800 通り・残り物 ${Object.keys(INGREDIENTS).length} 材料）`);
