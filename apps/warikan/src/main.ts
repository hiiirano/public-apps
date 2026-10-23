import "./style.css";
import type { Level, Person, Rounding, State, Unit } from "./types";
import { LEVELS, MAX_AMOUNT, MAX_PEOPLE, MIN_PEOPLE, UNITS } from "./types";
import {
  calculate,
  DEFAULT_SETTINGS,
  differenceText,
  LESS_RANGE,
  LEVEL_LABEL,
  MORE_RANGE,
  nameOf,
  ratioLabel,
  shareText,
} from "./warikan";
import { formatRatio, formatYen, parseYen } from "./money";
import { freshState, load, NAME_MAX, newPerson, save } from "./storage";
import { icon } from "./icons";

// ---- 状態 ----
let state: State = load();
let canSave = save(state);
let undo: { people: Person[]; hostId: string; label: string } | null = null;
let ratioOpen = false;

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel)!;

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

const face = (p: Person, cls = "face") =>
  `<img class="${cls}" src="./art/face${p.face}.webp" alt="" width="96" height="96" />`;

function commit(): void {
  canSave = save(state);
  renderResult();
}

// ---- 骨組み（1回だけ描く）----
const app = $("#app");
app.innerHTML = `
  <a class="skip" href="#result">結果へ移動</a>
  <header class="top">
    <div class="top-text">
      <p class="brand">その場の割り勘</p>
      <h1>飲み会のお会計を、<br />30秒で割り勘。</h1>
      <p class="lead">金額と人数を入れるだけ。多め・少なめ・おごりも、そのまま計算します。</p>
    </div>
    <img class="top-art" src="./art/table.webp" alt="" width="960" height="391" />
  </header>

  <main class="layout">
    <section class="card area-amount" aria-labelledby="h-amount">
      <h2 id="h-amount"><span class="step">1</span>お会計の金額</h2>
      <label class="amount-label" for="amount">伝票の合計</label>
      <div class="amount-row">
        <input id="amount" class="amount" type="text" inputmode="numeric" autocomplete="off"
          enterkeyhint="done" placeholder="0" aria-describedby="amount-msg" />
        <span class="yen" aria-hidden="true">円</span>
      </div>
      <p id="amount-msg" class="field-msg" aria-live="polite"></p>
    </section>

    <section class="card area-people" aria-labelledby="h-people">
      <h2 id="h-people"><span class="step">2</span>だれと割る？</h2>
      <div class="count-row">
        <button type="button" class="round-btn" data-act="dec" aria-label="1人へらす">${icon("minus")}</button>
        <label class="count-field">
          <span class="sr-only">人数</span>
          <input id="count" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" />
          <span aria-hidden="true">人</span>
        </label>
        <button type="button" class="round-btn" data-act="inc" aria-label="1人ふやす">${icon("plus")}</button>
      </div>
      <p class="hint">人数は${MIN_PEOPLE}〜${MAX_PEOPLE}人。名前は空のままでも使えます。</p>
      <ol class="people" id="people"></ol>
      <button type="button" class="wide-btn" id="ratio-toggle" aria-expanded="false" aria-controls="ratio-panel">
        ${icon("adjustments-horizontal")}<span>少なめ・多めの割合を変える</span>
      </button>
      <div id="ratio-panel" class="ratio-panel" hidden></div>
    </section>

    <section class="card result area-result" id="result" aria-labelledby="h-result" tabindex="-1">
      <h2 id="h-result"><span class="step">3</span>みんなの支払い</h2>
      <div id="result-body"></div>
    </section>

    <section class="card area-round" id="rounding-card" aria-labelledby="h-round">
      <h2 id="h-round">端数の設定</h2>
      <fieldset class="seg-field">
        <legend>集める単位</legend>
        <div class="seg seg-5" id="units"></div>
      </fieldset>
      <fieldset class="seg-field">
        <legend>端数の扱い</legend>
        <div class="seg seg-2" id="rounding"></div>
      </fieldset>
    </section>
  </main>

  <div class="bottom-bar" id="bottom-bar" hidden>
    <p id="bottom-text"></p>
    <a class="bottom-link" href="#result">結果を見る</a>
  </div>

  <footer class="foot">
    <div class="foot-actions">
      <button type="button" class="ghost-btn" data-act="new">${icon("refresh")}<span>新しい会計</span></button>
      <button type="button" class="ghost-btn danger" data-act="reset">メンバーも消す</button>
    </div>
    <p id="save-note" class="hint"></p>
    <p class="credit">入力した内容は、このスマホ（ブラウザ）の中にだけ残ります。キャッシュと同じで、外には送りません。<br />
      <a href="../">ほかのアプリ</a></p>
  </footer>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <p class="sr-only" id="sr-live" aria-live="polite"></p>
`;

