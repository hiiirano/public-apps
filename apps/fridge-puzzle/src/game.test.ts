import assert from "node:assert/strict";
import {
  EVIDENCES,
  MISSIONS,
  MUSEUM_ITEMS,
  PUDDING_INCIDENT_TRUTH,
  createInitialState,
  evaluate,
  getMission,
  hasAllIncidentEvidence,
  isRemovalTarget,
  isMissionUnlocked,
  loadSaveData,
  normalizeSaveData,
  removeTarget,
  saveProgress,
  starsForMoves,
  swapSlots,
  zoneForSlot,
  type SaveData,
} from "./game.js";

// 1. 基本設定とミッション数チェック
assert.equal(MISSIONS.length, 6, "Must have 6 missions total");
assert.equal(zoneForSlot(0), "freezer");
assert.equal(zoneForSlot(4), "chilled");
assert.equal(zoneForSlot(11), "vegetable");
assert.throws(() => zoneForSlot(12), RangeError);

// 2. 既存ミッション 回帰テスト
// Mission 1: lost-and-found
let m1 = createInitialState("lost-and-found");
assert.deepEqual(evaluate(m1), { misplacedFoods: 0, targetsRemaining: 2, solved: false });
assert.equal(removeTarget(m1, 0), m1, "fresh food must not be removable");
m1 = removeTarget(m1, 7);
m1 = removeTarget(m1, 11);
assert.deepEqual(evaluate(m1), { misplacedFoods: 0, targetsRemaining: 0, solved: true });
assert.equal(starsForMoves(m1.moves, m1.missionId), 3);

// Mission 2: bad-smell
let m2 = createInitialState("bad-smell");
assert.equal(evaluate(m2).targetsRemaining, 3);
m2 = removeTarget(m2, 3);
m2 = removeTarget(m2, 6);
m2 = removeTarget(m2, 11);
assert.equal(evaluate(m2).solved, true);

// Mission 3: total-chaos
let m3 = createInitialState("total-chaos");
assert.deepEqual(evaluate(m3), { misplacedFoods: 7, targetsRemaining: 2, solved: false });
m3 = removeTarget(m3, 0);
m3 = removeTarget(m3, 5);
m3 = swapSlots(m3, 1, 4);
m3 = swapSlots(m3, 2, 11);
m3 = swapSlots(m3, 7, 8);
m3 = swapSlots(m3, 10, 5);
assert.deepEqual(evaluate(m3), { misplacedFoods: 0, targetsRemaining: 0, solved: true });
assert.equal(starsForMoves(m3.moves, m3.missionId), 3);

// 3. 新3ミッション (深夜のプリン事件) テスト
// Mission 4: pudding-1
let m4 = createInitialState("pudding-1");
assert.equal(getMission("pudding-1").chapter, "深夜のプリン事件");
assert.deepEqual(evaluate(m4), { misplacedFoods: 0, targetsRemaining: 2, solved: false });
m4 = removeTarget(m4, 7); // remote
m4 = removeTarget(m4, 11); // toycar
assert.equal(evaluate(m4).solved, true);
assert.equal(starsForMoves(m4.moves, m4.missionId), 3);

// Mission 5: pudding-2
let m5 = createInitialState("pudding-2");
assert.deepEqual(evaluate(m5), { misplacedFoods: 0, targetsRemaining: 3, solved: false });
m5 = removeTarget(m5, 3); // puddingHalf
m5 = removeTarget(m5, 6); // spoon
m5 = removeTarget(m5, 11); // lettuceBad
assert.equal(evaluate(m5).solved, true);

// Mission 6: pudding-3
let m6 = createInitialState("pudding-3");
assert.deepEqual(evaluate(m6), { misplacedFoods: 7, targetsRemaining: 2, solved: false });
m6 = removeTarget(m6, 0); // note
m6 = removeTarget(m6, 5); // yogurtBad
m6 = swapSlots(m6, 1, 4);
m6 = swapSlots(m6, 2, 11);
m6 = swapSlots(m6, 7, 8);
m6 = swapSlots(m6, 10, 5);
assert.deepEqual(evaluate(m6), { misplacedFoods: 0, targetsRemaining: 0, solved: true });

