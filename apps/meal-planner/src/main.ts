import "./style.css";
import type { PlannerInput, WeeklyPlan, Genre, Allergen } from "./types";
import { ALL_ALLERGENS, ALL_GENRES } from "./types";
import { buildPlan } from "./plan";
import { groupByCategory } from "./shopping";
import { recipeArt } from "./art";
import type { Recipe } from "./types";
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
const icon = (name: string) => `<img class="icon" src="./art/${name}.svg" alt="" width="22" height="22"/>`;
const art = (r: Recipe) => `<img class="food-art" src="./art/${recipeArt(r)}.svg" alt="" width="80" height="80"/>`;
// Remove credentials left by older versions; no network AI functionality remains.
try { localStorage.removeItem("meal-planner.llm"); } catch { /* storage unavailable */ }

const INPUT_KEY = "meal-planner.input";

function normalizeInput(value: unknown): PlannerInput {
  const v = value && typeof value === "object" ? value as Partial<PlannerInput> : {};
  const count = (n: unknown, fallback: number, min: number) =>
    typeof n === "number" && Number.isFinite(n) ? Math.min(10, Math.max(min, Math.floor(n))) : fallback;
  const strings = (a: unknown): string[] => Array.isArray(a) ? a.filter((x): x is string => typeof x === "string" && !!x.trim()).map(x => x.trim()) : [];
  return {
    adults: count(v.adults, 2, 1), children: count(v.children, 0, 0),
    genres: strings(v.genres).filter((g): g is Genre => ALL_GENRES.includes(g as Genre)),
    excludeAllergens: strings(v.excludeAllergens).filter((a): a is Allergen => ALL_ALLERGENS.includes(a as Allergen)),
    ngKeywords: strings(v.ngKeywords), pantry: strings(v.pantry),
    withSide: v.withSide !== false, quickOnly: v.quickOnly === true,
    seed: typeof v.seed === "number" && Number.isFinite(v.seed) ? v.seed >>> 0 : 1,
  };
}
function loadInput(): PlannerInput {
  try { return normalizeInput(JSON.parse(localStorage.getItem(INPUT_KEY) || "null")); }
  catch { return normalizeInput(null); }
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
const RESULT_KEY = "meal-planner.result.v2";
let plan: WeeklyPlan | null = null;
let planInput: PlannerInput = input;
let checked = new Set<number>();
try {
  const saved = JSON.parse(localStorage.getItem(RESULT_KEY) || localStorage.getItem("meal-planner.result.v1") || "null");
  if (saved?.input) {
    planInput = normalizeInput(saved.input);
    plan = buildPlan(planInput);
    checked = new Set<number>(saved.version === 2 ? saved.checked || [] : []);
  }
} catch { /* Invalid or unavailable storage: start with an empty result. */ }
function saveResult(): boolean {
  try {
    localStorage.setItem(RESULT_KEY, JSON.stringify({ version: 2, input: planInput, checked: [...checked] }));
    return true;
  } catch {
    flash("端末に保存できませんでした。買い物リストをコピーしてください。");
    return false;
  }
}

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
    <header><img class="hero-art" src="./art/steaming-bowl.svg" alt="" width="112" height="112"/><p class="eyebrow">毎日の「何作ろう？」を、ひと休み。</p>
      <h1>週間献立プランナー</h1>
      <p class="sub">家族の条件を選ぶだけで、1週間分の献立と買い物リストを自動作成。<br/>和・洋・中の141品から。登録なしで使えます。</p>
    </header>

    <form id="form" class="card"><h2>わが家の献立を作ろう</h2><p class="note">子どもは0.5人前で計算します。</p>
      <div class="row">
        <label>大人 <input type="number" id="adults" min="1" max="10" value="${input.adults}" /></label>
        <label>子ども <input type="number" id="children" min="0" max="10" value="${input.children}" /></label>
      </div>

      <fieldset>
        <legend>食べたいジャンル</legend>
        <div class="chips">${genreCheckboxes()}</div><p class="note allergy-note">未選択なら、和・洋・中をおまかせで。</p>
      </fieldset>

      <fieldset>
        <legend>除外する食物アレルギー</legend>
        <div class="chips">${allergenCheckboxes()}</div><p class="note allergy-note">選んだ品目を含む料理を除外します。加工品は商品によって原材料が異なります。購入時は表示を確認してください。対象は上記9品目です。調理時の混入にもご注意ください。</p>
      </fieldset>

      <label class="full">苦手・避けたい食材（「、」で区切る）
        <input type="text" id="ng" placeholder="例: なす、ピーマン" value="${esc(input.ngKeywords.join("、"))}" />
      </label>

      <label class="full">冷蔵庫の残り（あれば優先して使います）
        <input type="text" id="pantry" placeholder="例: キャベツ、鶏もも肉" value="${esc(input.pantry.join("、"))}" />
      </label>

      <div class="row toggles">
        <label class="toggle"><input type="checkbox" id="withSide" ${input.withSide ? "checked" : ""}/> 主菜＋副菜にする</label>
        <label class="toggle"><input type="checkbox" id="quickOnly" ${input.quickOnly ? "checked" : ""}/> 時短のみ(20分以内)</label>
      </div>

      <div class="actions">
        <button type="submit" class="primary">${icon("calendar-week")}献立を作る</button>
        <button type="button" id="reroll" class="ghost">${icon("refresh")}別の組み合わせ</button>
      </div>
    </form>

    <section id="result" tabindex="-1" aria-label="献立の結果"></section><footer>献立・買い物リストはこの端末に自動保存されます。<br/>イラスト: Fluent Emoji (MIT) / アイコン: Tabler Icons (MIT)</footer>
  `;

  wireForm();
  renderResult();
}

function readForm(): void {
  const q = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  input.adults = Math.min(10, Math.max(1, Math.floor(Number(q<HTMLInputElement>("adults").value) || 1)));
  input.children = Math.min(10, Math.max(0, Math.floor(Number(q<HTMLInputElement>("children").value) || 0)));
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

}

function generate(): void {
  try { saveInput(input); } catch { /* Result persistence reports storage failure below. */ }
  planInput = structuredClone(input);
  plan = buildPlan(planInput);
  checked.clear();
  const saved = saveResult();
  renderResult();
  const result = document.getElementById("result")!;
  result.scrollIntoView({ block: "start" });
  result.focus({ preventScroll: true });
  if (saved) flash("献立を作成し、端末に保存しました");
}

function flash(msg: string): void {
  const el = document.createElement("div");
  el.className = "flash";
  el.setAttribute("role", "status");
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
    ? `<div class="warn">${plan.warnings.map((w) => `${w}`).join("<br/>")}</div>`
    : "";

  if (plan.days.length === 0) { result.innerHTML = warnHtml; return; }

  const daysHtml = plan.days
    .map(
      (d) => `
      <article class="day">
        <div class="day-head"><span class="day-no">${["月", "火", "水", "木", "金", "土", "日"][d.day-1]}曜日</span><span class="badge ${d.main.genre}">${d.main.genre}</span><span class="time">${icon("clock")}${d.main.timeMin}分</span></div>
        <div class="dish main">${art(d.main)}<h3 class="name">${d.main.name}</h3></div>
        ${d.side ? `<div class="dish side">${art(d.side)}<span><small>副菜</small><br/>${d.side.name}</span><span class="badge ${d.side.genre}">${d.side.genre}</span></div>` : ""}
        <details class="ingredients"><summary>材料・アレルゲンを見る</summary>${[d.main, d.side].filter((r): r is Recipe => !!r).map(r => `<p><strong>${r.name}</strong><br/>${planInput.adults + planInput.children * .5}人前：${r.ingredients.map(i => `${i.name} ${formatQuantity(Math.round(i.qty * (planInput.adults + planInput.children * .5) / r.servingsBase * 10) / 10, i.unit)}`).join("、")}<br/><span class="note">対象アレルゲン：${r.allergens.join("・") || "登録した材料では該当なし"}</span></p>`).join("")}</details>
      </article>`,
    )
    .join("");

  const groups = groupByCategory(plan.shopping);
  let shoppingIndex = 0;
  const shopHtml = groups
    .map(
      (g) => `
      <div class="shop-group">
        <h3>${g.category}</h3>
        <ul>
          ${g.items
            .map(
              (it) => {
                const index = shoppingIndex++;
                return `<li><label><input type="checkbox" data-shopping="${index}" ${checked.has(index) ? "checked" : ""}/><span>${it.name}</span><span class="qty">${formatQuantity(it.qty, it.unit)}</span></label></li>`;
              }
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
      <div class="days">${daysHtml}</div>
    </div>

    <div class="card">
      <h2>買い物リスト</h2>
      <p class="sub">${planInput.adults + planInput.children}人分（子どもは0.5人前換算）</p>
      <button id="copy-shopping" class="ghost">${icon("copy")}買い物リストをコピー</button>
      <div class="shopping">${shopHtml}</div>
    </div>
  `;

  result.querySelectorAll<HTMLInputElement>("[data-shopping]").forEach((box) => {
    box.addEventListener("change", () => {
      const index = Number(box.dataset.shopping);
      if (box.checked) checked.add(index); else checked.delete(index);
      saveResult();
    });
  });
  document.getElementById("copy-shopping")!.addEventListener("click", async () => {
    let index = 0;
    const text = groups.map((g) => `${g.category}\n${g.items.map((it) =>
      `${checked.has(index++) ? "購入済み" : "未購入"} ${it.name} ${formatQuantity(it.qty, it.unit)}`
    ).join("\n")}`).join("\n\n");
    try { await navigator.clipboard.writeText(text); flash("買い物リストをコピーしました"); }
    catch { flash("コピーできませんでした。下の欄から選択してコピーしてください。");
      let fallback = document.querySelector<HTMLTextAreaElement>("#copy-fallback");
      if (!fallback) { fallback = document.createElement("textarea"); fallback.id = "copy-fallback"; fallback.setAttribute("aria-label", "コピー用の買い物リスト"); result.append(fallback); }
      fallback.value = text; fallback.focus(); fallback.select();
    }
  });

}

function formatQuantity(q: number, unit: string): string {
  if (unit === "少々") return unit;
  return ["大さじ", "小さじ"].includes(unit) ? `${unit}${q}` : `${q}${unit}`;
}

renderShell();
