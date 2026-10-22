export type Level = "gift" | "less" | "normal" | "more";
export type Rounding = "up" | "down";

export const LEVELS: readonly Level[] = ["gift", "less", "normal", "more"];
export const UNITS = [1, 10, 100, 500, 1000] as const;
export type Unit = (typeof UNITS)[number];

export const MIN_PEOPLE = 2;
export const MAX_PEOPLE = 30;
export const MAX_AMOUNT = 9_999_999;
export const FACE_COUNT = 12;

export interface Person {
  id: string;
  name: string;
  level: Level;
  /** 金額を指定したときの円。null なら傾斜で計算する */
  fixed: number | null;
  face: number;
}

/** 倍率は小数の誤差を避けるため 10 倍した整数で持つ（0.8 → 8） */
export interface Settings {
  lessTenths: number;
  moreTenths: number;
  unit: Unit;
  rounding: Rounding;
}

export interface State {
  amount: number | null;
  people: Person[];
  hostId: string;
  settings: Settings;
}
