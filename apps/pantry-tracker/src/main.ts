import "./style.css";
import { ART_LABEL, ARTS, FIRST_PICKS, guessPreset, isArt, PLACE_LABEL, PLACES, PRESETS, type Art, type Place, type Preset } from "./catalog";
import { addDays, addMonths, formatShort, isYmd, todayYmd, type Ymd } from "./dates";
import {
  addItem, bump, byPlace, clampQty, consume, countLevels, daysLeft, defaultExpiry, emptyState, expiryLabel, isUrgent,
  levelOf, NAME_MAX, removeItem, sortByExpiry, stats, updateItem, type Item, type LogEntry, type Outcome, type State,
} from "./pantry";
import { exportText, importText, load, newId, save } from "./storage";
import { icon, type IconName } from "./icons";

// ---- 状態 ----
let today: Ymd = todayYmd(new Date());
let state: State = load(today);
let canSave = save(state);
let quickAll = false;
let undo: { state: State; label: string } | null = null;

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const art = (a: Art, cls = "art", size = 128) => `<img class="${cls}" src="./art/${a}.webp" alt="" width="${size}" height="${size}" />`;
const PLACE_ICON: Record<Place, IconName> = { fridge: "fridge", freezer: "snowflake", shelf: "box" };
const LEVEL_ICON: Partial<Record<string, IconName>> = { expired: "alert-triangle", today: "clock", soon: "clock" };

function pill(it: Pick<Item, "expiry">): string {
  const d = daysLeft(it.expiry, today);
  const l = levelOf(d);
  const ic = LEVEL_ICON[l];
  return `<span class="pill lv-${l}">${ic ? icon(ic) : ""}${expiryLabel(d)}</span>`;
}

/** 状態を変えたら保存して描き直す。描き直しで消えたボタンのかわりにフォーカスする先を指定できる */
function commit(next: State, focusKey?: string): void {
  state = next;
  canSave = save(state);
  render(focusKey);
}

function snapshot(label: string): void {
  undo = { state, label };
}

