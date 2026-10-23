// 道さがし（router.ts）と保存（storage.ts）のテスト。npm test で実行する。
import { strict as assert } from "node:assert";
import { shinjuku } from "./cities/shinjuku";
import { compareRoutes, edgeCost, minutesFor, route, RouteError, selectablePlaces, SUN_WEIGHT, validateCity, WALK_M_PER_MIN } from "./router";
import { DEFAULT_STATE, parseHash, parseState } from "./storage";
import type { CityData, EdgeKind, Place, RouteEdge, RouteMode, RouteResult } from "./types";

let passed = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
  } catch (e) {
    console.error(`  NG ${name}`);
    throw e;
  }
  passed += 1;
  console.log(`  ok ${name}`);
}

// ---------- 新宿のデータ ----------
const ids = shinjuku.places.map((p) => p.id);
const sel = selectablePlaces(shinjuku).map((p) => p.id);

test("新宿のデータに形の問題がない（つながり・線・根拠・出典）", () => {
  assert.deepEqual(validateCity(shinjuku), []);
});

test("選べる地点は5か所", () => {
  assert.deepEqual(sel, ["tocho", "west_exit", "east_exit", "ward_office", "sanchome"]);
});

test("西口→区役所: 最短は地上、日陰の道は地下（日なたは15B出口の50mだけ）", () => {
  const c = compareRoutes(shinjuku, "west_exit", "ward_office");
  assert.deepEqual(c.shortest.nodeIds, ["west_exit", "east_exit", "ward_office"]);
  assert.equal(c.shortest.distanceM, 620);
  assert.equal(c.shortest.sunM, 480);
  assert.deepEqual(c.shade.nodeIds, ["west_exit", "east_exit", "metro", "subnade", "ward_15b", "ward_office"]);
  assert.equal(c.shade.distanceM, 710);
  assert.equal(c.shade.sunM, 50);
  assert.equal(c.shade.shadeRatio, 92); // 660/710 = 92.9 → 切り捨て
  assert.equal(c.shade.minutes, 12);
  assert.equal(c.shade.sunMinutes, 1);
  assert.equal(c.shortest.minutes, 11);
  assert.equal(c.shortest.sunMinutes, 8);
  assert.equal(c.extraMinutes, 1);
  assert.equal(c.sunSavedMinutes, 7);
  assert.equal(c.same, false);
});

test("東口→三丁目: 日陰の道は地下だけで日なた0分・日陰100%", () => {
  const c = compareRoutes(shinjuku, "east_exit", "sanchome");
  assert.deepEqual(c.shade.nodeIds, ["east_exit", "metro", "sanchome"]);
  assert.equal(c.shade.sunM, 0);
  assert.equal(c.shade.sunMinutes, 0);
  assert.equal(c.shade.shadeRatio, 100);
});

test("都庁→三丁目: 最短は地上が多く、日陰の道は全部地下", () => {
  const c = compareRoutes(shinjuku, "tocho", "sanchome");
  assert.equal(c.shade.sunM, 0);
  assert.ok(c.shortest.sunM >= 1000);
  assert.ok(c.shade.distanceM >= c.shortest.distanceM);
});

test("西口→東口: 2つが同じ道なら same=true、差は0分", () => {
  const c = compareRoutes(shinjuku, "west_exit", "east_exit");
  assert.equal(c.same, true);
  assert.equal(c.extraMinutes, 0);
  assert.equal(c.sunSavedMinutes, 0);
  assert.equal(c.shade.steps[0].edge.kind, "covered");
});

test("逆向きでは案内文と線の向きも逆になる", () => {
  const r = route(shinjuku, "east_exit", "west_exit", "shade");
  assert.equal(r.steps.length, 1);
  assert.match(r.steps[0].instruction, /西口へ/);
  const pts = r.steps[0].points;
  const east = shinjuku.places.find((p) => p.id === "east_exit")!;
  assert.deepEqual(pts[0], { x: east.x, y: east.y });
});

