// 任意のLLM拡張（OpenAI互換のChat Completions APIを想定）。
// 設定が無ければ呼ばれない。コア機能（割り勘計算）は LLM 無しでフル動作する。

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

const STORAGE_KEY = "warikan.llm";

/** LLM が抽出する生の支出候補。payer は名前文字列（id は UI 側で解決）。 */
export interface ExtractedExpense {
  title: string;
  amount: number;
  payer?: string;
}

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
  "あなたは割り勘の入力を手伝うアシスタントです。" +
  "ユーザーが貼り付けた明細やメモから、立替支出を抽出して指定のJSONだけを返します。" +
  "余計な説明やコードフェンスは付けません。";

/**
 * テキスト（明細/メモ）から立替支出の候補を抽出する。
 * 任意機能：失敗してもコアに影響しない（呼び出し側で握りつぶす）。
 */
export async function extractExpenses(
  text: string,
  s: LlmSettings,
  memberNames: string[],
): Promise<ExtractedExpense[]> {
  if (!isLlmReady(s)) throw new Error("LLM未設定");
  if (!text.trim()) return [];

  const prompt =
    "次のテキストから立替支出を抽出し、JSONのみを返してください。\n" +
    'フォーマット: {"expenses":[{"title":"居酒屋","amount":12000,"payer":"太郎"}]}\n' +
    `payer は誰が立て替えたか。可能なら次の名前から選ぶ: ${memberNames.join(" / ") || "(未指定)"}。\n` +
    "amount は円の整数。タイトルは短く。\n\n---\n" +
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

/**
 * LLM応答テキストから expenses を取り出す（コードフェンス等を許容）。
 * 解釈不能・不正な入力は空配列を返す（呼び出し側を単純化）。
 */
export function parseExtraction(content: string): ExtractedExpense[] {
  const json = stripFence(content);
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    return [];
  }
  const expenses = (obj as { expenses?: unknown })?.expenses;
  if (!Array.isArray(expenses)) return [];
  return expenses
    .map((raw): ExtractedExpense => {
      const d = (raw ?? {}) as Record<string, unknown>;
      return {
        title: typeof d.title === "string" ? d.title : "支出",
        amount: Math.max(0, Math.round(Number(d.amount) || 0)),
        payer: typeof d.payer === "string" ? d.payer : undefined,
      };
    })
    .filter((d) => d.amount > 0);
}

/** ```json ... ``` のようなコードフェンスを剥がす */
function stripFence(s: string): string {
  const t = s.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(t);
  return fence ? fence[1] : t;
}