// ---- 骨組み（1回だけ描く）----
const app = $("#app");
app.innerHTML = `
  <a class="skip" href="#scene">家にある物へ移動</a>
  <header class="top">
    <div class="top-text">
      <p class="brand">${art("basket" as Art, "brand-art", 64)}在庫管理</p>
      <h1>家にある物と期限が、<br />ひと目でわかる。</h1>
      <p class="lead">買ってきた物はボタン1つで入れられます。使ったら「使った」、捨てたら「捨てた」を押すだけ。</p>
    </div>
    <div class="today" id="today" aria-live="polite"></div>
  </header>

  <main class="layout">
    <div class="col-side">
      <section class="card area-urgent" aria-labelledby="h-urgent">
        <h2 id="h-urgent" tabindex="-1">${icon("clock")}そろそろ使う物</h2>
        <div id="urgent"></div>
      </section>

      <section class="card area-quick" aria-labelledby="h-quick">
        <h2 id="h-quick" tabindex="-1">${icon("basket")}買ってきた物を入れる</h2>
        <p class="hint">押すと、いつもの場所と期限で入ります。あとで直せます。</p>
        <div class="quick-grid" id="quick"></div>
        <div class="row">
          <button type="button" class="btn ghost" id="quick-more" aria-expanded="false"></button>
          <button type="button" class="btn primary" data-act="custom">${icon("plus")}ほかの物を入れる</button>
        </div>
      </section>
    </div>

    <div class="col-main">
    <section class="scene" id="scene" aria-labelledby="h-scene" tabindex="-1">
      <h2 id="h-scene" class="scene-title">家にある物</h2>
      <p class="hint scene-hint">絵を押すと、期限や数を直したり、「使った」「捨てた」を記録できます。</p>
      <div class="storages" id="storages"></div>
    </section>

    <div class="col-bottom">
      <section class="card area-stats" aria-labelledby="h-stats">
        <h2 id="h-stats">${icon("chart-bar")}この30日の記録</h2>
        <div id="stats"></div>
      </section>

      <section class="card area-data" aria-labelledby="h-data">
        <h2 id="h-data">${icon("download")}データ</h2>
        <p class="hint">入れた物と記録は、このスマホ（ブラウザ）の中にだけ残ります。外には送りません。機種を変えるときは「書き出す」でファイルにして、新しい端末で「読み込む」を押します。</p>
        <div class="row">
          <button type="button" class="btn" data-act="export">${icon("download")}書き出す</button>
          <button type="button" class="btn" data-act="import">${icon("upload")}読み込む</button>
          <button type="button" class="btn ghost" data-act="sample" id="sample-btn">${icon("sparkles")}見本を入れる</button>
          <button type="button" class="btn ghost danger" data-act="clear">${icon("trash")}すべて消す</button>
        </div>
        <input type="file" id="file" accept="application/json,.json" class="sr-only" tabindex="-1" aria-hidden="true" />
        <p class="field-msg" id="data-msg" aria-live="polite"></p>
        <p class="hint" id="save-note"></p>
      </section>
    </div>
    </div>
  </main>

  <footer class="foot">
    <p>登録不要・通信なし。一度開けば、電波がなくても使えます。</p>
    <p><a href="../">ほかのアプリ</a></p>
  </footer>

  <dialog id="dlg" aria-labelledby="dlg-title">
    <form id="dlg-form" novalidate>
      <div class="dlg-head">
        <img id="dlg-art" class="dlg-art" src="./art/plate.webp" alt="" width="128" height="128" />
        <h2 id="dlg-title">入れる</h2>
        <button type="button" class="icon-btn" data-act="dlg-close" aria-label="閉じる">${icon("x")}</button>
      </div>

      <label class="field-label" for="f-name">名前</label>
      <input id="f-name" type="text" maxlength="${NAME_MAX}" autocomplete="off" enterkeyhint="done" placeholder="例: 豆腐" />
      <p class="field-msg" id="f-name-msg" aria-live="polite"></p>

      <details class="art-pick" id="art-pick">
        <summary>絵を選ぶ</summary>
        <div class="art-grid" role="radiogroup" aria-label="絵">
          ${ARTS.map((a) => `<label class="art-opt"><input type="radio" name="art" value="${a}" class="sr-only" />${art(a, "art", 128)}<span class="sr-only">${ART_LABEL[a]}</span></label>`).join("")}
        </div>
      </details>

      <fieldset class="seg">
        <legend class="field-label">置き場所</legend>
        ${PLACES.map((p) => `<label class="seg-opt"><input type="radio" name="place" value="${p}" />${icon(PLACE_ICON[p])}<span>${PLACE_LABEL[p]}</span></label>`).join("")}
      </fieldset>

      <div class="qty-row">
        <span class="field-label" id="qty-label">数</span>
        <button type="button" class="round-btn" data-act="qty-dec" aria-label="1つへらす">${icon("minus")}</button>
        <input id="f-qty" type="text" inputmode="numeric" aria-labelledby="qty-label" autocomplete="off" />
        <button type="button" class="round-btn" data-act="qty-inc" aria-label="1つふやす">${icon("plus")}</button>
      </div>

      <fieldset class="exp">
        <legend class="field-label">期限</legend>
        <div class="exp-row">
          <input id="f-exp" type="date" min="2000-01-01" max="2199-12-31" aria-label="期限の日付" aria-describedby="f-exp-msg" />
          <p class="exp-msg" id="f-exp-msg" aria-live="polite"></p>
        </div>
        <div class="chips">
          <button type="button" class="chip" data-exp="0">今日</button>
          <button type="button" class="chip" data-exp="3">3日後</button>
          <button type="button" class="chip" data-exp="7">1週間後</button>
          <button type="button" class="chip" data-exp="m1">1か月後</button>
          <button type="button" class="chip" data-exp="none">期限なし</button>
        </div>
      </fieldset>

      <div class="dlg-actions">
        <button type="submit" class="btn primary wide" id="dlg-save">${icon("check")}入れる</button>
      </div>

      <div class="finish" id="finish">
        <p class="finish-title">なくなったら記録</p>
        <div class="finish-row">
          <button type="button" class="btn used" data-act="dlg-used">${icon("check")}<span>使い切った</span></button>
          <button type="button" class="btn wasted" data-act="dlg-wasted">${icon("trash")}<span>捨てた</span></button>
        </div>
        <button type="button" class="link-btn" data-act="dlg-remove">まちがえて入れた（記録せずに消す）</button>
      </div>
    </form>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
`;