// 4. 新鮮食材のタップ不変性テスト
const freshItemState = createInitialState("pudding-1");
const freshSlot = freshItemState.slots[0]!;
assert.equal(freshSlot.kind, "food");
assert.equal(isRemovalTarget(freshSlot), false);
const afterTapFresh = removeTarget(freshItemState, 0);
assert.equal(afterTapFresh, freshItemState, "Target must remain unchanged when fresh food is tapped");

// 5. セーブデータ (normalizeSaveData) 正常系・破損・復元テスト
const defaultSave = normalizeSaveData(null);
assert.deepEqual(defaultSave, { version: 1, completedMissions: [], collectedEvidence: [], museumUnlocked: [] });

const corrupt1 = normalizeSaveData("invalid json or primitive");
assert.deepEqual(corrupt1, defaultSave);

const corrupt2 = normalizeSaveData({ completedMissions: "not an array", collectedEvidence: [123, null, "spoon"] });
assert.deepEqual(corrupt2, { version: 1, completedMissions: [], collectedEvidence: ["spoon"], museumUnlocked: [] });

const corruptIds = normalizeSaveData({
  completedMissions: ["pudding-1", "unknown", "pudding-1"],
  collectedEvidence: ["remote", "fake", "remote"],
  museumUnlocked: ["remote", "missing", "remote"],
});
assert.deepEqual(corruptIds, {
  version: 1,
  completedMissions: ["pudding-1"],
  collectedEvidence: ["remote"],
  museumUnlocked: ["remote"],
});

const validSaveInput: SaveData = {
  version: 1,
  completedMissions: ["lost-and-found", "pudding-1"],
  collectedEvidence: ["remote", "spoon"],
  museumUnlocked: ["remote"],
};
const normalizedValid = normalizeSaveData(validSaveInput);
assert.deepEqual(normalizedValid, validSaveInput);

// LocalStorage モックテスト
const mockStorageData: Record<string, string> = {};
const mockStorage: Storage = {
  getItem: (key: string) => mockStorageData[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorageData[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorageData[key];
  },
  clear: () => {
    Object.keys(mockStorageData).forEach((k) => delete mockStorageData[k]);
  },
  length: 0,
  key: () => null,
};

saveProgress(validSaveInput, mockStorage);
const loaded = loadSaveData(mockStorage);
assert.deepEqual(loaded, validSaveInput);

// 6. 証拠順序不変テスト
const evOrderA = ["note", "remote", "spoon"];
const evOrderB = ["remote", "spoon", "note"];
const allPresentA = EVIDENCES.every((ev) => ev.id === "puddingHalf" || evOrderA.includes(ev.id));
const allPresentB = EVIDENCES.every((ev) => ev.id === "puddingHalf" || evOrderB.includes(ev.id));
assert.equal(allPresentA, true);
assert.equal(allPresentB, true);

// 7. 事件の順序と真相開放条件
assert.equal(isMissionUnlocked("pudding-1", []), true);
assert.equal(isMissionUnlocked("pudding-2", []), false);
assert.equal(isMissionUnlocked("pudding-2", ["pudding-1"]), true);
assert.equal(isMissionUnlocked("pudding-3", ["pudding-1"]), false);
assert.equal(isMissionUnlocked("pudding-3", ["pudding-2"]), false);
assert.equal(isMissionUnlocked("pudding-3", ["pudding-1", "pudding-2"]), true);
assert.equal(hasAllIncidentEvidence(["remote", "puddingHalf", "spoon"]), false);
assert.equal(hasAllIncidentEvidence(EVIDENCES.map((evidence) => evidence.id).reverse()), true);

// 8. 定数データの非空チェック
assert.ok(EVIDENCES.length >= 4);
assert.ok(MUSEUM_ITEMS.length >= 1);
assert.ok(PUDDING_INCIDENT_TRUTH.title.length > 0);

console.log("fridge-puzzle core & expansion tests: all tests passed!");
