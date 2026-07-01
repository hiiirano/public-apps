import "./style.css";
import type {
  ActivityLevel,
  FoodEntry,
  Goal,
  MacroTargets,
  Profile,
  Sex,
} from "./types";
import {
  bmi,
  bmiCategory,
  bmr,
  entriesForDate,
  macroKcal,
  macroTargets,
  remaining,
  sumEntries,
  tdee,
} from "./macro";
import {
  DEFAULT_PROFILE,
  loadLog,
  loadProfile,
  newId,
  normalizeEntry,
  normalizeProfile,
  saveLog,
  saveProfile,
  todayStr,
} from "./storage";
import {
  type LlmSettings,
  estimateFoods,
  isLlmReady,
  loadLlmSettings,
  saveLlmSettings,
} from "./llm";

// ---- state ----
let profile: Profile = loadProfile();
let log: FoodEntry[] = loadLog();
let llm: LlmSettings = loadLlmSettings();
let selectedDate: string = todayStr();
let showLlm = false;

const app = document.querySelector<HTMLDivElement>("#app")!;

// ---- labels ----
const SEX_LABEL: Record<Sex, string> = { male: "男性", female: "女性" };
const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "ほぼ運動なし",
  light: "軽い運動(週1-3)",
  moderate: "中程度(週3-5)",
  active: "活発(週6-7)",
  athlete: "アスリート級",
};
const GOAL_LABEL: Record<Goal, string> = {
  cut: "減量 (−20%)",
  maintain: "維持 (±0)",
  bulk: "増量 (+10%)",
};

// ---- helpers ----
function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
function g(n: number): string {
  return `${Math.round(n).toLocaleString("ja-JP")}g`;
}
function kcal(n: number): string {
  return `${Math.round(n).toLocaleString("ja-JP")} kcal`;
}

function persist(): void {
  saveProfile(profile);
  saveLog(log);
}

// =============================================================
// レンダリング（full re-render）
// =============================================================
function render(): void {
  const targets = macroTargets(profile);
  const dayEntries = entriesForDate(log, selectedDate);
  const consumed = sumEntries(dayEntries);
  const rem = remaining(targets, consumed);

  app.innerHTML = `
    <header>
      <h1>🥗 PFC・TDEE計算 <span class="brand">macro-planner</span></h1>
      <p class="sub">身長体重と目標から1日の目標カロリーとPFCを計算。食事ログで残量が分かる。アカウント不要・この端末だけに保存。</p>
    </header>

    ${profileCardHtml()}
    ${targetsCardHtml(targets)}
    ${todayCardHtml(targets, consumed, rem, dayEntries)}

    <section class="card">
      <h2>AI食事取り込み・バックアップ</h2>
      <div class="actions">
        <button id="toggle-llm">${showLlm ? "AI設定を隠す" : "AIで食事を推定"}</button>
        <button id="export-json">JSONエクスポート</button>
        <button id="import-json">JSONインポート</button>
      </div>
      ${showLlm ? llmHtml() : ""}
    </section>

    <footer>${footerHtml()}</footer>
  `;

  bind();
}

