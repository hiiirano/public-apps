import "./style.css";
import type { Allergen, DayPlan, Genre, GenrePref, LightMeal, Meal, MealSet, PlannerInput, Recipe, WeeklyPlan } from "./types";
import { ALL_ALLERGENS, GENRE_PREFS, MEAL_SETS, mealsOf } from "./types";
import { buildPlan } from "./plan";
import { formatQuantity, groupByCategory, itemKey, servingsFor } from "./shopping";
import { artSrc, FOOD_ART, MEAL_ART, recipeArt } from "./art";
import { icon } from "./icons";
import { load, save, type State } from "./storage";
import { addTerms, norm, resolveTerm, splitTerms } from "./foods";
import { RECIPES } from "./data/recipes";
import { dislikeCount, genreName, PREFERRED_DAYS, QUICK_MIN } from "./generator";

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;

const DOW = ["月", "火", "水", "木", "金", "土", "日"];
const DISLIKE_PRESETS = ["牛肉", "豚肉", "鶏肉", "魚", "えび", "かに", "いか", "貝", "ねぎ", "玉ねぎ", "きのこ", "なす", "ピーマン", "トマト", "にんじん", "辛いもの"];
const PANTRY_PRESETS = ["キャベツ", "玉ねぎ", "にんじん", "じゃがいも", "ねぎ", "なす", "ピーマン", "トマト", "きのこ", "卵", "鶏肉", "豚肉"];
const MEAL_NAME: Record<Meal, string> = { 朝: "朝食", 昼: "昼食", 晩: "夕食" };
const MEAL_SET_LABEL: Record<MealSet, string> = { 晩: "晩ごはんだけ", 朝晩: "朝と晩", 昼晩: "昼と晩", 朝昼晩: "朝・昼・晩" };
const GENRE_ART: Record<GenrePref, string> = { おまかせ: "bento-box", 和: "rice-ball", 洋: "spaghetti", 中: "dumpling" };

let state: State = load(1);
let plan: WeeklyPlan = buildPlan(state.input, state.swaps);
let canSave = save(state);
let weekVisible = true;
const app = $("#app");

const img = (name: string, cls: string, size: number) =>
  `<img class="${cls}" src="${artSrc(name)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" />`;

