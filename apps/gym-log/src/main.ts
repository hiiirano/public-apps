import "./style.css";
import type { Exercise, Metric, Part, SetEntry, State, Step, Workout, WorkoutItem } from "./types";
import { LIMITS, PARTS, STEPS } from "./types";
import {
  bestFor,
  clampValue,
  compareSet,
  dateStr,
  daysSinceLast,
  fmtDiff,
  fmtNum,
  fmtSet,
  isDone,
  lastItemFor,
  lastMenu,
  maxFor,
  mergeBest,
  parseNum,
  progress,
  recommend,
  repStep,
  sortedDesc,
  stepValue,
  streakWeeks,
  suggestNext,
  suggestedExercises,
  summarize,
  toCsv,
  totalSets,
  UNIT,
  usesWeight,
  volumeOf,
  weekMarks,
  type Trend,
} from "./logic";
import { freshState, load, makeBackup, newId, parseBackup, save } from "./storage";
import { demoWorkouts } from "./demo";
import { ART_DEFS, artSvg } from "./art";
import { icon, type IconName } from "./icons";

// ---- 状態 ----
let state: State = load();
let canSave = save(state);
type Tab = "home" | "history" | "exercises" | "settings";
let tab: Tab = "home";
let pickerOpen = false;
let pickerPart: Part | "all" = "all";
let libPart: Part | "all" = "all";
let summaryId: string | null = null;
let detailId: string | null = null;
let editing: string | null = null; // 種目の id か "new"
let openHistory: string | null = null;
let confirmKey: string | null = null;
let pendingImport: State | null = null;
const drafts = new Map<string, SetEntry>();

const PART_LABEL: Record<Part, string> = {
  chest: "胸",
  back: "背中",
  shoulder: "肩",
  arm: "腕",
  core: "お腹",
  leg: "脚",
  cardio: "有酸素",
};
const KIND_LABEL = { machine: "マシン", bodyweight: "自分の体重", cardio: "有酸素マシン" } as const;
const METRIC_LABEL: Record<Metric, string> = { weight: "重さと回数", reps: "回数だけ", seconds: "秒（時間）", minutes: "分（時間）" };
const WD = "日月火水木金土";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const today = () => dateStr(new Date());
const exById = (id: string) => state.exercises.find((e) => e.id === id);
const active = () => state.workouts.find((w) => w.endedAt === null);
const doneWorkouts = () => state.workouts.filter(isDone);

function fmtDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${m}/${d}（${WD[new Date(y, m - 1, d).getDay()]}）`;
}
function fmtMinutes(min: number): string {
  return min < 60 ? `${min}分` : `${Math.floor(min / 60)}時間${min % 60}分`;
}

function commit(): void {
  canSave = save(state);
  render();
}

// ---- 骨組み ----
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  ${ART_DEFS}
  <a class="skip" href="#view">本文へ移動</a>
  <header class="top">
    <p class="brand"><span class="brand-en">GYM LOG</span><span class="brand-ja">筋トレ記録</span></p>
    <nav class="tabbar" aria-label="画面の切り替え">
      ${(
        [
          ["home", "記録", "barbell"],
          ["history", "履歴", "history"],
          ["exercises", "種目", "list-details"],
          ["settings", "設定", "settings"],
        ] as [Tab, string, IconName][]
      )
        .map(([k, l, i]) => `<button type="button" class="tab" data-act="tab" data-tab="${k}" data-fk="tab-${k}">${icon(i)}<span>${l}</span></button>`)
        .join("")}
    </nav>
  </header>
  <main id="view" tabindex="-1"></main>
  <footer class="foot">
    <p id="save-note" class="note-warn" hidden>この画面では保存できないため、閉じると記録が消えます。</p>
    <p class="credit">記録はこのスマホ（ブラウザ）の中にだけ残ります。外には送りません。<br /><a href="../">ほかのアプリ</a></p>
  </footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;
const view = document.querySelector<HTMLElement>("#view")!;
const toastEl = document.querySelector<HTMLElement>("#toast")!;

// ---- 画面の色 ----
function applyTheme(): void {
  const t = state.settings.theme;
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

// ---- お知らせ（元に戻す付き）----
let toastTimer = 0;
let undoFn: (() => void) | null = null;
function toast(msg: string, opts: { undo?: () => void; kind?: "record" | "up" | "plain" } = {}): void {
  undoFn = opts.undo ?? null;
  const ic = opts.kind === "record" ? icon("trophy") : opts.kind === "up" ? icon("trending-up") : icon("check");
  toastEl.className = `toast show ${opts.kind ?? "plain"}`;
  toastEl.innerHTML = `${ic}<span>${esc(msg)}</span>${undoFn ? `<button type="button" class="toast-undo" data-act="undo">${icon("arrow-back-up")}元に戻す</button>` : ""}`;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastEl.className = "toast";
    toastEl.innerHTML = "";
    undoFn = null;
  }, undoFn ? 8000 : 3500);
}

// ---- 画面スリープ防止（記録中だけ）----
let wakeLock: { release(): Promise<void> } | null = null;
async function syncWakeLock(): Promise<void> {
  const want = state.settings.wakeLock && !!active() && document.visibilityState === "visible";
  try {
    if (want && !wakeLock && "wakeLock" in navigator) {
      const wl = await (navigator as any).wakeLock.request("screen");
      wakeLock = wl;
      wl.addEventListener?.("release", () => (wakeLock = null));
    } else if (!want && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    wakeLock = null;
  }
}
document.addEventListener("visibilitychange", () => void syncWakeLock());

// ---- 描画 ----
function render(): void {
  const fk = (document.activeElement as HTMLElement | null)?.dataset?.fk;
  applyTheme();
  for (const b of document.querySelectorAll<HTMLButtonElement>(".tab")) {
    if (b.dataset.tab === tab) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  }
  document.querySelector<HTMLElement>("#save-note")!.hidden = canSave;
  document.body.dataset.tab = tab;
  view.innerHTML =
    tab === "home" ? homeView() : tab === "history" ? historyView() : tab === "exercises" ? exercisesView() : settingsView();
  if (fk) document.querySelector<HTMLElement>(`[data-fk="${CSS.escape(fk)}"]`)?.focus({ preventScroll: true });
  tick();
  void syncWakeLock();
}

// ---- 記録の画面 ----
function weekCard(): string {
  const t = today();
  const marks = weekMarks(state.workouts, t);
  const streak = streakWeeks(state.workouts, t);
  const since = daysSinceLast(state.workouts, t);
  const count = marks.filter(Boolean).length;
  const mon = new Date();
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const weekVol = doneWorkouts()
    .filter((w) => w.date >= dateStr(mon) && w.date <= t)
    .reduce((n, w) => n + volumeOf(w), 0);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const msg =
    since === null
      ? "最初の1回を記録しましょう。"
      : since === 0
        ? "今日もやりました。いい調子です。"
        : count > 0
          ? `前回から${since}日。このペースで続けましょう。`
          : `前回から${since}日。今週も1回やりましょう。`;
  return `
    <section class="hero" aria-labelledby="h-week">
      <h2 id="h-week" class="eyebrow">今週</h2>
      <div class="hero-stats">
        <p class="stat"><span class="num">${count}</span><span class="unit">回</span><span class="lbl">今週やった日</span></p>
        <p class="stat"><span class="num">${streak}</span><span class="unit">週</span><span class="lbl">続けている</span></p>
        <p class="stat"><span class="num">${fmtNum(Math.round(weekVol))}</span><span class="unit">kg</span><span class="lbl">今週の総重量</span></p>
      </div>
      <ol class="week" aria-label="今週やった日">
        ${["月", "火", "水", "木", "金", "土", "日"]
          .map(
            (d, i) =>
              `<li class="${marks[i] ? "on" : ""} ${i === todayIdx ? "today" : ""}"><span class="dot">${marks[i] ? icon("check") : ""}</span><span class="wd">${d}</span><span class="sr-only">${marks[i] ? "やった" : "なし"}</span></li>`,
          )
          .join("")}
      </ol>
      <p class="hero-msg">${msg}</p>
    </section>`;
}

function homeView(): string {
  const w = active();
  if (w) return workoutView(w);
  const sum = summaryId ? state.workouts.find((x) => x.id === summaryId && x.endedAt !== null) : undefined;
  if (sum) return summaryView(sum);
  summaryId = null;

  const t = today();
  const rec = recommend(state.workouts, state.exercises, t);
  const side = rec.kind === "rest" ? (recommend(state.workouts.filter((x) => x.date !== t), state.exercises, t).kind as "upper" | "lower" | "rest") : rec.kind;
  const sugg = suggestedExercises(state.workouts, state.exercises, side === "lower" ? "lower" : "upper");
  const menu = lastMenu(state.workouts).filter((id) => exById(id) && !exById(id)!.hidden);
  const title = rec.kind === "rest" ? "休む日" : rec.kind === "upper" ? "上半身の日" : "下半身の日";
  const recent = sortedDesc(doneWorkouts()).slice(0, 3);
  return `
    <div class="layout">
      <div class="col-main">
        <section class="card rec" aria-labelledby="h-rec">
          <p class="eyebrow">今日のおすすめ</p>
          <h2 id="h-rec" class="rec-title">${title}</h2>
          <p class="rec-reason">${esc(rec.reason)}</p>
          <ul class="mini-tiles">
            ${sugg
              .map((id) => exById(id))
              .filter((e): e is Exercise => !!e)
              .map((e) => `<li>${artSvg(e.art, e.part)}<span>${esc(e.name)}</span></li>`)
              .join("")}
          </ul>
          <div class="start-btns">
            <button type="button" class="btn-primary btn-xl" data-act="start" data-with="${esc(sugg.join(","))}" data-fk="start-rec">${icon("player-play")}<span>${rec.kind === "rest" ? "それでもやる" : "おすすめで始める"}</span></button>
            ${menu.length > 0 ? `<button type="button" class="btn-secondary" data-act="start" data-with="${esc(menu.join(","))}" data-fk="start-last">${icon("arrow-back-up")}<span>前回と同じ種目で始める</span></button>` : ""}
            <button type="button" class="btn-ghost" data-act="start" data-with="" data-fk="start-empty">${icon("plus")}<span>種目を選んで始める</span></button>
          </div>
        </section>
        ${
          state.workouts.length === 0
            ? `<section class="card try"><p>どんな画面か見たいときは、見本の記録を入れて試せます（あとで消せます）。</p>
                <button type="button" class="btn-ghost" data-act="demo" data-fk="demo-home">${icon("sparkles")}<span>見本の記録で試す</span></button></section>`
            : ""
        }
      </div>
      <aside class="col-side">
        ${weekCard()}
        ${
          recent.length
            ? `<section class="card recent" aria-labelledby="h-recent"><h2 id="h-recent" class="sec-title">最近の記録</h2><ul class="recent-list">${recent
                .map(
                  (r) =>
                    `<li><span class="r-date">${fmtDate(r.date)}</span><span class="r-items">${r.items
                      .map((it) => esc(exById(it.exId)?.name ?? "?"))
                      .join("・")}</span><span class="r-num">${totalSets(r)}セット</span></li>`,
                )
                .join("")}</ul></section>`
            : ""
        }
      </aside>
    </div>`;
}

function trendBadge(t: Trend): string {
  if (t === "record") return `<span class="badge b-record">${icon("trophy")}自己ベスト</span>`;
  if (t === "up") return `<span class="badge b-up">${icon("trending-up")}前回より上</span>`;
  if (t === "same") return `<span class="badge b-same">前回と同じ</span>`;
  return "";
}

function draftFor(w: Workout, it: WorkoutItem, ex: Exercise): SetEntry {
  let d = drafts.get(ex.id);
  if (!d) {
    d = suggestNext(it.sets, lastItemFor(state.workouts, ex.id, w.id)?.sets ?? null, ex.metric);
    drafts.set(ex.id, d);
  }
  return d;
}

function hintText(w: Workout, it: WorkoutItem, ex: Exercise): string {
  const prev = lastItemFor(state.workouts, ex.id, w.id)?.sets ?? null;
  const best = it.sets.reduce((b, s) => mergeBest(b, s), bestFor(state.workouts, ex.id, w.id));
  const d = draftFor(w, it, ex);
  const n = it.sets.length;
  const p = prev?.[n] ?? null;
  const t = compareSet(d, n, prev, bestFor(state.workouts, ex.id, w.id) ? best : null, ex.metric);
  const target = p ? `前回の${n + 1}セット目 ${fmtSet(p, ex.metric)}` : prev ? `前回は${prev.length}セット` : "はじめての種目です";
  const now =
    t === "record" ? "この数で自己ベスト！" : t === "up" ? "この数なら前回より上" : t === "same" ? "前回と同じ" : "";
  return `${esc(target)}${now ? `<b class="hint-now t-${t}">${now}</b>` : ""}`;
}

function stepper(exId: string, field: "w" | "r", value: number, metric: Metric, step: number, label: string, unit: string): string {
  const inputMode = field === "w" ? "decimal" : "numeric";
  const stepTxt = field === "w" ? `${fmtNum(step)}kg` : `${step}${unit}`;
  return `
    <div class="stepper">
      <button type="button" class="step-btn" data-act="step" data-ex="${esc(exId)}" data-f="${field}" data-d="-1" data-fk="dec-${field}-${esc(exId)}" aria-label="${label}を${stepTxt}へらす">${icon("minus")}</button>
      <label class="num-field">
        <span class="num-label">${label}</span>
        <input class="num-input" type="text" inputmode="${inputMode}" autocomplete="off" enterkeyhint="done"
          data-ex="${esc(exId)}" data-f="${field}" data-metric="${metric}" data-fk="in-${field}-${esc(exId)}" value="${fmtNum(value).replace(/,/g, "")}" />
        <span class="num-unit">${unit}</span>
      </label>
      <button type="button" class="step-btn" data-act="step" data-ex="${esc(exId)}" data-f="${field}" data-d="1" data-fk="inc-${field}-${esc(exId)}" aria-label="${label}を${stepTxt}ふやす">${icon("plus")}</button>
    </div>`;
}

function exerciseCard(w: Workout, it: WorkoutItem): string {
  const ex = exById(it.exId);
  if (!ex) return "";
  const last = lastItemFor(state.workouts, ex.id, w.id);
  const prev = last?.sets ?? null;
  let best = bestFor(state.workouts, ex.id, w.id);
  const hadBest = best !== null;
  const rows = it.sets
    .map((s, i) => {
      const t = compareSet(s, i, prev, hadBest ? best : null, ex.metric);
      best = mergeBest(best, s);
      const val = usesWeight(ex.metric)
        ? `<b>${fmtNum(s.w ?? 0)}</b><small>kg</small><span class="x">×</span><b>${s.r}</b><small>回</small>`
        : `<b>${s.r}</b><small>${UNIT[ex.metric]}</small>`;
      return `<li class="set-row"><span class="set-no">${i + 1}</span><span class="set-val">${val}</span>${trendBadge(t)}
        <button type="button" class="icon-btn" data-act="del-set" data-ex="${esc(ex.id)}" data-i="${i}" data-fk="del-${esc(ex.id)}-${i}" aria-label="${esc(ex.name)}の${i + 1}セット目を消す">${icon("x")}</button></li>`;
    })
    .join("");
  const d = draftFor(w, it, ex);
  const n = it.sets.length + 1;
  const full = it.sets.length >= LIMITS.sets;
  return `
    <article class="card ex-card" id="card-${esc(ex.id)}" aria-labelledby="h-${esc(ex.id)}">
      <div class="ex-head">
        <div class="art-tile">${artSvg(ex.art, ex.part)}</div>
        <div class="ex-meta">
          <h3 id="h-${esc(ex.id)}">${esc(ex.name)}</h3>
          <p class="tags">${PART_LABEL[ex.part]}・${KIND_LABEL[ex.kind]}</p>
          <p class="prev">${last ? `<span class="prev-lbl">前回 ${fmtDate(last.workout.date)}</span> ${esc(prev!.map((s) => fmtSet(s, ex.metric)).join(" / "))}` : `<span class="prev-lbl">はじめての種目</span>`}</p>
        </div>
        <button type="button" class="icon-btn" data-act="remove-item" data-ex="${esc(ex.id)}" data-fk="rm-${esc(ex.id)}" aria-label="${esc(ex.name)}を今日の記録から外す">${icon("trash")}</button>
      </div>
      ${rows ? `<ol class="sets">${rows}</ol>` : ""}
      ${
        full
          ? `<p class="hint">1つの種目は${LIMITS.sets}セットまでです。</p>`
          : `<div class="entry">
        <p class="entry-title"><span class="entry-no">${n}</span>セット目</p>
        ${usesWeight(ex.metric) ? stepper(ex.id, "w", d.w ?? 0, ex.metric, ex.step, "重さ", "kg") : ""}
        ${stepper(ex.id, "r", d.r, ex.metric, repStep(ex.metric), ex.metric === "seconds" ? "時間" : ex.metric === "minutes" ? "時間" : "回数", UNIT[ex.metric])}
        <p class="entry-hint" id="hint-${esc(ex.id)}" aria-live="polite">${hintText(w, it, ex)}</p>
        <button type="button" class="btn-primary btn-record" data-act="record" data-ex="${esc(ex.id)}" data-fk="rec-${esc(ex.id)}">${icon("check")}<span>${n}セット目を記録</span></button>
      </div>`
      }
    </article>`;
}

function pickerView(w: Workout): string {
  const added = new Set(w.items.map((i) => i.exId));
  const list = state.exercises.filter((e) => !e.hidden && (pickerPart === "all" || e.part === pickerPart));
  return `
    <section class="card picker" id="picker" aria-labelledby="h-picker">
      <div class="picker-head">
        <h2 id="h-picker" class="sec-title">種目を選ぶ</h2>
        <button type="button" class="icon-btn" data-act="close-picker" data-fk="close-picker" aria-label="種目選びを閉じる">${icon("x")}</button>
      </div>
      ${partChips("picker-part", pickerPart)}
      <ul class="tiles">
        ${list
          .map(
            (e) => `<li><button type="button" class="tile ${added.has(e.id) ? "is-added" : ""}" data-act="pick" data-ex="${esc(e.id)}" data-fk="pick-${esc(e.id)}" ${added.has(e.id) ? 'aria-describedby="added-note"' : ""}>
              <span class="art-tile">${artSvg(e.art, e.part)}</span>
              <span class="tile-name">${esc(e.name)}</span>
              <span class="tile-tag">${added.has(e.id) ? `${icon("check")}追加ずみ` : `${PART_LABEL[e.part]}・${KIND_LABEL[e.kind]}`}</span>
            </button></li>`,
          )
          .join("")}
      </ul>
      <p class="hint" id="added-note">追加ずみの種目を押すと、その種目へ移動します。ない種目は「種目」の画面で作れます。</p>
    </section>`;
}

function partChips(act: string, cur: Part | "all"): string {
  const all: (Part | "all")[] = ["all", ...PARTS];
  return `<div class="chips" role="group" aria-label="部位でしぼる">${all
    .map(
      (p) =>
        `<button type="button" class="chip" data-act="${act}" data-part="${p}" data-fk="${act}-${p}" aria-pressed="${cur === p}">${p === "all" ? "すべて" : PART_LABEL[p]}</button>`,
    )
    .join("")}</div>`;
}

function workoutView(w: Workout): string {
  const sets = totalSets(w);
  return `
    <div class="layout">
      <div class="col-main">
        <section class="session" aria-label="記録中">
          <p class="session-live"><span class="pulse" aria-hidden="true"></span>記録中</p>
          <p class="session-stat"><span class="num" id="elapsed">0</span><span class="lbl">分</span></p>
          <p class="session-stat sets-stat"><span class="num">${sets}</span><span class="lbl">セット</span></p>
          <p class="session-rest" id="rest" aria-hidden="true" hidden>${icon("clock")}<span id="rest-t"></span></p>
          <button type="button" class="btn-finish" data-act="finish" data-fk="finish">${icon("flag")}<span>終わる</span></button>
        </section>
        ${w.items.length === 0 ? `<p class="empty-note">下の「種目を追加」から、今日やる種目を選びましょう。</p>` : ""}
        ${w.items.map((it) => exerciseCard(w, it)).join("")}
        ${
          w.items.length < LIMITS.items
            ? `<button type="button" class="btn-add" data-act="toggle-picker" data-fk="toggle-picker" aria-expanded="${pickerOpen}" aria-controls="picker">${icon("plus")}<span>種目を追加</span></button>`
            : ""
        }
        ${pickerOpen ? pickerView(w) : ""}
      </div>
      <aside class="col-side">${weekCard()}</aside>
    </div>`;
}

function summaryView(w: Workout): string {
  const s = summarize(w, state.workouts, state.exercises);
  return `
    <div class="layout">
      <div class="col-main">
        <section class="hero done" aria-labelledby="h-done">
          <p class="eyebrow">${fmtDate(w.date)}</p>
          <h2 id="h-done" class="done-title">おつかれさまでした</h2>
          <div class="hero-stats">
            <p class="stat"><span class="num">${s.minutes}</span><span class="unit">分</span><span class="lbl">時間</span></p>
            <p class="stat"><span class="num">${s.sets}</span><span class="unit">セット</span><span class="lbl">合計</span></p>
            <p class="stat"><span class="num">${fmtNum(Math.round(s.volume))}</span><span class="unit">kg</span><span class="lbl">総重量</span></p>
          </div>
          ${
            s.records + s.improved > 0
              ? `<p class="done-msg">${icon("flame")}${s.records > 0 ? `自己ベスト ${s.records}回` : ""}${s.records > 0 && s.improved > 0 ? "・" : ""}${s.improved > 0 ? `前回より伸びた種目 ${s.improved}つ` : ""}</p>`
              : `<p class="done-msg">${icon("check")}記録しました。次は少しだけ重く・多くしてみましょう。</p>`
          }
        </section>
        <section class="card" aria-labelledby="h-done-items">
          <h2 id="h-done-items" class="sec-title">種目ごとの結果</h2>
          <ul class="done-list">
            ${s.items
              .map((i) => {
                const ex = exById(i.exId);
                if (!ex) return "";
                const diff =
                  i.diff === null
                    ? `<span class="badge b-same">はじめて</span>`
                    : i.diff > 0
                      ? `<span class="badge b-up">${icon("trending-up")}前回より ${fmtDiff(i.diff, ex.metric)}</span>`
                      : ""; // 減った数は出さない（続ける気持ちを下げないため）
                return `<li><span class="art-tile sm">${artSvg(ex.art, ex.part)}</span><span class="done-name">${esc(ex.name)}<small>${i.sets}セット</small></span>${i.records ? `<span class="badge b-record">${icon("trophy")}自己ベスト</span>` : ""}${diff}</li>`;
              })
              .join("")}
          </ul>
          <div class="row-btns">
            <button type="button" class="btn-primary" data-act="close-summary" data-fk="close-summary">${icon("check")}<span>閉じる</span></button>
            <button type="button" class="btn-ghost" data-act="resume" data-id="${esc(w.id)}" data-fk="resume">${icon("player-play")}<span>続きを記録する</span></button>
          </div>
        </section>
      </div>
      <aside class="col-side">${weekCard()}</aside>
    </div>`;
}

// ---- 履歴 ----
function historyView(): string {
  const list = sortedDesc(doneWorkouts());
  if (list.length === 0)
    return `<section class="card empty"><h2 class="sec-title">履歴</h2><p>まだ記録がありません。「記録」の画面から始めましょう。</p></section>`;
  return `
    <h2 class="page-title">履歴 <small>${list.length}回</small></h2>
    <ul class="history">
      ${list
        .map((w) => {
          const open = openHistory === w.id;
          const vol = volumeOf(w);
          const min = Math.round(((w.endedAt ?? w.startedAt) - w.startedAt) / 60000);
          const [, m, d] = w.date.split("-").map(Number);
          return `<li class="card h-card">
            <button type="button" class="h-head" data-act="toggle-history" data-id="${esc(w.id)}" data-fk="h-${esc(w.id)}" aria-expanded="${open}">
              <span class="h-date"><b>${m}/${d}</b><small>${WD[new Date(w.date + "T00:00").getDay()]}曜</small></span>
              <span class="h-body">
                <span class="h-arts">${w.items
                  .slice(0, 5)
                  .map((it) => {
                    const ex = exById(it.exId);
                    return ex ? `<span class="art-tile xs">${artSvg(ex.art, ex.part)}</span>` : "";
                  })
                  .join("")}</span>
                <span class="h-stats">${fmtMinutes(min)}・${totalSets(w)}セット${vol > 0 ? `・${fmtNum(Math.round(vol))}kg` : ""}</span>
              </span>
              ${icon("chevron-down", "icon chev")}
            </button>
            ${
              open
                ? `<div class="h-detail">
                <ul class="h-items">${w.items
                  .map((it) => {
                    const ex = exById(it.exId);
                    return `<li><b>${esc(ex?.name ?? "?")}</b><span>${esc(it.sets.map((s) => fmtSet(s, ex?.metric ?? "weight")).join(" / "))}</span></li>`;
                  })
                  .join("")}</ul>
                <button type="button" class="btn-ghost danger" data-act="del-workout" data-id="${esc(w.id)}" data-fk="delw-${esc(w.id)}">${icon("trash")}<span>この日の記録を消す</span></button>
              </div>`
                : ""
            }
          </li>`;
        })
        .join("")}
    </ul>`;
}

// ---- 種目 ----
function chart(points: { date: string; value: number }[], unit: string): string {
  if (points.length < 2) return `<p class="hint">2回以上記録すると、伸びがグラフで見られます。</p>`;
  const W = 320,
    H = 140,
    pad = 24;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals),
    max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (points.length - 1);
  const y = (v: number) => H - pad - ((v - min) * (H - pad * 2)) / span;
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const first = points[0],
    lastP = points[points.length - 1];
  const label = `${fmtDate(first.date)}の${fmtNum(first.value)}${unit}から、${fmtDate(lastP.date)}の${fmtNum(lastP.value)}${unit}へ`;
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
      <line class="c-grid" x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}"/>
      <path class="c-line" d="${d}"/>
      ${points.map((p, i) => `<circle class="c-dot" cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="4"/>`).join("")}
      <text class="c-txt" x="${pad}" y="14">${fmtNum(max)}${unit}</text>
      <text class="c-txt" x="${pad}" y="${H - 6}">${fmtDate(first.date)}</text>
      <text class="c-txt" x="${W - pad}" y="${H - 6}" text-anchor="end">${fmtDate(lastP.date)}</text>
    </svg><figcaption class="sr-only">${esc(label)}</figcaption></figure>`;
}

