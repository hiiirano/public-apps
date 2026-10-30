import "./style.css";
import type { Book, CategoryId, Expense } from "./types";
import { CATEGORIES, categoryOf, isCategoryId, MAX_AMOUNT, MAX_BUDGET, MAX_EXPENSES, MEMO_MAX } from "./types";
import { addMonths, dayLabel, defaultDateFor, isDateKey, monthLabel, monthOf, todayKey } from "./dates";
import { chartGeometry, computePace, type Pace } from "./pace";
import { addExpense, budgetFor, budgetSource, emptyBook, expensesOfMonth, groupByDay, removeExpense, setBudget, totalsByCategory, updateExpense } from "./book";
import { formatYen, parseYen, yen } from "./money";
import { importFile, ImportError, mergeIncoming, toBackupJson, toCsv } from "./transfer";
import { load, newId, save } from "./storage";
import { icon } from "./icons";

// ---- 状態 ----
const loaded = load();
let book: Book = loaded.book;
let canSave = save(book);
let today = todayKey();
let month = monthOf(today);
let editingId: string | null = null;
let undo: { book: Book; label: string } | null = null;

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const catImg = (id: CategoryId, cls = "cat-img") => `<img class="${cls}" src="./art/cat-${id}.webp" alt="" width="40" height="40" />`;