/* ---------- 画面の骨組み（1回だけ作る） ---------- */
function shell(): string {
  const i = state.input;
  const genreLabel = (g: GenrePref) => (g === "おまかせ" ? "おまかせ" : `${genreName(g)}多め`);
  return `
  <a class="skip" href="#week-h">献立へ移動</a>
  <header class="top">
    <div class="top-text">
      <p class="brand">登録なし・無料</p>
      <h1>週間献立プランナー</h1>
      <p class="lead">家族に合わせて、<b>7日分の献立</b>と<b>買い物リスト</b>を作ります。晩ごはん（主菜・副菜・汁物）に、朝・昼も足せます。和・洋・中 ${RECIPES.length}品から。</p>
    </div>
    <div class="top-art" aria-hidden="true">
      ${img("curry-rice", "ta ta1", 160)}${img("sushi", "ta ta2", 160)}${img("dumpling", "ta ta3", 160)}${img("spaghetti", "ta ta4", 160)}${img("pot-of-food", "ta ta5", 160)}
    </div>
  </header>

  <div class="layout">
    <section class="card settings" aria-labelledby="set-h">
      <h2 id="set-h">わが家の条件</h2>
      <p class="hint">選ぶと、すぐに献立が変わります。</p>

      <div class="field">
        <h3 class="f-title">何人分？</h3>
        <div class="steppers">
          ${stepper("adults", "大人", i.adults)}
          ${stepper("children", "子ども", i.children)}
        </div>
        <p class="note">子どもは大人の半分の量で計算します。</p>
      </div>

      <fieldset class="field">
        <legend class="f-title">作る食事</legend>
        <div class="meal-sets">
          ${MEAL_SETS.map(
            (m) => `<label class="genre-opt meal-opt">
              <input type="radio" name="mealSet" value="${m}" ${i.mealSet === m ? "checked" : ""} />
              <span class="m-arts">${mealsOf(m).map((x) => img(MEAL_ART[x], "m-art", 36)).join("")}</span><span>${MEAL_SET_LABEL[m]}</span></label>`,
          ).join("")}
        </div>
        <p class="note">朝は主食＋おかず1品、昼は1品（＋汁物）、晩は主菜・副菜・汁物。</p>
      </fieldset>

      <fieldset class="field">
        <legend class="f-title">好きなジャンル</legend>
        <div class="genres">
          ${GENRE_PREFS.map(
            (g) => `<label class="genre-opt g-${g}">
              <input type="radio" name="genre" value="${g}" ${i.genrePref === g ? "checked" : ""} />
              ${img(GENRE_ART[g], "g-art", 56)}<span>${genreLabel(g)}</span></label>`,
          ).join("")}
        </div>
        <p class="note" id="genre-hint"></p>
      </fieldset>

      <fieldset class="field">
        <legend class="f-title">食物アレルギー（外す）</legend>
        <div class="chips">
          ${ALL_ALLERGENS.map(
            (a) => `<label class="chip"><input type="checkbox" name="allergen" value="${a}" ${i.excludeAllergens.includes(a) ? "checked" : ""} /><span class="chip-check">${icon("check")}</span>${a}</label>`,
          ).join("")}
        </div>
        <p class="note">しょうゆ・ルウ・ハムなどの加工品も含めて、<b>少しでも疑わしい料理は外します</b>。商品によって原材料はちがうので、買うときに表示を確かめてください。ほかのアレルギーは、下の「苦手なもの」に入れると外せます。</p>
      </fieldset>

      <fieldset class="field">
        <legend class="f-title">苦手なもの（外す）</legend>
        <div class="foods">${DISLIKE_PRESETS.map((t) => foodButton("dislike", t)).join("")}</div>
        <label class="add-label" for="dislike-in">ほかに外したいもの</label>
        <div class="add-row">
          <input id="dislike-in" type="text" autocomplete="off" enterkeyhint="done" maxlength="40" placeholder="例: セロリ、カレー" />
          <button type="button" class="btn" data-add="dislike">${icon("plus")}追加</button>
        </div>
        <ul class="terms" id="dislike-list" aria-live="polite"></ul>
      </fieldset>

      <fieldset class="field">
        <legend class="f-title">冷蔵庫の残り（使う）</legend>
        <div class="foods">${PANTRY_PRESETS.map((t) => foodButton("pantry", t)).join("")}</div>
        <label class="add-label" for="pantry-in">ほかに使いたいもの</label>
        <div class="add-row">
          <input id="pantry-in" type="text" autocomplete="off" enterkeyhint="done" maxlength="40" placeholder="例: 大根、白菜" />
          <button type="button" class="btn" data-add="pantry">${icon("plus")}追加</button>
        </div>
        <ul class="terms" id="pantry-list" aria-live="polite"></ul>
      </fieldset>

      <fieldset class="field">
        <legend class="f-title">品数と時間</legend>
        <label class="switch"><input type="checkbox" id="withSide" ${i.withSide ? "checked" : ""} /><span class="sw" aria-hidden="true"></span>副菜をつける（晩）</label>
        <label class="switch"><input type="checkbox" id="withSoup" ${i.withSoup ? "checked" : ""} /><span class="sw" aria-hidden="true"></span>汁物をつける（昼・晩）</label>
        <label class="switch"><input type="checkbox" id="quickOnly" ${i.quickOnly ? "checked" : ""} /><span class="sw" aria-hidden="true"></span>${QUICK_MIN}分以内の料理だけ</label>
      </fieldset>
    </section>

    <div class="results">
      <section class="week-sec" aria-labelledby="week-h">
        <div class="sec-head">
          <h2 id="week-h" tabindex="-1">${img("spiral-calendar", "h-art", 48)}今週の献立</h2>
          <div class="tools">
            <button type="button" class="btn primary" data-act="reroll">${icon("refresh")}別の組み合わせ</button>
            <button type="button" class="btn" data-act="fold" aria-pressed="false">${icon("chevron-down")}<span>すべて閉じる</span></button>
          </div>
        </div>
        <div id="week-body"></div>
      </section>

      <section class="card shop-sec" aria-labelledby="shop-h">
        <div class="sec-head">
          <h2 id="shop-h">${img("shopping-cart", "h-art", 48)}買い物リスト</h2>
        </div>
        <div id="shop-body"></div>
      </section>
    </div>
  </div>

  <footer class="foot">
    <p>条件と買い物のチェックは、このスマホ（ブラウザ）の中にだけ残ります。外には送りません。</p>
    <p id="save-msg" class="warn-text" ${canSave ? "hidden" : ""}>この画面では保存できないため、閉じると条件が元に戻ります（献立は作れます）。</p>
    <p><a href="../">ほかのアプリ</a></p>
  </footer>

  <div class="bottom-bar" id="bottom-bar" hidden>
    <div class="bar-thumbs" id="bar-thumbs" aria-hidden="true"></div>
    <a class="bottom-link" href="#week-h" data-act="to-week">献立を見る</a>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

function stepper(id: "adults" | "children", label: string, v: number): string {
  return `<div class="stepper" role="group" aria-labelledby="${id}-l">
    <span class="st-label" id="${id}-l">${label}</span>
    <button type="button" class="round" data-step="${id}" data-d="-1" aria-label="${label}を1人へらす">${icon("minus")}</button>
    <output id="${id}-v" class="st-val" aria-live="polite">${v}人</output>
    <button type="button" class="round" data-step="${id}" data-d="1" aria-label="${label}を1人ふやす">${icon("plus")}</button>
  </div>`;
}

function foodButton(kind: "dislike" | "pantry", t: string): string {
  const on = has(kind, t);
  return `<button type="button" class="food" data-${kind}="${esc(t)}" aria-pressed="${on}">
    ${img(FOOD_ART[t] ?? "basket", "f-art", 48)}<span>${esc(t)}</span><span class="f-mark">${icon(kind === "dislike" ? "x" : "check")}</span></button>`;
}

const listOf = (kind: "dislike" | "pantry") => (kind === "dislike" ? state.input.dislikes : state.input.pantry);
const has = (kind: "dislike" | "pantry", t: string) => {
  const label = resolveTerm(t).label;
  return listOf(kind).some((x) => norm(x) === norm(t) || resolveTerm(x).label === label);
};

/* ---------- 条件の説明 ---------- */
function genreHint(): string {
  const g = state.input.genrePref;
  if (g === "おまかせ") return "和食・洋食・中華を、7日のうち 3日・2日・2日 にします。";
  const others = (["和", "洋", "中"] as Genre[]).filter((x) => x !== g).map(genreName).join("と");
  return `${genreName(g)}を7日のうち${PREFERRED_DAYS}日、${others}を合わせて${7 - PREFERRED_DAYS}日にします。`;
}

function dislikeLine(t: string): string {
  const r = resolveTerm(t);
  const n = dislikeCount(t);
  if (r.ingredients.length === 0)
    return n ? `料理名に「${esc(t)}」がつく ${n}品を外します` : `この名前の材料・料理はありません（外すものなし）`;
  const names = r.ingredients.slice(0, 4).join("・") + (r.ingredients.length > 4 ? " など" : "");
  return `${esc(names)}を使う ${n}品を外します${r.note ? `。<span class="sub-note">${esc(r.note)}</span>` : ""}`;
}

function pantryLine(t: string): string {
  const p = plan.pantry.find((x) => x.term === t);
  if (!p) return "";
  if (p.unknown) return `<span class="bad">この献立の料理では使いません</span>`;
  if (p.blocked && p.otherMeals) return `<span class="bad">朝食・昼食を作ると使えます（上の「作る食事」）</span>`;
  if (p.blocked) return `<span class="bad">使う料理がほかの条件で外れています</span>`;
  if (!p.used.length) return `<span class="bad">今週は使えませんでした。「別の組み合わせ」で変わることがあります</span>`;
  const many = mealsOf(state.input.mealSet).length > 1;
  const days = [...new Set(p.used.map((u) => DOW[u.day - 1] + (many ? `(${u.meal})` : "")))].join("・");
  return `<b>${days}</b>曜日で使います（${esc([...new Set(p.used.map((u) => u.recipe))].slice(0, 3).join("、"))}）`;
}

function renderTerms(kind: "dislike" | "pantry"): void {
  const list = listOf(kind);
  $(`#${kind}-list`).innerHTML = list
    .map(
      (t) => `<li class="term"><div class="term-text"><b>${esc(t)}</b><span>${kind === "dislike" ? dislikeLine(t) : pantryLine(t)}</span></div>
      <button type="button" class="icon-btn" data-remove-${kind}="${esc(t)}" aria-label="「${esc(t)}」をやめる">${icon("x")}</button></li>`,
    )
    .join("");
  document.querySelectorAll<HTMLButtonElement>(`button.food[data-${kind}]`).forEach((b) => {
    b.setAttribute("aria-pressed", String(has(kind, b.dataset[kind]!)));
  });
}