function exerciseForm(ex: Exercise | null): string {
  const custom = !ex || ex.custom;
  const id = ex ? ex.id : "new";
  const metric = ex?.metric ?? "weight";
  return `
    <form class="ex-form" data-form="${esc(id)}" novalidate>
      <label class="field"><span>名前</span>
        <input name="name" type="text" maxlength="${LIMITS.name}" autocomplete="off" value="${esc(ex?.name ?? "")}" placeholder="例: レッグカール" data-fk="f-name-${esc(id)}" required /></label>
      <p class="field-msg" id="f-msg-${esc(id)}" aria-live="polite"></p>
      ${
        custom
          ? `<label class="field"><span>部位</span><select name="part">${PARTS.map((p) => `<option value="${p}" ${ex?.part === p ? "selected" : ""}>${PART_LABEL[p]}</option>`).join("")}</select></label>
      <label class="field"><span>記録のしかた</span><select name="metric">${(["weight", "reps", "seconds", "minutes"] as Metric[])
        .map((m) => `<option value="${m}" ${metric === m ? "selected" : ""}>${METRIC_LABEL[m]}</option>`)
        .join("")}</select></label>`
          : ""
      }
      ${
        custom || metric === "weight"
          ? `<label class="field"><span>重さの刻み（＋−で変わる量）</span><select name="step">${STEPS.map((s) => `<option value="${s}" ${(ex?.step ?? 2.5) === s ? "selected" : ""}>${s}kg</option>`).join("")}</select></label>`
          : ""
      }
      <div class="row-btns">
        <button type="submit" class="btn-primary" data-fk="f-save-${esc(id)}">${icon("check")}<span>${ex ? "保存する" : "作る"}</span></button>
        <button type="button" class="btn-ghost" data-act="cancel-edit" data-fk="f-cancel-${esc(id)}">やめる</button>
      </div>
    </form>`;
}

