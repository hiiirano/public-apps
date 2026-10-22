export type Level = "gift" | "less" | "normal" | "more";
export type Ratios = Record<Level, number>;
export interface Person {
  name: string;
  level: Level;
  fixed: string;
}
export interface State {
  amount: string;
  people: Person[];
  host: number;
  method: string;
  unit: number;
  ratios: Ratios;
}