const amountInput = $<HTMLInputElement>("#amount");
const countInput = $<HTMLInputElement>("#count");
const peopleList = $<HTMLOListElement>("#people");

// ---- 金額 ----
amountInput.value = state.amount === null ? "" : formatYen(state.amount);
function readAmount(): void {
  const v = parseYen(amountInput.value);
  const msg = $("#amount-msg");
  if (v === null) {
    state.amount = null;
    msg.textContent = "";
  } else if (Number.isNaN(v)) {
    msg.textContent = "数字だけで入れてください（例: 12800）。";
    amountInput.setAttribute("aria-invalid", "true");
    return;
  } else if (v > MAX_AMOUNT) {
    msg.textContent = `${formatYen(MAX_AMOUNT)}円までです。`;
    amountInput.setAttribute("aria-invalid", "true");
    return;
  } else {
    state.amount = v;
    msg.textContent = "";
  }
  amountInput.removeAttribute("aria-invalid");
  commit();
}
amountInput.addEventListener("input", readAmount);
amountInput.addEventListener("blur", () => {
  if (state.amount !== null && !amountInput.hasAttribute("aria-invalid"))
    amountInput.value = formatYen(state.amount);
});
amountInput.addEventListener("focus", () => {
  if (state.amount !== null) amountInput.value = String(state.amount);
});

// ---- 人数 ----
function setCount(n: number): void {
  const next = Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, n));
  if (next < state.people.length) {
    const removed = state.people.length - next;
    remember(`${removed}人をへらしました`);
    state.people = state.people.slice(0, next);
    if (!state.people.some((p) => p.id === state.hostId)) state.hostId = state.people[0].id;
  }
  while (state.people.length < next) state.people.push(newPerson(state.people));
  renderPeople();
  commit();
}
countInput.addEventListener("change", () => {
  const v = parseYen(countInput.value);
  if (v === null || Number.isNaN(v)) countInput.value = String(state.people.length);
  else setCount(v);
});
countInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") countInput.blur();
});

function remember(label: string): void {
  undo = { people: state.people.map((p) => ({ ...p })), hostId: state.hostId, label };
}

// ---- 1人ずつの行 ----
function personRow(p: Person, i: number): string {
  const name = nameOf(p, i);
  const host = p.id === state.hostId;
  const fixed = p.fixed !== null;
  const levels = LEVELS.map(
    (lv) => `
      <label class="lv lv-${lv}">
        <input type="radio" name="lv-${p.id}" value="${lv}" data-k="${p.id}:lv:${lv}" ${!fixed && p.level === lv ? "checked" : ""} />
        <span class="lv-name">${LEVEL_LABEL[lv]}</span>
        <span class="lv-ratio">${ratioLabel(lv, state.settings)}</span>
      </label>`,
  ).join("");
  return `
    <li class="person${host ? " is-host" : ""}${fixed ? " is-fixed" : ""}" data-id="${p.id}">
      <div class="p-head">
        ${face(p)}
        <label class="sr-only" for="name-${p.id}">${i + 1}人目の名前</label>
        <input id="name-${p.id}" class="p-name" type="text" value="${esc(p.name)}" placeholder="${i + 1}人目"
          maxlength="${NAME_MAX}" autocomplete="off" enterkeyhint="done" data-k="${p.id}:name" />
        <button type="button" class="icon-btn" data-act="remove" data-k="${p.id}:remove"
          aria-label="${esc(name)}を外す" ${state.people.length <= MIN_PEOPLE ? "disabled" : ""}>${icon("trash")}</button>
      </div>
      <fieldset class="levels">
        <legend class="sr-only">${esc(name)}の払い方</legend>
        <div class="lv-grid">${levels}</div>
      </fieldset>
      <div class="p-opts">
      <label class="host-pick">
        <input type="radio" name="host" value="${p.id}" data-k="${p.id}:host" ${host ? "checked" : ""} />
        <span>${host ? `${icon("wallet")}幹事（集める人）` : "幹事にする"}</span>
      </label>
      ${
        fixed
          ? `<div class="fixed-row">
              <label for="fixed-${p.id}">この人は</label>
              <input id="fixed-${p.id}" class="fixed-input" type="text" inputmode="numeric" autocomplete="off"
                value="${formatYen(p.fixed!)}" data-k="${p.id}:fixed" />
              <span>円</span>
              <button type="button" class="text-btn" data-act="unfix" data-k="${p.id}:unfix">指定をやめる</button>
            </div>`
          : `<button type="button" class="text-btn" data-act="fix" data-k="${p.id}:fix">金額を指定</button>`
      }
      </div>
    </li>`;
}

