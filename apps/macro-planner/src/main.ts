import "./style.css";
import type { ActivityLevel, FoodEntry, Goal, Macros, Profile, ProfileDraft, Sex } from "./types";
import { ACTIVITIES, ENTRY_MAX, GOALS, NAME_MAX, RANGE } from "./types";
import {
  ACTIVITY_FACTORS,
  BALANCE_RANGE,
  balanceNotes,
  bmi,
  bmiCategory,
  bmr,
  completeProfile,
  DEFAULT_FAT_PERCENT,
  DEFAULT_PROTEIN_PER_KG,
  entriesForDate,
  equivalents,
  type FieldKey,
  GOAL_RATES,
  macroKcal,
  macroTargets,
  parseNumber,
  pfcRatio,
  readField,
  remaining,
  standardWeight,
  sumEntries,
  tdee,
} from "./macro";
import { FOODS, foodById } from "./foods";
import { exportText, freshState, importText, load, newId, save, todayStr } from "./storage";
import { icon } from "./icons";

// ---- 状態 ----
let state = load();
let canSave = save(state);
let selectedDate = todayStr();
let undo: { log: FoodEntry[]; draft?: ProfileDraft } | null = null;
let toastTimer = 0;
let liveTimer = 0;

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel)!;

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
const fmt = (n: number) => Math.round(n).toLocaleString("ja-JP");
const fmt1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString("ja-JP", { maximumFractionDigits: 1 });
const art = (name: string, cls = "art", size = 64) =>
  `<img class="${cls}" src="./art/${name}.webp" alt="" width="${size}" height="${size}" />`;

// ---- 文言 ----
const SEX_LABEL: Record<Sex, string> = { female: "女性", male: "男性" };
const ACTIVITY_TEXT: Record<ActivityLevel, { title: string; desc: string; art: string }> = {
  sedentary: { title: "ほとんど動かない", desc: "座り仕事が中心。運動はしない", art: "couch" },
  light: { title: "すこし動く", desc: "軽い運動を週1〜3回。通勤で歩く", art: "walk" },
  moderate: { title: "ふつうに動く", desc: "運動を週3〜5回", art: "run" },
  active: { title: "よく動く", desc: "運動を週6〜7回。立ち仕事", art: "bike" },
  athlete: { title: "とてもよく動く", desc: "毎日はげしい運動。力仕事", art: "lift" },
};
const GOAL_TEXT: Record<Goal, { title: string; desc: string; art: string; phrase: string }> = {
  cut: { title: "やせたい", desc: "食べる量を 20% へらす", art: "down", phrase: "体重をへらすための量" },
  maintain: { title: "いまの体重", desc: "食べる量はそのまま", art: "keep", phrase: "いまの体重をたもつ量" },
  bulk: { title: "ふやしたい", desc: "食べる量を 10% ふやす", art: "up", phrase: "体重をふやすための量" },
};
const MACRO_NAME = { protein: "たんぱく質", fat: "脂質", carbs: "炭水化物" } as const;
const MACRO_LETTER = { protein: "P", fat: "F", carbs: "C" } as const;
const SAMPLE: Partial<ProfileDraft> = { sex: "female", age: 30, heightCm: 158, weightKg: 52 };

const FIELDS: Array<{ key: FieldKey; label: string; unit: string; ph: string; mode: string }> = [
  { key: "age", label: "年齢", unit: "歳", ph: "30", mode: "numeric" },
  { key: "heightCm", label: "身長", unit: "cm", ph: "160", mode: "decimal" },
  { key: "weightKg", label: "体重", unit: "kg", ph: "55", mode: "decimal" },
];

