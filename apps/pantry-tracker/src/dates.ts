// 日付の計算（純関数）。期限は「暦の日付」なので、時刻や時差を持たない YYYY-MM-DD の文字列で扱う。
// 日数の差は、日付を「1970-01-01 からの通し番号」に直して引き算する（夏時間の 23 時間・25 時間の日でもずれない）。

export type Ymd = string; // "2026-10-23"

const RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const isLeapYear = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export function daysInMonth(y: number, m: number): number {
  return [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/** "YYYY-MM-DD" を読む。存在しない日付（2月30日など）や範囲外の年は null */
export function parseYmd(s: unknown): { y: number; m: number; d: number } | null {
  if (typeof s !== "string") return null;
  const r = RE.exec(s);
  if (!r) return null;
  const y = Number(r[1]);
  const m = Number(r[2]);
  const d = Number(r[3]);
  if (y < 2000 || y > 2199 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

export const isYmd = (s: unknown): s is Ymd => parseYmd(s) !== null;

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
export const ymd = (y: number, m: number, d: number): Ymd => `${pad(y, 4)}-${pad(m)}-${pad(d)}`;

/** 日付 → 通し番号（1970-01-01 = 0）。UTC の暦で数えるので端末の時差に左右されない */
export function toDayNumber(s: Ymd): number {
  const p = parseYmd(s);
  if (!p) throw new RangeError(`日付ではありません: ${s}`);
  return Date.UTC(p.y, p.m - 1, p.d) / 86_400_000;
}

export function fromDayNumber(n: number): Ymd {
  const dt = new Date(n * 86_400_000);
  return ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export const addDays = (s: Ymd, n: number): Ymd => fromDayNumber(toDayNumber(s) + n);

/** 月を足す。行き先の月に同じ日がなければ月末にそろえる（1/31 + 1か月 = 2/28、うるう年は 2/29） */
export function addMonths(s: Ymd, n: number): Ymd {
  const p = parseYmd(s);
  if (!p) throw new RangeError(`日付ではありません: ${s}`);
  const idx = p.y * 12 + (p.m - 1) + n;
  const y = Math.floor(idx / 12);
  const m = (idx % 12) + 1;
  return ymd(y, m, Math.min(p.d, daysInMonth(y, m)));
}

/** to − from の日数（同じ日なら 0、to が明日なら 1） */
export const daysBetween = (from: Ymd, to: Ymd): number => toDayNumber(to) - toDayNumber(from);

/**
 * いまの時刻から「今日の日付」を出す。timeZone を省くと端末の時差で数える。
 * 例: 2026-10-23T15:30Z は東京では 10/24、ニューヨークでは 10/23。
 */
export function todayYmd(now: Date, timeZone?: string): Ymd {
  if (!timeZone) return ymd(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => Number(parts.find((x) => x.type === t)!.value);
  return ymd(get("year"), get("month"), get("day"));
}

/** 画面用の短い日付「10/23（金）」 */
export function formatShort(s: Ymd): string {
  const p = parseYmd(s);
  if (!p) return "";
  const w = "日月火水木金土"[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
  return `${p.m}/${p.d}（${w}）`;
}
