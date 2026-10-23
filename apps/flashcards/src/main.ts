import "./style.css";
import { type Card, type Data, type Deck, type Grade, GRADE_LABEL, GRADES, MAX_CARDS, MAX_DECKS, NAME_MAX, NEW_PER_DAY_CHOICES, TEXT_MAX } from "./types";
import {
  addStudyDay,
  answerSession,
  applyReview,
  buildQueue,
  intervalLabel,
  nextInterval,
  type Session,
  startSession,
  streak,
  summarize,
  daysBetween,
  toYmd,
  isFresh,
} from "./srs";
import { dedupe, parsePairs, type ParseProblem, toTsv } from "./parse";
import { SAMPLES } from "./samples";
import {
  cleanName,
  exportFileName,
  exportJson,
  load,
  makeCard,
  makeDeck,
  mergeData,
  parseData,
  save,
} from "./storage";
import { MAX_DAYS } from "./types";
import { icon } from "./icons";

// ---- 状態 ----
const loaded = load();
let data: Data = loaded.data;
let canSave = save(data);
let undo: { data: Data; label: string } | null = null;
let importPending: Data | null = null;
let importOver = 0; // ファイルの中で上限を超えていた分
let editingId: string | null = null;
let pasteText = "";
let showAll = false;
const LIST_FIRST = 15;

interface Study {
  deckId: string;
  session: Session;
  flipped: boolean;
  busy: boolean;
  last: { card: Card; session: Session; days: string[] } | null;
}
let study: Study | null = null;

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const now = () => new Date();

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
const multiline = (s: string) => esc(s).replace(/\n/g, "<br />");

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);

const deckById = (id: string) => data.decks.find((d) => d.id === id);
const cardsOf = (id: string) => data.cards.filter((c) => c.deckId === id);
const art = (d: Pick<Deck, "art">, cls = "deck-art") =>
  `<img class="${cls}" src="./art/deck-${d.art}.webp" alt="" width="80" height="80" />`;

function commit(): void {
  canSave = save(data);
}

// ---- 骨組み ----
const app = $("#app")!;
app.innerHTML = `
  <a class="skip" href="#main">本文へ移動</a>
  <div id="notice" class="notice" role="status" hidden></div>
  <main id="main" tabindex="-1"></main>
  <footer class="foot">
    <p id="save-note" class="hint"></p>
    <p class="credit">カードは、このスマホ（ブラウザ）の中にだけ残ります。キャッシュと同じで、外には送りません。<br />
      <a href="../">ほかのアプリ</a></p>
  </footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <p class="sr-only" id="live" aria-live="polite"></p>
`;
const main = $("#main")!;

// ---- お知らせ ----
let toastTimer = 0;
function toast(msg: string, withUndo = false): void {
  const t = $("#toast")!;
  t.innerHTML = `<span>${esc(msg)}</span>${withUndo ? `<button type="button" class="toast-btn" data-act="undo">${icon("arrow-back-up")}<span>元に戻す</span></button>` : ""}`;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    t.classList.remove("show");
    t.innerHTML = "";
    if (withUndo) undo = null;
  }, withUndo ? 8000 : 3500);
}
function say(msg: string): void {
  const l = $("#live")!;
  l.textContent = "";
  window.setTimeout(() => (l.textContent = msg), 30);
}
function remember(label: string): void {
  undo = { data: structuredClone(data), label };
}

$("#toast")!.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act="undo"]');
  if (!b || !undo) return;
  data = undo.data;
  const label = undo.label;
  undo = null;
  commit();
  study = null;
  render();
  toast(`${label}を取り消しました。`);
});

// ---- 画面の切り替え（#/ ・ #/deck/<id> ・ #/study/<id>）----
type Route = { view: "home" } | { view: "deck"; id: string } | { view: "study"; id: string };
function route(): Route {
  const m = /^#\/(deck|study)\/([\w-]+)$/.exec(location.hash);
  if (m && deckById(m[2])) return { view: m[1] as "deck" | "study", id: m[2] };
  return { view: "home" };
}
function go(hash: string): void {
  if (location.hash === hash) render(true);
  else location.hash = hash;
}
window.addEventListener("hashchange", () => render(true));

function render(moveFocus = false): void {
  const r = route();
  document.body.dataset.view = r.view;
  if (r.view !== "study") study = null;
  if (moveFocus) {
    showAll = false;
    editingId = null;
    pasteText = "";
  }
  if (r.view === "home") renderHome();
  else if (r.view === "deck") renderDeck(deckById(r.id)!);
  else renderStudy(deckById(r.id)!);
  fillBars();
  $("#save-note")!.textContent = canSave ? "" : "この画面では保存できないため、閉じるとカードが消えます（めくることはできます）。";
  if (moveFocus) {
    window.scrollTo(0, 0);
    ($("[data-autofocus]", main) ?? $("h1", main))?.focus({ preventScroll: true });
  }
}