const fieldHtml = (f: { key: string; label: string; unit: string; ph: string; mode: string }, cls = "num-field") => `
  <div class="${cls}">
    <label for="in-${f.key}">${f.label}</label>
    <div class="num-row">
      <input id="in-${f.key}" data-field="${f.key}" type="text" inputmode="${f.mode}" autocomplete="off"
        enterkeyhint="next" placeholder="${f.ph}" aria-describedby="msg-${f.key}" />
      <span class="unit" aria-hidden="true">${f.unit}</span>
    </div>
    <p id="msg-${f.key}" class="field-msg" aria-live="polite"></p>
  </div>`;

// ---- 骨組み（1回だけ描く）----
const app = $("#app");
app.innerHTML = `
  <a class="skip" href="#result">結果へ移動</a>
  <header class="top">
    <div class="top-text">
      <p class="brand">PFC・TDEE計算</p>
      <h1><span class="nb">1日に食べる量の</span><span class="nb">目安がわかる。</span></h1>
    </div>
    ${art("salad", "top-art", 160)}
    <p class="lead">体のことを入れるだけ。目標カロリーと、たんぱく質・脂質・炭水化物（PFC）のバランスを出します。</p>
  </header>

  <main class="layout">
    <section class="card area-profile" aria-labelledby="h-profile">
      <h2 id="h-profile"><span class="step">1</span>あなたのこと</h2>
      <fieldset class="group">
        <legend>性別</legend>
        <div class="seg seg-2">
          ${(["female", "male"] as Sex[])
            .map((s) => `<label class="seg-btn"><input class="vh" type="radio" name="sex" value="${s}" /><span>${SEX_LABEL[s]}</span></label>`)
            .join("")}
        </div>
      </fieldset>
      <div class="nums">${FIELDS.map((f) => fieldHtml(f)).join("")}</div>

      <fieldset class="group">
        <legend>ふだんの動き</legend>
        <div class="choices choices-act">
          ${ACTIVITIES.map(
            (a) => `<label class="choice"><input class="vh" type="radio" name="activity" value="${a}" />
              ${art(ACTIVITY_TEXT[a].art, "choice-art", 48)}
              <span class="choice-text"><strong>${ACTIVITY_TEXT[a].title}</strong><span>${ACTIVITY_TEXT[a].desc}</span></span></label>`,
          ).join("")}
        </div>
      </fieldset>

      <fieldset class="group">
        <legend>目的</legend>
        <div class="choices choices-goal">
          ${GOALS.map(
            (g) => `<label class="choice choice-v"><input class="vh" type="radio" name="goal" value="${g}" />
              ${art(GOAL_TEXT[g].art, "choice-art", 48)}
              <span class="choice-text"><strong>${GOAL_TEXT[g].title}</strong><span>${GOAL_TEXT[g].desc}</span></span></label>`,
          ).join("")}
        </div>
      </fieldset>

      <details class="adv" id="adv">
        <summary>PFC の割合を変える${icon("chevron-down")}</summary>
        <div class="adv-body">
          ${fieldHtml({ key: "proteinPerKg", label: "たんぱく質（体重1kgあたり）", unit: "g", ph: String(DEFAULT_PROTEIN_PER_KG), mode: "decimal" }, "num-field wide")}
          <p class="hint">はじめは ${DEFAULT_PROTEIN_PER_KG}g。${RANGE.proteinPerKg.min}〜${RANGE.proteinPerKg.max}g で決めます。運動をよくする人は多めにします。</p>
          ${fieldHtml({ key: "fatPercent", label: "脂質（カロリーのうち）", unit: "%", ph: String(DEFAULT_FAT_PERCENT), mode: "numeric" }, "num-field wide")}
          <p class="hint">はじめは ${DEFAULT_FAT_PERCENT}%。国の目安は ${BALANCE_RANGE.fat.min}〜${BALANCE_RANGE.fat.max}% です。炭水化物は残りから決まります。</p>
          <button type="button" class="ghost-btn" data-act="adv-reset">${icon("arrow-back-up")}<span>はじめの値に戻す</span></button>
        </div>
      </details>
    </section>

    <section class="card result area-result" id="result" aria-labelledby="h-result" tabindex="-1">
      <h2 id="h-result"><span class="step">2</span>1日の目標</h2>
      <div id="result-body"></div>
    </section>

    <section class="card area-log" aria-labelledby="h-log">
      <h2 id="h-log"><span class="step">3</span>食べたものを記録</h2>
      <div class="log-date">
        <label for="log-date">日付</label>
        <input id="log-date" type="date" required />
        <button type="button" class="ghost-btn" data-act="today">${icon("calendar")}<span>今日</span></button>
      </div>
      <div id="log-summary" class="log-summary"></div>
      <div class="log-grid">
        <div>
          <h3>よく食べるもの</h3>
          <p class="hint">押すと、その量を1つ記録します。</p>
          <div class="foods">
            ${FOODS.map(
              (f) => `<button type="button" class="food" data-food="${f.id}">
                ${art(f.art, "food-art", 44)}
                <span class="food-text"><span class="food-name">${f.name}</span><span class="food-amt">${f.amount}</span></span>
                <span class="food-kcal">${fmt(f.kcal)}<small>kcal</small></span>
              </button>`,
            ).join("")}
          </div>
          <details class="adv custom" id="custom">
            <summary>${icon("plus")}そのほかの食べ物を入れる${icon("chevron-down")}</summary>
            <form id="custom-form" class="adv-body" novalidate>
              <div class="num-field wide">
                <label for="c-name">食べ物の名前</label>
                <input id="c-name" type="text" maxlength="${NAME_MAX}" autocomplete="off" placeholder="例: 牛丼 並" />
              </div>
              <p class="hint">袋やメニューの「栄養成分表示」を見て入れます。カロリーが空なら PFC から計算します。</p>
              <div class="nums nums-4">
                ${[
                  { key: "kcal", label: "カロリー", unit: "kcal", ph: "0", mode: "decimal" },
                  { key: "protein", label: "たんぱく質", unit: "g", ph: "0", mode: "decimal" },
                  { key: "fat", label: "脂質", unit: "g", ph: "0", mode: "decimal" },
                  { key: "carbs", label: "炭水化物", unit: "g", ph: "0", mode: "decimal" },
                ]
                  .map((f) => `<div class="num-field">
                    <label for="c-${f.key}">${f.label}</label>
                    <div class="num-row"><input id="c-${f.key}" type="text" inputmode="${f.mode}" autocomplete="off" placeholder="${f.ph}" aria-describedby="c-msg" /><span class="unit" aria-hidden="true">${f.unit}</span></div>
                  </div>`)
                  .join("")}
              </div>
              <p id="c-msg" class="field-msg" aria-live="polite"></p>
              <button type="submit" class="main-btn">${icon("plus")}<span>記録する</span></button>
            </form>
          </details>
        </div>
        <div>
          <h3 id="h-entries">この日に食べたもの</h3>
          <ul class="entries" id="entries" aria-labelledby="h-entries"></ul>
        </div>
      </div>
    </section>
  </main>

  <footer class="foot">
    <div class="foot-actions">
      <button type="button" class="ghost-btn" data-act="export">${icon("download")}<span>記録を書き出す</span></button>
      <button type="button" class="ghost-btn" data-act="import">${icon("upload")}<span>書き出した記録を読み込む</span></button>
      <button type="button" class="ghost-btn danger" data-act="reset">${icon("trash")}<span>すべて消す</span></button>
      <input type="file" id="import-file" accept="application/json,.json" hidden />
    </div>
    <p id="save-note" class="hint"></p>
    <p class="note">${icon("info-circle")}<span>計算は一般的な式による目安です。病気の治療中・妊娠中・成長期の人は、医師や管理栄養士の指示を優先してください。</span></p>
    <p class="credit">入力した内容は、このスマホ（ブラウザ）の中にだけ残ります。キャッシュと同じで、外には送りません。<br />
      <a href="../">ほかのアプリ</a></p>
  </footer>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <p class="sr-only" id="live" aria-live="polite"></p>
`;

