// 月末の見込み（先回り警告）の計算。純関数だけ。
import type { Expense } from "./types";
import { categoryOf } from "./types";
import { dayOf, daysInMonth, monthOf } from "./dates";

export type Phase = "past" | "current" | "future";
/**
 * none: 予算なし / ok: 収まるペース / near: 予算の9割をこえそう /
 * over: このままだと予算をこえる / already: もう予算をこえた
 */
export type PaceStatus = "none" | "ok" | "near" | "over" | "already";

export interface Pace {
  month: string;
  phase: Phase;
  /** 月の日数 */
  days: number;
  /** 今日までの日数（今日をふくむ）。過去の月は days、先の月は 0 */
  elapsed: number;
  /** この月に書いた合計 */
  spent: number;
  /** のばさずに数える分（住まい・今日より先の日付） */
  fixedSpent: number;
  /** ペースでのばす分（今日までの、住まい以外） */
  variableSpent: number;
  /** 月末の見込み */
  projected: number;
  budget: number | null;
  /** 見込み − 予算（予算なしは null） */
  over: number | null;
  status: PaceStatus;
  /** 今日をふくめた残りの日数（今月だけ。ほかは 0） */
  daysLeft: number;
  /** 予算に収めるための、残りの1日あたりの額（今月で予算ありのときだけ。こえていたら 0） */
  perDayLeft: number | null;
  /** 今日までに使ってよい目安（予算 × 経過日数 ÷ 日数） */
  idealToDate: number | null;
  /** 1日ごとの累計（index 0 = 1日）。今日より先は null */
  cumulative: (number | null)[];
  /** 経過がまだ短く、見込みが粗い（今月の1〜4日目） */
  rough: boolean;
}

/** 予算の9割をこえたら「ぎりぎり」 */
export const NEAR_RATIO = 0.9;

export function phaseOf(month: string, today: string): Phase {
  const t = monthOf(today);
  return month < t ? "past" : month > t ? "future" : "current";
}

/**
 * 月末の見込みを出す。
 * 見込み = のばさない分 + 今日までの住まい以外の合計 ÷ 経過日数 × 月の日数
 * - 住まい（家賃など）は月1回の支払いなので、のばさない
 * - 今日より先の日付の記録は「予定」として、そのまま足す
 * - 過去の月は実際の合計、先の月は書いた分だけ
 */
export function computePace(expenses: readonly Expense[], month: string, today: string, budget: number | null): Pace {
  const days = daysInMonth(month);
  const phase = phaseOf(month, today);
  const elapsed = phase === "past" ? days : phase === "future" ? 0 : Math.min(dayOf(today), days);
  const b = budget !== null && budget > 0 ? budget : null;

  const perDay = new Array<number>(days).fill(0);
  let spent = 0;
  let fixedSpent = 0;
  let variableSpent = 0;
  for (const e of expenses) {
    if (monthOf(e.date) !== month) continue;
    const d = dayOf(e.date);
    spent += e.amount;
    perDay[d - 1] += e.amount;
    if (d > elapsed || categoryOf(e.cat).fixed) fixedSpent += e.amount;
    else variableSpent += e.amount;
  }

  let projected: number;
  if (phase === "current") projected = fixedSpent + Math.round((variableSpent / elapsed) * days);
  else projected = spent;

  const cumulative: (number | null)[] = [];
  let run = 0;
  for (let i = 0; i < days; i++) {
    run += perDay[i];
    cumulative.push(i < elapsed ? run : null);
  }

  let status: PaceStatus = "none";
  if (b !== null) {
    if (spent > b) status = "already";
    else if (projected > b) status = "over";
    else if (projected > b * NEAR_RATIO) status = "near";
    else status = "ok";
  }

  const daysLeft = phase === "current" ? days - elapsed + 1 : 0;
  const perDayLeft = b !== null && phase === "current" ? Math.max(0, Math.floor((b - spent) / daysLeft)) : null;

  return {
    month,
    phase,
    days,
    elapsed,
    spent,
    fixedSpent,
    variableSpent,
    projected,
    budget: b,
    over: b === null ? null : projected - b,
    status,
    daysLeft,
    perDayLeft,
    idealToDate: b === null ? null : Math.round((b * elapsed) / days),
    cumulative,
    rough: phase === "current" && elapsed < 5,
  };
}

/** グラフの形（SVG の座標）。純関数 */
export interface ChartGeometry {
  width: number;
  height: number;
  yMax: number;
  /** 実績の折れ線 */
  actual: string;
  /** 見込みの点線（今日 → 月末）。今月以外は "" */
  projection: string;
  /** 予算の横線の y（予算なしは null） */
  budgetY: number | null;
  /** 予算どおりに使うときの斜めの線 */
  ideal: string;
  /** 今日の点 */
  today: { x: number; y: number } | null;
  /** 月末の見込みの点 */
  end: { x: number; y: number };
  /** 目盛り（金額と y） */
  ticks: { value: number; y: number }[];
  pad: { l: number; r: number; t: number; b: number };
}

/** 目盛りに使う切りのよい数（1・2・5 × 10^n） */
export function niceStep(max: number, count = 4): number {
  if (!(max > 0)) return 1;
  const raw = max / count;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

export function chartGeometry(p: Pace, width = 640, height = 260): ChartGeometry {
  const pad = { l: 8, r: 8, t: 16, b: 28 };
  const top = Math.max(p.budget ?? 0, p.projected, p.spent, 1);
  const step = niceStep(top);
  const yMax = Math.ceil((top * 1.08) / step) * step;
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  // x: 月初（0日目の終わり=0）から月末（days）
  const X = (day: number) => pad.l + (w * day) / p.days;
  const Y = (v: number) => pad.t + h - (h * v) / yMax;
  const r = (n: number) => Math.round(n * 10) / 10;

  const pts: string[] = [`${r(X(0))},${r(Y(0))}`];
  p.cumulative.forEach((v, i) => {
    if (v !== null) pts.push(`${r(X(i + 1))},${r(Y(v))}`);
  });
  const lastIdx = p.elapsed;
  const lastVal = lastIdx > 0 ? (p.cumulative[lastIdx - 1] ?? 0) : 0;
  const today = p.phase === "current" ? { x: r(X(lastIdx)), y: r(Y(lastVal)) } : null;
  const end = { x: r(X(p.days)), y: r(Y(p.projected)) };
  const projection = p.phase === "current" ? `${today!.x},${today!.y} ${end.x},${end.y}` : "";
  const ticks: { value: number; y: number }[] = [];
  for (let v = step; v <= yMax; v += step) ticks.push({ value: v, y: r(Y(v)) });
  return {
    width,
    height,
    yMax,
    actual: p.phase === "future" ? "" : pts.join(" "),
    projection,
    budgetY: p.budget === null ? null : r(Y(p.budget)),
    ideal: p.budget === null ? "" : `${r(X(0))},${r(Y(0))} ${r(X(p.days))},${r(Y(p.budget))}`,
    today,
    end,
    ticks,
    pad,
  };
}