function exerciseDetail(ex: Exercise): string {
  const best = bestFor(doneWorkouts(), ex.id);
  const unit = usesWeight(ex.metric) ? "kg" : UNIT[ex.metric];
  const pts = progress(doneWorkouts(), ex.id, ex.metric);
  const recent = sortedDesc(doneWorkouts())
    .map((w) => ({ w, it: w.items.find((i) => i.exId === ex.id && i.sets.length > 0) }))
    .filter((x) => x.it)
    .slice(0, 5);
  const bestTxt = !best
    ? "まだ記録がありません"
    : usesWeight(ex.metric)
      ? `${fmtNum(best.maxW ?? 0)}kg × ${best.repsAtMaxW}回`
      : `${best.maxR}${UNIT[ex.metric]}`;
  return `
    <button type="button" class="btn-back" data-act="close-detail" data-fk="close-detail">${icon("arrow-back-up")}<span>種目の一覧へ</span></button>
    <div class="layout">
      <div class="col-main">
        <section class="card detail" aria-labelledby="h-detail">
          <div class="detail-head">
            <div class="art-tile lg">${artSvg(ex.art, ex.part)}</div>
            <div>
              <h2 id="h-detail" class="detail-name">${esc(ex.name)}</h2>
              <p class="tags">${PART_LABEL[ex.part]}・${KIND_LABEL[ex.kind]}・${METRIC_LABEL[ex.metric]}</p>
              <p class="best">${icon("trophy")}<span>自己ベスト</span><b>${esc(bestTxt)}</b></p>
            </div>
          </div>
          <h3 class="sub-title">伸び（${usesWeight(ex.metric) ? "いちばん重い重さ" : "いちばん多い" + UNIT[ex.metric]}）</h3>
          ${chart(pts, unit)}
        </section>
      </div>
      <aside class="col-side">
        <section class="card" aria-labelledby="h-recent-ex">
          <h3 id="h-recent-ex" class="sub-title">最近の記録</h3>
          ${
            recent.length
              ? `<ul class="h-items">${recent.map((r) => `<li><b>${fmtDate(r.w.date)}</b><span>${esc(r.it!.sets.map((s) => fmtSet(s, ex.metric)).join(" / "))}</span></li>`).join("")}</ul>`
              : `<p class="hint">記録するとここに出ます。</p>`
          }
        </section>
        <section class="card">
          ${
            editing === ex.id
              ? exerciseForm(ex)
              : `<div class="row-btns">
            <button type="button" class="btn-secondary" data-act="edit" data-id="${esc(ex.id)}" data-fk="edit-${esc(ex.id)}">${icon("pencil")}<span>名前などを変える</span></button>
            <button type="button" class="btn-ghost" data-act="hide" data-id="${esc(ex.id)}" data-fk="hide-${esc(ex.id)}">${icon(ex.hidden ? "eye" : "eye-off")}<span>${ex.hidden ? "一覧に戻す" : "使わないので隠す"}</span></button>
          </div>`
          }
        </section>
      </aside>
    </div>`;
}

