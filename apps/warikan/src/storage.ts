// localStorage 永続化（読み込み失敗時は壊さず空にフォールバック）。
// データはこの端末のブラウザにだけ保存される。サーバ送信なし。

import type { Expense, Group, Member } from "./types";

const GROUPS_KEY = "warikan.groups";
const CURRENT_KEY = "warikan.current";

/** 軽量な一意ID（衝突しにくければ十分・暗号用途ではない） */
export function newId(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

/** 0以上の整数に丸める（NaN/負は0） */
function toYen(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeMember(raw: unknown): Member {
  const m = (raw ?? {}) as Partial<Member>;
  return {
    id: str(m.id) || newId("m"),
    name: str(m.name).trim() || "メンバー",
  };
}

function normalizeExpense(raw: unknown, validIds: Set<string>): Expense {
  const e = (raw ?? {}) as Partial<Expense>;
  const participantIds = Array.isArray(e.participantIds)
    ? e.participantIds.filter((id): id is string => validIds.has(id))
    : [];
  let shares: Record<string, number> | undefined;
  if (e.shares && typeof e.shares === "object") {
    shares = {};
    for (const [k, v] of Object.entries(e.shares)) {
      if (validIds.has(k)) shares[k] = toYen(v);
    }
  }
  return {
    id: str(e.id) || newId("e"),
    title: str(e.title).trim() || "支出",
    amount: toYen(e.amount),
    payerId: validIds.has(str(e.payerId)) ? str(e.payerId) : "",
    participantIds,
    shares,
    createdAt:
      typeof e.createdAt === "number" && Number.isFinite(e.createdAt)
        ? e.createdAt
        : Date.now(),
  };
}

/** 任意の入力を安全な Group に正規化する（共有URL/インポートの検疫に使う） */
export function normalizeGroup(raw: unknown): Group {
  const g = (raw ?? {}) as Partial<Group>;
  const members = Array.isArray(g.members)
    ? g.members.map(normalizeMember)
    : [];
  const validIds = new Set(members.map((m) => m.id));
  const expenses = Array.isArray(g.expenses)
    ? g.expenses.map((e) => normalizeExpense(e, validIds))
    : [];
  return {
    id: str(g.id) || newId("g"),
    name: str(g.name).trim() || "割り勘",
    members,
    expenses,
    updatedAt:
      typeof g.updatedAt === "number" && Number.isFinite(g.updatedAt)
        ? g.updatedAt
        : Date.now(),
  };
}

export function loadGroups(): Group[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(normalizeGroup);
  } catch {
    return [];
  }
}

export function saveGroups(groups: Group[]): void {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

export function loadCurrentId(): string | null {
  return localStorage.getItem(CURRENT_KEY);
}

export function saveCurrentId(id: string): void {
  localStorage.setItem(CURRENT_KEY, id);
}
