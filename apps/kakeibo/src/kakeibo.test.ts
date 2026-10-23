import type { Book, CategoryId, Expense } from "./types";
import { CATEGORY_IDS, MAX_AMOUNT, MAX_EXPENSES, MEMO_MAX } from "./types";
import { addMonths, dayLabel, daysInMonth, defaultDateFor, isDateKey, isLeapYear, monthLabel, weekdayOf } from "./dates";
import { chartGeometry, computePace, niceStep, phaseOf } from "./pace";
import { addExpense, budgetFor, budgetSource, groupByDay, isFull, setBudget, totalsByCategory, emptyBook, removeExpense, updateExpense } from "./book";
import { formatYen, parseYen, yen } from "./money";
import { cleanMemo, importCsv, importFile, importJson, ImportError, mergeIncoming, parseBook, parseCsv, toBackupJson, toCsv } from "./transfer";
import { KEY, loadFrom, migrateV1, OLD_KEYS, parseStored, type KV } from "./storage";

let passed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = "") {
  if (cond) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}
function throws(fn: () => unknown): unknown {
  try {
    fn();
  } catch (e) {
    return e;
  }
  return null;
}

let n = 0;
const E = (date: string, amount: number, cat: CategoryId = "food", memo = ""): Expense => ({ id: `t${n++}`, date, amount, cat, memo, at: n });

// 再現できる乱数（mulberry32）
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20261023);
const ri = (a: number, b: number) => a + Math.floor(R() * (b - a + 1));
const pick = <T>(xs: readonly T[]) => xs[ri(0, xs.length - 1)];

// ---- 金額の読み取り ----
check("全角とカンマと円", parseYen("１２,３００円") === 12300);
check("¥ と空白", parseYen(" ¥ 980 ") === 980 && parseYen("￥1,000") === 1000);
check("空は null", parseYen("") === null && parseYen("   ") === null);
check("文字・小数・負は NaN", [parseYen("abc"), parseYen("12.5"), parseYen("-100")].every(Number.isNaN));
check("とても長い数字は上限超え", (parseYen("9".repeat(30)) as number) > MAX_AMOUNT);
check("表示", formatYen(1234567) === "1,234,567" && yen(-1200) === "−¥1,200" && yen(0) === "¥0");

// ---- 日付 ----
check("うるう年", isLeapYear(2024) && !isLeapYear(2026) && !isLeapYear(2100) && isLeapYear(2000));
check("2月の日数", daysInMonth("2024-02") === 29 && daysInMonth("2026-02") === 28 && daysInMonth("2000-02") === 29 && daysInMonth("2100-02") === 28);
check("30日・31日の月", daysInMonth("2026-04") === 30 && daysInMonth("2026-12") === 31);
check("実在しない日", !isDateKey("2026-02-29") && isDateKey("2024-02-29") && !isDateKey("2026-04-31") && !isDateKey("2026-13-01") && !isDateKey("2026-1-1"));
check("月をずらす（年をまたぐ）", addMonths("2026-12", 1) === "2027-01" && addMonths("2026-01", -1) === "2025-12" && addMonths("2026-10", -22) === "2024-12");
check("月の範囲の端", addMonths("2100-12", 1) === "2100-12" && addMonths("2000-01", -1) === "2000-01");
check("曜日", weekdayOf("2026-10-23") === 5 && weekdayOf("2024-02-29") === 4 && weekdayOf("2000-01-01") === 6);
{
  // 曜日を Date と突き合わせ（ランダム 2,000 日）
  let bad = 0;
  for (let i = 0; i < 2000; i++) {
    const y = ri(2000, 2100), m = ri(1, 12), d = ri(1, daysInMonth(`${y}-${String(m).padStart(2, "0")}`));
    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (weekdayOf(key) !== new Date(Date.UTC(y, m - 1, d)).getUTCDay()) bad++;
  }
  check("曜日（ランダム 2,000 日）", bad === 0, `${bad} 件違う`);
}
check("表示用の日付", dayLabel("2026-10-23") === "10月23日（金）" && monthLabel("2026-01") === "2026年1月");
check("書く日の初期値", defaultDateFor("2026-10", "2026-10-23") === "2026-10-23" && defaultDateFor("2026-09", "2026-10-23") === "2026-09-01");

