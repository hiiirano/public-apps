import "./style.css";
import {
  ITEM_IDS,
  PEOPLE,
  STORAGE_KEY,
  comparisonMessage,
  completedRows,
  createRound,
  createSeed,
  emptySave,
  formatTime,
  getItem,
  getPerson,
  isSolved,
  nextBestMove,
  parseSave,
  parseShare,
  recordPlay,
  serializeShare,
  solve,
  starsFor,
  startPuzzle,
  tapCell,
  type ItemId,
  type PersonId,
  type PuzzleState,
  type Round,
  type SaveData,
  type SharedRound,
} from "./game";
import { icon } from "./icons";

// ---------- 状態 ----------

type Phase = "play" | "stageClear" | "allClear" | "question" | "judging" | "result";

interface StageResult {
  moves: number;
  secs: number;
  par: number;
  stars: number;
}

const root = document.querySelector<HTMLDivElement>("#app")!;
const live = document.querySelector<HTMLDivElement>("#live")!;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let round: Round;
let shared: SharedRound | null = null;
let stageIndex = 0;
let puzzle: PuzzleState;
let goal: ItemId[] = [];
let results: StageResult[] = [];
let phase: Phase = "play";
let stageStartedAt = 0;
let lastActionAt = 0;
let hint: { a: number; b: number; step: "a" | "b" } | null = null;
let tutorial = true;
let choice: number | null = null;
let notice = "";
let shareNotice = "";
let showLink = false;
let newBest = false;
let save: SaveData = emptySave();
let canSave = true;
let pendingFlip: { a: number; b: number; ra: DOMRect; rb: DOMRect } | null = null;
let timers: number[] = [];

const art = (kind: "f" | "p" | "u", id: string) => `./art/${kind}-${id}.webp`;
const itemLabel = (id: ItemId) => getItem(id).label;
const ARTS = [
  ...ITEM_IDS.map((id) => art("f", id)),
  ...PEOPLE.map((p) => art("p", p.id)),
  ...["finger", "party", "question"].map((id) => art("u", id)),
];

function later(ms: number, fn: () => void) {
  timers.push(window.setTimeout(fn, reduceMotion.matches ? Math.min(ms, 500) : ms));
}

function announce(text: string) {
  live.textContent = "";
  window.setTimeout(() => (live.textContent = text), 30);
}

// ---------- 保存 ----------

function loadSave() {
  try {
    save = parseSave(localStorage.getItem(STORAGE_KEY));
  } catch {
    canSave = false;
    save = emptySave();
  }
}

function writeSave() {
  if (!canSave) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    canSave = false;
  }
}

// ---------- 進行 ----------

function startRound(seed: string, from: SharedRound | null) {
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];
  round = createRound(seed);
  shared = from;
  results = [];
  choice = null;
  shareNotice = "";
  showLink = false;
  newBest = false;
  startStage(0);
}

function startStage(index: number) {
  stageIndex = index;
  const stage = round.stages[index]!;
  puzzle = startPuzzle(stage);
  goal = solve(stage.cells, stage.cols).target;
  phase = "play";
  stageStartedAt = Date.now();
  lastActionAt = Date.now();
  // 1面目は最初の1手を指で見せる。2面目以降は、しばらく手が止まったら見せる
  tutorial = index === 0;
  hint = tutorial ? makeHint() : null;
  render();
  announce(`ステージ${index + 1}。${stage.rows}段×${stage.cols}列。同じ物を1段にそろえます。`);
}

function makeHint(): typeof hint {
  const move = nextBestMove(puzzle.cells, puzzle.cols);
  return move ? { a: move[0], b: move[1], step: "a" } : null;
}

function elapsed() {
  return Math.floor((Date.now() - stageStartedAt) / 1000);
}

