export type MuscleGroup = "upper" | "lower" | "core";
export type ExerciseKind = "bodyweight" | "machine";
export type Metric = "reps" | "seconds";

export interface Exercise {
  id: string;
  name: string;
  kind: ExerciseKind;
  group: MuscleGroup;
  metric: Metric;
  archived?: boolean;
}

/** weight: null = 自重（マシンでも空欄なら null） */
export interface SetEntry {
  weight: number | null;
  reps: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  /** "YYYY-MM-DD"（端末ローカル日付） */
  date: string;
  /** epoch ms。Phase2 で Health Connect ExerciseSession の開始/終了に対応 */
  startedAt: number;
  endedAt: number | null;
  exercises: WorkoutExercise[];
}

export interface Settings {
  wakeLock: boolean;
}

export type RecommendKind = MuscleGroup | "rest";

export interface Recommendation {
  kind: Exclude<RecommendKind, "core">;
  reason: string;
}
