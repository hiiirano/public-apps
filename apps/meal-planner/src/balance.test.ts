import assert from 'node:assert/strict';
import { generateWeeklyPlan, filterRecipes } from './generator';
import { RECIPES, MAIN_RECIPES } from './data/recipes';
import { ALL_ALLERGENS, ALL_GENRES } from './types';
import type { PlannerInput } from './types';
const base: PlannerInput = { adults: 2, children: 0, genres: [], excludeAllergens: [], ngKeywords: [], withSide: true, quickOnly: false, pantry: [], seed: 1 };
for (let seed = 0; seed < 300; seed++) for (const quickOnly of [false,true]) {
 const p = generateWeeklyPlan({...base,seed,quickOnly,pantry: seed % 2 ? ['豚','鶏'] : []});
 assert.equal(p.days.length,7);
 assert.equal(new Set(p.days.map(d=>d.main.id)).size,7);
 for (const genre of ALL_GENRES) assert.ok(p.days.filter(d=>d.main.genre === genre).length <= 3);
 for (let i=2;i<7;i++) assert.ok(!(p.days[i].main.genre === p.days[i-1].main.genre && p.days[i].main.genre === p.days[i-2].main.genre));
 assert.ok(p.days.slice(1).filter((d,i)=>d.main.mainType === p.days[i].main.mainType).length <= 2);
 if(quickOnly) assert.ok(p.days.every(d=>d.main.timeMin<=20 && d.side!.timeMin<=20));
}
for (const genre of ALL_GENRES) {
 const p = generateWeeklyPlan({...base,genres:[genre]});
 assert.equal(p.days.length,7);
 assert.ok(p.days.every(d=>d.main.genre===genre && d.side?.genre===genre));
}
for(const a of ALL_ALLERGENS) {
 const p=generateWeeklyPlan({...base,excludeAllergens:[a]});
 assert.ok(p.days.every(d=>!d.main.allergens.includes(a) && !d.side?.allergens.includes(a)));
}
const none=generateWeeklyPlan({...base,ngKeywords:[...new Set(RECIPES.flatMap(r=>r.ingredients.map(i=>i.name)))]});
assert.equal(none.days.length,0); assert.ok(none.warnings.length);
const single=generateWeeklyPlan({...base,ngKeywords: MAIN_RECIPES.filter(r=>r.name!=='鮭の塩焼き').map(r=>r.name)});
assert.equal(single.days.length,7); assert.ok(single.warnings.length);
assert.ok(single.days.every(d=>d.main.name==='鮭の塩焼き'));
assert.ok(generateWeeklyPlan({...base,withSide:false}).days.every(d=>!d.side));
assert.ok(filterRecipes(RECIPES,{...base,ngKeywords:['えび']}).every(r=>!r.ingredients.some(i=>i.name.includes('えび'))));
const twoGenres = generateWeeklyPlan({...base,ngKeywords: MAIN_RECIPES.filter(r=>r.genre==='中').map(r=>r.name)});
assert.equal(twoGenres.days.length,7);assert.ok(twoGenres.warnings.length);
assert.ok(ALL_GENRES.every(g=>twoGenres.days.filter(d=>d.main.genre===g).length<=4));
console.log('PASS: 600週間の分散・時短・全ジャンル・全アレルゲン・候補不足');
