// 「見本を入れてみる」で入れる4週間ぶんの記録。今日の日付から逆算して作る（純関数）。
import type { Workout } from "./types";
import { addDays } from "./logic";

type Plan = { ago: number; items: [string, number | null, number[]][] };

// [何日前, [種目, 重さ, 回数…]]。だんだん重くなるように並べる
const PLANS: Plan[] = [
  { ago: 26, items: [["chest-press", 20, [10, 10, 8]], ["lat-pulldown", 25, [10, 10, 10]], ["bike", null, [10]]] },
  { ago: 24, items: [["leg-press", 40, [12, 12, 10]], ["adduction", 20, [12, 12]], ["abdominal", 15, [12, 12]]] },
  { ago: 19, items: [["chest-press", 22.5, [10, 10, 8]], ["lat-pulldown", 27.5, [10, 10, 8]], ["shoulder-press", 10, [10, 10]], ["bike", null, [12]]] },
  { ago: 17, items: [["leg-press", 45, [12, 10, 10]], ["adduction", 22.5, [12, 12]], ["plank", null, [30, 30]]] },
  { ago: 12, items: [["chest-press", 22.5, [12, 10, 10]], ["lat-pulldown", 30, [10, 10, 8]], ["shoulder-press", 12.5, [10, 8]], ["bike", null, [15]]] },
  { ago: 10, items: [["leg-press", 50, [12, 10, 10]], ["abduction", 20, [12, 12]], ["abdominal", 17.5, [12, 10]]] },
  { ago: 5, items: [["chest-press", 25, [10, 10, 8]], ["lat-pulldown", 30, [12, 10, 10]], ["biceps-curl", 10, [12, 10]], ["bike", null, [15]]] },
  { ago: 3, items: [["leg-press", 55, [10, 10, 8]], ["adduction", 25, [12, 10]], ["plank", null, [45, 40]]] },
];

export function demoWorkouts(today: string, now: number): Workout[] {
  return PLANS.map((p, i) => {
    const startedAt = now - p.ago * 86400000 - 2 * 3600000;
    return {
      id: `demo${i}`,
      date: addDays(today, -p.ago),
      startedAt,
      endedAt: startedAt + (28 + i * 2) * 60000,
      items: p.items.map(([exId, w, reps]) => ({ exId, sets: reps.map((r) => ({ w, r })) })),
    };
  });
}
