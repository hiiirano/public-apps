export type RouteMode = "shortest" | "shade";
export type PlaceKind = "landmark" | "junction" | "entrance";
/** underground = 地下通路 / covered = 屋根のある通路（駅の自由通路など） / outdoor = 屋根のない地上の道 */
export type EdgeKind = "underground" | "covered" | "outdoor";

export const MODES: readonly RouteMode[] = ["shortest", "shade"];

export interface Point {
  x: number;
  y: number;
}

/** 座標は絵地図（400×304）の上の位置。測量値ではない */
export interface Place extends Point {
  id: string;
  label: string;
  shortLabel: string;
  kind: PlaceKind;
  selectable: boolean;
  /** public/art/ の絵のファイル名（選べる地点だけ） */
  art?: string;
}

export interface DirectionalInstruction {
  forward: string;
  reverse: string;
}

export interface RouteEdge {
  id: string;
  from: string;
  to: string;
  /** 公式地図の縮尺から読んだ概算（10m 単位に丸め） */
  distanceM: number;
  kind: EdgeKind;
  instruction: DirectionalInstruction;
  /** 日陰・日なたと判断した根拠（短く） */
  basis: string;
  availability?: string;
  sourceIds: string[];
  /** 絵地図の上の線。from 側から to 側の順 */
  points: Point[];
}

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  updated?: string;
}

export interface CityData {
  id: string;
  name: string;
  version: string;
  checkedOn: string;
  places: Place[];
  edges: RouteEdge[];
  sources: Source[];
}

export interface RouteStep {
  edge: RouteEdge;
  from: string;
  to: string;
  instruction: string;
  /** from 側から to 側の順に並べた線 */
  points: Point[];
}

export interface RouteResult {
  mode: RouteMode;
  from: string;
  to: string;
  steps: RouteStep[];
  nodeIds: string[];
  distanceM: number;
  /** 地下・屋根の下を歩く距離 */
  shadeM: number;
  /** 屋根のない地上を歩く距離（日なたとして数える） */
  sunM: number;
  /** 日陰の割合（0〜100 の整数。切り捨てなので、日なたが少しでもあれば 100 にならない） */
  shadeRatio: number;
  minutes: number;
  sunMinutes: number;
}

export interface Comparison {
  shortest: RouteResult;
  shade: RouteResult;
  /** 2つが同じ道か */
  same: boolean;
  /** 日陰の道が最短より何分長いか（0 以上） */
  extraMinutes: number;
  /** 日陰の道で日なたが何分減るか（0 以上） */
  sunSavedMinutes: number;
}

export interface SavedState {
  from: string;
  to: string;
  mode: RouteMode;
}