// ---- 骨組み（1回だけ描く）----
const app = $("#app");
app.innerHTML = `
  <a class="skip" href="#entry">書きこむ欄へ移動</a>
  <header class="masthead">
    <div class="title-row">
      <img class="ledger" src="./art/ledger.webp" alt="" width="56" height="56" />
      <div>
        <h1>家計簿ノート</h1>
        <p class="lead">使いすぎを、月の途中で先回り。</p>
      </div>
    </div>
    <nav class="month-nav" aria-label="月の切り替え">
      <button type="button" class="icon-btn" data-act="prev" aria-label="前の月">${icon("chevron-left")}</button>
      <p class="month-title" id="month-title" aria-live="polite"></p>
      <button type="button" class="icon-btn" data-act="next" aria-label="次の月">${icon("chevron-right")}</button>
      <button type="button" class="text-btn" data-act="this-month" id="this-month" hidden>今月へ</button>
    </nav>
  </header>

  <main class="layout">
    <section class="card area-pace" id="pace" aria-labelledby="h-pace">
      <h2 id="h-pace">今月のペース</h2>
      <div id="pace-body"></div>
    </section>

    <section class="card area-entry" id="entry" aria-labelledby="h-entry" tabindex="-1">
      <h2 id="h-entry">書きこむ</h2>
      <form id="entry-form" novalidate autocomplete="off">
        <label class="field-label" for="amount"><span class="step">1</span>金額</label>
        <div class="amount-row">
          <input id="amount" class="amount" type="text" inputmode="numeric" enterkeyhint="done"
            placeholder="0" aria-describedby="amount-msg" />
          <span class="yen" aria-hidden="true">円</span>
        </div>
        <p id="amount-msg" class="field-msg" aria-live="polite"></p>

        <fieldset class="cats" aria-describedby="cat-msg">
          <legend class="field-label"><span class="step">2</span>費目</legend>
          <div class="cat-grid">
            ${CATEGORIES.map(
              (c) => `
              <label class="cat">
                <input type="radio" name="cat" value="${c.id}" />
                ${catImg(c.id)}
                <span class="cat-name">${c.label}</span>
              </label>`,
            ).join("")}
          </div>
          <p id="cat-msg" class="field-msg" aria-live="polite"></p>
          <p id="cat-hint" class="hint">住まい（家賃・光熱・通信）は月1回の支払いとして、見込みでのばしません。</p>
        </fieldset>

        <details class="more" id="more">
          <summary><span>日付・メモ</span><span class="more-sum" id="more-sum"></span></summary>
          <div class="more-body">
            <label class="small-label" for="date">日付</label>
            <input id="date" class="text-input" type="date" min="2000-01-01" max="2100-12-31" aria-describedby="date-msg" />
            <p id="date-msg" class="field-msg" aria-live="polite"></p>
            <label class="small-label" for="memo">メモ（なくてもよい・${MEMO_MAX}文字まで）</label>
            <input id="memo" class="text-input" type="text" maxlength="${MEMO_MAX}" enterkeyhint="done" placeholder="例: スーパー" />
          </div>
        </details>

        <div class="form-actions">
          <button type="submit" class="primary-btn" id="save-btn"><span class="step step-on">3</span><span id="save-label">書きこむ</span></button>
          <button type="button" class="ghost-btn" data-act="cancel-edit" id="cancel-edit" hidden>やめる</button>
        </div>
      </form>
    </section>

    <section class="card area-break" aria-labelledby="h-break">
      <h2 id="h-break">費目ごと</h2>
      <div id="break-body"></div>
    </section>

    <section class="card area-list notebook" aria-labelledby="h-list">
      <h2 id="h-list" tabindex="-1">記録</h2>
      <div id="list-body"></div>
    </section>

    <section class="card area-settings" id="settings" aria-labelledby="h-settings">
      <h2 id="h-settings">予算とデータ</h2>
      <div class="settings-grid">
        <div class="setting">
          <h3>1か月の予算</h3>
          <label class="small-label" for="budget" id="budget-label"></label>
          <div class="amount-row">
            <input id="budget" class="amount amount-s" type="text" inputmode="numeric" enterkeyhint="done" placeholder="なし" aria-describedby="budget-msg budget-note" />
            <span class="yen" aria-hidden="true">円</span>
          </div>
          <p id="budget-msg" class="field-msg" aria-live="polite"></p>
          <p id="budget-note" class="hint"></p>
          <button type="button" class="ghost-btn" data-act="budget-save">${icon("check")}<span>予算を決める</span></button>
        </div>
        <div class="setting">
          <h3>ほかの端末へ移す</h3>
          <p class="hint">書き出したファイルを、新しい端末で「読み込む」と移せます。同じ記録は二重になりません。</p>
          <div class="btn-col">
            <button type="button" class="ghost-btn" data-act="export-json">${icon("download")}<span>バックアップを書き出す（JSON）</span></button>
            <button type="button" class="ghost-btn" data-act="export-csv">${icon("download")}<span>表計算用に書き出す（CSV）</span></button>
            <label class="ghost-btn file-btn">${icon("upload")}<span>ファイルを読み込む</span>
              <input type="file" id="import-file" class="sr-only" accept=".json,.csv,application/json,text/csv" />
            </label>
          </div>
        </div>
        <div class="setting">
          <h3>記録を消す</h3>
          <p class="hint">この端末の記録と予算を、すべて消します。</p>
          <button type="button" class="ghost-btn danger" data-act="wipe" id="wipe-btn" aria-expanded="false" aria-controls="wipe-confirm">${icon("trash")}<span>全部消す</span></button>
          <div id="wipe-confirm" class="confirm" hidden>
            <p>本当に消しますか？ 先にバックアップを書き出しておくと安心です。</p>
            <div class="btn-row">
              <button type="button" class="danger-btn" data-act="wipe-yes">消す</button>
              <button type="button" class="ghost-btn" data-act="wipe-no">やめる</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="foot">
    <p id="save-note" class="warn-note" hidden></p>
    <p class="credit">記録は、このスマホ（ブラウザ）の中にだけ残ります。キャッシュと同じで、外には送りません。<br />
      <a href="../">ほかのアプリ</a></p>
  </footer>

  <div class="bottom-bar" id="bottom-bar" hidden>
    <button type="button" class="primary-btn" data-act="go-entry">${icon("pencil")}<span>書きこむ</span></button>
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

const amountInput = $<HTMLInputElement>("#amount");
const dateInput = $<HTMLInputElement>("#date");
const memoInput = $<HTMLInputElement>("#memo");
const budgetInput = $<HTMLInputElement>("#budget");
const form = $<HTMLFormElement>("#entry-form");

// ---- 保存 ----
function commit(next: Book, undoLabel?: string): void {
  if (undoLabel) undo = { book, label: undoLabel };
  book = next;
  canSave = save(book);
  render();
}

// ---- 描画 ----
function render(): void {
  const t = todayKey();
  if (t !== today) today = t; // 日付をまたいで開きっぱなしのとき
  const isNow = month === monthOf(today);
  $("#month-title").textContent = monthLabel(month);
  $("#this-month").hidden = isNow;
  $("#h-pace").textContent = isNow ? "今月のペース" : month < monthOf(today) ? "この月のふりかえり" : "この月の予定";
  const budget = budgetFor(book.budgets, month);
  const ex = expensesOfMonth(book.expenses, month);
  renderPace(computePace(ex, month, today, budget));
  renderBreakdown(ex);
  renderList(ex);
  renderBudget();
  // CSP で style 属性を禁じているため、幅と位置はここで CSSOM から入れる
  app.querySelectorAll<HTMLElement>("[data-w]").forEach((el) => (el.style.width = `${el.dataset.w}%`));
  app.querySelectorAll<HTMLElement>("[data-left]").forEach((el) => (el.style.left = `${el.dataset.left}%`));
  if (!editingId) resetDate();
  const note = $("#save-note");
  note.hidden = canSave;
  note.textContent = canSave ? "" : "この画面では保存できないため、閉じると記録が消えます。";
}

function verdict(p: Pace): string {
  const b = p.budget!;
  const left = b - p.projected;
  switch (p.status) {
    case "ok":
      return `<p class="verdict v-ok">${icon("check")}<span>予算内のペースです（余裕 ${yen(left)}）。</span></p>`;
    case "near":
      return `<p class="verdict v-near">${icon("alert-triangle")}<span>予算ぎりぎりのペースです（余裕 ${yen(left)}）。</span></p>`;
    case "over":
      return `<p class="verdict v-over">${icon("alert-triangle")}<span>このままだと予算を <b>${yen(-left)}</b> こえます。</span></p>`;
    case "already":
      return `<p class="verdict v-over">${icon("alert-triangle")}<span>予算を <b>${yen(p.spent - b)}</b> こえています。</span></p>`;
    default:
      return "";
  }
}

function chartSvg(p: Pace): string {
  const g = chartGeometry(p, 640, 280);
  const danger = p.status === "over" || p.status === "already";
  const right = g.width - g.pad.r;
  const area = g.actual ? `${g.actual} ${g.today ? g.today.x : g.end.x},${g.height - g.pad.b} ${g.pad.l},${g.height - g.pad.b}` : "";
  const desc =
    p.phase === "current"
      ? `1日から今日までに ${yen(p.spent)}。このままだと月末 ${yen(p.projected)}${p.budget ? `、予算は ${yen(p.budget)}` : ""}。`
      : `この月の合計 ${yen(p.spent)}${p.budget ? `、予算は ${yen(p.budget)}` : ""}。`;
  return `
    <figure class="chart">
      <svg viewBox="0 0 ${g.width} ${g.height}" role="img" aria-label="${esc(desc)}" preserveAspectRatio="xMidYMid meet">
        ${g.ticks.map((tk) => `<line class="c-grid" x1="${g.pad.l}" x2="${right}" y1="${tk.y}" y2="${tk.y}" />`).join("")}
        <line class="c-axis" x1="${g.pad.l}" x2="${right}" y1="${g.height - g.pad.b}" y2="${g.height - g.pad.b}" />
        ${g.budgetY !== null && danger ? `<rect class="c-overzone" x="${g.pad.l}" y="${g.pad.t}" width="${right - g.pad.l}" height="${Math.max(0, g.budgetY - g.pad.t)}" />` : ""}
        ${g.ideal ? `<polyline class="c-ideal" points="${g.ideal}" />` : ""}
        ${g.budgetY !== null ? `<line class="c-budget" x1="${g.pad.l}" x2="${right}" y1="${g.budgetY}" y2="${g.budgetY}" />` : ""}
        ${area ? `<polygon class="c-area" points="${area}" />` : ""}
        ${g.actual ? `<polyline class="c-actual" points="${g.actual}" />` : ""}
        ${g.projection ? `<polyline class="c-proj${danger ? " is-over" : ""}" points="${g.projection}" />` : ""}
        ${g.today ? `<circle class="c-today" cx="${g.today.x}" cy="${g.today.y}" r="6" />` : ""}
        ${p.phase === "current" ? `<circle class="c-end${danger ? " is-over" : ""}" cx="${g.end.x}" cy="${g.end.y}" r="7" />` : ""}
      </svg>
      <div class="c-days" aria-hidden="true"><span>1日</span>${p.phase === "current" && p.elapsed / p.days > 0.12 && p.elapsed / p.days < 0.88 ? `<span class="c-todaylabel" data-left="${((p.elapsed / p.days) * 100).toFixed(2)}">今日</span>` : ""}<span>${p.days}日</span></div>
      <figcaption class="legend">
        <span class="lg lg-actual">使った額</span>
        ${p.phase === "current" ? `<span class="lg lg-proj">このままの見込み</span>` : ""}
        ${p.budget ? `<span class="lg lg-budget">予算</span><span class="lg lg-ideal">予算どおりのペース</span>` : ""}
      </figcaption>
    </figure>`;
}

function renderPace(p: Pace): void {
  const body = $("#pace-body");
  const stats = `
    <dl class="stats">
      <div><dt>予算</dt><dd>${p.budget ? yen(p.budget) : "なし"}</dd></div>
      <div><dt>使った</dt><dd>${yen(p.spent)}</dd></div>
      <div><dt>残り</dt><dd class="${p.budget && p.spent > p.budget ? "neg" : ""}">${p.budget ? yen(p.budget - p.spent) : "—"}</dd></div>
    </dl>`;
  const noBudget = p.budget
    ? ""
    : `<div class="nudge"><p>予算を決めると、使いすぎを先に知らせます。</p><button type="button" class="ghost-btn" data-act="go-budget">予算を決める</button></div>`;

  if (p.phase === "future") {
    body.innerHTML = `
      <p class="kicker">まだ始まっていない月です</p>
      <p class="big"><span class="big-label">予定として書いた額</span><span class="big-num">${yen(p.spent)}</span></p>
      ${stats}${noBudget}`;
    return;
  }
  if (p.spent === 0) {
    body.innerHTML = `
      <div class="empty">
        <img src="./art/notepad.webp" alt="" width="64" height="64" />
        <p>${p.phase === "current" ? "まだ記録がありません。金額と費目をえらんで書きこむと、月末の見込みがここに出ます。" : "この月の記録はありません。"}</p>
      </div>
      ${p.budget ? stats : noBudget}`;
    return;
  }
  if (p.phase === "past") {
    const diff = p.budget ? p.budget - p.spent : null;
    body.innerHTML = `
      <p class="big"><span class="big-label">この月の合計</span><span class="big-num">${yen(p.spent)}</span></p>
      ${diff === null ? "" : diff >= 0 ? `<p class="verdict v-ok">${icon("check")}<span>予算より ${yen(diff)} 少なく収まりました。</span></p>` : `<p class="verdict v-over">${icon("alert-triangle")}<span>予算を ${yen(-diff)} こえました。</span></p>`}
      ${chartSvg(p)}${stats}${noBudget}`;
    return;
  }
  const perDay =
    p.perDayLeft !== null
      ? p.status === "already"
        ? `<p class="perday">これからの支出は、できるだけおさえましょう。</p>`
        : `<p class="perday">残り ${p.daysLeft}日（今日をふくむ）。<b>1日 ${yen(p.perDayLeft)}</b> までなら予算に収まります。</p>`
      : "";
  body.innerHTML = `
    <p class="big"><span class="big-label">このままだと月末</span><span class="big-num${p.status === "over" || p.status === "already" ? " is-over" : ""}">${yen(p.projected)}</span></p>
    ${verdict(p)}
    ${chartSvg(p)}
    ${stats}
    ${perDay}
    ${p.rough ? `<p class="hint">月のはじめは、見込みが大きくぶれます。</p>` : ""}
    ${noBudget}`;
}

function renderBreakdown(ex: Expense[]): void {
  const totals = totalsByCategory(ex);
  const max = totals[0]?.total ?? 0;
  $("#break-body").innerHTML = totals.length
    ? `<ul class="breakdown">${totals
        .map(
          (t) => `
        <li>
          ${catImg(t.cat, "cat-img-s")}
          <span class="b-name">${categoryOf(t.cat).label}<small>${t.count}件</small></span>
          <span class="b-bar" aria-hidden="true"><span data-w="${max ? Math.max(2, (t.total / max) * 100).toFixed(2) : 0}"></span></span>
          <span class="b-amt">${yen(t.total)}<small>${Math.round(t.share * 100)}%</small></span>
        </li>`,
        )
        .join("")}</ul>`
    : `<p class="hint">記録すると、費目ごとの合計がここに出ます。</p>`;
}

function renderList(ex: Expense[]): void {
  const groups = groupByDay(ex);
  $("#list-body").innerHTML = groups.length
    ? groups
        .map(
          (g) => `
      <section class="day" aria-label="${dayLabel(g.date)}">
        <h3><span>${dayLabel(g.date)}</span><span class="day-total">${yen(g.total)}</span></h3>
        <ul class="rows">${g.items.map(row).join("")}</ul>
      </section>`,
        )
        .join("")
    : `<p class="hint">${monthLabel(month)}の記録はまだありません。</p>`;
}

function row(e: Expense): string {
  const c = categoryOf(e.cat);
  const what = `${dayLabel(e.date)}の${c.label} ${formatYen(e.amount)}円`;
  return `
    <li class="row${e.id === editingId ? " is-editing" : ""}" data-id="${e.id}">
      ${catImg(e.cat, "cat-img-s")}
      <span class="row-main"><span class="row-cat">${c.label}</span>${e.memo ? `<span class="row-memo">${esc(e.memo)}</span>` : ""}</span>
      <span class="row-amt">${yen(e.amount)}</span>
      <span class="row-btns">
        <button type="button" class="icon-btn small" data-act="edit" aria-label="${esc(what)}を直す">${icon("pencil")}</button>
        <button type="button" class="icon-btn small danger" data-act="delete" aria-label="${esc(what)}を消す">${icon("trash")}</button>
      </span>
    </li>`;
}

function renderBudget(): void {
  const src = budgetSource(book.budgets, month);
  const b = budgetFor(book.budgets, month);
  $("#budget-label").textContent = `${monthLabel(month)}から`;
  if (document.activeElement !== budgetInput) budgetInput.value = b ? formatYen(b) : "";
  let prevMonth = "";
  if (src === "carried") for (const k of Object.keys(book.budgets)) if (k < month && (!prevMonth || k > prevMonth)) prevMonth = k;
  $("#budget-note").textContent =
    src === "carried"
      ? `${monthLabel(prevMonth)}に決めた予算を引き継いでいます。変えると、この月から先に効きます。`
      : "決めた月から先の月にも、同じ予算が引き継がれます。空にすると予算なしになります。";
}

function resetDate(): void {
  dateInput.value = defaultDateFor(month, today);
  updateMoreSummary();
}

function updateMoreSummary(): void {
  const d = dateInput.value;
  const memo = memoInput.value.trim();
  $("#more-sum").textContent = `${isDateKey(d) ? (d === today ? "今日" : dayLabel(d)) : "日付を確認"}${memo ? `・${memo}` : ""}`;
}

// ---- 書きこむ ----
function readAmount(input: HTMLInputElement, msgEl: HTMLElement, max: number, allowEmpty: boolean): number | null | undefined {
  const v = parseYen(input.value);
  let msg = "";
  if (v === null) msg = allowEmpty ? "" : "金額を入れてください。";
  else if (Number.isNaN(v)) msg = "数字だけで入れてください（例: 1200）。";
  else if (v > max) msg = `${formatYen(max)}円までです。`;
  else if (v === 0 && !allowEmpty) msg = "1円以上で入れてください。";
  msgEl.textContent = msg;
  if (msg) {
    input.setAttribute("aria-invalid", "true");
    return undefined;
  }
  input.removeAttribute("aria-invalid");
  return v;
}

function selectedCat(): CategoryId | null {
  const v = form.querySelector<HTMLInputElement>('input[name="cat"]:checked')?.value;
  return isCategoryId(v) ? v : null;
}

form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const amount = readAmount(amountInput, $("#amount-msg"), MAX_AMOUNT, false);
  const cat = selectedCat();
  $("#cat-msg").textContent = cat ? "" : "費目をえらんでください。";
  const date = dateInput.value;
  const dateOk = isDateKey(date);
  $("#date-msg").textContent = dateOk ? "" : "日付を入れてください（2000〜2100年）。";
  if (amount === undefined || amount === null) return amountInput.focus();
  if (!cat) return form.querySelector<HTMLInputElement>('input[name="cat"]')!.focus();
  if (!dateOk) {
    ($("#more") as HTMLDetailsElement).open = true;
    return dateInput.focus();
  }
  const memo = memoInput.value.trim().slice(0, MEMO_MAX);
  const label = `${categoryOf(cat).label} ${formatYen(amount)}円`;
  if (editingId) {
    commit(updateExpense(book, editingId, { amount, cat, date, memo }), `${label} に直しました`);
    stopEditing();
  } else {
    const next = addExpense(book, { id: newId(), amount, cat, date, memo, at: Date.now() });
    if (!next) {
      toast(`記録は${formatYen(MAX_EXPENSES)}件までです。書き出して保管したあと、古い記録を消してください。`);
      return;
    }
    commit(next, `${label} を書きました`);
    clearForm();
  }
  const where = monthOf(date) !== month ? `（${monthLabel(monthOf(date))}のページに）` : "";
  toast(`${undo!.label}${where}`, true);
  amountInput.focus();
});

function clearForm(): void {
  amountInput.value = "";
  memoInput.value = "";
  form.querySelectorAll<HTMLInputElement>('input[name="cat"]').forEach((r) => (r.checked = false));
  for (const id of ["#amount-msg", "#cat-msg", "#date-msg"]) $(id).textContent = "";
  amountInput.removeAttribute("aria-invalid");
  ($("#more") as HTMLDetailsElement).open = false;
  resetDate();
}

function startEditing(id: string): void {
  const e = book.expenses.find((x) => x.id === id);
  if (!e) return;
  editingId = id;
  amountInput.value = formatYen(e.amount);
  form.querySelector<HTMLInputElement>(`input[name="cat"][value="${e.cat}"]`)!.checked = true;
  dateInput.value = e.date;
  memoInput.value = e.memo;
  ($("#more") as HTMLDetailsElement).open = true;
  $("#h-entry").textContent = "記録を直す";
  $("#save-label").textContent = "直す";
  $("#cancel-edit").hidden = false;
  updateMoreSummary();
  render();
  $("#entry").scrollIntoView({ block: "start" });
  amountInput.focus();
}

function stopEditing(): void {
  editingId = null;
  $("#h-entry").textContent = "書きこむ";
  $("#save-label").textContent = "書きこむ";
  $("#cancel-edit").hidden = true;
  clearForm();
}

amountInput.addEventListener("input", () => {
  if (amountInput.hasAttribute("aria-invalid")) readAmount(amountInput, $("#amount-msg"), MAX_AMOUNT, true);
});
amountInput.addEventListener("blur", () => {
  const v = parseYen(amountInput.value);
  if (v !== null && !Number.isNaN(v) && v <= MAX_AMOUNT) amountInput.value = formatYen(v);
});
form.addEventListener("change", (e) => {
  if ((e.target as HTMLInputElement).name === "cat") $("#cat-msg").textContent = "";
});
dateInput.addEventListener("input", updateMoreSummary);
memoInput.addEventListener("input", updateMoreSummary);

// ---- 予算 ----
function saveBudget(): void {
  const v = readAmount(budgetInput, $("#budget-msg"), MAX_BUDGET, true);
  if (v === undefined) return budgetInput.focus();
  const value = v === null || v === 0 ? null : v;
  commit(setBudget(book, month, value), "予算を変えました");
  budgetInput.value = value ? formatYen(value) : "";
  toast(value ? `${monthLabel(month)}からの予算を ${yen(value)} にしました` : `${monthLabel(month)}から予算なしにしました`, true);
}
budgetInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveBudget();
});

// ---- 書き出し・読み込み ----
function download(name: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$<HTMLInputElement>("#import-file").addEventListener("change", async (ev) => {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) return toast("ファイルが大きすぎます（5MBまで）。");
  try {
    const inc = importFile(file.name, await file.text(), newId, Date.now());
    const r = mergeIncoming(book, inc);
    const skipped = [r.same ? `同じ記録 ${r.same}件` : "", inc.bad ? `読めない行 ${inc.bad}件` : "", r.full ? `上限（${formatYen(MAX_EXPENSES)}件）で入らない ${r.full}件` : ""].filter(Boolean).join("・");
    const budgetsChanged = Object.keys(inc.budgets).length > 0;
    if (r.added === 0 && !budgetsChanged) return toast(`新しい記録はありませんでした${skipped ? `（${skipped}）` : ""}。`);
    commit(r.book, "読み込みました");
    toast(`${r.added}件を読み込みました${skipped ? `（${skipped}はとばしました）` : ""}。`, true);
  } catch (e) {
    toast(e instanceof ImportError ? e.message : "ファイルを読めませんでした。");
  }
});

// ---- ボタン（まとめて受ける）----
document.addEventListener("click", (ev) => {
  const btn = (ev.target as HTMLElement).closest<HTMLElement>("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const rowId = btn.closest<HTMLElement>(".row")?.dataset.id;
  switch (act) {
    case "prev":
    case "next":
    case "this-month":
      month = act === "this-month" ? monthOf(today) : addMonths(month, act === "prev" ? -1 : 1);
      if (editingId) stopEditing();
      render();
      break;
    case "edit":
      if (rowId) startEditing(rowId);
      break;
    case "delete": {
      const e = book.expenses.find((x) => x.id === rowId);
      if (!e) break;
      if (editingId === e.id) stopEditing();
      commit(removeExpense(book, e.id), `${categoryOf(e.cat).label} ${formatYen(e.amount)}円 を消しました`);
      toast(undo!.label, true);
      $("#h-list").focus();
      break;
    }
    case "cancel-edit":
      stopEditing();
      render();
      break;
    case "go-entry":
      $("#entry").scrollIntoView({ block: "start" });
      amountInput.focus({ preventScroll: true });
      break;
    case "go-budget":
      $("#settings").scrollIntoView({ block: "start" });
      budgetInput.focus();
      break;
    case "budget-save":
      saveBudget();
      break;
    case "export-json":
      download(`kakeibo-${today}.json`, toBackupJson(book, new Date().toISOString()), "application/json");
      toast(`バックアップを書き出しました（${book.expenses.length}件）。`);
      break;
    case "export-csv":
      download(`kakeibo-${today}.csv`, "﻿" + toCsv(book.expenses), "text/csv;charset=utf-8");
      toast(`CSV を書き出しました（${book.expenses.length}件）。`);
      break;
    case "wipe":
    case "wipe-no": {
      const open = act === "wipe";
      $("#wipe-confirm").hidden = !open;
      $("#wipe-btn").setAttribute("aria-expanded", String(open));
      if (open) $('[data-act="wipe-yes"]').focus();
      else $("#wipe-btn").focus();
      break;
    }
    case "wipe-yes":
      $("#wipe-confirm").hidden = true;
      $("#wipe-btn").setAttribute("aria-expanded", "false");
      if (editingId) stopEditing();
      commit(emptyBook(), "全部消しました");
      toast("全部消しました", true);
      break;
    case "undo":
      if (undo) {
        if (editingId) stopEditing();
        commit(undo.book);
        undo = null;
        toast("元に戻しました");
      }
      break;
  }
});

// ---- スマホで書きこむ欄が見えないときだけ、下に「書きこむ」を出す ----
if ("IntersectionObserver" in window) {
  const bar = $("#bottom-bar");
  const wide = window.matchMedia("(min-width: 960px)");
  let entryVisible = true;
  const update = () => (bar.hidden = wide.matches || entryVisible);
  new IntersectionObserver((es) => {
    entryVisible = es.some((e) => e.isIntersecting);
    update();
  }).observe($("#entry-form"));
  wide.addEventListener("change", update);
}

// ---- お知らせ ----
let toastTimer = 0;
function toast(message: string, withUndo = false): void {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(message)}</span>${withUndo && undo ? `<button type="button" class="toast-btn" data-act="undo">${icon("arrow-back-up")}元に戻す</button>` : ""}`;
  t.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("show"), withUndo ? 8000 : 5000);
}

render();
if (loaded.migrated) toast("前の版の記録を引き継ぎました。前の分類はメモに残しています。");
else if (loaded.broken) toast("保存内容が読めなかったため、新しく始めます。");
else if (loaded.dropped) toast(`読めなかった記録 ${loaded.dropped}件をのぞきました。`);

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
