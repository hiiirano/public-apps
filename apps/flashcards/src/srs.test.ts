// 暗記カード — 純関数の単体テストとランダム（性質）テスト。`npm test`（tsx）で動く
import { strict as assert } from "node:assert";
import { type Card, type Grade, GRADES, INITIAL_EASE, MAX_DECKS, MAX_EASE, MAX_INTERVAL, MIN_EASE, type SrsState } from "./types";
import {
  addDays,
  addStudyDay,
  answerSession,
  applyReview,
  buildQueue,
  daysBetween,
  initialSrs,
  intervalLabel,
  isDueReview,
  isFresh,
  nextInterval,
  parseYmd,
  reviewState,
  startSession,
  streak,
  summarize,
  toYmd,
} from "./srs";
import { dedupe, parsePairs, toTsv } from "./parse";
import { emptyData, exportJson, makeCard, makeDeck, mergeData, migrateV1, parseData, SAFE_ID, validCard, validDeck } from "./storage";
import { SAMPLES } from "./samples";

let passed = 0;
let failed = 0;
function t(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.log(`  NG ${name}\n     ${(e as Error).message.split("\n").join("\n     ")}`);
  }
}

// 再現できる乱数（mulberry32）
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20261023);
const ri = (min: number, max: number) => min + Math.floor(R() * (max - min + 1));
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(R() * xs.length)];

const TODAY = new Date(2026, 9, 23, 15, 30); // 2026-10-23 15:30

function mk(p: Partial<Card> = {}): Card {
  return {
    id: p.id ?? "c1",
    deckId: p.deckId ?? "d1",
    front: p.front ?? "apple",
    back: p.back ?? "りんご",
    repetitions: 0,
    interval: 0,
    easeFactor: INITIAL_EASE,
    reviews: 0,
    lapses: 0,
    createdAt: "2026-10-01T00:00:00.000Z",
    ...p,
  };
}

// ================= 日付 =================
t("toYmd は端末の暦日で0埋め", () => assert.equal(toYmd(new Date(2026, 0, 5, 23, 59)), "2026-01-05"));
t("parseYmd 正しい日", () => assert.equal(parseYmd("2026-10-23")?.getDate(), 23));
t("parseYmd ない日（2/31・13月・0日）は null", () => {
  for (const s of ["2026-02-31", "2026-13-01", "2026-00-10", "2026-10-00", "2025-02-29"]) assert.equal(parseYmd(s), null, s);
});
t("parseYmd うるう日は読める", () => assert.ok(parseYmd("2028-02-29")));
t("parseYmd 形が違えば null", () => {
  for (const s of ["", "2026/10/23", "2026-1-1", " 2026-10-23", "2026-10-23x", "abcd-ef-gh"]) assert.equal(parseYmd(s), null, s);
});
t("addDays 月末・年末・うるう年をまたぐ", () => {
  assert.equal(addDays(new Date(2026, 9, 31), 1), "2026-11-01");
  assert.equal(addDays(new Date(2026, 11, 31), 1), "2027-01-01");
  assert.equal(addDays(new Date(2028, 1, 28), 1), "2028-02-29");
  assert.equal(addDays(new Date(2027, 1, 28), 1), "2027-03-01");
  assert.equal(addDays(TODAY, 0), "2026-10-23");
});
t("addDays 10年後も暦日で正しい", () => assert.equal(addDays(TODAY, MAX_INTERVAL), toYmd(new Date(2026, 9, 23 + MAX_INTERVAL))));
t("daysBetween", () => {
  assert.equal(daysBetween("2026-10-23", "2026-10-24"), 1);
  assert.equal(daysBetween("2026-12-31", "2027-01-01"), 1);
  assert.equal(daysBetween("2026-10-24", "2026-10-23"), -1);
  assert.equal(daysBetween("2026-03-01", "2026-03-31"), 30);
  assert.equal(daysBetween("x", "2026-03-31"), 0);
});