/* ---------- 献立 ---------- */
function dishHtml(r: Recipe, course: string, size: "big" | "mid" | "small"): string {
  const big = size !== "small";
  const uses = state.input.pantry.filter((t) => {
    const res = resolveTerm(t);
    return res.ingredients.length && r.ingredients.some((i) => res.ingredients.includes(i.name));
  });
  return `<div class="dish ${big ? `dish-main dish-${size}` : "dish-sub"}">
    ${img(recipeArt(r), "d-art", big ? 128 : 64)}
    <div class="d-text">
      <span class="course">${course}・${r.timeMin}分</span>
      <span class="d-name">${esc(r.name)}</span>
      ${uses.length ? `<span class="uses">${icon("check")}残り物：${esc(uses.join("・"))}</span>` : ""}
    </div>
  </div>`;
}

/** 1品ぶんの量の表示（g・ml は整数、個などは 0.5 きざみ） */
function dishQty(q: number, unit: string): number {
  if (unit === "g" || unit === "ml") return Math.max(1, Math.round(q));
  if (["個", "本", "枚", "玉", "丁", "尾", "缶", "袋", "束", "片", "切れ"].includes(unit)) return Math.max(0.5, Math.round(q * 2) / 2);
  return Math.round(q * 10) / 10;
}

function ingredientsHtml(recipes: Recipe[]): string {
  const servings = servingsFor(state.input);
  return recipes
    .map(
      (r) => `<div class="ing-dish"><b>${esc(r.name)}</b>
      <p>${r.ingredients.map((i) => `${esc(i.name)} ${formatQuantity(dishQty((i.qty * servings) / r.servingsBase, i.unit), i.unit)}`).join("、")}</p>
      <p class="allergen">アレルギー（9品目）：${r.allergens.length ? esc(r.allergens.join("・")) : "ふくまない"}</p></div>`,
    )
    .join("");
}