// ---- 入力欄に保存内容を戻す ----
function fillForm(): void {
  const d = state.draft;
  for (const r of document.querySelectorAll<HTMLInputElement>('input[name="sex"]')) r.checked = r.value === d.sex;
  for (const r of document.querySelectorAll<HTMLInputElement>('input[name="activity"]')) r.checked = r.value === d.activity;
  for (const r of document.querySelectorAll<HTMLInputElement>('input[name="goal"]')) r.checked = r.value === d.goal;
  const keys: FieldKey[] = ["age", "heightCm", "weightKg", "proteinPerKg", "fatPercent"];
  for (const k of keys) {
    const el = $<HTMLInputElement>(`#in-${k}`);
    const v = d[k];
    el.value = v === null ? "" : String(v);
    el.removeAttribute("aria-invalid");
    $(`#msg-${k}`).textContent = "";
  }
  $<HTMLInputElement>("#log-date").value = selectedDate;
}

function commit(): void {
  canSave = save(state);
  renderResult();
  renderLog();
  $("#save-note").textContent = canSave ? "" : "この画面では保存できないため、閉じると入力が消えます（計算はできます）。";
}

// ---- 結果 ----
function ringSvg(m: Macros): string {
  const r = pfcRatio(m);
  const keys = ["protein", "fat", "carbs"] as const;
  const gap = 1;
  let start = 0;
  const segs = keys
    .map((k) => {
      const len = r[k];
      const seg = len > 0
        ? `<circle class="ring-${k}" cx="60" cy="60" r="46" pathLength="100" stroke-dasharray="${Math.max(0, len - gap)} ${100 - Math.max(0, len - gap)}" stroke-dashoffset="${-start}" />`
        : "";
      start += len;
      return seg;
    })
    .join("");
  const label = `PFC の割合。${keys.map((k) => `${MACRO_NAME[k]} ${r[k]}%`).join("、")}`;
  return `<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="${label}">
    <circle class="ring-bg" cx="60" cy="60" r="46" />
    <g transform="rotate(-90 60 60)">${segs}</g>
    <text x="60" y="56" class="ring-small" text-anchor="middle">PFC</text>
    <text x="60" y="76" class="ring-small" text-anchor="middle">バランス</text>
  </svg>`;
}

