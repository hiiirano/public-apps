import assert from "node:assert/strict";
import {
  daysBetween,
  groupsOf,
  lastSetsFor,
  recommend,
  thisWeek,
  toCsv,
  totalSets,
  volumeOf,
} from "./logic";
import type { Exercise, Workout } from "./types";

const EX: Exercise[] = [
  { id: "chest-press", name: "チェストプレス", kind: "machine", group: "upper", metric: "reps" },
  { id: "squat", name: "スクワット", kind: "bodyweight", group: "lower", metric: "reps" },
  { id: "plank", name: "プランク", kind: "bodyweight", group: "core", metric: "seconds" },
];

let seq = 0;
function wo(date: string, exs: Array<[string, Array<[number | null, number]>]>): Workout {
  const t = Date.UTC(...(date.split("-").map(Number) as [number, number, number]).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number]) + seq++;
  return {
    id: `w${seq}`,
    date,
    startedAt: t,
    endedAt: t + 3600000,
    exercises: exs.map(([exerciseId, sets]) => ({
      exerciseId,
      sets: sets.map(([weight, reps]) => ({ weight, reps })),
    })),
  };
}

// ---- daysBetween ----
assert.equal(daysBetween("2026-07-07", "2026-07-01"), 6);
assert.equal(daysBetween("2026-07-01", "2026-07-07"), -6);
assert.equal(daysBetween("2026-03-01", "2026-02-28"), 1); // 月またぎ

// ---- groupsOf / volumeOf / totalSets ----
{
  const w = wo("2026-07-01", [
    ["chest-press", [[40, 10], [40, 8]]],
    ["plank", [[null, 60]]],
  ]);
  assert.deepEqual([...groupsOf(w, EX)].sort(), ["core", "upper"]);
  assert.equal(volumeOf(w), 40 * 10 + 40 * 8); // 自重(null)はボリューム外
  assert.equal(totalSets(w), 3);
}

// ---- recommend: 記録なし → 上半身 ----
{
  const r = recommend([], EX, "2026-07-07");
  assert.equal(r.kind, "upper");
}

// ---- recommend: 今日記録済み → rest ----
{
  const r = recommend([wo("2026-07-07", [["squat", [[null, 20]]]])], EX, "2026-07-07");
  assert.equal(r.kind, "rest");
}

// ---- recommend: 2日連続 → rest ----
{
  const ws = [
    wo("2026-07-05", [["chest-press", [[40, 10]]]]),
    wo("2026-07-06", [["squat", [[null, 20]]]]),
  ];
  assert.equal(recommend(ws, EX, "2026-07-07").kind, "rest");
}

// ---- recommend: 昨日だけ → restにはならず、古い方の部位 ----
{
  const ws = [
    wo("2026-07-03", [["squat", [[80, 10]]]]),
    wo("2026-07-06", [["chest-press", [[40, 10]]]]),
  ];
  const r = recommend(ws, EX, "2026-07-07");
  assert.equal(r.kind, "lower");
  assert.ok(r.reason.includes("4日"), r.reason);
}

// ---- recommend: 未経験の部位が優先 ----
{
  const ws = [wo("2026-07-01", [["chest-press", [[40, 10]]]])];
  assert.equal(recommend(ws, EX, "2026-07-07").kind, "lower");
}

// ---- recommend: 同日タイ → upper ----
{
  const ws = [wo("2026-07-04", [["chest-press", [[40, 10]]], ["squat", [[null, 20]]]])];
  assert.equal(recommend(ws, EX, "2026-07-07").kind, "upper");
}

// ---- recommend: coreだけの日はローテーションに影響しない ----
{
  const ws = [
    wo("2026-07-02", [["chest-press", [[40, 10]]]]),
    wo("2026-07-04", [["squat", [[null, 20]]]]),
    wo("2026-07-06", [["plank", [[null, 60]]]]), // 体幹のみ
  ];
  const r = recommend(ws, EX, "2026-07-07");
  assert.equal(r.kind, "upper"); // upper(7/2)がlower(7/4)より古い
}

// ---- recommend: セット0のワークアウトは無視 ----
{
  const ws = [wo("2026-07-07", [["chest-press", []]])];
  assert.equal(recommend(ws, EX, "2026-07-07").kind, "upper");
}

// ---- lastSetsFor ----
{
  const w1 = wo("2026-07-01", [["chest-press", [[35, 10]]]]);
  const w2 = wo("2026-07-04", [["chest-press", [[40, 10], [40, 8]]]]);
  const w3 = wo("2026-07-06", [["squat", [[null, 20]]]]);
  const sets = lastSetsFor([w1, w2, w3], "chest-press");
  assert.deepEqual(sets, [{ weight: 40, reps: 10 }, { weight: 40, reps: 8 }]);
  // 進行中ワークアウト自身は除外できる
  assert.deepEqual(lastSetsFor([w1, w2], "chest-press", w2.id), [{ weight: 35, reps: 10 }]);
  assert.equal(lastSetsFor([w3], "chest-press"), null);
}

// ---- thisWeek ----
{
  const ws = [
    wo("2026-07-01", [["squat", [[null, 20]]]]),
    wo("2026-07-06", [["squat", [[null, 20]]]]),
    wo("2026-06-29", [["squat", [[null, 20]]]]), // 8日前 → 対象外
  ];
  assert.equal(thisWeek(ws, "2026-07-07").length, 2);
}

// ---- toCsv ----
{
  const ws = [wo("2026-07-01", [["chest-press", [[40, 10]]], ["squat", [[null, 20]]]])];
  const csv = toCsv(ws, EX);
  assert.ok(csv.startsWith("date,exercise,set,weight_kg,reps\n"));
  assert.ok(csv.includes("2026-07-01,チェストプレス,1,40,10\n"));
  assert.ok(csv.includes("2026-07-01,スクワット,1,,20\n")); // 自重は空欄
}

console.log("all tests passed ✅");