const dlg = $<HTMLDialogElement>("#dlg");
const form = $<HTMLFormElement>("#dlg-form");
const fName = $<HTMLInputElement>("#f-name");
const fQty = $<HTMLInputElement>("#f-qty");
const fExp = $<HTMLInputElement>("#f-exp");
const fileInput = $<HTMLInputElement>("#file");

// ---- 描画 ----
function render(focusKey?: string): void {
  const active = document.activeElement as HTMLElement | null;
  const keepKey = active?.dataset.k;
  renderToday();
  renderUrgent();
  renderQuick();
  renderScene();
  renderStats();
  $("#sample-btn").hidden = state.items.length > 0 || state.log.length > 0;
  $("#save-note").textContent = canSave ? "" : "この画面では保存できないため、閉じると内容が消えます（その場では使えます）。";
  // 描き直しでフォーカスしていたボタンが消えたら、同じ印のボタンか、指定の場所へ戻す
  if (keepKey && !document.activeElement?.isConnected) {
    const same = document.querySelector<HTMLElement>(`[data-k="${CSS.escape(keepKey)}"]`);
    (same ?? (focusKey ? document.querySelector<HTMLElement>(focusKey) : null))?.focus();
  } else if (focusKey && (!active || !active.isConnected || active === document.body)) {
    document.querySelector<HTMLElement>(focusKey)?.focus();
  }
}

function renderToday(): void {
  const c = countLevels(state.items, today);
  const chip = (n: number, label: string, cls: string) => `<li class="tchip ${n ? cls : "zero"}"><span class="tnum">${n}</span><span>${label}</span></li>`;
  $("#today").innerHTML = `
    <p class="today-date">${icon("calendar")}今日は ${formatShort(today)}</p>
    <ul class="tchips" aria-label="期限の近い物の数">
      ${chip(c.expired, "期限切れ", "lv-expired")}
      ${chip(c.today, "今日まで", "lv-today")}
      ${chip(c.soon, "2日以内", "lv-soon")}
    </ul>
    <p class="today-total">家にある物 <strong>${c.total}</strong> 種類</p>`;
}

function renderUrgent(): void {
  const list = sortByExpiry(state.items).filter((it) => isUrgent(levelOf(daysLeft(it.expiry, today))));
  const box = $("#urgent");
  if (state.items.length === 0) {
    box.innerHTML = `<p class="empty">まだ何も入っていません。下の「買ってきた物を入れる」から始めましょう。</p>`;
    return;
  }
  if (list.length === 0) {
    box.innerHTML = `<p class="empty good">${icon("leaf")}急いで使う物はありません。</p>`;
    return;
  }
  box.innerHTML = `<ul class="urgent-list">${list
    .map(
      (it) => `<li class="urow lv-${levelOf(daysLeft(it.expiry, today))}">
        <button type="button" class="urow-main" data-act="edit" data-id="${it.id}" data-k="u-edit-${it.id}">
          ${art(it.art, "art")}<span class="urow-text"><span class="urow-name">${esc(it.name)}${it.qty > 1 ? `<span class="qty-inline"> ×${it.qty}</span>` : ""}</span><span class="urow-place">${PLACE_LABEL[it.place]}</span></span>${pill(it)}
        </button>
        <div class="urow-btns">
          <button type="button" class="btn small used" data-act="used" data-id="${it.id}" data-k="u-used-${it.id}">${icon("check")}<span class="sr-only">${esc(it.name)}を${it.qty > 1 ? "1つ" : ""}</span>使った</button>
          <button type="button" class="btn small wasted" data-act="wasted" data-id="${it.id}" data-k="u-wasted-${it.id}">${icon("trash")}<span class="sr-only">${esc(it.name)}を${it.qty > 1 ? "1つ" : ""}</span>捨てた</button>
        </div>
      </li>`,
    )
    .join("")}</ul>`;
}

function orderedPresets(): Preset[] {
  const first = (n: string) => (FIRST_PICKS.includes(n) ? FIRST_PICKS.indexOf(n) : 100);
  return PRESETS.map((p, i) => ({ p, i: first(p.name) * 100 + i, f: state.freq[p.name] ?? 0 }))
    .sort((a, b) => b.f - a.f || a.i - b.i)
    .map((x) => x.p);
}

