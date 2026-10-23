// 端末への保存と、読み込んだ内容の検査。壊れていれば初期状態に戻す。
import type { Exercise, Kind, Metric, Part, SetEntry, Settings, State, Step, Workout, WorkoutItem } from "./types";
import { KINDS, LIMITS, METRICS, PARTS, STEPS } from "./types";

export const KEY = "gym-log.v2";
/** 前の版（v1）の保存場所。見つかれば一度だけ読み込んで v2 に移す */
export const OLD_KEYS = { exercises: "gymlog.exercises.v1", workouts: "gymlog.workouts.v1", settings: "gymlog.settings.v1" };

const ex = (id: string, name: string, part: Part, kind: Kind, metric: Metric, step: Step = 2.5): Exercise => ({
  id,
  name,
  part,
  kind,
  metric,
  step,
  art: id,
  hidden: false,
  custom: false,
});

/** 最初から選べる種目。小さなマシンジムにあるマシンを先に並べる。id は固定（前の版の記録と対応） */
export const PRESETS: Exercise[] = [
  ex("chest-press", "チェストプレス", "chest", "machine", "weight"),
  ex("lat-pulldown", "ラットプルダウン", "back", "machine", "weight"),
  ex("shoulder-press", "ショルダープレス", "shoulder", "machine", "weight"),
  ex("biceps-curl", "アームカール", "arm", "machine", "weight"),
  ex("dip-machine", "ディップス（マシン）", "arm", "machine", "weight"),
  ex("abdominal", "アブドミナル", "core", "machine", "weight"),
  ex("back-extension", "バックエクステンション", "back", "machine", "weight"),
  ex("rotary-torso", "ロータリートルソー", "core", "machine", "weight"),
  ex("leg-press", "レッグプレス", "leg", "machine", "weight", 5),
  ex("leg-extension", "レッグエクステンション", "leg", "machine", "weight"),
  ex("adduction", "アダクション（内もも）", "leg", "machine", "weight"),
  ex("abduction", "アブダクション（外もも）", "leg", "machine", "weight"),
  ex("bike", "バイク", "cardio", "cardio", "minutes"),
  ex("treadmill", "ウォーキングマシン", "cardio", "cardio", "minutes"),
  ex("pushup", "腕立て伏せ", "chest", "bodyweight", "reps"),
  ex("pullup", "懸垂", "back", "bodyweight", "reps"),
  ex("dips", "ディップス", "arm", "bodyweight", "reps"),
  ex("squat", "スクワット", "leg", "bodyweight", "reps"),
  ex("lunge", "ランジ", "leg", "bodyweight", "reps"),
  ex("crunch", "クランチ", "core", "bodyweight", "reps"),
  ex("plank", "プランク", "core", "bodyweight", "seconds"),
];

export const DEFAULT_SETTINGS: Settings = { theme: "auto", wakeLock: true };

export function freshState(): State {
  return { exercises: PRESETS.map((e) => ({ ...e })), workouts: [], settings: { ...DEFAULT_SETTINGS } };
}

