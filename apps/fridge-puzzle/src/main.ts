import "./style.css";
import {
  EVIDENCES,
  MISSIONS,
  MUSEUM_ITEMS,
  PUDDING_INCIDENT_TRUTH,
  createInitialState,
  evaluate,
  getMission,
  hasAllIncidentEvidence,
  isRemovalTarget,
  isMissionUnlocked,
  loadSaveData,
  removeTarget,
  saveProgress,
  starsForMoves,
  swapSlots,
  type GameState,
  type Item,
  type MissionId,
  type SaveData,
} from "./game.js";

const root = document.querySelector<HTMLDivElement>("#app")!;
if (!root) throw new Error("#app not found");

let saveData: SaveData = loadSaveData();
let state: GameState = createInitialState("lost-and-found");
let selectedIndex: number | null = null;
let discovery: Item | null = null;
let showMuseumModal = false;
let showTruthModal = false;
let message = "あやしい物をタップしてみよう";

const zoneNames = ["❄️ 冷凍室", "🥛 冷蔵室", "🥕 野菜室"];

function recordDiscovery(item: Item): void {
  let updated = false;
  const isIncidentMission = state.missionId.startsWith("pudding-");
  if (isIncidentMission && "evidenceId" in item && item.evidenceId && !saveData.collectedEvidence.includes(item.evidenceId)) {
    saveData.collectedEvidence.push(item.evidenceId);
    updated = true;
  }
  if ("isMuseum" in item && item.isMuseum && !saveData.museumUnlocked.includes(item.id)) {
    saveData.museumUnlocked.push(item.id);
    updated = true;
  }
  if (updated) {
    saveProgress(saveData);
  }
}

function startMission(id: MissionId): void {
  if (!isMissionUnlocked(id, saveData.completedMissions)) {
    message = "ひとつ前の事件を解決すると開放されるよ";
    render();
    return;
  }
  state = createInitialState(id);
  selectedIndex = null;
  discovery = null;
  showMuseumModal = false;
  showTruthModal = false;
  message = getMission(id).arrangeRequired
    ? "食材を2つタップすると入れ替わるよ"
    : "あやしい物をタップしてみよう";
  render();
}

function itemMarkup(item: Item | null, index: number): string {
  if (!item) {
    return `<button class="slot empty" data-cell="${index}" aria-label="空きスペース"><span>＋</span></button>`;
  }
  const target = isRemovalTarget(item);
  const spoiled = item.kind === "food" && item.freshness === "spoiled";
  const selected = selectedIndex === index;
  return `
    <button class="slot ${target ? "target" : "fresh"} ${spoiled ? "spoiled" : ""} ${selected ? "selected" : ""}"
      data-cell="${index}" aria-pressed="${selected}" aria-label="${item.name}">
      ${spoiled ? '<span class="smell" aria-hidden="true">〰</span>' : ""}
      <span class="emoji" aria-hidden="true">${item.emoji}</span>
      <span class="item-name">${item.name}</span>
      ${target ? '<span class="tap-hint">タップ!</span>' : ""}
    </button>`;
}

function caseFileMarkup(): string {
  const collectedCount = saveData.collectedEvidence.length;
  const itemsHtml = EVIDENCES.map((ev) => {
    const isCollected = saveData.collectedEvidence.includes(ev.id);
    return `
      <div class="evidence-card ${isCollected ? "collected" : "missing"}">
        <span class="ev-emoji" aria-hidden="true">${isCollected ? ev.emoji : "❓"}</span>
        <div class="ev-info">
          <span class="ev-name">${isCollected ? ev.name : "未発見の証拠"}</span>
          <span class="ev-desc">${isCollected ? ev.description : "捜査中..."}</span>
        </div>
      </div>`;
  }).join("");

  return `
    <section class="case-file-section" aria-label="事件ファイル">
      <div class="case-file-header">
        <h3>🕵️ 事件ファイル: 深夜のプリン事件</h3>
        <span class="ev-counter">証拠: ${collectedCount} / ${EVIDENCES.length}</span>
      </div>
      <div class="case-file-grid">
        ${itemsHtml}
      </div>
    </section>`;
}

function museumModalMarkup(): string {
  const unlockedCount = saveData.museumUnlocked.length;
  const itemsHtml = MUSEUM_ITEMS.map((item) => {
    const isUnlocked = saveData.museumUnlocked.includes(item.id);
    return `
      <div class="museum-card ${isUnlocked ? "unlocked" : "locked"}">
        <div class="museum-emoji" aria-hidden="true">${isUnlocked ? item.emoji : "🔒"}</div>
        <div class="museum-details">
          <h4>${isUnlocked ? item.name : "？？？"}</h4>
          <p class="museum-desc">${isUnlocked ? item.description : "まだ発見されていません"}</p>
          ${isUnlocked ? `<blockquote class="museum-story">「${item.story}」</blockquote>` : ""}
        </div>
      </div>`;
  }).join("");

  return `
    <div class="modal-backdrop" role="presentation" id="museum-backdrop">
      <section class="modal-card museum-modal" role="dialog" aria-modal="true" aria-labelledby="museum-title">
        <div class="modal-header">
          <h2 id="museum-title">🏆 冷蔵庫博物館</h2>
          <span class="badge">登録数: ${unlockedCount}/${MUSEUM_ITEMS.length}</span>
        </div>
        <p class="modal-intro">冷蔵庫から救出された変なものたちの展示館です。</p>
        <div class="museum-list">
          ${itemsHtml}
        </div>
        <button class="primary close-btn" id="close-museum">とじる</button>
      </section>
    </div>`;
}