// ---- 予算の引き継ぎ ----
{
  const b = { "2026-08": 150000, "2026-10": 0, "2026-11": 180000 };
  check("決めた月より前は予算なし", budgetFor(b, "2026-07") === null && budgetSource(b, "2026-07") === "none");
  check("その月に決めた値", budgetFor(b, "2026-08") === 150000 && budgetSource(b, "2026-08") === "this");
  check("前の月から引き継ぐ", budgetFor(b, "2026-09") === 150000 && budgetSource(b, "2026-09") === "carried");
  check("0 はその月から予算なし", budgetFor(b, "2026-10") === null && budgetSource(b, "2026-10") === "none");
  check("あとの月は新しい値", budgetFor(b, "2027-05") === 180000);
  check("予算を決める", budgetFor(setBudget(emptyBook(), "2026-10", 1000).budgets, "2026-12") === 1000);
}

// ---- 月末の見込み：境界 ----
{
  const p = computePace([], "2026-10", "2026-10-23", 150000);
  check("支出0: 見込み0・収まる", p.spent === 0 && p.projected === 0 && p.status === "ok" && p.over === -150000);
  check("支出0: 1日あたり", p.daysLeft === 9 && p.perDayLeft === Math.floor(150000 / 9));
}
{
  const p = computePace([E("2026-10-01", 3000)], "2026-10", "2026-10-01", 100000);
  check("月初（1日目）: ×31", p.elapsed === 1 && p.projected === 93000 && p.rough && p.daysLeft === 31, JSON.stringify(p.projected));
  check("月初は見込みが粗い印", p.rough);
}
{
  const p = computePace([E("2026-10-31", 3100), E("2026-10-01", 3100)], "2026-10", "2026-10-31", 6000);
  check("月末（最終日）: 見込み=合計", p.elapsed === 31 && p.projected === 6200 && p.daysLeft === 1 && !p.rough);
  check("月末: もうこえた", p.status === "already" && p.perDayLeft === 0);
}
{
  const leap = computePace([E("2024-02-10", 2900)], "2024-02", "2024-02-10", null);
  const non = computePace([E("2026-02-10", 2800)], "2026-02", "2026-02-10", null);
  check("うるう年の2月は29日で計算", leap.days === 29 && leap.projected === 8410, String(leap.projected));
  check("平年の2月は28日で計算", non.days === 28 && non.projected === 7840, String(non.projected));
  check("2月29日が最終日", computePace([], "2024-02", "2024-02-29", 1000).daysLeft === 1);
}
{
  const p = computePace([E("2026-10-01", 80000, "home"), E("2026-10-02", 2000)], "2026-10", "2026-10-02", 150000);
  check("住まいはのばさない", p.fixedSpent === 80000 && p.projected === 80000 + 31000 && p.status === "ok", String(p.projected));
}
{
  const p = computePace([E("2026-10-05", 1000), E("2026-10-28", 50000, "social")], "2026-10", "2026-10-10", 100000);
  check("今日より先の日付は予定としてそのまま", p.fixedSpent === 50000 && p.projected === 50000 + 3100);
  check("今日より先は累計に出さない", p.cumulative[9] === 1000 && p.cumulative[10] === null);
}
{
  const ex = [E("2026-09-03", 1000), E("2026-09-30", 2000), E("2026-10-01", 999)];
  const past = computePace(ex, "2026-09", "2026-10-23", 2500);
  check("過去の月: 見込み=合計・ほかの月は数えない", past.phase === "past" && past.projected === 3000 && past.spent === 3000 && past.status === "already");
  check("過去の月: 1日あたりは出さない", past.perDayLeft === null && past.daysLeft === 0);
  const fut = computePace([E("2026-12-24", 5000)], "2026-12", "2026-10-23", 10000);
  check("先の月: 書いた分だけ", fut.phase === "future" && fut.elapsed === 0 && fut.projected === 5000 && fut.cumulative.every((v) => v === null));
}
{
  const big = computePace([E("2026-10-01", MAX_AMOUNT), E("2026-10-01", MAX_AMOUNT, "home")], "2026-10", "2026-10-01", 999_999_999);
  check("大きな額でも整数・有限", Number.isSafeInteger(big.projected) && big.projected === MAX_AMOUNT * 31 + MAX_AMOUNT && big.status === "over");
}
check("予算0・null は予算なし", computePace([E("2026-10-01", 1)], "2026-10", "2026-10-01", 0).status === "none" && computePace([], "2026-10", "2026-10-01", null).perDayLeft === null);
check("ぎりぎり（9割こえ）", computePace([E("2026-10-15", 1500)], "2026-10", "2026-10-31", 1600).status === "near");
check("ちょうど予算は収まる側", computePace([E("2026-10-31", 1000)], "2026-10", "2026-10-31", 1000).status === "near" && computePace([E("2026-10-31", 1001)], "2026-10", "2026-10-31", 1000).status === "already");
check("今の月の判定", phaseOf("2026-10", "2026-10-01") === "current" && phaseOf("2026-11", "2026-10-31") === "future");

