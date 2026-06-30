// warikan — 決定的純関数コア
//
// 実行時 LLM 不要・副作用なし・端末日付非依存。ここがアプリの見せ場:
//   1) 各支出の負担額を決定的に割り付ける（均等割りの端数も安定）
//   2) 各メンバーの収支(net)を集計する
//   3) 債務最小化（貪欲法）で送金回数を最小化した精算リストを作る

import type { Balance, Expense, Group, Member, Settlement } from "./types";

/**
 * 1つの支出について、participantIds への負担額(整数)を返す。
 * - shares 指定時はそれを採用（呼び出し側で合計=amount を検証済み想定だが、念のため正規化）。
 * - 未指定時は均等割り。端数は id 昇順で先頭から 1 円ずつ配分（決定的）。
 */
export function splitExpense(expense: Expense): Record<string, number> {
  const { amount, participantIds, shares } = expense;
  const result: Record<string, number> = {};

  if (shares) {
    // 指定額をそのまま採用。participantIds に含まれるものだけ拾う。
    for (const id of participantIds) {
      result[id] = Math.round(shares[id] ?? 0);
    }
    return result;
  }

  const n = participantIds.length;
  if (n === 0) return result;

  const base = Math.floor(amount / n);
  let remainder = amount - base * n; // 0..n-1（amount>=0 前提）

  // 端数配分を決定的にするため id 昇順で並べる
  const sorted = [...participantIds].sort();
  for (const id of sorted) {
    result[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return result;
}

/**
 * グループ全体から各メンバーの収支を集計する。
 * paid = 立て替えた合計 / owed = 負担すべき合計 / net = paid - owed
 * 戻り値は members の順序を保つ。
 */
export function computeBalances(group: Group): Balance[] {
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  for (const m of group.members) {
    paid[m.id] = 0;
    owed[m.id] = 0;
  }

  for (const expense of group.expenses) {
    // payer が members に居れば立替計上
    if (paid[expense.payerId] !== undefined) {
      paid[expense.payerId] += expense.amount;
    }
    const split = splitExpense(expense);
    for (const [memberId, share] of Object.entries(split)) {
      if (owed[memberId] !== undefined) {
        owed[memberId] += share;
      }
    }
  }

  return group.members.map((m) => ({
    memberId: m.id,
    paid: paid[m.id],
    owed: owed[m.id],
    net: paid[m.id] - owed[m.id],
  }));
}

/**
 * 債務最小化（貪欲法）。
 * net>0=債権者(受け取る)、net<0=債務者(支払う)。
 * 最大の債務者から最大の債権者へ min(|debtor|, creditor) を送金し、
 * 片方がゼロになるまで繰り返す。
 *
 * 厳密な最小送金回数（部分和＝NP困難）ではないが実用上ほぼ最小で、
 * 「全員が全員に払う」素朴割り勘の送金数を大幅に削減する。
 *
 * @param balances computeBalances の結果
 * @param epsilon  これ未満の絶対値は精算不要として無視（既定 0 = 整数前提）
 */
export function minimizeSettlements(
  balances: Balance[],
  epsilon = 0,
): Settlement[] {
  // 安定性のため memberId でタイブレークしつつ額順に並べる
  const creditors = balances
    .filter((b) => b.net > epsilon)
    .map((b) => ({ id: b.memberId, amount: b.net }))
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
  const debtors = balances
    .filter((b) => b.net < -epsilon)
    .map((b) => ({ id: b.memberId, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));

  const settlements: Settlement[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > epsilon) {
      settlements.push({ from: debtor.id, to: creditor.id, amount });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount <= epsilon) ci++;
    if (debtor.amount <= epsilon) di++;
  }

  return settlements;
}

/** members の id→name 解決ヘルパー（UI 用）。 */
export function memberName(members: Member[], id: string): string {
  return members.find((m) => m.id === id)?.name ?? "(不明)";
}

/** 支出合計（グループの総額）。 */
export function totalAmount(group: Group): number {
  return group.expenses.reduce((sum, e) => sum + e.amount, 0);
}
