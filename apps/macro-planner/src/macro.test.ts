// T1 計算の単体テスト・T2 ランダム（性質）テスト。tsx で実行（npm test）
import { strict as assert } from "node:assert";
import type { ActivityLevel, FoodEntry, Goal, Profile } from "./types";
import { ACTIVITIES, GOALS, RANGE } from "./types";
import {
  ACTIVITY_FACTORS,
  balanceNotes,
  bmi,
  bmiCategory,
  bmr,
  completeProfile,
  entriesForDate,
  equivalents,
  GOAL_RATES,
  macroKcal,
  macroTargets,
  parseNumber,
  pfcRatio,
  readField,
  remaining,
  roundHalf,
  standardWeight,
  sumEntries,
  targetCalories,
  tdee,
} from "./macro";
import { FOODS } from "./foods";
import { exportText, freshState, importText, KEY, loadFrom, migrateOld, parseState, todayStr, validEntry } from "./storage";

let passed = 0;
function t(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ok ${name}`);
}

const prof = (p: Partial<Profile> = {}): Profile => ({
  sex: "female",
  age: 30,
  heightCm: 158,
  weightKg: 52,
  activity: "light",
  goal: "maintain",
  proteinPerKg: 1.5,
  fatPercent: 25,
  ...p,
});

const entry = (p: Partial<FoodEntry> = {}): FoodEntry => ({
  id: "f1",
  name: "ごはん",
  kcal: 234,
  protein: 3.8,
  fat: 0.5,
  carbs: 55.7,
  date: "2026-10-23",
  createdAt: 1,
  ...p,
});

// 再現できる乱数（mulberry32）
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

console.log("T1 単体テスト");

// ---- 基礎代謝（Mifflin-St Jeor）----
t("基礎代謝: 女性 30歳 158cm 52kg = 1196.5", () => {
  // 10*52 + 6.25*158 - 5*30 - 161 = 520 + 987.5 - 150 - 161
  assert.equal(bmr(prof()), 1196.5);
});
t("基礎代謝: 男性 30歳 170cm 65kg = 1567.5", () => {
  assert.equal(bmr(prof({ sex: "male", heightCm: 170, weightKg: 65 })), 1567.5);
});
t("基礎代謝: 男女の差はいつも 166", () => {
  assert.equal(bmr(prof({ sex: "male" })) - bmr(prof({ sex: "female" })), 166);
});

// ---- 消費・目標カロリー ----
t("活動係数は 1.2 / 1.375 / 1.55 / 1.725 / 1.9", () => {
  assert.deepEqual(Object.values(ACTIVITY_FACTORS), [1.2, 1.375, 1.55, 1.725, 1.9]);
});
t("目的の増減は −20% / 0 / +10%", () => {
  assert.deepEqual(GOAL_RATES, { cut: -0.2, maintain: 0, bulk: 0.1 });
});
t("1日の消費 = 基礎代謝 × 活動係数", () => {
  assert.equal(tdee(prof()), 1196.5 * 1.375);
});
t("目標カロリー: 見本（たもつ）は 1,645", () => {
  assert.deepEqual(targetCalories(prof()), { kcal: 1645, raisedToBmr: false });
});
t("目標カロリー: ふやす +10% / やせる −20%", () => {
  assert.equal(targetCalories(prof({ goal: "bulk" })).kcal, Math.round(1196.5 * 1.375 * 1.1));
  assert.equal(targetCalories(prof({ goal: "cut" })).kcal, Math.round(1196.5 * 1.375 * 0.8));
});
t("目標カロリー: ほとんど動かない人がやせる → 基礎代謝まで引き上げ", () => {
  // 1.2 × 0.8 = 0.96 < 1 なので基礎代謝が下限になる
  assert.deepEqual(targetCalories(prof({ activity: "sedentary", goal: "cut" })), { kcal: 1197, raisedToBmr: true });
});
t("目標カロリー: 境目 — すこし動く人がやせる（1.375×0.8=1.1）は引き上げない", () => {
  assert.equal(targetCalories(prof({ goal: "cut" })).raisedToBmr, false);
});

// ---- PFC ----
t("PFC: 見本は P 78g・F 46g・C 230g", () => {
  const m = macroTargets(prof());
  assert.equal(m.protein, 78); // 1.5 × 52
  assert.equal(m.fat, 46); // round(1645 × 0.25 ÷ 9 = 45.69)
  assert.equal(m.carbs, 230); // round((1645 − 312 − 414) ÷ 4 = 229.75)
  assert.equal(m.carbsShort, false);
});
t("PFC: 割合は 19% / 25% / 56%（合計 100）", () => {
  assert.deepEqual(pfcRatio(macroTargets(prof())), { protein: 19, fat: 25, carbs: 56 });
});
t("PFC: 見本は国の目安の範囲内", () => {
  assert.deepEqual(balanceNotes(macroTargets(prof())), []);
});
t("PFC: たんぱく質と脂質だけで超える → 炭水化物 0・知らせる", () => {
  const m = macroTargets(prof({ weightKg: 250, heightCm: 120, age: 100, activity: "sedentary", goal: "cut", proteinPerKg: 2.5, fatPercent: 40 }));
  assert.equal(m.carbs, 0);
  assert.equal(m.carbsShort, true);
});
t("PFC: 脂質 40% → 脂質が多めと出る", () => {
  const notes = balanceNotes(macroTargets(prof({ fatPercent: 40 })));
  assert.ok(notes.some((n) => n.key === "fat" && n.dir === "high"));
});
t("pfcRatio: すべて 0 なら 0", () => {
  assert.deepEqual(pfcRatio({ protein: 0, fat: 0, carbs: 0 }), { protein: 0, fat: 0, carbs: 0 });
});
t("pfcRatio: 3等分（33.3…）でも合計 100", () => {
  const r = pfcRatio({ protein: 9, fat: 4, carbs: 9 }); // 36 / 36 / 36 kcal
  assert.equal(r.protein + r.fat + r.carbs, 100);
});
t("macroKcal: 4 / 9 / 4", () => {
  assert.equal(macroKcal({ protein: 10, fat: 10, carbs: 10 }), 170);
});

// ---- BMI ----
t("BMI と区分（日本肥満学会）", () => {
  assert.equal(bmi(158, 52), 20.8);
  assert.equal(bmiCategory(18.4), "低体重");
  assert.equal(bmiCategory(18.5), "普通体重");
  assert.equal(bmiCategory(24.9), "普通体重");
  assert.equal(bmiCategory(25), "肥満（1度）");
  assert.equal(bmiCategory(35), "肥満（3度）");
  assert.equal(bmiCategory(40), "肥満（4度）");
  assert.equal(bmiCategory(0), "—");
  assert.equal(bmi(0, 50), 0);
});
t("BMI 22 の体重: 158cm → 54.9kg", () => {
  assert.equal(standardWeight(158), 54.9);
});

// ---- 言い換え ----
t("言い換え: 見本は ごはん7杯・1食550kcal・鶏むね330g・卵13個・食パン8.5枚・バター4.5杯", () => {
  const e = equivalents(macroTargets(prof()));
  assert.deepEqual(e, { perMealKcal: 550, riceBowls: 7, breadSlices: 8.5, chickenGrams: 330, eggs: 13, butterSpoons: 4.5 });
});
t("roundHalf: 0.5 きざみ・0 以下は 0", () => {
  assert.equal(roundHalf(3.24), 3);
  assert.equal(roundHalf(3.25), 3.5);
  assert.equal(roundHalf(-1), 0);
  assert.equal(roundHalf(Number.NaN), 0);
});

// ---- 入力の読み取り ----
t("parseNumber: 全角・単位・カンマ・空", () => {
  assert.equal(parseNumber("６５．５"), 65.5);
  assert.equal(parseNumber("158cm"), 158);
  assert.equal(parseNumber("52kg"), 52);
  assert.equal(parseNumber("30歳"), 30);
  assert.equal(parseNumber("1,645kcal"), 1645);
  assert.equal(parseNumber(" "), null);
  assert.ok(Number.isNaN(parseNumber("abc")));
  assert.ok(Number.isNaN(parseNumber("-5")));
  assert.ok(Number.isNaN(parseNumber("1.2.3")));
});
t("readField: 範囲の境目（年齢 18〜100）", () => {
  assert.equal(readField("age", "18").value, 18);
  assert.equal(readField("age", "100").value, 100);
  assert.equal(readField("age", "17").value, null);
  assert.ok(readField("age", "17").error.includes("18〜100"));
  assert.ok(readField("age", "101").error.length > 0);
  assert.deepEqual(readField("age", ""), { value: null, error: "" });
  assert.ok(readField("age", "あ").error.includes("数字"));
});
t("readField: 身長・体重の境目と小数第1位", () => {
  assert.equal(readField("heightCm", "120").value, 120);
  assert.equal(readField("heightCm", "230").value, 230);
  assert.equal(readField("heightCm", "119.9").value, null);
  assert.equal(readField("weightKg", "30").value, 30);
  assert.equal(readField("weightKg", "250.1").value, null);
  assert.equal(readField("weightKg", "52.25").value, 52.3);
  assert.equal(readField("fatPercent", "24.6").value, 25);
});
t("completeProfile: 4項目そろうまで null", () => {
  const d = { ...freshState().draft };
  assert.equal(completeProfile(d), null);
  assert.equal(completeProfile({ ...d, sex: "female", age: 30, heightCm: 158 }), null);
  assert.deepEqual(completeProfile({ ...d, sex: "female", age: 30, heightCm: 158, weightKg: 52 }), prof());
});

// ---- 記録 ----
t("記録の合計・残り・日付で分ける", () => {
  const list = [entry(), entry({ id: "b", kcal: 71, protein: 6.1, fat: 5.1, carbs: 0.2 }), entry({ id: "c", date: "2026-10-22" })];
  const day = entriesForDate(list, "2026-10-23");
  assert.equal(day.length, 2);
  const s = sumEntries(day);
  assert.deepEqual(s, { kcal: 305, protein: 9.9, fat: 5.6, carbs: 55.9 });
  assert.deepEqual(remaining({ kcal: 300, protein: 10, fat: 5, carbs: 50 }, s), { kcal: -5, protein: 0.1, fat: -0.6, carbs: -5.9 });
  assert.deepEqual(sumEntries([]), { kcal: 0, protein: 0, fat: 0, carbs: 0 });
});
t("よく食べるもの: kcal は PFC から出した値と大きくずれない（±25%）・保存の検査に通る", () => {
  for (const f of FOODS) {
    const k = macroKcal(f);
    assert.ok(Math.abs(k - f.kcal) <= Math.max(15, f.kcal * 0.25), `${f.name} ${k} vs ${f.kcal}`);
    assert.ok(validEntry({ ...f, id: "x", name: `${f.name}（${f.amount}）`, date: "2026-10-23", createdAt: 1 }), f.name);
  }
  assert.equal(new Set(FOODS.map((f) => f.id)).size, FOODS.length);
});

// ---- 保存 ----
t("保存: 壊れた内容・古い形・範囲外は初期状態", () => {
  assert.deepEqual(parseState(null), freshState());
  assert.deepEqual(parseState("{"), freshState());
  assert.deepEqual(parseState(JSON.stringify({ draft: { ...freshState().draft, age: 5 }, log: [] })), freshState());
  assert.deepEqual(parseState(JSON.stringify({ draft: { ...freshState().draft, activity: "x" }, log: [] })), freshState());
  assert.deepEqual(parseState(JSON.stringify({ draft: freshState().draft, log: "x" })), freshState());
  assert.equal(KEY, "macro-planner.v2");
});
t("保存: 正しい記録だけ残す（名前なし・負の値・日付違いを捨てる）", () => {
  const s = parseState(
    JSON.stringify({
      draft: { ...freshState().draft, sex: "male", age: 40, heightCm: 172.5, weightKg: 70 },
      log: [entry(), entry({ id: "b", name: "" }), entry({ id: "c", kcal: -1 }), entry({ id: "d", date: "10/23" }), { x: 1 }],
    }),
  );
  assert.equal(s.draft.age, 40);
  assert.deepEqual(s.log.map((e) => e.id), ["f1"]);
});
t("保存: 書き出し → 読み込みで同じ内容。ほかのファイルは読まない", () => {
  const s = { draft: { ...freshState().draft, sex: "female" as const, age: 30, heightCm: 158, weightKg: 52 }, log: [entry()] };
  assert.deepEqual(importText(exportText(s)), s);
  assert.equal(importText('{"profile":{},"log":[]}'), null);
  assert.equal(importText("not json"), null);
});
t("前の版からの引き継ぎ: 体の情報と記録。範囲外は捨てる", () => {
  const st = migrateOld(
    JSON.stringify({ sex: "male", age: 30, heightCm: 170, weightKg: 65, activity: "moderate", goal: "cut", proteinPerKg: 2, fatPercent: 0.25 }),
    JSON.stringify([{ id: "a", name: " 鶏むね ", kcal: 220, protein: 46, fat: 3, carbs: 0, date: "2026-07-01", createdAt: 5 }, { id: "b" }]),
  )!;
  assert.equal(st.draft.sex, "male");
  assert.equal(st.draft.goal, "cut");
  assert.equal(st.draft.proteinPerKg, 1.5); // 前の版の 2.0 g/kg は引き継がず今の初期値
  assert.equal(st.log.length, 1);
  assert.equal(st.log[0].name, "鶏むね");
  assert.equal(migrateOld(null, null), null);
  assert.equal(migrateOld("{", "[")!.draft.sex, null);
  const young = migrateOld(JSON.stringify({ age: 12 }), null)!;
  assert.equal(young.draft.age, null);
});
// 偽の保存先（setItem を失敗させられる）
function fakeStore(init: Record<string, string>, failSet = false) {
  const m = new Map(Object.entries(init));
  return {
    map: m,
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => {
      if (failSet) throw new Error("QuotaExceeded");
      m.set(k, v);
    },
    removeItem: (k: string) => void m.delete(k),
  };
}
const OLD = {
  "macro.profile": JSON.stringify({ sex: "male", age: 30, heightCm: 170, weightKg: 65, activity: "moderate", goal: "maintain" }),
  "macro.log": JSON.stringify([{ id: "a", name: "鶏むね", kcal: 220, protein: 46, fat: 3, carbs: 0, date: "2026-07-01", createdAt: 5 }]),
  "macro.llm": JSON.stringify({ apiKey: "sk-secret" }),
};
t("引き継ぎ: 新しい形で保存できたら前の版を消す（API キーも消す）", () => {
  const st = fakeStore({ ...OLD });
  const s = loadFrom(st);
  assert.equal(s.draft.heightCm, 170);
  assert.equal(s.log.length, 1);
  assert.ok(st.map.has(KEY));
  assert.deepEqual([...st.map.keys()], [KEY]);
});
t("引き継ぎ: 保存に失敗したら前の版の体の情報と記録は残す（API キーだけ消す）・画面は引き継いだ内容で動く", () => {
  const st = fakeStore({ ...OLD }, true);
  const s = loadFrom(st);
  assert.equal(s.draft.heightCm, 170);
  assert.equal(s.log.length, 1);
  assert.equal(st.map.get("macro.profile"), OLD["macro.profile"]);
  assert.equal(st.map.get("macro.log"), OLD["macro.log"]);
  assert.equal(st.map.has("macro.llm"), false);
  assert.equal(st.map.has(KEY), false);
  // 次回（保存できる環境）でもう一度引き継げる
  const again = fakeStore(Object.fromEntries(st.map));
  assert.equal(loadFrom(again).log.length, 1);
  assert.deepEqual([...again.map.keys()], [KEY]);
});
t("引き継ぎ: 前の版がなければ初期状態で、何も書かない", () => {
  const st = fakeStore({});
  assert.deepEqual(loadFrom(st), freshState());
  assert.equal(st.map.size, 0);
});
t("todayStr: YYYY-MM-DD", () => {
  assert.equal(todayStr(new Date(2026, 0, 5)), "2026-01-05");
});

// ---- T2 ランダムテスト ----
console.log("T2 ランダムテスト");
t("ランダム 2万件: 必ず成り立つこと", () => {
  const r = rng(20261023);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const between = (min: number, max: number, step: number) => Math.round((min + r() * (max - min)) / step) * step;
  let raised = 0;
  let short = 0;
  for (let i = 0; i < 20000; i++) {
    const p: Profile = {
      sex: r() < 0.5 ? "male" : "female",
      age: between(RANGE.age.min, RANGE.age.max, 1),
      heightCm: between(RANGE.heightCm.min, RANGE.heightCm.max, 0.1),
      weightKg: between(RANGE.weightKg.min, RANGE.weightKg.max, 0.1),
      activity: pick(ACTIVITIES as readonly ActivityLevel[]),
      goal: pick(GOALS as readonly Goal[]),
      proteinPerKg: between(RANGE.proteinPerKg.min, RANGE.proteinPerKg.max, 0.1),
      fatPercent: between(RANGE.fatPercent.min, RANGE.fatPercent.max, 1),
    };
    const ctx = JSON.stringify(p);
    const b = bmr(p);
    const tg = targetCalories(p);
    const m = macroTargets(p);
    // 1. 基礎代謝は正。目標は整数で、へらすとき以外は TDEE × 率 の丸め
    assert.ok(b > 0, ctx);
    assert.ok(Number.isInteger(tg.kcal), ctx);
    if (p.goal !== "cut") assert.equal(tg.kcal, Math.round(tdee(p) * (1 + GOAL_RATES[p.goal])), ctx);
    // 2. 目標は基礎代謝を下回らない（丸め 0.5 まで）。引き上げたのは「へらす」で TDEE×0.8 < 基礎代謝のときだけ
    assert.ok(tg.kcal >= b - 0.5, ctx);
    assert.equal(tg.raisedToBmr, p.goal === "cut" && tdee(p) * 0.8 < b, ctx);
    if (tg.raisedToBmr) raised++;
    // 3. 目的の順: やせる ≦ たもつ < ふやす
    const k = (g: Goal) => targetCalories({ ...p, goal: g }).kcal;
    assert.ok(k("cut") <= k("maintain") && k("maintain") < k("bulk"), ctx);
    // 4. 活動量が多いほど消費は多い
    const ts = ACTIVITIES.map((a) => tdee({ ...p, activity: a }));
    for (let j = 1; j < ts.length; j++) assert.ok(ts[j] > ts[j - 1], ctx);
    // 5. PFC は 0 以上の整数。炭水化物が 0 でなければ PFC の kcal 合計は目標と ±2 以内
    for (const v of [m.protein, m.fat, m.carbs]) assert.ok(Number.isInteger(v) && v >= 0, ctx);
    if (m.carbsShort) {
      short++;
      assert.equal(m.carbs, 0, ctx);
      assert.ok(macroKcal(m) >= m.kcal - 2, ctx);
    } else assert.ok(Math.abs(macroKcal(m) - m.kcal) <= 2, ctx);
    // 6. 割合は整数で合計 100、各 0〜100
    const ratio = pfcRatio(m);
    assert.equal(ratio.protein + ratio.fat + ratio.carbs, 100, ctx);
    for (const v of Object.values(ratio)) assert.ok(v >= 0 && v <= 100, ctx);
    // 7. 脂質の割合は指定 % から ±1（丸め）。炭水化物が足りるとき
    if (!m.carbsShort) assert.ok(Math.abs(ratio.fat - p.fatPercent) <= 1, ctx);
    // 8. 言い換えは 0 以上で、ごはんの杯数 × 234 は目標から 0.25杯分以内
    const e = equivalents(m);
    for (const v of Object.values(e)) assert.ok(v >= 0 && Number.isFinite(v), ctx);
    assert.ok(Math.abs(e.riceBowls * 234 - m.kcal) <= 234 * 0.25 + 1e-9, ctx);
    // 9. 男性は同じ条件の女性より目標が多い
    if (p.sex === "male") assert.ok(tg.kcal >= targetCalories({ ...p, sex: "female" }).kcal, ctx);
    // 10. BMI 区分は文字列で、身長体重の範囲で 0 にならない
    assert.ok(bmi(p.heightCm, p.weightKg) > 0, ctx);
  }
  console.log(`    （2万件のうち 基礎代謝まで引き上げ ${raised} 件、炭水化物 0 ${short} 件）`);
  assert.ok(raised > 0 && short > 0);
});

t("ランダム 1万件: 入力の読み取りは範囲内の値だけ通す", () => {
  const r = rng(7);
  const keys = ["age", "heightCm", "weightKg", "proteinPerKg", "fatPercent"] as const;
  for (let i = 0; i < 10000; i++) {
    const key = keys[i % keys.length];
    const n = Math.round((r() * 400 - 50) * 100) / 100;
    const text = r() < 0.3 ? String(n).replace(/[0-9.]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0xfee0)) : String(n);
    const res = readField(key, text);
    const rg = RANGE[key];
    if (res.value !== null) {
      assert.ok(res.value >= rg.min - 0.5 && res.value <= rg.max + 0.5, `${key} ${text}`);
      assert.equal(res.error, "");
    } else if (n >= rg.min && n <= rg.max) assert.fail(`${key} ${text} が通らない`);
    else assert.ok(res.error.length > 0, `${key} ${text}`);
  }
});

t("ランダム 5千件: 記録の合計は1件ずつ足した値と一致し、残り + 食べた = 目標", () => {
  const r = rng(99);
  for (let i = 0; i < 5000; i++) {
    const n = Math.floor(r() * 12);
    const list = Array.from({ length: n }, (_, j) =>
      entry({ id: `e${j}`, kcal: Math.round(r() * 900), protein: Math.round(r() * 600) / 10, fat: Math.round(r() * 500) / 10, carbs: Math.round(r() * 1200) / 10 }),
    );
    const s = sumEntries(list);
    assert.equal(s.kcal, list.reduce((a, e) => a + e.kcal, 0));
    assert.ok(Math.abs(s.protein - list.reduce((a, e) => a + e.protein, 0)) < 0.051);
    const target = { kcal: 2000, protein: 80, fat: 55, carbs: 280 };
    const rem = remaining(target, s);
    assert.equal(rem.kcal + s.kcal, 2000);
    assert.ok(Math.abs(rem.carbs + s.carbs - 280) < 0.051);
  }
});

console.log(`\n${passed} tests passed.`);
