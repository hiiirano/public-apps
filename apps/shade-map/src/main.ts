import "./style.css";
import { shinjuku } from "./cities/shinjuku";
import { icon } from "./icons";
import { compareRoutes, selectablePlaces, WALK_M_PER_MIN } from "./router";
import { load, parseHash, save } from "./storage";
import type { Comparison, Place, Point, RouteMode, RouteResult, RouteStep, SavedState } from "./types";

const city = shinjuku;
const app = document.querySelector<HTMLDivElement>("#app")!;
const places = selectablePlaces(city);
const placeIds = places.map((pl) => pl.id);
const placeById = new Map(city.places.map((pl) => [pl.id, pl]));

/** 画面に出す文字は必ずこれを通す（データは固定だが、念のため） */
const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// 前の版の URL（#from=..）で開かれたら、それを使ってから URL をきれいにする
const fromHash = parseHash(location.hash, placeIds);
let state: SavedState = fromHash ?? load(placeIds);
const clearHash = () => history.replaceState(null, "", location.pathname + location.search);
if (fromHash) clearHash();
let canSave = save(state);

const MODE_NAME: Record<RouteMode, string> = { shade: "日陰の道", shortest: "近い道" };
const KIND_NAME = { underground: "地下", covered: "屋根の下", outdoor: "地上（日なた）" } as const;
const KIND_ICON = { underground: "stairs-down", covered: "umbrella", outdoor: "sun" } as const;

const short = (id: string) => placeById.get(id)!.shortLabel;

// ---------- 比べる札 ----------
/** 道の帯。続く同じ種類（日陰・日なた）の区間はまとめ、長さに比例した幅で並べる */
function strip(r: RouteResult): string {
  const runs: { sun: boolean; m: number }[] = [];
  for (const s of r.steps) {
    const sun = s.edge.kind === "outdoor";
    const last = runs[runs.length - 1];
    if (last && last.sun === sun) last.m += s.edge.distanceM;
    else runs.push({ sun, m: s.edge.distanceM });
  }
  return `<span class="strip" aria-hidden="true">${runs
    .map((x) => `<span class="seg ${x.sun ? "sun" : "shade"}" data-m="${x.m}"></span>`)
    .join("")}</span>`;
}

function cardBody(r: RouteResult, name: string, art: string, active: boolean): string {
  return `
    <span class="rc-head">
      <img class="rc-art" src="./art/${art}.webp" alt="" width="44" height="44" />
      <span class="rc-name">${esc(name)}</span>
      ${active ? `<span class="rc-on">地図に表示中</span>` : `<span class="rc-tap">押すと地図に出ます</span>`}
    </span>
    <span class="rc-main">
      <span class="rc-label">${icon("sun")}日なた</span>
      <span class="rc-big"><b>${r.sunMinutes}</b>分</span>
    </span>
    <span class="rc-stats">
      <span>${icon("walk")}歩く 約${r.minutes}分</span>
      <span>${icon("umbrella")}日陰 ${r.shadeRatio}%</span>
    </span>
    ${strip(r)}
    <span class="rc-dist">${r.distanceM.toLocaleString("ja-JP")}m のうち 日なた ${r.sunM}m</span>`;
}

function cardsMarkup(c: Comparison): string {
  if (c.same) {
    return `<div class="cards one"><div class="route-card shade is-active">${cardBody(c.shade, "日陰の道＝近い道", "deciduous-tree", true)}</div></div>`;
  }
  const btn = (r: RouteResult, art: string) => {
    const on = state.mode === r.mode;
    return `<button type="button" class="route-card ${r.mode} ${on ? "is-active" : ""}" data-mode="${r.mode}" aria-pressed="${on}">${cardBody(r, MODE_NAME[r.mode], art, on)}</button>`;
  };
  return `<div class="cards" role="group" aria-label="地図に出す道を選ぶ">${btn(c.shade, "deciduous-tree")}${btn(c.shortest, "sun")}</div>`;
}

