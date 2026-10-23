// 在庫の判定・操作・集計（純関数）。画面からは切り離してある。
import type { Art, Place } from "./catalog";
import { PLACES } from "./catalog";
import { addDays, daysBetween, toDayNumber, type Ymd } from "./dates";

export const NAME_MAX = 20;
export const QTY_MAX = 99;
export const ITEMS_MAX = 300;
export const LOG_MAX = 2000;

export interface Item {
  id: string;
  name: string;
  art: Art;
  place: Place;
  qty: number; // 1〜99 の整数
  expiry: Ymd | null; // 期限（なし = null）
  addedOn: Ymd;
}

export type Outcome = "used" | "wasted";

export interface LogEntry {
  id: string;
  name: string;
  art: Art;
  outcome: Outcome;
  qty: number;
  date: Ymd;
}

export interface State {
  items: Item[];
  log: LogEntry[];
  /** よく買う物を押した回数（名前ごと）。ボタンの並び順に使う */
  freq: Record<string, number>;
}

export const emptyState = (): State => ({ items: [], log: [], freq: {} });

// ---- 期限の近さ ----
export type Level = "expired" | "today" | "soon" | "week" | "ok" | "none";

/** 期限までの日数（期限なしは null）。今日が期限なら 0、昨日なら −1 */
export const daysLeft = (expiry: Ymd | null, today: Ymd): number | null =>
  expiry === null ? null : daysBetween(today, expiry);

export function levelOf(days: number | null): Level {
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days === 0) return "today";
  if (days <= 2) return "soon";
  if (days <= 6) return "week";
  return "ok";
}

/** 期限の近さを短い言葉で。「今日まで」「明日まで」「あと5日」「2日すぎ」「期限なし」 */
export function expiryLabel(days: number | null): string {
  if (days === null) return "期限なし";
  if (days < 0) return `${-days}日すぎ`;
  if (days === 0) return "今日まで";
  if (days === 1) return "明日まで";
  return `あと${days}日`;
}

/** 急ぐ物（期限切れ・今日・2日以内） */
export const isUrgent = (l: Level): boolean => l === "expired" || l === "today" || l === "soon";

/** 期限が近い順（期限なしは最後）。同じなら入れた順 */
export function sortByExpiry(items: readonly Item[]): Item[] {
  const key = (it: Item) => (it.expiry === null ? Number.POSITIVE_INFINITY : toDayNumber(it.expiry));
  return [...items].sort((a, b) => key(a) - key(b) || (a.addedOn < b.addedOn ? -1 : a.addedOn > b.addedOn ? 1 : 0) || (a.id < b.id ? -1 : 1));
}

export function byPlace(items: readonly Item[]): Record<Place, Item[]> {
  const out = { fridge: [], freezer: [], shelf: [] } as Record<Place, Item[]>;
  for (const it of sortByExpiry(items)) out[it.place].push(it);
  return out;
}

export interface Counts {
  expired: number;
  today: number;
  soon: number;
  total: number;
}

export function countLevels(items: readonly Item[], today: Ymd): Counts {
  const c: Counts = { expired: 0, today: 0, soon: 0, total: items.length };
  for (const it of items) {
    const l = levelOf(daysLeft(it.expiry, today));
    if (l === "expired") c.expired++;
    else if (l === "today") c.today++;
    else if (l === "soon") c.soon++;
  }
  return c;
}

// ---- 操作（元の状態は変えず、新しい状態を返す）----
export interface NewItem {
  name: string;
  art: Art;
  place: Place;
  qty: number;
  expiry: Ymd | null;
}

export const clampQty = (n: number): number => Math.min(QTY_MAX, Math.max(1, Math.round(Number.isFinite(n) ? n : 1)));
export const cleanName = (s: string): string => s.replace(/\s+/g, " ").trim().slice(0, NAME_MAX);

/** 期限の初期値: 買った日 + 日数（日数 null なら期限なし） */
export const defaultExpiry = (today: Ymd, days: number | null): Ymd | null => (days === null ? null : addDays(today, days));