function mealHtml(d: DayPlan, meal: Meal, dishes: { r: Recipe; course: string }[], open: boolean): string {
  const key = meal === "晩" ? `${d.day}` : `${d.day}${meal}`;
  const [first, ...rest] = dishes;
  return `<details class="meal meal-${meal}" data-day="${d.day}" data-meal="${meal}" ${open ? "open" : ""}>
      <summary>
        ${img(MEAL_ART[meal], "mt-art", 28)}<span class="meal-name">${MEAL_NAME[meal]}</span>
        <span class="thumbs" aria-hidden="true">${dishes.map((x) => img(recipeArt(x.r), "t-art", 36)).join("")}</span>
        <span class="meal-sum">${esc(first.r.name)}${rest.length ? ` ほか${rest.length}品` : ""}</span>
        <span class="chev">${icon("chevron-down")}</span>
      </summary>
      <div class="meal-body">
        ${dishHtml(first.r, first.course, meal === "晩" ? "big" : "mid")}
        ${rest.length ? `<div class="subs">${rest.map((x) => dishHtml(x.r, x.course, "small")).join("")}</div>` : ""}
        <div class="meal-tools">
          <details class="ing"><summary>材料（${servingsFor(state.input)}人前）とアレルギー</summary>${ingredientsHtml(dishes.map((x) => x.r))}</details>
          <button type="button" class="btn small swap" data-swap="${key}">${icon("arrows-shuffle")}<span class="sr-only">${DOW[d.day - 1]}曜日の</span>${MEAL_NAME[meal]}を変える</button>
        </div>
      </div>
    </details>`;
}

