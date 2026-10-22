import type { Level, Person, Settings } from "./types";
import { MAX_AMOUNT } from "./types";
import { formatRatio, formatYen } from "./money";

export const DEFAULT_SETTINGS: Settings = {
  lessTenths: 8,
  moreTenths: 12,
  unit: 100,
  rounding: "up",
};

export const LESS_RANGE = { min: 1, max: 9 } as const;
export const MORE_RANGE = { min: 11, max: 30 } as const;

export const LEVEL_LABEL: Record<Level, string> = {
  gift: "おごり",
  less: "少なめ",
  normal: "ふつう",
  more: "多め",
};

export function weightOf(level: Level, s: Settings): number {
  switch (level) {
    case "gift":
      return 0;
    case "less":
      return s.lessTenths;
    case "normal":
      return 10;
    case "more":
      return s.moreTenths;
  }
}

export function ratioLabel(level: Level, s: Settings): string {
  return `×${formatRatio(weightOf(level, s))}`;
}

export const nameOf = (p: Person, index: number): string =>
  p.name.trim() || `${index + 1}人目`;

export type CalcResult =
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      total: number;
      /** people と同じ順の、1人ずつ払う額 */
      amounts: number[];
      collected: number;
      /** collected - total。正なら幹事のおつり、負なら幹事が足す額 */
      difference: number;
      hostIndex: number;
      /** 幹事がほかの人から受け取る合計 */
      received: number;
      /** 幹事が実際に負担する額（total - received） */
      hostActual: number;
    };

/**
 * 割り勘を計算する。すべて整数の円で計算し、小数を使わない。
 * 1. 金額を指定した人はその額のまま（丸めない）。
 * 2. 残りを、ほかの人の倍率で按分し、単位に合わせて切り上げ（または切り捨て）。
 * 3. 集めた合計と会計の差は、幹事のおつり（または幹事が足す額）になる。
 */
export function calculate(
  total: number | null,
  people: Person[],
  settings: Settings,
  hostId: string,
): CalcResult {
  if (total === null || total === 0) return { kind: "empty" };
  if (!Number.isSafeInteger(total) || total < 0)
    return { kind: "error", message: "会計の金額は数字で入れてください。" };
  if (total > MAX_AMOUNT)
    return {
      kind: "error",
      message: `会計は${formatYen(MAX_AMOUNT)}円までです。`,
    };
  const hostIndex = people.findIndex((p) => p.id === hostId);
  if (hostIndex < 0)
    return { kind: "error", message: "幹事を1人選んでください。" };

  const fixedSum = people.reduce((s, p) => s + (p.fixed ?? 0), 0);
  if (fixedSum > total)
    return {
      kind: "error",
      message: `金額を指定した人の合計（${formatYen(fixedSum)}円）が、会計（${formatYen(total)}円）を超えています。指定した金額を減らしてください。`,
    };

  const rest = total - fixedSum;
  const weights = people.map((p) =>
    p.fixed === null ? weightOf(p.level, settings) : 0,
  );
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (rest > 0 && weightSum === 0) {
    const anyFixed = people.some((p) => p.fixed !== null);
    return {
      kind: "error",
      message: anyFixed
        ? `残りの${formatYen(rest)}円を払う人がいません。だれか1人を「ふつう」などにしてください。`
        : "全員が「おごり」になっています。だれか1人を「ふつう」などにしてください。",
    };
  }

  const { unit, rounding } = settings;
  const amounts = people.map((p, i) => {
    if (p.fixed !== null) return p.fixed;
    if (weights[i] === 0) return 0;
    // rest * w / W を unit 単位で丸める。整数のまま割り算する
    const num = rest * weights[i];
    const den = weightSum * unit;
    const units =
      rounding === "up" ? Math.floor((num + den - 1) / den) : Math.floor(num / den);
    return units * unit;
  });

  const collected = amounts.reduce((a, b) => a + b, 0);
  const received = collected - amounts[hostIndex];
  return {
    kind: "ok",
    total,
    amounts,
    collected,
    difference: collected - total,
    hostIndex,
    received,
    hostActual: total - received,
  };
}

export function differenceText(d: number): string {
  if (d > 0) return `幹事のおつり ${formatYen(d)}円`;
  if (d < 0) return `幹事が ${formatYen(-d)}円 足す`;
  return "ぴったり（おつりなし）";
}

/**
 * LINE などに貼る文。名前を付けた人は1人ずつ、名前のない人は同じ額・同じ傾斜でまとめる。
 */
export function shareText(
  people: Person[],
  settings: Settings,
  r: Extract<CalcResult, { kind: "ok" }>,
): string {
  const lines = [`本日の会計 ${formatYen(r.total)}円（${people.length}人）`];
  const tag = (p: Person) =>
    p.fixed !== null
      ? "（金額指定）"
      : p.level === "normal"
        ? ""
        : `（${LEVEL_LABEL[p.level]} ${ratioLabel(p.level, settings)}）`;

  const groups = new Map<string, { count: number; amount: number; tag: string }>();
  people.forEach((p, i) => {
    if (i === r.hostIndex) return;
    if (p.name.trim()) {
      lines.push(`・${p.name.trim()}さん ${formatYen(r.amounts[i])}円${tag(p)}`);
      return;
    }
    const key = `${r.amounts[i]}|${tag(p)}`;
    const g = groups.get(key) ?? { count: 0, amount: r.amounts[i], tag: tag(p) };
    g.count += 1;
    groups.set(key, g);
  });
  const named = lines.length > 1;
  for (const g of groups.values()) {
    const who = named ? `ほか${g.count}人` : `${g.count}人`;
    lines.push(
      g.count === 1
        ? `・${who} ${formatYen(g.amount)}円${g.tag}`
        : `・${who} 各${formatYen(g.amount)}円${g.tag}`,
    );
  }
  const host = people[r.hostIndex];
  const hostName = host.name.trim() ? `${host.name.trim()}さん` : `${r.hostIndex + 1}人目`;
  lines.push(`幹事: ${hostName}（自分の分 ${formatYen(r.amounts[r.hostIndex])}円）`);
  lines.push(`幹事に払ってください。${differenceText(r.difference)}`);
  return lines.join("\n");
}