/** 進み具合の帯（CSP のため style 属性は使わず、ここで幅を入れる） */
function fillBars(): void {
  main.querySelectorAll<HTMLElement>("[data-pct]").forEach((el) => el.style.setProperty("--pct", `${el.dataset.pct}%`));
}

const pct = (a: number, b: number) => (b <= 0 ? 0 : Math.round((a / b) * 100));

// ---- はじめの画面 ----
function renderHome(): void {
  const today = now();
  const sums = data.decks.map((d) => ({ d, s: summarize(cardsOf(d.id), today, data.newPerDay) }));
  const todayTotal = sums.reduce((a, x) => a + x.s.today, 0);
  const days = streak(data.days, today);
  const empty = data.decks.length === 0;

  const todayBox = empty
    ? `<p class="today-msg">まず単語帳を1冊入れましょう。<br />下の<b>見本</b>を入れると、すぐにためせます。</p>`
    : todayTotal > 0
      ? `<p class="today-num"><span class="num">${todayTotal}</span><span>枚 めくります</span></p>
         <p class="hint">忘れかけたカードと、新しいカードです。</p>`
      : `<div class="today-done"><img src="./art/done-today.webp" alt="" width="64" height="64" /><p class="today-msg">今日の分は、ぜんぶ終わりました。<br />また明日。</p></div>`;

  const decksHtml = sums
    .map(
      ({ d, s }) => `
      <li class="deck-tile">
        <a class="deck-link" href="#/deck/${esc(d.id)}">
          <span class="hole" aria-hidden="true"></span>
          ${art(d)}
          <span class="deck-name">${esc(d.name)}</span>
          <span class="deck-meta">全${s.total}枚・覚えた${s.mastered}枚</span>
          <span class="bar" data-pct="${pct(s.mastered, s.total)}" aria-hidden="true"><span></span></span>
        </a>
        ${
          s.today > 0
            ? `<a class="btn primary tile-go" href="#/study/${esc(d.id)}">${icon("cards")}<span>めくる <b>${s.today}</b>枚</span></a>`
            : `<p class="tile-done">${s.total === 0 ? "カードがありません" : "今日はおわり"}</p>`
        }
      </li>`,
    )
    .join("");

  const samplesHtml = `
    <section class="panel" aria-labelledby="h-samples">
      <h2 id="h-samples" class="hand">見本の単語帳</h2>
      <p class="hint">ためしに入れてみましょう。あとで消せます。</p>
      <ul class="sample-list">
        ${SAMPLES.map((s) => {
          const has = data.decks.find((d) => d.sample === s.id);
          return `<li class="sample">
            ${art(s, "sample-art")}
            <span class="sample-text"><span class="sample-name">${esc(s.name)}</span><span class="hint">${esc(s.note)}・${s.cards.length}枚</span></span>
            ${
              has
                ? `<a class="btn ghost" href="#/deck/${esc(has.id)}">開く</a>`
                : `<button type="button" class="btn ${empty ? "primary" : "ghost"}" data-sample="${esc(s.id)}" aria-label="${esc(s.name)}を入れる">${icon("plus")}<span>入れる</span></button>`
            }
          </li>`;
        }).join("")}
      </ul>
    </section>`;

  main.innerHTML = `
    <header class="top">
      <div class="top-text">
        <p class="brand hand">暗記カード</p>
        <h1 class="hand" tabindex="-1"><span class="nw">めくって覚える、</span><span class="nw">単語カード。</span></h1>
        <p class="lead">忘れかけたころに、もう一度出してくれます。</p>
      </div>
      <div class="ring-art" aria-hidden="true">
        <span class="ra-card ra-3"></span><span class="ra-card ra-2"></span>
        <span class="ra-card ra-1"><span class="ra-word">apple</span></span>
        <span class="ra-ring"></span>
      </div>
    </header>

    <div class="home-grid">
      <section class="panel today" aria-labelledby="h-today">
        <h2 id="h-today" class="hand">今日の分</h2>
        ${todayBox}
        ${days > 0 ? `<p class="streak"><img src="./art/streak.webp" alt="" width="40" height="40" /><span><b>${days}</b>日つづけています</span></p>` : ""}
      </section>

      ${empty ? samplesHtml : ""}

      <section class="panel decks" aria-labelledby="h-decks">
        <h2 id="h-decks" class="hand">わたしの単語帳</h2>
        ${decksHtml ? `<ul class="deck-grid">${decksHtml}</ul>` : `<p class="hint">まだありません。</p>`}
        <form class="new-deck" id="new-deck" novalidate>
          <label for="new-deck-name">新しい単語帳を作る</label>
          <div class="input-row">
            <input id="new-deck-name" name="name" type="text" maxlength="${NAME_MAX}" placeholder="例: 英検3級の単語" autocomplete="off" />
            <button type="submit" class="btn primary">${icon("plus")}<span>作る</span></button>
          </div>
          <p class="msg" id="new-deck-msg" role="alert"></p>
        </form>
      </section>

      ${empty ? "" : samplesHtml}

      <section class="panel data" aria-labelledby="h-data">
        <h2 id="h-data" class="hand">データの書き出し・読み込み</h2>
        <p class="hint">機種変更のときや、念のための控えに。書き出したファイルを、別のスマホやパソコンで読み込めます。</p>
        <div class="btn-row">
          <button type="button" class="btn ghost" data-act="export" ${empty ? "disabled" : ""}>${icon("download")}<span>書き出す</span></button>
          <button type="button" class="btn ghost" data-act="import">${icon("upload")}<span>読み込む</span></button>
          <input type="file" id="import-file" accept=".json,application/json" hidden />
        </div>
        <div id="import-box">${importBox()}</div>
        <div class="setting">
          <label for="new-per-day">新しいカードは1日に（1冊ごと）</label>
          <select id="new-per-day">${NEW_PER_DAY_CHOICES.map((n) => `<option value="${n}" ${n === data.newPerDay ? "selected" : ""}>${n}枚まで</option>`).join("")}</select>
        </div>
      </section>
    </div>
  `;
}