function onTap(slot: number) {
  if (phase !== "play") return;
  lastActionAt = Date.now();
  const before = puzzle;
  const doneBefore = completedRows(before.cells, before.cols);
  puzzle = tapCell(puzzle, slot);

  if (puzzle.moves > before.moves) {
    const a = before.selected!;
    const ra = cellRect(a);
    const rb = cellRect(slot);
    if (ra && rb) pendingFlip = { a, b: slot, ra, rb };
    if (tutorial) tutorial = false;
    hint = null;
    const doneAfter = completedRows(puzzle.cells, puzzle.cols);
    const newly = doneAfter.findIndex((d, i) => d && !doneBefore[i]);
    if (isSolved(puzzle.cells, puzzle.cols)) {
      finishStage();
      return;
    }
    announce(`${itemLabel(puzzle.cells[slot]!)}と${itemLabel(puzzle.cells[a]!)}を入れかえました。手数${puzzle.moves}。${newly >= 0 ? `${newly + 1}段目がそろいました。` : ""}`);
  } else if (hint) {
    // 指のとおり1つ目を押したら、2つ目だけを指す。違う所を押したら指は消す
    hint = hint.step === "a" && puzzle.selected === hint.a ? { ...hint, step: "b" } : null;
  }
  if (!hint && puzzle.selected !== null) announce(`${itemLabel(puzzle.cells[slot]!)}を選びました。入れかえる相手を押してください。`);
  render();
}

function showHint() {
  if (phase !== "play") return;
  lastActionAt = Date.now();
  puzzle = { ...puzzle, selected: null };
  hint = makeHint();
  render();
  if (hint) announce(`${hint.a + 1}番目と${hint.b + 1}番目のマスを入れかえてみて。`);
}

function finishStage() {
  const stage = round.stages[stageIndex]!;
  const secs = elapsed();
  results.push({ moves: puzzle.moves, secs, par: stage.par, stars: starsFor(puzzle.moves, stage.par) });
  const last = stageIndex === round.stages.length - 1;
  phase = "stageClear";
  render();
  announce(`クリア！ ${puzzle.moves}手、${formatTime(secs)}。`);
  later(1700, () => {
    if (!last) {
      startStage(stageIndex + 1);
      return;
    }
    phase = "allClear";
    render();
    later(1500, () => {
      phase = "question";
      render();
      announce("で、この冷蔵庫の持ち主は誰？ 4人から選んでください。");
      root.querySelector<HTMLButtonElement>(".cand")?.focus({ preventScroll: true });
    });
  });
}

function totals() {
  return {
    moves: results.reduce((s, r) => s + r.moves, 0),
    secs: results.reduce((s, r) => s + r.secs, 0),
    par: results.reduce((s, r) => s + r.par, 0),
    stars: results.reduce((s, r) => s + r.stars, 0),
  };
}

function pick(index: number) {
  if (phase !== "question") return;
  choice = index;
  phase = "judging";
  render();
  announce("判定中");
  later(1200, () => {
    phase = "result";
    const t = totals();
    const r = recordPlay(save, { stars: t.stars, moves: t.moves, secs: t.secs });
    save = r.save;
    newBest = r.newBest;
    writeSave();
    render();
    const correct = getPerson(round.candidates[round.correct]!.person);
    announce(`正解は${correct.name}。${comparisonMessage(round.correct, index, shared?.senderPick)}。ちなみに、手に持っていた物は正解と一切関係ありません。`);
    root.querySelector<HTMLElement>("#result-title")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  });
}

function shareUrl(): string {
  const t = totals();
  const fragment = serializeShare(round.seed, choice ?? 0, { moves: Math.max(1, t.moves), secs: t.secs });
  return `${location.origin}${location.pathname}${location.search}#${fragment}`;
}

async function share() {
  const url = shareUrl();
  const t = totals();
  const text = `ヒエヒエ冷蔵庫、${t.moves}手でそろえた。で、この冷蔵庫の持ち主は誰？ やってみて。`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "ヒエヒエ冷蔵庫", text, url });
      shareNotice = "送る画面を開きました";
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      shareNotice = "リンクをコピーしました。LINEなどに貼ってね";
    }
    showLink = false;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    shareNotice = "コピーできませんでした。下のリンクを長押ししてコピーしてね";
    showLink = true;
  }
  render();
  root.querySelector<HTMLElement>("#share")?.focus({ preventScroll: true });
}

function newRound() {
  notice = "";
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  startRound(createSeed(), null);
  window.scrollTo({ top: 0 });
  root.querySelector<HTMLButtonElement>(".cell")?.focus({ preventScroll: true });
}

