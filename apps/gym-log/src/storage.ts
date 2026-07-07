import type { Exercise, Settings, Workout } from "./types";

const EX_KEY = "gymlog.exercises.v1";
const WO_KEY = "gymlog.workouts.v1";
const SET_KEY = "gymlog.settings.v1";

// id は固定 slug（Phase2 の Health Connect セグメント種別マッピングを安定させる）
export const PRESET_EXERCISES: Exercise[] = [
  // 自重
  { id: "pushup", name: "腕立て伏せ", kind: "bodyweight", group: "upper", metric: "reps" },
  { id: "pullup", name: "懸垂", kind: "bodyweight", group: "upper", metric: "reps" },
  { id: "dips", name: "ディップス", kind: "bodyweight", group: "upper", metric: "reps" },
  { id: "squat", name: "スクワット", kind: "bodyweight", group: "lower", metric: "reps" },
  { id: "lunge", name: "ランジ", kind: "bodyweight", group: "lower", metric: "reps" },
  { id: "plank", name: "プランク", kind: "bodyweight", group: "core", metric: "seconds" },
  { id: "crunch", name: "クランチ", kind: "bodyweight", group: "core", metric: "reps" },
  // チョコザップ標準マシン
  { id: "chest-press", name: "チェストプレス", kind: "machine", group: "upper", metric: "reps" },
  { id: "lat-pulldown", name: "ラットプルダウン", kind: "machine", group: "upper", metric: "reps" },
  { id: "shoulder-press", name: "ショルダープレス", kind: "machine", group: "upper", metric: "reps" },
  { id: "biceps-curl", name: "バイセップスカール", kind: "machine", group: "upper", metric: "reps" },
  { id: "dip-machine", name: "ディップスマシン", kind: "machine", group: "upper", metric: "reps" },
  { id: "abdominal", name: "アブドミナル（腹筋）", kind: "machine", group: "core", metric: "reps" },
  { id: "leg-press", name: "レッグプレス", kind: "machine", group: "lower", metric: "reps" },
  { id: "adduction", name: "アダクション（内もも）", kind: "machine", group: "lower", metric: "reps" },
];

export const DEFAULT_SETTINGS: Settings = { wakeLock: true };

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadExercises(): Exercise[] {
  const saved = loadJson<Exercise[]>(EX_KEY);
  if (saved && Array.isArray(saved) && saved.length > 0) return saved;
  const seeded = PRESET_EXERCISES.map((e) => ({ ...e }));
  saveExercises(seeded);
  return seeded;
}

export function saveExercises(list: Exercise[]): void {
  localStorage.setItem(EX_KEY, JSON.stringify(list));
}

export function loadWorkouts(): Workout[] {
  const saved = loadJson<Workout[]>(WO_KEY);
  return saved && Array.isArray(saved) ? saved : [];
}

export function saveWorkouts(list: Workout[]): void {
  localStorage.setItem(WO_KEY, JSON.stringify(list));
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...(loadJson<Partial<Settings>>(SET_KEY) ?? {}) };
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SET_KEY, JSON.stringify(s));
}

// ---- バックアップ ----

export interface Backup {
  app: "gym-log";
  version: 1;
  exportedAt: string;
  exercises: Exercise[];
  workouts: Workout[];
}

export function makeBackup(exercises: Exercise[], workouts: Workout[]): Backup {
  return {
    app: "gym-log",
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    workouts,
  };
}

export function parseBackup(text: string): Backup {
  const data = JSON.parse(text) as Backup;
  if (data.app !== "gym-log" || !Array.isArray(data.exercises) || !Array.isArray(data.workouts)) {
    throw new Error("gym-log のバックアップ形式ではありません");
  }
  return data;
}
