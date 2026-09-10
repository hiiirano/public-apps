import { strict as assert } from "node:assert";
import { shinjuku } from "./cities/shinjuku";
import { route, selectablePlaces } from "./router";

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`  ok ${name}`);
}

test("西口→区役所は最短と日差し回避で別経路になる", () => {
  const shortest = route(shinjuku, "west_exit", "ward_office", "shortest");
  const shade = route(shinjuku, "west_exit", "ward_office", "shade");
  assert.ok(shortest.distanceM < shade.distanceM);
  assert.ok(shortest.coveredRatio < shade.coveredRatio);
  assert.ok(shade.coveredRatio >= 90);
  assert.equal(shade.exposedM, 45);
});

test("日差し回避は新宿駅→新宿三丁目を地下経由にする", () => {
  const shade = route(shinjuku, "east_exit", "sanchome", "shade");
  assert.deepEqual(shade.nodeIds, ["east_exit", "metro", "sanchome"]);
  assert.equal(shade.exposedM, 0);
});

test("逆方向では案内文も逆向きになる", () => {
  const reverse = route(shinjuku, "east_exit", "west_exit", "shade");
  assert.equal(reverse.steps.length, 1);
  assert.match(reverse.steps[0].instruction, /西口/);
});

test("同じ地点は0分・100%カバー", () => {
  const same = route(shinjuku, "west_exit", "west_exit", "shortest");
  assert.equal(same.distanceM, 0);
  assert.equal(same.minutes, 0);
  assert.equal(same.coveredRatio, 100);
});

test("全プリセット地点が相互に到達可能", () => {
  const places = selectablePlaces(shinjuku);
  for (const from of places) {
    for (const to of places) {
      const result = route(shinjuku, from.id, to.id, "shade");
      assert.equal(result.from, from.id);
      assert.equal(result.to, to.id);
    }
  }
});

test("不明な地点は拒否する", () => {
  assert.throws(
    () => route(shinjuku, "unknown", "west_exit", "shortest"),
    /Unknown/,
  );
});

console.log(`\n${passed} tests passed`);
