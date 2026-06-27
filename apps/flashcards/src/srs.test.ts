// flashcards コアロジックの最小ユニットテスト（外部依存なし・tsxで実行）
import { strict as assert } from "node:assert";
import type { Card } from "./types";
import { INITIAL_EASE } from "./types";
import {
  addDays,
  applyReview,
  buildQueue,
  initialSrs,
  isDue,
  isFresh,
  parseYmd,
  reviewState,
  summarizeDeck,
  toYmd,
} from "./srs";
import { normalizeCard, parseImport } from "./storage";
import { parseExtraction } from "./llm";

let passed = 0;
function t(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ok ${name}`);
}

const TODAY = new Date(2026, 5, 27); // 2026-06-27

function mk(p: Partial<Card>): Card {
  return {
    id: p.id ?? "x",
    deckId: p.deckId ?? "d1",
    front: p.front ?? "問",
    back: p.back ?? "答",
    repetitions: p.repetitions ?? 0,
    interval: p.interval ?? 0,
    easeFactor: p.easeFactor ?? INITIAL_EASE,
    due: p.due,
    reviews: p.reviews ?? 0,
    lastReviewed: p.lastReviewed,
    createdAt: p.createdAt ?? "2026-06-01T00:00:00.000Z",
    updatedAt: p.updatedAt ?? "2026-06-01T00:00:00.000Z",
  };
}

// ---- 日付ユーティリティ ----
t("toYmd は端末ローカルで整形", () => {
  assert.equal(toYmd(new Date(2026, 0, 5)), "2026-01-05");
});
t("parseYmd 正常", () => {
  assert.equal(parseYmd("2026-06-27")?.getFullYear(), 2026);
});
t("parseYmd ロールオーバー → null", () => {
  assert.equal(parseYmd("2026-02-31"), null);
});
t("addDays 翌日", () => {
  assert.equal(addDays(TODAY, 1), "2026-06-28");
});
t("addDays 月跨ぎ", () => {
  assert.equal(addDays(new Date(2026, 5, 30), 1), "2026-07-01");
});

// ---- SM-2 reviewState ----
t("初回 good: interval=1・rep=1・due翌日", () => {
  const s = reviewState(initialSrs(), "good", TODAY);
  assert.equal(s.interval, 1);
  assert.equal(s.repetitions, 1);
  assert.equal(s.due, "2026-06-28");
  assert.equal(s.reviews, 1);
});
t("2回目 good: interval=6", () => {
  let s = reviewState(initialSrs(), "good", TODAY);
  s = reviewState(s, "good", TODAY);
  assert.equal(s.interval, 6);
  assert.equal(s.repetitions, 2);
});
t("3回目 good: interval=round(6*EF)", () => {
  let s = reviewState(initialSrs(), "good", TODAY);
  s = reviewState(s, "good", TODAY); // interval 6, EF=2.5
  const ef = s.easeFactor;
  s = reviewState(s, "good", TODAY);
  assert.equal(s.interval, Math.round(6 * ef));
});
t("again は repetitions=0・interval=1 に戻す", () => {
  let s = reviewState(initialSrs(), "good", TODAY);
  s = reviewState(s, "good", TODAY); // rep=2 interval=6
  s = reviewState(s, "again", TODAY);
  assert.equal(s.repetitions, 0);
  assert.equal(s.interval, 1);
  assert.equal(s.due, "2026-06-28");
});
t("good は EF を変えない（quality=4）", () => {
  const s = reviewState(initialSrs(), "good", TODAY);
  assert.equal(s.easeFactor, INITIAL_EASE);
});
t("easy は EF を上げる", () => {
  const s = reviewState(initialSrs(), "easy", TODAY);
  assert.ok(s.easeFactor > INITIAL_EASE);
});
t("hard は EF を下げる", () => {
  const s = reviewState(initialSrs(), "hard", TODAY);
  assert.ok(s.easeFactor < INITIAL_EASE);
});
t("EF は下限 1.3 を割らない", () => {
  let s = initialSrs();
  for (let i = 0; i < 20; i++) s = reviewState(s, "again", TODAY);
  assert.ok(s.easeFactor >= 1.3);
});

// ---- applyReview は id 等を保持 ----
t("applyReview は front/id を保持しつつ SRS 更新", () => {
  const c = mk({ id: "keep", front: "A" });
  const r = applyReview(c, "good", TODAY);
  assert.equal(r.id, "keep");
  assert.equal(r.front, "A");
  assert.equal(r.interval, 1);
  assert.equal(r.reviews, 1);
});

// ---- isFresh / isDue ----
t("未学習カードは fresh かつ due", () => {
  const c = mk({});
  assert.equal(isFresh(c), true);
  assert.equal(isDue(c, TODAY), true);
});
t("due が未来のカードは出題対象外", () => {
  const c = mk({ reviews: 1, due: "2026-06-30" });
  assert.equal(isDue(c, TODAY), false);
});
t("due が今日のカードは出題対象", () => {
  const c = mk({ reviews: 1, due: "2026-06-27" });
  assert.equal(isDue(c, TODAY), true);
});
t("due が過去のカードは出題対象", () => {
  const c = mk({ reviews: 1, due: "2026-06-20" });
  assert.equal(isDue(c, TODAY), true);
});

// ---- buildQueue ----
t("キューは復習（due古い順）→新規（作成古い順）", () => {
  const cards = [
    mk({ id: "new2", createdAt: "2026-06-02T00:00:00Z" }),
    mk({ id: "rev_old", reviews: 1, due: "2026-06-20" }),
    mk({ id: "new1", createdAt: "2026-06-01T00:00:00Z" }),
    mk({ id: "rev_new", reviews: 1, due: "2026-06-25" }),
    mk({ id: "later", reviews: 1, due: "2026-07-01" }), // 対象外
  ];
  const q = buildQueue(cards, TODAY).map((c) => c.id);
  assert.deepEqual(q, ["rev_old", "rev_new", "new1", "new2"]);
});

// ---- summarizeDeck ----
t("summarizeDeck 集計", () => {
  const cards = [
    mk({}), // fresh
    mk({ reviews: 1, due: "2026-06-20" }), // due
    mk({ reviews: 1, due: "2026-07-10" }), // later
    mk({ reviews: 3, due: "2026-06-27" }), // due
  ];
  const s = summarizeDeck(cards, TODAY);
  assert.equal(s.total, 4);
  assert.equal(s.fresh, 1);
  assert.equal(s.learned, 3);
  assert.equal(s.due, 2);
  assert.equal(s.later, 1);
});

// ---- storage normalize / import ----
t("normalizeCard は欠損を既定で補完", () => {
  const c = normalizeCard({ id: "a", deckId: "d", front: "f", back: "b" });
  assert.equal(c.easeFactor, INITIAL_EASE);
  assert.equal(c.repetitions, 0);
  assert.equal(c.reviews, 0);
});
t("parseImport は decks/cards を取り出す", () => {
  const json = JSON.stringify({
    version: 1,
    decks: [{ id: "d1", name: "n", createdAt: "x" }],
    cards: [{ id: "c1", deckId: "d1", front: "f", back: "b" }],
  });
  const r = parseImport(json);
  assert.ok(r);
  assert.equal(r.decks.length, 1);
  assert.equal(r.cards.length, 1);
});
t("parseImport 不正JSON → null", () => {
  assert.equal(parseImport("{not json"), null);
});

// ---- LLM 抽出パース ----
t("parseExtraction は cards を取り出す", () => {
  const out = parseExtraction(
    '{"cards":[{"front":"Q1","back":"A1"},{"front":"Q2","back":"A2"}]}',
  );
  assert.equal(out.length, 2);
  assert.equal(out[0].front, "Q1");
});
t("parseExtraction はコードフェンスを許容", () => {
  const out = parseExtraction('```json\n{"cards":[{"front":"Q","back":"A"}]}\n```');
  assert.equal(out.length, 1);
});
t("parseExtraction は front/back 欠けを除外", () => {
  const out = parseExtraction(
    '{"cards":[{"front":"Q","back":"A"},{"front":"","back":"x"},{"front":"y"}]}',
  );
  assert.equal(out.length, 1);
});

console.log(`\n${passed} tests passed`);