function importBox(): string {
  if (!importPending) return "";
  const p = importPending;
  return `<div class="import-confirm" role="group" aria-labelledby="import-msg">
    <p id="import-msg">単語帳 <b>${p.decks.length}</b>冊・カード <b>${p.cards.length}</b>枚が入っています。どうしますか？</p>
    ${importOver ? `<p class="msg">${esc(overMsg(importOver))}</p>` : ""}
    <div class="btn-row">
      <button type="button" class="btn primary" data-act="import-add" data-autofocus>今のデータに足す</button>
      <button type="button" class="btn ghost" data-act="import-replace">今のデータと入れかえる</button>
      <button type="button" class="btn ghost" data-act="import-cancel">やめる</button>
    </div>
  </div>`;
}

// ---- 単語帳の画面 ----
function renderDeck(deck: Deck): void {
  const today = now();
  const list = cardsOf(deck.id);
  const s = summarize(list, today, data.newPerDay);
  const nextDue = list
    .filter((c) => !isFresh(c))
    .map((c) => c.due!)
    .filter((d) => d > toYmd(today))
    .sort()[0];
  const nextCount = nextDue ? list.filter((c) => c.due === nextDue).length : 0;

  const goHtml = s.total === 0
    ? `<p class="today-msg">まだカードがありません。<br />下の「まとめて入れる」に貼り付けてください。</p>`
    : s.today > 0
      ? `<a class="btn primary big" href="#/study/${esc(deck.id)}">${icon("cards")}<span>めくる（${s.today}枚）</span></a>
         <p class="hint">復習 ${s.due}枚・新しいカード ${s.today - s.due}枚</p>`
      : `<div class="today-done"><img src="./art/done-today.webp" alt="" width="64" height="64" /><p class="today-msg">今日の分は終わりました。${
          nextDue ? `<br />次は${esc(dueLabel(nextDue, today))} ${nextCount}枚です。` : ""
        }</p></div>`;

  main.innerHTML = `
    <nav class="crumb"><a class="back" href="#/">${icon("arrow-left")}<span>単語帳の一覧</span></a></nav>
    <header class="deck-head">
      ${art(deck, "deck-head-art")}
      <div>
        <h1 tabindex="-1">${esc(deck.name)}</h1>
        <p class="hint">全${s.total}枚・覚えた${s.mastered}枚（3回つづけて「わかった」）</p>
      </div>
    </header>
    <section class="panel deck-go" aria-label="今日の分">${goHtml}</section>

    <div class="deck-cols">
      <div class="col">
        <section class="panel" aria-labelledby="h-paste">
          <h2 id="h-paste" class="hand">まとめて入れる</h2>
          <p class="hint">1行に「表」と「裏」を、<b>タブ</b>か<b>カンマ</b>で区切って書きます。区切らずに<b>2行で1枚</b>（表・裏の順）でも作れます。エクセルやメモから、そのまま貼り付けできます。</p>
          <div class="example" aria-label="書き方の例"><span>apple,りんご</span><span>library,図書館</span><span>北海道</span><span>札幌市</span></div>
          <label for="paste">ここに貼り付け</label>
          <textarea id="paste" rows="6" spellcheck="false" placeholder="apple,りんご">${esc(pasteText)}</textarea>
          <div id="paste-preview" class="paste-preview">${pastePreview(deck)}</div>
        </section>

        <section class="panel" aria-labelledby="h-one">
          <h2 id="h-one" class="hand">1枚ずつ入れる</h2>
          <form id="one-form" class="one-form" novalidate>
            <label for="one-front">表（問題）</label>
            <textarea id="one-front" rows="2" maxlength="${TEXT_MAX}" placeholder="例: borrow"></textarea>
            <label for="one-back">裏（答え）</label>
            <textarea id="one-back" rows="2" maxlength="${TEXT_MAX}" placeholder="例: 借りる"></textarea>
            <p class="msg" id="one-msg" role="alert"></p>
            <button type="submit" class="btn primary">${icon("plus")}<span>1枚入れる</span></button>
          </form>
        </section>
      </div>

      <div class="col">
        <section class="panel" aria-labelledby="h-list">
          <h2 id="h-list" class="hand">カード</h2>
          <p class="hint">${s.total}枚</p>
          ${list.length ? `<ul class="card-list">${(showAll ? list : list.slice(0, LIST_FIRST)).map((c) => cardRow(c, today)).join("")}</ul>` : `<p class="hint">まだありません。</p>`}
          ${!showAll && list.length > LIST_FIRST ? `<button type="button" class="btn ghost more-btn" data-act="show-all">のこり ${list.length - LIST_FIRST}枚も見る</button>` : ""}
        </section>

        <section class="panel" aria-labelledby="h-deck-set">
          <h2 id="h-deck-set" class="hand">この単語帳</h2>
          <form id="rename-form" class="new-deck" novalidate>
            <label for="rename">名前</label>
            <div class="input-row">
              <input id="rename" type="text" maxlength="${NAME_MAX}" value="${esc(deck.name)}" autocomplete="off" />
              <button type="submit" class="btn ghost">${icon("check")}<span>変える</span></button>
            </div>
          </form>
          <div class="btn-row">
            <button type="button" class="btn ghost" data-act="copy-tsv" ${list.length ? "" : "disabled"}>${icon("copy")}<span>文字でコピー</span></button>
            <button type="button" class="btn ghost danger" data-act="delete-deck">${icon("trash")}<span>この単語帳を消す</span></button>
          </div>
          <p class="hint">「文字でコピー」した文字は、「まとめて入れる」にそのまま貼り付けられます。</p>
        </section>
      </div>
    </div>
  `;
}