function exercisesView(): string {
  const ex = detailId ? exById(detailId) : undefined;
  if (ex) return exerciseDetail(ex);
  detailId = null;
  const list = state.exercises.filter((e) => !e.hidden && (libPart === "all" || e.part === libPart));
  const hidden = state.exercises.filter((e) => e.hidden);
  const done = doneWorkouts();
  return `
    <div class="page-head">
      <h2 class="page-title">種目</h2>
      ${state.exercises.length < LIMITS.exercises ? `<button type="button" class="btn-secondary" data-act="new-ex" data-fk="new-ex" aria-expanded="${editing === "new"}">${icon("plus")}<span>種目を作る</span></button>` : ""}
    </div>
    ${editing === "new" ? `<section class="card" aria-label="新しい種目">${exerciseForm(null)}</section>` : ""}
    ${partChips("lib-part", libPart)}
    <ul class="tiles lib">
      ${list
        .map((e) => {
          const b = bestFor(done, e.id);
          const bt = !b ? "記録なし" : usesWeight(e.metric) ? `最高 ${fmtNum(b.maxW ?? 0)}kg` : `最高 ${b.maxR}${UNIT[e.metric]}`;
          return `<li><button type="button" class="tile" data-act="detail" data-id="${esc(e.id)}" data-fk="lib-${esc(e.id)}">
            <span class="art-tile">${artSvg(e.art, e.part)}</span>
            <span class="tile-name">${esc(e.name)}</span>
            <span class="tile-tag">${PART_LABEL[e.part]}・${bt}</span>
          </button></li>`;
        })
        .join("")}
    </ul>
    ${list.length === 0 ? `<p class="hint">この部位の種目はありません。</p>` : ""}
    ${
      hidden.length
        ? `<section class="card hidden-list" aria-labelledby="h-hidden"><h3 id="h-hidden" class="sub-title">隠した種目（${hidden.length}）</h3><ul>${hidden
            .map(
              (e) =>
                `<li><span>${esc(e.name)}</span><button type="button" class="btn-ghost" data-act="hide" data-id="${esc(e.id)}" data-fk="unhide-${esc(e.id)}">${icon("eye")}<span>戻す</span></button></li>`,
            )
            .join("")}</ul></section>`
        : ""
    }`;
}

