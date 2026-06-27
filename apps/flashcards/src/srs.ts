// flashcards 決定的コアロジック（純関数・副作用なし・LLM不要）
// SM-2 間隔反復アルゴリズム + 出題抽出 + デッキ集計。

import {
  type Card,
  type DeckSummary,
  type Grade,
  type SrsState,
  GRADE_INFO,
  INITIAL_EASE,
  MIN_EASE,
} from "./types";

/** YYYY-MM-DD を端末ローカルの 0時 Date に変換（不正なら null） */
export function parseYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null; // 2026-02-31 のようなロールオーバーを弾く
  }
  return date;
}

/** Date を YYYY-MM-DD（端末ローカル）に整形 */
export function toYmd(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/** today の 0時に正規化 */
export function startOfDay(today: Date): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

/** base の n 日後の YYYY-MM-DD */
export function addDays(base: Date, n: number): string {
  const d = startOfDay(base);
  d.setDate(d.getDate() + n);
  return toYmd(d);
}

/** 未学習カードの初期 SRS 状態 */
export function initialSrs(): SrsState {
  return {
    repetitions: 0,
    interval: 0,
    easeFactor: INITIAL_EASE,
    reviews: 0,
  };
}

/**
 * SM-2 で次の SRS 状態を計算する（純関数）。
 * quality < 3 を lapse（思い出せなかった）として扱う。
 */
export function reviewState(
  prev: SrsState,
  grade: Grade,
  today: Date,
): SrsState {
  const quality = GRADE_INFO[grade].quality;
  let { repetitions, interval, easeFactor } = prev;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  if (easeFactor < MIN_EASE) easeFactor = MIN_EASE;
  // 桁あふれ防止に小数2桁へ丸める（決定的）
  easeFactor = Math.round(easeFactor * 100) / 100;

  return {
    repetitions,
    interval,
    easeFactor,
    due: addDays(today, interval),
    reviews: prev.reviews + 1,
    lastReviewed: toYmd(startOfDay(today)),
  };
}

/** カードに評価を適用した新カードを返す（純関数・id等は保持） */
export function applyReview(card: Card, grade: Grade, today: Date): Card {
  const next = reviewState(card, grade, today);
  return { ...card, ...next, updatedAt: new Date(today.getTime()).toISOString() };
}

/** 未学習（まだ一度もレビューしていない）か */
export function isFresh(card: Card): boolean {
  return !card.due || card.reviews === 0;
}

/** 今日が出題対象（新規 or due<=today）か */
export function isDue(card: Card, today: Date): boolean {
  if (isFresh(card)) return true;
  const due = card.due ? parseYmd(card.due) : null;
  if (!due) return true;
  return due.getTime() <= startOfDay(today).getTime();
}

/**
 * 今日の学習キューを返す。
 * 並び：復習（due が古い順）→ 新規（作成が古い順）。
 */
export function buildQueue(cards: Card[], today: Date): Card[] {
  const reviews: Card[] = [];
  const fresh: Card[] = [];
  for (const c of cards) {
    if (!isDue(c, today)) continue;
    if (isFresh(c)) fresh.push(c);
    else reviews.push(c);
  }
  reviews.sort((a, b) => {
    const da = a.due ?? "";
    const db = b.due ?? "";
    if (da !== db) return da < db ? -1 : 1;
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });
  fresh.sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
  );
  return [...reviews, ...fresh];
}

/** デッキ単位の集計（純関数） */
export function summarizeDeck(cards: Card[], today: Date): DeckSummary {
  let fresh = 0;
  let due = 0;
  let learned = 0;
  let later = 0;
  for (const c of cards) {
    if (isFresh(c)) {
      fresh++;
      continue;
    }
    learned++;
    if (isDue(c, today)) due++;
    else later++;
  }
  return { total: cards.length, fresh, due, learned, later };
}