function dueLabel(due: string, today: Date): string {
  const n = daysBetween(toYmd(today), due);
  return n === 1 ? "あした" : n === 2 ? "あさって" : `${n}日後`;
}

function cardRow(c: Card, today: Date): string {
  if (editingId === c.id)
    return `<li class="card-row editing" data-id="${esc(c.id)}">
      <form class="edit-form" data-id="${esc(c.id)}" novalidate>
        <label for="edit-front">表</label>
        <textarea id="edit-front" rows="2" maxlength="${TEXT_MAX}" data-autofocus>${esc(c.front)}</textarea>
        <label for="edit-back">裏</label>
        <textarea id="edit-back" rows="2" maxlength="${TEXT_MAX}">${esc(c.back)}</textarea>
        <p class="msg" id="edit-msg" role="alert"></p>
        <div class="btn-row">
          <button type="submit" class="btn primary">${icon("check")}<span>保存</span></button>
          <button type="button" class="btn ghost" data-act="edit-cancel">やめる</button>
        </div>
      </form>
    </li>`;
  const status = isFresh(c) ? "まだ" : c.due! <= toYmd(today) ? "今日" : `次は${dueLabel(c.due!, today)}`;
  return `<li class="card-row" data-id="${esc(c.id)}">
    <span class="mini-card"><span class="mc-front">${multiline(c.front)}</span><span class="mc-back">${multiline(c.back)}</span></span>
    <span class="row-side">
      <span class="tag ${isFresh(c) ? "tag-new" : ""}">${esc(status)}</span>
      <span class="row-btns">
        <button type="button" class="icon-btn" data-act="edit" aria-label="「${esc(c.front.slice(0, 20))}」を直す">${icon("pencil")}</button>
        <button type="button" class="icon-btn danger" data-act="delete-card" aria-label="「${esc(c.front.slice(0, 20))}」を消す">${icon("trash")}</button>
      </span>
    </span>
  </li>`;
}

const REASON: Record<ParseProblem["reason"], string> = {
  "no-back": "裏がありません",
  empty: "表か裏が空です",
  "too-long": `${TEXT_MAX}文字までです`,
};

function pastePreview(deck: Deck): string {
  if (!pasteText.trim()) return `<p class="hint">貼り付けると、ここに何枚できるか出ます。</p>`;
  const { pairs, problems } = parsePairs(pasteText);
  const { fresh, skipped } = dedupe(pairs, cardsOf(deck.id));
  const room = MAX_CARDS - data.cards.length;
  const n = Math.min(fresh.length, room);
  return `
    <p class="paste-count" aria-live="polite"><b>${n}</b>枚 作れます${skipped ? `（同じカード ${skipped}枚は、とばします）` : ""}</p>
    ${
      fresh.length
        ? `<ul class="paste-sample">${fresh
            .slice(0, 3)
            .map((p) => `<li><span>${esc(p.front)}</span><span aria-hidden="true">→</span><span class="sr-only">、裏は</span><span>${esc(p.back)}</span></li>`)
            .join("")}${fresh.length > 3 ? `<li class="more">ほか ${fresh.length - 3}枚</li>` : ""}</ul>`
        : ""
    }
    ${
      problems.length
        ? `<div class="problems"><p><b>${problems.length}行</b>は入れられません</p><ul>${problems
            .slice(0, 5)
            .map((p) => `<li>${p.line}行目「${esc(p.text.slice(0, 24))}」: ${REASON[p.reason]}</li>`)
            .join("")}</ul></div>`
        : ""
    }
    ${fresh.length > room ? `<p class="msg">カードは全部で ${MAX_CARDS.toLocaleString()}枚までです。</p>` : ""}
    <div class="btn-row">
      <button type="button" class="btn primary" data-act="paste-add" ${n ? "" : "disabled"}>${icon("plus")}<span>${n}枚を入れる</span></button>
      <button type="button" class="btn ghost" data-act="paste-clear">消す</button>
    </div>`;
}