// ---- 設定 ----
function settingsView(): string {
  const s = state.settings;
  const themes: [State["settings"]["theme"], string, IconName][] = [
    ["auto", "自動", "device-desktop"],
    ["light", "明るい", "sun"],
    ["dark", "暗い", "moon"],
  ];
  return `
    <h2 class="page-title">設定</h2>
    <div class="settings">
      <section class="card" aria-labelledby="h-theme">
        <h3 id="h-theme" class="sub-title">画面の色</h3>
        <div class="seg" role="group" aria-labelledby="h-theme">${themes
          .map(([k, l, i]) => `<button type="button" class="seg-btn" data-act="theme" data-v="${k}" data-fk="theme-${k}" aria-pressed="${s.theme === k}">${icon(i)}<span>${l}</span></button>`)
          .join("")}</div>
      </section>
      <section class="card" aria-labelledby="h-wake">
        <h3 id="h-wake" class="sub-title">記録中の画面</h3>
        <label class="switch"><input type="checkbox" data-act="wake" data-fk="wake" ${s.wakeLock ? "checked" : ""} /><span>記録中は画面を消さない</span></label>
        <p class="hint">対応しているブラウザだけで働きます。音楽の再生はじゃましません。</p>
      </section>
      <section class="card" aria-labelledby="h-backup">
        <h3 id="h-backup" class="sub-title">バックアップ</h3>
        <p class="hint">機種変更のときは、書き出したファイルを新しいスマホで読み込みます。</p>
        ${
          pendingImport
            ? `<div class="confirm" role="alert"><p>${pendingImport.workouts.length}回分の記録を読み込みます。いまの記録は置きかわります。</p>
              <div class="row-btns"><button type="button" class="btn-primary" data-act="import-ok" data-fk="import-ok">${icon("check")}<span>読み込む</span></button>
              <button type="button" class="btn-ghost" data-act="import-cancel" data-fk="import-cancel">やめる</button></div></div>`
            : `<div class="row-btns">
          <button type="button" class="btn-secondary" data-act="export-json" data-fk="export-json">${icon("download")}<span>書き出す</span></button>
          <label class="btn-secondary file-btn">${icon("upload")}<span>読み込む</span><input type="file" class="sr-only" accept=".json,application/json" data-act="import" data-fk="import" /></label>
          <button type="button" class="btn-ghost" data-act="export-csv" data-fk="export-csv">${icon("download")}<span>表計算用（CSV）</span></button>
        </div>`
        }
      </section>
      <section class="card" aria-labelledby="h-data">
        <h3 id="h-data" class="sub-title">記録を消す・試す</h3>
        ${state.workouts.length === 0 ? `<button type="button" class="btn-ghost" data-act="demo" data-fk="demo">${icon("sparkles")}<span>見本の記録を入れる</span></button>` : ""}
        ${
          confirmKey === "wipe"
            ? `<div class="confirm" role="alert"><p>記録と自作の種目をすべて消します。元に戻せません。</p>
              <div class="row-btns"><button type="button" class="btn-danger" data-act="wipe-ok" data-fk="wipe-ok">${icon("trash")}<span>すべて消す</span></button>
              <button type="button" class="btn-ghost" data-act="wipe-cancel" data-fk="wipe-cancel">やめる</button></div></div>`
            : `<button type="button" class="btn-ghost danger" data-act="wipe" data-fk="wipe">${icon("trash")}<span>すべての記録を消す</span></button>`
        }
      </section>
      <section class="card about" aria-labelledby="h-about">
        <h3 id="h-about" class="sub-title">このアプリについて</h3>
        <ul class="about-list">
          <li>登録なし・無料。記録はこの端末の中だけに保存します。</li>
          <li>iPhoneの「ヘルスケア」やGoogle Fitとはつながりません（ウェブのアプリのため）。</li>
          <li>ホーム画面に追加すると、電波がなくても開けます。</li>
        </ul>
      </section>
    </div>`;
}

// ---- 経過時間と休けい ----
let lastSetAt = 0;
function tick(): void {
  const w = active();
  const el = document.querySelector("#elapsed");
  if (!w || !el) return;
  el.textContent = String(Math.max(0, Math.floor((Date.now() - w.startedAt) / 60000)));
  const rest = document.querySelector<HTMLElement>("#rest");
  const rt = document.querySelector("#rest-t");
  if (rest && rt) {
    rest.hidden = !lastSetAt;
    if (lastSetAt) {
      const sec = Math.floor((Date.now() - lastSetAt) / 1000);
      rt.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
    }
  }
}
setInterval(tick, 1000);

// ---- 操作 ----
function startWorkout(ids: string[]): void {
  if (state.workouts.length >= LIMITS.workouts) {
    toast(`記録は${fmtNum(LIMITS.workouts)}回までです。設定から書き出して、古い記録を消してください`);
    return;
  }
  const now = new Date();
  const items = ids.filter((id) => exById(id)).slice(0, LIMITS.items).map((exId) => ({ exId, sets: [] }));
  state.workouts.push({ id: newId(), date: dateStr(now), startedAt: now.getTime(), endedAt: null, items });
  drafts.clear();
  lastSetAt = 0;
  summaryId = null;
  pickerOpen = items.length === 0;
  commit();
  view.querySelector<HTMLElement>(items.length ? ".num-input" : ".tile")?.focus();
}