function lightDishes(m: LightMeal | undefined, meal: "朝" | "昼"): { r: Recipe; course: string }[] {
  if (!m) return [];
  const out = [{ r: m.main, course: meal === "朝" ? "主食" : "1品" }];
  if (m.side) out.push({ r: m.side, course: /汁|スープ/.test(m.side.name) ? "汁物" : "おかず" });
  return out;
}

function dayHtml(d: DayPlan, open: boolean): string {
  const meals = mealsOf(state.input.mealSet);
  const parts: string[] = [];
  if (meals.includes("朝") && d.breakfast) parts.push(mealHtml(d, "朝", lightDishes(d.breakfast, "朝"), open));
  if (meals.includes("昼") && d.lunch) parts.push(mealHtml(d, "昼", lightDishes(d.lunch, "昼"), open));
  const dinner = [{ r: d.main, course: "主菜" }];
  if (d.side) dinner.push({ r: d.side, course: "副菜" });
  if (d.soup) dinner.push({ r: d.soup, course: "汁物" });
  parts.push(mealHtml(d, "晩", dinner, open));
  return `<article class="day g-${d.main.genre}" aria-labelledby="d${d.day}-h">
    <div class="day-top">
      <h3 id="d${d.day}-h" class="day-h"><span class="dow" aria-hidden="true">${DOW[d.day - 1]}</span>${DOW[d.day - 1]}曜日</h3>
      <span class="gbadge">晩は${genreName(d.main.genre)}</span>
    </div>
    ${parts.join("")}
  </article>`;
}

let folded = false;
function renderWeek(): void {
  const body = $("#week-body");
  const warn = plan.warnings.length
    ? `<div class="alert" role="alert">${icon("alert-triangle")}<div>${plan.warnings.map(esc).join("<br />")}</div></div>`
    : "";
  if (!plan.days.length) {
    body.innerHTML = warn;
    $("#bar-thumbs").innerHTML = "";
    return;
  }
  const counts = (["和", "洋", "中"] as Genre[]).map((g) => [g, plan.days.filter((d) => d.main.genre === g).length] as const);
  const quick = plan.days.filter((d) => d.main.timeMin <= QUICK_MIN).length;
  const used = plan.pantry.filter((p) => p.used.length).length;
  body.innerHTML = `${warn}
    <div class="overview">
      <div class="strip" role="img" aria-label="${counts.map(([g, n]) => `${genreName(g)}${n}日`).join("、")}">
        ${plan.days.map((d) => `<span class="cell g-${d.main.genre}"><span>${DOW[d.day - 1]}</span>${img(recipeArt(d.main), "s-art", 40)}</span>`).join("")}
      </div>
      <p class="ov-text">${counts.map(([g, n]) => `<span class="gdot g-${g}"></span>${genreName(g)} ${n}日`).join("　")}
      ／ ${mealsOf(state.input.mealSet).map((m) => MEAL_NAME[m]).join("・")} ${plan.days.length * mealsOf(state.input.mealSet).length}食 ／ 夕食の主菜が${QUICK_MIN}分以内の日 ${quick}日${state.input.pantry.length ? ` ／ 残り物 ${used}/${state.input.pantry.length}品を使用` : ""}</p>
      ${plan.notes.length ? `<p class="note">${plan.notes.map(esc).join(" ")}</p>` : ""}
    </div>
    <div class="days">${plan.days.map((d) => dayHtml(d, !folded)).join("")}</div>`;
  $("#bar-thumbs").innerHTML = plan.days.map((d) => img(recipeArt(d.main), "b-art", 32)).join("");
}