// ---- めくる画面 ----
function sizeClass(s: string): string {
  const n = [...s].length;
  return n <= 8 ? "t-l" : n <= 24 ? "t-m" : "t-s";
}

function renderStudy(deck: Deck): void {
  if (!study || study.deckId !== deck.id) {
    const q = buildQueue(cardsOf(deck.id), now(), data.newPerDay);
    study = { deckId: deck.id, session: startSession(q.map((c) => c.id)), flipped: false, busy: false, last: null };
  }
  const st = study;
  // 消されたカードは飛ばす
  while (st.session.queue.length && !data.cards.some((c) => c.id === st.session.queue[0])) st.session.queue.shift();

  if (st.session.queue.length === 0) {
    main.innerHTML = st.session.done > 0 ? doneHtml(deck, st.session) : nothingHtml(deck);
    return;
  }
  const card = data.cards.find((c) => c.id === st.session.queue[0])!;
  const left = st.session.queue.length;
  const fresh = isFresh(card);
  main.innerHTML = `
    <div class="study">
      <div class="study-top">
        <a class="back" href="#/deck/${esc(deck.id)}">${icon("x")}<span>やめる</span></a>
        <p class="study-deck">${esc(deck.name)}</p>
        ${st.last ? `<button type="button" class="btn ghost small-btn" data-act="study-undo">${icon("arrow-back-up")}<span>ひとつ戻す</span></button>` : `<span class="spacer"></span>`}
      </div>
      <h1 class="sr-only" tabindex="-1">めくる: ${esc(deck.name)}</h1>
      <p class="left">のこり <b>${left}</b>枚</p>
      <div class="bar study-bar" data-pct="${pct(st.session.done, st.session.done + left)}" aria-hidden="true"><span></span></div>

      <div class="stack ${left > 1 ? "has-more" : ""}">
        <div class="flash ${st.flipped ? "flipped" : ""}" id="flash" data-act="flip">
          <div class="flash-inner">
            <div class="face face-front" ${st.flipped ? 'aria-hidden="true" inert' : ""}>
              <span class="hole" aria-hidden="true"></span>
              <span class="face-tag">${fresh ? "新しい" : "復習"}</span>
              <p class="face-text ${sizeClass(card.front)}"><span class="sr-only">表: </span>${multiline(card.front)}</p>
            </div>
            <div class="face face-back" ${st.flipped ? "" : 'aria-hidden="true" inert'}>
              <span class="hole" aria-hidden="true"></span>
              <p class="face-q">${multiline(card.front)}</p>
              <p class="face-text ${sizeClass(card.back)}" id="answer" tabindex="-1"><span class="sr-only">答え: </span>${multiline(card.back)}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="study-actions" id="study-actions">${actionsHtml(card, st.flipped)}</div>
    </div>
  `;
}

function actionsHtml(card: Card, flipped: boolean): string {
  const body = flipped
    ? `<p class="ask">思い出せましたか？</p>
       <div class="grades">${GRADES.map((g, i) => {
         const days = nextInterval(card, g);
         return `<button type="button" class="grade g-${g}" data-grade="${g}" aria-keyshortcuts="${i + 1}">
           <span class="g-label">${GRADE_LABEL[g]}</span>
           <span class="g-when">${g === "again" ? "もう一度" : `次は${intervalLabel(days)}`}</span>
         </button>`;
       }).join("")}</div>`
    : `<button type="button" class="btn primary big flip-btn" data-act="flip" id="flip-btn" aria-keyshortcuts="Space">${icon("rotate-2")}<span>めくって答えを見る</span></button>`;
  return `${body}<p class="keys">${icon("keyboard")}<span>スペースでめくる・1〜4で答える</span></p>`;
}

