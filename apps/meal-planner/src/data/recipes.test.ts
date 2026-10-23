import assert from 'node:assert/strict';
import { RECIPES, SOUP_RECIPES, SIDE_RECIPES } from './recipes';
import { INGREDIENTS } from './ingredients';
import { ALL_ALLERGENS, ALL_GENRES } from '../types';
import type { Allergen } from '../types';
import { recipeArt } from '../art';
import { existsSync } from 'node:fs';
assert.equal(new Set(RECIPES.map(r => r.id)).size, RECIPES.length, 'ID重複');
assert.equal(new Set(RECIPES.map(r => r.name)).size, RECIPES.length, '料理名重複');
assert.ok(RECIPES.length >= 140);
for (const g of ALL_GENRES) {
  assert.ok(RECIPES.filter(r => r.genre === g && r.role === 'main').length >= 30);
  assert.ok(RECIPES.filter(r => r.genre === g && r.role === 'side').length >= 15);
}
// Independent name rules as well as explicit catalog metadata. Includes seasonings.
const rules: [RegExp, Allergen[]][] = [
  [/卵|マヨネーズ|中華麺/, ['卵']],
  [/牛乳|バター|チーズ|生クリーム|ルウ|パン粉/, ['乳']],
  [/小麦粉|パン粉|スパゲッティ|マカロニ|うどん|中華麺|そば|餃子の皮|シュウマイの皮|春巻きの皮|醤油|めんつゆ|ポン酢|ルウ|オイスター|甜麺醤|豆板醤/, ['小麦']],
  [/豆腐|厚揚げ|油揚げ|納豆|大豆|枝豆|醤油|味噌|めんつゆ|ポン酢|マヨネーズ/, ['大豆']],
  [/えび/, ['えび']], [/かに/, ['かに']], [/そば/, ['そば']], [/くるみ/, ['くるみ']], [/落花生/, ['落花生']],
  [/ハム|ベーコン|ウインナー/, ['卵','乳','小麦','大豆']],
  [/かにかま/, ['卵','小麦','えび','かに','大豆']],
  [/コンソメ|鶏ガラスープの素|ウスターソース/, ['乳','小麦','大豆']],
];
for (const r of RECIPES) {
  assert.ok(r.timeMin > 0 && r.servingsBase > 0 && r.ingredients.length >= 2, r.name);
  assert.ok(r.role !== 'main' || r.mainType, r.name);
  assert.ok(r.allergens.every(a => ALL_ALLERGENS.includes(a)), r.name);
  assert.ok(existsSync(`public/art/${recipeArt(r)}.webp`), r.name+' illustration');
  const names = r.ingredients.map(i => i.name);
  assert.equal(new Set(names).size, names.length, r.name+' ingredient duplicate');
  for (const i of r.ingredients) {
    const c = INGREDIENTS[i.name];
    assert.ok(c, `${r.name}: 未登録材料 ${i.name}`);
    assert.equal(i.unit, c.unit, `${r.name}: 単位 ${i.name}`);
    assert.equal(i.category, c.category, `${r.name}: カテゴリ ${i.name}`);
    assert.ok(Number.isFinite(i.qty) && i.qty > 0, r.name);
    for (const a of [...c.allergens, ...rules.filter(([re]) => re.test(i.name)).flatMap(([,a]) => a)])
      assert.ok(r.allergens.includes(a), `${r.name}: ${i.name} の ${a} 漏れ`);
  }
}
for (const g of ALL_GENRES) {
  assert.ok(SOUP_RECIPES.filter(r => r.genre === g).length >= 4, g + ' 汁物');
  assert.ok(SIDE_RECIPES.filter(r => r.genre === g).length >= 12, g + ' 副菜');
}
console.log(`PASS: ${RECIPES.length}品・ジャンル最低数・重複・材料・アレルゲン・イラスト`);