// ================= 間隔の計算（境界） =================
t("初めて: わからない=1・むずかしい=1・わかった=2・かんたん=4", () => {
  const s = initialSrs();
  assert.deepEqual(GRADES.map((g) => nextInterval(s, g)), [1, 1, 2, 4]);
});
t("2回目: わからない=1・むずかしい=3・わかった=6・かんたん=10", () => {
  const s = reviewState(initialSrs(), "good", TODAY);
  assert.deepEqual(GRADES.map((g) => nextInterval(s, g)), [1, 3, 6, 10]);
});
t("3回目以降 わかった = 前の間隔 × 覚えやすさ", () => {
  const s: SrsState = { ...initialSrs(), repetitions: 2, interval: 6, easeFactor: 2.5, reviews: 2, due: "2026-10-23" };
  assert.equal(nextInterval(s, "good"), 15);
  assert.equal(nextInterval(s, "hard"), 7);
  assert.equal(nextInterval(s, "easy"), Math.round(6 * 2.5 * 1.3));
});
t("覚えやすさが下限 1.3 でも、思い出せたら必ず1日以上のびる", () => {
  const s: SrsState = { ...initialSrs(), repetitions: 5, interval: 1, easeFactor: MIN_EASE, reviews: 9, due: "2026-10-23" };
  assert.equal(nextInterval(s, "hard"), 2);
  assert.equal(nextInterval(s, "good"), 2);
  assert.equal(nextInterval(s, "easy"), 3);
});
t("間隔は10年で止まる", () => {
  const s: SrsState = { ...initialSrs(), repetitions: 30, interval: MAX_INTERVAL, easeFactor: MAX_EASE, reviews: 40, due: "2036-10-23" };
  for (const g of ["hard", "good", "easy"] as Grade[]) assert.equal(nextInterval(s, g), MAX_INTERVAL);
});
t("覚えやすさが壊れた値（NaN・範囲外）でも計算できる", () => {
  for (const e of [NaN, Infinity, -5, 0, 99]) {
    const s: SrsState = { ...initialSrs(), repetitions: 3, interval: 10, easeFactor: e, reviews: 3, due: "2026-10-23" };
    const n = reviewState(s, "good", TODAY);
    assert.ok(Number.isInteger(n.interval) && n.interval >= 11 && n.interval <= 30, `${e} → ${n.interval}`);
    assert.ok(n.easeFactor >= MIN_EASE && n.easeFactor <= MAX_EASE);
  }
});
t("わからない: 続けた回数0・あした・わからない回数+1", () => {
  let s = reviewState(initialSrs(), "good", TODAY);
  s = reviewState(s, "good", TODAY);
  s = reviewState(s, "again", TODAY);
  assert.equal(s.repetitions, 0);
  assert.equal(s.interval, 1);
  assert.equal(s.due, "2026-10-24");
  assert.equal(s.lapses, 1);
  assert.equal(s.reviews, 3);
});
t("覚えやすさの変化: わからない -0.32 / むずかしい -0.14 / わかった ±0 / かんたん +0.1", () => {
  const base = { ...initialSrs(), easeFactor: 2.0 };
  assert.equal(reviewState(base, "again", TODAY).easeFactor, 1.68);
  assert.equal(reviewState(base, "hard", TODAY).easeFactor, 1.86);
  assert.equal(reviewState(base, "good", TODAY).easeFactor, 2.0);
  assert.equal(reviewState(base, "easy", TODAY).easeFactor, 2.1);
});
t("覚えやすさは 1.3〜3.0 におさまる", () => {
  let s = initialSrs();
  for (let i = 0; i < 20; i++) s = reviewState(s, "again", TODAY);
  assert.equal(s.easeFactor, MIN_EASE);
  for (let i = 0; i < 40; i++) s = reviewState(s, "easy", TODAY);
  assert.equal(s.easeFactor, MAX_EASE);
});
t("初めてめくった日（introduced）は最初の1回だけ入る", () => {
  const a = reviewState(initialSrs(), "good", TODAY);
  assert.equal(a.introduced, "2026-10-23");
  const b = reviewState(a, "good", new Date(2026, 9, 25));
  assert.equal(b.introduced, "2026-10-23");
  assert.equal(b.lastReviewed, "2026-10-25");
});
t("時刻が夜遅くでも、次の日は暦日で数える", () => {
  assert.equal(reviewState(initialSrs(), "good", new Date(2026, 9, 23, 23, 59, 59)).due, "2026-10-25");
  assert.equal(reviewState(initialSrs(), "good", new Date(2026, 9, 24, 0, 0, 1)).due, "2026-10-26");
});
t("applyReview は id・表・裏を変えず、元のカードも変えない", () => {
  const c = mk();
  const before = JSON.stringify(c);
  const n = applyReview(c, "easy", TODAY);
  assert.equal(JSON.stringify(c), before);
  assert.equal(n.id, c.id);
  assert.equal(n.front, c.front);
  assert.equal(n.due, "2026-10-27");
});
t("intervalLabel", () => {
  assert.deepEqual([1, 2, 3, 29, 30, 45, 364, 365, 3650].map(intervalLabel), ["あした", "あさって", "3日後", "29日後", "1か月後", "2か月後", "12か月後", "1年後", "10年後"]);
});

