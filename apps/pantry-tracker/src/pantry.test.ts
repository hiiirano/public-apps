// 純関数の単体テストとランダム（性質）テスト。npm test で実行する。
import { addDays, addMonths, daysBetween, daysInMonth, formatShort, fromDayNumber, isLeapYear, isYmd, parseYmd, toDayNumber, todayYmd, ymd } from "./dates";
import { ARTS, guessPreset, PRESETS } from "./catalog";
import {
  addItem, byPlace, consume, countLevels, daysLeft, defaultExpiry, emptyState, expiryLabel, levelOf, removeItem,
  sortByExpiry, stats, updateItem, type Item, type LogEntry, type State,
} from "./pantry";
import { exportText, importText, migrateOld, parseState } from "./storage";

let passed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = "") {
  if (cond) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}
const eq = (name: string, got: unknown, want: unknown) => check(name, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);

// 乱数は毎回同じ並びにする（失敗を再現できるように）
let seed = 20261023;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

// ---- 日付の読み取り ----
eq("ふつうの日付", parseYmd("2026-10-23"), { y: 2026, m: 10, d: 23 });
check("2月30日はない", parseYmd("2026-02-30") === null);
check("うるう年でない年の2月29日はない", parseYmd("2026-02-29") === null);
check("うるう年の2月29日", parseYmd("2028-02-29") !== null);
check("2000年はうるう年（400で割れる）", isLeapYear(2000) && parseYmd("2000-02-29") !== null);
check("2100年はうるう年でない（100で割れる）", !isLeapYear(2100) && parseYmd("2100-02-29") === null);
check("4月31日はない", parseYmd("2026-04-31") === null);
check("13月はない", parseYmd("2026-13-01") === null);
check("0日はない", parseYmd("2026-10-00") === null);
check("形が違う", parseYmd("2026/10/23") === null && parseYmd("2026-1-5") === null && parseYmd(" 2026-10-23") === null);
check("文字以外", parseYmd(20261023) === null && parseYmd(null) === null);
check("範囲外の年", parseYmd("1999-12-31") === null && parseYmd("2200-01-01") === null);

// ---- 日付の足し算・引き算（月末・年末・うるう年）----
eq("月末をまたぐ", addDays("2026-01-31", 1), "2026-02-01");
eq("うるう年の2/28の次は2/29", addDays("2028-02-28", 1), "2028-02-29");
eq("うるう年でない2/28の次は3/1", addDays("2026-02-28", 1), "2026-03-01");
eq("年末をまたぐ", addDays("2026-12-31", 1), "2027-01-01");
eq("前の日（年はじめ）", addDays("2027-01-01", -1), "2026-12-31");
eq("3/1の前の日（うるう年）", addDays("2028-03-01", -1), "2028-02-29");
eq("1か月後・月末にそろえる", addMonths("2026-01-31", 1), "2026-02-28");
eq("1か月後・うるう年の月末", addMonths("2028-01-31", 1), "2028-02-29");
eq("1か月後・ふつう", addMonths("2026-10-23", 1), "2026-11-23");
eq("1か月後・年をまたぐ", addMonths("2026-12-15", 1), "2027-01-15");
eq("1か月前", addMonths("2026-03-31", -1), "2026-02-28");
eq("12か月後", addMonths("2028-02-29", 12), "2029-02-28");
eq("日数の差・同じ日", daysBetween("2026-10-23", "2026-10-23"), 0);
eq("日数の差・うるう年の2月", daysBetween("2028-02-01", "2028-03-01"), 29);
eq("日数の差・ふつうの2月", daysBetween("2026-02-01", "2026-03-01"), 28);
eq("日数の差・1年（うるう年）", daysBetween("2028-01-01", "2029-01-01"), 366);
eq("日数の差・逆向き", daysBetween("2026-10-25", "2026-10-23"), -2);
eq("通し番号（2000-01-01 は 10957）", toDayNumber("2000-01-01"), 10957);
eq("短い日付", formatShort("2026-10-23"), "10/23（金）");
eq("短い日付・うるう日", formatShort("2028-02-29"), "2/29（火）");
check("月の日数", daysInMonth(2026, 2) === 28 && daysInMonth(2028, 2) === 29 && daysInMonth(2026, 4) === 30 && daysInMonth(2026, 12) === 31);