const QUICK_FIRST = 12;
function renderQuick(): void {
  const list = orderedPresets();
  const shown = quickAll ? list : list.slice(0, QUICK_FIRST);
  $("#quick").innerHTML = shown
    .map(
      (p) => `<button type="button" class="qbtn" data-act="quick" data-name="${esc(p.name)}" data-k="q-${esc(p.name)}">
        ${art(p.art, "art")}<span class="qname">${esc(p.name)}</span><span class="qplace">${icon(PLACE_ICON[p.place])}${PLACE_LABEL[p.place]}</span></button>`,
    )
    .join("");
  const more = $("#quick-more");
  more.innerHTML = `${icon("chevron-down")}${quickAll ? "少なく表示" : `ぜんぶ見る（${list.length}）`}`;
  more.classList.toggle("open", quickAll);
  more.setAttribute("aria-expanded", String(quickAll));
}

function renderScene(): void {
  const groups = byPlace(state.items);
  $("#storages").innerHTML = PLACES.map((p) => {
    const items = groups[p];
    return `<section class="storage st-${p}" aria-labelledby="h-${p}">
      <div class="st-head">
        <h3 id="h-${p}">${icon(PLACE_ICON[p])}${PLACE_LABEL[p]}</h3>
        <span class="st-count">${items.length ? `${items.length}種類` : "空っぽ"}</span>
      </div>
      <div class="st-body">
        ${
          items.length
            ? `<ul class="tiles">${items
                .map(
                  (it) => `<li><button type="button" class="tile lv-${levelOf(daysLeft(it.expiry, today))}" data-act="edit" data-id="${it.id}" data-k="t-${it.id}">
                    ${it.qty > 1 ? `<span class="tqty">×${it.qty}</span>` : ""}
                    ${art(it.art, "art")}<span class="tname">${esc(it.name)}</span>${pill(it)}${it.expiry ? `<span class="sr-only">（${formatShort(it.expiry)}）</span>` : ""}</button></li>`,
                )
                .join("")}</ul>`
            : `<p class="st-empty">まだ何もありません</p>`
        }
      </div>
    </section>`;
  }).join("");
}

function renderStats(): void {
  const s = stats(state.log, today, 30);
  const box = $("#stats");
  if (s.wasteRate === null) {
    box.innerHTML = `<p class="empty">「使った」「捨てた」を押すと、ここにまとまります。捨てる物が多い食材がわかると、買いすぎを防げます。</p>`;
    return;
  }
  const total = s.used + s.wasted;
  const usedPct = Math.round((s.used / total) * 100);
  box.innerHTML = `
    <div class="nums">
      <div class="num used"><span class="nlabel">${icon("check")}使い切った</span><span class="nval">${s.used}<small>こ</small></span></div>
      <div class="num wasted"><span class="nlabel">${icon("trash")}捨てた</span><span class="nval">${s.wasted}<small>こ</small></span></div>
    </div>
    <svg class="bar" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label="使い切った ${s.used}こ、捨てた ${s.wasted}こ。捨てた割合 ${s.wasteRate}%">
      <rect class="bar-used" x="0" y="0" width="${usedPct}" height="10" /><rect class="bar-wasted" x="${usedPct}" y="0" width="${100 - usedPct}" height="10" />
    </svg>
    <p class="rate">捨てた割合 <strong>${s.wasteRate}%</strong>${s.wasteRate === 0 ? "。すばらしい！" : s.wasteRate <= 10 ? "。上手に使えています。" : ""}</p>
    ${
      s.overbuy.length
        ? `<div class="overbuy"><p class="overbuy-title">${icon("alert-triangle")}買いすぎかも</p><ul>${s.overbuy
            .map((x) => `<li>${art(x.art, "art")}<span><strong>${esc(x.name)}</strong> は ${x.wasted}こ捨てて、使ったのは ${x.used}こ。次は少なめに買うか、早めに冷凍しましょう。</span></li>`)
            .join("")}</ul></div>`
        : ""
    }
    ${
      s.topWasted.length
        ? `<p class="sub-title">捨てた物</p><ul class="wlist">${s.topWasted
            .map((x) => `<li>${art(x.art, "art")}<span class="wname">${esc(x.name)}</span><span class="wnum">捨てた ${x.wasted} ／ 使った ${x.used}</span></li>`)
            .join("")}</ul>`
        : ""
    }`;
}