// ---------- 描画 ----------

function cellRect(slot: number): DOMRect | null {
  return root.querySelector(`[data-slot="${slot}"] .cell-img`)?.getBoundingClientRect() ?? null;
}

function stars(n: number, of: number): string {
  return `<span class="stars" aria-label="星${n}つ（${of}つ中）">${Array.from({ length: of }, (_, i) => `<span class="${i < n ? "on" : "off"}">★</span>`).join("")}</span>`;
}

function headerMarkup(): string {
  return `
    <header class="top">
      <p class="series">しょうもなゲーム <span class="dot">#01</span></p>
      <h1 class="title">ヒエヒエ冷蔵庫</h1>
    </header>
    ${notice ? `<p class="notice" role="status">${notice}</p>` : ""}
    ${shared && phase !== "result" ? `<p class="from-friend">友だちから届いた問題です</p>` : ""}`;
}

function hudMarkup(): string {
  const stage = round.stages[stageIndex]!;
  return `
    <div class="hud" role="group" aria-label="成績">
      <div class="hud-box"><span class="hud-k">STAGE</span><b class="hud-v">${stageIndex + 1}<small>/${round.stages.length}</small></b></div>
      <div class="hud-box"><span class="hud-k">手数</span><b class="hud-v" id="hud-moves">${puzzle.moves}</b><small class="hud-sub">目標 ${stage.par}</small></div>
      <div class="hud-box"><span class="hud-k">${icon("clock")}TIME</span><b class="hud-v" id="hud-time">${formatTime(phase === "play" ? elapsed() : results[stageIndex]?.secs ?? 0)}</b></div>
    </div>`;
}

function cellMarkup(item: ItemId, slot: number, done: boolean[]): string {
  const stage = round.stages[stageIndex]!;
  const row = Math.floor(slot / stage.cols);
  const col = slot % stage.cols;
  const selected = puzzle.selected === slot;
  const hintClass = hint && hint.step === "a" && hint.a === slot ? "hint-a" : hint && hint.b === slot ? "hint-b" : "";
  const badge = hintClass === "hint-a" ? "1" : hintClass === "hint-b" ? "2" : "";
  return `
    <button class="cell ${selected ? "is-selected" : ""} ${done[row] ? "is-done" : ""} ${hintClass}" data-slot="${slot}" data-key="cell-${slot}"
      aria-pressed="${selected}" aria-label="${row + 1}段目 ${col + 1}列目 ${itemLabel(item)}${done[row] ? "（そろった）" : ""}" ${phase === "play" ? "" : "disabled"}>
      <img class="cell-img" src="${art("f", item)}" alt="" draggable="false">
      ${badge ? `<span class="hint-badge" aria-hidden="true">${badge}</span>` : ""}
    </button>`;
}

function playMarkup(): string {
  const stage = round.stages[stageIndex]!;
  const done = completedRows(puzzle.cells, stage.cols);
  const result = results[stageIndex];
  const overlay =
    phase === "stageClear" && result
      ? `<div class="overlay clear-pop" role="status">
           <p class="big">CLEAR!</p>
           ${stars(result.stars, 3)}
           <p class="sub">${result.moves}手（目標 ${result.par}）・${formatTime(result.secs)}</p>
         </div>`
      : phase === "allClear"
        ? `<div class="overlay all-clear" role="status">
             <img src="${art("u", "party")}" alt="" class="party">
             <p class="big">ALL CLEAR!</p>
             <p class="sub">${totals().moves}手・${formatTime(totals().secs)}</p>
           </div>`
        : "";
  const goalMini = goal
    .map((kind) => `<div class="mini-row">${Array.from({ length: stage.cols }, () => `<img src="${art("f", kind)}" alt="">`).join("")}</div>`)
    .join("");
  return `
    <section class="play" aria-labelledby="play-title">
      <h2 id="play-title" class="sr-only">ステージ${stageIndex + 1}</h2>
      ${hudMarkup()}
      <div class="board-area">
        <div class="fridge">
          <div class="fridge-top" aria-hidden="true"><span class="brand">HIETA</span><span class="lamp"></span></div>
          <div class="grid-wrap">
            <div class="grid cols-${stage.cols}" role="group" aria-label="冷蔵庫の中（${stage.rows}段×${stage.cols}列）。2つ押すと入れかわります">
              ${puzzle.cells.map((item, slot) => cellMarkup(item, slot, done)).join("")}
            </div>
            ${hint && phase === "play" ? `<img class="finger ${hint.step === "b" ? "only-b" : ""}" src="${art("u", "finger")}" alt="" aria-hidden="true">` : ""}
            ${phase === "play" && !reduceMotion.matches ? `<p class="stage-banner" aria-hidden="true">STAGE ${stageIndex + 1}</p>` : ""}
          </div>
          ${overlay}
        </div>
        <aside class="side">
          <div class="goal">
            <p class="goal-k">GOAL</p>
            <div class="mini" aria-hidden="true">${goalMini}</div>
            <p class="goal-text">1段に<br>同じ物</p>
          </div>
          <div class="how" aria-hidden="true">
            <span class="how-step">${icon("arrows-exchange")}</span>
            <span class="how-text">2つ押すと<br>入れかわる</span>
          </div>
          <button class="hint-btn" id="hint" data-key="hint" ${phase === "play" ? "" : "disabled"}>${icon("bulb")}ヒント</button>
        </aside>
      </div>
    </section>`;
}

