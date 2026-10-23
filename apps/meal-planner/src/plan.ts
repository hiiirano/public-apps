import type { PlannerInput, WeeklyPlan } from "./types";
import { generateWeeklyPlan } from "./generator";
import { buildShoppingList } from "./shopping";

/** 献立と買い物リストをまとめて作る */
export function buildPlan(input: PlannerInput, swaps: Record<number, number> = {}): WeeklyPlan {
  const { days, warnings, notes, pantry } = generateWeeklyPlan(input, swaps);
  const shopping = days.length > 0 ? buildShoppingList(days, input) : [];
  return { days, shopping, warnings, notes, pantry };
}