function renderPeople(): void {
  const active = document.activeElement as HTMLElement | null;
  const focusKey = active?.dataset.k;
  peopleList.innerHTML = state.people.map(personRow).join("");
  countInput.value = String(state.people.length);
  $<HTMLButtonElement>('[data-act="dec"]').disabled = state.people.length <= MIN_PEOPLE;
  $<HTMLButtonElement>('[data-act="inc"]').disabled = state.people.length >= MAX_PEOPLE;
  if (focusKey) peopleList.querySelector<HTMLElement>(`[data-k="${focusKey}"]`)?.focus();
}

const personOf = (el: Element) => {
  const id = el.closest<HTMLElement>("[data-id]")?.dataset.id;
  return state.people.find((p) => p.id === id);
};

peopleList.addEventListener("input", (e) => {
  const t = e.target as HTMLInputElement;
  const p = personOf(t);
  if (!p) return;
  if (t.classList.contains("p-name")) {
    p.name = t.value.slice(0, NAME_MAX);
    commit();
  } else if (t.classList.contains("fixed-input")) {
    const v = parseYen(t.value);
    if (v === null || Number.isNaN(v) || v > MAX_AMOUNT) {
      t.setAttribute("aria-invalid", "true");
      return;
    }
    t.removeAttribute("aria-invalid");
    p.fixed = v;
    commit();
  }
});
peopleList.addEventListener("change", (e) => {
  const t = e.target as HTMLInputElement;
  const p = personOf(t);
  if (!p) return;
  if (t.name === "host") {
    state.hostId = p.id;
  } else if (t.name.startsWith("lv-")) {
    p.level = t.value as Level;
    p.fixed = null;
  } else if (t.classList.contains("fixed-input")) {
    t.value = p.fixed === null ? "" : formatYen(p.fixed);
    t.removeAttribute("aria-invalid");
    return;
  } else return;
  renderPeople();
  commit();
});
peopleList.addEventListener("click", (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-act]");
  if (!btn) return;
  const p = personOf(btn);
  if (!p) return;
  const i = state.people.indexOf(p);
  if (btn.dataset.act === "remove") {
    if (state.people.length <= MIN_PEOPLE) return;
    remember(`${nameOf(p, i)}を外しました`);
    state.people.splice(i, 1);
    if (p.id === state.hostId) state.hostId = state.people[0].id;
    renderPeople();
    commit();
    // 消した行の次（なければ前）の削除ボタンへ移る
    const next = state.people[Math.min(i, state.people.length - 1)];
    peopleList.querySelector<HTMLElement>(`[data-k="${next.id}:remove"]`)?.focus();
    showUndo();
  } else if (btn.dataset.act === "fix") {
    p.fixed = 0;
    renderPeople();
    commit();
    const input = peopleList.querySelector<HTMLInputElement>(`[data-k="${p.id}:fixed"]`);
    if (input) {
      input.value = "";
      input.focus();
    }
  } else if (btn.dataset.act === "unfix") {
    p.fixed = null;
    renderPeople();
    commit();
    peopleList.querySelector<HTMLElement>(`[data-k="${p.id}:fix"]`)?.focus();
  }
});