function finishWorkout(): void {
  const w = active();
  if (!w) return;
  w.items = w.items.filter((it) => it.sets.length > 0);
  if (w.items.length === 0) {
    state.workouts = state.workouts.filter((x) => x !== w);
    toast("記録がなかったので、取りやめました");
  } else {
    w.endedAt = Date.now();
    summaryId = w.id;
  }
  pickerOpen = false;
  drafts.clear();
  commit();
  window.scrollTo(0, 0);
  view.focus({ preventScroll: true });
}

function recordSet(exId: string): void {
  const w = active();
  const ex = exById(exId);
  const it = w?.items.find((i) => i.exId === exId);
  if (!w || !ex || !it || it.sets.length >= LIMITS.sets) return;
  readInputs(exId);
  const d = draftFor(w, it, ex);
  if (d.r <= 0) {
    toast(`${ex.metric === "weight" || ex.metric === "reps" ? "回数" : "時間"}を入れてください`);
    return;
  }
  const prev = lastItemFor(state.workouts, ex.id, w.id)?.sets ?? null;
  const hist = bestFor(state.workouts, ex.id, w.id);
  const best = it.sets.reduce((b, s) => mergeBest(b, s), hist);
  const t = compareSet(d, it.sets.length, prev, hist ? best : null, ex.metric);
  it.sets.push({ w: usesWeight(ex.metric) ? (d.w ?? 0) : null, r: d.r });
  lastSetAt = Date.now();
  const label = `${ex.name} ${fmtSet(d, ex.metric)}`;
  if (t === "record") toast(`自己ベスト！ ${label}`, { kind: "record" });
  else if (t === "up") toast(`前回より上！ ${label}`, { kind: "up" });
  else toast(`記録しました ${label}`);
  commit();
}

function readInputs(exId: string): void {
  for (const input of view.querySelectorAll<HTMLInputElement>(`.num-input[data-ex="${CSS.escape(exId)}"]`)) applyInput(input, false);
}

/** 入力欄を読んで下書きに入れる。final なら範囲に収めて表示も直す */
function applyInput(input: HTMLInputElement, final: boolean): void {
  const exId = input.dataset.ex!;
  const f = input.dataset.f as "w" | "r";
  const metric = input.dataset.metric as Metric;
  const d = drafts.get(exId);
  if (!d) return;
  const v = parseNum(input.value);
  const bad = v === null || Number.isNaN(v) || v > maxFor(metric, f);
  input.setAttribute("aria-invalid", String(bad && v !== null));
  if (v !== null && !Number.isNaN(v)) {
    const c = clampValue(v, metric, f);
    if (f === "w") d.w = c;
    else d.r = c;
  }
  if (final) input.value = String(f === "w" ? (d.w ?? 0) : d.r);
  if (final) input.removeAttribute("aria-invalid");
  updateHint(exId);
}

function updateHint(exId: string): void {
  const w = active();
  const ex = exById(exId);
  const it = w?.items.find((i) => i.exId === exId);
  const el = document.getElementById(`hint-${exId}`);
  if (w && ex && it && el) el.innerHTML = hintText(w, it, ex);
}

let undoState: string | null = null;
function snapshot(): void {
  undoState = JSON.stringify(state);
}
function withUndo(msg: string): void {
  const snap = undoState;
  toast(msg, {
    undo: () => {
      if (!snap) return;
      state = JSON.parse(snap);
      drafts.clear();
      commit();
      toast("元に戻しました");
    },
  });
}