// ================= 今日めくるカード =================
t("新しいカード・今日・昨日のカードは出る。明日のは出ない", () => {
  const cards = [
    mk({ id: "new" }),
    mk({ id: "today", reviews: 1, repetitions: 1, interval: 1, due: "2026-10-23" }),
    mk({ id: "past", reviews: 3, repetitions: 2, interval: 6, due: "2026-10-01" }),
    mk({ id: "tomorrow", reviews: 1, repetitions: 1, interval: 1, due: "2026-10-24" }),
  ];
  assert.deepEqual(buildQueue(cards, TODAY, 20).map((c) => c.id), ["past", "today", "new"]);
});
t("新しいカードは1日 n 枚まで。今日すでにめくった分も数える", () => {
  const fresh = Array.from({ length: 30 }, (_, i) => mk({ id: `n${i}`, createdAt: `2026-10-01T00:00:${String(i).padStart(2, "0")}.000Z` }));
  assert.equal(buildQueue(fresh, TODAY, 20).length, 20);
  assert.equal(buildQueue(fresh, TODAY, 20)[0].id, "n0");
  const learned = Array.from({ length: 15 }, (_, i) => mk({ id: `l${i}`, reviews: 1, repetitions: 1, interval: 1, due: "2026-10-24", introduced: "2026-10-23" }));
  assert.equal(buildQueue([...fresh, ...learned], TODAY, 20).length, 5);
  const more = Array.from({ length: 25 }, (_, i) => mk({ id: `m${i}`, reviews: 1, repetitions: 1, interval: 1, due: "2026-10-24", introduced: "2026-10-23" }));
  assert.equal(buildQueue([...fresh, ...more], TODAY, 20).length, 0);
});
t("新しいカード 0 枚・カード 0 枚でも動く", () => {
  assert.deepEqual(buildQueue([], TODAY, 20), []);
  assert.deepEqual(buildQueue([mk()], TODAY, 0), []);
});
t("復習は日が古い順、同じ日なら入れた順", () => {
  const cards = [
    mk({ id: "b", reviews: 1, due: "2026-10-20", createdAt: "2026-10-02T00:00:00.000Z" }),
    mk({ id: "a", reviews: 1, due: "2026-10-20", createdAt: "2026-10-01T00:00:00.000Z" }),
    mk({ id: "z", reviews: 1, due: "2026-10-10" }),
  ];
  assert.deepEqual(buildQueue(cards, TODAY, 20).map((c) => c.id), ["z", "a", "b"]);
});
t("summarize の数", () => {
  const cards = [
    mk({ id: "1" }),
    mk({ id: "2" }),
    mk({ id: "3", reviews: 4, repetitions: 3, due: "2026-10-23", introduced: "2026-10-01" }),
    mk({ id: "4", reviews: 1, repetitions: 1, due: "2026-11-01", introduced: "2026-10-23" }),
  ];
  assert.deepEqual(summarize(cards, TODAY, 2), { total: 4, fresh: 2, due: 1, today: 2, learned: 2, mastered: 1 });
  assert.equal(summarize(cards, TODAY, 20).today, 3);
});

// ================= めくっている最中 =================
t("答えると先頭が進み、数が記録される", () => {
  let s = startSession(["a", "b", "c"]);
  s = answerSession(s, "good");
  assert.deepEqual(s.queue, ["b", "c"]);
  assert.equal(s.done, 1);
  assert.equal(s.counts.good, 1);
});
t("「わからない」は3枚あとにもう一度。残りが少なければ最後", () => {
  let s = startSession(["a", "b", "c", "d", "e"]);
  s = answerSession(s, "again");
  assert.deepEqual(s.queue, ["b", "c", "d", "a", "e"]);
  let t2 = startSession(["a", "b"]);
  t2 = answerSession(t2, "again");
  assert.deepEqual(t2.queue, ["b", "a"]);
  let t3 = startSession(["a"]);
  t3 = answerSession(t3, "again");
  assert.deepEqual(t3.queue, ["a"]);
});
t("空のときに答えても変わらない", () => {
  const s = startSession([]);
  assert.equal(answerSession(s, "good"), s);
});