function doneHtml(deck: Deck, s: Session): string {
  const days = streak(data.days, now());
  return `
    <div class="done">
      <img class="stamp" src="./art/reward.webp" alt="大変よくできました" width="200" height="200" />
      <h1 class="hand" tabindex="-1"><span class="nw">今日の分、</span><span class="nw">おわり！</span></h1>
      <p class="done-sub">${s.done}回めくりました。</p>
      <ul class="tally">${GRADES.map((g) => `<li class="t-${g}"><span>${GRADE_LABEL[g]}</span><b>${s.counts[g]}</b></li>`).join("")}</ul>
      ${days > 0 ? `<p class="streak"><img src="./art/streak.webp" alt="" width="40" height="40" /><span><b>${days}</b>日つづけています</span></p>` : ""}
      <div class="btn-row center">
        <a class="btn primary" href="#/" data-autofocus>単語帳の一覧へ</a>
        <a class="btn ghost" href="#/deck/${esc(deck.id)}">この単語帳を見る</a>
      </div>
    </div>`;
}

function nothingHtml(deck: Deck): string {
  return `
    <div class="done">
      <img src="./art/done-today.webp" alt="" width="96" height="96" />
      <h1 class="hand" tabindex="-1"><span class="nw">今日めくるカードは</span><span class="nw">ありません</span></h1>
      <p class="done-sub">また明日、忘れかけたころに出します。</p>
      <div class="btn-row center">
        <a class="btn primary" href="#/deck/${esc(deck.id)}" data-autofocus>この単語帳を見る</a>
        <a class="btn ghost" href="#/">単語帳の一覧へ</a>
      </div>
    </div>`;
}

function flip(): void {
  if (!study || study.busy || !study.session.queue.length) return;
  study.flipped = !study.flipped;
  const flash = $("#flash", main);
  const card = data.cards.find((c) => c.id === study!.session.queue[0]);
  if (!flash || !card) return render();
  // 作り直さずに札を裏返す（アニメーションを見せるため）
  flash.classList.toggle("flipped", study.flipped);
  const [front, back] = [$(".face-front", flash)!, $(".face-back", flash)!];
  for (const [el, hide] of [[front, study.flipped], [back, !study.flipped]] as const) {
    el.toggleAttribute("inert", hide);
    if (hide) el.setAttribute("aria-hidden", "true");
    else el.removeAttribute("aria-hidden");
  }
  $("#study-actions", main)!.innerHTML = actionsHtml(card, study.flipped);
  if (study.flipped) {
    $("#answer", main)?.focus({ preventScroll: true });
  } else $("#flip-btn", main)?.focus({ preventScroll: true });
}

function answer(grade: Grade): void {
  const st = study;
  if (!st || st.busy || !st.flipped) return;
  const card = data.cards.find((c) => c.id === st.session.queue[0]);
  if (!card) return;
  st.busy = true;
  const today = now();
  st.last = { card, session: st.session, days: data.days };
  const updated = applyReview(card, grade, today);
  data = { ...data, cards: data.cards.map((c) => (c.id === card.id ? updated : c)), days: addStudyDay(data.days, today, MAX_DAYS) };
  commit();
  st.session = answerSession(st.session, grade);

  const next = () => {
    st.flipped = false;
    st.busy = false;
    render();
    if (st.session.queue.length) {
      $(".flash", main)?.classList.add("enter");
      $("#flip-btn", main)?.focus({ preventScroll: true });
      say(grade === "again" ? "もう一度、少しあとで出します。" : `次のカード。のこり${st.session.queue.length}枚。`);
    } else {
      $("[data-autofocus]", main)?.focus({ preventScroll: true });
      say("今日の分、おわりです。");
    }
  };
  const flash = $("#flash", main);
  if (flash && !reduceMotion()) {
    flash.classList.add(grade === "again" ? "leave-back" : "leave-up");
    window.setTimeout(next, 320);
  } else next();
}

function undoAnswer(): void {
  const st = study;
  if (!st?.last || st.busy) return;
  const { card, session, days } = st.last;
  data = { ...data, cards: data.cards.map((c) => (c.id === card.id ? card : c)), days };
  commit();
  st.session = session;
  st.last = null;
  st.flipped = true;
  render();
  $("#answer", main)?.focus({ preventScroll: true });
  say("ひとつ前のカードに戻しました。");
}

// ---- 操作 ----
const DECK_LIMIT_MSG = `単語帳は ${MAX_DECKS}冊までです。使わない単語帳を消してから作ってください。`;
const overMsg = (n: number) => (n > 0 ? `上限（単語帳 ${MAX_DECKS}冊・カード ${MAX_CARDS.toLocaleString()}枚）をこえる ${n}件は入りません。` : "");
function addSample(id: string): void {
  const s = SAMPLES.find((x) => x.id === id);
  if (!s) return;
  if (data.decks.length >= MAX_DECKS) return toast(DECK_LIMIT_MSG);
  if (data.cards.length + s.cards.length > MAX_CARDS) return toast(`カードは全部で ${MAX_CARDS.toLocaleString()}枚までです。`);
  const deck = makeDeck(s.name, s.art, s.id);
  data = { ...data, decks: [...data.decks, deck], cards: [...data.cards, ...s.cards.map((p, i) => makeCard(deck.id, p, i))] };
  commit();
  render();
  toast(`「${s.name}」を入れました。`);
  main.querySelector<HTMLElement>(`a[href="#/study/${CSS.escape(deck.id)}"]`)?.focus();
}

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

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

