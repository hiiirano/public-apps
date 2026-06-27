// flashcards 型定義・定数・サンプルデッキseed

/** 4段階の自己評価ボタン */
export type Grade = "again" | "hard" | "good" | "easy";

export const ALL_GRADES: Grade[] = ["again", "hard", "good", "easy"];

/** 評価ボタンのラベルと SM-2 quality */
export const GRADE_INFO: Record<
  Grade,
  { label: string; quality: number; hint: string }
> = {
  again: { label: "もう一度", quality: 2, hint: "思い出せなかった" },
  hard: { label: "むずかしい", quality: 3, hint: "なんとか思い出した" },
  good: { label: "ふつう", quality: 4, hint: "思い出せた" },
  easy: { label: "かんたん", quality: 5, hint: "余裕で思い出せた" },
};

/** SM-2 の初期パラメータ */
export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;

/** SRS スケジュール状態（カードに埋め込む） */
export interface SrsState {
  repetitions: number; // 連続正答回数（again で 0）
  interval: number; // 次回までの日数
  easeFactor: number; // 易しさ係数（初期 2.5・下限 1.3）
  due?: string; // YYYY-MM-DD。未設定=未学習=即出題
  reviews: number; // 累計レビュー回数（統計用）
  lastReviewed?: string; // YYYY-MM-DD
}

export interface Card extends SrsState {
  id: string;
  deckId: string;
  front: string; // 表（問い）
  back: string; // 裏（答え）
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Deck {
  id: string;
  name: string;
  createdAt: string; // ISO
}

/** 追加フォーム/AI抽出から渡る、表裏だけの最小ペア */
export interface CardPair {
  front: string;
  back: string;
}

/** デッキ単位の学習サマリ */
export interface DeckSummary {
  total: number;
  fresh: number; // 未学習（新規）
  due: number; // 今日が期限の復習（新規は含まない）
  learned: number; // 一度以上レビュー済み
  later: number; // 期限がまだ先
}

/** エクスポート/インポートのデータ形 */
export interface ExportData {
  version: 1;
  decks: Deck[];
  cards: Card[];
}

/** 初回起動時に入れるサンプルデッキ（使い方が一目で分かる最小セット） */
export interface SeedDeck {
  name: string;
  cards: CardPair[];
}

export const SEED_DECKS: SeedDeck[] = [
  {
    name: "サンプル：四字熟語",
    cards: [
      { front: "一期一会", back: "一生に一度の出会い。その機会を大切にすること。" },
      { front: "温故知新", back: "古いことを学び、そこから新しい知識・見解を得ること。" },
      { front: "臨機応変", back: "その場の状況に応じて適切に対応すること。" },
      { front: "千載一遇", back: "めったに訪れない、またとない好機。" },
    ],
  },
];