// ================= つづけた日数 =================
t("streak: 今日まで・昨日まで・途切れ", () => {
  assert.equal(streak([], TODAY), 0);
  assert.equal(streak(["2026-10-21", "2026-10-22", "2026-10-23"], TODAY), 3);
  assert.equal(streak(["2026-10-21", "2026-10-22"], TODAY), 2);
  assert.equal(streak(["2026-10-20", "2026-10-21"], TODAY), 0);
  assert.equal(streak(["2026-12-31", "2027-01-01"], new Date(2027, 0, 1)), 2);
});
t("addStudyDay: 重複なし・古い順・上限", () => {
  assert.deepEqual(addStudyDay(["2026-10-23"], TODAY, 10), ["2026-10-23"]);
  assert.deepEqual(addStudyDay(["2026-10-25", "2026-10-01"], TODAY, 10), ["2026-10-01", "2026-10-23", "2026-10-25"]);
  assert.deepEqual(addStudyDay(["2026-10-21", "2026-10-22"], TODAY, 2), ["2026-10-22", "2026-10-23"]);
});

// ================= 貼り付け =================
t("タブ・カンマ・全角カンマで分ける", () => {
  const r = parsePairs("apple\tりんご\nlibrary,図書館\n北海道，札幌市");
  assert.deepEqual(r.pairs, [
    { front: "apple", back: "りんご" },
    { front: "library", back: "図書館" },
    { front: "北海道", back: "札幌市" },
  ]);
  assert.equal(r.problems.length, 0);
});
t("タブがあればタブ優先・3列目は使わない", () => {
  assert.deepEqual(parsePairs("a,b\tc\td").pairs, [{ front: "a,b", back: "c" }]);
});
t("カンマは最初の1つで分け、残りは裏", () => {
  assert.deepEqual(parsePairs("1192,鎌倉幕府, 諸説あり").pairs, [{ front: "1192", back: "鎌倉幕府, 諸説あり" }]);
});
t("引用符で囲んだ表（中にカンマ）", () => {
  assert.deepEqual(parsePairs('"a, b","c ""d"""').pairs, [{ front: "a, b", back: 'c "d"' }]);
});
t("区切りなしは2行で1枚、空行で組み直す", () => {
  const r = parsePairs("北海道\n札幌市\n\n青森県\n青森市\n岩手県\n盛岡市");
  assert.equal(r.pairs.length, 3);
  assert.deepEqual(r.pairs[2], { front: "岩手県", back: "盛岡市" });
  const r2 = parsePairs("ひとつだけ\n\n東京都\n新宿区");
  assert.deepEqual(r2.problems.map((p) => [p.line, p.reason]), [[1, "no-back"]]);
  assert.equal(r2.pairs.length, 1);
});
t("区切りなしの1行のあとに区切りのある行が来たら、1行のほうを知らせる", () => {
  const r = parsePairs("ひとつだけ\napple,りんご\ndog\n犬");
  assert.deepEqual(r.pairs, [{ front: "apple", back: "りんご" }, { front: "dog", back: "犬" }]);
  assert.deepEqual(r.problems.map((p) => [p.line, p.reason]), [[1, "no-back"]]);
});
t("最後の行が1行だけ余れば知らせる", () => {
  const r = parsePairs("a\nb\nc");
  assert.equal(r.pairs.length, 1);
  assert.deepEqual(r.problems.map((p) => [p.line, p.reason]), [[3, "no-back"]]);
});
t("表か裏が空・長すぎる行を知らせる", () => {
  const r = parsePairs(`apple,\n,りんご\nx\t\n${"あ".repeat(301)},a\nok,ok`);
  assert.deepEqual(r.problems.map((p) => p.reason), ["empty", "empty", "empty", "too-long"]);
  assert.deepEqual(r.pairs, [{ front: "ok", back: "ok" }]);
});
t("Windows の改行・前後の空白・空文字", () => {
  assert.deepEqual(parsePairs("  a , b  \r\n\r\n c,d ").pairs, [{ front: "a", back: "b" }, { front: "c", back: "d" }]);
  assert.deepEqual(parsePairs(""), { pairs: [], problems: [] });
  assert.deepEqual(parsePairs("\n\n  \n"), { pairs: [], problems: [] });
});
t("dedupe: すでにあるもの・貼り付けの中の重なりを除く", () => {
  const r = dedupe([{ front: "a", back: "1" }, { front: "a", back: "1" }, { front: "a", back: "2" }, { front: "b", back: "1" }], [{ front: "b", back: "1" }]);
  assert.deepEqual(r.fresh, [{ front: "a", back: "1" }, { front: "a", back: "2" }]);
  assert.equal(r.skipped, 2);
});
t("toTsv → parsePairs で元に戻る（改行・タブは空白に）", () => {
  const src = [{ front: "a\nb", back: "c\td" }, { front: "x", back: "y,z" }];
  assert.deepEqual(parsePairs(toTsv(src)).pairs, [{ front: "a b", back: "c d" }, { front: "x", back: "y,z" }]);
});