// ---- 月末の見込み：ランダム（性質）----
{
  let bad = "";
  for (let i = 0; i < 5000 && !bad; i++) {
    const y = ri(2000, 2100), m = ri(1, 12);
    const month = `${y}-${String(m).padStart(2, "0")}`;
    const days = daysInMonth(month);
    const today = `${month}-${String(ri(1, days)).padStart(2, "0")}`;
    const budget = R() < 0.2 ? null : ri(0, 3) === 0 ? ri(1, 1000) : ri(1, 999_999_999);
    const ex: Expense[] = [];
    const count = ri(0, 40);
    for (let k = 0; k < count; k++) {
      const amt = R() < 0.05 ? MAX_AMOUNT : ri(1, R() < 0.5 ? 5000 : 500000);
      // ほかの月の記録もまぜる
      const mm = R() < 0.1 ? addMonths(month, pick([-1, 1])) : month;
      ex.push(E(`${mm}-${String(ri(1, daysInMonth(mm))).padStart(2, "0")}`, amt, pick(CATEGORY_IDS)));
    }
    const p = computePace(ex, month, today, budget);
    const own = ex.filter((e) => e.date.startsWith(month));
    const sum = own.reduce((s, e) => s + e.amount, 0);
    const t = Number(today.slice(8));
    const toDate = own.filter((e) => Number(e.date.slice(8)) <= t).reduce((s, e) => s + e.amount, 0);
    if (p.spent !== sum) bad = `合計が違う ${p.spent} ${sum}`;
    else if (p.fixedSpent + p.variableSpent !== p.spent) bad = "固定+変動≠合計";
    else if (!Number.isSafeInteger(p.projected)) bad = "見込みが整数でない";
    else if (p.projected < p.spent) bad = `見込みが合計より小さい ${p.projected} < ${p.spent}`;
    else if (t === days && p.projected !== p.spent) bad = "最終日なのに見込み≠合計";
    else if (p.cumulative.length !== days) bad = "累計の長さ";
    else if (p.cumulative[t - 1] !== toDate) bad = `今日の累計 ${p.cumulative[t - 1]} ${toDate}`;
    else if (p.cumulative.some((v, j) => (j < t ? v === null || (j > 0 && v < (p.cumulative[j - 1] as number)) : v !== null))) bad = "累計が減る・今日より先に値";
    else if (p.daysLeft !== days - t + 1) bad = "残り日数";
    else if (budget && budget > 0) {
      const b = budget;
      const expect = p.spent > b ? "already" : p.projected > b ? "over" : p.projected > b * 0.9 ? "near" : "ok";
      if (p.status !== expect) bad = `判定 ${p.status} ${expect}`;
      else if (p.perDayLeft! < 0 || p.perDayLeft! * p.daysLeft > Math.max(0, b - p.spent)) bad = "1日あたりで予算をこえる";
      else if (p.over !== p.projected - b) bad = "差";
    } else if (p.status !== "none" || p.perDayLeft !== null) bad = "予算なしの判定";
    if (!bad) {
      // 単調性: 今日までの記録が1件増えると見込みは減らない
      const more = computePace([...ex, E(`${month}-01`, ri(1, 9999), "food")], month, today, budget);
      if (more.projected < p.projected) bad = "記録を足したのに見込みが減った";
      const g = chartGeometry(p, 640, 260);
      const inBox = (x: number, yy: number) => x >= 0 && x <= 640 && yy >= 0 && yy <= 260;
      const pts = [g.actual, g.projection, g.ideal].join(" ").trim().split(/\s+/).filter(Boolean).map((s) => s.split(",").map(Number));
      if (pts.some(([x, yy]) => !inBox(x, yy) || Number.isNaN(x) || Number.isNaN(yy))) bad = "グラフが枠の外";
      if (g.yMax < Math.max(p.projected, p.budget ?? 0)) bad = "グラフの上限が低い";
    }
    if (bad) bad += ` (${month} ${today} 予算${budget} 件数${count})`;
  }
  check("見込みのランダム 5,000件", !bad, bad);
}
check("目盛りの刻み", niceStep(150000) === 50000 && niceStep(1) === 0.5 && niceStep(0) === 1 && niceStep(7300) === 2000);

