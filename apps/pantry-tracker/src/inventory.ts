// pantry-tracker 決定的コアロジック（純関数・副作用なし・LLM不要）

import {
  type Item,
  type Summary,
  type Urgency,
  NEAR_DAYS,
  SOON_DAYS,
  URGENCY_ORDER,
} from "./types";

/** YYYY-MM-DD を端末ローカルの 0時 Date に変換（不正なら null） */
function parseYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  // ロールオーバー検出（例: 2026-02-31）
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

/** today の 0時に正規化した Date を返す */
export function startOfDay(today: Date): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

/**
 * 期限までの残り日数。expiry 無し/不正は null。
 * 今日が期限なら 0、昨日が期限なら -1。
 */
export function daysUntilExpiry(item: Item, today: Date): number | null {
  if (!item.expiry) return null;
  const exp = parseYmd(item.expiry);
  if (!exp) return null;
  const base = startOfDay(today).getTime();
  const target = exp.getTime();
  return Math.round((target - base) / 86_400_000);
}

/** 緊急度を判定する */
export function urgencyOf(item: Item, today: Date): Urgency {
  const days = daysUntilExpiry(item, today);
  if (days === null) return "ok";
  if (days < 0) return "expired";
  if (days <= SOON_DAYS) return "soon";
  if (days <= NEAR_DAYS) return "near";
  return "ok";
}

/** 残量低下（買い足し候補）か */
export function isLowStock(item: Item): boolean {
  return item.minQty > 0 && item.qty <= item.minQty;
}

/**
 * 既定の並べ替え：要対応が上に来る順。
 * 1) 緊急度（expired→soon→near→ok）
 * 2) 期限が近い順（無しは末尾）
 * 3) 名前順（ロケール非依存の安定比較）
 */
export function sortItems(items: Item[], today: Date): Item[] {
  return [...items].sort((a, b) => {
    const ua = URGENCY_ORDER[urgencyOf(a, today)];
    const ub = URGENCY_ORDER[urgencyOf(b, today)];
    if (ua !== ub) return ua - ub;

    const da = daysUntilExpiry(a, today);
    const db = daysUntilExpiry(b, today);
    if (da !== db) {
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    }
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
}

export interface ItemFilter {
  category?: string; // 未指定=全部
  location?: string; // 未指定=全部
  actionableOnly?: boolean; // expired/soon または lowStock のみ
  query?: string; // 品名部分一致（前後空白無視・大小無視）
}

/** フィルタを適用する（並べ替えは別途 sortItems で） */
export function filterItems(
  items: Item[],
  filter: ItemFilter,
  today: Date,
): Item[] {
  const q = filter.query?.trim().toLowerCase();
  return items.filter((it) => {
    if (filter.category && it.category !== filter.category) return false;
    if (filter.location && it.location !== filter.location) return false;
    if (q && !it.name.toLowerCase().includes(q)) return false;
    if (filter.actionableOnly) {
      const u = urgencyOf(it, today);
      const actionable = u === "expired" || u === "soon" || isLowStock(it);
      if (!actionable) return false;
    }
    return true;
  });
}

/** ダッシュボード用の集計（純関数） */
export function summarize(items: Item[], today: Date): Summary {
  const byCategory: Record<string, number> = {};
  const byLocation: Record<string, number> = {};
  let expired = 0;
  let soon = 0;
  let lowStock = 0;

  for (const it of items) {
    byCategory[it.category] = (byCategory[it.category] ?? 0) + 1;
    byLocation[it.location] = (byLocation[it.location] ?? 0) + 1;
    const u = urgencyOf(it, today);
    if (u === "expired") expired++;
    else if (u === "soon") soon++;
    if (isLowStock(it)) lowStock++;
  }

  return {
    total: items.length,
    expired,
    soon,
    lowStock,
    byCategory,
    byLocation,
  };
}