function summaryText(c: Comparison): string {
  if (c.same) return "この2か所は、いちばん近い道がそのまま日陰の道です。";
  const sun = c.sunSavedMinutes > 0 ? `日なたが約${c.sunSavedMinutes}分へります` : "日なたの時間はほぼ同じです";
  const walk = c.extraMinutes > 0 ? `歩くのは約${c.extraMinutes}分のびます` : "歩く時間はほぼ同じです";
  return `日陰の道にすると、${sun}。${walk}。`;
}

// ---------- 絵地図 ----------
const pts = (list: Point[]) => list.map((pt) => `${pt.x},${pt.y}`).join(" ");
const mid = (list: Point[]): Point => {
  // 線の長さの真ん中
  let total = 0;
  const lens: number[] = [];
  for (let i = 1; i < list.length; i++) {
    const l = Math.hypot(list[i].x - list[i - 1].x, list[i].y - list[i - 1].y);
    lens.push(l);
    total += l;
  }
  let half = total / 2;
  for (let i = 1; i < list.length; i++) {
    if (half <= lens[i - 1]) {
      const t = lens[i - 1] === 0 ? 0 : half / lens[i - 1];
      return { x: list[i - 1].x + (list[i].x - list[i - 1].x) * t, y: list[i - 1].y + (list[i].y - list[i - 1].y) * t };
    }
    half -= lens[i - 1];
  }
  return list[0];
};

/** 地点名の置き場所（重ならないよう手で決めた） */
const LABEL_AT: Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  tocho: { dx: 0, dy: 34, anchor: "middle" },
  west_exit: { dx: -6, dy: 36, anchor: "end" },
  east_exit: { dx: 6, dy: 36, anchor: "start" },
  ward_office: { dx: 22, dy: -10, anchor: "start" },
  sanchome: { dx: 0, dy: 36, anchor: "middle" },
};

function stepLines(steps: RouteStep[], cls: string): string {
  return steps.map((s) => `<polyline class="${cls} ${s.edge.kind === "outdoor" ? "sun" : "shade"}" points="${pts(s.points)}" />`).join("");
}