function download(name: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener("click", (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
  if (!t || t.tagName === "INPUT") return;
  const act = t.dataset.act!;
  const w = active();
  switch (act) {
    case "tab":
      tab = t.dataset.tab as Tab;
      pickerOpen = false;
      detailId = null;
      editing = null;
      confirmKey = null;
      pendingImport = null;
      render();
      window.scrollTo(0, 0);
      break;
    case "start":
      startWorkout((t.dataset.with ?? "").split(",").filter(Boolean));
      break;
    case "finish":
      finishWorkout();
      break;
    case "toggle-picker":
      pickerOpen = !pickerOpen;
      render();
      if (pickerOpen) document.querySelector("#picker")?.scrollIntoView({ block: "start" });
      break;
    case "close-picker":
      pickerOpen = false;
      render();
      document.querySelector<HTMLElement>('[data-act="toggle-picker"]')?.focus();
      break;
    case "picker-part":
      pickerPart = t.dataset.part as Part | "all";
      render();
      break;
    case "lib-part":
      libPart = t.dataset.part as Part | "all";
      render();
      break;
    case "pick": {
      if (!w) break;
      const id = t.dataset.ex!;
      if (!w.items.some((i) => i.exId === id)) {
        if (w.items.length >= LIMITS.items) break;
        w.items.push({ exId: id, sets: [] });
      }
      pickerOpen = false;
      commit();
      const card = document.getElementById(`card-${id}`);
      card?.scrollIntoView({ block: "start" });
      card?.querySelector<HTMLElement>(".num-input")?.focus({ preventScroll: true });
      break;
    }
    case "step": {
      const ex = exById(t.dataset.ex!);
      const d = ex && drafts.get(ex.id);
      if (!ex || !d) break;
      readInputs(ex.id);
      const f = t.dataset.f as "w" | "r";
      const dir = Number(t.dataset.d) as 1 | -1;
      if (f === "w") d.w = stepValue(d.w ?? 0, ex.step, dir, ex.metric, "w");
      else d.r = stepValue(d.r, repStep(ex.metric), dir, ex.metric, "r");
      const input = view.querySelector<HTMLInputElement>(`.num-input[data-ex="${CSS.escape(ex.id)}"][data-f="${f}"]`);
      if (input) {
        input.value = String(f === "w" ? d.w : d.r);
        input.removeAttribute("aria-invalid");
      }
      updateHint(ex.id);
      break;
    }
    case "record":
      recordSet(t.dataset.ex!);
      break;
    case "del-set": {
      const it = w?.items.find((i) => i.exId === t.dataset.ex);
      if (!it) break;
      snapshot();
      it.sets.splice(Number(t.dataset.i), 1);
      drafts.delete(it.exId);
      commit();
      withUndo("セットを消しました");
      document.querySelector<HTMLElement>(`[data-fk="rec-${CSS.escape(it.exId)}"]`)?.focus();
      break;
    }
    case "remove-item": {
      if (!w) break;
      snapshot();
      w.items = w.items.filter((i) => i.exId !== t.dataset.ex);
      drafts.delete(t.dataset.ex!);
      commit();
      withUndo(`${exById(t.dataset.ex!)?.name ?? "種目"}を外しました`);
      document.querySelector<HTMLElement>('[data-act="toggle-picker"]')?.focus();
      break;
    }
    case "close-summary":
      summaryId = null;
      render();
      break;
    case "resume": {
      if (active()) break;
      const sw = state.workouts.find((x) => x.id === t.dataset.id);
      if (!sw) break;
      sw.endedAt = null;
      summaryId = null;
      drafts.clear();
      commit();
      break;
    }
    case "toggle-history":
      openHistory = openHistory === t.dataset.id ? null : t.dataset.id!;
      render();
      break;
    case "del-workout":
      snapshot();
      state.workouts = state.workouts.filter((x) => x.id !== t.dataset.id);
      openHistory = null;
      commit();
      withUndo("記録を消しました");
      break;
    case "detail":
      detailId = t.dataset.id!;
      editing = null;
      render();
      window.scrollTo(0, 0);
      document.querySelector<HTMLElement>('[data-fk="close-detail"]')?.focus();
      break;
    case "close-detail": {
      const id = detailId;
      detailId = null;
      editing = null;
      render();
      document.querySelector<HTMLElement>(`[data-fk="lib-${CSS.escape(id ?? "")}"]`)?.focus();
      break;
    }
    case "new-ex":
      editing = editing === "new" ? null : "new";
      render();
      document.querySelector<HTMLElement>('[data-fk="f-name-new"]')?.focus();
      break;
    case "edit":
      editing = t.dataset.id!;
      render();
      document.querySelector<HTMLElement>(`[data-fk="f-name-${CSS.escape(editing)}"]`)?.focus();
      break;
    case "cancel-edit":
      editing = null;
      render();
      break;
    case "hide": {
      const ex = exById(t.dataset.id!);
      if (!ex) break;
      ex.hidden = !ex.hidden;
      commit();
      toast(ex.hidden ? `${ex.name}を隠しました` : `${ex.name}を一覧に戻しました`);
      break;
    }
    case "theme":
      state.settings.theme = t.dataset.v as State["settings"]["theme"];
      commit();
      break;
    case "export-json":
      download(`gym-log-${today()}.json`, makeBackup(state, new Date().toISOString()), "application/json");
      toast("書き出しました");
      break;
    case "export-csv":
      download(`gym-log-${today()}.csv`, "﻿" + toCsv(state.workouts, state.exercises), "text/csv");
      toast("書き出しました");
      break;
    case "import-ok":
      if (pendingImport) {
        state = pendingImport;
        pendingImport = null;
        drafts.clear();
        commit();
        toast("読み込みました");
      }
      break;
    case "import-cancel":
      pendingImport = null;
      render();
      break;
    case "demo":
      if (state.workouts.length === 0) {
        state.workouts = demoWorkouts(today(), Date.now());
        commit();
        toast("見本の記録を入れました。設定から消せます");
      }
      break;
    case "wipe":
      confirmKey = "wipe";
      render();
      document.querySelector<HTMLElement>('[data-fk="wipe-cancel"]')?.focus();
      break;
    case "wipe-cancel":
      confirmKey = null;
      render();
      break;
    case "wipe-ok":
      state = { ...freshState(), settings: state.settings };
      confirmKey = null;
      drafts.clear();
      summaryId = null;
      commit();
      toast("すべて消しました");
      break;
    case "undo":
      undoFn?.();
      break;
  }
});

view.addEventListener("input", (e) => {
  const t = e.target as HTMLInputElement;
  if (t.classList.contains("num-input")) applyInput(t, false);
});
view.addEventListener("change", async (e) => {
  const t = e.target as HTMLInputElement;
  if (t.classList.contains("num-input")) applyInput(t, true);
  else if (t.dataset.act === "wake") {
    state.settings.wakeLock = t.checked;
    commit();
  } else if (t.dataset.act === "import") {
    const file = t.files?.[0];
    if (!file) return;
    const parsed = file.size > 5_000_000 ? null : parseBackup(await file.text());
    if (!parsed) {
      toast("読み込めませんでした。このアプリで書き出したファイルを選んでください");
      return;
    }
    pendingImport = parsed;
    render();
    document.querySelector<HTMLElement>('[data-fk="import-ok"]')?.focus();
  }
});
view.addEventListener("keydown", (e) => {
  const t = e.target as HTMLInputElement;
  if (e.key === "Enter" && t.classList.contains("num-input")) {
    e.preventDefault();
    applyInput(t, true);
    t.blur();
  }
});
view.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target as HTMLFormElement;
  const id = f.dataset.form!;
  const fd = new FormData(f);
  const name = String(fd.get("name") ?? "").trim().slice(0, LIMITS.name);
  const msg = f.querySelector<HTMLElement>(".field-msg")!;
  const nameInput = f.querySelector<HTMLInputElement>('[name="name"]')!;
  const dup = state.exercises.some((x) => x.name === name && x.id !== id);
  if (!name || dup) {
    msg.textContent = !name ? "名前を入れてください。" : "同じ名前の種目があります。";
    nameInput.setAttribute("aria-invalid", "true");
    nameInput.setAttribute("aria-describedby", msg.id);
    nameInput.focus();
    return;
  }
  const step = Number(fd.get("step") ?? 2.5) as Step;
  if (id === "new") {
    const part = fd.get("part") as Part;
    const metric = fd.get("metric") as Metric;
    const nid = newId("x");
    state.exercises.push({
      id: nid,
      name,
      part,
      metric,
      kind: metric === "weight" ? "machine" : part === "cardio" || metric === "minutes" ? "cardio" : "bodyweight",
      step: STEPS.includes(step) ? step : 2.5,
      art: `part-${part}`,
      hidden: false,
      custom: true,
    });
    editing = null;
    commit();
    toast(`${name}を作りました`);
  } else {
    const ex = exById(id);
    if (!ex) return;
    ex.name = name;
    if (STEPS.includes(step)) ex.step = step;
    if (ex.custom) {
      ex.part = fd.get("part") as Part;
      ex.metric = fd.get("metric") as Metric;
      ex.kind = ex.metric === "weight" ? "machine" : ex.part === "cardio" || ex.metric === "minutes" ? "cardio" : "bodyweight";
      ex.art = `part-${ex.part}`;
    }
    editing = null;
    drafts.delete(id);
    commit();
    toast("保存しました");
    document.querySelector<HTMLElement>(`[data-fk="edit-${CSS.escape(id)}"]`)?.focus();
  }
});

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
      .catch(() => {});
  });
}

render();