function truthModalMarkup(): string {
  return `
    <div class="modal-backdrop" role="presentation" id="truth-backdrop">
      <section class="modal-card truth-modal" role="dialog" aria-modal="true" aria-labelledby="truth-title">
        <div class="truth-header">
          <span class="truth-badge">真相解明！</span>
          <h2 id="truth-title">${PUDDING_INCIDENT_TRUTH.title}</h2>
        </div>
        <div class="truth-body">
          <p>「${PUDDING_INCIDENT_TRUTH.body}」</p>
        </div>
        <div class="truth-actions">
          <button class="secondary" id="open-museum-from-truth">🏆 博物館を見る</button>
          <button class="primary" id="close-truth">OK</button>
        </div>
      </section>
    </div>`;
}

function render(): void {
  const mission = getMission(state.missionId);
  const progress = evaluate(state);
  const stars = starsForMoves(state.moves, state.missionId);
  const missionIndex = MISSIONS.findIndex((candidate) => candidate.id === state.missionId);
  const nextMission = MISSIONS[missionIndex + 1];

  if (progress.solved && !saveData.completedMissions.includes(state.missionId)) {
    saveData.completedMissions.push(state.missionId);
    saveProgress(saveData);
  }

  const normalMissions = MISSIONS.filter((m) => m.chapter === "日常編");
  const incidentMissions = MISSIONS.filter((m) => m.chapter === "深夜のプリン事件");

  const shelves = zoneNames.map((zoneName, row) => {
    const cells = state.slots
      .slice(row * 4, row * 4 + 4)
      .map((item, column) => itemMarkup(item, row * 4 + column))
      .join("");
    return `<section class="shelf"><h2>${zoneName}</h2><div class="shelf-grid">${cells}</div></section>`;
  }).join("");

  root.innerHTML = `
    <main>
      <header class="hero">
        <div class="hero-top">
          <p class="eyebrow">3分で冷蔵庫を救え！</p>
          <button class="museum-btn" id="open-museum" title="冷蔵庫博物館">🏆 博物館 (${saveData.museumUnlocked.length})</button>
        </div>
        <h1>冷蔵庫<br><span>つめつめパズル</span></h1>
      </header>

      <nav class="chapter-nav" aria-label="章・ミッション選択">
        <div class="chapter-group">
          <span class="chapter-label">日常編</span>
          <div class="mission-buttons">
            ${normalMissions.map((c) => `<button data-mission="${c.id}" class="${c.id === state.missionId ? "active" : ""} ${saveData.completedMissions.includes(c.id) ? "completed" : ""}"><span>${c.number}</span>${c.title.split(" ")[0]}</button>`).join("")}
          </div>
        </div>
        <div class="chapter-group incident">
          <span class="chapter-label">🔍 深夜のプリン事件</span>
          <div class="mission-buttons">
            ${incidentMissions.map((c) => {
              const unlocked = isMissionUnlocked(c.id, saveData.completedMissions);
              return `<button data-mission="${c.id}" ${unlocked ? "" : "disabled"} aria-label="${unlocked ? c.title : `${c.title}（未開放）`}" class="${c.id === state.missionId ? "active" : ""} ${saveData.completedMissions.includes(c.id) ? "completed" : ""} ${unlocked ? "" : "locked"}"><span>${c.number}</span>${unlocked ? c.title.split(" ")[0] : "🔒"}</button>`;
            }).join("")}
          </div>
        </div>
      </nav>

      <section class="mission-card">
        <div class="mission-card-header">
          <p class="mission-number">MISSION ${mission.number}・${mission.chapter}</p>
        </div>
        <h2>${mission.title}</h2>
        <p>${mission.intro}</p>
        <div class="objective">🎯 ${mission.objective}</div>
      </section>

      ${mission.chapter === "深夜のプリン事件" ? caseFileMarkup() : ""}

      <section class="status-bar" aria-live="polite">
        <span>手数 <strong>${state.moves}</strong></span>
        <span>残り <strong>${progress.targetsRemaining + progress.misplacedFoods}</strong></span>
      </section>

      <div class="fridge" aria-label="冷蔵庫の中">
        <div class="fridge-top"><span></span><span class="brand">HIETA</span><span class="handle"></span></div>
        ${shelves}
        <div class="fridge-bottom"></div>
      </div>

      <p class="message" aria-live="polite">${message}</p>
      <button class="secondary" id="reset">↻ このミッションをやり直す</button>

      ${progress.solved ? `
        <section class="clear-card" aria-live="polite">
          <div class="confetti">🎉</div>
          <p>MISSION CLEAR!</p>
          <div class="stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>
          <h2>${mission.completion}</h2>
          <p>${state.moves}手でおかたづけ完了！</p>
          <div class="clear-actions">
            ${state.missionId === "pudding-3" && hasAllIncidentEvidence(saveData.collectedEvidence) ? `<button class="primary" id="view-truth">🔍 真相を見る！</button>` : ""}
            ${nextMission ? `<button class="primary" id="next">次のミッションへ →</button>` : `<button class="primary" id="replay">最初からあそぶ</button>`}
          </div>
        </section>` : ""}

      <details class="howto">
        <summary>遊び方</summary>
        <p>変なものや傷んだ食材は、見つけたらタップして回収。並べ替えが必要なミッションでは、食材を2つ順番にタップして正しい段へ入れ替えます。</p>
      </details>
    </main>

    ${discovery ? `
      <div class="modal-backdrop" role="presentation" id="discovery-backdrop">
        <section class="discovery" role="dialog" aria-modal="true" aria-labelledby="discovery-title">
          <p class="found-label">みーつけた！</p>
          <div class="found-emoji" aria-hidden="true">${discovery.emoji}</div>
          <h2 id="discovery-title">${discovery.name}</h2>
          <p>「${discovery.reaction}」</p>
          <button class="primary" id="close-discovery">かたづける</button>
        </section>
      </div>` : ""}

    ${showMuseumModal ? museumModalMarkup() : ""}
    ${showTruthModal ? truthModalMarkup() : ""}
  `;

  // Attach Event Listeners
  root.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((button) => {
    button.addEventListener("click", () => handleCell(Number(button.dataset.cell)));
  });
  root.querySelectorAll<HTMLButtonElement>("[data-mission]").forEach((button) => {
    button.addEventListener("click", () => startMission(button.dataset.mission as MissionId));
  });
  root.querySelector<HTMLButtonElement>("#reset")?.addEventListener("click", () => startMission(state.missionId));
  root.querySelector<HTMLButtonElement>("#next")?.addEventListener("click", () => nextMission && startMission(nextMission.id));
  root.querySelector<HTMLButtonElement>("#replay")?.addEventListener("click", () => startMission("lost-and-found"));
  root.querySelector<HTMLButtonElement>("#open-museum")?.addEventListener("click", () => {
    showMuseumModal = true;
    render();
  });
  root.querySelector<HTMLButtonElement>("#close-museum")?.addEventListener("click", () => {
    showMuseumModal = false;
    render();
  });
  root.querySelector<HTMLButtonElement>("#view-truth")?.addEventListener("click", () => {
    showTruthModal = true;
    render();
  });
  root.querySelector<HTMLButtonElement>("#close-truth")?.addEventListener("click", () => {
    showTruthModal = false;
    render();
  });
  root.querySelector<HTMLButtonElement>("#open-museum-from-truth")?.addEventListener("click", () => {
    showTruthModal = false;
    showMuseumModal = true;
    render();
  });
  root.querySelector<HTMLButtonElement>("#close-discovery")?.addEventListener("click", () => {
    discovery = null;
    render();
  });
}

