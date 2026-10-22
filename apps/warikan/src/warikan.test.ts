import type { Level, Person, Settings } from "./types";
import { LEVELS, UNITS } from "./types";
import { calculate, DEFAULT_SETTINGS, differenceText, shareText, weightOf } from "./warikan";
import { formatRatio, parseYen } from "./money";
import { freshState, nextFace, parseState } from "./storage";

let passed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = "") {
  if (cond) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const P = (level: Level = "normal", fixed: number | null = null, name = ""): Person => ({
  id: Math.random().toString(36).slice(2),
  name,
  level,
  fixed,
  face: 0,
});
const S = (o: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...o });
function ok(total: number | null, people: Person[], s = S(), host = 0) {
  const r = calculate(total, people, s, people[host].id);
  if (r.kind !== "ok") throw Error(`ok を期待: ${JSON.stringify(r)}`);
  return r;
}

// ---- 金額の読み取り（AC-04）----
check("全角とカンマと円", parseYen("２８,６００円") === 28600);
check("¥と空白", parseYen(" ¥ 9,870 ") === 9870);
check("全角カンマ", parseYen("１２，３４５") === 12345);
check("空は null", parseYen("") === null && parseYen("  ") === null);
check("文字は NaN", Number.isNaN(parseYen("abc")));
check("小数は NaN", Number.isNaN(parseYen("12.5")));
check("負は NaN", Number.isNaN(parseYen("-100")));
check("倍率表示", formatRatio(8) === "0.8" && formatRatio(10) === "1" && formatRatio(12) === "1.2" && formatRatio(30) === "3");

// ---- 基本の計算 ----
{
  const r = ok(9870, [P(), P(), P(), P()]);
  check("均等 100円単位切り上げ", r.amounts.every((a) => a === 2500), r.amounts.join());
  check("おつり", r.difference === 130 && differenceText(r.difference) === "幹事のおつり 130円");
}
{
  const r = ok(9870, [P(), P(), P(), P()], S({ rounding: "down" }));
  check("均等 切り捨て", r.amounts.every((a) => a === 2400));
  check("幹事が足す", r.difference === -270 && differenceText(-270) === "幹事が 270円 足す");
}
{
  const r = ok(4000, [P(), P(), P(), P()]);
  check("割り切れるとぴったり", r.difference === 0 && differenceText(0) === "ぴったり（おつりなし）");
}
{
  // 場面1.1: 7人 28,600円、上司は多め、学生2人は少なめ、誕生日はおごり
  const people = [P(), P("more"), P("less"), P("less"), P("gift"), P(), P()];
  const r = ok(28600, people);
  // 重み 10+12+8+8+0+10+10 = 58、1単位 = 28600/58 = 493.1...
  check("場面: 多め", r.amounts[1] === 6000, String(r.amounts[1]));
  check("場面: ふつう", r.amounts[0] === 5000, String(r.amounts[0]));
  check("場面: 少なめ", r.amounts[2] === 4000, String(r.amounts[2]));
  check("場面: おごり", r.amounts[4] === 0);
  check("場面: 差額の式", r.collected - r.total === r.difference);
}
{
  const r = ok(10000, [P(), P("normal", 6000), P()]);
  check("金額指定はそのまま", r.amounts[1] === 6000);
  check("残りを按分", r.amounts[0] === 2000 && r.amounts[2] === 2000);
}
{
  const r = ok(10001, [P(), P("normal", 3333), P()]);
  check("金額指定は丸めない", r.amounts[1] === 3333);
}
{
  const r = ok(6000, [P("gift"), P(), P()], S(), 0);
  check("幹事がおごり", r.amounts[0] === 0 && r.received === 6000 && r.hostActual === 0);
}
{
  const r = ok(9870, [P(), P(), P(), P()], S(), 2);
  check("幹事の受け取り", r.received === 7500 && r.hostActual === 2370);
}
{
  const r = ok(5000, [P("normal", 5000), P()]);
  check("指定額で会計ちょうど → ほかは0", r.amounts[1] === 0 && r.difference === 0);
}
{
  const r = ok(1, [P(), P()], S({ unit: 1000 }));
  check("1円を1000円単位", r.amounts.every((a) => a === 1000) && r.difference === 1999);
}

