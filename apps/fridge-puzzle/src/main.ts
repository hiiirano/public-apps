import "./style.css";
import {
  comparisonMessage,
  createRound,
  createSeed,
  getCharacter,
  parseSharedRound,
  serializeSharedRound,
  type CharacterId,
  type Round,
  type SharedRound,
} from "./game.js";

type Phase = "choosing" | "pause" | "result";

const rootElement = document.querySelector<HTMLDivElement>("#app");
if (!rootElement) throw new Error("#app was not found");
const root: HTMLDivElement = rootElement;

const incoming = parseSharedRound(window.location.hash);
if (window.location.hash && !incoming) {
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}

let sharedRound: SharedRound | null = incoming;
let round: Round = createRound(incoming?.seed ?? createSeed());
let choice: CharacterId | null = null;
let phase: Phase = "choosing";
let shareNotice = "";

function spriteStyle(characterId: CharacterId): string {
  const index = getCharacter(characterId).spriteIndex;
  return `--sprite-position: ${index * (100 / 3)}%`;
}

function startFreshRound(): void {
  sharedRound = null;
  round = createRound(createSeed());
  choice = null;
  phase = "choosing";
  shareNotice = "";
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  render();
}

function pick(characterId: CharacterId): void {
  if (phase !== "choosing") return;
  choice = characterId;
  phase = "pause";
  render();
  window.setTimeout(() => {
    phase = "result";
    render();
  }, 950);
}

function senderChoice(): CharacterId | undefined {
  return sharedRound ? round.order[sharedRound.senderSlot] : undefined;
}

function shareUrl(): string {
  if (!choice) return location.href;
  const fragment = serializeSharedRound(round, choice);
  return `${location.origin}${location.pathname}${location.search}#${fragment}`;
}

async function share(): Promise<void> {
  const url = shareUrl();
  const data = {
    title: "ヒエヒエ冷蔵庫",
    text: `この冷蔵庫、誰んち？ ${choice === round.correct ? "俺は当てた。" : "俺は外した。"}やってみて。`,
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
      shareNotice = "共有メニューを開きました";
    } else {
      await navigator.clipboard.writeText(url);
      shareNotice = "リンクをコピーしました";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    shareNotice = "コピーできませんでした。リンクを長押ししてください";
  }
  render();
}

function characterCard(characterId: CharacterId, index: number): string {
  const selected = choice === characterId;
  return `
    <button class="character-card ${selected ? "selected" : ""}" data-choice="${characterId}" ${phase === "choosing" ? "" : "disabled"} aria-label="候補 ${index + 1}">
      <span class="character-sprite" style="${spriteStyle(characterId)}" aria-hidden="true"></span>
      <span class="candidate-number">${index + 1}</span>
    </button>`;
}

function resultMarkup(): string {
  if (!choice) return "";
  const correct = getCharacter(round.correct);
  const sender = senderChoice();
  const message = comparisonMessage(round.correct, choice, sender);
  const verdict = choice === round.correct ? "正解" : "正解はこの人";

  return `
    <section class="result-card" aria-live="polite">
      <p class="verdict">${verdict}</p>
      <div class="answer-stage">
        <span class="answer-burst" aria-hidden="true"></span>
        <span class="answer-character" style="${spriteStyle(round.correct)}" role="img" aria-label="${correct.revealName}"></span>
      </div>
      <h2>${message}</h2>
      <div class="comparison">
        <div><span>正解</span><strong>${correct.revealName}</strong></div>
        <div><span>あなた</span><strong>${getCharacter(choice).revealName}</strong></div>
        ${sender ? `<div><span>送った人</span><strong>${getCharacter(sender).revealName}</strong></div>` : ""}
      </div>
      <button class="share-button" id="share">このクソゲー、やってみて</button>
      ${shareNotice ? `<p class="share-notice">${shareNotice}</p>` : ""}
      <label class="share-link-label">共有リンク<input class="share-link" readonly value="${shareUrl()}" aria-label="共有リンク"></label>
      <button class="text-button" id="new-round">別のクソゲーもやる</button>
    </section>`;
}

function render(): void {
  const isWaiting = phase === "pause";
  root.innerHTML = `
    <main class="game-shell">
      <header class="game-header">
        <p class="collection-name">知らんがなゲームス #01</p>
        <h1>ヒエヒエ冷蔵庫</h1>
        <p class="rule">この冷蔵庫の持ち主は誰？</p>
        ${sharedRound && phase === "choosing" ? `<p class="incoming-badge">友達と同じ問題です</p>` : ""}
      </header>

      <section class="fridge-scene ${isWaiting ? "thinking" : ""}" aria-label="甘い物でいっぱいの冷蔵庫">
        <img src="./assets/hiehie-fridge.webp" alt="プリン、ケーキ、アイスなどの甘い物がぎっしり詰まった冷蔵庫">
        ${isWaiting ? `<div class="thinking-label">判 定 中</div>` : ""}
      </section>

      ${phase !== "result" ? `
        <section class="choices" aria-label="持ち主の候補">
          ${round.order.map(characterCard).join("")}
        </section>
        <p class="tiny-note">ヒントはありません。</p>
      ` : resultMarkup()}
    </main>`;

  root.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => pick(button.dataset.choice as CharacterId));
  });
  root.querySelector<HTMLButtonElement>("#share")?.addEventListener("click", share);
  root.querySelector<HTMLInputElement>(".share-link")?.addEventListener("click", (event) => {
    (event.currentTarget as HTMLInputElement).select();
  });
  root.querySelector<HTMLButtonElement>("#new-round")?.addEventListener("click", startFreshRound);
}

render();
