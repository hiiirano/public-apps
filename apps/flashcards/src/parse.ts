// 暗記カード — 貼り付けた文字からカードを作る（純関数）
//
// 決まり:
// - 1行に「表<タブ>裏」または「表,裏」（全角の「，」も可）。タブがあればタブを優先し、3列目からは使わない。
//   カンマのときは最初のカンマで分け、残りは全部「裏」にする（答えの中のカンマはそのまま）。
// - 区切りのない行は、続く区切りのない行と2行で1枚（1行目が表、2行目が裏）。空の行か区切りのある行をはさむと組み直す。
// - 前後の空白と、全体を囲む "..." は取る。

import { type CardPair, TEXT_MAX } from "./types";

export interface ParseProblem {
  line: number; // 1 から
  text: string;
  reason: "no-back" | "empty" | "too-long";
}

export interface ParseResult {
  pairs: CardPair[];
  problems: ParseProblem[];
}

export const MAX_PASTE_CARDS = 2000;

function unquote(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1).replace(/""/g, '"').trim();
  return t;
}

function split(line: string): [string, string] | null {
  const tab = line.indexOf("\t");
  if (tab >= 0) {
    const cols = line.split("\t");
    return [cols[0], cols[1] ?? ""];
  }
  // "表","裏" のように引用符で囲まれた表
  const q = /^\s*"((?:[^"]|"")*)"\s*[,，](.*)$/.exec(line);
  if (q) return [q[1].replace(/""/g, '"'), q[2]];
  const m = /[,，]/.exec(line);
  if (m) return [line.slice(0, m.index), line.slice(m.index + 1)];
  return null;
}

export function parsePairs(text: string): ParseResult {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs: CardPair[] = [];
  const problems: ParseProblem[] = [];
  let pending: { line: number; text: string } | null = null;

  const push = (line: number, raw: string, front: string, back: string) => {
    const f = unquote(front);
    const b = unquote(back);
    if (!f || !b) problems.push({ line, text: raw, reason: "empty" });
    else if (f.length > TEXT_MAX || b.length > TEXT_MAX) problems.push({ line, text: raw, reason: "too-long" });
    else if (pairs.length < MAX_PASTE_CARDS) pairs.push({ front: f, back: b });
  };

  lines.forEach((raw, i) => {
    const line = raw.replace(/[ \u3000]+$/, "");
    const n = i + 1;
    if (line.trim() === "") {
      if (pending) problems.push({ line: pending.line, text: pending.text, reason: "no-back" });
      pending = null;
      return;
    }
    const parts = split(line);
    if (pending && !parts) {
      push(pending.line, `${pending.text} / ${line.trim()}`, pending.text, line);
      pending = null;
      return;
    }
    // 区切りのある行が来たら、前の1行は裏がないものとして知らせる
    if (pending) problems.push({ line: pending.line, text: pending.text, reason: "no-back" });
    pending = null;
    if (parts) push(n, line.trim(), parts[0], parts[1]);
    else pending = { line: n, text: line.trim() };
  });
  if (pending) {
    const p = pending as { line: number; text: string };
    problems.push({ line: p.line, text: p.text, reason: "no-back" });
  }
  return { pairs, problems };
}

/** すでにある表・裏とまったく同じもの、貼り付けの中で重なったものを除く */
export function dedupe(pairs: readonly CardPair[], existing: readonly CardPair[]): { fresh: CardPair[]; skipped: number } {
  const key = (p: CardPair) => `${p.front}\u0000${p.back}`;
  const seen = new Set(existing.map(key));
  const fresh: CardPair[] = [];
  for (const p of pairs) {
    const k = key(p);
    if (seen.has(k)) continue;
    seen.add(k);
    fresh.push(p);
  }
  return { fresh, skipped: pairs.length - fresh.length };
}

/** 単語帳を「表<タブ>裏」の文字にする（貼り付けで戻せる形） */
export function toTsv(pairs: readonly CardPair[]): string {
  const clean = (s: string) => s.replace(/[\t\r\n]+/g, " ");
  return pairs.map((p) => `${clean(p.front)}\t${clean(p.back)}`).join("\n");
}
