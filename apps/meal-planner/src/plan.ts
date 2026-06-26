import type { PlannerInput, WeeklyPlan } from "./types";
import { generateWeeklyPlan } from "./generator";
import { buildShoppingList } from "./shopping";

/** 献立生成（.4）＋買い物リスト集約（.5）を合成して WeeklyPlan を返す */
export function buildPlan(input: PlannerInput): WeeklyPlan {
  const { days, comment, warnings } = generateWeeklyPlan(input);
  const shopping = days.length > 0 ? buildShoppingList(days, input) : [];
  return { days, shopping, comment, warnings };
}