function personImg(id: PersonId, cls: string): string {
  return `<img class="${cls}" src="${art("p", id)}" alt="">`;
}

function fridgeShelves(): string {
  // 中身を3〜4段の棚に分けて、少し傾けて詰め込む
  // 遊んだ食べ物は2つずつ入れて、ぎっしり詰まった感じにする
  const played = round.stages.flatMap((s) => s.kinds);
  const items = round.fridge.flatMap((id, i) => (played.includes(id) ? [id, round.fridge[(i * 5) % round.fridge.length]!] : [id]));
  const perShelf = Math.ceil(items.length / 4);
  const shelves = [0, 1, 2, 3].map((s) => items.slice(s * perShelf, (s + 1) * perShelf));
  const tilt = (i: number) => (i * 3) % 5;
  return shelves
    .map(
      (shelf, s) =>
        `<div class="shelf">${shelf
          .map((id, i) => `<img src="${art("f", id)}" alt="" class="tilt-${tilt(i + s * 5)}">`)
          .join("")}</div>`,
    )
    .join("");
}

function questionMarkup(): string {
  const judging = phase === "judging";
  const contents = round.fridge.map(itemLabel).join("、");
  return `
    <section class="twist" aria-labelledby="q-title">
      <div class="q-banner">
        <img src="${art("u", "question")}" alt="" class="q-mark">
        <h2 id="q-title" tabindex="-1">で、この冷蔵庫の<br>持ち主は誰？</h2>
      </div>
      <div class="twist-body">
        <figure class="open-fridge ${judging ? "shaking" : ""}">
          <div class="fridge-inside" role="img" aria-label="冷蔵庫の中身: ${contents}">${fridgeShelves()}</div>
          ${judging ? `<p class="judge" role="status">判定中…</p>` : ""}
        </figure>
        <div class="cands" role="group" aria-label="持ち主の候補（4人）">
          ${round.candidates
            .map((c, i) => {
              const p = getPerson(c.person);
              return `
              <button class="cand ${choice === i ? "is-picked" : ""}" data-pick="${i}" data-key="pick-${i}" ${phase === "question" ? "" : "disabled"}
                aria-label="${i + 1}. ${p.name}（${itemLabel(c.held)}を持っている）">
                <span class="cand-no" aria-hidden="true">${i + 1}</span>
                <span class="cand-art">${personImg(c.person, "cand-img")}<span class="held"><img src="${art("f", c.held)}" alt=""></span></span>
                <span class="cand-name">${p.name}</span>
              </button>`;
            })
            .join("")}
        </div>
      </div>
      <p class="fake-hint">${icon("bulb")}持ってる物が ヒントかも…？</p>
    </section>`;
}

