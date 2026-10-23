// 端末への保存と、書き出し・読み込み。読み込むときは形と範囲を検査し、壊れていれば使わない。
import { isArt, PLACES, type Art, type Place } from "./catalog";
import { isYmd, type Ymd } from "./dates";
import { emptyState, ITEMS_MAX, LOG_MAX, NAME_MAX, QTY_MAX, type Item, type LogEntry, type State } from "./pantry";
import { guessPreset } from "./catalog";

export const KEY = "pantry-tracker.v2";
const OLD_KEY = "pantry-tracker.items"; // v0.1 の保存形式（移しかえて使う）
const OLD_LLM_KEY = "pantry-tracker.llm"; // v0.1 の AI 設定（API キーを含むので消す）
export const FILE_KIND = "pantry-tracker";

let seq = 0;
export const newId = (p = "i"): string => `${p}${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
/** id は英数字・_・- の 1〜64 文字だけ（画面の属性に入れても安全な文字に限る） */
export const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
export const isId = (v: unknown): v is string => typeof v === "string" && ID_RE.test(v);
/** 読み込んだ id が使えない文字を含む・重なるときは新しく振り直す */
function fixIds<T extends { id: unknown }>(rows: T[], prefix: string): (T & { id: string })[] {
  const seen = new Set<string>();
  return rows.map((r) => {
    let id = isId(r.id) && !seen.has(r.id) ? r.id : newId(prefix);
    while (seen.has(id)) id = newId(prefix);
    seen.add(id);
    return { ...r, id };
  });
}
const isName = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= NAME_MAX;

function validItem(x: any): x is Item {
  return (
    x && typeof x === "object" && isName(x.name) && isArt(x.art) && (PLACES as readonly unknown[]).includes(x.place) &&
    isInt(x.qty, 1, QTY_MAX) && (x.expiry === null || isYmd(x.expiry)) && isYmd(x.addedOn)
  );
}

function validLog(x: any): x is LogEntry {
  return x && typeof x === "object" && isName(x.name) && isArt(x.art) && (x.outcome === "used" || x.outcome === "wasted") && isInt(x.qty, 1, QTY_MAX) && isYmd(x.date);
}

function validFreq(x: any): x is Record<string, number> {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  const e = Object.entries(x);
  return e.length <= 200 && e.every(([k, v]) => k.length <= NAME_MAX && isInt(v, 0, 9999));
}

/** 保存内容（または読み込んだファイルの中身）を検査する。形が合わなければ null */
export function parseState(raw: unknown): State | null {
  const s: any = raw;
  if (
    !s || typeof s !== "object" ||
    !Array.isArray(s.items) || s.items.length > ITEMS_MAX || !s.items.every(validItem) ||
    !Array.isArray(s.log) || s.log.length > LOG_MAX || !s.log.every(validLog) ||
    !validFreq(s.freq)
  )
    return null;
  return {
    items: fixIds(s.items as Item[], "i").map((i) => ({ id: i.id, name: i.name, art: i.art, place: i.place, qty: i.qty, expiry: i.expiry, addedOn: i.addedOn })),
    log: fixIds(s.log as LogEntry[], "l").map((e) => ({ id: e.id, name: e.name, art: e.art, outcome: e.outcome, qty: e.qty, date: e.date })),
    freq: { ...s.freq },
  };
}

/** v0.1（pantry-tracker.items）の在庫を v2 の形に移しかえる。読めない行は捨てる */
export function migrateOld(raw: unknown, today: Ymd): State | null {
  if (!Array.isArray(raw)) return null;
  const items: Item[] = [];
  for (const o of raw.slice(0, ITEMS_MAX)) {
    if (!o || typeof o !== "object" || typeof o.name !== "string" || !o.name.trim()) continue;
    const name = o.name.trim().slice(0, NAME_MAX);
    const place: Place = o.location === "冷凍" || o.category === "冷凍" ? "freezer" : o.location === "冷蔵" ? "fridge" : "shelf";
    const qtyN = Number(o.qty);
    const art: Art = guessPreset(name)?.art ?? "plate";
    items.push({
      id: newId(),
      name,
      art,
      place,
      qty: Number.isFinite(qtyN) ? Math.min(QTY_MAX, Math.max(1, Math.round(qtyN))) : 1,
      expiry: isYmd(o.expiry) ? o.expiry : null,
      addedOn: today,
    });
  }
  return { ...emptyState(), items };
}

export function load(today: Ymd): State {
  try {
    try {
      localStorage.removeItem(OLD_LLM_KEY);
    } catch {
      /* 消せなくても続ける */
    }
    const raw = localStorage.getItem(KEY);
    if (raw !== null) return parseState(JSON.parse(raw)) ?? emptyState();
    const old = localStorage.getItem(OLD_KEY);
    if (old !== null) return migrateOld(JSON.parse(old), today) ?? emptyState();
  } catch {
    /* 壊れている・読めない */
  }
  return emptyState();
}

/** 保存できたら true。プライベートブラウズなどで保存できなくても、その場では使える */
export function save(s: State): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

// ---- 書き出し・読み込み（ファイル）----
export function exportText(s: State, today: Ymd): string {
  return JSON.stringify({ kind: FILE_KIND, version: 2, exportedOn: today, ...s }, null, 1);
}

/** 書き出したファイルの文字を読む。違うファイル・壊れたファイルなら null */
export function importText(text: string): State | null {
  if (text.length > 2_000_000) return null;
  try {
    const o = JSON.parse(text);
    if (!o || o.kind !== FILE_KIND || o.version !== 2) return null;
    return parseState(o);
  } catch {
    return null;
  }
}