function emptyResult(d: ProfileDraft): string {
  const missing = [
    d.sex === null ? "性別" : "",
    d.age === null ? "年齢" : "",
    d.heightCm === null ? "身長" : "",
    d.weightKg === null ? "体重" : "",
  ].filter(Boolean);
  return `<div class="empty">
    ${art("plate", "empty-art", 96)}
    <p><strong>${missing.join("・")}</strong>を入れると、ここに1日の目標カロリーと PFC が出ます。</p>
    <button type="button" class="main-btn" data-act="sample">${icon("sparkles")}<span>見本の値で試す</span></button>
    <p class="hint">見本: 30歳・女性・158cm・52kg</p>
  </div>`;
}

function renderResult(): void {
  const p = completeProfile(state.draft);
  const body = $("#result-body");
  if (!p) {
    body.innerHTML = emptyResult(state.draft);
    return;
  }
  const t = macroTargets(p);
  const ratio = pfcRatio(t);
  const eq = equivalents(t);
  const notes = balanceNotes(t);
  const b = bmi(p.heightCm, p.weightKg);
  const keys = ["protein", "fat", "carbs"] as const;
  body.innerHTML = `
    <div class="target">
      <p class="target-label">1日の目標カロリー</p>
      <p class="target-num"><span class="num" id="target-kcal">${fmt(t.kcal)}</span><span class="unit">kcal</span></p>
      <p class="target-phrase">${GOAL_TEXT[p.goal].phrase}</p>
      ${t.raisedToBmr ? `<p class="warn">${icon("alert-triangle")}<span>減らしすぎないよう、基礎代謝（${fmt(t.kcal)} kcal）まで引き上げています。</span></p>` : ""}
    </div>

    <div class="pfc">
      ${ringSvg(t)}
      <ul class="pfc-list">
        ${keys
          .map(
            (k) => `<li class="pfc-${k}">
              <span class="dot" aria-hidden="true"></span>
              <span class="pfc-name">${MACRO_NAME[k]}<small>（${MACRO_LETTER[k]}）</small></span>
              <span class="pfc-g" data-macro="${k}">${fmt(t[k])}<small>g</small></span>
              <span class="pfc-pct">${ratio[k]}%<small>目安 ${BALANCE_RANGE[k].min}〜${BALANCE_RANGE[k].max}%</small></span>
            </li>`,
          )
          .join("")}
      </ul>
    </div>
    ${
      t.carbsShort
        ? `<p class="warn">${icon("alert-triangle")}<span>たんぱく質と脂質だけで目標カロリーを超えています。「PFC の割合を変える」で少なくしてください。</span></p>`
        : notes.length
          ? `<p class="note-box">${icon("info-circle")}<span>${notes
              .map((n) => `${MACRO_NAME[n.key]}が国の目安より${n.dir === "high" ? "多め" : "少なめ"}`)
              .join("、")}です。</span></p>`
          : ""
    }

    <h3 class="eq-title">1日の食事の目安</h3>
    <p class="hint">1日分を、ひとつの食べ物にたとえると…</p>
    <ul class="eq">
      <li>${art("plate", "eq-art", 56)}<span><strong>1食あたり 約${fmt(eq.perMealKcal)}<small>kcal</small></strong><small>朝・昼・夜の3食に分けると</small></span></li>
      <li>${art("rice", "eq-art", 56)}<span><strong>ごはん 約${fmt1(eq.riceBowls)}杯分</strong><small>カロリーを茶碗（150g）で</small></span></li>
      <li>${art("chicken", "eq-art", 56)}<span><strong>鶏むね肉 約${fmt(eq.chickenGrams)}g分</strong><small>たんぱく質 ${fmt(t.protein)}g（卵なら約${fmt1(eq.eggs)}個）</small></span></li>
      <li>${art("bread", "eq-art", 56)}<span><strong>食パン 約${fmt1(eq.breadSlices)}枚分</strong><small>炭水化物 ${fmt(t.carbs)}g（6枚切り）</small></span></li>
      <li>${art("butter", "eq-art", 56)}<span><strong>バター 大さじ約${fmt1(eq.butterSpoons)}杯分</strong><small>脂質 ${fmt(t.fat)}g</small></span></li>
    </ul>

    <dl class="stats">
      <div><dt>基礎代謝</dt><dd>${fmt(bmr(p))}<small>kcal</small></dd></div>
      <div><dt>1日の消費</dt><dd>${fmt(tdee(p))}<small>kcal</small></dd></div>
      <div><dt>BMI</dt><dd>${b.toFixed(1)}<small>${bmiCategory(b)}</small></dd></div>
    </dl>
    <p class="hint">BMI 22 になる体重は ${fmt1(standardWeight(p.heightCm))}kg です。</p>

    <details class="adv how">
      <summary>計算のしかた${icon("chevron-down")}</summary>
      <div class="adv-body">${howText(p, t)}</div>
    </details>
  `;
  announce(t);
}