/* ---------- 買い物リスト ---------- */
function shoppingText(): string {
  const groups = groupByCategory(plan.shopping);
  return `買い物リスト（${servingsFor(state.input)}人前・7日分・${mealsOf(state.input.mealSet).map((m) => MEAL_NAME[m]).join("・")}）\n` +
    groups.map((g) => `【${g.category}】\n${g.items.map((it) => `${state.checked.includes(itemKey(it)) ? "✓" : "・"}${it.name} ${formatQuantity(it.qty, it.unit)}`).join("\n")}`).join("\n");
}
function menuText(): string {
  const meals = mealsOf(state.input.mealSet);
  const names = (rs: (Recipe | undefined)[]) => rs.filter((r): r is Recipe => !!r).map((r) => r.name).join("／");
  return "今週の献立\n" + plan.days.map((d) => {
    if (meals.length === 1) return `${DOW[d.day - 1]}　${names([d.main, d.side, d.soup])}`;
    const lines = [`${DOW[d.day - 1]}曜日`];
    if (meals.includes("朝") && d.breakfast) lines.push(`　朝: ${names([d.breakfast.main, d.breakfast.side])}`);
    if (meals.includes("昼") && d.lunch) lines.push(`　昼: ${names([d.lunch.main, d.lunch.side])}`);
    lines.push(`　晩: ${names([d.main, d.side, d.soup])}`);
    return lines.join("\n");
  }).join("\n");
}

function renderShop(): void {
  const body = $("#shop-body");
  if (!plan.days.length) {
    body.innerHTML = `<p class="empty">献立ができると、ここに買うものが出ます。</p>`;
    return;
  }
  const pantryNames = new Set(state.input.pantry.flatMap((t) => resolveTerm(t).ingredients));
  const groups = groupByCategory(plan.shopping);
  const keys = new Set(plan.shopping.map(itemKey));
  const done = state.checked.filter((k) => keys.has(k)).length;
  const row = (it: (typeof plan.shopping)[number]) => {
    const k = itemKey(it);
    return `<li><label class="item"><input type="checkbox" data-key="${esc(k)}" ${state.checked.includes(k) ? "checked" : ""} /><span class="box" aria-hidden="true">${icon("check")}</span>
      <span class="it-name">${esc(it.name)}${pantryNames.has(it.name) ? `<span class="home">家にある</span>` : ""}</span>
      <span class="qty">${formatQuantity(it.qty, it.unit)}</span></label></li>`;
  };
  body.innerHTML = `
    <p class="shop-meta">大人${state.input.adults}人・子ども${state.input.children}人（${servingsFor(state.input)}人前）・7日分（${mealsOf(state.input.mealSet).map((m) => MEAL_NAME[m]).join("・")}）　<b id="shop-count">${done}/${plan.shopping.length}</b> 買った</p>
    <div class="tools">
      <button type="button" class="btn primary" data-act="copy-shop">${icon("copy")}買い物リストをコピー</button>
      <button type="button" class="btn" data-act="copy-menu">${icon("copy")}献立をコピー</button>
    </div>
    <div class="shop-groups">
      ${groups
        .filter((g) => g.category !== "調味料")
        .map((g) => `<div class="shop-group"><h3>${g.category}</h3><ul>${g.items.map(row).join("")}</ul></div>`)
        .join("")}
    </div>
    ${groups
      .filter((g) => g.category === "調味料")
      .map((g) => `<details class="seasoning"><summary>調味料 ${g.items.length}品（家にあれば買わなくて大丈夫）</summary><ul>${g.items.map(row).join("")}</ul></details>`)
      .join("")}
    <p class="note">量は目安です。「家にある」は冷蔵庫の残りに入れたものです。</p>
    <textarea id="copy-fallback" class="copy-fallback" aria-label="コピー用の文" hidden readonly></textarea>`;
}