function profileCardHtml(): string {
  const p = profile;
  const sexOpts = (Object.keys(SEX_LABEL) as Sex[])
    .map(
      (s) =>
        `<option value="${s}" ${s === p.sex ? "selected" : ""}>${SEX_LABEL[s]}</option>`,
    )
    .join("");
  const actOpts = (Object.keys(ACTIVITY_LABEL) as ActivityLevel[])
    .map(
      (a) =>
        `<option value="${a}" ${a === p.activity ? "selected" : ""}>${ACTIVITY_LABEL[a]}</option>`,
    )
    .join("");
  const goalOpts = (Object.keys(GOAL_LABEL) as Goal[])
    .map(
      (goal) =>
        `<option value="${goal}" ${goal === p.goal ? "selected" : ""}>${GOAL_LABEL[goal]}</option>`,
    )
    .join("");
  return `
    <section class="card">
      <h2>プロフィール</h2>
      <form id="profile-form" class="profile-grid">
        <label>性別<select id="p-sex">${sexOpts}</select></label>
        <label>年齢<input id="p-age" type="number" min="10" max="100" step="1" value="${p.age}" /></label>
        <label>身長(cm)<input id="p-height" type="number" min="100" max="250" step="0.1" value="${p.heightCm}" /></label>
        <label>体重(kg)<input id="p-weight" type="number" min="25" max="300" step="0.1" value="${p.weightKg}" /></label>
        <label>活動量<select id="p-activity">${actOpts}</select></label>
        <label>目標<select id="p-goal">${goalOpts}</select></label>
        <label>タンパク質(g/kg体重)<input id="p-protein" type="number" min="0.5" max="4" step="0.1" value="${p.proteinPerKg}" /></label>
        <label>脂質割合(%)<input id="p-fat" type="number" min="10" max="60" step="1" value="${Math.round(p.fatPercent * 100)}" /></label>
      </form>
      <p class="muted">値を変えると即座に下の目標が更新されます。<button id="reset-profile" class="link">初期値に戻す</button></p>
    </section>
  `;
}

function targetsCardHtml(targets: MacroTargets): string {
  const b = bmi(profile);
  const bars = macroBars(targets, { kcal: 0, protein: 0, fat: 0, carbs: 0 }, true);
  return `
    <section class="card result">
      <h2>あなたの1日の目標</h2>
      <div class="bigstats">
        <div class="stat"><span class="v">${Math.round(bmr(profile)).toLocaleString("ja-JP")}</span><span class="k">基礎代謝 BMR</span></div>
        <div class="stat"><span class="v">${Math.round(tdee(profile)).toLocaleString("ja-JP")}</span><span class="k">消費 TDEE</span></div>
        <div class="stat accent"><span class="v">${targets.kcal.toLocaleString("ja-JP")}</span><span class="k">目標カロリー</span></div>
        <div class="stat"><span class="v">${b || "—"}</span><span class="k">BMI (${bmiCategory(b)})</span></div>
      </div>
      <h3>目標PFC（合計 ${kcal(macroKcal(targets))}）</h3>
      ${bars}
    </section>
  `;
}

function todayCardHtml(
  targets: MacroTargets,
  consumed: MacroTargets,
  rem: MacroTargets,
  dayEntries: FoodEntry[],
): string {
  const list =
    dayEntries.length === 0
      ? `<p class="muted">この日の記録はまだありません。</p>`
      : `<ul class="foods">` +
        [...dayEntries]
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(
            (e) => `
        <li>
          <div class="f-main">
            <span class="f-name">${esc(e.name)}</span>
            <span class="f-kcal">${kcal(e.kcal)}</span>
          </div>
          <div class="f-sub muted">P ${g(e.protein)} / F ${g(e.fat)} / C ${g(e.carbs)}</div>
          <button class="del-food danger" data-id="${e.id}">削除</button>
        </li>`,
          )
          .join("") +
        `</ul>`;

  const overK = rem.kcal < 0;
  return `
    <section class="card">
      <h2>食事ログ</h2>
      <div class="daterow">
        <label>日付<input id="log-date" type="date" value="${selectedDate}" /></label>
        <span class="muted">摂取 ${kcal(consumed.kcal)} / 目標 ${kcal(targets.kcal)}
          <strong class="${overK ? "neg" : "pos"}">（残り ${overK ? "超過 " : ""}${kcal(Math.abs(rem.kcal))}）</strong></span>
      </div>

      <h3>残量</h3>
      ${macroBars(targets, consumed, false)}

      <form id="food-form" class="food-form">
        <div class="row">
          <input id="f-name" type="text" placeholder="食品名（例: 鶏むね肉200g）" maxlength="40" />
          <input id="f-kcal" type="number" min="0" step="1" placeholder="kcal(空欄でPFCから自動)" />
        </div>
        <div class="row">
          <input id="f-protein" type="number" min="0" step="0.1" placeholder="P(g)" />
          <input id="f-fat" type="number" min="0" step="0.1" placeholder="F(g)" />
          <input id="f-carbs" type="number" min="0" step="0.1" placeholder="C(g)" />
          <button type="submit" class="primary">追加</button>
        </div>
      </form>

      ${list}
    </section>
  `;
}