function mapMarkup(c: Comparison): string {
  const active = c.same || state.mode === "shade" ? c.shade : c.shortest;
  const other = c.same ? null : state.mode === "shade" ? c.shortest : c.shade;
  const start = placeById.get(state.from)!;
  const goal = placeById.get(state.to)!;
  const sunMarks = active.steps
    .filter((s) => s.edge.kind === "outdoor")
    .map((s) => {
      const m = mid(s.points);
      return `<use href="#sunmark" x="${m.x - 11}" y="${m.y - 11}" width="22" height="22" />`;
    })
    .join("");
  const junctions = city.places
    .filter((pl) => !pl.selectable)
    .map((pl) => `<circle class="junction" cx="${pl.x}" cy="${pl.y}" r="4" />`)
    .join("");
  const marks = places
    .map((pl: Place) => {
      const at = LABEL_AT[pl.id] ?? { dx: 0, dy: 34, anchor: "middle" as const };
      return `<g class="place">
        <image href="./art/${pl.art}.webp" x="${pl.x - 17}" y="${pl.y - 17}" width="34" height="34" />
        <text class="place-label" x="${pl.x + at.dx}" y="${pl.y + at.dy}" text-anchor="${at.anchor}">${esc(pl.shortLabel)}</text>
      </g>`;
    })
    .join("");
  const pin = (pl: Place, cls: string, ch: string) =>
    `<g class="pin ${cls}"><path d="M${pl.x} ${pl.y - 15} l-7.5 -10 a13.5 13.5 0 1 1 15 0 z" /><text x="${pl.x}" y="${pl.y - 31.5}" text-anchor="middle">${ch}</text></g>`;

  const desc = `${short(state.from)}から${short(state.to)}までの${c.same ? "道" : MODE_NAME[active.mode]}。${active.steps
    .map((s) => `${KIND_NAME[s.edge.kind]}${s.edge.distanceM}m`)
    .join("、")}。`;

  return `
    <svg class="map" viewBox="0 0 400 304" role="img" aria-label="${esc(desc)}">
      <defs>
        <symbol id="sunmark" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" class="sunmark-bg" /><g class="sunmark-fg" fill="none" stroke-width="2" stroke-linecap="round">${'<path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />'}</g></symbol>
        <clipPath id="mapclip"><rect width="400" height="304" rx="18" /></clipPath>
      </defs>
      <g clip-path="url(#mapclip)">
        <rect class="map-bg" width="400" height="304" />
        <path class="park" d="M-10 150 C 14 146 22 168 18 196 C 14 230 22 262 10 320 L -10 320 Z" />
        <path class="park" d="M300 262 C 330 244 380 246 410 252 L 410 320 L 290 320 C 286 296 290 274 300 262 Z" />
        <g class="trees">
          <circle cx="6" cy="176" r="7" /><circle cx="2" cy="210" r="8" /><circle cx="8" cy="262" r="7" /><circle cx="2" cy="290" r="6" />
          <circle cx="318" cy="284" r="8" /><circle cx="348" cy="270" r="9" /><circle cx="380" cy="276" r="8" /><circle cx="336" cy="298" r="7" /><circle cx="368" cy="298" r="8" />
        </g>
        <path class="road-case" d="M8 232 C112 232 148 188 192 188 C272 192 336 200 404 188" />
        <path class="road-case" d="M216 32 C240 88 276 136 364 208" />
        <path class="road" d="M8 232 C112 232 148 188 192 188 C272 192 336 200 404 188" />
        <path class="road" d="M216 32 C240 88 276 136 364 208" />
        <rect class="rail" x="186" y="-4" width="20" height="312" />
        <path class="rail-tie" d="M196 -4 V 308" />
        <text class="area" x="70" y="44">西新宿</text>
        <text class="area" x="232" y="44">歌舞伎町</text>
        <text class="area small" x="352" y="296" text-anchor="middle">新宿御苑</text>
        <text class="area small" x="196" y="20" text-anchor="middle" transform="rotate(90 196 20)" dx="40">JR線</text>
        ${city.edges.map((e) => `<polyline class="net ${e.kind === "outdoor" ? "sun" : "shade"}" points="${pts(e.points)}" />`).join("")}
        ${other ? stepLines(other.steps, "other") : ""}
        ${stepLines(active.steps, "case")}
        ${stepLines(active.steps, "active")}
        ${sunMarks}
        ${junctions}
        ${marks}
        ${pin(start, "start", "出")}
        ${pin(goal, "goal", "着")}
      </g>
    </svg>`;
}

// ---------- 歩き方 ----------
function stepsMarkup(r: RouteResult): string {
  return r.steps
    .map((s, i) => {
      const k = s.edge.kind;
      const min = Math.max(1, Math.round(s.edge.distanceM / WALK_M_PER_MIN));
      return `<li class="step ${k}">
        <span class="step-no" aria-hidden="true">${i + 1}</span>
        <div class="step-body">
          <p class="step-tags"><span class="tag ${k}">${icon(KIND_ICON[k])}${KIND_NAME[k]}</span><span class="tag plain">約${s.edge.distanceM}m・${min}分</span></p>
          <p class="step-text">${esc(s.instruction)}</p>
          <p class="step-to">${icon("flag")}${esc(placeById.get(s.to)!.label)} へ</p>
          ${s.edge.availability ? `<p class="step-warn">${icon("alert-triangle")}${esc(s.edge.availability)}</p>` : ""}
        </div>
      </li>`;
    })
    .join("");
}