// ---- 集計 ----
{
  const ex = [E("2026-10-02", 500, "eatout"), E("2026-10-02", 1500, "food"), E("2026-10-05", 300, "eatout"), E("2026-10-01", 1500, "daily")];
  const t = totalsByCategory(ex);
  check("費目ごと（多い順・同額は費目の順）", t.map((x) => x.cat).join() === "food,daily,eatout" && t[2].total === 800 && t[2].count === 2);
  check("割合の合計は1", Math.abs(t.reduce((s, x) => s + x.share, 0) - 1) < 1e-9);
  const g = groupByDay(ex);
  check("日ごと（新しい日が上）", g.map((d) => d.date).join() === "2026-10-05,2026-10-02,2026-10-01" && g[1].total === 2000 && g[1].items[0].amount === 1500);
  check("空", totalsByCategory([]).length === 0 && groupByDay([]).length === 0);
  const book: Book = { expenses: ex, budgets: {} };
  check("直す・消す", updateExpense(book, ex[0].id, { amount: 9 }).expenses[0].amount === 9 && removeExpense(book, ex[0].id).expenses.length === 3 && book.expenses.length === 4);
}

// ---- 保存の検査 ----
{
  const good: Book = { expenses: [E("2026-10-01", 100, "food", "パン")], budgets: { "2026-10": 1000 } };
  check("正しい帳面を読む", JSON.stringify(parseStored(JSON.stringify(good)).book) === JSON.stringify(good));
  check("壊れた JSON は初期状態", parseStored("{oops").broken && parseStored("{oops").book.expenses.length === 0);
  check("形が違えば初期状態", parseStored('{"expenses":3}').broken && parseStored("null").broken);
  check("保存なしは空", !parseStored(null).broken);
  const mixed = { expenses: [good.expenses[0], { ...good.expenses[0] }, { id: "x", date: "2026-02-30", amount: 1, cat: "food", memo: "", at: 1 }, { id: "y", date: "2026-10-01", amount: 0, cat: "food", memo: "", at: 1 }, { id: "z", date: "2026-10-01", amount: 1.5, cat: "food", memo: "", at: 1 }, { id: "w", date: "2026-10-01", amount: 5, cat: "pet", memo: "", at: 1 }, { id: "<b>", date: "2026-10-01", amount: 5, cat: "food", memo: "", at: 1 }, { id: "v", date: "2026-10-01", amount: MAX_AMOUNT + 1, cat: "food", memo: "", at: 1 }, { id: "u", date: "2026-10-01", amount: 5, cat: "food", memo: "a".repeat(MEMO_MAX + 1), at: 1 }], budgets: { "2026-10": -5, "1999-01": 5, x: 1, "2026-11": 2000 } };
  const r = parseBook(mixed)!;
  check("不正な行だけ捨てる（重複id・実在しない日・0円・小数・知らない費目・危ないid・上限超え・長すぎるメモ）", r.book.expenses.length === 1 && r.dropped === 8, `${r.book.expenses.length} ${r.dropped}`);
  check("不正な予算は捨てる", JSON.stringify(r.book.budgets) === '{"2026-11":2000}');
  check("メモの整え", cleanMemo(" a\nb\tc ") === "a b c" && [...cleanMemo("😀".repeat(50))].length === MEMO_MAX && cleanMemo(3) === "");
}
{
  const v1e = JSON.stringify([{ id: "ex_1", date: "2026-09-01", amount: 1200, category: "娯楽", memo: "映画", createdAt: "2026-09-01T00:00:00Z" }, { id: "ex_2", date: "bad", amount: 1, category: "必需" }]);
  const v1b = JSON.stringify({ "2026-09": { month: "2026-09", income: 300000, savingsGoal: 50000, budgets: { 必需: 1 } }, "2026-10": { month: "2026-10", income: 0, savingsGoal: 0, budgets: { 必需: 1000, 娯楽: 500, 文化: 0, 予備: 0 } } });
  const b = migrateV1(v1e, v1b)!;
  check("前の版から引き継ぐ（4分類はメモに）", b.expenses.length === 1 && b.expenses[0].cat === "other" && b.expenses[0].memo === "[娯楽] 映画");
  check("前の版の予算", b.budgets["2026-09"] === 250000 && b.budgets["2026-10"] === 1500);
  check("前の版がなければ null", migrateV1(null, null) === null);
}