test("同じ地点: 0m・0分・日陰100%・道なし", () => {
  const r = route(shinjuku, "west_exit", "west_exit", "shortest");
  assert.equal(r.distanceM, 0);
  assert.equal(r.minutes, 0);
  assert.equal(r.sunMinutes, 0);
  assert.equal(r.shadeRatio, 100);
  assert.deepEqual(r.nodeIds, ["west_exit"]);
});

test("知らない地点は RouteError(unknown-place)", () => {
  assert.throws(() => route(shinjuku, "unknown", "west_exit", "shortest"), (e) => e instanceof RouteError && e.code === "unknown-place");
  assert.throws(() => route(shinjuku, "west_exit", "", "shade"), RouteError);
});

test("route は入力のデータを書き換えない", () => {
  const before = JSON.stringify(shinjuku);
  for (const a of ids) for (const b of ids) compareRoutes(shinjuku, a, b);
  assert.equal(JSON.stringify(shinjuku), before);
});

test("分の計算: 0m→0分、1m→1分、60m→1分、61m→2分", () => {
  assert.equal(WALK_M_PER_MIN, 60);
  assert.deepEqual([0, 1, 60, 61, 600].map(minutesFor), [0, 1, 1, 2, 10]);
});

test("日陰の道の重み: 地下・屋根は距離のまま、地上は5倍", () => {
  const e = (kind: EdgeKind) => ({ ...shinjuku.edges[0], kind, distanceM: 100 });
  assert.equal(edgeCost(e("underground"), "shade"), 100);
  assert.equal(edgeCost(e("covered"), "shade"), 100);
  assert.equal(edgeCost(e("outdoor"), "shade"), 100 * SUN_WEIGHT);
  assert.equal(edgeCost(e("outdoor"), "shortest"), 100);
});

test("validateCity は壊れたデータを見つける", () => {
  const broken: CityData = structuredClone(shinjuku);
  broken.edges[0].distanceM = 0;
  broken.edges[1].points = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
  broken.edges[2].sourceIds = ["nope"];
  broken.edges[3].basis = "";
  broken.edges.push({ ...broken.edges[4] });
  const p = validateCity(broken);
  assert.ok(p.some((x) => x.includes("距離")));
  assert.ok(p.some((x) => x.includes("線")));
  assert.ok(p.some((x) => x.includes("出典")));
  assert.ok(p.some((x) => x.includes("根拠")));
  assert.ok(p.some((x) => x.includes("重複")));
  const island: CityData = structuredClone(shinjuku);
  island.edges = island.edges.filter((e) => e.from !== "sanchome" && e.to !== "sanchome");
  assert.ok(validateCity(island).some((x) => x.includes("行けない")));
});

// ---------- 保存 ----------
test("保存: 正しい内容はそのまま読む", () => {
  assert.deepEqual(parseState(JSON.stringify({ from: "tocho", to: "sanchome", mode: "shortest" }), sel), { from: "tocho", to: "sanchome", mode: "shortest" });
});

test("保存: 壊れた・知らない・同じ地点・変なモードは初期状態", () => {
  const bad = [null, "", "{", "null", "[]", "1", '{"from":"tocho"}', '{"from":"tocho","to":"tocho","mode":"shade"}', '{"from":"x","to":"tocho","mode":"shade"}', '{"from":"tocho","to":"sanchome","mode":"fast"}', '{"from":1,"to":2,"mode":"shade"}'];
  for (const raw of bad) assert.deepEqual(parseState(raw, sel), DEFAULT_STATE, String(raw));
});

test("保存: 前の版の URL を読み、不正なら null", () => {
  assert.deepEqual(parseHash("#from=tocho&to=sanchome&mode=shortest", sel), { from: "tocho", to: "sanchome", mode: "shortest" });
  assert.deepEqual(parseHash("#from=tocho&to=sanchome", sel), { from: "tocho", to: "sanchome", mode: "shade" });
  assert.equal(parseHash("#from=tocho&to=tocho", sel), null);
  assert.equal(parseHash("#from=<script>&to=tocho", sel), null);
  assert.equal(parseHash("", sel), null);
});

