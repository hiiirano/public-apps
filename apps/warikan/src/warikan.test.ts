import assert from "node:assert/strict";
import { calculate, defaultRatios as ratios, differenceText } from "./warikan";
import type { Person, Level } from "./types";
const p = (level: Level = "normal", fixed = ""): Person => ({
  name: "",
  level,
  fixed,
});
let cases = 0;
function test(name: string, fn: () => void) {
  fn();
  cases++;
  console.log("✓ " + name);
}
test("傾斜 0/.7/1/1.3", () =>
  assert.deepEqual(
    calculate(3000, [p("gift"), p("less"), p(), p("more")], ratios, 1, 0)
      .amounts,
    [0, 700, 1000, 1300],
  ));
test("固定額優先、残額配分", () =>
  assert.deepEqual(
    calculate(3000, [p("gift", "555"), p(), p()], ratios, 100, 0).amounts,
    [555, 1300, 1300],
  ));
test("おごりは0円", () =>
  assert.deepEqual(
    calculate(100, [p("gift"), p()], ratios, 1, 0).amounts,
    [0, 100],
  ));
test("全員おごり不可", () =>
  assert.throws(
    () => calculate(100, [p("gift"), p("gift")], ratios, 100, 0),
    /全員おごり/,
  ));
test("全員0円固定も不可", () =>
  assert.throws(() => calculate(100, [p("normal", "0")], ratios, 1, 0)));
for (const unit of [1, 10, 100, 500]) {
  test(`${unit}円単位の切り上げ・おつり`, () => {
    const r = calculate(1001, [p(), p(), p()], ratios, unit, 1);
    assert.equal(r.amounts[0], Math.ceil(1001 / 3 / unit) * unit);
    assert.equal(r.difference, r.collected - 1001);
    assert.equal(r.received, r.amounts[0] * 2);
    assert.equal(r.hostActual, 1001 - r.received);
    assert.match(differenceText(r.difference), /おつり/);
  });
  test(`${unit}円単位でも固定額は維持・不足`, () => {
    const r = calculate(
      1001,
      [p("normal", "300"), p("normal", "300")],
      ratios,
      unit,
      0,
    );
    assert.equal(r.difference, -401);
    assert.equal(r.hostActual, 701);
    assert.equal(differenceText(r.difference), "幹事が 401円 負担");
  });
}
test("金額0", () =>
  assert.deepEqual(calculate(0, [p(), p()], ratios, 100, 0).amounts, [0, 0]));
test("1人だけ", () => {
  const r = calculate(1234, [p()], ratios, 100, 0);
  assert.equal(r.amounts[0], 1300);
  assert.equal(r.received, 0);
  assert.equal(r.hostActual, 1234);
});
test("固定額超過", () => {
  const r = calculate(100, [p("normal", "250"), p()], ratios, 100, 0);
  assert.deepEqual(r.amounts, [250, 0]);
  assert.equal(r.difference, 150);
});
test("カスタム比率", () =>
  assert.deepEqual(
    calculate(
      300,
      [p("less"), p("more")],
      { ...ratios, less: 1, more: 2 },
      1,
      0,
    ).amounts,
    [100, 200],
  ));
test("負数・小数・非数・上限・不正固定額・単位・幹事", () => {
  for (const n of [-1, 1.5, NaN, Infinity, 1000000000])
    assert.throws(() => calculate(n, [p()], ratios, 1, 0));
  for (const v of ["-1", "1.2", "abc"])
    assert.throws(() => calculate(100, [p("normal", v)], ratios, 1, 0));
  assert.throws(() => calculate(100, [], ratios, 1, 0));
  assert.throws(() => calculate(100, [p()], ratios, 3, 0));
  assert.throws(() => calculate(100, [p()], ratios, 1, 3));
  assert.throws(() => calculate(100, [p()], { ...ratios, normal: NaN }, 1, 0));
});
test("入力を変更しない", () => {
  const people = [p(), p("more")],
    before = JSON.stringify(people);
  calculate(400, people, ratios, 100, 0);
  assert.equal(JSON.stringify(people), before);
});
console.log(`${cases} tests passed`);