export function addItem(s: State, n: NewItem, id: string, today: Ymd): State {
  const name = cleanName(n.name);
  if (!name || s.items.length >= ITEMS_MAX) return s;
  const item: Item = { id, name, art: n.art, place: PLACES.includes(n.place) ? n.place : "fridge", qty: clampQty(n.qty), expiry: n.expiry, addedOn: today };
  return { ...s, items: [...s.items, item] };
}

/** よく買う物を押した回数を数える */
export function bump(s: State, presetName: string): State {
  return { ...s, freq: { ...s.freq, [presetName]: Math.min(9999, (s.freq[presetName] ?? 0) + 1) } };
}

export function updateItem(s: State, id: string, patch: Partial<NewItem>): State {
  return {
    ...s,
    items: s.items.map((it) => {
      if (it.id !== id) return it;
      const name = patch.name === undefined ? it.name : cleanName(patch.name) || it.name;
      return {
        ...it,
        ...patch,
        name,
        qty: patch.qty === undefined ? it.qty : clampQty(patch.qty),
      };
    }),
  };
}

/**
 * 「使い切った」「捨てた」。1つ分を記録し、数を1つ減らす（0 になったら在庫から消す）。
 * all = true なら残り全部をまとめて記録する。
 */
export function consume(s: State, id: string, outcome: Outcome, today: Ymd, logId: string, all = false): State {
  const it = s.items.find((x) => x.id === id);
  if (!it) return s;
  const qty = all ? it.qty : 1;
  const entry: LogEntry = { id: logId, name: it.name, art: it.art, outcome, qty, date: today };
  const items = it.qty - qty <= 0 ? s.items.filter((x) => x.id !== id) : s.items.map((x) => (x.id === id ? { ...x, qty: x.qty - qty } : x));
  const log = [...s.log, entry].slice(-LOG_MAX);
  return { ...s, items, log };
}

/** 記録せずに消す（まちがえて入れたとき） */
export const removeItem = (s: State, id: string): State => ({ ...s, items: s.items.filter((x) => x.id !== id) });

// ---- 集計（買いすぎに気づくため）----
export interface NameStat {
  name: string;
  art: Art;
  used: number;
  wasted: number;
}

export interface Stats {
  days: number;
  used: number;
  wasted: number;
  /** 捨てた割合（0〜100 の整数。記録がなければ null） */
  wasteRate: number | null;
  /** 捨てた数が多い順（捨てた物があるものだけ。最大5件） */
  topWasted: NameStat[];
  /** 買いすぎかも: 期間内に2つ以上捨てていて、捨てた数が使った数以上の物 */
  overbuy: NameStat[];
}

/** 直近 days 日（今日を含む）の記録をまとめる */
export function stats(log: readonly LogEntry[], today: Ymd, days = 30): Stats {
  const end = toDayNumber(today);
  const start = end - (days - 1);
  const byName = new Map<string, NameStat>();
  let used = 0;
  let wasted = 0;
  for (const e of log) {
    const d = toDayNumber(e.date);
    if (d < start || d > end) continue;
    const st = byName.get(e.name) ?? { name: e.name, art: e.art, used: 0, wasted: 0 };
    st[e.outcome] += e.qty;
    byName.set(e.name, st);
    if (e.outcome === "used") used += e.qty;
    else wasted += e.qty;
  }
  const all = [...byName.values()];
  const topWasted = all
    .filter((x) => x.wasted > 0)
    .sort((a, b) => b.wasted - a.wasted || a.used - b.used || (a.name < b.name ? -1 : 1))
    .slice(0, 5);
  const overbuy = topWasted.filter((x) => x.wasted >= 2 && x.wasted >= x.used);
  const total = used + wasted;
  return { days, used, wasted, wasteRate: total === 0 ? null : Math.round((wasted / total) * 100), topWasted, overbuy };
}