/** kcal/P/F/C の進捗バー。targetsMode=true なら目標そのものを100%表示。 */
function macroBars(
  targets: MacroTargets,
  consumed: MacroTargets,
  targetsMode: boolean,
): string {
  const rows: Array<[string, keyof MacroTargets, string]> = [
    ["カロリー", "kcal", "kcal"],
    ["タンパク質 P", "protein", "g"],
    ["脂質 F", "fat", "g"],
    ["炭水化物 C", "carbs", "g"],
  ];
  return (
    `<div class="bars">` +
    rows
      .map(([label, key, unit]) => {
        const tgt = targets[key];
        const con = consumed[key];
        const pct = tgt > 0 ? Math.min(100, Math.round((con / tgt) * 100)) : 0;
        const over = tgt > 0 && con > tgt;
        const valueText = targetsMode
          ? `${Math.round(tgt).toLocaleString("ja-JP")}${unit === "kcal" ? " kcal" : unit}`
          : `${Math.round(con).toLocaleString("ja-JP")} / ${Math.round(tgt).toLocaleString("ja-JP")}${unit === "kcal" ? " kcal" : unit}`;
        return `
        <div class="bar-row">
          <div class="bar-label"><span>${label}</span><span class="${over ? "neg" : "muted"}">${valueText}</span></div>
          <div class="bar-track"><div class="bar-fill ${over ? "over" : ""}" style="width:${targetsMode ? 100 : pct}%"></div></div>
        </div>`;
      })
      .join("") +
    `</div>`
  );
}

function llmHtml(): string {
  return `
    <div class="llm">
      <p class="muted">食事メモを貼ると AI が各食品の kcal/PFC を推定して追加します（推定値・目安。OpenAI互換APIキーはこの端末のみに保存）。</p>
      <div class="row">
        <label><input type="checkbox" id="llm-enabled" ${llm.enabled ? "checked" : ""}/> 有効</label>
      </div>
      <div class="row">
        <input id="llm-endpoint" type="text" placeholder="エンドポイント" value="${esc(llm.endpoint)}" />
        <input id="llm-model" type="text" placeholder="モデル" value="${esc(llm.model)}" />
      </div>
      <div class="row">
        <input id="llm-key" type="password" placeholder="APIキー" value="${esc(llm.apiKey)}" />
        <button id="llm-save">設定を保存</button>
      </div>
      <textarea id="llm-text" placeholder="例: 鶏むね肉200g、白米150g、卵2個、味噌汁" rows="3"></textarea>
      <button id="llm-extract" ${isLlmReady(llm) ? "" : "disabled"}>AIで推定して ${selectedDate} に追加</button>
      <p id="llm-msg" class="muted"></p>
    </div>
  `;
}

function footerHtml(): string {
  return `一般的な推定式(Mifflin-St Jeor)による目安で、医療・栄養指導ではありません。データはこの端末のブラウザ(localStorage)だけに保存され、サーバーには送信されません。`;
}