/* ---------- 更新 ---------- */
function persist(): void {
  canSave = save(state);
  $("#save-msg").hidden = canSave;
}

/** 条件が変わったら作り直す（「この日を変える」はリセット） */
function regenerate(opts: { keepSwaps?: boolean; announce?: string } = {}): void {
  if (!opts.keepSwaps) state.swaps = {};
  plan = buildPlan(state.input, state.swaps);
  persist();
  $("#genre-hint").textContent = genreHint();
  renderTerms("dislike");
  renderTerms("pantry");
  renderWeek();
  renderShop();
  if (opts.announce) toast(opts.announce);
}

function setInput<K extends keyof PlannerInput>(k: K, v: PlannerInput[K]): void {
  state.input = { ...state.input, [k]: v };
  regenerate({ announce: weekVisible ? undefined : "献立を作り直しました" });
}

function toggleTerm(kind: "dislike" | "pantry", t: string): void {
  const key = kind === "dislike" ? "dislikes" : "pantry";
  const list = listOf(kind);
  const label = resolveTerm(t).label;
  const next = has(kind, t) ? list.filter((x) => !(norm(x) === norm(t) || resolveTerm(x).label === label)) : addTerms(list, [t]);
  setInput(key, next);
}

function addFromInput(kind: "dislike" | "pantry"): void {
  const el = $<HTMLInputElement>(`#${kind}-in`);
  const words = splitTerms(el.value);
  if (!words.length) {
    el.focus();
    return;
  }
  const key = kind === "dislike" ? "dislikes" : "pantry";
  el.value = "";
  setInput(key, addTerms(listOf(kind), words));
  el.focus();
}

/* ---------- 操作 ---------- */
app.innerHTML = shell();
regenerate({ keepSwaps: true });

app.addEventListener("click", async (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>("button, a");
  if (!t) return;
  const d = t.dataset;
  if (d.step) {
    const k = d.step as "adults" | "children";
    const min = k === "adults" ? 1 : 0;
    const v = Math.min(10, Math.max(min, state.input[k] + Number(d.d)));
    $(`#${k}-v`).textContent = `${v}人`;
    if (v !== state.input[k]) setInput(k, v);
  } else if (d.dislike !== undefined) toggleTerm("dislike", d.dislike);
  else if (d.pantry !== undefined) toggleTerm("pantry", d.pantry);
  else if (d.add) addFromInput(d.add as "dislike" | "pantry");
  else if (d.removeDislike !== undefined || d.removePantry !== undefined) {
    const kind = d.removeDislike !== undefined ? "dislike" : "pantry";
    toggleTerm(kind, (d.removeDislike ?? d.removePantry)!);
    $(`#${kind}-in`).focus();
  } else if (d.swap) {
    const key = d.swap;
    const day = parseInt(key, 10);
    const meal: Meal = key.endsWith("朝") ? "朝" : key.endsWith("昼") ? "昼" : "晩";
    const mainOf = (p: WeeklyPlan) => { const x = p.days[day - 1]; return meal === "朝" ? x?.breakfast?.main : meal === "昼" ? x?.lunch?.main : x?.main; };
    state.swaps = { ...state.swaps, [key]: Math.min(50, (state.swaps[key] ?? 0) + 1) };
    const before = mainOf(plan)?.id;
    regenerate({ keepSwaps: true });
    const after = mainOf(plan);
    toast(!after || before === after.id ? "ほかに合う料理がありませんでした" : `${DOW[day - 1]}曜日の${MEAL_NAME[meal]}を「${after.name}」にしました`);
    $<HTMLButtonElement>(`[data-swap="${key}"]`)?.focus();
  } else if (d.act === "reroll") {
    state.input = { ...state.input, seed: (state.input.seed + 1) % 1_000_000 };
    regenerate({ announce: "別の組み合わせにしました" });
  } else if (d.act === "fold") {
    folded = !folded;
    document.querySelectorAll<HTMLDetailsElement>("details.meal").forEach((x) => (x.open = !folded));
    t.setAttribute("aria-pressed", String(folded));
    t.querySelector("span")!.textContent = folded ? "すべて開く" : "すべて閉じる";
  } else if (d.act === "copy-shop" || d.act === "copy-menu") {
    const text = d.act === "copy-shop" ? shoppingText() : menuText();
    try {
      await navigator.clipboard.writeText(text);
      toast(d.act === "copy-shop" ? "買い物リストをコピーしました" : "献立をコピーしました");
    } catch {
      const ta = $<HTMLTextAreaElement>("#copy-fallback");
      ta.hidden = false;
      ta.value = text;
      ta.focus();
      ta.select();
      toast("コピーできませんでした。下の欄から選んでコピーしてください。");
    }
  } else if (d.act === "to-week") {
    e.preventDefault();
    $("#week-h").scrollIntoView({ block: "start" });
    $("#week-h").focus({ preventScroll: true });
  }
});