// ---- 今日の日付と時差 ----
eq("UTC 15:30 は東京では翌日", todayYmd(new Date("2026-10-23T15:30:00Z"), "Asia/Tokyo"), "2026-10-24");
eq("UTC 15:30 はニューヨークではその日", todayYmd(new Date("2026-10-23T15:30:00Z"), "America/New_York"), "2026-10-23");
eq("東京の 0:00 ちょうど", todayYmd(new Date("2026-10-23T15:00:00Z"), "Asia/Tokyo"), "2026-10-24");
eq("東京の 23:59", todayYmd(new Date("2026-10-23T14:59:59Z"), "Asia/Tokyo"), "2026-10-23");
eq("大みそかの東京", todayYmd(new Date("2026-12-31T15:00:00Z"), "Asia/Tokyo"), "2027-01-01");
eq("うるう日の東京", todayYmd(new Date("2028-02-28T15:00:00Z"), "Asia/Tokyo"), "2028-02-29");
// 夏時間に切り替わる日（23 時間の日・25 時間の日）でも、日数の差は 1 日ずつ
eq("夏時間の始まり（NY 2026-03-08）", [daysBetween("2026-03-07", "2026-03-08"), daysBetween("2026-03-08", "2026-03-09")], [1, 1]);
eq("夏時間の終わり（NY 2026-11-01）", [daysBetween("2026-10-31", "2026-11-01"), daysBetween("2026-11-01", "2026-11-02")], [1, 1]);
eq("夏時間の始まり直後の NY の日付", todayYmd(new Date("2026-03-08T07:30:00Z"), "America/New_York"), "2026-03-08");
// 端末の時差を変えても、日付の計算は変わらない
for (const tz of ["Asia/Tokyo", "America/New_York", "Pacific/Auckland", "Pacific/Kiritimati", "Pacific/Pago_Pago", "UTC"]) {
  process.env.TZ = tz;
  const now = new Date("2026-03-29T01:30:00Z");
  check(`端末の時差 ${tz}: 今日の日付が合う`, todayYmd(now) === todayYmd(now, tz), `${todayYmd(now)} / ${todayYmd(now, tz)}`);
  check(`端末の時差 ${tz}: 日数の差が変わらない`, daysBetween("2026-03-28", "2026-03-30") === 2 && addDays("2026-03-28", 2) === "2026-03-30");
}
process.env.TZ = "Asia/Tokyo";

// ---- 期限の近さと言葉 ----
eq("言葉", [-3, -1, 0, 1, 2, 6, 30, null].map((d) => expiryLabel(d)), ["3日すぎ", "1日すぎ", "今日まで", "明日まで", "あと2日", "あと6日", "あと30日", "期限なし"]);
eq("色分け", [-1, 0, 1, 2, 3, 6, 7, null].map((d) => levelOf(d)), ["expired", "today", "soon", "soon", "week", "week", "ok", "none"]);
eq("期限までの日数", [daysLeft("2026-10-25", "2026-10-23"), daysLeft("2026-10-22", "2026-10-23"), daysLeft(null, "2026-10-23")], [2, -1, null]);
eq("月末をまたぐ期限", daysLeft("2026-11-01", "2026-10-30"), 2);
eq("期限の初期値", [defaultExpiry("2026-10-23", 7), defaultExpiry("2026-10-23", null)], ["2026-10-30", null]);