// ---------- ランダム（性質）テスト ----------
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KINDS: EdgeKind[] = ["underground", "covered", "outdoor"];

/** ランダムな街。connected=false なら島ができることもある */
function randomCity(r: () => number, connected: boolean): CityData {
  const n = 2 + Math.floor(r() * 9);
  const places: Place[] = [];
  for (let i = 0; i < n; i++) places.push({ id: `n${i}`, label: `n${i}`, shortLabel: `n${i}`, kind: "landmark", selectable: true, x: Math.floor(r() * 400), y: Math.floor(r() * 304) });
  const edges: RouteEdge[] = [];
  const add = (a: number, b: number) => {
    const A = places[a], B = places[b];
    edges.push({
      id: `e${edges.length}`, from: A.id, to: B.id,
      distanceM: 10 + Math.floor(r() * 991),
      kind: KINDS[Math.floor(r() * 3)],
      instruction: { forward: `${A.id}→${B.id}`, reverse: `${B.id}→${A.id}` },
      basis: "テスト", sourceIds: ["s"],
      points: [{ x: A.x, y: A.y }, { x: B.x, y: B.y }],
    });
  };
  if (connected) for (let i = 1; i < n; i++) add(i, Math.floor(r() * i)); // 木でつなぐ
  const extra = Math.floor(r() * n * 2);
  for (let k = 0; k < extra; k++) {
    const a = Math.floor(r() * n), b = Math.floor(r() * n);
    if (a !== b) add(a, b); // 同じ2点を結ぶ道が複数あってもよい
  }
  return { id: "rand", name: "rand", version: "0", checkedOn: "", places, edges, sources: [{ id: "s", title: "", publisher: "", url: "" }] };
}

/** すべての組の最小の重み（フロイド–ワーシャル法）。答え合わせ用 */
function allPairs(city: CityData, mode: RouteMode): Map<string, number> {
  const ids = city.places.map((p) => p.id);
  const d = new Map<string, number>();
  const k = (a: string, b: string) => `${a}|${b}`;
  for (const a of ids) for (const b of ids) d.set(k(a, b), a === b ? 0 : Infinity);
  for (const e of city.edges) {
    const c = edgeCost(e, mode);
    if (c < d.get(k(e.from, e.to))!) { d.set(k(e.from, e.to), c); d.set(k(e.to, e.from), c); }
  }
  for (const m of ids) for (const a of ids) for (const b of ids) {
    const v = d.get(k(a, m))! + d.get(k(m, b))!;
    if (v < d.get(k(a, b))!) d.set(k(a, b), v);
  }
  return d;
}

function checkRoute(city: CityData, r: RouteResult, from: string, to: string) {
  // 出発地と目的地をつなぎ、1歩ずつ途切れない
  assert.equal(r.nodeIds[0], from);
  assert.equal(r.nodeIds[r.nodeIds.length - 1], to);
  assert.equal(r.nodeIds.length, r.steps.length + 1);
  r.steps.forEach((s, i) => {
    assert.equal(s.from, r.nodeIds[i]);
    assert.equal(s.to, r.nodeIds[i + 1]);
    assert.ok((s.edge.from === s.from && s.edge.to === s.to) || (s.edge.to === s.from && s.edge.from === s.to));
    const a = city.places.find((p) => p.id === s.from)!, b = city.places.find((p) => p.id === s.to)!;
    assert.deepEqual(s.points[0], { x: a.x, y: a.y });
    assert.deepEqual(s.points[s.points.length - 1], { x: b.x, y: b.y });
    assert.equal(s.instruction, s.edge.from === s.from ? s.edge.instruction.forward : s.edge.instruction.reverse);
  });
  // 同じ地点を2回通らない
  assert.equal(new Set(r.nodeIds).size, r.nodeIds.length);
  // 数の整合
  assert.equal(r.distanceM, r.steps.reduce((t, s) => t + s.edge.distanceM, 0));
  assert.equal(r.shadeM + r.sunM, r.distanceM);
  assert.ok(r.shadeM >= 0 && r.sunM >= 0);
  assert.ok(Number.isInteger(r.shadeRatio) && r.shadeRatio >= 0 && r.shadeRatio <= 100);
  assert.equal(r.shadeRatio === 100, r.sunM === 0);
  assert.equal(r.shadeRatio === 0, r.distanceM > 0 && r.shadeM * 100 < r.distanceM);
  assert.ok(r.sunMinutes >= 0 && r.sunMinutes <= r.minutes);
  assert.equal(r.minutes, minutesFor(r.distanceM));
  assert.equal(r.sunMinutes, minutesFor(r.sunM));
  assert.equal(r.minutes === 0, r.distanceM === 0);
}

