import type { Person, Ratios } from "./types";
export const defaultRatios: Ratios = {
  gift: 0,
  less: 0.7,
  normal: 1,
  more: 1.3,
};
export const nameOf = (p: Person, i: number) => p.name.trim() || `${i + 1}人目`;
export function calculate(
  total: number,
  people: Person[],
  ratios: Ratios,
  unit: number,
  host: number,
) {
  if (!Number.isSafeInteger(total) || total < 0 || total > 999999999)
    throw Error("合計は0〜999,999,999円で入力してください。");
  if (!people.length || !Number.isInteger(host) || !people[host])
    throw Error("幹事を1人選んでください。");
  if (![1, 10, 100, 500].includes(unit))
    throw Error("端数の単位を選んでください。");
  if (
    Object.values(ratios).some((v) => !Number.isFinite(v) || v < 0 || v > 100)
  )
    throw Error("比率は0〜100で入力してください。");
  const fixed = people.map((p) =>
    p.fixed === "" ? null : /^\d+$/.test(p.fixed) ? Number(p.fixed) : NaN,
  );
  if (
    fixed.some(
      (v) => v !== null && (!Number.isSafeInteger(v) || v < 0 || v > 999999999),
    )
  )
    throw Error("固定額は0〜999,999,999円で入力してください。");
  const sum = fixed.reduce<number>((s, v) => s + (v ?? 0), 0);
  const weights = people.map((p, i) =>
      fixed[i] === null ? ratios[p.level] : 0,
    ),
    weight = weights.reduce((a, b) => a + b, 0);
  if (!weight && !fixed.some((v) => v !== null && v > 0))
    throw Error("全員おごりにはできません。1人以上に負担を設定してください。");
  const rest = Math.max(0, total - sum);
  const amounts = people.map(
    (_, i) =>
      fixed[i] ??
      (weight
        ? Math.ceil(Math.max(0, (rest * weights[i]) / weight / unit - 1e-10)) *
          unit
        : 0),
  );
  const collected = amounts.reduce((a, b) => a + b, 0);
  return {
    amounts,
    collected,
    difference: collected - total,
    received: collected - amounts[host],
    hostActual: total - collected + amounts[host],
  };
}
export const differenceText = (d: number) =>
  d >= 0
    ? `幹事のおつり ${d.toLocaleString("ja-JP")}円`
    : `幹事が ${(-d).toLocaleString("ja-JP")}円 負担`;