// ---- 並べ替えと置き場所 ----
const T = "2026-10-23";
const mk = (id: string, name: string, expiry: string | null, place: Item["place"] = "fridge", qty = 1): Item => ({ id, name, art: "plate", place, qty, expiry, addedOn: T });
const items = [mk("a", "パン", null, "shelf"), mk("b", "牛乳", "2026-10-25"), mk("c", "卵", "2026-10-20"), mk("d", "アイス", null, "freezer"), mk("e", "魚", "2026-10-23")];
eq("期限が近い順・期限なしは最後", sortByExpiry(items).map((i) => i.id), ["c", "e", "b", "a", "d"]);
eq("置き場所ごと", Object.fromEntries(Object.entries(byPlace(items)).map(([k, v]) => [k, v.map((i) => i.id)])), { fridge: ["c", "e", "b"], freezer: ["d"], shelf: ["a"] });
eq("数え上げ", countLevels(items, T), { expired: 1, today: 1, soon: 1, total: 5 });

// ---- 操作 ----
let s: State = emptyState();
s = addItem(s, { name: "  牛乳  ", art: "milk", place: "fridge", qty: 2, expiry: "2026-10-30" }, "m1", T);
eq("入れる（名前の空白を取る）", s.items[0], { id: "m1", name: "牛乳", art: "milk", place: "fridge", qty: 2, expiry: "2026-10-30", addedOn: T });
check("空の名前は入れない", addItem(s, { name: "   ", art: "plate", place: "fridge", qty: 1, expiry: null }, "x", T) === s);
eq("数は1〜99", [addItem(emptyState(), { name: "a", art: "plate", place: "fridge", qty: 0, expiry: null }, "x", T).items[0].qty, addItem(emptyState(), { name: "a", art: "plate", place: "fridge", qty: 500, expiry: null }, "x", T).items[0].qty], [1, 99]);
check("名前は20文字まで", addItem(emptyState(), { name: "あ".repeat(40), art: "plate", place: "fridge", qty: 1, expiry: null }, "x", T).items[0].name.length === 20);
const s1 = consume(s, "m1", "used", T, "l1");
eq("1つ使い切ると数が減る", [s1.items[0].qty, s1.log.length, s1.log[0].outcome], [1, 1, "used"]);
const s2 = consume(s1, "m1", "wasted", T, "l2");
eq("最後の1つを捨てると在庫から消える", [s2.items.length, s2.log.map((l) => l.outcome)], [0, ["used", "wasted"]]);
const s3 = consume(s, "m1", "wasted", T, "l3", true);
eq("まとめて捨てる", [s3.items.length, s3.log[0].qty], [0, 2]);
check("元の状態は変えない", s.items.length === 1 && s.items[0].qty === 2 && s.log.length === 0);
eq("記録せずに消す", [removeItem(s, "m1").items.length, removeItem(s, "m1").log.length], [0, 0]);
eq("直す", updateItem(s, "m1", { place: "freezer", expiry: null, qty: 3, name: "" }).items[0], { ...s.items[0], place: "freezer", expiry: null, qty: 3 });

// ---- 集計 ----
const L = (name: string, outcome: LogEntry["outcome"], date: string, qty = 1): LogEntry => ({ id: Math.random().toString(36), name, art: "plate", outcome, qty, date });
const log = [L("牛乳", "wasted", "2026-10-01"), L("牛乳", "wasted", "2026-10-20"), L("牛乳", "used", "2026-10-21"), L("卵", "used", "2026-10-22", 6), L("パン", "wasted", "2026-09-23"), L("パン", "wasted", "2026-09-24")];
const st = stats(log, T);
eq("30日の数", [st.used, st.wasted, st.wasteRate], [7, 3, 30]);
eq("捨てた物", st.topWasted.map((x) => [x.name, x.wasted, x.used]), [["牛乳", 2, 1], ["パン", 1, 0]]);
eq("買いすぎかも", st.overbuy.map((x) => x.name), ["牛乳"]);
eq("30日は今日を含めて数える（9/24 は入り、9/23 は外）", stats(log, T).topWasted.find((x) => x.name === "パン")?.wasted, 1);
eq("31日にすると9/23 も入る", stats(log, T, 31).topWasted.find((x) => x.name === "パン")?.wasted, 2);
eq("記録がないとき", stats([], T).wasteRate, null);