// ---- お知らせ（取り消し付き）----
let toastTimer = 0;
function toast(msg: string, opts: { undo?: boolean; editId?: string } = {}): void {
  const t = $("#toast");
  t.innerHTML = `<span class="toast-msg">${esc(msg)}</span>${
    opts.editId ? `<button type="button" class="btn small" data-act="edit" data-id="${opts.editId}">${icon("pencil")}直す</button>` : ""
  }${opts.undo ? `<button type="button" class="btn small" data-act="undo">${icon("arrow-back-up")}元に戻す</button>` : ""}`;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (!t.contains(document.activeElement)) t.hidden = true;
    else toastTimer = window.setTimeout(() => (t.hidden = true), 8000);
  }, 8000);
}

// ---- ダイアログ（入れる・直す）----
let dlgId: string | null = null; // null = 新しく入れる
let dlgArtPicked = false;

function setDlgArt(a: Art): void {
  $<HTMLImageElement>("#dlg-art").src = `./art/${a}.webp`;
  const r = form.querySelector<HTMLInputElement>(`input[name="art"][value="${a}"]`);
  if (r) r.checked = true;
}

function selectedArt(): Art {
  const v = form.querySelector<HTMLInputElement>('input[name="art"]:checked')?.value;
  return isArt(v) ? v : "plate";
}

function selectedPlace(): Place {
  const v = form.querySelector<HTMLInputElement>('input[name="place"]:checked')?.value as Place | undefined;
  return v && PLACES.includes(v) ? v : "fridge";
}

function updateExpMsg(): void {
  const v = fExp.value;
  const msg = $("#f-exp-msg");
  if (!v) msg.innerHTML = `<span class="pill lv-none">期限なし</span>`;
  else if (!isYmd(v)) msg.textContent = "日付を選んでください";
  else msg.innerHTML = `${pill({ expiry: v })}<span class="exp-date">${formatShort(v)}</span>`;
}

function openDialog(id: string | null, preset?: { name?: string; art?: Art; place?: Place; days?: number | null }): void {
  dlgId = id;
  const it = id ? state.items.find((x) => x.id === id) : undefined;
  if (id && !it) return;
  dlgArtPicked = !!it;
  $("#dlg-title").textContent = it ? it.name : "ほかの物を入れる";
  fName.value = it?.name ?? preset?.name ?? "";
  $("#f-name-msg").textContent = "";
  fName.classList.remove("bad");
  setDlgArt(it?.art ?? preset?.art ?? "plate");
  $<HTMLDetailsElement>("#art-pick").open = false;
  const place = it?.place ?? preset?.place ?? "fridge";
  form.querySelectorAll<HTMLInputElement>('input[name="place"]').forEach((r) => (r.checked = r.value === place));
  fQty.value = String(it?.qty ?? 1);
  fExp.value = it ? it.expiry ?? "" : defaultExpiry(today, preset?.days === undefined ? 7 : preset.days) ?? "";
  updateExpMsg();
  $("#dlg-save").innerHTML = `${icon("check")}${it ? "保存する" : "入れる"}`;
  const fin = $("#finish");
  fin.hidden = !it;
  if (it) {
    const one = it.qty > 1;
    $('[data-act="dlg-used"] span', fin).textContent = one ? "1つ使った" : "使い切った";
    $('[data-act="dlg-wasted"] span', fin).textContent = one ? "1つ捨てた" : "捨てた";
  }
  dlg.showModal();
  if (!it) fName.focus();
  else $<HTMLElement>('[data-act="dlg-close"]', dlg).focus();
}

function closeDialog(focusKey?: string): void {
  dlg.close();
  if (focusKey) document.querySelector<HTMLElement>(focusKey)?.focus();
}

fName.addEventListener("input", () => {
  if (dlgArtPicked) return;
  const p = guessPreset(fName.value);
  setDlgArt(p?.art ?? "plate");
});
form.addEventListener("change", (e) => {
  const t = e.target as HTMLInputElement;
  if (t.name === "art" && isArt(t.value)) {
    dlgArtPicked = true;
    setDlgArt(t.value);
  }
});
fExp.addEventListener("input", updateExpMsg);
fExp.addEventListener("change", updateExpMsg);
fQty.addEventListener("change", () => (fQty.value = String(readQty())));

