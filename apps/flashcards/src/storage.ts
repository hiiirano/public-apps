// 暗記カード — 端末への保存、書き出し・読み込み、形と範囲の検査
import {
  type Card,
  type CardPair,
  type Data,
  type Deck,
  type DeckArt,
  DECK_ARTS,
  DEFAULT_NEW_PER_DAY,
  INITIAL_EASE,
  MAX_CARDS,
  MAX_DAYS,
  MAX_DECKS,
  MAX_EASE,
  MAX_INTERVAL,
  MIN_EASE,
  NAME_MAX,
  NEW_PER_DAY_CHOICES,
  TEXT_MAX,
} from "./types";
import { parseYmd } from "./srs";

export const KEY = "flashcards.v2";
/** 読めなかった保存内容の控え（消さずに残す） */
export const BROKEN_KEY = "flashcards.v2.broken";
/** 前の版（v1）のキー。v2 がなければ読み込んで移す */
const LEGACY_DECKS = "flashcards.decks";
const LEGACY_CARDS = "flashcards.cards";

let seq = 0;
export const newId = (prefix: string): string =>
  `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function emptyData(): Data {
  return { version: 2, decks: [], cards: [], days: [], newPerDay: DEFAULT_NEW_PER_DAY };
}

export function makeDeck(name: string, art: DeckArt = "own", sample?: string): Deck {
  const deck: Deck = { id: newId("d"), name: cleanName(name), art, createdAt: new Date().toISOString() };
  if (sample) deck.sample = sample;
  return deck;
}

export function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, NAME_MAX) || "新しい単語帳";
}

/** 新しいカード。createdAt は並び順に使うので、まとめて作るときは i で少しずつずらす */
export function makeCard(deckId: string, p: CardPair, i = 0): Card {
  return {
    id: newId("c"),
    deckId,
    front: p.front.trim().slice(0, TEXT_MAX),
    back: p.back.trim().slice(0, TEXT_MAX),
    repetitions: 0,
    interval: 0,
    easeFactor: INITIAL_EASE,
    reviews: 0,
    lapses: 0,
    createdAt: new Date(Date.now() + i).toISOString(),
  };
}

// ---- 検査 ----

const isStr = (v: unknown, min: number, max: number): v is string =>
  typeof v === "string" && v.length >= min && v.length <= max;
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
const isYmd = (v: unknown): v is string => typeof v === "string" && parseYmd(v) !== null;
const isIso = (v: unknown): v is string => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));
const optYmd = (v: unknown) => v === undefined || isYmd(v);

/** id に使える文字（画面の切り替え #/deck/<id> と同じ）。合わない id は読み込み時に振り直す */
export const SAFE_ID = /^[A-Za-z0-9_-]{1,60}$/;
const isSafeId = (v: unknown): v is string => typeof v === "string" && SAFE_ID.test(v);

/** id 以外の形と範囲 */
function deckShape(d: any): boolean {
  return (
    !!d &&
    typeof d.id === "string" &&
    isStr(d.name, 1, NAME_MAX) &&
    DECK_ARTS.includes(d.art) &&
    (d.sample === undefined || isStr(d.sample, 1, 60)) &&
    isIso(d.createdAt)
  );
}

export function validDeck(d: any): d is Deck {
  return deckShape(d) && isSafeId(d.id);
}

function cardShape(c: any): boolean {
  return (
    !!c &&
    typeof c.id === "string" &&
    typeof c.deckId === "string" &&
    isStr(c.front, 1, TEXT_MAX) &&
    isStr(c.back, 1, TEXT_MAX) &&
    isInt(c.repetitions, 0, 100000) &&
    isInt(c.interval, 0, MAX_INTERVAL) &&
    typeof c.easeFactor === "number" &&
    c.easeFactor >= MIN_EASE &&
    c.easeFactor <= MAX_EASE &&
    isInt(c.reviews, 0, 1000000) &&
    isInt(c.lapses, 0, 1000000) &&
    optYmd(c.due) &&
    optYmd(c.introduced) &&
    optYmd(c.lastReviewed) &&
    (c.reviews === 0 ? c.due === undefined : c.due !== undefined) &&
    isIso(c.createdAt)
  );
}

export function validCard(c: any): c is Card {
  return cardShape(c) && isSafeId(c.id) && isSafeId(c.deckId);
}

const pickDeck = (d: Deck): Deck => {
  const o: Deck = { id: d.id, name: d.name, art: d.art, createdAt: d.createdAt };
  if (d.sample) o.sample = d.sample;
  return o;
};
const pickCard = (c: Card): Card => {
  const o: Card = {
    id: c.id,
    deckId: c.deckId,
    front: c.front,
    back: c.back,
    repetitions: c.repetitions,
    interval: c.interval,
    easeFactor: c.easeFactor,
    reviews: c.reviews,
    lapses: c.lapses,
    createdAt: c.createdAt,
  };
  if (c.due) o.due = c.due;
  if (c.introduced) o.introduced = c.introduced;
  if (c.lastReviewed) o.lastReviewed = c.lastReviewed;
  return o;
};

/**
 * 保存内容・書き出したファイルを読む。全体の形が違えば null。
 * 1冊・1枚ずつ検査し、壊れたものだけを除く（ほかの単語帳まで消さないため）。
 * 使えない文字の id は振り直す。上限（200冊・2万枚）を超えた分は over に数える。
 */
export function parseData(raw: string | null): { data: Data; dropped: number; over: number } | null {
  if (raw === null) return null;
  let o: any;
  try {
    o = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!o || typeof o !== "object" || o.version !== 2 || !Array.isArray(o.decks) || !Array.isArray(o.cards)) return null;
  const decks: Deck[] = [];
  const deckMap = new Map<string, string>(); // 元の id → 使う id（"" は上限を超えた単語帳）
  let over = 0;
  let dropped = 0;
  for (const d of o.decks) {
    if (!deckShape(d) || deckMap.has(d.id)) {
      dropped++;
      continue;
    }
    if (decks.length >= MAX_DECKS) {
      over++; // 黙って捨てず、over として知らせる
      deckMap.set(d.id, "");
      continue;
    }
    const id = isSafeId(d.id) && !decks.some((x) => x.id === d.id) ? d.id : newId("d");
    deckMap.set(d.id, id);
    decks.push(pickDeck({ ...d, id }));
  }
  const cards: Card[] = [];
  const cardIds = new Set<string>();
  for (const c of o.cards) {
    const deckId = cardShape(c) ? deckMap.get(c.deckId) : undefined;
    if (deckId === "") {
      over++;
      continue;
    }
    if (!deckId) {
      dropped++;
      continue;
    }
    if (cards.length >= MAX_CARDS) {
      over++;
      continue;
    }
    if (cardIds.has(c.id)) {
      dropped++; // 同じカードが2回
      continue;
    }
    const id: string = isSafeId(c.id) ? c.id : newId("c");
    cardIds.add(id);
    cards.push(pickCard({ ...c, id, deckId }));
  }
  const days = Array.isArray(o.days) ? [...new Set<string>(o.days.filter(isYmd))].sort().slice(-MAX_DAYS) : [];
  const newPerDay = (NEW_PER_DAY_CHOICES as readonly number[]).includes(o.newPerDay) ? o.newPerDay : DEFAULT_NEW_PER_DAY;
  return { data: { version: 2, decks, cards, days, newPerDay }, dropped, over };
}

/** 前の版（v1: デッキとカードを別々のキーに保存）を v2 に移す。読めなければ null */
export function migrateV1(decksRaw: string | null, cardsRaw: string | null): Data | null {
  try {
    const ds = JSON.parse(decksRaw ?? "null");
    const cs = JSON.parse(cardsRaw ?? "[]");
    if (!Array.isArray(ds) || !Array.isArray(cs)) return null;
    const now = new Date().toISOString();
    const decks = ds
      .filter((d: any) => d && isStr(d.id, 1, 60) && typeof d.name === "string")
      .map((d: any) => ({ id: d.id, name: cleanName(d.name), art: "own", createdAt: isIso(d.createdAt) ? d.createdAt : now }));
    const cards = cs
      .filter((c: any) => c && isStr(c.id, 1, 60) && isStr(c.deckId, 1, 60) && typeof c.front === "string" && typeof c.back === "string")
      .map((c: any) => {
        const reviews = isInt(c.reviews, 0, 1000000) ? c.reviews : 0;
        const due = reviews > 0 && isYmd(c.due) ? c.due : undefined;
        return {
          id: c.id,
          deckId: c.deckId,
          front: String(c.front).trim().slice(0, TEXT_MAX),
          back: String(c.back).trim().slice(0, TEXT_MAX),
          repetitions: due && isInt(c.repetitions, 0, 100000) ? c.repetitions : 0,
          interval: due && isInt(c.interval, 0, MAX_INTERVAL) ? c.interval : 0,
          easeFactor: typeof c.easeFactor === "number" ? Math.min(MAX_EASE, Math.max(MIN_EASE, c.easeFactor)) : INITIAL_EASE,
          reviews: due ? reviews : 0,
          lapses: 0,
          due,
          lastReviewed: due && isYmd(c.lastReviewed) ? c.lastReviewed : undefined,
          introduced: due && isYmd(c.lastReviewed) ? c.lastReviewed : undefined,
          createdAt: isIso(c.createdAt) ? c.createdAt : now,
        };
      });
    const r = parseData(JSON.stringify({ version: 2, decks, cards, days: [], newPerDay: DEFAULT_NEW_PER_DAY }));
    return r && r.data.decks.length ? r.data : null;
  } catch {
    return null;
  }
}

// ---- 端末への保存 ----

export interface Loaded {
  data: Data;
  note: "" | "broken" | "migrated" | "dropped";
}

export function load(): Loaded {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) {
      const v1 = migrateV1(localStorage.getItem(LEGACY_DECKS), localStorage.getItem(LEGACY_CARDS));
      return v1 ? { data: v1, note: "migrated" } : { data: emptyData(), note: "" };
    }
    const r = parseData(raw);
    if (!r) {
      try {
        localStorage.setItem(BROKEN_KEY, raw);
      } catch {
        /* 控えを残せなくても続ける */
      }
      return { data: emptyData(), note: "broken" };
    }
    return { data: r.data, note: r.dropped || r.over ? "dropped" : "" };
  } catch {
    return { data: emptyData(), note: "" };
  }
}

/** 保存できたら true。プライベートブラウズや容量不足でも、めくることはできる */
export function save(d: Data): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

// ---- 書き出し・読み込み ----

export function exportJson(d: Data): string {
  return JSON.stringify({ app: "flashcards", exportedAt: new Date().toISOString(), ...d }, null, 1);
}

export function exportFileName(today: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `anki-cards-${today.getFullYear()}${p(today.getMonth() + 1)}${p(today.getDate())}.json`;
}

/**
 * 読み込んだデータを今のデータに足す（純関数）。
 * 同じ id の単語帳・カードは今のものを残す。上限を超える分は入れない。
 */
export function mergeData(cur: Data, inc: Data): { data: Data; decks: number; cards: number; skipped: number; over: number } {
  const deckIds = new Set(cur.decks.map((d) => d.id));
  const cardIds = new Set(cur.cards.map((c) => c.id));
  const wantDecks = inc.decks.filter((d) => !deckIds.has(d.id));
  const newDecks = wantDecks.slice(0, Math.max(0, MAX_DECKS - cur.decks.length));
  const allDeckIds = new Set([...deckIds, ...newDecks.map((d) => d.id)]);
  const wantCards = inc.cards.filter((c) => !cardIds.has(c.id));
  const newCards = wantCards.filter((c) => allDeckIds.has(c.deckId)).slice(0, Math.max(0, MAX_CARDS - cur.cards.length));
  return {
    data: {
      version: 2,
      decks: [...cur.decks, ...newDecks],
      cards: [...cur.cards, ...newCards],
      days: [...new Set([...cur.days, ...inc.days])].sort().slice(-MAX_DAYS),
      newPerDay: cur.newPerDay,
    },
    decks: newDecks.length,
    cards: newCards.length,
    skipped: inc.cards.length - wantCards.length,
    over: wantDecks.length - newDecks.length + (wantCards.length - newCards.length),
  };
}
