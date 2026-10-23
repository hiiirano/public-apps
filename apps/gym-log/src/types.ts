/** 鍛える場所 */
export type Part = "chest" | "back" | "shoulder" | "arm" | "core" | "leg" | "cardio";
export const PARTS: readonly Part[] = ["chest", "back", "shoulder", "arm", "core", "leg", "cardio"];

/** 器具の種類 */
export type Kind = "machine" | "bodyweight" | "cardio";
export const KINDS: readonly Kind[] = ["machine", "bodyweight", "cardio"];

/** 数え方: 重さ×回数 / 回数だけ / 秒 / 分 */
export type Metric = "weight" | "reps" | "seconds" | "minutes";
export const METRICS: readonly Metric[] = ["weight", "reps", "seconds", "minutes"];

/** 重さの刻み（kg） */
export const STEPS = [0.5, 1, 2.5, 5] as const;
export type Step = (typeof STEPS)[number];

/** 絵の種類（art.ts）。自作の種目は部位の絵になる */
export type ArtKey = string;

export interface Exercise {
  id: string;
  name: string;
  part: Part;
  kind: Kind;
  metric: Metric;
  step: Step;
  art: ArtKey;
  hidden: boolean;
  custom: boolean;
}

/** w: 重さ kg（重さを使わない種目は null）、r: 回数・秒・分 */
export interface SetEntry {
  w: number | null;
  r: number;
}

export interface WorkoutItem {
  exId: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  /** "YYYY-MM-DD"（端末の日付） */
  date: string;
  startedAt: number;
  /** null = 記録中 */
  endedAt: number | null;
  items: WorkoutItem[];
}

export type Theme = "auto" | "light" | "dark";

export interface Settings {
  theme: Theme;
  wakeLock: boolean;
}

export interface State {
  exercises: Exercise[];
  workouts: Workout[];
  settings: Settings;
}

export const LIMITS = {
  name: 24,
  weight: 500,
  reps: 999,
  seconds: 3600,
  minutes: 300,
  sets: 50,
  items: 30,
  workouts: 5000,
  exercises: 200,
} as const;
