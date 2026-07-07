import "./style.css";
import type {
  Exercise,
  ExerciseKind,
  Metric,
  MuscleGroup,
  SetEntry,
  Settings,
  Workout,
} from "./types";
import {
  dateStr,
  lastSetsFor,
  recommend,
  thisWeek,
  toCsv,
  totalSets,
  volumeOf,
} from "./logic";
import {
  loadExercises,
  loadSettings,
  loadWorkouts,
  makeBackup,
  newId,
  parseBackup,
  saveExercises,
  saveSettings,
  saveWorkouts,
} from "./storage";

// ---- state ----
let exercises: Exercise[] = loadExercises();
let workouts: Workout[] = loadWorkouts();
let settings: Settings = loadSettings();
type Tab = "today" | "history" | "exercises" | "settings";
let tab: Tab = "today";
let pickerOpen = false;
let addFormOpen = false;
let editingExerciseId: string | null = null;
let expandedHistoryId: string | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;

const GROUP_LABEL: Record<MuscleGroup, string> = {
  upper: "上半身",
  lower: "下半身",
  core: "体幹・腹筋",
};
const KIND_LABEL: Record<ExerciseKind, string> = {
  bodyweight: "自重",
  machine: "マシン",
};
const REC_LABEL = { upper: "上半身の日", lower: "下半身の日", rest: "休養日" };
const REC_ICON = { upper: "💪", lower: "🦵", rest: "😴" };

function exById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}
function activeWorkout(): Workout | undefined {
  return workouts.find((w) => w.endedAt === null);
}
function persist(): void {
  saveWorkouts(workouts);
  saveExercises(exercises);
  saveSettings(settings);
}