// ---- 絵の当てはめ ----
eq("名前から絵", [guessPreset("牛乳")?.art, guessPreset("鶏むね肉")?.art, guessPreset("ほうれん草")?.art, guessPreset("食パン")?.art, guessPreset("謎の物")], ["milk", "chicken", "greens", "bread", null]);
check("よく買う物の絵はすべてある", PRESETS.every((p) => (ARTS as readonly string[]).includes(p.art)));
check("よく買う物の名前は重ならない", new Set(PRESETS.map((p) => p.name)).size === PRESETS.length);

// ---- 保存・書き出し・読み込み ----
const full: State = { items: [mk("a", "牛乳", "2026-10-25")], log: [L("卵", "used", T)], freq: { 牛乳: 3 } };
eq("書き出して読み込むと同じ", importText(exportText(full, T)), full);
check("違うファイルは読まない", importText(JSON.stringify({ kind: "other", version: 2, ...full })) === null);
check("壊れた文字は読まない", importText("{oops") === null && importText("") === null);
check("ない日付は読まない", parseState({ ...full, items: [mk("a", "牛乳", "2026-02-30")] }) === null);
check("数が範囲外なら読まない", parseState({ ...full, items: [{ ...mk("a", "x", null), qty: 0 }] }) === null);
check("知らない絵なら読まない", parseState({ ...full, items: [{ ...mk("a", "x", null), art: "<img>" }] }) === null);
check("同じ id が2つなら読まない", parseState({ ...full, items: [mk("a", "x", null), mk("a", "y", null)] }) === null);
check("余計な項目は落とす", !("evil" in (parseState({ ...full, items: [{ ...mk("a", "x", null), evil: 1 }] })!.items[0] as object)));
const mig = migrateOld([{ name: "牛乳", qty: 1.6, location: "冷蔵", expiry: "2026-10-30" }, { name: "アイス", qty: 0, location: "その他", category: "冷凍" }, { name: "" }, null, { name: "米", expiry: "2026-13-01" }], T)!;
eq("古い形式から移す", mig.items.map((i) => [i.name, i.place, i.qty, i.expiry, i.art]), [["牛乳", "fridge", 2, "2026-10-30", "milk"], ["アイス", "freezer", 1, null, "icecream"], ["米", "shelf", 1, null, "rice"]]);

// ---- ランダム（性質）テスト ----
// 1) 日付: 足して引くと元に戻る・通し番号の往復・別の計算方法と一致
function civilDays(y: number, m: number, d: number): number {
  // 暦から通し番号を出す別のやり方（Date を使わない）
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}
let dateBad = 0;
for (let n = 0; n < 10000; n++) {
  const y = ri(2003, 2146), m = ri(1, 12), d = ri(1, daysInMonth(y, m));
  const a = ymd(y, m, d);
  const k = ri(-800, 800);
  const b = addDays(a, k);
  const months = ri(-30, 30);
  const c = addMonths(a, months);
  const pc = parseYmd(c)!;
  const ok =
    isYmd(b) && daysBetween(a, b) === k && addDays(b, -k) === a &&
    fromDayNumber(toDayNumber(a)) === a && toDayNumber(a) === civilDays(y, m, d) &&
    isYmd(c) && (pc.y * 12 + pc.m) - (y * 12 + m) === months && pc.d <= d && (d <= 28 ? pc.d === d : pc.d === Math.min(d, daysInMonth(pc.y, pc.m)));
  if (!ok) {
    dateBad++;
    if (dateBad < 5) failures.push(`日付のランダム ${a} +${k}日=${b} +${months}か月=${c}`);
  }
}
check("日付のランダム1万件", dateBad === 0, `${dateBad} 件の不一致`);

// 2) 時差: どの瞬間でも、東京の日付は UTC+9 時間の日付、UTC の日付は ISO の先頭
let tzBad = 0;
for (let n = 0; n < 3000; n++) {
  const t = Date.UTC(2000, 0, 1) + Math.floor(rnd() * 150 * 365.25 * 86_400_000);
  const now = new Date(t);
  if (todayYmd(now, "UTC") !== now.toISOString().slice(0, 10)) tzBad++;
  if (todayYmd(now, "Asia/Tokyo") !== new Date(t + 9 * 3_600_000).toISOString().slice(0, 10)) tzBad++;
}
check("時差のランダム3千件", tzBad === 0, `${tzBad}`);