function resultMarkup(): string {
  const mine = choice ?? 0;
  const correct = round.candidates[round.correct]!;
  const person = getPerson(correct.person);
  const sender = shared?.senderPick;
  const msg = comparisonMessage(round.correct, mine, sender);
  const t = totals();
  const nameAt = (i: number) => getPerson(round.candidates[i]!.person).name;
  const face = (i: number) => personImg(round.candidates[i]!.person, "mini-face");
  const row = (label: string, i: number, ok: boolean) =>
    `<li class="${ok ? "ok" : ""}">${face(i)}<span class="who-k">${label}</span><span class="who-v">${nameAt(i)}</span></li>`;
  const ss = shared?.senderScore;
  return `
    <section class="result" aria-labelledby="result-title">
      <div class="reveal">
        <p class="verdict">${mine === round.correct ? "正解！" : "正解は…"}</p>
        <div class="burst-wrap">
          <span class="burst" aria-hidden="true"></span>
          ${personImg(correct.person, "answer-img")}
          <span class="held big"><img src="${art("f", correct.held)}" alt=""></span>
        </div>
        <p class="answer-name">${person.name}</p>
        <h2 id="result-title" class="punch" tabindex="-1">${msg}</h2>
        <div class="no-relation">
          <div class="held-row" aria-hidden="true">${round.candidates
            .map((c) => `<span class="crossed"><img src="${art("f", c.held)}" alt=""></span>`)
            .join("")}</div>
          <p>ちなみに、手に持ってた物は<br><strong>正解と一切関係ありません。</strong></p>
        </div>
      </div>
      <div class="report">
        <ul class="compare" aria-label="答えくらべ">
          ${row("正解", round.correct, true)}
          ${row("あなた", mine, mine === round.correct)}
          ${sender !== undefined ? row("送った人", sender, sender === round.correct) : ""}
        </ul>
        <div class="score">
          <p class="score-k">パズルの成績</p>
          <div class="score-grid">
            <div><span>星</span><b class="num star-total" aria-label="星${t.stars}つ（9つ中）"><span class="on" aria-hidden="true">★</span>${t.stars}<small>/ 9</small></b></div>
            <div><span>手数</span><b class="num">${t.moves}<small>（最短 ${t.par}）</small></b></div>
            <div><span>タイム</span><b class="num">${formatTime(t.secs)}</b></div>
          </div>
          ${ss ? `<p class="vs">送った人: ${ss.moves}手・${formatTime(ss.secs)} → ${t.moves < ss.moves || (t.moves === ss.moves && t.secs < ss.secs) ? "あなたの勝ち！" : t.moves === ss.moves && t.secs === ss.secs ? "引き分け" : "送った人の勝ち"}</p>` : ""}
          ${newBest && save.plays > 1 ? `<p class="best">自己ベスト更新！</p>` : save.best && save.plays > 1 ? `<p class="best-old">自己ベスト ★${save.best.stars}・${save.best.moves}手・${formatTime(save.best.secs)}</p>` : ""}
        </div>
        <div class="actions">
          <button class="btn primary" id="share" data-key="share">${icon("share")}友だちにやらせる</button>
          <button class="btn" id="again" data-key="again">${icon("refresh")}ちがう冷蔵庫で もう1回</button>
        </div>
        ${shareNotice ? `<p class="share-notice" role="status">${shareNotice}</p>` : ""}
        ${showLink ? `<label class="link-label">共有リンク<input class="link" id="share-link" readonly value="${shareUrl()}"></label>` : ""}
      </div>
    </section>`;
}

function render() {
  const focusedKey = (document.activeElement as HTMLElement | null)?.dataset?.key;
  const body = phase === "question" || phase === "judging" ? questionMarkup() : phase === "result" ? resultMarkup() : playMarkup();
  root.innerHTML = `<main class="shell phase-${phase}">${headerMarkup()}${body}</main>`;
  bind();
  if (focusedKey) root.querySelector<HTMLElement>(`[data-key="${focusedKey}"]:not(:disabled)`)?.focus({ preventScroll: true });
  placeFinger();
  runFlip();
}