let seq = 0;
export const newId = (prefix = "w"): string =>
  `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---- 検査 ----
const isStr = (v: unknown, max: number): v is string => typeof v === "string" && v.length > 0 && v.length <= max;
const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const isDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

function validExercise(e: any): e is Exercise {
  return (
    e &&
    isStr(e.id, 40) &&
    isStr(e.name, LIMITS.name) &&
    PARTS.includes(e.part) &&
    KINDS.includes(e.kind) &&
    METRICS.includes(e.metric) &&
    (STEPS as readonly number[]).includes(e.step) &&
    isStr(e.art, 40) &&
    typeof e.hidden === "boolean" &&
    typeof e.custom === "boolean"
  );
}

function validSet(s: any): s is SetEntry {
  return s && (s.w === null || isNum(s.w, 0, LIMITS.weight)) && isNum(s.r, 0, LIMITS.seconds) && Number.isInteger(s.r);
}

function validItem(it: any): it is WorkoutItem {
  return it && isStr(it.exId, 40) && Array.isArray(it.sets) && it.sets.length <= LIMITS.sets && it.sets.every(validSet);
}

function validWorkout(w: any): w is Workout {
  return (
    w &&
    isStr(w.id, 40) &&
    isDate(w.date) &&
    isNum(w.startedAt, 0, 8.64e15) &&
    (w.endedAt === null || isNum(w.endedAt, 0, 8.64e15)) &&
    Array.isArray(w.items) &&
    w.items.length <= LIMITS.items &&
    w.items.every(validItem)
  );
}

function validSettings(s: any): s is Settings {
  return s && ["auto", "light", "dark"].includes(s.theme) && typeof s.wakeLock === "boolean";
}

const unique = (ids: string[]) => new Set(ids).size === ids.length;

/** 形と範囲を検査する。合わなければ null。
 * 件数の上限（記録 5,000 回・種目 200）は追加するときだけ検査し、ここでは理由にしない（超えていても記録を消さない） */
export function checkState(s: any): State | null {
  if (
    !s ||
    s.v !== 2 ||
    !Array.isArray(s.exercises) ||
    !s.exercises.every(validExercise) ||
    !unique(s.exercises.map((e: Exercise) => e.id)) ||
    !Array.isArray(s.workouts) ||
    !s.workouts.every(validWorkout) ||
    !unique(s.workouts.map((w: Workout) => w.id)) ||
    !validSettings(s.settings)
  )
    return null;
  // 記録中は1つだけ
  if (s.workouts.filter((w: Workout) => w.endedAt === null).length > 1) return null;
  const known = new Set(s.exercises.map((e: Exercise) => e.id));
  const workouts: Workout[] = s.workouts.map((w: Workout) => ({
    id: w.id,
    date: w.date,
    startedAt: w.startedAt,
    endedAt: w.endedAt,
    items: w.items.filter((it) => known.has(it.exId)).map((it) => ({ exId: it.exId, sets: it.sets.map((x) => ({ w: x.w, r: x.r })) })),
  }));
  return {
    exercises: s.exercises.map((e: Exercise) => ({ ...e })),
    workouts,
    settings: { theme: s.settings.theme, wakeLock: s.settings.wakeLock },
  };
}

export function parseState(raw: string | null): State {
  try {
    return checkState(JSON.parse(raw ?? "null")) ?? freshState();
  } catch {
    return freshState();
  }
}

export function serialize(s: State): string {
  return JSON.stringify({ v: 2, ...s });
}

// ---- 前の版（v1）からの移行 ----
const V1_PART: Record<string, Part> = { upper: "chest", lower: "leg", core: "core" };

/** v1 の保存内容を v2 に変える。読めなければ null */
export function migrateV1(exRaw: string | null, woRaw: string | null): State | null {
  try {
    const oldEx = JSON.parse(exRaw ?? "null");
    const oldWo = JSON.parse(woRaw ?? "null");
    if (!Array.isArray(oldWo) || oldWo.length === 0) return null;
    const state = freshState();
    const presetIds = new Set(state.exercises.map((e) => e.id));
    if (Array.isArray(oldEx)) {
      for (const e of oldEx) {
        if (!e || typeof e.id !== "string" || typeof e.name !== "string") continue;
        if (presetIds.has(e.id)) {
          const p = state.exercises.find((x) => x.id === e.id)!;
          p.hidden = !!e.archived;
          continue;
        }
        state.exercises.push({
          id: e.id.slice(0, 40),
          name: e.name.slice(0, LIMITS.name) || "種目",
          part: V1_PART[e.group] ?? "chest",
          kind: e.kind === "bodyweight" ? "bodyweight" : "machine",
          metric: e.metric === "seconds" ? "seconds" : e.kind === "bodyweight" ? "reps" : "weight",
          step: 2.5,
          art: `part-${V1_PART[e.group] ?? "chest"}`,
          hidden: !!e.archived,
          custom: true,
        });
      }
    }
    for (const w of oldWo) {
      if (!w || typeof w.id !== "string" || !Array.isArray(w.exercises)) continue;
      const items: WorkoutItem[] = w.exercises
        .filter((x: any) => x && typeof x.exerciseId === "string" && Array.isArray(x.sets))
        .map((x: any) => {
          const metric = state.exercises.find((e) => e.id === x.exerciseId)?.metric ?? "weight";
          return {
            exId: x.exerciseId,
            sets: x.sets
              .filter((s: any) => s && typeof s.reps === "number")
              .map((s: any) => ({
                w: metric === "weight" ? (typeof s.weight === "number" ? s.weight : 0) : null,
                r: Math.max(0, Math.round(s.reps)),
              })),
          };
        });
      state.workouts.push({
        id: w.id,
        date: w.date,
        startedAt: w.startedAt,
        endedAt: w.endedAt ?? w.startedAt,
        items,
      });
    }
    return checkState({ v: 2, ...state });
  } catch {
    return null;
  }
}

// ---- 端末とのやりとり ----

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) {
      const migrated = migrateV1(localStorage.getItem(OLD_KEYS.exercises), localStorage.getItem(OLD_KEYS.workouts));
      if (migrated) return migrated;
    }
    return parseState(raw);
  } catch {
    return freshState();
  }
}

/** 保存できたら true。プライベートブラウズなどで保存できなくても記録は続けられる */
export function save(s: State): boolean {
  try {
    localStorage.setItem(KEY, serialize(s));
    return true;
  } catch {
    return false;
  }
}

// ---- バックアップ ----

export function makeBackup(s: State, exportedAt: string): string {
  return JSON.stringify({ app: "gym-log", v: 2, exportedAt, exercises: s.exercises, workouts: s.workouts, settings: s.settings }, null, 1);
}

/** バックアップのファイルを読む。v1 のバックアップも読める。読めなければ null */
export function parseBackup(text: string): State | null {
  try {
    const d = JSON.parse(text);
    if (!d || d.app !== "gym-log") return null;
    if (d.v === 2) return checkState({ v: 2, exercises: d.exercises, workouts: d.workouts, settings: d.settings ?? DEFAULT_SETTINGS });
    if (d.version === 1) return migrateV1(JSON.stringify(d.exercises), JSON.stringify(d.workouts));
    return null;
  } catch {
    return null;
  }
}