function howText(p: Profile, t: Macros): string {
  const base = `10×${fmt1(p.weightKg)} ＋ 6.25×${fmt1(p.heightCm)} − 5×${p.age} ${p.sex === "male" ? "＋ 5" : "− 161"}`;
  const rate = GOAL_RATES[p.goal];
  return `<ol class="how-list">
    <li><strong>基礎代謝</strong>（何もしなくても使う量）= ${base} = <b>${fmt(bmr(p))} kcal</b><br /><small>Mifflin-St Jeor 式</small></li>
    <li><strong>1日の消費</strong> = 基礎代謝 × ${ACTIVITY_FACTORS[p.activity]}（${ACTIVITY_TEXT[p.activity].title}）= <b>${fmt(tdee(p))} kcal</b></li>
    <li><strong>目標カロリー</strong> = 1日の消費 × ${rate === 0 ? "1" : `${1 + rate}（${rate > 0 ? "＋" : "−"}${Math.abs(rate * 100)}%）`} = <b>${fmt(t.kcal)} kcal</b></li>
    <li><strong>たんぱく質</strong> = 体重 ${fmt1(p.weightKg)}kg × ${p.proteinPerKg}g = <b>${fmt(t.protein)}g</b></li>
    <li><strong>脂質</strong> = 目標カロリーの ${p.fatPercent}% ÷ 9 = <b>${fmt(t.fat)}g</b></li>
    <li><strong>炭水化物</strong> = 残りのカロリー ÷ 4 = <b>${fmt(t.carbs)}g</b></li>
  </ol>
  <p class="hint">1g あたり たんぱく質と炭水化物は 4kcal、脂質は 9kcal で計算します。</p>`;
}