// ---- 端数と割合 ----
function renderSettings(): void {
  const s = state.settings;
  $("#units").innerHTML = UNITS.map(
    (u) => `
      <label class="seg-opt">
        <input type="radio" name="unit" value="${u}" ${s.unit === u ? "checked" : ""} />
        <span>${u === 1000 ? "千円" : `${u}円`}</span>
      </label>`,
  ).join("");
  const roundings: [Rounding, string, string][] = [
    ["up", "多めに集める", "幹事におつりが出る"],
    ["down", "少なめに集める", "足りない分は幹事が出す"],
  ];
  $("#rounding").innerHTML = roundings
    .map(
      ([v, t, d]) => `
      <label class="seg-opt seg-tall">
        <input type="radio" name="rounding" value="${v}" ${s.rounding === v ? "checked" : ""} />
        <span><b>${t}</b><small>${d}</small></span>
      </label>`,
    )
    .join("");
  const stepper = (key: "less" | "more", tenths: number, min: number, max: number) => `
    <div class="ratio-row">
      <span class="ratio-name">${LEVEL_LABEL[key]}</span>
      <button type="button" class="round-btn" data-ratio="${key}" data-d="-1" ${tenths <= min ? "disabled" : ""}
        aria-label="${LEVEL_LABEL[key]}の割合を0.1下げる">${icon("minus")}</button>
      <output class="ratio-val" aria-live="polite">×${formatRatio(tenths)}</output>
      <button type="button" class="round-btn" data-ratio="${key}" data-d="1" ${tenths >= max ? "disabled" : ""}
        aria-label="${LEVEL_LABEL[key]}の割合を0.1上げる">${icon("plus")}</button>
    </div>`;
  const panel = $("#ratio-panel");
  panel.hidden = !ratioOpen;
  $("#ratio-toggle").setAttribute("aria-expanded", String(ratioOpen));
  panel.innerHTML = `
    <p class="hint">「ふつう」の人を ×1 として、何倍払うかです。×0.8 なら、ふつうの人の8割。</p>
    ${stepper("less", s.lessTenths, LESS_RANGE.min, LESS_RANGE.max)}
    ${stepper("more", s.moreTenths, MORE_RANGE.min, MORE_RANGE.max)}
    <button type="button" class="text-btn" data-ratio="reset">はじめの割合に戻す（×${formatRatio(DEFAULT_SETTINGS.lessTenths)}・×${formatRatio(DEFAULT_SETTINGS.moreTenths)}）</button>`;
}

$("#rounding-card").addEventListener("change", (e) => {
  const t = e.target as HTMLInputElement;
  if (t.name === "unit") state.settings.unit = Number(t.value) as Unit;
  else if (t.name === "rounding") state.settings.rounding = t.value as Rounding;
  else return;
  commit();
});
$("#ratio-toggle").addEventListener("click", () => {
  ratioOpen = !ratioOpen;
  renderSettings();
});
$("#ratio-panel").addEventListener("click", (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-ratio]");
  if (!btn) return;
  const s = state.settings;
  const key = btn.dataset.ratio;
  if (key === "reset") {
    s.lessTenths = DEFAULT_SETTINGS.lessTenths;
    s.moreTenths = DEFAULT_SETTINGS.moreTenths;
  } else if (key === "less") {
    s.lessTenths = Math.min(LESS_RANGE.max, Math.max(LESS_RANGE.min, s.lessTenths + Number(btn.dataset.d)));
  } else if (key === "more") {
    s.moreTenths = Math.min(MORE_RANGE.max, Math.max(MORE_RANGE.min, s.moreTenths + Number(btn.dataset.d)));
  }
  const focusSel = key === "reset" ? null : `button[data-ratio="${key}"][data-d="${btn.dataset.d}"]`;
  renderSettings();
  renderPeople();
  commit();
  const again = focusSel ? $<HTMLButtonElement>(focusSel) : null;
  (again && !again.disabled ? again : $("#ratio-toggle")).focus();
});

// ---- 結果 ----
let srTimer = 0;
function renderResult(): void {
  const body = $("#result-body");
  const r = calculate(state.amount, state.people, state.settings, state.hostId);
  const bar = $("#bottom-bar");
  if (r.kind === "empty") {
    body.innerHTML = `<p class="empty">お会計の金額を入れると、ここに1人ずつの金額が出ます。</p>`;
    bar.dataset.ready = "";
    updateBar();
    return;
  }
  if (r.kind === "error") {
    body.innerHTML = `<p class="error" role="alert">${esc(r.message)}</p>`;
    bar.dataset.ready = "";
    updateBar();
    return;
  }
  const rows = state.people
    .map((p, i) => {
      const host = i === r.hostIndex;
      const tag =
        p.fixed !== null
          ? `<span class="tag">金額指定</span>`
          : p.level !== "normal"
            ? `<span class="tag tag-${p.level}">${LEVEL_LABEL[p.level]} ${ratioLabel(p.level, state.settings)}</span>`
            : "";
      return `
        <li class="pay${host ? " pay-host" : ""}">
          ${face(p, "face face-s")}
          <span class="pay-who">
            <span class="pay-name">${esc(nameOf(p, i))}${p.name.trim() ? "さん" : ""}</span>
            ${host ? `<span class="tag tag-host">幹事・自分の分</span>` : ""}${tag}
          </span>
          <span class="pay-amount">${formatYen(r.amounts[i])}<small>円</small></span>
        </li>`;
    })
    .join("");
  const diffClass = r.difference > 0 ? "diff-plus" : r.difference < 0 ? "diff-minus" : "diff-zero";
  body.innerHTML = `
    <ul class="pays">${rows}</ul>
    <p class="diff ${diffClass}">${differenceText(r.difference)}</p>
    <dl class="sums">
      <div><dt>お会計</dt><dd>${formatYen(r.total)}円</dd></div>
      <div><dt>集める合計（幹事の分も含む）</dt><dd>${formatYen(r.collected)}円</dd></div>
      <div><dt>幹事がみんなから受け取る</dt><dd>${formatYen(r.received)}円</dd></div>
      <div><dt>幹事が実際に出す額</dt><dd>${formatYen(r.hostActual)}円</dd></div>
    </dl>
    <div class="share-actions">
      <button type="button" class="primary-btn" data-act="copy">${icon("copy")}<span>LINEで送る文をコピー</span></button>
      ${"share" in navigator ? `<button type="button" class="ghost-btn" data-act="share">${icon("share")}<span>共有</span></button>` : ""}
    </div>
    <details class="preview">
      <summary>送る文を見る</summary>
      <pre id="share-text"></pre>
    </details>`;
  $("#share-text").textContent = shareText(state.people, state.settings, r);
  bar.dataset.ready = "1";
  $("#bottom-text").innerHTML =
    `集める合計 <b>${formatYen(r.collected)}円</b><span class="bar-diff">${differenceText(r.difference)}</span>`;
  updateBar();
  // 画面読み上げには、入力が落ち着いてから要点だけ伝える
  window.clearTimeout(srTimer);
  srTimer = window.setTimeout(() => {
    $("#sr-live").textContent = `${state.people.length}人で${formatYen(r.collected)}円を集めます。${differenceText(r.difference)}。`;
  }, 1200);
}

