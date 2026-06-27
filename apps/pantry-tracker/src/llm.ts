import type { ItemDraft } from "./types";
import { normalizeDraft } from "./storage";

// 任意のLLM拡張（OpenAI互換のChat Completions APIを想定）。
// 設定が無ければ呼ばれない。コア機能はLLM無しでフル動作する。

export interface LlmSettings {
  enabled: boolean;
  endpoint: string; // 例: https://api.openai.com/v1/chat/completions
  apiKey: string;
  model: string; // 例: gpt-4o-mini
}

export const DEFAULT_LLM: LlmSettings = {
  enabled: false,
  endpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: "",
  model: "gpt-4o-mini",
};

const STORAGE_KEY = "pantry-tracker.llm";

export function loadLlmSettings(): LlmSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LLM };
    return { ...DEFAULT_LLM, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_LLM };
  }
}

export function saveLlmSettings(s: LlmSettings): void {
  // APIキーはこのブラウザの localStorage のみに保存（サーバには送らない）
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function isLlmReady(s: LlmSettings): boolean {
  return s.enabled && !!s.apiKey && !!s.endpoint && !!s.model;
}

const SYSTEM_PROMPT =
  "あなたは家庭の在庫を整理するアシスタントです。" +
  "ユーザーが貼り付けたレシートやメモから、在庫アイテムを抽出して指定のJSONだけを返します。" +
  "余計な説明やコードフェンスは付けません。";

/**
 * テキスト（レシート/メモ）から在庫アイテム候補を抽出する。
 * 任意機能：失敗してもコアに影響しない（呼び出し側で握りつぶす）。
 * 返り値は normalizeDraft 済みの ItemDraft 配列。
 */
export async function extractItems(
  text: string,
  s: LlmSettings,
): Promise<ItemDraft[]> {
  if (!isLlmReady(s)) throw new Error("LLM未設定");
  if (!text.trim()) return [];

  const prompt =
    "次のテキストから在庫アイテムを抽出し、JSONのみを返してください。\n" +
    'フォーマット: {"items":[{"name":"牛乳","qty":1,"unit":"本","category":"飲料","location":"冷蔵","expiry":"2026-07-01"}]}\n' +
    "category は 食品/飲料/調味料/冷凍/日用品/その他 のいずれか。" +
    "location は 冷蔵/冷凍/常温/その他 のいずれか。" +
    "expiry は分かる場合のみ YYYY-MM-DD。不明な項目は省略可。\n\n---\n" +
    text;

  const res = await fetch(s.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${s.apiKey}`,
    },
    body: JSON.stringify({
      model: s.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`LLM APIエラー: ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("LLM応答の形式が不正です");

  return parseExtraction(content);
}

/** LLM応答テキストから items を取り出して正規化する（コードフェンス等を許容） */
export function parseExtraction(content: string): ItemDraft[] {
  const json = stripFence(content);
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error("LLM応答をJSONとして解釈できませんでした");
  }
  const items = (obj as { items?: unknown })?.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((raw) => normalizeDraft((raw ?? {}) as Partial<ItemDraft>))
    .filter((d) => d.name.length > 0);
}

/** ```json ... ``` のようなコードフェンスを剥がす */
function stripFence(s: string): string {
  const t = s.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(t);
  return fence ? fence[1] : t;
}