// ================= 保存・書き出し・読み込み =================
function sampleData() {
  const d = emptyData();
  const deck = makeDeck("英単語");
  const cards = [makeCard(deck.id, { front: "apple", back: "りんご" }, 0), makeCard(deck.id, { front: "dog", back: "犬" }, 1)];
  cards[1] = applyReview(cards[1], "good", TODAY);
  return { ...d, decks: [deck], cards, days: ["2026-10-23"] };
}
t("書き出し → 読み込みで同じ内容に戻る", () => {
  const d = sampleData();
  const r = parseData(exportJson(d))!;
  assert.deepEqual(r.data, d);
  assert.equal(r.dropped, 0);
});
t("全体の形が違えば null（JSON でない・版が違う・配列でない）", () => {
  for (const raw of ["", "{", "null", "[]", '{"version":1,"decks":[],"cards":[]}', '{"version":2,"decks":{},"cards":[]}', '"x"']) assert.equal(parseData(raw), null, raw);
  assert.equal(parseData(null), null);
});
t("壊れたカード・単語帳のないカード・同じ id は除く", () => {
  const d = sampleData();
  const bad = [
    { ...d.cards[0], id: "x1", front: "" },
    { ...d.cards[0], id: "x2", easeFactor: 9 },
    { ...d.cards[0], id: "x3", due: "2026-02-31", reviews: 1 },
    { ...d.cards[0], id: "x4", deckId: "nai" },
    { ...d.cards[0], id: "x5", interval: 1.5 },
    { ...d.cards[0], id: "x6", reviews: 0, due: "2026-10-23" },
    { ...d.cards[0], id: "x7", front: "<img src=x onerror=alert(1)>".repeat(40) },
    d.cards[0],
  ];
  const r = parseData(JSON.stringify({ ...d, cards: [...d.cards, ...bad] }))!;
  assert.equal(r.data.cards.length, 2);
  assert.equal(r.dropped, bad.length);
});
t("使えない文字の id（引用符・タグ）は振り直し、カードもついていく", () => {
  const d = sampleData();
  const evil = `x" onmouseover="alert(1)`;
  const evilCard = `<img src=x onerror=alert(1)>`;
  const raw = JSON.stringify({ ...d, decks: [{ ...d.decks[0], id: evil }], cards: [{ ...d.cards[0], id: evilCard, deckId: evil }, { ...d.cards[1], deckId: evil }] });
  const r = parseData(raw)!;
  assert.equal(r.data.decks.length, 1);
  assert.equal(r.data.cards.length, 2);
  for (const x of [...r.data.decks.map((x) => x.id), ...r.data.cards.map((x) => x.id), ...r.data.cards.map((x) => x.deckId)]) assert.match(x, SAFE_ID);
  assert.ok(r.data.cards.every((c) => c.deckId === r.data.decks[0].id));
  assert.ok(r.data.cards.every(validCard) && r.data.decks.every(validDeck));
  assert.ok(!validDeck({ ...d.decks[0], id: evil }));
});
t("上限: 201冊目からは黙って捨てず over に数える（カードも）", () => {
  const decks = Array.from({ length: MAX_DECKS + 5 }, (_, i) => ({ ...makeDeck(`d${i}`), id: `d${i}` }));
  const cards = decks.map((dk, i) => ({ ...makeCard(dk.id, { front: "a", back: "b" }), id: `c${i}` }));
  const r = parseData(JSON.stringify({ ...emptyData(), decks, cards }))!;
  assert.equal(r.data.decks.length, MAX_DECKS);
  assert.equal(r.over, 10);
  assert.equal(r.dropped, 0);
});
t("上限: 足すときは上限までにし、こえた数を返す", () => {
  const cur = { ...emptyData(), decks: Array.from({ length: MAX_DECKS - 1 }, (_, i) => ({ ...makeDeck("x"), id: `a${i}` })) };
  const incDecks = Array.from({ length: 3 }, (_, i) => ({ ...makeDeck("y"), id: `b${i}` }));
  const inc = { ...emptyData(), decks: incDecks, cards: incDecks.map((dk, i) => ({ ...makeCard(dk.id, { front: "q", back: "a" }), id: `bc${i}` })) };
  const m = mergeData(cur, inc);
  assert.equal(m.data.decks.length, MAX_DECKS);
  assert.equal(m.decks, 1);
  assert.equal(m.cards, 1);
  assert.equal(m.over, 4);
  // 保存して読み直しても1冊も消えない
  const back = parseData(JSON.stringify(m.data))!;
  assert.equal(back.data.decks.length, MAX_DECKS);
  assert.equal(back.over + back.dropped, 0);
});
t("余分な項目は捨てる・知らない絵は除く", () => {
  const d = sampleData();
  const raw = JSON.stringify({ ...d, decks: [{ ...d.decks[0], extra: 1 }, { ...d.decks[0], id: "d2", art: "evil" }], cards: [{ ...d.cards[0], __proto__x: 1 }] });
  const r = parseData(raw)!;
  assert.deepEqual(Object.keys(r.data.decks[0]).sort(), ["art", "createdAt", "id", "name"]);
  assert.equal(r.data.decks.length, 1);
  assert.ok(!("__proto__x" in r.data.cards[0]));
});
t("newPerDay・days の検査", () => {
  const d = sampleData();
  assert.equal(parseData(JSON.stringify({ ...d, newPerDay: 7 }))!.data.newPerDay, 20);
  assert.equal(parseData(JSON.stringify({ ...d, newPerDay: 50 }))!.data.newPerDay, 50);
  assert.deepEqual(parseData(JSON.stringify({ ...d, days: ["2026-10-02", "bad", "2026-10-01", "2026-10-02"] }))!.data.days, ["2026-10-01", "2026-10-02"]);
  assert.deepEqual(parseData(JSON.stringify({ ...d, days: "x" }))!.data.days, []);
});
t("mergeData: 同じ id は今のものを残し、新しいものだけ足す", () => {
  const a = sampleData();
  const b = sampleData();
  const m1 = mergeData(a, a);
  assert.equal(m1.cards, 0);
  assert.equal(m1.skipped, 2);
  assert.deepEqual(m1.data.cards, a.cards);
  const m2 = mergeData(a, b);
  assert.equal(m2.decks, 1);
  assert.equal(m2.cards, 2);
  assert.equal(m2.data.cards.length, 4);
  assert.equal(m2.data.newPerDay, a.newPerDay);
});
t("前の版（v1）の保存内容を引き継ぐ", () => {
  const decks = JSON.stringify([{ id: "dk_1", name: "サンプル", createdAt: "2026-06-01T00:00:00.000Z" }]);
  const cards = JSON.stringify([
    { id: "cd_1", deckId: "dk_1", front: "一期一会", back: "一生に一度", repetitions: 1, interval: 1, easeFactor: 2.5, due: "2026-06-28", reviews: 1, lastReviewed: "2026-06-27", createdAt: "2026-06-01T00:00:00.000Z" },
    { id: "cd_2", deckId: "dk_1", front: "温故知新", back: "古きを…", repetitions: 0, interval: 0, easeFactor: 2.5, reviews: 0 },
    { id: "cd_3", deckId: "dk_1", front: 5 },
  ]);
  const d = migrateV1(decks, cards)!;
  assert.equal(d.decks[0].art, "own");
  assert.equal(d.cards.length, 2);
  assert.ok(d.cards.every(validCard));
  assert.equal(d.cards[0].due, "2026-06-28");
  assert.equal(migrateV1(null, null), null);
  assert.equal(migrateV1("{", "[]"), null);
});
t("見本の単語帳は表・裏がそろい、重なりがない", () => {
  assert.deepEqual(SAMPLES.map((s) => s.cards.length), [20, 47, 20]);
  for (const s of SAMPLES) {
    assert.ok(s.cards.every((c) => c.front && c.back && c.front.length <= 300 && c.back.length <= 300), s.id);
    assert.equal(new Set(s.cards.map((c) => c.front)).size, s.cards.length, s.id);
  }
});
t("makeDeck: 名前の空白をつめ、空なら「新しい単語帳」、30文字まで", () => {
  assert.equal(makeDeck("  英  単語 ").name, "英 単語");
  assert.equal(makeDeck("   ").name, "新しい単語帳");
  assert.equal(makeDeck("あ".repeat(40)).name.length, 30);
});

