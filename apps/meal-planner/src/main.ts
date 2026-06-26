import "./style.css";
import type { PlannerInput, WeeklyPlan, Genre, Allergen } from "./types";
import { ALL_ALLERGENS, ALL_GENRES } from "./types";
import { buildPlan } from "./plan";
import { groupByCategory } from "./shopping";
import {
  loadLlmSettings,
  saveLlmSettings,
  isLlmReady,
  enhanceComment,
  type LlmSettings,
} from "./llm";

const INPUT_KEY = "meal-planner.input";

function loadInput(): PlannerInput {
  const fallback: PlannerInput = {
    adults: 2,
    children: 0,
    genres: [],
    excludeAllergens: [],
    ngKeywords: [],
    withSide: true,
    quickOnly: false,
    pantry: [],
    seed: 1,
  };
  try {
    const raw = localStorage.getItem(INPUT_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function saveInput(i: PlannerInput): void {
  localStorage.setItem(INPUT_KEY, JSON.stringify(i));
}

function parseList(s: string): string[] {
  return s
    .split(/[、,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

let input = loadInput();
let llm = loadLlmSettings();
let plan: WeeklyPlan | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;

function genreCheckboxes(): string {
  return ALL_GENRES.map(
    (g) =>
      `<label class="chip"><input type="checkbox" name="genre" value="${g}" ${
        input.genres.includes(g) ? "checked" : ""
      }/>${g}</label>`,
  ).join("");
}

function allergenCheckboxes(): string {
  return ALL_ALLERGENS.map(
    (a) =>
      `<label class="chip"><input type="checkbox" name="allergen" value="${a}" ${
        input.excludeAllergens.includes(a) ? "checked" : ""
      }/>${a}</label>`,
  ).join("");
}

function renderShell(): void {
  app.innerHTML = `
    <header>
      <h1>🍽️ 週間献立プランナー</h1>
      <p class="sub">家族の条件を選ぶだけで、1週間分の献立と買い物リストを自動作成。<br/>登録不要・無料・オフラインでも動きます。</p>
    </header>

    <form id="form" class="card">
      <div class="row">
        <label>大人 <input type="number" id="adults" min="1" max="10" value="${input.adults}" /></label>
        <label>子ども <input type="number" id="children" min="0" max="10" value="${input.children}" /></label>
      </div>

      <fieldset>
        <legend>ジャンル傾向（未選択=すべて）</legend>
        <div class="chips">${genreCheckboxes()}</div>
      </fieldset>

      <fieldset>
        <legend>除外する食物アレルギー</legend>
        <div class="chips">${allergenCheckboxes()}</div>
      </fieldset>

      <label class="full">NG食材（カンマ/スペース区切り）
        <input type="text" id="ng" placeholder="例: なす、ピーマン" value="${input.ngKeywords.join("、")}" />
      </label>

      <label class="full">冷蔵庫の残り（あれば優先して使います）
        <input type="text" id="pantry" placeholder="例: キャベツ、鶏もも肉" value="${input.pantry.join("、")}" />
      </label>

      <div class="row toggles">
        <label class="toggle"><input type="checkbox" id="withSide" ${input.withSide ? "checked" : ""}/> 主菜＋副菜にする</label>
        <label class="toggle"><input type="checkbox" id="quickOnly" ${input.quickOnly ? "checked" : ""}/> 時短のみ(20分以内)</label>
      </div>

      <div class="actions">
        <button type="submit" class="primary">献立を作る</button>
        <button type="button" id="reroll" class="ghost">別の組み合わせ</button>
      </div>
    </form>

    <details class="card llm" id="llmPanel">
      <summary>🤖 AI拡張（任意）— APIキーを入れると献立に一言アドバイスが付きます</summary>
      <p class="note">キーはこのブラウザにのみ保存され、入力した提供元へ直接送信されます（自前サーバは経由しません）。空でもコア機能はすべて使えます。</p>
      <label class="toggle"><input type="checkbox" id="llmEnabled" ${llm.enabled ? "checked" : ""}/> 有効にする</label>
      <label class="full">エンドポイント<input type="text" id="llmEndpoint" value="${llm.endpoint}" /></label>
      <label class="full">モデル<input type="text" id="llmModel" value="${llm.model}" /></label>
      <label class="full">APIキー<input type="password" id="llmKey" value="${llm.apiKey}" placeholder="sk-..." /></label>
      <button type="button" id="llmSave" class="ghost">保存</button>
    </details>

    <section id="result"></section>
  `;

  wireForm();
  renderResult();
}

function readForm(): void {
  const q = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  input.adults = Math.max(1, Number(q<HTMLInputElement>("adults").value) || 1);
  input.children = Math.max(0, Number(q<HTMLInputElement>("children").value) || 0);
  input.genres = [...document.querySelectorAll<HTMLInputElement>('input[name="genre"]:checked')].map(
    (e) => e.value as Genre,
  );
  input.excludeAllergens = [
    ...document.querySelectorAll<HTMLInputElement>('input[name="allergen"]:checked'),
  ].map((e) => e.value as Allergen);
  input.ngKeywords = parseList(q<HTMLInputElement>("ng").value);
  input.pantry = parseList(q<HTMLInputElement>("pantry").value);
  input.withSide = q<HTMLInputElement>("withSide").checked;
  input.quickOnly = q<HTMLInputElement>("quickOnly").checked;
}

function wireForm(): void {
  const form = document.getElementById("form") as HTMLFormElement;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    readForm();
    generate();
  });
  document.getElementById("reroll")!.addEventListener("click", () => {
    readForm();
    input.seed = (input.seed + 1) % 1_000_000;
    generate();
  });

  document.getElementById("llmSave")!.addEventListener("click", () => {
    llm = {
      enabled: (document.getElementById("llmEnabled") as HTMLInputElement).checked,
      endpoint: (document.getElementById("llmEndpoint") as HTMLInputElement).value.trim(),
      model: (document.getElementById("llmModel") as HTMLInputElement).value.trim(),
      apiKey: (document.getElementById("llmKey") as HTMLInputElement).value.trim(),
    } as LlmSettings;
    saveLlmSettings(llm);
    flash("AI拡張の設定を保存しました");
  });
}

function generate(): void {
  saveInput(input);
  plan = buildPlan(input);
  renderResult();
}

function flash(msg: string): void {
  const el = document.createElement("div");
  el.className = "flash";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function renderResult(): void {
  const result = document.getElementById("result");
  if (!result) return;
  if (!plan) {
    result.innerHTML = `<p class="placeholder">条件を選んで「献立を作る」を押してください。</p>`;
    return;
  }

  const warnHtml = plan.warnings.length
    ? `<div class="warn">${plan.warnings.map((w) => `⚠️ ${w}`).join("<br/>")}</div>`
    : "";

  const daysHtml = plan.days
    .map(
      (d) => `
      <div class="day">
        <div class="day-no">${d.day}日目</div>
        <div class="dish main">
          <span class="badge ${d.main.genre}">${d.main.genre}</span>
          <span class="name">${d.main.name}</span>
          <span class="time">⏱${d.main.timeMin}分</span>
        </div>
        ${
          d.side
            ? `<div class="dish side"><span class="name">＋ ${d.side.name}</span></div>`
            : ""
        }
      </div>`,
    )
    .join("");

  const groups = groupByCategory(plan.shopping);
  const shopHtml = groups
    .map(
      (g) => `
      <div class="shop-group">
        <h3>${g.category}</h3>
        <ul>
          ${g.items
            .map(
              (it) =>
                `<li><label><input type="checkbox"/> ${it.name} <span class="qty">${formatQty(
                  it.qty,
                )}${it.unit}</span></label></li>`,
            )
            .join("")}
        </ul>
      </div>`,
    )
    .join("");

  result.innerHTML = `
    ${warnHtml}
    <div class="card">
      <h2>今週の献立</h2>
      <p class="comment" id="comment">${plan.comment}</p>
      ${
        isLlmReady(llm)
          ? `<button type="button" id="aiComment" class="ghost small">🤖 AIに一言もらう</button>`
          : ""
      }
      <div class="days">${daysHtml}</div>
    </div>

    <div class="card">
      <h2>買い物リスト</h2>
      <p class="sub">${input.adults + input.children}人分（子どもは0.5人前換算）</p>
      <div class="shopping">${shopHtml}</div>
    </div>
  `;

  const aiBtn = document.getElementById("aiComment");
  if (aiBtn) {
    aiBtn.addEventListener("click", async () => {
      const c = document.getElementById("comment")!;
      aiBtn.setAttribute("disabled", "true");
      c.textContent = "AIが考えています…";
      try {
        c.textContent = await enhanceComment(plan!, llm);
      } catch (err) {
        c.textContent = `AIアドバイスの取得に失敗しました（${
          err instanceof Error ? err.message : "不明なエラー"
        }）。コア機能はそのまま使えます。`;
      } finally {
        aiBtn.removeAttribute("disabled");
      }
    });
  }
}

function formatQty(q: number): string {
  return Number.isInteger(q) ? String(q) : String(q);
}

renderShell();