// 3) 期限の近さ: 日数が増えるほど急ぎ度は下がる（逆転しない）
const rank = { expired: 0, today: 1, soon: 2, week: 3, ok: 4, none: 5 } as const;
let lvBad = 0;
for (let d = -400; d < 400; d++) if (rank[levelOf(d)] > rank[levelOf(d + 1)]) lvBad++;
check("急ぎ度は日数に対して逆転しない", lvBad === 0);

// 4) 操作: ランダムに入れる・使う・捨てる・消すを繰り返しても、数が合う
let opBad = 0;
for (let run = 0; run < 300; run++) {
  let st2 = emptyState();
  let added = 0, removed = 0;
  let today = ymd(2026, ri(1, 12), ri(1, 28));
  for (let step = 0; step < 60; step++) {
    const r = rnd();
    if (r < 0.4 || st2.items.length === 0) {
      const q = ri(1, 5);
      const before = st2.items.length;
      st2 = addItem(st2, { name: `物${ri(1, 9)}`, art: ARTS[ri(0, ARTS.length - 1)], place: (["fridge", "freezer", "shelf"] as const)[ri(0, 2)], qty: q, expiry: rnd() < 0.2 ? null : addDays(today, ri(-5, 40)) }, `i${run}-${step}`, today);
      if (st2.items.length > before) added += q;
    } else if (r < 0.85) {
      const it = st2.items[ri(0, st2.items.length - 1)];
      st2 = consume(st2, it.id, rnd() < 0.5 ? "used" : "wasted", today, `l${run}-${step}`, rnd() < 0.3);
    } else if (r < 0.92) {
      const it = st2.items[ri(0, st2.items.length - 1)];
      removed += it.qty;
      st2 = removeItem(st2, it.id);
    } else today = addDays(today, ri(1, 3));
    const inStock = st2.items.reduce((a, i) => a + i.qty, 0);
    const logged = st2.log.reduce((a, l) => a + l.qty, 0);
    const c = countLevels(st2.items, today);
    const allStats = stats(st2.log, today, 100000);
    if (
      inStock + logged + removed !== added ||
      st2.items.some((i) => i.qty < 1 || i.qty > 99) ||
      parseState(JSON.parse(JSON.stringify(st2))) === null ||
      c.expired + c.today + c.soon > c.total ||
      allStats.used + allStats.wasted !== logged ||
      Object.values(byPlace(st2.items)).reduce((a, v) => a + v.length, 0) !== st2.items.length
    ) {
      opBad++;
      break;
    }
  }
}
check("操作のランダム300通り×60手", opBad === 0, `${opBad}`);

// 5) 読み込み: 正しい保存内容をランダムに壊すと、読まないか、正しい形で読む（落ちない）
let fuzzBad = 0;
const junk = [null, -1, 0, 1.5, 100, "", "x", "2026-02-30", [], {}, "<script>", true];
for (let n = 0; n < 3000; n++) {
  const base: any = JSON.parse(exportText({ items: [mk("a", "牛乳", "2026-10-25"), mk("b", "卵", null, "shelf", 3)], log: [L("卵", "used", T)], freq: { 牛乳: 1 } }, T));
  const target = [base.items[0], base.items[1], base.log[0], base.freq, base][ri(0, 4)];
  const keys = Object.keys(target);
  target[keys[ri(0, keys.length - 1)]] = junk[ri(0, junk.length - 1)];
  try {
    const r = importText(JSON.stringify(base));
    if (r !== null && parseState(r) === null) fuzzBad++;
  } catch {
    fuzzBad++;
  }
}
check("壊れた保存内容のランダム3千件で落ちない", fuzzBad === 0, `${fuzzBad}`);

if (failures.length) {
  console.error(failures.slice(0, 30).map((f) => `  NG ${f}`).join("\n"));
  console.error(`\n${failures.length} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`${passed} checks passed（日付ランダム 1万件・時差 3千件・操作 300通り・壊れた保存 3千件を含む）`);