// ---- 結果が出ない場合（AC-05）----
const kind = (total: number | null, people: Person[], s = S()) =>
  calculate(total, people, s, people[0].id);
check("空欄は empty", kind(null, [P(), P()]).kind === "empty");
check("0円は empty", kind(0, [P(), P()]).kind === "empty");
check("上限超え", kind(10_000_000, [P(), P()]).kind === "error");
check("NaN", kind(NaN, [P(), P()]).kind === "error");
{
  const r = calculate(1000, [P("gift"), P("gift")], S(), "nobody");
  check("幹事なし", r.kind === "error");
}
{
  const r = kind(1000, [P("gift"), P("gift")]);
  check("全員おごり", r.kind === "error" && r.message.includes("全員"));
}
{
  const r = kind(1000, [P("normal", 600), P("normal", 600)]);
  check("指定額超過", r.kind === "error" && r.message.includes("超えて"));
}
{
  const r = kind(1000, [P("normal", 400), P("gift")]);
  check("残りを払う人がいない", r.kind === "error" && r.message.includes("残り"));
}

// ---- LINE の文 ----
{
  const people = [P("normal", null, "ひらの"), P("more", null, "たなか"), P("less"), P("less"), P("gift", null, "はると"), P(), P()];
  const r = ok(28600, people);
  const t = shareText(people, S(), r);
  check("文: 見出し", t.startsWith("本日の会計 28,600円（7人）"), t);
  check("文: 名前と傾斜", t.includes("・たなかさん 6,000円（多め ×1.2）"), t);
  check("文: おごり", t.includes("・はるとさん 0円（おごり ×0）"), t);
  check("文: 名前なしはまとめる", t.includes("・ほか2人 各4,000円（少なめ ×0.8）") && t.includes("・ほか2人 各5,000円"), t);
  check("文: 幹事", t.includes("幹事: ひらのさん（自分の分 5,000円）"), t);
  check("文: おつり", t.endsWith(`幹事に払ってください。${differenceText(r.difference)}`), t);
}
{
  const people = [P(), P(), P(), P()];
  const t = shareText(people, S(), ok(9870, people));
  check("文: 全員名前なし", t.includes("・3人 各2,500円") && t.includes("幹事: 1人目"), t);
}

// ---- 保存の検証 ----
{
  const s = freshState();
  check("初期 4人", s.people.length === 4 && s.hostId === s.people[0].id);
  check("初期 顔が重ならない", new Set(s.people.map((p) => p.face)).size === 4);
  const back = parseState(JSON.stringify(s));
  check("保存→復元", JSON.stringify(back) === JSON.stringify(s));
  check("壊れた JSON", parseState("{").people.length === 4);
  check("null", parseState(null).people.length === 4);
  const bad = { ...s, people: s.people.map((p) => ({ ...p, level: "xxx" })) };
  check("不正な傾斜は初期化", parseState(JSON.stringify(bad)).people[0].level === "normal");
  const tooLong = { ...s, people: s.people.map((p) => ({ ...p, name: "あ".repeat(21) })) };
  check("長すぎる名前は初期化", parseState(JSON.stringify(tooLong)).people[0].name === "");
  const noHost = { ...s, hostId: "zzz" };
  check("幹事がいない保存は初期化", parseState(JSON.stringify(noHost)).hostId !== "zzz");
  const old = { amount: "1000", people: [{ name: "", level: "normal", fixed: "" }], host: 0 };
  check("v2 形式は初期化", parseState(JSON.stringify(old)).people.length === 4);
}
{
  const people: Person[] = [];
  for (let i = 0; i < 12; i++) people.push({ ...P(), face: nextFace(people) });
  check("12人まで顔が重ならない", new Set(people.map((p) => p.face)).size === 12);
  people.splice(3, 1);
  check("抜けた顔を埋める", nextFace(people) === 3);
}