function handleCell(index: number): void {
  // Prevent interactions if modals are active
  if (discovery || showMuseumModal || showTruthModal) return;

  const item = state.slots[index];
  const mission = getMission(state.missionId);

  // If item is removal target (junk or spoiled food)
  if (item && isRemovalTarget(item)) {
    state = removeTarget(state, index);
    selectedIndex = null;
    discovery = item;
    recordDiscovery(item);
    message = item.kind === "junk" ? `${item.name}を回収！` : `${item.name}を廃棄！`;

    render();
    return;
  }

  // If item is fresh food and non-arrange mission
  if (!mission.arrangeRequired) {
    if (item && item.kind === "food") {
      message = `${item.name}: 「${item.reaction}」`;
    } else {
      message = "ここは空っぽだよ";
    }
    render();
    return;
  }

  // If arrangeRequired mission
  if (selectedIndex === null) {
    if (!item) {
      message = "先に動かしたい食材をタップしてね";
    } else {
      selectedIndex = index;
      message = `${item.name}を選択中。入れ替え先をタップ！`;
    }
  } else {
    state = swapSlots(state, selectedIndex, index);
    selectedIndex = null;
    const progress = evaluate(state);

    if (progress.solved && state.missionId === "pudding-3" && hasAllIncidentEvidence(saveData.collectedEvidence)) {
      showTruthModal = true;
    }

    message =
      progress.misplacedFoods === 0
        ? "棚はバッチリ！あとは変なものを探そう"
        : `あと${progress.misplacedFoods}個、棚が違うみたい`;
  }
  render();
}

render();