// ================= ランダム（性質）テスト =================
const N = 20000;
t(`ランダム ${N}件: 間隔と覚えやすさの性質`, () => {
  for (let i = 0; i < N; i++) {
    const reviews = ri(0, 50);
    const prev: SrsState =
      reviews === 0
        ? initialSrs()
        : {
            repetitions: ri(0, 30),
            interval: ri(1, MAX_INTERVAL),
            easeFactor: Math.round((MIN_EASE + R() * (MAX_EASE - MIN_EASE)) * 100) / 100,
            due: addDays(TODAY, ri(-400, 400)),
            reviews,
            lapses: ri(0, reviews),
          };
    const day = new Date(2020 + ri(0, 15), ri(0, 11), ri(1, 28), ri(0, 23), ri(0, 59));
    const ints = GRADES.map((g) => nextInterval(prev, g));
    // 4つの答えの順に、間隔は短い → 長い
    for (let k = 1; k < 4; k++) assert.ok(ints[k - 1] <= ints[k], `順 ${JSON.stringify(prev)} ${ints}`);
    for (const g of GRADES) {
      const n = reviewState(prev, g, day);
      assert.ok(Number.isInteger(n.interval) && n.interval >= 1 && n.interval <= MAX_INTERVAL, `範囲 ${n.interval}`);
      assert.equal(n.interval, nextInterval(prev, g));
      assert.ok(n.easeFactor >= MIN_EASE && n.easeFactor <= MAX_EASE);
      assert.ok(Math.abs(n.easeFactor * 100 - Math.round(n.easeFactor * 100)) < 1e-9, "小数2桁");
      assert.equal(daysBetween(toYmd(day), n.due!), n.interval, "次の日 = 今日 + 間隔");
      assert.equal(n.reviews, prev.reviews + 1);
      assert.equal(n.lastReviewed, toYmd(day));
      assert.ok(validCard({ ...mk(), ...n }), "保存の検査に通る");
      if (g === "again") {
        assert.equal(n.repetitions, 0);
        assert.equal(n.interval, 1);
        assert.equal(n.lapses, prev.lapses + 1);
        assert.ok(n.easeFactor <= Math.max(MIN_EASE, prev.easeFactor));
      } else {
        assert.equal(n.repetitions, prev.repetitions + 1);
        assert.equal(n.lapses, prev.lapses);
        // 3回目以降に思い出せたら、前より必ずのびる（10年で止まる）
        if (prev.repetitions >= 2) assert.ok(n.interval > prev.interval || n.interval === MAX_INTERVAL);
      }
      if (g === "easy") assert.ok(n.easeFactor >= prev.easeFactor || prev.easeFactor === MAX_EASE);
      // 同じ入力なら同じ結果（決定的）
      assert.deepEqual(reviewState(prev, g, day), n);
    }
  }
});