// ---- 書き出し・読み込み ----
let idn = 0;
const nid = () => `n${idn++}`;
{
  const book: Book = { expenses: [E("2026-10-02", 1200, "eatout", 'ランチ, "大盛り"'), E("2026-10-01", 80000, "home", "=SUM(A1)"), E("2026-10-01", 300, "other", "改\n行")], budgets: { "2026-10": 150000 } };
  book.expenses[2].memo = cleanMemo(book.expenses[2].memo);
  const csv = toCsv(book.expenses);
  check("CSV の見出し", csv.startsWith("日付,金額,費目,メモ,id\r\n"));
  check("CSV は古い順・費目は日本語", csv.split("\r\n")[1].startsWith("2026-10-01,80000,住まい,"));
  check("CSV の式よけ", csv.includes("'=SUM(A1)"));
  const back = importCsv(csv, nid, 0);
  check("CSV を往復しても同じ", back.bad === 0 && back.expenses.length === 3 && back.expenses.every(({ e, hadId }) => hadId && book.expenses.some((o) => o.id === e.id && o.date === e.date && o.amount === e.amount && o.cat === e.cat && o.memo === e.memo)), JSON.stringify(back.expenses.map((x) => x.e.memo)));
  const json = toBackupJson(book, "2026-10-23T00:00:00Z");
  const jb = importJson(json, nid);
  check("JSON を往復しても同じ", jb.expenses.length === 3 && jb.budgets["2026-10"] === 150000);
  const m1 = mergeIncoming(emptyBook(), jb);
  const m2 = mergeIncoming(m1.book, jb);
  check("新しい端末に読み込む", m1.added === 3 && m1.same === 0 && m1.book.budgets["2026-10"] === 150000);
  check("同じファイルを2回読んでも増えない", m2.added === 0 && m2.same === 3 && m2.book.expenses.length === 3);
  check("ファイルの種類の見分け", importFile("a.json", json, nid, 0).expenses.length === 3 && importFile("a.csv", csv, nid, 0).expenses.length === 3 && importFile("x.txt", json, nid, 0).expenses.length === 3);
}
{
  const other = "﻿日付,金額,費目,メモ\r\n2026/10/3,\"1,200\",外食,カフェ\r\n2026/10/3,\"1,200\",外食,カフェ\r\n2026-10-04,500,ペット,えさ\r\n2026-02-30,500,食費,\r\n2026-10-05,abc,食費,\r\n2026-10-06,０,食費,\r\n";
  const inc = importCsv(other, nid, 0);
  check("よその CSV（/区切り・カンマ入り金額・知らない費目）", inc.expenses.length === 3 && inc.bad === 3 && inc.expenses[0].e.date === "2026-10-03" && inc.expenses[0].e.amount === 1200 && inc.expenses[2].e.cat === "other" && inc.expenses[2].e.memo === "[ペット] えさ");
  const base: Book = { expenses: [{ id: "a", date: "2026-10-03", amount: 1200, cat: "eatout", memo: "カフェ", at: 0 }], budgets: {} };
  const m = mergeIncoming(base, inc);
  check("id のない行は中身が同じならとばす（ファイル内の同じ行は残す）", m.same === 2 && m.added === 1, `${m.same} ${m.added}`);
  const oldCsv = "date,amount,category,memo\n2026-09-01,100,必需,米\n";
  check("前の版の CSV", importCsv(oldCsv, nid, 0).expenses[0].e.memo === "[必需] 米");
  check("見出しがない CSV はエラー", throws(() => importCsv("a,b\n1,2", nid, 0)) instanceof ImportError);
  check("空の CSV はエラー", throws(() => importCsv("﻿\r\n", nid, 0)) instanceof ImportError);
  check("壊れた JSON はエラー", throws(() => importJson("{", nid)) instanceof ImportError && throws(() => importJson('{"a":1}', nid)) instanceof ImportError);
  const oldJson = JSON.stringify({ expenses: [{ id: "ex_9", date: "2026-08-08", amount: 700, category: "文化", memo: "本", createdAt: "x" }], budgets: { "2026-08": { month: "2026-08", income: 200000, savingsGoal: 20000, budgets: {} } } });
  const oj = importJson(oldJson, nid);
  check("前の版の JSON バックアップ", oj.expenses[0].e.memo === "[文化] 本" && oj.budgets["2026-08"] === 180000);
  check("CSV のくくりと改行", JSON.stringify(parseCsv('a,"b\n""c""",d\r\n\r\ne')) === JSON.stringify([["a", 'b\n"c"', "d"], ["e"]]));
}
{
  // ランダム往復: 書き出して読み込むと、同じ帳面になる
  let bad = "";
  const chars = ["a", "あ", "漢", ",", '"', "\n", " ", "=", "-", "😀", "'", "\r"];
  for (let i = 0; i < 300 && !bad; i++) {
    const ex: Expense[] = [];
    for (let k = 0; k < ri(0, 20); k++) {
      const memo = cleanMemo(Array.from({ length: ri(0, 45) }, () => pick(chars)).join(""));
      ex.push(E(`20${ri(10, 40)}-${String(ri(1, 12)).padStart(2, "0")}-${String(ri(1, 28)).padStart(2, "0")}`, ri(1, MAX_AMOUNT), pick(CATEGORY_IDS), memo));
    }
    const book: Book = { expenses: ex, budgets: {} };
    const viaCsv = mergeIncoming(emptyBook(), importCsv(toCsv(ex), nid, 0)).book.expenses;
    const viaJson = mergeIncoming(emptyBook(), importJson(toBackupJson(book, ""), nid)).book.expenses;
    const key = (xs: Expense[]) => xs.map((e) => `${e.id}|${e.date}|${e.amount}|${e.cat}|${e.memo}`).sort().join("\n");
    if (key(viaCsv) !== key(ex)) bad = `CSV 往復で違う: ${JSON.stringify(ex.map((e) => e.memo))}`;
    else if (key(viaJson) !== key(ex)) bad = "JSON 往復で違う";
  }
  check("書き出し→読み込みのランダム 300 回", !bad, bad);
}

