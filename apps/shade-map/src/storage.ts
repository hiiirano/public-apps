import type { RouteMode, SavedState } from "./types";
import { MODES } from "./types";

export const KEY = "shade-map.shinjuku.v2";

export const DEFAULT_STATE: SavedState = { from: "west_exit", to: "ward_office", mode: "shade" };

/** 保存内容を検査して読む。形が違う・知らない地点・同じ地点なら初期状態 */
export function parseState(raw: string | null, placeIds: readonly string[]): SavedState {
  const fresh = (): SavedState => ({ ...DEFAULT_STATE });
  try {
    const s = JSON.parse(raw ?? "null");
    if (
      !s ||
      typeof s !== "object" ||
      typeof s.from !== "string" ||
      typeof s.to !== "string" ||
      !placeIds.includes(s.from) ||
      !placeIds.includes(s.to) ||
      s.from === s.to ||
      !MODES.includes(s.mode as RouteMode)
    )
      return fresh();
    return { from: s.from, to: s.to, mode: s.mode };
  } catch {
    return fresh();
  }
}

/** 前の版の URL（#from=..&to=..&mode=..）を読む。正しくなければ null */
export function parseHash(hash: string, placeIds: readonly string[]): SavedState | null {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const from = q.get("from");
  const to = q.get("to");
  const mode = q.get("mode") === "shortest" ? "shortest" : "shade";
  if (!from || !to || from === to || !placeIds.includes(from) || !placeIds.includes(to)) return null;
  return { from, to, mode };
}

export function load(placeIds: readonly string[]): SavedState {
  try {
    return parseState(localStorage.getItem(KEY), placeIds);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/** 保存できたら true。保存できない環境でも道さがしはできる */
export function save(s: SavedState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
