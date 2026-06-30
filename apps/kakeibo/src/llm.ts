import { type ExpenseDraft } from "./types";
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

const STORAGE_KEY = "kakeibo.llm";

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
  "あなたは家計簿の入力を手伝うアシスタントです。" +
  "ユーザーが貼り付けたレシートや明細から、支出を抽出して指定のJSONだけを返します。" +
  "余計な説明やコードフェンスは付けません。";

/**
 * テキスト（レシート/明細）から支出候補を抽出する。
 * 任意機能：失敗してもコアに影響しない（呼び出し側で握りつぶす）。
 * 返り値は normalizeDraft 済みの ExpenseDraft 配列。
 */
export async function extractExpenses(
  text: string,
  s: LlmSettings,
  defaultDate: string,
): Promise<ExpenseDraft[]> {
  if (!isLlmReady(s)) throw new Error("LLM未設定");
  if (!text.trim()) return [];

  const prompt =
    "次のテキストから支出を抽出し、JSONのみを返してください。\n" +
    'フォーマット: {"expenses":[{"date":"2026-06-30","amount":1200,"category":"必需","memo":"スーパー"}]}\n' +
    "category は 必需/娯楽/文化/予備 のいずれか。" +
    "必需=食費や生活必需、娯楽=外食や趣味、文化=書籍や学び、予備=突発の出費。\n" +
    `date が不明な項目は ${defaultDate} を使う。amount は円の整数。\n\n---\n` +
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

  return parseExtraction(content, defaultDate);
}

/** LLM応答テキストから expenses を取り出して正規化する（コードフェンス等を許容） */
export function parseExtraction(
  content: string,
  defaultDate: string,
): ExpenseDraft[] {
  const json = stripFence(content);
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error("LLM応答をJSONとして解釈できませんでした");
  }
  const expenses = (obj as { expenses?: unknown })?.expenses;
  if (!Array.isArray(expenses)) return [];
  return expenses
    .map((raw) => {
      const d = (raw ?? {}) as Partial<ExpenseDraft>;
      return normalizeDraft({ ...d, date: d.date || defaultDate });
    })
    .filter((d) => d.amount > 0);
}

/** ```json ... ``` のようなコードフェンスを剥がす */
function stripFence(s: string): string {
  const t = s.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(t);
  return fence ? fence[1] : t;
}
