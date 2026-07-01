// 任意のLLM拡張（OpenAI互換のChat Completions APIを想定）。
// 設定が無ければ呼ばれない。コア機能（TDEE/PFC計算・手動ログ）は LLM 無しでフル動作する。
//
// 使いどころ: 「鶏むね肉200g、白米150g、卵2個」のような食事メモを貼ると、
// 各食品の kcal / PFC を推定して食事ログに追加できる（推定値・目安）。

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

const STORAGE_KEY = "macro.llm";

/** LLM が推定する食品1件（kcal/PFC はグラム/kcal の整数目安）。 */
export interface EstimatedFood {
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
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
  "あなたは栄養計算のアシスタントです。" +
  "ユーザーが貼り付けた食事メモから、各食品の推定カロリーとPFC(タンパク質/脂質/炭水化物)を見積もり、指定のJSONだけを返します。" +
  "数値は日本の一般的な食品成分の目安で概算し、余計な説明やコードフェンスは付けません。";

/**
 * 食事メモから食品ごとの kcal/PFC 推定を得る。
 * 任意機能：失敗してもコアに影響しない（呼び出し側で握りつぶす）。
 */
export async function estimateFoods(
  text: string,
  s: LlmSettings,
): Promise<EstimatedFood[]> {
  if (!isLlmReady(s)) throw new Error("LLM未設定");
  if (!text.trim()) return [];

  const prompt =
    "次の食事メモから、食品ごとにカロリーとPFCを推定し、JSONのみを返してください。\n" +
    'フォーマット: {"foods":[{"name":"鶏むね肉200g","kcal":220,"protein":46,"fat":3,"carbs":0}]}\n' +
    "kcal は整数、protein/fat/carbs はグラムの整数。分量が書かれていれば反映する。\n\n---\n" +
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
  return parseEstimation(content);
}

/**
 * LLM応答テキストから foods を取り出す（コードフェンス等を許容）。
 * 解釈不能・不正な入力は空配列を返す（呼び出し側を単純化）。
 */
export function parseEstimation(content: string): EstimatedFood[] {
  const json = stripFence(content);
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    return [];
  }
  const foods = (obj as { foods?: unknown })?.foods;
  if (!Array.isArray(foods)) return [];
  return foods
    .map((raw): EstimatedFood => {
      const d = (raw ?? {}) as Record<string, unknown>;
      const nn = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
      return {
        name: typeof d.name === "string" ? d.name : "食事",
        kcal: nn(d.kcal),
        protein: nn(d.protein),
        fat: nn(d.fat),
        carbs: nn(d.carbs),
      };
    })
    .filter((d) => d.name.trim() !== "" && (d.kcal > 0 || d.protein > 0 || d.fat > 0 || d.carbs > 0));
}

/** ```json ... ``` のようなコードフェンスを剥がす */
function stripFence(s: string): string {
  const t = s.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(t);
  return fence ? fence[1] : t;
}
