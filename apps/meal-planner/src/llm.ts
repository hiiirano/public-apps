import type { WeeklyPlan } from "./types";

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

const STORAGE_KEY = "meal-planner.llm";

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

/** 献立に対するひとことアドバイスをLLMから得る（任意・失敗してもコアに影響なし） */
export async function enhanceComment(
  plan: WeeklyPlan,
  s: LlmSettings,
): Promise<string> {
  if (!isLlmReady(s)) throw new Error("LLM未設定");

  const menu = plan.days
    .map(
      (d) =>
        `${d.day}日目: ${d.main.name}${d.side ? "／" + d.side.name : ""}`,
    )
    .join("\n");

  const prompt =
    `次の1週間の献立に対して、栄養バランスと飽きない工夫の観点から、家庭向けに2〜3文で温かいアドバイスをください。\n\n${menu}`;

  const res = await fetch(s.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${s.apiKey}`,
    },
    body: JSON.stringify({
      model: s.model,
      messages: [
        { role: "system", content: "あなたは家庭料理に詳しい管理栄養士です。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM APIエラー: ${res.status}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("LLM応答の形式が不正です");
  return text.trim();
}
