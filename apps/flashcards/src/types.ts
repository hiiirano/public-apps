// 暗記カード — 型と定数

/** めくったあとの4つの答え */
export type Grade = "again" | "hard" | "good" | "easy";
export const GRADES: readonly Grade[] = ["again", "hard", "good", "easy"];

export const GRADE_LABEL: Record<Grade, string> = {
  again: "わからない",
  hard: "むずかしい",
  good: "わかった",
  easy: "かんたん",
};

/** 単語帳の絵 */
export type DeckArt = "own" | "english" | "japan" | "element";
export const DECK_ARTS: readonly DeckArt[] = ["own", "english", "japan", "element"];

/** 次に出す日を決めるための記録（カードの中に持つ） */
export interface SrsState {
  repetitions: number; // 続けて思い出せた回数（「わからない」で 0）
  interval: number; // 次に出すまでの日数（0 = まだ一度もめくっていない）
  easeFactor: number; // 覚えやすさ（1.3〜3.0。大きいほど間隔がのびる）
  due?: string; // 次に出す日 YYYY-MM-DD。未設定 = まだめくっていない
  reviews: number; // めくった回数
  lapses: number; // 「わからない」の回数
  introduced?: string; // 初めてめくった日 YYYY-MM-DD（1日の新しいカードの数を数える）
  lastReviewed?: string; // 最後にめくった日 YYYY-MM-DD
}

export interface Card extends SrsState {
  id: string;
  deckId: string;
  front: string;
  back: string;
  createdAt: string; // ISO
}

export interface Deck {
  id: string;
  name: string;
  art: DeckArt;
  sample?: string; // 見本から入れた単語帳なら、その見本の id
  createdAt: string; // ISO
}

export interface Data {
  version: 2;
  decks: Deck[];
  cards: Card[];
  days: string[]; // めくった日（YYYY-MM-DD、古い順、重複なし）
  newPerDay: number; // 1冊あたり、1日に出す新しいカードの数
}

export interface CardPair {
  front: string;
  back: string;
}

// ---- 上限 ----
export const NAME_MAX = 30;
export const TEXT_MAX = 300;
export const MAX_DECKS = 200;
export const MAX_CARDS = 20000;
export const MAX_DAYS = 800;
export const NEW_PER_DAY_CHOICES = [5, 10, 20, 30, 50] as const;
export const DEFAULT_NEW_PER_DAY = 20;

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
export const MAX_INTERVAL = 3650; // 10年
