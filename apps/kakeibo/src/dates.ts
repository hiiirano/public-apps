// 日付の計算（端末の時刻帯に左右されないよう、文字列と整数だけで扱う）

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** 月の日数。month は 1〜12 */
export function daysInMonthOf(y: number, m: number): number {
  if (m === 2) return isLeapYear(y) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** "YYYY-MM" を年と月に。形が違えば null */
export function parseMonth(s: string): { y: number; m: number } | null {
  const r = /^(\d{4})-(\d{2})$/.exec(s);
  if (!r) return null;
  const y = Number(r[1]);
  const m = Number(r[2]);
  if (y < MIN_YEAR || y > MAX_YEAR || m < 1 || m > 12) return null;
  return { y, m };
}

export const isMonthKey = (s: unknown): s is string => typeof s === "string" && parseMonth(s) !== null;

export function daysInMonth(month: string): number {
  const p = parseMonth(month);
  if (!p) throw new Error(`月の形が違います: ${month}`);
  return daysInMonthOf(p.y, p.m);
}

/** 実在する "YYYY-MM-DD" か（2月30日などは false） */
export function isDateKey(s: unknown): s is string {
  if (typeof s !== "string") return false;
  const r = /^(\d{4}-\d{2})-(\d{2})$/.exec(s);
  if (!r) return false;
  const p = parseMonth(r[1]);
  const d = Number(r[2]);
  return !!p && d >= 1 && d <= daysInMonthOf(p.y, p.m);
}

export const monthOf = (date: string): string => date.slice(0, 7);
export const dayOf = (date: string): number => Number(date.slice(8, 10));

const pad = (n: number) => String(n).padStart(2, "0");
export const monthKey = (y: number, m: number) => `${y}-${pad(m)}`;
export const dateKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** 端末の今日（ここだけが時計を読む） */
export function todayKey(now: Date = new Date()): string {
  return dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** 月を n か月ずらす。範囲（2000〜2100年）の外へは出ない */
export function addMonths(month: string, n: number): string {
  const p = parseMonth(month);
  if (!p) throw new Error(`月の形が違います: ${month}`);
  let idx = p.y * 12 + (p.m - 1) + n;
  idx = Math.min(MAX_YEAR * 12 + 11, Math.max(MIN_YEAR * 12, idx));
  return monthKey(Math.floor(idx / 12), (idx % 12) + 1);
}

/** 曜日（0=日）。ツェラーの公式で、時刻帯に左右されない */
export function weekdayOf(date: string): number {
  let y = Number(date.slice(0, 4));
  let m = Number(date.slice(5, 7));
  const d = dayOf(date);
  if (m < 3) {
    m += 12;
    y -= 1;
  }
  const k = y % 100;
  const j = Math.floor(y / 100);
  const h = (d + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) + 5 * j) % 7;
  return (h + 6) % 7;
}

const WD = ["日", "月", "火", "水", "木", "金", "土"];

/** 「10月23日（木）」 */
export function dayLabel(date: string): string {
  return `${Number(date.slice(5, 7))}月${dayOf(date)}日（${WD[weekdayOf(date)]}）`;
}

/** 「2026年10月」 */
export function monthLabel(month: string): string {
  const p = parseMonth(month)!;
  return `${p.y}年${p.m}月`;
}

/** 表示中の月に書くときの日付の初期値。今月なら今日、ほかの月はその月の1日 */
export function defaultDateFor(month: string, today: string): string {
  return monthOf(today) === month ? today : `${month}-01`;
}