// =============================================================
// イベント結線（full re-render なので毎回取り直す）
// =============================================================
function bind(): void {
  // プロフィール入力：変更のたびに再計算・保存
  const pf = app.querySelector<HTMLFormElement>("#profile-form")!;
  pf.addEventListener("input", () => {
    profile = readProfileForm();
    persist();
    render();
  });
  pf.addEventListener("submit", (e) => e.preventDefault());
  app.querySelector("#reset-profile")!.addEventListener("click", () => {
    profile = { ...DEFAULT_PROFILE };
    persist();
    render();
  });

  // 日付切替
  app.querySelector<HTMLInputElement>("#log-date")!.addEventListener("change", (e) => {
    const v = (e.target as HTMLInputElement).value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) selectedDate = v;
    render();
  });

  // 食事追加
  app.querySelector<HTMLFormElement>("#food-form")!.addEventListener("submit", (e) => {
    e.preventDefault();
    const name =
      (app.querySelector<HTMLInputElement>("#f-name")!.value || "").trim() || "食事";
    const protein = numField("#f-protein");
    const fat = numField("#f-fat");
    const carbs = numField("#f-carbs");
    let kc = numField("#f-kcal");
    if (kc <= 0) kc = macroKcal({ protein, fat, carbs }); // 空欄ならPFCから
    if (kc <= 0 && protein <= 0 && fat <= 0 && carbs <= 0) {
      alert("kcal または PFC を入力してください。");
      return;
    }
    log.push(
      normalizeEntry({
        id: newId("f"),
        name,
        kcal: kc,
        protein,
        fat,
        carbs,
        date: selectedDate,
        createdAt: Date.now(),
      }),
    );
    persist();
    render();
  });

  app.querySelectorAll<HTMLButtonElement>(".del-food").forEach((btn) =>
    btn.addEventListener("click", () => {
      log = log.filter((e) => e.id !== btn.dataset.id);
      persist();
      render();
    }),
  );

  // AI・バックアップ
  app.querySelector("#toggle-llm")!.addEventListener("click", () => {
    showLlm = !showLlm;
    render();
  });
  app.querySelector("#export-json")!.addEventListener("click", () => {
    downloadText(
      `macro-planner-${todayStr()}.json`,
      JSON.stringify({ profile, log }, null, 2),
    );
  });
  app.querySelector("#import-json")!.addEventListener("click", importJson);

  if (showLlm) bindLlm();
}

function readProfileForm(): Profile {
  return normalizeProfile({
    sex: app.querySelector<HTMLSelectElement>("#p-sex")!.value,
    age: numField("#p-age"),
    heightCm: numField("#p-height"),
    weightKg: numField("#p-weight"),
    activity: app.querySelector<HTMLSelectElement>("#p-activity")!.value,
    goal: app.querySelector<HTMLSelectElement>("#p-goal")!.value,
    proteinPerKg: numField("#p-protein"),
    fatPercent: numField("#p-fat") / 100, // % 入力 → 割合
  });
}

function numField(sel: string): number {
  const el = app.querySelector<HTMLInputElement>(sel);
  const n = Number(el?.value);
  return Number.isFinite(n) ? n : 0;
}

function bindLlm(): void {
  app.querySelector("#llm-save")!.addEventListener("click", () => {
    llm = {
      enabled: app.querySelector<HTMLInputElement>("#llm-enabled")!.checked,
      endpoint: app.querySelector<HTMLInputElement>("#llm-endpoint")!.value.trim(),
      model: app.querySelector<HTMLInputElement>("#llm-model")!.value.trim(),
      apiKey: app.querySelector<HTMLInputElement>("#llm-key")!.value.trim(),
    };
    saveLlmSettings(llm);
    render();
  });
  const extractBtn = app.querySelector<HTMLButtonElement>("#llm-extract");
  if (extractBtn)
    extractBtn.addEventListener("click", async () => {
      const text = app.querySelector<HTMLTextAreaElement>("#llm-text")!.value;
      const msg = app.querySelector<HTMLParagraphElement>("#llm-msg")!;
      msg.textContent = "推定中…";
      try {
        const items = await estimateFoods(text, llm);
        for (const it of items) {
          log.push(
            normalizeEntry({
              id: newId("f"),
              name: it.name,
              kcal: it.kcal || macroKcal(it),
              protein: it.protein,
              fat: it.fat,
              carbs: it.carbs,
              date: selectedDate,
              createdAt: Date.now(),
            }),
          );
        }
        persist();
        msg.textContent = `${items.length}件を ${selectedDate} に追加しました。`;
        setTimeout(render, 600);
      } catch (err) {
        msg.textContent = `推定に失敗しました: ${(err as Error).message}`;
      }
    });
}

// ---- file io ----
function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result)) as {
          profile?: unknown;
          log?: unknown;
        };
        if (obj.profile) profile = normalizeProfile(obj.profile);
        if (Array.isArray(obj.log)) {
          log = obj.log.map(normalizeEntry);
        }
        persist();
        render();
      } catch {
        alert("JSONの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

render();