function placeFinger() {
  const finger = root.querySelector<HTMLImageElement>(".finger");
  const wrap = root.querySelector<HTMLElement>(".grid-wrap");
  if (!finger || !wrap || !hint) return;
  const w = wrap.getBoundingClientRect();
  const pos = (slot: number) => {
    const r = root.querySelector(`[data-slot="${slot}"]`)!.getBoundingClientRect();
    return { x: r.left - w.left + r.width / 2 - 20, y: r.top - w.top + r.height / 2 - 4 };
  };
  const a = pos(hint.a);
  const b = pos(hint.b);
  finger.style.setProperty("--ax", `${a.x}px`);
  finger.style.setProperty("--ay", `${a.y}px`);
  finger.style.setProperty("--bx", `${b.x}px`);
  finger.style.setProperty("--by", `${b.y}px`);
}

function runFlip() {
  if (!pendingFlip || reduceMotion.matches) {
    pendingFlip = null;
    return;
  }
  const { a, b, ra, rb } = pendingFlip;
  pendingFlip = null;
  const move = (slot: number, from: DOMRect) => {
    const img = root.querySelector<HTMLElement>(`[data-slot="${slot}"] .cell-img`);
    if (!img) return;
    const to = img.getBoundingClientRect();
    img.style.transition = "none";
    img.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(1.15)`;
    img.style.zIndex = "3";
    void img.offsetWidth;
    img.style.transition = "transform .28s cubic-bezier(.3,1.4,.5,1)";
    img.style.transform = "";
    window.setTimeout(() => (img.style.zIndex = ""), 300);
  };
  move(a, rb);
  move(b, ra);
}

function bind() {
  root.querySelectorAll<HTMLButtonElement>("[data-slot]").forEach((btn) => btn.addEventListener("click", () => onTap(Number(btn.dataset.slot))));
  root.querySelector(".grid")?.addEventListener("keydown", (e) => onGridKey(e as KeyboardEvent));
  root.querySelector("#hint")?.addEventListener("click", showHint);
  root.querySelectorAll<HTMLButtonElement>("[data-pick]").forEach((btn) => btn.addEventListener("click", () => pick(Number(btn.dataset.pick))));
  root.querySelector("#share")?.addEventListener("click", share);
  root.querySelector("#again")?.addEventListener("click", newRound);
  root.querySelector<HTMLInputElement>("#share-link")?.addEventListener("focus", (e) => (e.currentTarget as HTMLInputElement).select());
}

/** 矢印キーでマスを移動する */
function onGridKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  if (!target.dataset.slot) return;
  const cols = puzzle.cols;
  const n = puzzle.cells.length;
  const slot = Number(target.dataset.slot);
  const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols };
  const d = delta[e.key];
  if (d === undefined) return;
  const next = slot + d;
  if (next < 0 || next >= n) return;
  if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && Math.floor(next / cols) !== Math.floor(slot / cols)) return;
  e.preventDefault();
  root.querySelector<HTMLElement>(`[data-slot="${next}"]`)?.focus();
}

// 時計と「手が止まったら指を出す」
window.setInterval(() => {
  if (phase !== "play") return;
  const el = root.querySelector("#hud-time");
  if (el) el.textContent = formatTime(elapsed());
  if (!hint && Date.now() - lastActionAt > 9000) {
    puzzle = { ...puzzle, selected: null };
    hint = makeHint();
    render();
  }
}, 250);

window.addEventListener("resize", placeFinger);

// ---------- 開始 ----------

loadSave();
const incoming = parseShare(window.location.hash);
if (incoming.kind === "broken") {
  notice = "リンクが読めなかったので、新しい問題にしました。";
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}
if (incoming.kind === "ok") startRound(incoming.shared.seed, incoming.shared);
else startRound(createSeed(), null);

window.addEventListener("hashchange", () => {
  const next = parseShare(window.location.hash);
  if (next.kind === "ok") {
    notice = "";
    startRound(next.shared.seed, next.shared);
  }
});

// ---------- オフライン対応 ----------
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // 絵は問題ごとに違うので、全部を控えておいてもらう
        const base = new URL("./", location.href).href;
        const urls = [
          location.href.split("#")[0],
          ...performance
            .getEntriesByType("resource")
            .map((e) => e.name)
            .filter((u) => u.startsWith(location.origin)),
          ...ARTS.map((a) => base + a.slice(2)),
        ];
        reg.active?.postMessage({ type: "precache", urls });
      })
      .catch(() => {
        /* 登録できなくても通常どおり遊べる */
      });
  });
}