t("ランダム 2000件: 今日めくるカードの性質", () => {
  for (let i = 0; i < 2000; i++) {
    const n = ri(0, 60);
    const newPerDay = pick([0, 5, 10, 20, 30, 50]);
    const cards: Card[] = Array.from({ length: n }, (_, k) => {
      const reviews = R() < 0.4 ? 0 : ri(1, 20);
      return reviews === 0
        ? mk({ id: `c${k}`, createdAt: `2026-10-01T00:00:${String(ri(0, 59)).padStart(2, "0")}.000Z` })
        : mk({ id: `c${k}`, reviews, repetitions: ri(0, 5), interval: ri(1, 100), due: addDays(TODAY, ri(-30, 30)), introduced: addDays(TODAY, -ri(0, 3)) });
    });
    const q = buildQueue(cards, TODAY, newPerDay);
    const s = summarize(cards, TODAY, newPerDay);
    assert.equal(q.length, s.today);
    assert.equal(new Set(q.map((c) => c.id)).size, q.length, "重ならない");
    const today = toYmd(TODAY);
    // 日が来た復習はすべて入る。先の日のものは入らない
    for (const c of cards) {
      if (isDueReview(c, TODAY)) assert.ok(q.includes(c));
      if (!isFresh(c) && c.due! > today) assert.ok(!q.includes(c));
    }
    const freshIn = q.filter(isFresh).length;
    const introduced = cards.filter((c) => c.introduced === today).length;
    assert.ok(freshIn <= Math.max(0, newPerDay - introduced));
    assert.equal(freshIn, Math.min(cards.filter(isFresh).length, Math.max(0, newPerDay - introduced)));
    // 復習が先、新しいカードはあと
    const firstFresh = q.findIndex(isFresh);
    if (firstFresh >= 0) assert.ok(q.slice(firstFresh).every(isFresh));
    for (let k = 1; k < q.length; k++) if (!isFresh(q[k]) && !isFresh(q[k - 1])) assert.ok(q[k - 1].due! <= q[k].due!);
    assert.equal(s.fresh + s.learned, s.total);
  }
});

