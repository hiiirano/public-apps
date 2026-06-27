// pantry-tracker コアロジックの最小ユニットテスト（外部依存なし・tsxで実行）
import { strict as assert } from "node:assert";
import type { Item, ItemDraft } from "./types";
import {
  daysUntilExpiry,
  filterItems,
  isLowStock,
  sortItems,
  summarize,
  urgencyOf,
} from "./inventory";
import { parseExtraction } from "./llm";
import { normalizeDraft } from "./storage";

let passed = 0;
function t(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ok ${name}`);
}

// 基準日は固定（端末日付に依存させない）
const TODAY = new Date(2026, 5, 27); // 2026-06-27

function mk(p: Partial<Item>): Item {
  return {
    id: p.id ?? "x",
    name: p.name ?? "item",
    qty: p.qty ?? 1,
    unit: p.unit ?? "個",
    category: p.category ?? "その他",
    location: p.location ?? "常温",
    expiry: p.expiry,
    minQty: p.minQty ?? 0,
    note: p.note,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
}

// ---- daysUntilExpiry ----
t("期限なし → null", () => {
  assert.equal(daysUntilExpiry(mk({}), TODAY), null);
});
t("不正な期限 → null", () => {
  assert.equal(daysUntilExpiry(mk({ expiry: "2026-02-31" }), TODAY), null);
});
t("今日が期限 → 0", () => {
  assert.equal(daysUntilExpiry(mk({ expiry: "2026-06-27" }), TODAY), 0);
});
t("3日後 → 3", () => {
  assert.equal(daysUntilExpiry(mk({ expiry: "2026-06-30" }), TODAY), 3);
});
t("昨日 → -1", () => {
  assert.equal(daysUntilExpiry(mk({ expiry: "2026-06-26" }), TODAY), -1);
});

// ---- urgencyOf 境界 ----
t("期限切れ", () => {
  assert.equal(urgencyOf(mk({ expiry: "2026-06-26" }), TODAY), "expired");
});
t("soon: 今日/2日後", () => {
  assert.equal(urgencyOf(mk({ expiry: "2026-06-27" }), TODAY), "soon");
  assert.equal(urgencyOf(mk({ expiry: "2026-06-29" }), TODAY), "soon");
});
t("near: 3日後/6日後", () => {
  assert.equal(urgencyOf(mk({ expiry: "2026-06-30" }), TODAY), "near");
  assert.equal(urgencyOf(mk({ expiry: "2026-07-03" }), TODAY), "near");
});
t("ok: 7日後/期限なし", () => {
  assert.equal(urgencyOf(mk({ expiry: "2026-07-04" }), TODAY), "ok");
  assert.equal(urgencyOf(mk({}), TODAY), "ok");
});

// ---- isLowStock ----
t("minQty=0 は常に低在庫でない", () => {
  assert.equal(isLowStock(mk({ qty: 0, minQty: 0 })), false);
});
t("qty<=minQty で低在庫", () => {
  assert.equal(isLowStock(mk({ qty: 1, minQty: 2 })), true);
  assert.equal(isLowStock(mk({ qty: 2, minQty: 2 })), true);
  assert.equal(isLowStock(mk({ qty: 3, minQty: 2 })), false);
});

// ---- sortItems: 緊急度 → 期限近い順 → 名前 ----
t("並べ替えは要対応が先頭", () => {
  const list = [
    mk({ id: "ok", name: "あ", expiry: "2026-12-01" }),
    mk({ id: "exp", name: "い", expiry: "2026-06-20" }),
    mk({ id: "soon", name: "う", expiry: "2026-06-28" }),
    mk({ id: "none", name: "え" }),
  ];
  const ordered = sortItems(list, TODAY).map((i) => i.id);
  assert.deepEqual(ordered, ["exp", "soon", "ok", "none"]);
});
t("元配列は破壊しない", () => {
  const list = [mk({ id: "a" }), mk({ id: "b" })];
  const copy = [...list];
  sortItems(list, TODAY);
  assert.deepEqual(list, copy);
});

// ---- filterItems ----
const fixture = [
  mk({ id: "1", name: "牛乳", category: "飲料", location: "冷蔵", expiry: "2026-06-26" }),
  mk({ id: "2", name: "醤油", category: "調味料", location: "常温" }),
  mk({ id: "3", name: "卵", category: "食品", location: "冷蔵", qty: 1, minQty: 2 }),
];
t("カテゴリで絞る", () => {
  assert.deepEqual(
    filterItems(fixture, { category: "調味料" }, TODAY).map((i) => i.id),
    ["2"],
  );
});
t("要対応のみ（期限切れ＋低在庫）", () => {
  assert.deepEqual(
    filterItems(fixture, { actionableOnly: true }, TODAY)
      .map((i) => i.id)
      .sort(),
    ["1", "3"],
  );
});
t("品名検索（大小無視）", () => {
  assert.deepEqual(
    filterItems(fixture, { query: "牛" }, TODAY).map((i) => i.id),
    ["1"],
  );
});

// ---- summarize ----
t("集計が正しい", () => {
  const s = summarize(fixture, TODAY);
  assert.equal(s.total, 3);
  assert.equal(s.expired, 1); // 牛乳
  assert.equal(s.lowStock, 1); // 卵
  assert.equal(s.byCategory["飲料"], 1);
  assert.equal(s.byLocation["冷蔵"], 2);
});

// ---- normalizeDraft 既定値補完 ----
t("欠損フィールドを既定で補完", () => {
  const d: ItemDraft = normalizeDraft({ name: " 玉ねぎ " });
  assert.equal(d.name, "玉ねぎ");
  assert.equal(d.qty, 1);
  assert.equal(d.unit, "個");
  assert.equal(d.category, "その他");
  assert.equal(d.location, "常温");
  assert.equal(d.minQty, 0);
});
t("不正カテゴリ→その他、負の数量→1", () => {
  const d = normalizeDraft({ name: "x", category: "ghost" as never, qty: -5 });
  assert.equal(d.category, "その他");
  assert.equal(d.qty, 1);
});

// ---- parseExtraction（LLM応答パース・コードフェンス許容） ----
t("コードフェンス付きJSONを抽出", () => {
  const out = parseExtraction(
    '```json\n{"items":[{"name":"牛乳","qty":2,"unit":"本","category":"飲料"}]}\n```',
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].name, "牛乳");
  assert.equal(out[0].qty, 2);
  assert.equal(out[0].category, "飲料");
});
t("name空の項目は除外", () => {
  const out = parseExtraction('{"items":[{"qty":1},{"name":"卵"}]}');
  assert.deepEqual(out.map((i) => i.name), ["卵"]);
});

console.log(`\n${passed} tests passed`);