function announce(t: Macros): void {
  window.clearTimeout(liveTimer);
  liveTimer = window.setTimeout(() => {
    $("#live").textContent = `目標は1日 ${fmt(t.kcal)} キロカロリー。たんぱく質 ${fmt(t.protein)}g、脂質 ${fmt(t.fat)}g、炭水化物 ${fmt(t.carbs)}g。`;
  }, 1200);
}

// ---- 記録 ----
function bar(label: string, eaten: number, target: number | null, unit: string, cls: string): string {
  const pct = target && target > 0 ? Math.min(100, (eaten / target) * 100) : 0;
  const over = target !== null && eaten > target;
  return `<div class="bar ${cls}${over ? " over" : ""}">
    <div class="bar-label"><span>${label}</span><span>${unit === "kcal" ? fmt(eaten) : fmt1(eaten)}${target !== null ? ` / ${fmt(target)}` : ""}<small>${unit}</small></span></div>
    <div class="bar-track" aria-hidden="true"><div class="bar-fill" data-pct="${pct.toFixed(1)}"></div></div>
  </div>`;
}

function renderLog(): void {
  const p = completeProfile(state.draft);
  const t = p ? macroTargets(p) : null;
  const day = entriesForDate(state.log, selectedDate).sort((a, b) => b.createdAt - a.createdAt);
  const eaten = sumEntries(day);
  let head: string;
  if (!t) head = `<p class="hint">目標は「1 あなたのこと」を入れると出ます。記録だけでも使えます。</p>`;
  else {
    const rem = remaining(t, eaten);
    head =
      rem.kcal >= 0
        ? `<p class="left"><span>あと</span><strong>${fmt(rem.kcal)}</strong><span>kcal 食べられます</span></p>`
        : `<p class="left over"><span>目標より</span><strong>${fmt(-rem.kcal)}</strong><span>kcal 多く食べています</span></p>`;
  }
  $("#log-summary").innerHTML = `${head}
    ${bar("カロリー", eaten.kcal, t ? t.kcal : null, "kcal", "bar-kcal")}
    <div class="bars-3">
      ${bar("たんぱく質", eaten.protein, t ? t.protein : null, "g", "bar-protein")}
      ${bar("脂質", eaten.fat, t ? t.fat : null, "g", "bar-fat")}
      ${bar("炭水化物", eaten.carbs, t ? t.carbs : null, "g", "bar-carbs")}
    </div>`;
  // 公開版の CSP は style 属性を禁じるため、幅は CSSOM で入れる
  for (const el of document.querySelectorAll<HTMLElement>("#log-summary .bar-fill")) el.style.width = `${el.dataset.pct}%`;
  const list = $("#entries");
  list.innerHTML = day.length
    ? day
        .map(
          (e) => `<li class="entry">
          <span class="entry-text"><span class="entry-name">${esc(e.name)}</span>
            <span class="entry-sub"><span class="entry-kcal">${fmt(e.kcal)}<small>kcal</small></span>
            <span class="entry-pfc">P ${fmt1(e.protein)}g・F ${fmt1(e.fat)}g・C ${fmt1(e.carbs)}g</span></span></span>
          <button type="button" class="icon-btn" data-del="${esc(e.id)}" aria-label="${esc(e.name)}を消す">${icon("trash")}</button>
        </li>`,
        )
        .join("")
    : `<li class="entries-empty">まだありません。左の食べ物を押すと記録できます。</li>`;
}

