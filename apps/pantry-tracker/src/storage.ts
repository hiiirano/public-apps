// localStorage 永続化（読み込み失敗時は壊さず空にフォールバック）

import {
  type Item,
  type ItemDraft,
  ALL_CATEGORIES,
  ALL_LOCATIONS,
} from "./types";

const ITEMS_KEY = "pantry-tracker.items";

/** 軽量な一意ID（衝突しにくければ十分） */
export function newId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `it_${Date.now().toString(36)}_${rand}`;
}

/** 任意の入力を Item に正規化（欠損は既定値で補完） */
export function normalizeDraft(d: Partial<ItemDraft>): ItemDraft {
  const qty = Number(d.qty);
  const minQty = Number(d.minQty);
  return {
    name: (d.name ?? "").toString().trim(),
    qty: Number.isFinite(qty) && qty >= 0 ? qty : 1,
    unit: (d.unit ?? "").toString().trim() || "個",
    category: ALL_CATEGORIES.includes(d.category as never)
      ? (d.category as ItemDraft["category"])
      : "その他",
    location: ALL_LOCATIONS.includes(d.location as never)
      ? (d.location as ItemDraft["location"])
      : "常温",
    expiry: d.expiry ? d.expiry.toString().trim() : undefined,
    minQty: Number.isFinite(minQty) && minQty >= 0 ? minQty : 0,
    note: d.note ? d.note.toString().trim() : undefined,
  };
}

function isItem(x: unknown): x is Item {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.qty === "number" &&
    typeof o.unit === "string"
  );
}

export function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isItem).map((it) => normalizeStored(it));
  } catch {
    return [];
  }
}

/** 既存データに後方互換の既定値を埋める */
function normalizeStored(it: Item): Item {
  return {
    ...it,
    minQty: typeof it.minQty === "number" && it.minQty >= 0 ? it.minQty : 0,
    createdAt: it.createdAt ?? new Date().toISOString(),
    updatedAt: it.updatedAt ?? it.createdAt ?? new Date().toISOString(),
  };
}

export function saveItems(items: Item[]): void {
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch {
    // 容量超過等は黙って無視（UIは継続動作）
  }
}

/** Draft から新規 Item を生成 */
export function makeItem(draft: ItemDraft): Item {
  const now = new Date().toISOString();
  return { ...draft, id: newId(), createdAt: now, updatedAt: now };
}
