export type RouteMode = "shortest" | "shade";
export type PlaceKind = "landmark" | "junction" | "entrance";
export type EdgeKind = "underground" | "covered" | "outdoor";

export interface Point {
  x: number;
  y: number;
}

export interface Place extends Point {
  id: string;
  label: string;
  shortLabel: string;
  kind: PlaceKind;
  selectable: boolean;
}

export interface DirectionalInstruction {
  forward: string;
  reverse: string;
}

export interface RouteEdge {
  id: string;
  from: string;
  to: string;
  distanceM: number;
  kind: EdgeKind;
  covered: boolean;
  instruction: DirectionalInstruction;
  availability?: string;
  sourceIds: string[];
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
  places: Place[];
  edges: RouteEdge[];
  sources: Source[];
}

export interface RouteStep {
  edge: RouteEdge;
  from: string;
  to: string;
  instruction: string;
}

export interface RouteResult {
  mode: RouteMode;
  from: string;
  to: string;
  steps: RouteStep[];
  nodeIds: string[];
  distanceM: number;
  coveredM: number;
  exposedM: number;
  coveredRatio: number;
  minutes: number;
}
