import type {
  Exercise,
  Recommendation,
  SetEntry,
  Workout,
} from "./types";

// ---- 日付ユーティリティ（端末日付は呼び出し側から渡す。純関数を保つ） ----

/** "YYYY-MM-DD" 同士の日数差（a - b）。UTC換算でタイムゾーンの影響を受けない */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const au = Date.UTC(ay, am - 1, ad);
  const bu = Date.UTC(by, bm - 1, bd);
  return Math.round((au - bu) / 86400000);
}

export function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---- ワークアウトの読み取り ----

/** 1セット以上記録された種目の group 集合 */
export function groupsOf(
  w: Workout,
  exercises: Exercise[],
): Set<Exercise["group"]> {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const groups = new Set<Exercise["group"]>();
  for (const we of w.exercises) {
    if (we.sets.length === 0) continue;
    const ex = byId.get(we.exerciseId);
    if (ex) groups.add(ex.group);
  }
  return groups;
}

/** 総ボリューム = Σ(重量×回数)。自重(weight null)は回数のみなので加算しない */
export function volumeOf(w: Workout): number {
  let v = 0;
  for (const we of w.exercises) {
    for (const s of we.sets) {
      if (s.weight != null) v += s.weight * s.reps;
    }
  }
  return v;
}

export function totalSets(w: Workout): number {
  return w.exercises.reduce((n, we) => n + we.sets.length, 0);
}

/** today を含む直近7日間のワークアウト（記録済みセットがあるもの） */
export function thisWeek(workouts: Workout[], today: string): Workout[] {
  return workouts.filter((w) => {
    const d = daysBetween(today, w.date);
    return d >= 0 && d < 7 && totalSets(w) > 0;
  });
}

/** その種目を最後にやったワークアウトのセット配列（前回値表示用） */
export function lastSetsFor(
  workouts: Workout[],
  exerciseId: string,
  excludeWorkoutId?: string,
): SetEntry[] | null {
  const sorted = [...workouts].sort((a, b) => b.startedAt - a.startedAt);
  for (const w of sorted) {
    if (w.id === excludeWorkoutId) continue;
    const we = w.exercises.find(
      (x) => x.exerciseId === exerciseId && x.sets.length > 0,
    );
    if (we) return we.sets;
  }
  return null;
}

// ---- 今日のおすすめ（コアロジック） ----

const GROUP_LABEL: Record<"upper" | "lower", string> = {
  upper: "上半身",
  lower: "下半身",
};

export function recommend(
  workouts: Workout[],
  exercises: Exercise[],
  today: string,
): Recommendation {
  const done = workouts.filter((w) => totalSets(w) > 0);

  if (done.some((w) => w.date === today)) {
    return {
      kind: "rest",
      reason: "今日はもうトレーニング済み。しっかり回復しましょう",
    };
  }

  const trainedDates = new Set(done.map((w) => w.date));
  const yesterday = done.length > 0 &&
    [...trainedDates].some((d) => daysBetween(today, d) === 1);
  const dayBefore = done.length > 0 &&
    [...trainedDates].some((d) => daysBetween(today, d) === 2);
  if (yesterday && dayBefore) {
    return {
      kind: "rest",
      reason: "2日連続でトレーニング済み。今日は休養日がおすすめ",
    };
  }

  // 部位ごとの最終実施日（core はローテーション対象外）
  const last: Record<"upper" | "lower", string | null> = {
    upper: null,
    lower: null,
  };
  for (const w of done) {
    for (const g of groupsOf(w, exercises)) {
      if (g === "core") continue;
      if (last[g] === null || w.date > last[g]!) last[g] = w.date;
    }
  }

  if (last.upper === null && last.lower === null) {
    return {
      kind: "upper",
      reason: "まだ記録がありません。上半身から始めましょう",
    };
  }

  const pick: "upper" | "lower" =
    last.upper === null ? "upper"
    : last.lower === null ? "lower"
    : last.upper < last.lower ? "upper"
    : last.upper > last.lower ? "lower"
    : "upper"; // 同日タイは上半身

  const lastDate = last[pick];
  if (lastDate === null) {
    return {
      kind: pick,
      reason: `${GROUP_LABEL[pick]}はまだ未記録。今日やってみましょう`,
    };
  }
  const gap = daysBetween(today, lastDate);
  const [, m, d] = lastDate.split("-").map(Number);
  return {
    kind: pick,
    reason: `${GROUP_LABEL[pick]}は${gap}日空いています（前回 ${m}/${d}）`,
  };
}

// ---- エクスポート ----

export function toCsv(workouts: Workout[], exercises: Exercise[]): string {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = ["date,exercise,set,weight_kg,reps"];
  const sorted = [...workouts].sort((a, b) => a.startedAt - b.startedAt);
  for (const w of sorted) {
    for (const we of w.exercises) {
      const name = byId.get(we.exerciseId)?.name ?? we.exerciseId;
      we.sets.forEach((s, i) => {
        lines.push(
          `${w.date},${esc(name)},${i + 1},${s.weight ?? ""},${s.reps}`,
        );
      });
    }
  }
  return lines.join("\n") + "\n";
}