$("#result").addEventListener("click", async (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-act]");
  if (!btn) return;
  const text = $("#share-text").textContent ?? "";
  if (btn.dataset.act === "copy") {
    const done = await copy(text);
    toast(done ? "コピーしました。LINEのトークに貼り付けてください。" : "コピーできませんでした。「送る文を見る」から選んでコピーしてください。");
    if (!done) $<HTMLDetailsElement>(".preview").open = true;
  } else if (btn.dataset.act === "share") {
    try {
      await navigator.share({ text });
    } catch {
      /* 共有をやめた場合は何もしない */
    }
  }
});

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

// ---- 画面下の帯（結果が見えていないときだけ）----
let resultVisible = false;
function updateBar(): void {
  const bar = $("#bottom-bar");
  bar.hidden = !bar.dataset.ready || resultVisible;
}
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    resultVisible = entry.isIntersecting;
    updateBar();
  }, { threshold: 0.15 }).observe($("#result"));
}

// ---- お知らせと元に戻す ----
let toastTimer = 0;
function toast(message: string, withUndo = false): void {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(message)}</span>${
    withUndo ? `<button type="button" class="toast-btn" data-act="undo">${icon("arrow-back-up")}元に戻す</button>` : ""
  }`;
  t.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("show"), withUndo ? 8000 : 4000);
}
function showUndo(): void {
  if (undo) toast(undo.label, true);
}
$("#toast").addEventListener("click", (e) => {
  if (!(e.target as Element).closest('[data-act="undo"]') || !undo) return;
  state.people = undo.people;
  state.hostId = undo.hostId;
  undo = null;
  $("#toast").classList.remove("show");
  renderPeople();
  commit();
  toast("元に戻しました");
});

// ---- 新しい会計 ----
$(".foot").addEventListener("click", (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-act]");
  if (!btn) return;
  if (btn.dataset.act === "new") {
    state.amount = null;
    state.people.forEach((p) => (p.fixed = null));
    amountInput.value = "";
    $("#amount-msg").textContent = "";
    renderPeople();
    commit();
    amountInput.focus();
    toast("金額を消しました。メンバーはそのままです。");
  } else if (btn.dataset.act === "reset") {
    remember("メンバーを消しました");
    const settings = state.settings;
    state = freshState();
    state.settings = settings;
    amountInput.value = "";
    renderPeople();
    commit();
    amountInput.focus();
    showUndo();
  }
});

// 人数の ± は骨組みにある
app.addEventListener("click", (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-act="inc"], button[data-act="dec"]');
  if (!btn) return;
  setCount(state.people.length + (btn.dataset.act === "inc" ? 1 : -1));
  if (btn.dataset.act === "dec") showUndo();
});

// ---- 初回描画 ----
renderSettings();
renderPeople();
renderResult();
if (!canSave)
  $("#save-note").textContent = "この画面では保存できないため、閉じると入力が消えます（計算はできます）。";

// ---- オフライン対応 ----
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
