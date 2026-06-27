// localStorage 永続化（読み込み失敗時は壊さず空にフォールバック）

import {
  type Card,
  type CardPair,
  type Deck,
  type ExportData,
  type SeedDeck,
  INITIAL_EASE,
  SEED_DECKS,
} from "./types";

const DECKS_KEY = "flashcards.decks";
const CARDS_KEY = "flashcards.cards";
const SEEDED_KEY = "flashcards.seeded";

/** 軽量な一意ID */
export function newId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

// ---- 正規化 ----

function isDeck(x: unknown): x is Deck {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.name === "string";
}

function isCardLike(x: unknown): x is Record<string, unknown> {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.deckId === "string" &&
    typeof o.front === "string" &&
    typeof o.back === "string"
  );
}

/** 保存済みカードに後方互換の既定値を埋める */
export function normalizeCard(raw: Record<string, unknown>): Card {
  const now = new Date().toISOString();
  const num = (v: unknown, d: number): number =>
    typeof v === "number" && Number.isFinite(v) ? v : d;
  return {
    id: String(raw.id),
    deckId: String(raw.deckId),
    front: String(raw.front),
    back: String(raw.back),
    repetitions: Math.max(0, Math.trunc(num(raw.repetitions, 0))),
    interval: Math.max(0, num(raw.interval, 0)),
    easeFactor: num(raw.easeFactor, INITIAL_EASE),
    due: typeof raw.due === "string" ? raw.due : undefined,
    reviews: Math.max(0, Math.trunc(num(raw.reviews, 0))),
    lastReviewed:
      typeof raw.lastReviewed === "string" ? raw.lastReviewed : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : typeof raw.createdAt === "string"
          ? raw.createdAt
          : now,
  };
}

// ---- ロード/セーブ ----

export function loadDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDeck);
  } catch {
    return [];
  }
}

export function loadCards(): Card[] {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCardLike).map(normalizeCard);
  } catch {
    return [];
  }
}

export function saveDecks(decks: Deck[]): void {
  try {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch {
    // 容量超過等は黙って無視
  }
}

export function saveCards(cards: Card[]): void {
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch {
    // 容量超過等は黙って無視
  }
}

// ---- 生成ヘルパー ----

export function makeDeck(name: string): Deck {
  return {
    id: newId("dk"),
    name: name.trim() || "無題のデッキ",
    createdAt: new Date().toISOString(),
  };
}

/** 表裏ペアから新規カードを作る（SRS は未学習状態） */
export function makeCard(deckId: string, pair: CardPair): Card {
  const now = new Date().toISOString();
  return {
    id: newId("cd"),
    deckId,
    front: pair.front.trim(),
    back: pair.back.trim(),
    repetitions: 0,
    interval: 0,
    easeFactor: INITIAL_EASE,
    reviews: 0,
    createdAt: now,
    updatedAt: now,
  };
}

// ---- 初回シード ----

/** 初回のみサンプルデッキを投入する（once）。投入した {decks, cards} を返す */
export function seedIfFirstRun(): { decks: Deck[]; cards: Card[] } | null {
  try {
    if (localStorage.getItem(SEEDED_KEY)) return null;
    if (loadDecks().length > 0) {
      localStorage.setItem(SEEDED_KEY, "1");
      return null;
    }
  } catch {
    return null;
  }
  const decks: Deck[] = [];
  const cards: Card[] = [];
  for (const seed of SEED_DECKS as SeedDeck[]) {
    const deck = makeDeck(seed.name);
    decks.push(deck);
    for (const pair of seed.cards) cards.push(makeCard(deck.id, pair));
  }
  saveDecks(decks);
  saveCards(cards);
  try {
    localStorage.setItem(SEEDED_KEY, "1");
  } catch {
    // ignore
  }
  return { decks, cards };
}

// ---- エクスポート/インポート ----

export function buildExport(decks: Deck[], cards: Card[]): ExportData {
  return { version: 1, decks, cards };
}

/**
 * エクスポートJSONを解釈して {decks, cards} を返す（壊れた値は除外/正規化）。
 * 解釈できなければ null。
 */
export function parseImport(
  json: string,
): { decks: Deck[]; cards: Card[] } | null {
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as Record<string, unknown>;
  const decks = Array.isArray(o.decks) ? o.decks.filter(isDeck) : [];
  const cards = Array.isArray(o.cards)
    ? o.cards.filter(isCardLike).map(normalizeCard)
    : [];
  if (decks.length === 0 && cards.length === 0) return null;
  return { decks, cards };
}