// ---- お知らせ ----
function toast(text: string, withUndo: boolean): void {
  const el = $("#toast");
  el.innerHTML = `<span>${esc(text)}</span>${withUndo ? `<button type="button" data-act="undo">${icon("arrow-back-up")}<span>元に戻す</span></button>` : ""}`;
  el.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.classList.remove("show");
    undo = null;
  }, withUndo ? 8000 : 3000);
}

function addEntry(e: Omit<FoodEntry, "id" | "date" | "createdAt">, label = e.name): void {
  undo = { log: state.log.slice() };
  state.log.push({ ...e, id: newId(), date: selectedDate, createdAt: Date.now() });
  if (state.log.length > 3000) state.log.shift();
  commit();
  toast(`${label}を記録しました`, true);
}

// ---- 操作 ----
app.addEventListener("input", (ev) => {
  const el = ev.target as HTMLInputElement;
  const key = el.dataset.field as FieldKey | undefined;
  if (!key) return;
  const r = readField(key, el.value);
  const msg = $(`#msg-${key}`);
  msg.textContent = r.error;
  if (r.error) el.setAttribute("aria-invalid", "true");
  else el.removeAttribute("aria-invalid");
  if (r.error) return; // 直前の正しい値のまま
  if (key === "proteinPerKg" || key === "fatPercent") {
    state.draft[key] = r.value ?? (key === "proteinPerKg" ? DEFAULT_PROTEIN_PER_KG : DEFAULT_FAT_PERCENT);
  } else state.draft[key] = r.value;
  commit();
});

// 欄を離れたら、全角や単位つきの入力を半角の数字に整える
app.addEventListener("focusout", (ev) => {
  const el = ev.target as HTMLInputElement;
  const key = el.dataset?.field as FieldKey | undefined;
  if (!key) return;
  const r = readField(key, el.value);
  if (!r.error && r.value !== null) el.value = String(r.value);
});

app.addEventListener("change", (ev) => {
  const el = ev.target as HTMLInputElement;
  if (el.name === "sex") state.draft.sex = el.value as Sex;
  else if (el.name === "activity") state.draft.activity = el.value as ActivityLevel;
  else if (el.name === "goal") state.draft.goal = el.value as Goal;
  else if (el.id === "log-date") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(el.value)) selectedDate = el.value;
    else el.value = selectedDate;
  } else if (el.id === "import-file") {
    readImport(el);
    return;
  } else return;
  commit();
});

