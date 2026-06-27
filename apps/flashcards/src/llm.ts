import type { CardPair } from "./types";

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

const STORAGE_KEY = "flashcards.llm";

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
  "あなたは学習者のための暗記カード作成アシスタントです。" +
  "ユーザーが貼り付けたノートや文章から、暗記に適した一問一答のQ&Aカードを作り、指定のJSONだけを返します。" +
  "余計な説明やコードフェンスは付けません。";

/**
 * テキスト（ノート/文章）から暗記カード候補を抽出する。
 * 任意機能：失敗してもコアに影響しない（呼び出し側で握りつぶす）。
 */
export async function generateCards(
  text: string,
  s: LlmSettings,
): Promise<CardPair[]> {
  if (!isLlmReady(s)) throw new Error("LLM未設定");
  if (!text.trim()) return [];

  const prompt =
    "次のテキストから暗記カード（一問一答）を作り、JSONのみを返してください。\n" +
    'フォーマット: {"cards":[{"front":"問い","back":"答え"}]}\n' +
    "- front は短い問い、back は簡潔な答え。\n" +
    "- 1枚に1論点。重要な用語・定義・因果・数値を優先。\n" +
    "- 元テキストに無い情報は作らない。\n\n---\n" +
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
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`LLM APIエラー: ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("LLM応答の形式が不正です");

  return parseExtraction(content);
}

/** LLM応答テキストから cards を取り出して整形する（コードフェンス等を許容） */
export function parseExtraction(content: string): CardPair[] {
  const json = stripFence(content);
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error("LLM応答をJSONとして解釈できませんでした");
  }
  const cards = (obj as { cards?: unknown })?.cards;
  if (!Array.isArray(cards)) return [];
  return cards
    .map((raw) => {
      const o = (raw ?? {}) as Record<string, unknown>;
      return {
        front: (o.front ?? "").toString().trim(),
        back: (o.back ?? "").toString().trim(),
      };
    })
    .filter((p) => p.front.length > 0 && p.back.length > 0);
}

/** ```json ... ``` のようなコードフェンスを剥がす */
function stripFence(s: string): string {
  const t = s.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(t);
  return fence ? fence[1] : t;
}