t("ランダム 3000件: めくっている最中の性質（「わからない」のカードは必ずまた出る）", () => {
  for (let i = 0; i < 3000; i++) {
    const ids = Array.from({ length: ri(1, 30) }, (_, k) => `c${k}`);
    let s = startSession(ids);
    const left = new Set(ids);
    let steps = 0;
    while (s.queue.length && steps < 500) {
      const head = s.queue[0];
      const g = R() < 0.25 ? "again" : pick(["hard", "good", "easy"] as Grade[]);
      const before = s.queue.length;
      s = answerSession(s, g);
      steps++;
      if (g === "again") {
        assert.equal(s.queue.length, before);
        assert.ok(s.queue.includes(head));
      } else {
        assert.equal(s.queue.length, before - 1);
        assert.ok(!s.queue.includes(head));
        left.delete(head);
      }
      assert.equal(s.done, steps);
      assert.equal(Object.values(s.counts).reduce((a, b) => a + b, 0), steps);
    }
    if (steps < 500) assert.equal(left.size, 0, "全部わかるまで終わらない");
  }
});

t("ランダム 3000件: 貼り付けの性質（区切ったものは表裏がそろい、作れた枚数＋問題の行 ≦ 行数）", () => {
  const words = ["apple", "りんご", "東京", "a b", " x ", "1,2", '"q"', "", "あいう", "　空白"];
  const seps = ["\t", ",", "，", "\n", "\n\n"];
  for (let i = 0; i < 3000; i++) {
    const n = ri(0, 12);
    const text = Array.from({ length: n }, () => `${pick(words)}${pick(seps)}${pick(words)}`).join(pick(["\n", "\r\n", "\n\n"]));
    const r = parsePairs(text);
    const lines = text.split(/\r?\n/).filter((l) => l.trim()).length;
    assert.ok(r.pairs.length + r.problems.length <= lines, `${JSON.stringify(text)}`);
    for (const p of r.pairs) {
      assert.ok(p.front.length > 0 && p.back.length > 0);
      assert.equal(p.front, p.front.trim());
      assert.equal(p.back, p.back.trim());
    }
    const d = dedupe(r.pairs, []);
    assert.equal(d.fresh.length + d.skipped, r.pairs.length);
    assert.equal(parsePairs(toTsv(d.fresh)).pairs.length, d.fresh.length, "書き出した文字はそのまま戻せる");
  }
});

t("ランダム 1000件: 保存の検査はどんな入力でも落ちない", () => {
  const junk = [null, 0, -1, 1.5, "", "x", [], {}, true, "2026-10-23", 1e9, NaN];
  for (let i = 0; i < 1000; i++) {
    const d = sampleData();
    const c: any = { ...d.cards[ri(0, 1)] };
    const keys = Object.keys(c);
    for (let k = 0; k < ri(1, 3); k++) c[pick(keys)] = pick(junk);
    const r = parseData(JSON.stringify({ ...d, cards: [c] }));
    assert.ok(r);
    for (const x of r!.data.cards) assert.ok(validCard(x));
  }
});

console.log(`${passed}/${passed + failed} 合格`);
if (failed) process.exit(1);
