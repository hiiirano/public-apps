// warikan コアロジックの最小ユニットテスト（外部依存なし・tsxで実行）
import { strict as assert } from "node:assert";
import type { Expense, Group } from "./types";
import {
  computeBalances,
  minimizeSettlements,
  splitExpense,
  totalAmount,
} from "./warikan";
import { normalizeGroup } from "./storage";
import { encodeGroup, decodeGroup } from "./share";
import { parseExtraction } from "./llm";

let passed = 0;
function t(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ok ${name}`);
}

function ex(p: Partial<Expense>): Expense {
  return {
    id: p.id ?? "e1",
    title: p.title ?? "支出",
    amount: p.amount ?? 3000,
    payerId: p.payerId ?? "a",
    participantIds: p.participantIds ?? ["a", "b", "c"],
    shares: p.shares,
    createdAt: p.createdAt ?? 1000,
  };
}

function grp(members: string[], expenses: Expense[]): Group {
  return {
    id: "g1",
    name: "テスト",
    members: members.map((m) => ({ id: m, name: m.toUpperCase() })),
    expenses,
    updatedAt: 1000,
  };
}

// ---- splitExpense（均等割り・端数配分） ----
t("splitExpense: 割り切れる均等割り", () => {
  const s = splitExpense(ex({ amount: 3000, participantIds: ["a", "b", "c"] }));
  assert.deepEqual(s, { a: 1000, b: 1000, c: 1000 });
});

t("splitExpense: 端数は id 昇順で先頭から1円ずつ", () => {
  // 1000 / 3 = 333 余り1 → 先頭(a)に+1
  const s = splitExpense(ex({ amount: 1000, participantIds: ["c", "a", "b"] }));
  assert.deepEqual(s, { a: 334, b: 333, c: 333 });
  assert.equal(s.a + s.b + s.c, 1000); // 合計は必ず amount に一致
});

t("splitExpense: 余り2は先頭2人に配分", () => {
  // 1001 / 3 = 333 余り2 → a,b に+1
  const s = splitExpense(ex({ amount: 1001, participantIds: ["a", "b", "c"] }));
  assert.deepEqual(s, { a: 334, b: 334, c: 333 });
});

t("splitExpense: shares 指定はそのまま採用", () => {
  const s = splitExpense(
    ex({
      amount: 5000,
      participantIds: ["a", "b"],
      shares: { a: 2000, b: 3000 },
    }),
  );
  assert.deepEqual(s, { a: 2000, b: 3000 });
});

// ---- computeBalances ----
t("computeBalances: 1人が立替→均等割り", () => {
  const g = grp(["a", "b", "c"], [ex({ amount: 3000, payerId: "a" })]);
  const bal = computeBalances(g);
  const a = bal.find((b) => b.memberId === "a")!;
  assert.equal(a.paid, 3000);
  assert.equal(a.owed, 1000);
  assert.equal(a.net, 2000); // a は 2000 受け取る
  assert.equal(bal.find((b) => b.memberId === "b")!.net, -1000);
  // net の総和は 0
  assert.equal(bal.reduce((s, b) => s + b.net, 0), 0);
});

t("computeBalances: payer が participants に含まれない立替", () => {
  // a が 2000 立て替えたが負担は b,c のみ
  const g = grp(
    ["a", "b", "c"],
    [ex({ amount: 2000, payerId: "a", participantIds: ["b", "c"] })],
  );
  const bal = computeBalances(g);
  assert.equal(bal.find((b) => b.memberId === "a")!.net, 2000);
  assert.equal(bal.find((b) => b.memberId === "b")!.net, -1000);
  assert.equal(bal.find((b) => b.memberId === "c")!.net, -1000);
});

// ---- minimizeSettlements ----
t("minimizeSettlements: 単純な1対多", () => {
  const g = grp(["a", "b", "c"], [ex({ amount: 3000, payerId: "a" })]);
  const settle = minimizeSettlements(computeBalances(g));
  // b→a 1000, c→a 1000 の2送金
  assert.equal(settle.length, 2);
  for (const s of settle) {
    assert.equal(s.to, "a");
    assert.equal(s.amount, 1000);
  }
});

t("minimizeSettlements: 全員均等に払い合えば送金ゼロ", () => {
  const g = grp(
    ["a", "b"],
    [
      ex({ amount: 1000, payerId: "a", participantIds: ["a", "b"] }),
      ex({ amount: 1000, payerId: "b", participantIds: ["a", "b"] }),
    ],
  );
  const settle = minimizeSettlements(computeBalances(g));
  assert.equal(settle.length, 0);
});

t("minimizeSettlements: 送金回数が最小化される", () => {
  // a:+1500, b:+500, c:-1000, d:-1000 → 素朴なら最大4送金、最小化で d→a, c→a, c→b 等3以下
  const balances = [
    { memberId: "a", paid: 0, owed: 0, net: 1500 },
    { memberId: "b", paid: 0, owed: 0, net: 500 },
    { memberId: "c", paid: 0, owed: 0, net: -1000 },
    { memberId: "d", paid: 0, owed: 0, net: -1000 },
  ];
  const settle = minimizeSettlements(balances);
  // 貪欲: 最大債務者(c,1000)→最大債権者(a,1500): 1000。a残500。
  //       次 d(1000)→a(500):500, d残500→b(500):500 → 計3送金
  assert.equal(settle.length, 3);
  // 保存則: 各債権者が受け取る総額 = net
  const recvA = settle
    .filter((s) => s.to === "a")
    .reduce((s, x) => s + x.amount, 0);
  assert.equal(recvA, 1500);
  const total = settle.reduce((s, x) => s + x.amount, 0);
  assert.equal(total, 2000); // 債務総額
});

t("minimizeSettlements: 結果は決定的（同じ入力→同じ出力）", () => {
  const balances = [
    { memberId: "x", paid: 0, owed: 0, net: 600 },
    { memberId: "y", paid: 0, owed: 0, net: 600 },
    { memberId: "z", paid: 0, owed: 0, net: -1200 },
  ];
  const a = minimizeSettlements(balances.map((b) => ({ ...b })));
  const b = minimizeSettlements(balances.map((b) => ({ ...b })));
  assert.deepEqual(a, b);
});

t("totalAmount: 合計", () => {
  const g = grp(["a", "b"], [ex({ amount: 1000 }), ex({ amount: 2500 })]);
  assert.equal(totalAmount(g), 3500);
});

// ---- storage 正規化 ----
t("normalizeGroup: 欠損を補完して安全な Group を返す", () => {
  const g = normalizeGroup({ name: "旅行", members: [{ id: "a", name: "A" }] });
  assert.equal(g.name, "旅行");
  assert.ok(Array.isArray(g.expenses));
  assert.equal(g.expenses.length, 0);
  assert.ok(typeof g.id === "string" && g.id.length > 0);
});

// ---- share ラウンドトリップ ----
t("share: encode→decode で Group が復元される", () => {
  const g = grp(
    ["a", "b"],
    [ex({ amount: 4000, payerId: "a", participantIds: ["a", "b"] })],
  );
  const enc = encodeGroup(g);
  const dec = decodeGroup(enc);
  assert.ok(dec);
  assert.equal(dec!.members.length, 2);
  assert.equal(dec!.expenses[0].amount, 4000);
  // 精算結果も一致する
  assert.deepEqual(
    minimizeSettlements(computeBalances(dec!)),
    minimizeSettlements(computeBalances(g)),
  );
});

t("share: 不正な文字列は null", () => {
  assert.equal(decodeGroup("not-valid-base64-$$$"), null);
});

// ---- LLM 抽出パース ----
t("parseExtraction: 支出配列を抽出", () => {
  const json = JSON.stringify({
    expenses: [{ title: "居酒屋", amount: 12000, payer: "太郎" }],
  });
  const items = parseExtraction(json);
  assert.equal(items.length, 1);
  assert.equal(items[0].amount, 12000);
  assert.equal(items[0].title, "居酒屋");
});

t("parseExtraction: コードフェンス付きでも抽出", () => {
  const raw = "```json\n{\"expenses\":[{\"title\":\"宿\",\"amount\":30000}]}\n```";
  const items = parseExtraction(raw);
  assert.equal(items.length, 1);
  assert.equal(items[0].amount, 30000);
});

t("parseExtraction: 不正入力は空配列", () => {
  assert.deepEqual(parseExtraction("ごめん分かりません"), []);
});

console.log(`\n${passed} tests passed.`);