// ---- ランダム 1万件（AC-02）----
let seed = 20261022;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
let okCount = 0;
let errCount = 0;
for (let n = 0; n < 10000; n++) {
  const count = 2 + Math.floor(rnd() * 29);
  const s = S({
    lessTenths: 1 + Math.floor(rnd() * 9),
    moreTenths: 11 + Math.floor(rnd() * 20),
    unit: pick(UNITS),
    rounding: rnd() < 0.5 ? "up" : "down",
  });
  const total = 1 + Math.floor(rnd() * 9_999_999);
  const people = Array.from({ length: count }, () =>
    P(pick(LEVELS), rnd() < 0.1 ? Math.floor(rnd() * (total / count)) : null),
  );
  const host = Math.floor(rnd() * count);
  const r = calculate(total, people, s, people[host].id);
  if (r.kind === "error") {
    errCount++;
    const fixedSum = people.reduce((a, p) => a + (p.fixed ?? 0), 0);
    const w = people.reduce((a, p) => a + (p.fixed === null ? weightOf(p.level, s) : 0), 0);
    if (!(fixedSum > total || (total - fixedSum > 0 && w === 0)))
      failures.push(`#${n} 不要なエラー: ${r.message}`);
    continue;
  }
  if (r.kind !== "ok") {
    failures.push(`#${n} empty`);
    continue;
  }
  okCount++;
  const sum = r.amounts.reduce((a, b) => a + b, 0);
  const fixedSum = people.reduce((a, p) => a + (p.fixed ?? 0), 0);
  const rest = total - fixedSum;
  const W = people.reduce((a, p) => a + (p.fixed === null ? weightOf(p.level, s) : 0), 0);
  const bad: string[] = [];
  if (sum !== r.collected) bad.push("collected");
  if (r.collected - r.total !== r.difference) bad.push("差額の式");
  if (r.received + r.amounts[r.hostIndex] !== r.collected) bad.push("受け取り");
  if (r.hostActual !== r.total - r.received) bad.push("幹事の実質");
  people.forEach((p, i) => {
    const a = r.amounts[i];
    if (!Number.isSafeInteger(a) || a < 0) bad.push(`整数でない ${a}`);
    if (p.fixed !== null) {
      if (a !== p.fixed) bad.push("指定額が変わった");
      return;
    }
    const w = weightOf(p.level, s);
    if (w === 0) {
      if (a !== 0) bad.push("おごりが0でない");
      return;
    }
    if (a % s.unit !== 0) bad.push(`単位 ${a} % ${s.unit}`);
    // 本来の額 exact = rest*w/W に対し、切り上げなら exact ≦ a < exact+unit、切り捨てなら exact-unit < a ≦ exact
    const lhs = a * W;
    const exact = rest * w;
    if (s.rounding === "up" && !(lhs >= exact && lhs < exact + s.unit * W)) bad.push(`切り上げ幅 ${a}`);
    if (s.rounding === "down" && !(lhs <= exact && lhs > exact - s.unit * W)) bad.push(`切り捨て幅 ${a}`);
  });
  // 倍率が大きい人ほど額が小さくならない
  for (let i = 0; i < count; i++)
    for (let j = 0; j < count; j++)
      if (people[i].fixed === null && people[j].fixed === null && weightOf(people[i].level, s) > weightOf(people[j].level, s) && r.amounts[i] < r.amounts[j])
        bad.push("倍率と額の大小が逆");
  const variable = people.filter((p) => p.fixed === null && weightOf(p.level, s) > 0).length;
  if (s.rounding === "up" && !(r.difference >= 0 && r.difference < s.unit * variable)) bad.push(`おつりの幅 ${r.difference}`);
  if (s.rounding === "down" && !(r.difference <= 0 && -r.difference < s.unit * Math.max(variable, 1))) bad.push(`不足の幅 ${r.difference}`);
  if (bad.length) failures.push(`#${n} ${[...new Set(bad)].join(", ")} total=${total} unit=${s.unit} ${s.rounding}`);
}
check("ランダムで結果が出た件数", okCount > 9000, `${okCount}`);

if (failures.length) {
  console.error(failures.slice(0, 20).map((f) => `  NG ${f}`).join("\n"));
  console.error(`\n${failures.length} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`${passed} checks passed（ランダム ${okCount} 件 + エラー確認 ${errCount} 件）`);
