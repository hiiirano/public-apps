import "./style.css";
import { shinjuku } from "./cities/shinjuku";
import { route, selectablePlaces } from "./router";
import type { Point, RouteMode, RouteResult, RouteStep } from "./types";

const app = document.querySelector<HTMLDivElement>("#app")!;
const places = selectablePlaces(shinjuku);
const placeById = new Map(shinjuku.places.map((place) => [place.id, place]));

interface AppState {
  from: string;
  to: string;
  mode: RouteMode;
}

function stateFromHash(): AppState {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const placeIds = new Set(places.map((place) => place.id));
  const from = params.get("from") ?? "west_exit";
  const to = params.get("to") ?? "ward_office";
  const mode = params.get("mode") === "shortest" ? "shortest" : "shade";
  return {
    from: placeIds.has(from) ? from : "west_exit",
    to: placeIds.has(to) && to !== from ? to : "ward_office",
    mode,
  };
}

let state = stateFromHash();

function polyline(points: Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function pointsForStep(step: RouteStep): Point[] {
  return step.edge.from === step.from
    ? step.edge.points
    : [...step.edge.points].reverse();
}

function updateHash(): void {
  const params = new URLSearchParams({
    from: state.from,
    to: state.to,
    mode: state.mode,
  });
  history.replaceState(null, "", `#${params.toString()}`);
}

function routeCard(
  result: RouteResult,
  label: string,
  caption: string,
): string {
  const active = state.mode === result.mode;
  const exposure = result.exposedM === 0 ? "外歩きほぼなし" : `外歩き 約${result.exposedM}m`;
  return `
    <button class="route-card ${active ? "active" : ""}" data-mode="${result.mode}" aria-pressed="${active}">
      <span class="route-label">${label}</span>
      <strong>約${result.minutes}分</strong>
      <span class="route-meta">屋内・屋根あり ${result.coveredRatio}%</span>
      <span class="exposure">${exposure}</span>
      <span class="route-caption">${caption}</span>
    </button>
  `;
}

function routeLines(result: RouteResult, className: string): string {
  return result.steps
    .map(
      (step) =>
        `<polyline class="route-line ${className}" points="${polyline(pointsForStep(step))}" />`,
    )
    .join("");
}

function mapMarkup(shortest: RouteResult, shade: RouteResult): string {
  const active = state.mode === "shade" ? shade : shortest;
  const inactive = state.mode === "shade" ? shortest : shade;
  const start = placeById.get(state.from)!;
  const destination = placeById.get(state.to)!;

  const baseEdges = shinjuku.edges
    .map(
      (edge) =>
        `<polyline class="network ${edge.covered ? "covered" : "outdoor"}" points="${polyline(edge.points)}" />`,
    )
    .join("");
  const labels = places
    .map(
      (place) => `
        <g class="place-label">
          <circle cx="${place.x}" cy="${place.y}" r="1.35" />
          <text x="${place.x}" y="${place.y - 2.4}" text-anchor="middle">${place.shortLabel}</text>
        </g>
      `,
    )
    .join("");

  return `
    <div class="map-shell">
      <svg class="route-map" viewBox="0 0 100 76" role="img" aria-label="新宿駅周辺の模式図。選択した経路を表示しています。">
        <rect class="map-bg" x="0" y="0" width="100" height="76" rx="3" />
        <path class="rail" d="M48 -5 L49 80" />
        <path class="street" d="M2 58 C28 58 37 47 48 47 C68 48 84 50 99 47" />
        <path class="street" d="M54 8 C60 22 69 34 91 52" />
        <text class="area-label" x="15" y="12">西新宿</text>
        <text class="area-label" x="70" y="10">歌舞伎町</text>
        <text class="area-label" x="79" y="67">新宿三丁目</text>
        ${baseEdges}
        ${routeLines(inactive, "inactive")}
        ${routeLines(active, `active ${state.mode}`)}
        ${labels}
        <g class="endpoint start">
          <circle cx="${start.x}" cy="${start.y}" r="2.6" />
          <text x="${start.x}" y="${start.y + 1}" text-anchor="middle">A</text>
        </g>
        <g class="endpoint destination">
          <circle cx="${destination.x}" cy="${destination.y}" r="2.6" />
          <text x="${destination.x}" y="${destination.y + 1}" text-anchor="middle">B</text>
        </g>
      </svg>
      <div class="legend" aria-label="地図の凡例">
        <span><i class="legend-line underground"></i>地下・屋根あり</span>
        <span><i class="legend-line surface"></i>地上</span>
        <span><i class="legend-line selected"></i>選択中</span>
      </div>
      <p class="schematic-note">位置関係をつかむための模式図です。縮尺・形状は正確ではありません。</p>
    </div>
  `;
}

function stepsMarkup(result: RouteResult): string {
  if (result.steps.length === 0) {
    return `<p class="empty">出発地と目的地が同じです。</p>`;
  }
  return result.steps
    .map((step, index) => {
      const kind = step.edge.covered ? "地下・屋根あり" : "地上";
      const notice = step.edge.availability
        ? `<p class="step-notice">${step.edge.availability}</p>`
        : "";
      return `
        <li class="step ${step.edge.covered ? "is-covered" : "is-outdoor"}">
          <span class="step-number">${index + 1}</span>
          <div>
            <div class="step-tags"><span>${kind}</span><span>約${step.edge.distanceM}m</span></div>
            <p>${step.instruction}</p>
            ${notice}
          </div>
        </li>
      `;
    })
    .join("");
}

function render(): void {
  const shortest = route(shinjuku, state.from, state.to, "shortest");
  const shade = route(shinjuku, state.from, state.to, "shade");
  const active = state.mode === "shade" ? shade : shortest;
  const extraMinutes = Math.max(0, shade.minutes - shortest.minutes);
  const shadeCaption = extraMinutes === 0 ? "同じ時間で外歩きを減らす" : `最短より約${extraMinutes}分プラス`;

  app.innerHTML = `
    <header class="hero">
      <div class="eyebrow"><span class="sun-dot"></span> SHINJUKU BETA <span class="data-badge">固定データ版</span></div>
      <h1>日陰<span>MAP</span></h1>
      <p class="lead">なるべく外に出ない道を、いま選ぶ。</p>
      <p class="scope">新宿の公共地下通路・屋根付き区間だけで比べます。</p>
    </header>

    <main>
      <section class="planner card" aria-labelledby="route-title">
        <div class="section-heading">
          <span>01</span>
          <div><h2 id="route-title">行き先を選ぶ</h2><p>まずは5地点だけ。迷わない最小版です。</p></div>
        </div>
        <div class="select-grid">
          <label>出発地
            <select id="from-select">
              ${places.map((place) => `<option value="${place.id}" ${place.id === state.from ? "selected" : ""}>${place.label}</option>`).join("")}
            </select>
          </label>
          <button id="swap" class="swap" aria-label="出発地と目的地を入れ替える">⇅</button>
          <label>目的地
            <select id="to-select">
              ${places.map((place) => `<option value="${place.id}" ${place.id === state.to ? "selected" : ""}>${place.label}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="route-choices">
          ${routeCard(shortest, "最短", "距離だけで選ぶ")}
          ${routeCard(shade, "日差し回避", shadeCaption)}
        </div>
      </section>

      <section class="map-section" aria-labelledby="map-title">
        <div class="section-heading light">
          <span>02</span>
          <div><h2 id="map-title">ルートを見る</h2><p>${placeById.get(state.from)!.shortLabel} → ${placeById.get(state.to)!.shortLabel}</p></div>
        </div>
        ${mapMarkup(shortest, shade)}
      </section>

      <section class="directions card" aria-labelledby="directions-title">
        <div class="section-heading">
          <span>03</span>
          <div><h2 id="directions-title">歩き方</h2><p>${state.mode === "shade" ? "日差し回避" : "最短"}・約${active.minutes}分・概算${active.distanceM}m</p></div>
        </div>
        <ol class="steps">${stepsMarkup(active)}</ol>
      </section>

      <aside class="beta-warning">
        <strong>このβ版で分かること</strong>
        <p>「地下・屋根あり」と確認できた固定区間の割合です。建物がつくる時間帯別の影、天気、UV指数、混雑、工事はまだ計算していません。</p>
      </aside>

      <section class="safety card" aria-labelledby="safety-title">
        <h2 id="safety-title">使う前に</h2>
        <ul>
          <li>営業時間、工事、臨時閉鎖があります。現地の案内表示を最優先してください。</li>
          <li>UV防護や熱中症予防を保証するものではありません。帽子・日傘・水分補給も併用してください。</li>
          <li>現在地や移動履歴は取得・送信しません。選択したルートはURLの末尾だけに保存されます。</li>
        </ul>
      </section>

      <details class="sources card">
        <summary>データ根拠・更新日</summary>
        <p>2026年8月23日に公式公開情報を目視確認し、通行可能と判断した骨格だけを手入力しています。</p>
        <ul>
          ${shinjuku.sources.map((source) => `<li><a href="${source.url}" target="_blank" rel="noreferrer">${source.title}</a><span>${source.publisher}${source.updated ? `・${source.updated}` : ""}</span></li>`).join("")}
        </ul>
        <p class="version">データ版 ${shinjuku.version}</p>
      </details>
    </main>

    <footer>
      <p><strong>日陰MAP</strong> — トラッカーゼロの小さな地図実験</p>
      <p>次の対象エリア：梅田</p>
    </footer>
  `;

  document.querySelector<HTMLSelectElement>("#from-select")!.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    if (value === state.to) state.to = state.from;
    state.from = value;
    updateHash();
    render();
  });
  document.querySelector<HTMLSelectElement>("#to-select")!.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    if (value === state.from) state.from = state.to;
    state.to = value;
    updateHash();
    render();
  });
  document.querySelector<HTMLButtonElement>("#swap")!.addEventListener("click", () => {
    [state.from, state.to] = [state.to, state.from];
    updateHash();
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode as RouteMode;
      updateHash();
      render();
    });
  });
}

window.addEventListener("hashchange", () => {
  state = stateFromHash();
  render();
});

updateHash();
render();