// ---------- データについて ----------
function aboutMarkup(): string {
  const kinds = { underground: 0, covered: 0, outdoor: 0 };
  for (const e of city.edges) kinds[e.kind] += 1;
  const rows = city.edges
    .map((e) => {
      const a = short(e.from), b = short(e.to);
      return `<li><p class="ev-head"><b>${esc(a)} – ${esc(b)}</b><span class="tag ${e.kind}">${icon(KIND_ICON[e.kind])}${KIND_NAME[e.kind]}</span><span class="ev-m">約${e.distanceM}m</span></p><p class="ev-basis">${esc(e.basis)}</p></li>`;
    })
    .join("");
  const sources = city.sources
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}${icon("external-link")}<span class="sr-only">（別の画面で開きます）</span></a><span class="src-meta">${esc(s.publisher)}${s.updated ? `・${esc(s.updated)}` : ""}</span></li>`)
    .join("");
  return `
    <dl class="facts">
      <div><dt>${icon("stairs-down")}日陰とした道</dt><dd>地下通路と、駅の自由通路のような屋根の下の道（${kinds.underground + kinds.covered}区間）。暑さはありますが、日差しは当たりません。</dd></div>
      <div><dt>${icon("sun")}日なたとした道</dt><dd>屋根のない地上の道はすべて日なたとして数えます（${kinds.outdoor}区間）。実際はビルや街路樹の影になる所もあります。</dd></div>
      <div><dt>${icon("clock")}季節と時刻</dt><dd>考えていません。朝でも夕方でも、夏でも冬でも同じ答えです。地下街や駅の通路が閉まる夜間・早朝は使えないことがあります。</dd></div>
      <div><dt>${icon("walk")}歩く時間</dt><dd>分速${WALK_M_PER_MIN}m（ゆっくりめ）で計算し、切り上げています。距離は公式の地図の縮尺から読んだ概算です。</dd></div>
      <div><dt>${icon("map-pin")}使える場所</dt><dd>新宿駅のまわりの5か所の間だけです。絵地図の位置と形は目安で、縮尺は正確ではありません。</dd></div>
    </dl>
    <details class="more">
      <summary>${icon("chevron-down")}道ごとの根拠を見る（${city.edges.length}区間）</summary>
      <ul class="evidence">${rows}</ul>
      <p class="checked">${esc(city.checkedOn)}に、下の公式の資料を見て手で入力しました。データ版 ${esc(city.version)}</p>
      <ul class="sources">${sources}</ul>
    </details>
    <ul class="cautions">
      <li>工事・閉鎖・営業時間で通れないことがあります。<b>現地の案内を優先</b>してください。</li>
      <li>熱中症を防げることは約束できません。水分と休けいをとってください。</li>
    </ul>`;
}

// ---------- 描画 ----------
function optionList(selected: string): string {
  return places.map((pl) => `<option value="${esc(pl.id)}"${pl.id === selected ? " selected" : ""}>${esc(pl.label)}</option>`).join("");
}

function render(focusId?: string): void {
  const c = compareRoutes(city, state.from, state.to);
  const active = c.same || state.mode === "shade" ? c.shade : c.shortest;
  const activeName = c.same ? "道" : MODE_NAME[active.mode];

  app.innerHTML = `
    <a class="skip" href="#compare">くらべる所へ</a>
    <header class="top">
      <div class="top-text">
        <p class="brand">新宿β</p>
        <h1>日陰MAP 新宿</h1>
        <p class="lead">地下や屋根の下を通って、<br />日なたを歩く時間をへらす道をさがします。</p>
      </div>
      <img class="top-art" src="./art/umbrella.webp" alt="" width="128" height="128" />
    </header>
    <p class="notice">${icon("info-circle")}<span><b>目安です。</b>地下・屋根のある道を公式の地図から手で拾いました。建物の影・季節・時刻は計算していません。<a href="#about">くわしく</a></span></p>

    <main class="layout">
      <section class="card pick" aria-labelledby="pick-title">
        <h2 id="pick-title"><span class="num" aria-hidden="true">1</span>どこからどこへ？</h2>
        <div class="pick-grid">
          <div class="field"><span class="field-label"><i class="dot start" aria-hidden="true">出</i><label for="from">出発</label></span>
            <select id="from">${optionList(state.from)}</select></div>
          <button id="swap" class="swap" type="button" aria-label="出発と到着を入れかえる">${icon("arrows-up-down")}</button>
          <div class="field"><span class="field-label"><i class="dot goal" aria-hidden="true">着</i><label for="to">到着</label></span>
            <select id="to">${optionList(state.to)}</select></div>
        </div>
      </section>

      <section class="compare" id="compare" aria-labelledby="cmp-title" tabindex="-1">
        <h2 id="cmp-title"><span class="num" aria-hidden="true">2</span>2つの道をくらべる</h2>
        <p class="summary">${esc(summaryText(c))}</p>
        ${cardsMarkup(c)}
        <p class="key" aria-hidden="true"><span class="sw shade"></span>日陰（地下・屋根）<span class="sw sun"></span>日なた（地上）</p>
      </section>

      <section class="card map-card" aria-labelledby="map-title">
        <h2 id="map-title"><span class="num" aria-hidden="true">3</span>絵地図で見る</h2>
        <p class="map-note">${esc(short(state.from))} → ${esc(short(state.to))}・${esc(activeName)}。位置と形は目安です。</p>
        ${mapMarkup(c)}
        <ul class="legend">
          <li><span class="ln shade"></span>日陰（地下・屋根）</li>
          <li><span class="ln sun"></span>日なた（地上）</li>
          ${c.same ? "" : `<li><span class="ln other"></span>もう1つの道</li>`}
        </ul>
      </section>

      <section class="card steps-card" aria-labelledby="steps-title">
        <h2 id="steps-title"><span class="num" aria-hidden="true">4</span>歩き方<span class="h-sub">${esc(activeName)}・約${active.minutes}分</span></h2>
        <ol class="steps">${stepsMarkup(active)}</ol>
      </section>

      <section class="card about" id="about" aria-labelledby="about-title" tabindex="-1">
        <h2 id="about-title">${icon("info-circle")}このデータについて</h2>
        ${aboutMarkup()}
      </section>
    </main>

    <footer class="foot">
      ${canSave ? "" : `<p class="nosave">この画面では選んだ場所を保存できません（道さがしはできます）。</p>`}
      <p>位置情報は使いません。選んだ場所はこのスマホ（ブラウザ）の中にだけ残り、外には送りません。</p>
      <p><a href="../">ほかのアプリ</a></p>
    </footer>
    <div id="live" class="sr-only" aria-live="polite"></div>
  `;

  bind();
  if (focusId) document.getElementById(focusId)?.focus();
}

function announce(): void {
  const c = compareRoutes(city, state.from, state.to);
  const live = document.getElementById("live");
  if (live) live.textContent = `${short(state.from)}から${short(state.to)}。${summaryText(c)}`;
}

function update(next: Partial<SavedState>, focusId?: string): void {
  state = { ...state, ...next };
  canSave = save(state);
  render(focusId);
  announce();
}

function bind(): void {
  // 公開版は CSP で style 属性を禁じているため、帯の幅はここで設定する
  document.querySelectorAll<HTMLElement>(".seg[data-m]").forEach((el) => {
    el.style.flexGrow = el.dataset.m ?? "1";
  });
  const from = document.querySelector<HTMLSelectElement>("#from")!;
  const to = document.querySelector<HTMLSelectElement>("#to")!;
  from.addEventListener("change", () => {
    const v = from.value;
    update(v === state.to ? { from: v, to: state.from } : { from: v }, "from");
  });
  to.addEventListener("change", () => {
    const v = to.value;
    update(v === state.from ? { to: v, from: state.to } : { to: v }, "to");
  });
  document.querySelector("#swap")!.addEventListener("click", () => update({ from: state.to, to: state.from }, "swap"));
  document.querySelectorAll<HTMLButtonElement>("button[data-mode]").forEach((b) => {
    b.addEventListener("click", () => {
      update({ mode: b.dataset.mode as RouteMode });
      document.querySelector<HTMLButtonElement>(`button[data-mode="${b.dataset.mode}"]`)?.focus();
    });
  });
}

render();

// 開いたまま前の版の URL が入力されたときも読む（「くわしく」の #about などは無視）
window.addEventListener("hashchange", () => {
  const next = parseHash(location.hash, placeIds);
  if (!next) return;
  clearHash();
  update(next);
});

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
