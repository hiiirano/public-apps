import type { SetEntry, State, Workout } from "./types";
import { LIMITS } from "./types";
import {
  addDays,
  bestFor,
  clampValue,
  compareSet,
  daysBetween,
  daysSinceLast,
  fmtDiff,
  fmtSet,
  isRecord,
  lastItemFor,
  lastMenu,
  mondayOf,
  parseNum,
  progress,
  recommend,
  stepValue,
  streakWeeks,
  suggestNext,
  suggestedExercises,
  summarize,
  toCsv,
  volumeOf,
  weekMarks,
  weekdayMon,
} from "./logic";
import { checkState, freshState, makeBackup, migrateV1, parseBackup, parseState, PRESETS, serialize } from "./storage";
import { demoWorkouts } from "./demo";
import { artSvg, ART_KEYS } from "./art";

let passed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = "") {
  if (cond) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const EX = PRESETS;
let seq = 0;
function W(date: string, items: [string, SetEntry[]][], startedAt?: number): Workout {
  const t = startedAt ?? Date.parse(date + "T10:00:00Z") + seq++;
  return { id: `t${seq++}`, date, startedAt: t, endedAt: t + 1800000, items: items.map(([exId, sets]) => ({ exId, sets })) };
}
const s = (w: number | null, r: number): SetEntry => ({ w, r });

// ---- 日付 ----
check("日数差", daysBetween("2026-10-23", "2026-10-20") === 3);
check("月またぎ", daysBetween("2026-03-01", "2026-02-28") === 1);
check("addDays 年またぎ", addDays("2026-12-31", 1) === "2027-01-01");
check("曜日 2026-10-23 は金", weekdayMon("2026-10-23") === 4);
check("月曜", mondayOf("2026-10-25") === "2026-10-19");

// ---- 数の読み取り ----
check("全角", parseNum("４２．５") === 42.5);
check("単位付き", parseNum("40kg") === 40);
check("空", parseNum("  ") === null);
check("文字", Number.isNaN(parseNum("abc") as number));
check("マイナスは読まない", Number.isNaN(parseNum("-5") as number));

// ---- 増減 ----
check("2.5 刻みで ＋", stepValue(40, 2.5, 1, "weight", "w") === 42.5);
check("半端からそろえて ＋", stepValue(41, 2.5, 1, "weight", "w") === 42.5);
check("半端からそろえて −", stepValue(41, 2.5, -1, "weight", "w") === 40);
check("0 より下がらない", stepValue(0, 5, -1, "weight", "w") === 0);
check("上限で止まる", stepValue(500, 5, 1, "weight", "w") === LIMITS.weight);
check("回数は整数", clampValue(10.6, "reps", "r") === 11);
check("秒の上限", clampValue(99999, "seconds", "r") === LIMITS.seconds);

// ---- 前回と次の初期値 ----
const h1 = [
  W("2026-10-10", [["chest-press", [s(30, 10), s(30, 8)]]]),
  W("2026-10-17", [["chest-press", [s(35, 10), s(35, 9), s(32.5, 8)]], ["bike", [s(null, 15)]]]),
];
const last = lastItemFor(h1, "chest-press");
check("前回は新しい方", last?.sets[0].w === 35);
check("今のワークアウトは除く", lastItemFor(h1, "chest-press", h1[1].id)?.sets[0].w === 30);
check("初期値: 前回の1セット目", JSON.stringify(suggestNext([], last!.sets, "weight")) === JSON.stringify(s(35, 10)));
check("初期値: 前回の同じ番目", suggestNext([s(35, 10), s(35, 9)], last!.sets, "weight").w === 35);
check("初期値: 今日の直前のセットを優先", suggestNext([s(40, 6)], last!.sets, "weight").w === 40);
check("初期値: 前回より多いセットは前回の最後", suggestNext([s(1, 1), s(1, 1), s(1, 1), s(1, 1)], null, "weight").w === 1);
check("初期値: はじめて", JSON.stringify(suggestNext([], null, "weight")) === JSON.stringify(s(20, 10)));
check("初期値: 分", JSON.stringify(suggestNext([], null, "minutes")) === JSON.stringify(s(null, 10)));
check("初期値: 回数だけなら重さは null", suggestNext([], [s(5, 12)], "reps").w === null);

// ---- 自己ベストと比べる ----
const best = bestFor(h1, "chest-press");
check("最高の重さ", best?.maxW === 35 && best.repsAtMaxW === 10);
check("重い方が自己ベスト", isRecord(s(37.5, 5), best, "weight"));
check("同じ重さで回数が多いと自己ベスト", isRecord(s(35, 11), best, "weight"));
check("同じなら自己ベストでない", !isRecord(s(35, 10), best, "weight"));
check("はじめては自己ベストにしない", !isRecord(s(10, 10), null, "weight"));
check("前回より上", compareSet(s(35, 10), 1, last!.sets, best, "weight") === "up");
check("前回と同じ", compareSet(s(35, 9), 1, last!.sets, best, "weight") === "same");
check("前回より下", compareSet(s(30, 8), 1, last!.sets, best, "weight") === "down");
check("はじめて", compareSet(s(30, 8), 0, null, null, "weight") === "first");
check("分の自己ベスト", compareSet(s(null, 20), 0, [s(null, 15)], bestFor(h1, "bike"), "minutes") === "record");

// ---- まとめ ----
const today = W("2026-10-23", [["chest-press", [s(37.5, 8), s(35, 10)]], ["bike", [s(null, 15)]], ["leg-press", [s(50, 10)]]]);
const all = [...h1, today];
const sum = summarize(today, all, EX);
check("総重量", sum.volume === 37.5 * 8 + 35 * 10 + 500, String(sum.volume));
check("自己ベストの数", sum.records === 1, String(sum.records));
check("前回との差", sum.items[0].diff === 37.5 * 8 + 350 - (350 + 315 + 260), String(sum.items[0].diff));
check("はじめての種目は差なし", sum.items[2].diff === null);
check("伸びた種目", sum.improved === 0);
check("volumeOf", volumeOf(today) === sum.volume);

// ---- 週と続けた記録 ----
const wk = [W("2026-10-20", [["squat", [s(null, 10)]]]), W("2026-10-14", [["squat", [s(null, 10)]]]), W("2026-10-01", [["squat", [s(null, 10)]]])];
const marks = weekMarks(wk, "2026-10-23");
check("今週の印", marks.join() === [false, true, false, false, false, false, false].join());
check("続けた週", streakWeeks(wk, "2026-10-23") === 2);
check("今週まだでも途切れない", streakWeeks(wk.slice(1), "2026-10-23") === 1);
check("2週あくと 0", streakWeeks(wk.slice(2), "2026-10-23") === 0);
check("前回から", daysSinceLast(wk, "2026-10-23") === 3);
check("記録なし", daysSinceLast([], "2026-10-23") === null);
const active: Workout = { ...W("2026-10-23", [["squat", [s(null, 10)]]]), endedAt: null };
check("記録中は数えない", weekMarks([active], "2026-10-23").every((x) => !x));

// ---- おすすめ ----
check("記録なしは上半身", recommend([], EX, "2026-10-23").kind === "upper");
check("今日やったら休み", recommend([W("2026-10-23", [["squat", [s(null, 1)]]])], EX, "2026-10-23").kind === "rest");
check(
  "2日続けたら休み",
  recommend([W("2026-10-22", [["squat", [s(null, 1)]]]), W("2026-10-21", [["pushup", [s(null, 1)]]])], EX, "2026-10-23").kind === "rest",
);
const r1 = recommend([W("2026-10-20", [["chest-press", [s(20, 10)]]])], EX, "2026-10-23");
check("上半身のあとは下半身", r1.kind === "lower" && r1.reason.includes("記録がありません"));
const r2 = recommend([W("2026-10-20", [["chest-press", [s(20, 10)]]]), W("2026-10-18", [["leg-press", [s(20, 10)]]])], EX, "2026-10-23");
check("古い方をすすめる", r2.kind === "lower" && r2.reason.includes("5日"), r2.reason);
check("お腹と有酸素は数えない", recommend([W("2026-10-20", [["abdominal", [s(20, 10)]], ["bike", [s(null, 10)]]])], EX, "2026-10-23").kind === "upper");
check("おすすめの種目は前回の同じ側", suggestedExercises(h1, EX, "upper").join() === "chest-press");
check("おすすめの種目: 記録なしは見本の順", suggestedExercises([], EX, "lower")[0] === "leg-press");
check("前回のメニュー", lastMenu(h1).join() === "chest-press,bike");

// ---- 伸び ----
const pg = progress(all, "chest-press", "weight");
check("伸びのグラフ", pg.map((p) => p.value).join() === "30,35,37.5");

// ---- 表示 ----
check("セットの表示", fmtSet(s(42.5, 8), "weight") === "42.5kg×8" && fmtSet(s(null, 30), "seconds") === "30秒");
check("差の表示", fmtDiff(2.5, "weight") === "+2.5kg" && fmtDiff(-3, "reps") === "−3回");

// ---- 書き出し ----
const csv = toCsv([W("2026-10-23", [["chest-press", [s(40, 10)]]])], [...EX, { ...EX[0], id: "x1", name: "=HYPERLINK(\"a\",1)" }]);
check("CSV の見出し", csv.startsWith("date,exercise,set,weight_kg,count,unit\n2026-10-23,チェストプレス,1,40,10,reps"));
const csv2 = toCsv([W("2026-10-23", [["x1", [s(null, 5)]]])], [...EX, { ...EX[0], id: "x1", name: "=HYPERLINK(\"a\",1)", metric: "reps" }]);
check("CSV で式が動かない", csv2.includes(`"'=HYPERLINK(""a"",1)"`), csv2);

// ---- 保存の検査 ----
const st: State = { ...freshState(), workouts: all };
check("保存して戻せる", JSON.stringify(parseState(serialize(st))) === JSON.stringify(st));
check("空は初期状態", parseState(null).exercises.length === PRESETS.length);
check("壊れた JSON は初期状態", parseState("{oops").workouts.length === 0);
check("版が違えば初期状態", parseState(JSON.stringify({ ...st, v: 1 })).workouts.length === 0);
const bad1 = JSON.parse(serialize(st));
bad1.workouts[0].items[0].sets[0].w = 9999;
check("重さの範囲外は初期状態", parseState(JSON.stringify(bad1)).workouts.length === 0);
const bad2 = JSON.parse(serialize(st));
bad2.exercises[0].name = "<img src=x onerror=alert(1)>".repeat(5);
check("長すぎる名前は初期状態", parseState(JSON.stringify(bad2)).workouts.length === 0);
const bad3 = JSON.parse(serialize(st));
bad3.workouts.push({ ...bad3.workouts[0], id: "dup" }, { ...bad3.workouts[0], id: "a1", endedAt: null }, { ...bad3.workouts[0], id: "a2", endedAt: null });
check("記録中が2つは初期状態", parseState(JSON.stringify(bad3)).workouts.length === 0);
const bad4 = JSON.parse(serialize(st));
bad4.workouts[0].items.push({ exId: "unknown", sets: [{ w: 1, r: 1 }] });
check("知らない種目の記録は捨てる", parseState(JSON.stringify(bad4)).workouts[0].items.every((i) => i.exId !== "unknown"));

// 件数の上限を超えた保存でも、記録を消さない（Codex 指摘 B11）
const many = { ...freshState(), workouts: Array.from({ length: LIMITS.workouts + 1 }, (_, i) => ({ ...W("2026-10-01", [["squat", [s(null, 10)]]]), id: `m${i}` })) };
const manyBack = parseState(serialize(many));
check("上限を超えた記録も読み込める", manyBack.workouts.length === LIMITS.workouts + 1, String(manyBack.workouts.length));
const manyEx = { ...freshState() };
for (let i = 0; manyEx.exercises.length <= LIMITS.exercises; i++) manyEx.exercises.push({ ...PRESETS[0], id: `e${i}`, name: `種目${i}`, custom: true });
check("上限を超えた種目も読み込める", parseState(serialize(manyEx)).exercises.length === manyEx.exercises.length);
check("上限を超えたバックアップも読める", parseBackup(makeBackup(many, "2026-10-23T00:00:00Z"))?.workouts.length === LIMITS.workouts + 1);

// ---- 前の版からの移行 ----
const v1ex = JSON.stringify([
  { id: "chest-press", name: "チェストプレス", kind: "machine", group: "upper", metric: "reps" },
  { id: "pushup", name: "腕立て伏せ", kind: "bodyweight", group: "upper", metric: "reps", archived: true },
  { id: "abc123", name: "ケーブルロー", kind: "machine", group: "upper", metric: "reps" },
]);
const v1wo = JSON.stringify([
  { id: "w1", date: "2026-10-01", startedAt: 1, endedAt: 2, exercises: [{ exerciseId: "chest-press", sets: [{ weight: 30, reps: 10 }] }, { exerciseId: "pushup", sets: [{ weight: null, reps: 15 }] }] },
  { id: "w2", date: "2026-10-03", startedAt: 3, endedAt: null, exercises: [{ exerciseId: "abc123", sets: [{ weight: 20, reps: 12 }] }] },
]);
const mig = migrateV1(v1ex, v1wo);
check("v1 を読める", mig !== null && mig.workouts.length === 2);
check("v1 の重さ", mig?.workouts[0].items[0].sets[0].w === 30 && mig?.workouts[0].items[1].sets[0].w === null);
check("v1 の自作種目", mig?.exercises.some((e) => e.id === "abc123" && e.custom && e.metric === "weight") === true);
check("v1 の非表示", mig?.exercises.find((e) => e.id === "pushup")?.hidden === true);
check("v1 の記録中は終わりにする", mig?.workouts.every((w) => w.endedAt !== null) === true);
check("v1 がなければ null", migrateV1(null, null) === null && migrateV1("x", "[]") === null);

// ---- バックアップ ----
const bk = makeBackup(st, "2026-10-23T00:00:00Z");
check("バックアップを読める", parseBackup(bk)?.workouts.length === all.length);
check("v1 のバックアップ", parseBackup(JSON.stringify({ app: "gym-log", version: 1, exercises: JSON.parse(v1ex), workouts: JSON.parse(v1wo) }))?.workouts.length === 2);
check("ほかのファイルは読まない", parseBackup('{"app":"warikan"}') === null && parseBackup("not json") === null);

// ---- 見本と絵 ----
const demo = demoWorkouts("2026-10-23", Date.parse("2026-10-23T12:00:00Z"));
check("見本は保存の検査を通る", checkState({ v: 2, ...freshState(), workouts: demo }) !== null);
check("見本の日付は過去", demo.every((w) => w.date < "2026-10-23"));
check("見本は種目が実在", demo.every((w) => w.items.every((i) => PRESETS.some((p) => p.id === i.exId))));
check("見本の種目すべてに絵", PRESETS.every((p) => ART_KEYS.includes(p.art)));
check("自作の種目は部位の絵", artSvg("part-leg", "leg").includes("art/part-leg.webp") && artSvg("知らない絵", "core").includes("art/part-core.webp"));

// ---- ランダム（性質）テスト ----
let rnd = 12345;
const rand = () => ((rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648);
const ri = (n: number) => Math.floor(rand() * n);
const STEPS = [0.5, 1, 2.5, 5];
let stepCases = 0;
for (let n = 0; n < 10000; n++) {
  const step = STEPS[ri(4)];
  const v = Math.round(rand() * 520 * 4) / 4;
  const dir = rand() < 0.5 ? 1 : -1;
  const r = stepValue(v, step, dir as 1 | -1, "weight", "w");
  const vc = clampValue(v, "weight", "w");
  stepCases++;
  if (r < 0 || r > LIMITS.weight) failures.push(`範囲外 ${v} ${step} ${dir} → ${r}`);
  if (r !== 0 && r !== LIMITS.weight && Math.abs(r / step - Math.round(r / step)) > 1e-9) failures.push(`刻みにそろわない ${v} ${step} → ${r}`);
  if (dir > 0 && vc < LIMITS.weight && !(r > vc)) failures.push(`＋で増えない ${v} ${step} → ${r}`);
  if (dir < 0 && vc > 0 && !(r < vc)) failures.push(`−で減らない ${v} ${step} → ${r}`);
  if (Math.abs(r - vc) > step + 1e-9) failures.push(`1刻みより大きく動いた ${v} ${step} → ${r}`);
}
for (let n = 0; n < 2000; n++) {
  const x = Math.round(rand() * 5000) / 4;
  const txt = String(x).replace(/[0-9.]/g, (c) => (c === "." ? "．" : String.fromCharCode(c.charCodeAt(0) + 0xfee0)));
  if (parseNum(txt) !== x) failures.push(`全角の読み取り ${txt}`);
}
// ランダムな記録で、まとめ・自己ベスト・保存の性質
const ids = PRESETS.map((p) => p.id);
let histCases = 0;
for (let n = 0; n < 1500; n++) {
  const ws: Workout[] = [];
  const count = 1 + ri(12);
  for (let i = 0; i < count; i++) {
    const date = addDays("2026-10-23", -ri(60));
    const items = [...new Set(Array.from({ length: 1 + ri(4) }, () => ids[ri(ids.length)]))].map((exId) => {
      const metric = PRESETS.find((p) => p.id === exId)!.metric;
      return [exId, Array.from({ length: 1 + ri(5) }, () => s(metric === "weight" ? Math.round(rand() * 400) / 4 : null, 1 + ri(30)))] as [string, SetEntry[]];
    });
    ws.push(W(date, items, Date.parse(date + "T00:00:00Z") + ri(80000000)));
  }
  histCases++;
  const t = "2026-10-23";
  const target = ws[ri(ws.length)];
  const sm = summarize(target, ws, EX);
  const itemSum = sm.items.reduce((a, i) => a + (PRESETS.find((p) => p.id === i.exId)!.metric === "weight" ? i.amount : 0), 0);
  if (Math.abs(itemSum - sm.volume) > 1e-6) failures.push(`総重量が合わない ${itemSum} ${sm.volume}`);
  if (sm.records > sm.sets) failures.push("自己ベストがセット数より多い");
  for (const id of ids.slice(0, 6)) {
    const b = bestFor(ws, id);
    const metric = PRESETS.find((p) => p.id === id)!.metric;
    if (!b) continue;
    for (const w of ws) for (const it of w.items) if (it.exId === id) for (const x of it.sets) if (isRecord(x, b, metric)) failures.push(`過去の記録が自己ベストを超える ${id}`);
    if (metric === "weight" && b.maxW !== null && !isRecord(s(b.maxW + 0.25, 1), b, metric)) failures.push("重い方が自己ベストにならない");
  }
  const sw = streakWeeks(ws, t);
  const weeks = new Set(ws.map((w) => mondayOf(w.date)));
  if (weekMarks(ws, t).some(Boolean) && sw < 1) failures.push("今週やったのに続けた週が 0");
  if (sw > weeks.size) failures.push("続けた週が多すぎる");
  const rec = recommend(ws, EX, t);
  if (!["upper", "lower", "rest"].includes(rec.kind)) failures.push("おすすめの種類");
  const back = parseState(serialize({ ...freshState(), workouts: ws }));
  if (back.workouts.length !== ws.length) failures.push("保存して戻せない");
  // 壊れた保存内容でも落ちない
  const raw = serialize({ ...freshState(), workouts: ws });
  const cut = raw.slice(0, ri(raw.length));
  try {
    const p = parseState(cut);
    if (!Array.isArray(p.workouts)) failures.push("壊れた保存で形が崩れる");
  } catch (e) {
    failures.push(`壊れた保存で落ちる ${e}`);
  }
}
check("ランダムの件数", stepCases === 10000 && histCases === 1500);

if (failures.length) {
  console.error(failures.slice(0, 20).map((f) => `  NG ${f}`).join("\n"));
  console.error(`\n${failures.length} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`${passed} checks passed（ランダム: 増減 ${stepCases} 件・全角 2,000 件・記録 ${histCases} 件）`);