main.addEventListener("click", async (e) => {
  const t = e.target as HTMLElement;
  const sample = t.closest<HTMLElement>("[data-sample]");
  if (sample) return addSample(sample.dataset.sample!);
  const g = t.closest<HTMLElement>("[data-grade]");
  if (g) return answer(g.dataset.grade as Grade);
  const el = t.closest<HTMLElement>("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  const r = route();
  const deck = r.view !== "home" ? deckById(r.id) : undefined;

  if (act === "flip") return flip();
  if (act === "show-all") {
    showAll = true;
    const n = main.querySelectorAll(".card-row").length;
    render();
    return main.querySelectorAll<HTMLElement>(".card-row [data-act='edit']")[n]?.focus();
  }
  if (act === "study-undo") return undoAnswer();
  if (act === "export") {
    download(exportFileName(now()), exportJson(data));
    return toast(`カード ${data.cards.length}枚を書き出しました。`);
  }
  if (act === "import") return $<HTMLInputElement>("#import-file")?.click();
  if (act === "import-cancel") {
    importPending = null;
    render();
    return $<HTMLElement>('[data-act="import"]', main)?.focus();
  }
  if (act === "import-add" && importPending) {
    remember("読み込み");
    const m = mergeData(data, importPending);
    data = m.data;
    importPending = null;
    commit();
    render();
    return toast(`単語帳 ${m.decks}冊・カード ${m.cards}枚を足しました。${m.skipped ? `（同じもの ${m.skipped}枚は、とばしました）` : ""}${overMsg(m.over)}`, true);
  }
  if (act === "import-replace" && importPending) {
    remember("入れかえ");
    data = { ...importPending, newPerDay: data.newPerDay };
    importPending = null;
    commit();
    render();
    return toast(`読み込んだデータと入れかえました。`, true);
  }
  if (!deck) return;
  if (act === "paste-add") {
    const { pairs } = parsePairs(pasteText);
    const { fresh } = dedupe(pairs, cardsOf(deck.id));
    const add = fresh.slice(0, MAX_CARDS - data.cards.length);
    if (!add.length) return;
    data = { ...data, cards: [...data.cards, ...add.map((p, i) => makeCard(deck.id, p, i))] };
    pasteText = "";
    commit();
    render();
    toast(`${add.length}枚を入れました。`);
    return $<HTMLElement>("#paste", main)?.focus();
  }
  if (act === "paste-clear") {
    pasteText = "";
    render();
    return $<HTMLElement>("#paste", main)?.focus();
  }
  if (act === "copy-tsv") {
    const ok = await copyText(toTsv(cardsOf(deck.id)));
    return toast(ok ? "表と裏を、文字でコピーしました。" : "コピーできませんでした。");
  }
  if (act === "delete-deck") {
    remember(`「${deck.name}」を消したの`);
    data = { ...data, decks: data.decks.filter((d) => d.id !== deck.id), cards: data.cards.filter((c) => c.deckId !== deck.id) };
    commit();
    go("#/");
    return toast(`「${deck.name}」を消しました。`, true);
  }
  const row = el.closest<HTMLElement>(".card-row");
  const id = row?.dataset.id;
  if (act === "edit" && id) {
    editingId = id;
    render();
    return $<HTMLElement>("#edit-front", main)?.focus();
  }
  if (act === "edit-cancel") {
    editingId = null;
    render();
    return $<HTMLElement>(`.card-row[data-id="${CSS.escape(id ?? "")}"] [data-act="edit"]`, main)?.focus();
  }
  if (act === "delete-card" && id) {
    const c = data.cards.find((x) => x.id === id)!;
    remember("カードを消したの");
    const rows = [...main.querySelectorAll<HTMLElement>(".card-row")];
    const idx = rows.findIndex((x) => x.dataset.id === id);
    data = { ...data, cards: data.cards.filter((x) => x.id !== id) };
    commit();
    render();
    const after = main.querySelectorAll<HTMLElement>(".card-row [data-act='delete-card']");
    (after[Math.min(idx, after.length - 1)] ?? $("h1", main))?.focus();
    return toast(`「${c.front.slice(0, 16)}」を消しました。`, true);
  }
});

main.addEventListener("input", (e) => {
  const t = e.target as HTMLElement;
  if (t.id === "paste") {
    pasteText = (t as HTMLTextAreaElement).value;
    const r = route();
    if (r.view === "deck") $("#paste-preview", main)!.innerHTML = pastePreview(deckById(r.id)!);
  }
});

main.addEventListener("change", async (e) => {
  const t = e.target as HTMLElement;
  if (t.id === "new-per-day") {
    data = { ...data, newPerDay: Number((t as HTMLSelectElement).value) };
    commit();
    render();
    $<HTMLElement>("#new-per-day", main)?.focus();
    return toast(`新しいカードは1日 ${data.newPerDay}枚までにしました。`);
  }
  if (t.id === "import-file") {
    const input = t as HTMLInputElement;
    const f = input.files?.[0];
    input.value = "";
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return toast("ファイルが大きすぎます。");
    const r = parseData(await f.text());
    if (!r || (!r.data.decks.length && !r.data.cards.length)) return toast("このファイルは読み込めません。このアプリで書き出したファイルを選んでください。");
    importPending = r.data;
    importOver = r.over;
    render();
    $<HTMLElement>('[data-act="import-add"]', main)?.focus();
  }
});

main.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target as HTMLFormElement;
  const r = route();
  if (f.id === "new-deck") {
    const input = $<HTMLInputElement>("#new-deck-name", f)!;
    if (data.decks.length >= MAX_DECKS) {
      $("#new-deck-msg", f)!.textContent = DECK_LIMIT_MSG;
      return input.focus();
    }
    const deck = makeDeck(input.value);
    data = { ...data, decks: [...data.decks, deck] };
    commit();
    go(`#/deck/${deck.id}`);
    toast(`「${deck.name}」を作りました。カードを入れましょう。`);
    return;
  }
  const deck = r.view === "deck" ? deckById(r.id) : undefined;
  if (!deck) return;
  if (f.id === "rename-form") {
    const name = cleanName($<HTMLInputElement>("#rename", f)!.value);
    data = { ...data, decks: data.decks.map((d) => (d.id === deck.id ? { ...d, name } : d)) };
    commit();
    render();
    $<HTMLElement>("#rename", main)?.focus();
    return toast("名前を変えました。");
  }
  if (f.id === "one-form") {
    const front = $<HTMLTextAreaElement>("#one-front", f)!.value.trim();
    const back = $<HTMLTextAreaElement>("#one-back", f)!.value.trim();
    const msg = $("#one-msg", f)!;
    if (!front || !back) {
      msg.textContent = !front ? "表を入れてください。" : "裏を入れてください。";
      return $<HTMLElement>(!front ? "#one-front" : "#one-back", f)?.focus();
    }
    if (data.cards.length >= MAX_CARDS) {
      msg.textContent = `カードは全部で ${MAX_CARDS.toLocaleString()}枚までです。`;
      return;
    }
    data = { ...data, cards: [...data.cards, makeCard(deck.id, { front, back })] };
    commit();
    render();
    $<HTMLElement>("#one-front", main)?.focus();
    return toast(`「${front.slice(0, 16)}」を入れました。`);
  }
  if (f.classList.contains("edit-form")) {
    const id = f.dataset.id!;
    const front = $<HTMLTextAreaElement>("#edit-front", f)!.value.trim();
    const back = $<HTMLTextAreaElement>("#edit-back", f)!.value.trim();
    if (!front || !back) {
      $("#edit-msg", f)!.textContent = "表と裏の両方を入れてください。";
      return;
    }
    data = { ...data, cards: data.cards.map((c) => (c.id === id ? { ...c, front, back } : c)) };
    editingId = null;
    commit();
    render();
    $<HTMLElement>(`.card-row[data-id="${CSS.escape(id)}"] [data-act="edit"]`, main)?.focus();
    return toast("カードを直しました。");
  }
});