test("ランダム 3,000 街: 道は必ず出発地と目的地をつなぎ、最適で、数の整合がとれる", () => {
  const r = rng(20261023);
  let pairs = 0, noRoute = 0;
  for (let t = 0; t < 3000; t++) {
    const city = randomCity(r, t % 4 !== 0);
    const best = { shortest: allPairs(city, "shortest"), shade: allPairs(city, "shade") };
    for (const a of city.places) for (const b of city.places) {
      const reachable = Number.isFinite(best.shortest.get(`${a.id}|${b.id}`)!);
      if (!reachable) {
        assert.throws(() => route(city, a.id, b.id, "shortest"), (e) => e instanceof RouteError && e.code === "no-route");
        assert.throws(() => compareRoutes(city, a.id, b.id), RouteError);
        noRoute++;
        continue;
      }
      const c = compareRoutes(city, a.id, b.id);
      checkRoute(city, c.shortest, a.id, b.id);
      checkRoute(city, c.shade, a.id, b.id);
      // それぞれの重みで最小
      for (const m of ["shortest", "shade"] as const) {
        const got = c[m].steps.reduce((t2, s) => t2 + edgeCost(s.edge, m), 0);
        assert.ok(Math.abs(got - best[m].get(`${a.id}|${b.id}`)!) < 1e-6, `${m} が最小でない`);
      }
      // 日陰の道は最短より短くならず、日なたは最短より多くならない
      assert.ok(c.shade.distanceM >= c.shortest.distanceM);
      assert.ok(c.shade.sunM <= c.shortest.sunM);
      assert.ok(c.extraMinutes >= 0 && c.sunSavedMinutes >= 0);
      if (c.same) assert.equal(c.shade.distanceM, c.shortest.distanceM);
      // 逆向きでも同じ重み
      const back = route(city, b.id, a.id, "shortest");
      assert.equal(back.distanceM, c.shortest.distanceM);
      // 同じ入力には同じ答え
      assert.deepEqual(route(city, a.id, b.id, "shade").nodeIds, c.shade.nodeIds);
      pairs++;
    }
  }
  console.log(`     （${pairs} 組を検査、${noRoute} 組は正しく「道がない」）`);
  assert.ok(pairs > 50000 && noRoute > 100);
});

test("ランダム: 新宿の全組・両モードで性質が成り立つ", () => {
  for (const a of ids) for (const b of ids) {
    const c = compareRoutes(shinjuku, a, b);
    checkRoute(shinjuku, c.shortest, a, b);
    checkRoute(shinjuku, c.shade, a, b);
    assert.ok(c.shade.sunM <= c.shortest.sunM);
  }
});

test("ランダム: 保存内容をでたらめに壊しても落ちず、必ず正しい形を返す", () => {
  const r = rng(7);
  const good = JSON.stringify({ from: "tocho", to: "sanchome", mode: "shade" });
  for (let i = 0; i < 5000; i++) {
    const chars = good.split("");
    const n = 1 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) chars[Math.floor(r() * chars.length)] = String.fromCharCode(32 + Math.floor(r() * 95));
    const s = parseState(chars.join(""), sel);
    assert.ok(sel.includes(s.from) && sel.includes(s.to) && s.from !== s.to && (s.mode === "shade" || s.mode === "shortest"));
  }
});

console.log(`\n${passed} tests passed`);
