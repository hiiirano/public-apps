// 暗記カード — 次に出す日の計算（純関数だけ。画面・保存には触れない）
// SM-2 をもとに、4つの答えで間隔がはっきり分かれるようにしたもの。日付は端末の暦日で数える。

import {
  type Card,
  type Grade,
  type SrsState,
  INITIAL_EASE,
  MAX_EASE,
  MAX_INTERVAL,
  MIN_EASE,
} from "./types";

// ---- 日付 ----

/** YYYY-MM-DD を端末の 0 時の Date に。形が違う・存在しない日なら null */
export function parseYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function toYmd(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** base の n 日後（暦日。夏時間でもずれない） */
export function addDays(base: Date, n: number): string {
  const d = startOfDay(base);
  d.setDate(d.getDate() + n);
  return toYmd(d);
}

/** a から b まで何日か（b が後なら正） */
export function daysBetween(a: string, b: string): number {
  const da = parseYmd(a);
  const db = parseYmd(b);
  if (!da || !db) return 0;
  return Math.round((Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) - Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 86400000);
}

// ---- 間隔の計算 ----

export function initialSrs(): SrsState {
  return { repetitions: 0, interval: 0, easeFactor: INITIAL_EASE, reviews: 0, lapses: 0 };
}

const QUALITY: Record<Grade, number> = { again: 2, hard: 3, good: 4, easy: 5 };
/** 1回目・2回目に思い出せたときの日数 */
const FIRST: Record<Exclude<Grade, "again">, number> = { hard: 1, good: 2, easy: 4 };
const SECOND: Record<Exclude<Grade, "again">, number> = { hard: 3, good: 6, easy: 10 };

const clampInterval = (n: number) => Math.min(MAX_INTERVAL, Math.max(1, Math.round(n)));

/** 次に出すまでの日数（1〜MAX_INTERVAL）。状態は変えない */
export function nextInterval(prev: SrsState, grade: Grade): number {
  if (grade === "again") return 1;
  const reps = prev.repetitions;
  if (reps <= 0) return FIRST[grade];
  if (reps === 1) return SECOND[grade];
  const base = Math.max(1, prev.interval);
  const ease = clampEase(prev.easeFactor);
  if (grade === "hard") return clampInterval(Math.max(base + 1, base * 1.2));
  if (grade === "good") return clampInterval(Math.max(base + 1, base * ease));
  return clampInterval(Math.max(base + 2, base * ease * 1.3));
}

function clampEase(e: number): number {
  if (!Number.isFinite(e)) return INITIAL_EASE;
  return Math.min(MAX_EASE, Math.max(MIN_EASE, e));
}

/** 答えに応じた新しい記録（純関数） */
export function reviewState(prev: SrsState, grade: Grade, today: Date): SrsState {
  const q = QUALITY[grade];
  const interval = nextInterval(prev, grade);
  const ease = clampEase(clampEase(prev.easeFactor) + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const todayYmd = toYmd(startOfDay(today));
  return {
    repetitions: grade === "again" ? 0 : Math.max(0, prev.repetitions) + 1,
    interval,
    easeFactor: Math.round(ease * 100) / 100,
    due: addDays(today, interval),
    reviews: prev.reviews + 1,
    lapses: prev.lapses + (grade === "again" ? 1 : 0),
    introduced: prev.introduced ?? todayYmd,
    lastReviewed: todayYmd,
  };
}

export function applyReview(card: Card, grade: Grade, today: Date): Card {
  return { ...card, ...reviewState(card, grade, today) };
}

/** ボタンに添える「次はいつ」の言葉 */
export function intervalLabel(days: number): string {
  if (days <= 1) return "あした";
  if (days === 2) return "あさって";
  if (days < 30) return `${days}日後`;
  if (days < 365) return `${Math.round(days / 30)}か月後`;
  return `${Math.round((days / 365) * 10) / 10}年後`;
}

// ---- 今日めくるカード ----

export const isFresh = (c: SrsState): boolean => c.reviews === 0 || !c.due;

/** 復習の日が来ているか（新しいカードは含めない） */
export function isDueReview(c: SrsState, today: Date): boolean {
  if (isFresh(c)) return false;
  return c.due! <= toYmd(startOfDay(today));
}

/** 今日すでに初めてめくった枚数 */
export function introducedToday(cards: readonly Card[], today: Date): number {
  const t = toYmd(startOfDay(today));
  return cards.filter((c) => c.introduced === t).length;
}

/**
 * 今日めくるカード（1冊ぶん）。
 * 復習（日が古い順）→ 新しいカード（入れた順、1日 newPerDay 枚まで。今日すでにめくった新しいカードも数える）。
 */
export function buildQueue(cards: readonly Card[], today: Date, newPerDay: number): Card[] {
  const reviews = cards.filter((c) => isDueReview(c, today));
  reviews.sort((a, b) => (a.due! < b.due! ? -1 : a.due! > b.due! ? 1 : cmpCreated(a, b)));
  const room = Math.max(0, newPerDay - introducedToday(cards, today));
  const fresh = cards.filter(isFresh).sort(cmpCreated).slice(0, room);
  return [...reviews, ...fresh];
}

function cmpCreated(a: Card, b: Card): number {
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export interface DeckSummary {
  total: number;
  fresh: number; // まだめくっていない
  due: number; // 今日の復習
  today: number; // 今日めくる枚数（復習＋今日の新しいカード）
  learned: number; // 一度でもめくった
  mastered: number; // 3回続けて思い出せた
}

export function summarize(cards: readonly Card[], today: Date, newPerDay: number): DeckSummary {
  let fresh = 0;
  let due = 0;
  let mastered = 0;
  for (const c of cards) {
    if (isFresh(c)) fresh++;
    else if (isDueReview(c, today)) due++;
    if (c.repetitions >= 3) mastered++;
  }
  const room = Math.max(0, newPerDay - introducedToday(cards, today));
  return { total: cards.length, fresh, due, today: due + Math.min(fresh, room), learned: cards.length - fresh, mastered };
}

// ---- めくっている最中（1回ぶん） ----

export interface Session {
  queue: string[]; // これからめくるカードの id
  done: number; // めくった回数
  first: number; // 始めたときの枚数
  counts: Record<Grade, number>;
}

export function startSession(ids: readonly string[]): Session {
  return { queue: [...ids], done: 0, first: ids.length, counts: { again: 0, hard: 0, good: 0, easy: 0 } };
}

/** 先頭のカードに答えたあと。「わからない」のカードは、少しあと（3枚後、足りなければ最後）にもう一度出す */
export function answerSession(s: Session, grade: Grade): Session {
  if (s.queue.length === 0) return s;
  const [head, ...rest] = s.queue;
  const queue = rest.slice();
  if (grade === "again") queue.splice(Math.min(3, queue.length), 0, head);
  return { queue, done: s.done + 1, first: s.first, counts: { ...s.counts, [grade]: s.counts[grade] + 1 } };
}

// ---- つづけた日数 ----

/** めくった日を足す（古い順・重複なし・新しい maxDays 件まで） */
export function addStudyDay(days: readonly string[], today: Date, maxDays: number): string[] {
  const t = toYmd(startOfDay(today));
  const set = new Set(days);
  set.add(t);
  return [...set].sort().slice(-maxDays);
}

/** 今日（まだなら昨日）までに何日つづけてめくったか */
export function streak(days: readonly string[], today: Date): number {
  const set = new Set(days);
  let d = startOfDay(today);
  if (!set.has(toYmd(d))) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  let n = 0;
  while (set.has(toYmd(d))) {
    n++;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  }
  return n;
}