// ---- 件数の上限（Codex 指摘 1）----
{
  const many: Expense[] = Array.from({ length: MAX_EXPENSES }, (_, i) => ({ id: `m${i}`, date: "2026-10-01", amount: 1, cat: "food" as CategoryId, memo: "", at: i }));
  const full: Book = { expenses: many, budgets: {} };
  check("上限に達したら書けない（null を返す）", isFull(full) && addExpense(full, E("2026-10-02", 5)) === null);
  const one: Book = { expenses: many.slice(1), budgets: {} };
  check("上限の1件手前までは書ける", !isFull(one) && addExpense(one, E("2026-10-02", 5))!.expenses.length === MAX_EXPENSES);
  const over = { expenses: [...many, E("2026-10-02", 7), E("2026-10-03", 8)], budgets: {} };
  const r = parseBook(JSON.parse(JSON.stringify(over)))!;
  check("保存済みの上限超えは捨てずに読む", r.book.expenses.length === MAX_EXPENSES + 2 && r.dropped === 0);
  const m = mergeIncoming(one, { expenses: [E("2026-11-01", 1), E("2026-11-02", 2), E("2026-11-03", 3)].map((e) => ({ e, hadId: true })), budgets: {}, bad: 0 });
  check("読み込みも上限まで・入らない数を返す", m.added === 1 && m.full === 2 && m.book.expenses.length === MAX_EXPENSES);
}

