/**
 * 金額の入力を整数の円に直す。全角数字・カンマ・「円」「¥」・空白を受け付ける。
 * 空なら null、数字として読めなければ NaN。
 */
export function parseYen(raw: string): number | null {
  const s = raw.normalize("NFKC").replace(/[,，、\s円¥￥\\]/g, "");
  if (s === "") return null;
  if (!/^\d+$/.test(s)) return NaN;
  if (s.length > 15) return Number.MAX_SAFE_INTEGER; // 上限超えとして扱う
  return Number(s);
}

/** 3桁区切り（マイナスも扱う） */
export function formatYen(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

/** 「¥12,300」 */
export function yen(n: number): string {
  const r = Math.round(n);
  return `${r < 0 ? "−" : ""}¥${Math.abs(r).toLocaleString("ja-JP")}`;
}
