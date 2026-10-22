/**
 * 金額の入力を整数の円に直す。全角数字・カンマ・「円」「¥」・空白を受け付ける。
 * 空なら null、数字として読めなければ NaN。
 */
export function parseYen(raw: string): number | null {
  const s = raw
    .normalize("NFKC")
    .replace(/[,，、\s円¥\\]/g, "");
  if (s === "") return null;
  if (!/^\d+$/.test(s)) return NaN;
  return Number(s);
}

export function formatYen(n: number): string {
  return n.toLocaleString("ja-JP");
}

/** 0.8 のような倍率表示。tenths は 10 倍した整数 */
export function formatRatio(tenths: number): string {
  return tenths % 10 === 0 ? String(tenths / 10) : (tenths / 10).toFixed(1);
}