function readQty(): number {
  const n = Number(fQty.value.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[^\d]/g, ""));
  return clampQty(n || 1);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = fName.value.trim();
  if (!name) {
    $("#f-name-msg").textContent = "名前を入れてください。";
    fName.classList.add("bad");
    fName.setAttribute("aria-invalid", "true");
    fName.focus();
    return;
  }
  fName.removeAttribute("aria-invalid");
  const expiry = fExp.value && isYmd(fExp.value) ? fExp.value : null;
  const data = { name, art: selectedArt(), place: selectedPlace(), qty: readQty(), expiry };
  if (dlgId) {
    snapshot("直す");
    const id = dlgId;
    closeDialog();
    commit(updateItem(state, id, data));
    document.querySelector<HTMLElement>(`[data-k="t-${id}"]`)?.focus();
    toast(`${name}を直しました`, { undo: true });
  } else {
    const id = newId();
    const next = addItem(state, data, id, today);
    if (next === state) {
      $("#f-name-msg").textContent = "これ以上は入れられません（300種類まで）。";
      return;
    }
    snapshot("入れる");
    closeDialog();
    commit(next);
    document.querySelector<HTMLElement>(`[data-k="t-${id}"]`)?.focus();
    toast(`${name}を${PLACE_LABEL[data.place]}に入れました`, { undo: true });
  }
});

dlg.addEventListener("click", (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>("button");
  if (e.target === dlg) {
    dlg.close(); // 外側を押したら閉じる
    return;
  }
  if (!b) return;
  const act = b.dataset.act;
  if (b.dataset.exp) {
    const v = b.dataset.exp;
    fExp.value = v === "none" ? "" : v === "m1" ? addMonths(today, 1) : addDays(today, Number(v));
    updateExpMsg();
    return;
  }
  if (act === "dlg-close") closeDialog(dlgId ? `[data-k="t-${dlgId}"]` : undefined);
  else if (act === "qty-inc" || act === "qty-dec") fQty.value = String(clampQty(readQty() + (act === "qty-inc" ? 1 : -1)));
  else if ((act === "dlg-used" || act === "dlg-wasted") && dlgId) {
    const id = dlgId;
    closeDialog();
    record(id, act === "dlg-used" ? "used" : "wasted", "#h-scene");
  } else if (act === "dlg-remove" && dlgId) {
    const it = state.items.find((x) => x.id === dlgId);
    if (!it) return;
    snapshot("消す");
    closeDialog();
    commit(removeItem(state, it.id), "#h-scene");
    $("#h-scene").focus();
    toast(`${it.name}を消しました（記録はしていません）`, { undo: true });
  }
});

// ---- 操作 ----
function record(id: string, outcome: Outcome, fallbackFocus: string): void {
  const it = state.items.find((x) => x.id === id);
  if (!it) return;
  snapshot(outcome);
  const left = it.qty - 1;
  commit(consume(state, id, outcome, today, newId("l")), fallbackFocus);
  if (!document.activeElement || document.activeElement === document.body) document.querySelector<HTMLElement>(fallbackFocus)?.focus();
  const verb = outcome === "used" ? "使った" : "捨てた";
  toast(left > 0 ? `${it.name}を1つ${verb}と記録しました（残り${left}つ）` : `${it.name}を${verb}と記録しました`, { undo: true });
}

function quickAdd(name: string): void {
  const p = PRESETS.find((x) => x.name === name);
  if (!p) return;
  const id = newId();
  const next = addItem(state, { name: p.name, art: p.art, place: p.place, qty: 1, expiry: defaultExpiry(today, p.days) }, id, today);
  if (next === state) {
    toast("これ以上は入れられません（300種類まで）。");
    return;
  }
  snapshot("入れる");
  commit(bump(next, p.name));
  const exp = next.items.find((x) => x.id === id)!.expiry;
  toast(`${p.name}を${PLACE_LABEL[p.place]}に入れました（${exp ? `期限 ${formatShort(exp)}` : "期限なし"}）`, { undo: true, editId: id });
}

