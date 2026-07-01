// macro-planner コアロジックの最小ユニットテスト（外部依存なし・tsxで実行）
import { strict as assert } from "node:assert";
import type { FoodEntry, Profile } from "./types";
import {
  ACTIVITY_FACTORS,
  bmi,
  bmiCategory,
  bmr,
  entriesForDate,
  macroKcal,
  macroTargets,
  remaining,
  sumEntries,
  targetCalories,
  tdee,
} from "./macro";
import { normalizeEntry, normalizeProfile } from "./storage";
import { parseEstimation } from "./llm";

let passed = 0;
function t(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ok ${name}`);
}

function prof(p: Partial<Profile> = {}): Profile {
  return {
    sex: p.sex ?? "male",
    age: p.age ?? 30,
    heightCm: p.heightCm ?? 170,
    weightKg: p.weightKg ?? 65,
    activity: p.activity ?? "moderate",
    goal: p.goal ?? "maintain",
    proteinPerKg: p.proteinPerKg ?? 2.0,
    fatPercent: p.fatPercent ?? 0.25,
  };
}

function food(p: Partial<FoodEntry>): FoodEntry {
  return {
    id: p.id ?? "f1",
    name: p.name ?? "食事",
    kcal: p.kcal ?? 0,
    protein: p.protein ?? 0,
    fat: p.fat ?? 0,
    carbs: p.carbs ?? 0,
    date: p.date ?? "2026-07-01",
    createdAt: p.createdAt ?? 1000,
  };
}

// ---- BMR（Mifflin-St Jeor） ----
t("bmr: 男性の式 (10kg+6.25cm-5age+5)", () => {
  // 10*65 + 6.25*170 - 5*30 + 5 = 650+1062.5-150+5 = 1567.5
  assert.equal(bmr(prof({ sex: "male" })), 1567.5);
});

t("bmr: 女性は男性より166 低い (+5 vs -161)", () => {
  // 女性: 650+1062.5-150-161 = 1401.5
  assert.equal(bmr(prof({ sex: "female" })), 1401.5);
  assert.equal(bmr(prof({ sex: "male" })) - bmr(prof({ sex: "female" })), 166);
});

// ---- TDEE ----
t("tdee: BMR × 活動係数", () => {
  // 1567.5 * 1.55 = 2429.625
  assert.equal(tdee(prof({ activity: "moderate" })), 1567.5 * 1.55);
  assert.equal(ACTIVITY_FACTORS.sedentary, 1.2);
  assert.equal(ACTIVITY_FACTORS.athlete, 1.9);
});

// ---- 目標カロリー ----
t("targetCalories: 維持は TDEE を丸めた値", () => {
  assert.equal(targetCalories(prof({ goal: "maintain" })), 2430); // round(2429.625)
});

t("targetCalories: 減量 -20% / 増量 +10%", () => {
  assert.equal(targetCalories(prof({ goal: "cut" })), 1944); // round(2429.625*0.8)
  assert.equal(targetCalories(prof({ goal: "bulk" })), 2673); // round(2429.625*1.1)
});

// ---- PFC 配分 ----
t("macroTargets: P=体重比 / F=カロリー比 / C=残り", () => {
  const m = macroTargets(prof({ goal: "maintain" }));
  assert.equal(m.kcal, 2430);
  assert.equal(m.protein, 130); // 2.0 * 65
  assert.equal(m.fat, 68); // round(2430*0.25/9)=round(67.5)
  assert.equal(m.carbs, 325); // round((2430-520-612)/4)=round(324.5)
});

t("macroKcal: PFC由来カロリーは目標付近に収まる", () => {
  const m = macroTargets(prof({ goal: "maintain" }));
  const kc = macroKcal(m); // 130*4 + 68*9 + 325*4 = 520+612+1300 = 2432
  assert.equal(kc, 2432);
  assert.ok(Math.abs(kc - m.kcal) <= 30); // 丸め誤差は小さい
});

t("macroTargets: 炭水化物は負にならない（高タンパク・高脂質でも0止まり）", () => {
  const m = macroTargets(
    prof({ weightKg: 100, proteinPerKg: 4, fatPercent: 0.6, goal: "cut" }),
  );
  assert.ok(m.carbs >= 0);
});

// ---- ログ集計 ----
t("sumEntries: kcal/PFC を合算", () => {
  const s = sumEntries([
    food({ kcal: 300, protein: 30, fat: 5, carbs: 40 }),
    food({ kcal: 500, protein: 20, fat: 20, carbs: 50 }),
  ]);
  assert.deepEqual(s, { kcal: 800, protein: 50, fat: 25, carbs: 90 });
});

t("sumEntries: 空配列は全ゼロ", () => {
  assert.deepEqual(sumEntries([]), { kcal: 0, protein: 0, fat: 0, carbs: 0 });
});

t("remaining: 目標 − 摂取（超過は負）", () => {
  const target = { kcal: 2000, protein: 130, fat: 60, carbs: 200 };
  const consumed = { kcal: 2200, protein: 100, fat: 60, carbs: 150 };
  assert.deepEqual(remaining(target, consumed), {
    kcal: -200,
    protein: 30,
    fat: 0,
    carbs: 50,
  });
});

t("entriesForDate: 指定日だけ抽出", () => {
  const entries = [
    food({ id: "a", date: "2026-07-01" }),
    food({ id: "b", date: "2026-07-02" }),
    food({ id: "c", date: "2026-07-01" }),
  ];
  const day = entriesForDate(entries, "2026-07-01");
  assert.equal(day.length, 2);
  assert.deepEqual(
    day.map((e) => e.id),
    ["a", "c"],
  );
});

// ---- BMI ----
t("bmi: kg/m^2（小数第1位）とカテゴリ", () => {
  assert.equal(bmi(prof({ heightCm: 170, weightKg: 65 })), 22.5);
  assert.equal(bmiCategory(22.5), "普通体重");
  assert.equal(bmiCategory(17), "低体重");
  assert.equal(bmiCategory(27), "肥満(1度)");
  assert.equal(bmiCategory(0), "—");
});

// ---- storage 正規化 ----
t("normalizeProfile: 範囲外をクランプ・不正値を既定に", () => {
  const p = normalizeProfile({
    sex: "??",
    age: 5,
    heightCm: 999,
    weightKg: 65,
    activity: "unknown",
    goal: "cut",
    proteinPerKg: 10,
    fatPercent: 0.9,
  });
  assert.equal(p.sex, "male"); // 不正→既定
  assert.equal(p.age, 10); // 下限クランプ
  assert.equal(p.heightCm, 250); // 上限クランプ
  assert.equal(p.activity, "moderate"); // 不正→既定
  assert.equal(p.goal, "cut"); // 有効値は保持
  assert.equal(p.proteinPerKg, 4); // 上限クランプ
  assert.equal(p.fatPercent, 0.6); // 上限クランプ
});

t("normalizeEntry: 欠損補完・負値は0・日付検疫", () => {
  const e = normalizeEntry({ name: "  ", protein: -5, kcal: 300.6, date: "bad" });
  assert.equal(e.name, "食事"); // 空白→既定
  assert.equal(e.protein, 0); // 負→0
  assert.equal(e.kcal, 301); // 丸め
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(e.date)); // 不正日付→当日
  assert.ok(typeof e.id === "string" && e.id.length > 0);
});

// ---- LLM 推定パース ----
t("parseEstimation: foods配列を抽出", () => {
  const json = JSON.stringify({
    foods: [{ name: "鶏むね肉200g", kcal: 220, protein: 46, fat: 3, carbs: 0 }],
  });
  const items = parseEstimation(json);
  assert.equal(items.length, 1);
  assert.equal(items[0].protein, 46);
  assert.equal(items[0].name, "鶏むね肉200g");
});

t("parseEstimation: コードフェンス付きでも抽出", () => {
  const raw =
    '```json\n{"foods":[{"name":"白米150g","kcal":250,"carbs":55}]}\n```';
  const items = parseEstimation(raw);
  assert.equal(items.length, 1);
  assert.equal(items[0].kcal, 250);
  assert.equal(items[0].carbs, 55);
});

t("parseEstimation: 全ゼロ食品・不正入力は除外/空配列", () => {
  assert.deepEqual(parseEstimation("わかりません"), []);
  const items = parseEstimation(
    JSON.stringify({ foods: [{ name: "水", kcal: 0, protein: 0, fat: 0, carbs: 0 }] }),
  );
  assert.equal(items.length, 0); // 栄養ゼロは除外
});

console.log(`\n${passed} tests passed.`);
