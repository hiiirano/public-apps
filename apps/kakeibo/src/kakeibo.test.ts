// kakeibo コアロジックの最小ユニットテスト（外部依存なし・tsxで実行）
import { strict as assert } from "node:assert";
import type { Expense, MonthBudget } from "./types";
import {
  availableToSpend,
  budgetTotal,
  categoryStatus,
  daysElapsed,
  daysInMonth,
  expensesOfMonth,
  isMonthKey,
  monthKeyOf,
  monthOfDate,
  projectSpend,
  sortExpenses,
  sumByCategory,
  summarize,
  toCsv,
  yen,
} from "./kakeibo";
import { normalizeDraft, normalizeBudget, todayYmd } from "./storage";
import { parseExtraction } from "./llm";

let passed = 0;
function t(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ok ${name}`);
}

function ex(p: Partial<Expense>): Expense {
  return {
    id: p.id ?? "x",
    date: p.date ?? "2026-06-15",
    amount: p.amount ?? 1000,
    category: p.category ?? "必需",
    memo: p.memo,
    createdAt: p.createdAt ?? "2026-06-15T00:00:00.000Z",
  };
}

function budget(p: Partial<MonthBudget>): MonthBudget {
  return {
    month: p.month ?? "2026-06",
    income: p.income ?? 300000,
    savingsGoal: p.savingsGoal ?? 50000,
    budgets: p.budgets ?? { 必需: 150000, 娯楽: 60000, 文化: 20000, 予備: 20000 },
  };
}

// ---- 月キー/日付ユーティリティ ----
t("isMonthKey", () => {
  assert.equal(isMonthKey("2026-06"), true);
  assert.equal(isMonthKey("2026-13"), false);
  assert.equal(isMonthKey("2026-6"), false);
});
t("monthKeyOf / monthOfDate", () => {
  assert.equal(monthKeyOf(new Date(2026, 5, 30)), "2026-06");
  assert.equal(monthOfDate("2026-06-30"), "2026-06");
  assert.equal(monthOfDate("bad"), "");
});
t("daysInMonth（うるう年2月含む）", () => {
  assert.equal(daysInMonth("2026-02"), 28);
  assert.equal(daysInMonth("2024-02"), 29);
  assert.equal(daysInMonth("2026-06"), 30);
  assert.equal(daysInMonth("2026-07"), 31);
});

// ---- daysElapsed: 月の前/中/後 ----
t("daysElapsed", () => {
  assert.equal(daysElapsed("2026-06", new Date(2026, 4, 20)), 0); // 5月=前月
  assert.equal(daysElapsed("2026-06", new Date(2026, 5, 15)), 15); // 月中
  assert.equal(daysElapsed("2026-06", new Date(2026, 6, 5)), 30); // 翌月=満了
});

// ---- 予算逆算 ----
t("availableToSpend = 収入 - 貯金目標（下限0）", () => {
  assert.equal(availableToSpend(budget({ income: 300000, savingsGoal: 50000 })), 250000);
  assert.equal(availableToSpend(budget({ income: 100000, savingsGoal: 150000 })), 0);
});
t("budgetTotal", () => {
  assert.equal(budgetTotal(budget({})), 250000);
});

// ---- 集計 ----
const fixture: Expense[] = [
  ex({ id: "1", date: "2026-06-03", amount: 2000, category: "必需" }),
  ex({ id: "2", date: "2026-06-10", amount: 3000, category: "必需" }),
  ex({ id: "3", date: "2026-06-12", amount: 1500, category: "娯楽" }),
  ex({ id: "4", date: "2026-05-30", amount: 9999, category: "娯楽" }), // 別月
];
t("expensesOfMonth は対象月だけ", () => {
  assert.equal(expensesOfMonth(fixture, "2026-06").length, 3);
});
t("sumByCategory", () => {
  const s = sumByCategory(fixture, "2026-06");
  assert.equal(s.必需, 5000);
  assert.equal(s.娯楽, 1500);
  assert.equal(s.文化, 0);
});

// ---- バーンレート予測（決定的コアの見せ場） ----
t("projectSpend: 15日で5000 → 月末は10000", () => {
  // 6月=30日。15日経過で5000 → 5000/15*30 = 10000
  assert.equal(projectSpend(5000, "2026-06", new Date(2026, 5, 15)), 10000);
});
t("projectSpend: 経過0日は0", () => {
  assert.equal(projectSpend(5000, "2026-06", new Date(2026, 4, 1)), 0);
});

t("categoryStatus: ペース超過は projectedOver", () => {
  // 予算8000・15日で5000支出 → 予測10000 > 8000
  const cs = categoryStatus("必需", 8000, 5000, "2026-06", new Date(2026, 5, 15));
  assert.equal(cs.projected, 10000);
  assert.equal(cs.overBudget, false); // まだ予算内
  assert.equal(cs.projectedOver, true); // でもペースが速い
});
t("categoryStatus: 既に超過は overBudget", () => {
  const cs = categoryStatus("娯楽", 1000, 1500, "2026-06", new Date(2026, 5, 15));
  assert.equal(cs.overBudget, true);
  assert.equal(cs.remaining, -500);
});
t("categoryStatus: 予算0で支出ありは projectedOver", () => {
  const cs = categoryStatus("予備", 0, 500, "2026-06", new Date(2026, 5, 15));
  assert.equal(cs.overBudget, true);
  assert.equal(cs.projectedOver, true);
});

// ---- summarize ----
t("summarize: 貯金見込み判定", () => {
  // 収入30万・貯金目標5万。15日で計6500支出 → 月末予測13000 → 貯金見込み287000 ≥ 50000
  const sum = summarize(budget({}), fixture, new Date(2026, 5, 15));
  assert.equal(sum.available, 250000);
  assert.equal(sum.spentTotal, 6500);
  assert.equal(sum.projectedSpent, 13000);
  assert.equal(sum.projectedSavings, 300000 - 13000);
  assert.equal(sum.savingsOnTrack, true);
  assert.equal(sum.byCategory.length, 4);
});
t("summarize: 使いすぎで貯金見込みが目標割れ", () => {
  const heavy = [ex({ date: "2026-06-05", amount: 200000, category: "娯楽" })];
  // 5日で20万 → 月末予測 1,200,000。収入30万 → 貯金見込みマイナス
  const sum = summarize(budget({}), heavy, new Date(2026, 5, 5));
  assert.equal(sum.savingsOnTrack, false);
});

// ---- 並べ替え/フォーマット ----
t("sortExpenses: 日付降順・非破壊", () => {
  const list = [ex({ id: "a", date: "2026-06-01" }), ex({ id: "b", date: "2026-06-20" })];
  const copy = [...list];
  assert.deepEqual(sortExpenses(list).map((e) => e.id), ["b", "a"]);
  assert.deepEqual(list, copy);
});
t("yen 表記", () => {
  assert.equal(yen(1234), "¥1,234");
  assert.equal(yen(-500), "-¥500");
});
t("toCsv: ヘッダ＋カンマ/改行エスケープ", () => {
  const csv = toCsv([ex({ date: "2026-06-03", amount: 2000, category: "必需", memo: "a,b" })]);
  const lines = csv.split("\n");
  assert.equal(lines[0], "date,amount,category,memo");
  assert.equal(lines[1], '2026-06-03,2000,必需,"a,b"');
});

// ---- storage 正規化 ----
t("normalizeDraft: 既定補完・負金額→0", () => {
  const d = normalizeDraft({ amount: -100, category: "ghost" as never });
  assert.equal(d.amount, 0);
  assert.equal(d.category, "必需");
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(d.date));
});
t("normalizeDraft: 金額は整数丸め", () => {
  assert.equal(normalizeDraft({ amount: 1200.7, date: "2026-06-01" }).amount, 1201);
});
t("normalizeBudget: 欠損カテゴリを0補完", () => {
  const b = normalizeBudget({
    month: "2026-06",
    income: 100,
    savingsGoal: 0,
    budgets: { 必需: 50 } as never,
  });
  assert.equal(b.budgets.娯楽, 0);
  assert.equal(b.budgets.必需, 50);
});
t("todayYmd 形式", () => {
  assert.equal(todayYmd(new Date(2026, 5, 3)), "2026-06-03");
});

// ---- LLM 応答パース ----
t("parseExtraction: コードフェンス付きJSON", () => {
  const out = parseExtraction(
    '```json\n{"expenses":[{"amount":1200,"category":"必需","memo":"スーパー"}]}\n```',
    "2026-06-30",
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].amount, 1200);
  assert.equal(out[0].date, "2026-06-30"); // date 欠損→既定
});
t("parseExtraction: 金額0や不正は除外", () => {
  const out = parseExtraction('{"expenses":[{"amount":0},{"amount":500,"category":"娯楽"}]}', "2026-06-30");
  assert.deepEqual(out.map((e) => e.amount), [500]);
});

console.log(`\n${passed} tests passed`);
