// 計算と判定だけを集めた純関数。画面（main.ts）や端末の日付・保存から切り離す。
import type { Exercise, Metric, Part, SetEntry, Workout, WorkoutItem } from "./types";
import { LIMITS } from "./types";

// ---- 日付 ----

/** "YYYY-MM-DD" 同士の日数差（a − b）。UTC で数えるのでタイムゾーンの影響を受けない */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

export function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/** 0 = 月曜 … 6 = 日曜 */
export function weekdayMon(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/** その日を含む週の月曜 */
export function mondayOf(date: string): string {
  return addDays(date, -weekdayMon(date));
}

// ---- 数の読み取りと増減 ----

/** 全角数字・「，」「．」・単位付きも読む。読めなければ NaN、空なら null */
export function parseNum(text: string): number | null {
  const t = text
    .replace(/[０-９．，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,\s]|kg|ｋｇ|回|秒|分/gi, "");
  if (t === "") return null;
  if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
  return Number(t);
}

/** 上限 */
export function maxFor(metric: Metric, field: "w" | "r"): number {
  if (field === "w") return LIMITS.weight;
  return metric === "seconds" ? LIMITS.seconds : metric === "minutes" ? LIMITS.minutes : LIMITS.reps;
}

/** 重さは 0.25kg 単位、回数などは整数に丸めて範囲に収める */
export function clampValue(v: number, metric: Metric, field: "w" | "r"): number {
  const max = maxFor(metric, field);
  const x = Math.min(max, Math.max(0, v));
  return field === "w" ? Math.round(x * 4) / 4 : Math.round(x);
}

/** 「＋」「−」。刻みの倍数にそろえてから1刻み動かす（例: 刻み2.5で 41 → ＋ → 42.5） */
export function stepValue(v: number, step: number, dir: 1 | -1, metric: Metric, field: "w" | "r"): number {
  const q = Math.round(step * 100);
  const cur = Math.round(clampValue(v, metric, field) * 100); // 上限を超えた数からでも1刻みで動く
  const aligned = dir > 0 ? Math.floor(cur / q) * q + q : Math.ceil(cur / q) * q - q;
  return clampValue(aligned / 100, metric, field);
}

/** 回数・秒・分の「＋」「−」の刻み */
export function repStep(metric: Metric): number {
  return metric === "seconds" ? 5 : 1;
}

// ---- 記録の読み取り ----

export const usesWeight = (m: Metric): boolean => m === "weight";

export function totalSets(w: Workout): number {
  return w.items.reduce((n, it) => n + it.sets.length, 0);
}

/** 総重量 = Σ(重さ × 回数)。重さのない記録は数えない */
export function volumeOf(w: Workout): number {
  let v = 0;
  for (const it of w.items) for (const s of it.sets) if (s.w != null) v += s.w * s.r;
  return Math.round(v * 100) / 100;
}

export const isDone = (w: Workout): boolean => w.endedAt !== null && totalSets(w) > 0;

/** 新しい順 */
export function sortedDesc(workouts: Workout[]): Workout[] {
  return [...workouts].sort((a, b) => b.startedAt - a.startedAt);
}

/** その種目を最後にやったときの記録（今のワークアウトは除く） */
export function lastItemFor(
  workouts: Workout[],
  exId: string,
  excludeId?: string,
): { workout: Workout; sets: SetEntry[] } | null {
  for (const w of sortedDesc(workouts)) {
    if (w.id === excludeId) continue;
    const it = w.items.find((x) => x.exId === exId && x.sets.length > 0);
    if (it) return { workout: w, sets: it.sets };
  }
  return null;
}

/** 次のセットの入力の初期値。今日の直前のセット → 前回の同じ番目 → 前回の最後 → 種目ごとの初期値 */
export function suggestNext(current: SetEntry[], prev: SetEntry[] | null, metric: Metric): SetEntry {
  const pick = current[current.length - 1] ?? prev?.[current.length] ?? prev?.[prev.length - 1];
  if (pick) return { w: usesWeight(metric) ? (pick.w ?? 0) : null, r: pick.r };
  return defaultSet(metric);
}

export function defaultSet(metric: Metric): SetEntry {
  switch (metric) {
    case "weight":
      return { w: 20, r: 10 };
    case "reps":
      return { w: null, r: 10 };
    case "seconds":
      return { w: null, r: 30 };
    case "minutes":
      return { w: null, r: 10 };
  }
}

/** 比べるための強さ。重さのある種目は推定1回最大（Epley 式）、それ以外は回数・秒・分 */
export function strength(s: SetEntry, metric: Metric): number {
  if (usesWeight(metric)) {
    const w = s.w ?? 0;
    return s.r <= 0 ? 0 : w * (1 + s.r / 30);
  }
  return s.r;
}

export interface Best {
  /** いちばん重い重さ（重さのある種目） */
  maxW: number | null;
  /** その重さでの最多回数 */
  repsAtMaxW: number;
  /** 回数・秒・分の最高 */
  maxR: number;
}

/** これまでの最高（今のワークアウトは除く）。記録がなければ null */
export function bestFor(workouts: Workout[], exId: string, excludeId?: string): Best | null {
  let b: Best | null = null;
  for (const w of workouts) {
    if (w.id === excludeId) continue;
    for (const it of w.items) {
      if (it.exId !== exId) continue;
      for (const s of it.sets) {
        if (!b) b = { maxW: null, repsAtMaxW: 0, maxR: 0 };
        if (s.w != null && s.r > 0) {
          if (b.maxW === null || s.w > b.maxW) {
            b.maxW = s.w;
            b.repsAtMaxW = s.r;
          } else if (s.w === b.maxW && s.r > b.repsAtMaxW) b.repsAtMaxW = s.r;
        }
        if (s.r > b.maxR) b.maxR = s.r;
      }
    }
  }
  return b;
}

/** このセットが自己ベストか。初めての種目では出さない */
export function isRecord(s: SetEntry, best: Best | null, metric: Metric): boolean {
  if (!best || s.r <= 0) return false;
  if (usesWeight(metric)) {
    if (s.w == null) return false;
    if (best.maxW === null) return s.w > 0;
    return s.w > best.maxW || (s.w === best.maxW && s.r > best.repsAtMaxW);
  }
  return s.r > best.maxR;
}

export type Trend = "record" | "up" | "same" | "down" | "first";

/** 前回の同じ番目のセット（なければ前回の最後）と比べる */
export function compareSet(
  s: SetEntry,
  index: number,
  prev: SetEntry[] | null,
  best: Best | null,
  metric: Metric,
): Trend {
  if (isRecord(s, best, metric)) return "record";
  const p = prev?.[index] ?? prev?.[prev.length - 1];
  if (!p) return "first";
  const a = strength(s, metric);
  const b = strength(p, metric);
  if (Math.abs(a - b) < 1e-9) return "same";
  return a > b ? "up" : "down";
}

/** 1つの種目の今日と前回の差。重さのある種目は総重量、それ以外は合計の回数・秒・分 */
export function itemAmount(sets: SetEntry[], metric: Metric): number {
  let v = 0;
  for (const s of sets) v += usesWeight(metric) ? (s.w ?? 0) * s.r : s.r;
  return Math.round(v * 100) / 100;
}

export interface ItemSummary {
  exId: string;
  sets: number;
  amount: number;
  /** 前回との差。前回がなければ null */
  diff: number | null;
  records: number;
}

/** 終わったワークアウトのまとめ（前回比・自己ベストの数） */
export function summarize(w: Workout, all: Workout[], exercises: Exercise[]): {
  items: ItemSummary[];
  sets: number;
  volume: number;
  records: number;
  improved: number;
  minutes: number;
} {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const before = all.filter((x) => x.id !== w.id && x.startedAt < w.startedAt);
  const items: ItemSummary[] = [];
  for (const it of w.items) {
    if (it.sets.length === 0) continue;
    const metric = byId.get(it.exId)?.metric ?? "weight";
    const prev = lastItemFor(before, it.exId);
    let best = bestFor(before, it.exId);
    let records = 0;
    for (const s of it.sets) {
      if (isRecord(s, best, metric)) {
        records++;
        best = mergeBest(best, s);
      }
    }
    const amount = itemAmount(it.sets, metric);
    items.push({
      exId: it.exId,
      sets: it.sets.length,
      amount,
      diff: prev ? Math.round((amount - itemAmount(prev.sets, metric)) * 100) / 100 : null,
      records,
    });
  }
  return {
    items,
    sets: totalSets(w),
    volume: volumeOf(w),
    records: items.reduce((n, i) => n + i.records, 0),
    improved: items.filter((i) => i.diff !== null && i.diff > 0).length,
    minutes: Math.max(0, Math.round(((w.endedAt ?? w.startedAt) - w.startedAt) / 60000)),
  };
}

/** セットを加えたあとの最高 */
export function mergeBest(b: Best | null, s: SetEntry): Best {
  const n: Best = b ? { ...b } : { maxW: null, repsAtMaxW: 0, maxR: 0 };
  if (s.w != null && s.r > 0) {
    if (n.maxW === null || s.w > n.maxW) {
      n.maxW = s.w;
      n.repsAtMaxW = s.r;
    } else if (s.w === n.maxW && s.r > n.repsAtMaxW) n.repsAtMaxW = s.r;
  }
  if (s.r > n.maxR) n.maxR = s.r;
  return n;
}

/** 種目の伸び（グラフ用）。古い順に、日ごとのいちばん良い値。重さのある種目は最高の重さ */
export function progress(workouts: Workout[], exId: string, metric: Metric, limit = 12): { date: string; value: number }[] {
  const out: { date: string; value: number }[] = [];
  for (const w of [...workouts].sort((a, b) => a.startedAt - b.startedAt)) {
    const it = w.items.find((x) => x.exId === exId && x.sets.length > 0);
    if (!it) continue;
    const value = Math.max(...it.sets.map((s) => (usesWeight(metric) ? (s.w ?? 0) : s.r)));
    out.push({ date: w.date, value });
  }
  return out.slice(-limit);
}

// ---- 週と続けた記録 ----

/** 今週（月〜日）にやった曜日 */
export function weekMarks(workouts: Workout[], today: string): boolean[] {
  const mon = mondayOf(today);
  const marks = new Array<boolean>(7).fill(false);
  for (const w of workouts) {
    if (!isDone(w)) continue;
    const d = daysBetween(w.date, mon);
    if (d >= 0 && d < 7) marks[d] = true;
  }
  return marks;
}

/** 続けている週の数。今週まだでも先週までが続いていれば途切れにしない */
export function streakWeeks(workouts: Workout[], today: string): number {
  const weeks = new Set(workouts.filter(isDone).map((w) => mondayOf(w.date)));
  let mon = mondayOf(today);
  if (!weeks.has(mon)) mon = addDays(mon, -7);
  let n = 0;
  while (weeks.has(mon)) {
    n++;
    mon = addDays(mon, -7);
  }
  return n;
}

/** 前回から何日たったか。記録がなければ null */
export function daysSinceLast(workouts: Workout[], today: string): number | null {
  const dates = workouts.filter(isDone).map((w) => w.date).filter((d) => d <= today);
  if (dates.length === 0) return null;
  return daysBetween(today, dates.sort().at(-1)!);
}

// ---- 今日のおすすめ ----

export type Side = "upper" | "lower";
export const UPPER: readonly Part[] = ["chest", "back", "shoulder", "arm"];
export const sideOf = (p: Part): Side | null => (UPPER.includes(p) ? "upper" : p === "leg" ? "lower" : null);

export interface Recommendation {
  kind: Side | "rest";
  reason: string;
}

const SIDE_LABEL: Record<Side, string> = { upper: "上半身", lower: "下半身" };

/** 上半身と下半身を交互に。お腹と有酸素は数えない。今日やった・2日続けたなら休み */
export function recommend(workouts: Workout[], exercises: Exercise[], today: string): Recommendation {
  const done = workouts.filter(isDone);
  if (done.some((w) => w.date === today)) return { kind: "rest", reason: "今日はもうやりました。よく休みましょう" };
  const dates = new Set(done.map((w) => w.date));
  if (dates.has(addDays(today, -1)) && dates.has(addDays(today, -2)))
    return { kind: "rest", reason: "2日続けてやりました。今日は休む日にしましょう" };
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const last: Record<Side, string | null> = { upper: null, lower: null };
  for (const w of done) {
    for (const it of w.items) {
      const ex = byId.get(it.exId);
      if (!ex || it.sets.length === 0) continue;
      const side = sideOf(ex.part);
      if (side && (last[side] === null || w.date > last[side]!)) last[side] = w.date;
    }
  }
  if (last.upper === null && last.lower === null)
    return { kind: "upper", reason: "まずは上半身から。マシンなら軽い重さで始めましょう" };
  const pick: Side =
    last.upper === null ? "upper" : last.lower === null ? "lower" : last.upper <= last.lower ? "upper" : "lower";
  const d = last[pick];
  if (d === null) return { kind: pick, reason: `${SIDE_LABEL[pick]}はまだ記録がありません` };
  const [, m, day] = d.split("-").map(Number);
  return { kind: pick, reason: `${SIDE_LABEL[pick]}は${daysBetween(today, d)}日あいています（前回 ${m}/${day}）` };
}

/** おすすめの種目。前回その側でやった種目、なければ見本の順 */
export function suggestedExercises(workouts: Workout[], exercises: Exercise[], side: Side, max = 4): string[] {
  const visible = exercises.filter((e) => !e.hidden && sideOf(e.part) === side);
  const ids = new Set(visible.map((e) => e.id));
  for (const w of sortedDesc(workouts.filter(isDone))) {
    const hit = w.items.filter((it) => ids.has(it.exId) && it.sets.length > 0).map((it) => it.exId);
    if (hit.length > 0) return hit.slice(0, max);
  }
  return visible.slice(0, max).map((e) => e.id);
}

/** 前回の種目の並び（「前回と同じ」で始めるとき） */
export function lastMenu(workouts: Workout[]): WorkoutItem["exId"][] {
  const w = sortedDesc(workouts.filter(isDone))[0];
  return w ? w.items.filter((it) => it.sets.length > 0).map((it) => it.exId) : [];
}

// ---- 書き出し ----

export function toCsv(workouts: Workout[], exercises: Exercise[]): string {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const esc = (s: string) => {
    const t = /^[=+\-@]/.test(s) ? `'${s}` : s; // 表計算ソフトで式として動かないように
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lines = ["date,exercise,set,weight_kg,count,unit"];
  for (const w of [...workouts].sort((a, b) => a.startedAt - b.startedAt)) {
    if (w.endedAt === null) continue;
    for (const it of w.items) {
      const ex = byId.get(it.exId);
      const unit = { weight: "reps", reps: "reps", seconds: "sec", minutes: "min" }[ex?.metric ?? "weight"];
      it.sets.forEach((s, i) => lines.push(`${w.date},${esc(ex?.name ?? it.exId)},${i + 1},${s.w ?? ""},${s.r},${unit}`));
    }
  }
  return lines.join("\n") + "\n";
}

// ---- 表示用 ----

export function fmtNum(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("ja-JP") : n.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export const UNIT: Record<Metric, string> = { weight: "回", reps: "回", seconds: "秒", minutes: "分" };

export function fmtSet(s: SetEntry, metric: Metric): string {
  return usesWeight(metric) ? `${fmtNum(s.w ?? 0)}kg×${s.r}` : `${s.r}${UNIT[metric]}`;
}

export function fmtDiff(n: number, metric: Metric): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
  const unit = usesWeight(metric) ? "kg" : UNIT[metric];
  return `${sign}${fmtNum(Math.abs(n))}${unit}`;
}