// ---- Wake Lock（記録中の画面スリープ防止。音声は扱わないのでYouTube等と共存） ----
let wakeLock: { release(): Promise<void> } | null = null;
async function syncWakeLock(): Promise<void> {
  const want = settings.wakeLock && !!activeWorkout() && document.visibilityState === "visible";
  try {
    if (want && !wakeLock && "wakeLock" in navigator) {
      wakeLock = await (navigator as any).wakeLock.request("screen");
      (wakeLock as any).addEventListener?.("release", () => { wakeLock = null; });
    } else if (!want && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    wakeLock = null; // 省電力モード等で拒否されても動作継続
  }
}
document.addEventListener("visibilitychange", () => void syncWakeLock());

// ---- helpers ----
function el(html: string): HTMLElement {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}
function fmtSet(s: SetEntry, metric: Metric): string {
  const unit = metric === "seconds" ? "秒" : "回";
  return s.weight != null ? `${s.weight}kg×${s.reps}` : `${s.reps}${unit}`;
}
function fmtDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min}分`;
  return `${Math.floor(min / 60)}時間${min % 60}分`;
}
function fmtDateJa(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const wd = "日月火水木金土"[new Date(y, m - 1, d).getDay()];
  return `${m}/${d}(${wd})`;
}
function download(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- actions ----
function startWorkout(): void {
  const now = new Date();
  workouts.push({
    id: newId(),
    date: dateStr(now),
    startedAt: now.getTime(),
    endedAt: null,
    exercises: [],
  });
  persist();
  render();
}

function finishWorkout(): void {
  const w = activeWorkout();
  if (!w) return;
  w.exercises = w.exercises.filter((we) => we.sets.length > 0);
  if (w.exercises.length === 0) {
    if (!confirm("セットが1つも記録されていません。このワークアウトを破棄しますか？")) return;
    workouts = workouts.filter((x) => x.id !== w.id);
  } else {
    w.endedAt = Date.now();
  }
  persist();
  render();
}

function addExerciseToWorkout(exerciseId: string): void {
  const w = activeWorkout();
  if (!w) return;
  if (!w.exercises.some((we) => we.exerciseId === exerciseId)) {
    w.exercises.push({ exerciseId, sets: [] });
  }
  pickerOpen = false;
  persist();
  render();
}

function addSet(exerciseId: string): void {
  const w = activeWorkout();
  if (!w) return;
  const we = w.exercises.find((x) => x.exerciseId === exerciseId);
  if (!we) return;
  // 前セット → 前回ワークアウトの同番セット → 前回1セット目 の順でプレフィル
  const prev = lastSetsFor(workouts, exerciseId, w.id);
  const seed =
    we.sets[we.sets.length - 1] ??
    prev?.[we.sets.length] ??
    prev?.[0] ??
    { weight: null, reps: 10 };
  we.sets.push({ weight: seed.weight, reps: seed.reps });
  persist();
  render();
}

// ---- views ----
function render(): void {
  app.innerHTML = "";
  app.append(el(`
    <header>
      <h1>🏋️ 筋トレ記録 <span class="brand">gym-log</span></h1>
      <p class="sub">データはこの端末のブラウザだけに保存。登録不要・無料。</p>
    </header>
  `));

  const main = el(`<main></main>`);
  if (tab === "today") renderToday(main);
  if (tab === "history") renderHistory(main);
  if (tab === "exercises") renderExercises(main);
  if (tab === "settings") renderSettings(main);
  app.append(main);

  const tabs: Array<[Tab, string]> = [
    ["today", "🏠 今日"],
    ["history", "📅 履歴"],
    ["exercises", "📋 種目"],
    ["settings", "⚙️ 設定"],
  ];
  const nav = el(`<nav class="tabbar"></nav>`);
  for (const [key, label] of tabs) {
    const b = el(`<button class="tab ${tab === key ? "active" : ""}">${label}</button>`);
    b.addEventListener("click", () => { tab = key; pickerOpen = false; render(); });
    nav.append(b);
  }
  app.append(nav);
  void syncWakeLock();
}

// ---- 今日タブ ----
function renderToday(main: HTMLElement): void {
  const today = dateStr(new Date());
  const w = activeWorkout();

  if (!w) {
    const rec = recommend(workouts, exercises, today);
    main.append(el(`
      <section class="card rec rec-${rec.kind}">
        <div class="rec-title">${REC_ICON[rec.kind]} 今日のおすすめ: <b>${REC_LABEL[rec.kind]}</b></div>
        <div class="rec-reason">${rec.reason}</div>
      </section>
    `));
    const start = el(`<button class="primary big">▶ トレーニング開始</button>`);
    start.addEventListener("click", startWorkout);
    main.append(start);
  } else {
    renderActiveWorkout(main, w);
  }

  // 今週サマリー
  const week = thisWeek(workouts.filter((x) => x.endedAt !== null), today);
  const vol = week.reduce((n, x) => n + volumeOf(x), 0);
  const sets = week.reduce((n, x) => n + totalSets(x), 0);
  main.append(el(`
    <section class="card stats">
      <div class="stat"><div class="num">${week.length}</div><div class="lbl">今週の回数</div></div>
      <div class="stat"><div class="num">${sets}</div><div class="lbl">セット数</div></div>
      <div class="stat"><div class="num">${Math.round(vol).toLocaleString()}</div><div class="lbl">ボリューム(kg)</div></div>
    </section>
  `));
}

function renderActiveWorkout(main: HTMLElement, w: Workout): void {
  const head = el(`
    <section class="card active-head">
      <div>🔴 記録中 <span class="elapsed" id="elapsed"></span></div>
    </section>
  `);
  const finish = el(`<button class="finish">終了</button>`);
  finish.addEventListener("click", finishWorkout);
  head.append(finish);
  main.append(head);

  const elapsedEl = head.querySelector<HTMLSpanElement>("#elapsed")!;
  const tick = () => {
    elapsedEl.textContent = fmtDuration(Date.now() - w.startedAt);
    if (!document.body.contains(elapsedEl)) clearInterval(timer);
  };
  const timer = setInterval(tick, 15000);
  tick();

  for (const we of w.exercises) {
    const ex = exById(we.exerciseId);
    if (!ex) continue;
    const metric = ex.metric;
    const prev = lastSetsFor(workouts, ex.id, w.id);
    const card = el(`
      <section class="card exercise">
        <div class="ex-head">
          <div>
            <b>${ex.name}</b> <span class="badge">${KIND_LABEL[ex.kind]}</span>
            <div class="prev">${prev ? "前回: " + prev.map((s) => fmtSet(s, metric)).join(", ") : "初めての種目"}</div>
          </div>
        </div>
        <div class="sets"></div>
      </section>
    `);
    const removeEx = el(`<button class="ghost small">削除</button>`);
    removeEx.addEventListener("click", () => {
      w.exercises = w.exercises.filter((x) => x !== we);
      persist();
      render();
    });
    card.querySelector(".ex-head")!.append(removeEx);

    const setsEl = card.querySelector(".sets")!;
    we.sets.forEach((s, i) => {
      const unit = metric === "seconds" ? "秒" : "回";
      const row = el(`
        <div class="set-row">
          <span class="set-no">${i + 1}</span>
          <input type="number" inputmode="decimal" step="0.5" min="0" class="w"
                 value="${s.weight ?? ""}" placeholder="${prev?.[i]?.weight ?? "自重"}" /><span class="u">kg</span>
          <input type="number" inputmode="numeric" step="1" min="0" class="r"
                 value="${s.reps || ""}" placeholder="${prev?.[i]?.reps ?? ""}" /><span class="u">${unit}</span>
        </div>
      `);
      // change時にstateだけ更新（再renderしない=フォーカス維持）
      row.querySelector<HTMLInputElement>(".w")!.addEventListener("change", (e) => {
        const v = (e.target as HTMLInputElement).value;
        s.weight = v === "" ? null : Number(v);
        persist();
      });
      row.querySelector<HTMLInputElement>(".r")!.addEventListener("change", (e) => {
        s.reps = Number((e.target as HTMLInputElement).value) || 0;
        persist();
      });
      const del = el(`<button class="ghost small">×</button>`);
      del.addEventListener("click", () => {
        we.sets.splice(i, 1);
        persist();
        render();
      });
      row.append(del);
      setsEl.append(row);
    });

    const addSetBtn = el(`<button class="secondary">＋ セット</button>`);
    addSetBtn.addEventListener("click", () => addSet(ex.id));
    card.append(addSetBtn);
    main.append(card);
  }

  const addExBtn = el(`<button class="primary">＋ 種目を追加</button>`);
  addExBtn.addEventListener("click", () => { pickerOpen = !pickerOpen; render(); });
  main.append(addExBtn);
  if (pickerOpen) main.append(buildPicker(w));
}

function buildPicker(w: Workout): HTMLElement {
  const wrap = el(`<section class="card picker"></section>`);
  const added = new Set(w.exercises.map((x) => x.exerciseId));
  for (const g of ["upper", "lower", "core"] as MuscleGroup[]) {
    const list = exercises.filter((e) => e.group === g && !e.archived && !added.has(e.id));
    if (list.length === 0) continue;
    wrap.append(el(`<div class="picker-group">${GROUP_LABEL[g]}</div>`));
    for (const ex of list) {
      const b = el(`<button class="pick">${ex.name} <span class="badge">${KIND_LABEL[ex.kind]}</span></button>`);
      b.addEventListener("click", () => addExerciseToWorkout(ex.id));
      wrap.append(b);
    }
  }
  const note = el(`<p class="hint">見つからない種目は「種目」タブで追加できます。</p>`);
  wrap.append(note);
  return wrap;
}

// ---- 履歴タブ ----
function renderHistory(main: HTMLElement): void {
  const done = workouts
    .filter((x) => x.endedAt !== null)
    .sort((a, b) => b.startedAt - a.startedAt);
  if (done.length === 0) {
    main.append(el(`<p class="hint">まだ記録がありません。「今日」タブから始めましょう。</p>`));
    return;
  }
  for (const w of done) {
    const vol = volumeOf(w);
    const summary = w.exercises
      .map((we) => `${exById(we.exerciseId)?.name ?? "?"}×${we.sets.length}`)
      .join("・");
    const card = el(`
      <section class="card history">
        <div class="hist-head">
          <b>${fmtDateJa(w.date)}</b>
          <span class="muted">${fmtDuration((w.endedAt ?? w.startedAt) - w.startedAt)}${vol > 0 ? ` / ${Math.round(vol).toLocaleString()}kg` : ""}</span>
        </div>
        <div class="hist-summary">${summary}</div>
      </section>
    `);
    card.addEventListener("click", () => {
      expandedHistoryId = expandedHistoryId === w.id ? null : w.id;
      render();
    });
    if (expandedHistoryId === w.id) {
      const detail = el(`<div class="hist-detail"></div>`);
      for (const we of w.exercises) {
        const ex = exById(we.exerciseId);
        detail.append(el(`
          <div class="hist-ex">
            <b>${ex?.name ?? "?"}</b>
            <span>${we.sets.map((s) => fmtSet(s, ex?.metric ?? "reps")).join(", ")}</span>
          </div>
        `));
      }
      const del = el(`<button class="ghost small danger">この記録を削除</button>`);
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!confirm(`${fmtDateJa(w.date)} の記録を削除しますか？`)) return;
        workouts = workouts.filter((x) => x.id !== w.id);
        persist();
        render();
      });
      detail.append(del);
      card.append(detail);
    }
    main.append(card);
  }
}

// ---- 種目タブ ----
function renderExercises(main: HTMLElement): void {
  const addBtn = el(`<button class="primary">＋ 種目を作る</button>`);
  addBtn.addEventListener("click", () => { addFormOpen = !addFormOpen; editingExerciseId = null; render(); });
  main.append(addBtn);
  if (addFormOpen) main.append(buildExerciseForm(null));

  for (const g of ["upper", "lower", "core"] as MuscleGroup[]) {
    const list = exercises.filter((e) => e.group === g && !e.archived);
    if (list.length === 0) continue;
    main.append(el(`<h2 class="group-h">${GROUP_LABEL[g]}</h2>`));
    for (const ex of list) {
      const card = el(`
        <section class="card ex-item">
          <div><b>${ex.name}</b> <span class="badge">${KIND_LABEL[ex.kind]}</span>${ex.metric === "seconds" ? ' <span class="badge">秒</span>' : ""}</div>
        </section>
      `);
      const btns = el(`<div class="row-btns"></div>`);
      const edit = el(`<button class="ghost small">編集</button>`);
      edit.addEventListener("click", () => { editingExerciseId = editingExerciseId === ex.id ? null : ex.id; addFormOpen = false; render(); });
      const arch = el(`<button class="ghost small">非表示</button>`);
      arch.addEventListener("click", () => {
        ex.archived = true;
        persist();
        render();
      });
      btns.append(edit, arch);
      card.append(btns);
      if (editingExerciseId === ex.id) card.append(buildExerciseForm(ex));
      main.append(card);
    }
  }

  const archived = exercises.filter((e) => e.archived);
  if (archived.length > 0) {
    main.append(el(`<h2 class="group-h">非表示中</h2>`));
    for (const ex of archived) {
      const card = el(`<section class="card ex-item muted"><div>${ex.name}</div></section>`);
      const un = el(`<button class="ghost small">戻す</button>`);
      un.addEventListener("click", () => { ex.archived = false; persist(); render(); });
      card.append(un);
      main.append(card);
    }
  }
}

function buildExerciseForm(target: Exercise | null): HTMLElement {
  const f = el(`
    <form class="card ex-form">
      <label>名前 <input name="name" required value="${target?.name ?? ""}" placeholder="例: レッグエクステンション" /></label>
      <label>部位
        <select name="group">
          <option value="upper" ${target?.group === "upper" ? "selected" : ""}>上半身</option>
          <option value="lower" ${target?.group === "lower" ? "selected" : ""}>下半身</option>
          <option value="core" ${target?.group === "core" ? "selected" : ""}>体幹・腹筋</option>
        </select>
      </label>
      <label>種類
        <select name="kind">
          <option value="machine" ${target?.kind !== "bodyweight" ? "selected" : ""}>マシン</option>
          <option value="bodyweight" ${target?.kind === "bodyweight" ? "selected" : ""}>自重</option>
        </select>
      </label>
      <label>数え方
        <select name="metric">
          <option value="reps" ${target?.metric !== "seconds" ? "selected" : ""}>回数</option>
          <option value="seconds" ${target?.metric === "seconds" ? "selected" : ""}>秒数（プランク等）</option>
        </select>
      </label>
      <button class="primary" type="submit">${target ? "保存" : "追加"}</button>
    </form>
  `);
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(f as HTMLFormElement);
    const name = String(fd.get("name")).trim();
    if (!name) return;
    const group = fd.get("group") as MuscleGroup;
    const kind = fd.get("kind") as ExerciseKind;
    const metric = fd.get("metric") as Metric;
    if (target) {
      Object.assign(target, { name, group, kind, metric });
    } else {
      exercises.push({ id: newId(), name, group, kind, metric });
    }
    addFormOpen = false;
    editingExerciseId = null;
    persist();
    render();
  });
  return f;
}

// ---- 設定タブ ----
function renderSettings(main: HTMLElement): void {
  const wl = el(`
    <section class="card">
      <label class="toggle">
        <input type="checkbox" ${settings.wakeLock ? "checked" : ""} />
        記録中は画面をスリープさせない
      </label>
      <p class="hint">対応ブラウザのみ（Android Chrome対応）。YouTube等の音楽再生とは競合しません。</p>
    </section>
  `);
  wl.querySelector("input")!.addEventListener("change", (e) => {
    settings.wakeLock = (e.target as HTMLInputElement).checked;
    persist();
    void syncWakeLock();
  });
  main.append(wl);

  const io = el(`<section class="card io"><b>バックアップ</b></section>`);
  const expJson = el(`<button class="secondary">JSONエクスポート</button>`);
  expJson.addEventListener("click", () => {
    download(
      `gym-log-${dateStr(new Date())}.json`,
      JSON.stringify(makeBackup(exercises, workouts), null, 2),
      "application/json",
    );
  });
  const expCsv = el(`<button class="secondary">CSVエクスポート</button>`);
  expCsv.addEventListener("click", () => {
    download(`gym-log-${dateStr(new Date())}.csv`, toCsv(workouts, exercises), "text/csv");
  });
  const impLabel = el(`<label class="secondary file-btn">JSONインポート<input type="file" accept=".json,application/json" hidden /></label>`);
  impLabel.querySelector("input")!.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const backup = parseBackup(await file.text());
      if (!confirm(`${backup.workouts.length}件のワークアウトを読み込みます。現在のデータは上書きされます。よろしいですか？`)) return;
      exercises = backup.exercises;
      workouts = backup.workouts;
      persist();
      render();
      alert("インポートしました");
    } catch (err) {
      alert(`インポート失敗: ${err instanceof Error ? err.message : err}`);
    }
  });
  io.append(expJson, expCsv, impLabel);
  main.append(io);

  const danger = el(`<section class="card"><b>データ</b></section>`);
  const clear = el(`<button class="ghost danger">全データを削除</button>`);
  clear.addEventListener("click", () => {
    if (!confirm("すべての記録と種目を削除します。元に戻せません。よろしいですか？")) return;
    localStorage.removeItem("gymlog.workouts.v1");
    localStorage.removeItem("gymlog.exercises.v1");
    workouts = [];
    exercises = loadExercises();
    render();
  });
  danger.append(clear);
  main.append(danger);

  main.append(el(`
    <p class="hint">
      Phase 2 予定: Androidアプリ化（Capacitor）でヘルスコネクトに筋トレセッションを自動記録。
      それまでの記録もこのアプリ内にすべて残ります。
    </p>
  `));
}

// ---- PWA ----
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

render();