app.addEventListener("click", (ev) => {
  const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>("button");
  if (!btn) return;
  if (btn.dataset.food) {
    const f = foodById(btn.dataset.food);
    if (f) addEntry({ name: `${f.name}（${f.amount}）`, kcal: f.kcal, protein: f.protein, fat: f.fat, carbs: f.carbs }, f.name);
    return;
  }
  if (btn.dataset.del) {
    const e = state.log.find((x) => x.id === btn.dataset.del);
    if (!e) return;
    undo = { log: state.log.slice() };
    state.log = state.log.filter((x) => x.id !== e.id);
    commit();
    toast(`${e.name}を消しました`, true);
    $<HTMLElement>("#h-entries").setAttribute("tabindex", "-1");
    $<HTMLElement>("#h-entries").focus();
    return;
  }
  switch (btn.dataset.act) {
    case "sample":
      Object.assign(state.draft, SAMPLE);
      fillForm();
      commit();
      $("#result").focus();
      break;
    case "adv-reset":
      state.draft.proteinPerKg = DEFAULT_PROTEIN_PER_KG;
      state.draft.fatPercent = DEFAULT_FAT_PERCENT;
      fillForm();
      commit();
      break;
    case "today":
      selectedDate = todayStr();
      $<HTMLInputElement>("#log-date").value = selectedDate;
      commit();
      break;
    case "undo":
      if (undo) {
        state.log = undo.log;
        if (undo.draft) state.draft = undo.draft;
        undo = null;
        fillForm();
        commit();
        toast("元に戻しました", false);
      }
      break;
    case "export":
      download(`pfc-kiroku-${todayStr()}.json`, exportText(state));
      break;
    case "import":
      $<HTMLInputElement>("#import-file").click();
      break;
    case "reset": {
      undo = { log: state.log.slice(), draft: { ...state.draft } };
      state = freshState();
      fillForm();
      commit();
      toast("すべて消しました", true);
      break;
    }
  }
});

$<HTMLFormElement>("#custom-form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const msg = $("#c-msg");
  const read = (id: string, max: number): number | null | "bad" => {
    const n = parseNumber($<HTMLInputElement>(`#c-${id}`).value);
    if (n === null) return null;
    if (Number.isNaN(n) || n < 0 || n > max) return "bad";
    return Math.round(n * 10) / 10;
  };
  const vals = {
    kcal: read("kcal", ENTRY_MAX.kcal),
    protein: read("protein", ENTRY_MAX.g),
    fat: read("fat", ENTRY_MAX.g),
    carbs: read("carbs", ENTRY_MAX.g),
  };
  if (Object.values(vals).includes("bad")) {
    msg.textContent = `数字で入れてください（カロリーは ${fmt(ENTRY_MAX.kcal)}、ほかは ${ENTRY_MAX.g}g まで）。`;
    return;
  }
  const v = vals as Record<keyof typeof vals, number | null>;
  if (v.kcal === null && v.protein === null && v.fat === null && v.carbs === null) {
    msg.textContent = "カロリーか PFC のどれかを入れてください。";
    return;
  }
  const protein = v.protein ?? 0;
  const fat = v.fat ?? 0;
  const carbs = v.carbs ?? 0;
  const kcal = v.kcal ?? Math.min(ENTRY_MAX.kcal, macroKcal({ protein, fat, carbs }));
  const name = $<HTMLInputElement>("#c-name").value.trim().slice(0, NAME_MAX) || "食べたもの";
  msg.textContent = "";
  for (const id of ["name", "kcal", "protein", "fat", "carbs"]) $<HTMLInputElement>(`#c-${id}`).value = "";
  addEntry({ name, kcal: Math.round(kcal), protein, fat, carbs });
});

function download(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function readImport(input: HTMLInputElement): void {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  file.text().then(
    (text) => {
      const next = importText(text);
      if (!next) {
        toast("読み込めませんでした。このアプリで書き出したファイルを選んでください。", false);
        return;
      }
      undo = { log: state.log.slice(), draft: { ...state.draft } };
      state = next;
      fillForm();
      commit();
      toast(`読み込みました（記録 ${next.log.length}件）`, true);
    },
    () => toast("ファイルを開けませんでした。", false),
  );
}

fillForm();
commit();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // 初回に読み込んだファイルも、次からオフラインで開けるよう控えておいてもらう
        const urls = [
          location.href.split("#")[0],
          ...performance
            .getEntriesByType("resource")
            .map((e) => e.name)
            .filter((u) => u.startsWith(location.origin)),
        ];
        reg.active?.postMessage({ type: "precache", urls });
      })
      .catch(() => {
        /* 登録できなくても通常どおり使える */
      });
  });
}