// ---- 前の版の引き継ぎで保存に失敗しても消さない（Codex 指摘 2）----
{
  const fakeKV = (init: Record<string, string>, failSet: boolean) => {
    const m = new Map(Object.entries(init));
    const kv: KV = {
      getItem: (k) => (m.has(k) ? m.get(k)! : null),
      setItem: (k, v) => {
        if (failSet) throw new Error("QuotaExceededError");
        m.set(k, v);
      },
      removeItem: (k) => void m.delete(k),
    };
    return { kv, m };
  };
  const v1 = { [OLD_KEYS.expenses]: JSON.stringify([{ id: "ex_1", date: "2026-10-02", amount: 980, category: "娯楽", memo: "映画" }]), [OLD_KEYS.budgets]: "{}", [OLD_KEYS.llm]: '{"apiKey":"sk"}' };
  const a = fakeKV(v1, true);
  const ra = loadFrom(a.kv);
  check("保存に失敗しても引き継いだ帳面を返す", ra.migrated && ra.book.expenses.length === 1 && ra.book.expenses[0].memo === "[娯楽] 映画");
  check("保存に失敗したら前の版のデータは残す・API キーは消す", a.m.has(OLD_KEYS.expenses) && !a.m.has(KEY) && !a.m.has(OLD_KEYS.llm));
  const b = fakeKV(v1, false);
  const rb = loadFrom(b.kv);
  check("保存できたら新しいキーへ移し前の版を消す", rb.migrated && b.m.has(KEY) && !b.m.has(OLD_KEYS.expenses) && !b.m.has(OLD_KEYS.budgets));
  const c = fakeKV({ [KEY]: "{broken" }, true);
  const rc = loadFrom(c.kv);
  check("壊れた保存の控えが書けなくても落ちない", rc.broken && rc.book.expenses.length === 0);
  const throwing: KV = { getItem: () => { throw new Error("blocked"); }, setItem: () => {}, removeItem: () => {} };
  check("読めない環境は初期状態", loadFrom(throwing).book.expenses.length === 0);
}

console.log(`${passed} / ${passed + failures.length} 合格`);
for (const f of failures) console.log("  NG", f);
if (failures.length) process.exit(1);