app.addEventListener("change", (e) => {
  const el = e.target as HTMLInputElement;
  if (el.name === "genre") setInput("genrePref", el.value as GenrePref);
  else if (el.name === "mealSet") setInput("mealSet", el.value as MealSet);
  else if (el.name === "allergen") {
    const list = [...document.querySelectorAll<HTMLInputElement>('input[name="allergen"]:checked')].map((x) => x.value as Allergen);
    setInput("excludeAllergens", list);
  } else if (el.id === "withSide" || el.id === "withSoup" || el.id === "quickOnly") setInput(el.id, el.checked);
  else if (el.dataset.key) {
    const k = el.dataset.key;
    state.checked = el.checked ? [...new Set([...state.checked, k])] : state.checked.filter((x) => x !== k);
    persist();
    const keys = new Set(plan.shopping.map(itemKey));
    $("#shop-count").textContent = `${state.checked.filter((x) => keys.has(x)).length}/${plan.shopping.length}`;
  }
});

app.addEventListener("keydown", (e) => {
  const el = e.target as HTMLElement;
  if (e.key === "Enter" && (el.id === "dislike-in" || el.id === "pantry-in") && !e.isComposing) {
    e.preventDefault();
    addFromInput(el.id === "dislike-in" ? "dislike" : "pantry");
  }
});

// 献立が画面より下にあるとき（スマホで条件を選んでいるとき）だけ、下に「献立を見る」を出す
function updateBar(): void {
  const top = $(".week-sec").getBoundingClientRect().top;
  weekVisible = top < window.innerHeight && $(".week-sec").getBoundingClientRect().bottom > 0;
  $("#bottom-bar").hidden = !(top > window.innerHeight - 40);
}
let barQueued = false;
for (const ev of ["scroll", "resize"])
  window.addEventListener(ev, () => {
    if (barQueued) return;
    barQueued = true;
    requestAnimationFrame(() => {
      barQueued = false;
      updateBar();
    });
  }, { passive: true });
updateBar();

let toastTimer = 0;
function toast(message: string): void {
  const t = $("#toast");
  t.textContent = message;
  t.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("show"), 3500);
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // 初回に読み込んだファイルと料理の絵も、次からオフラインで開けるよう控えておいてもらう
        const names = new Set([...RECIPES.map(recipeArt), ...Object.values(FOOD_ART), ...Object.values(GENRE_ART), ...Object.values(MEAL_ART), "basket", "spiral-calendar", "shopping-cart", "curry-rice", "sushi", "dumpling", "spaghetti", "pot-of-food"]);
        const arts = [...names].map((n) => new URL(artSrc(n), location.href).href);
        const urls = [
          location.href.split("#")[0],
          ...performance.getEntriesByType("resource").map((e) => e.name).filter((u) => u.startsWith(location.origin)),
          ...arts,
        ];
        reg.active?.postMessage({ type: "precache", urls });
      })
      .catch(() => {
        /* 登録できなくても通常どおり使える */
      });
  });
}
