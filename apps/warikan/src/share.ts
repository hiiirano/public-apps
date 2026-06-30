// URL 共有：グループ状態を URL ハッシュ(#data=...)に載せて受け渡す。
// 誰のサーバーにも保存しない。受け取り側はアカウント不要で結果を見られる。

import type { Group } from "./types";
import { normalizeGroup } from "./storage";

// btoa/atob は latin1 のみ。日本語名を含むので UTF-8 バイト列を経由する。
// （Node 16+ / モダンブラウザは TextEncoder/TextDecoder と btoa/atob を持つ）

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/** Group → URL-safe な base64 文字列 */
export function encodeGroup(group: Group): string {
  const json = JSON.stringify(group);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** base64 文字列 → Group（不正なら null）。受け取りデータは必ず正規化して検疫する。 */
export function decodeGroup(encoded: string): Group | null {
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    // base64 のパディングを復元
    while (b64.length % 4 !== 0) b64 += "=";
    const bytes = base64ToBytes(b64);
    const json = new TextDecoder().decode(bytes);
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;
    return normalizeGroup(obj);
  } catch {
    return null;
  }
}

/** 現在の location から共有 URL を組み立てる（ハッシュに #data= を載せる） */
export function buildShareUrl(group: Group, baseUrl: string): string {
  const data = encodeGroup(group);
  const base = baseUrl.split("#")[0];
  return `${base}#data=${data}`;
}

/** location.hash から共有データを取り出す（無ければ null） */
export function readShareHash(hash: string): Group | null {
  const m = /[#&]data=([^&]+)/.exec(hash);
  if (!m) return null;
  return decodeGroup(m[1]);
}