function sampleState(): State {
  const pick = (name: string) => PRESETS.find((p) => p.name === name)!;
  const rows: [string, number | null, number][] = [
    ["牛乳", 1, 1], ["卵", 9, 6], ["鶏肉", 0, 1], ["豆腐・納豆", -1, 2], ["トマト", 2, 3], ["キャベツ", 5, 1], ["チーズ", 24, 1],
    ["ごはん", 20, 4], ["えび", 40, 1], ["アイス", null, 2], ["パン", 1, 1], ["たまねぎ", 25, 3], ["バナナ", 3, 2], ["缶詰", 200, 2],
  ];
  let s = emptyState();
  for (const [name, d, qty] of rows) {
    const p = pick(name);
    s = addItem(s, { name: p.name, art: p.art, place: p.place, qty, expiry: d === null ? null : addDays(today, d) }, newId(), today);
  }
  const logs: [string, Outcome, number, number][] = [
    ["牛乳", "wasted", -20, 1], ["牛乳", "used", -14, 1], ["牛乳", "wasted", -6, 1], ["卵", "used", -12, 6], ["パン", "used", -9, 1],
    ["パン", "wasted", -3, 1], ["キャベツ", "used", -5, 1], ["鶏肉", "used", -4, 1], ["トマト", "used", -2, 2],
  ];
  const log: LogEntry[] = logs.map(([name, outcome, d, qty]) => ({ id: newId("l"), name, art: pick(name).art, outcome, qty, date: addDays(today, d) }));
  return { ...s, log, freq: { 牛乳: 4, 卵: 3, パン: 3, 鶏肉: 2, トマト: 2 } };
}

app.addEventListener("click", (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>("button[data-act]");
  if (!b || dlg.contains(b)) return;
  const id = b.dataset.id ?? "";
  switch (b.dataset.act) {
    case "quick":
      quickAdd(b.dataset.name ?? "");
      break;
    case "custom":
      openDialog(null);
      break;
    case "edit":
      $("#toast").hidden = true;
      openDialog(id);
      break;
    case "used":
    case "wasted":
      record(id, b.dataset.act, "#h-urgent");
      break;
    case "undo":
      if (undo) {
        const label = undo.label;
        commit(undo.state);
        undo = null;
        $("#toast").hidden = true;
        $("#h-scene").focus();
        toast(`「${label === "used" ? "使った" : label === "wasted" ? "捨てた" : label}」を取り消しました`);
      }
      break;
    case "export":
      doExport();
      break;
    case "import":
      fileInput.click();
      break;
    case "sample":
      snapshot("見本を入れる");
      commit(sampleState(), "#h-scene");
      $("#h-scene").focus();
      toast("見本を入れました。いらなければ「すべて消す」で消せます。", { undo: true });
      break;
    case "clear":
      if (state.items.length === 0 && state.log.length === 0) {
        toast("消すものはありません。");
        break;
      }
      snapshot("すべて消す");
      commit({ ...emptyState(), freq: state.freq }, "#h-scene");
      toast("すべて消しました。", { undo: true });
      break;
  }
});

$("#quick-more").addEventListener("click", () => {
  quickAll = !quickAll;
  renderQuick();
});

function doExport(): void {
  const blob = new Blob([exportText(state, today)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `pantry-${today}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  $("#data-msg").textContent = `「pantry-${today}.json」を書き出しました。`;
  $("#data-msg").classList.remove("bad");
}

fileInput.addEventListener("change", async () => {
  const f = fileInput.files?.[0];
  fileInput.value = "";
  if (!f) return;
  const msg = $("#data-msg");
  const next = f.size > 2_000_000 ? null : importText(await f.text());
  if (!next) {
    msg.textContent = "このファイルは読み込めません。このアプリで「書き出す」をしたファイルを選んでください。";
    msg.classList.add("bad");
    return;
  }
  snapshot("読み込む");
  commit(next, "#h-scene");
  msg.textContent = `読み込みました（${next.items.length}種類・記録${next.log.length}件）。`;
  msg.classList.remove("bad");
  toast("読み込んだ内容に入れ替えました。", { undo: true });
});

// 日付が変わったら描き直す（開いたまま夜をまたいだとき・別のアプリから戻ったとき）
function refreshDay(): void {
  const t = todayYmd(new Date());
  if (t !== today) {
    today = t;
    render();
  }
}
setInterval(refreshDay, 60_000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshDay();
});

// ---- 初回描画 ----
render();

// ---- オフライン対応 ----
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        const urls = [
          location.href.split("#")[0],
          ...performance.getEntriesByType("resource").map((e) => e.name).filter((u) => u.startsWith(location.origin)),
          ...[...ARTS, "basket"].map((a) => new URL(`./art/${a}.webp`, location.href).href),
        ];
        reg.active?.postMessage({ type: "precache", urls });
      })
      .catch(() => {
        /* 登録できなくても通常どおり使える */
      });
  });
}