// キーボード: めくる画面では スペース・Enter でめくる、1〜4 で答える
document.addEventListener("keydown", (e) => {
  if (route().view !== "study" || !study || e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target as HTMLElement;
  if (t.closest("input, textarea, select")) return;
  const onButton = !!t.closest("button, a");
  if ((e.key === " " || e.key === "Enter") && !onButton) {
    e.preventDefault();
    if (!study.flipped) flip();
    return;
  }
  const n = Number(e.key);
  if (study.flipped && n >= 1 && n <= 4) {
    e.preventDefault();
    answer(GRADES[n - 1]);
  }
});

// ---- はじめの表示 ----
render();
const notice = $("#notice")!;
const NOTE: Record<string, string> = {
  broken: "保存されていた内容を読めなかったため、空の状態で始めました。",
  migrated: "前の版の単語帳を引き継ぎました。",
  dropped: "読めないカードがあったため、一部をとばしました。",
};
if (loaded.note) {
  notice.textContent = NOTE[loaded.note];
  notice.hidden = false;
}

// ---- オフライン対応 ----
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        const urls = [
          location.href.split("#")[0],
          ...performance
            .getEntriesByType("resource")
            .map((e) => e.name)
            .filter((u) => u.startsWith(location.origin)),
          ...["reward", "streak", "done-today", "deck-own", "deck-english", "deck-japan", "deck-element"].map((n) => new URL(`./art/${n}.webp`, location.href).href),
        ];
        reg.active?.postMessage({ type: "precache", urls });
      })
      .catch(() => {
        /* 登録できなくても通常どおり使える */
      });
  });
}
