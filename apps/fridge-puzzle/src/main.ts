import "./style.css";
import {
  comparisonMessage,
  createPuzzleState,
  createRound,
  createSeed,
  getCharacter,
  isPuzzleSolved,
  parseSharedRound,
  selectPuzzleSlot,
  serializeSharedRound,
  type CharacterId,
  type PuzzleItemId,
  type PuzzleSlot,
  type PuzzleState,
  type Round,
  type SharedRound,
} from "./game.js";

type Phase = "puzzle" | "puzzleClear" | "choosing" | "pause" | "result";

const rootElement = document.querySelector<HTMLDivElement>("#app");
if (!rootElement) throw new Error("#app was not found");
const root: HTMLDivElement = rootElement;

const incoming = parseSharedRound(window.location.hash);
if (window.location.hash && !incoming) {
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}

let sharedRound: SharedRound | null = incoming;
let round: Round = createRound(incoming?.seed ?? createSeed());
let puzzle: PuzzleState = createPuzzleState();
let choice: CharacterId | null = null;
let phase: Phase = "puzzle";
let shareNotice = "";

const PUZZLE_ITEMS: Record<PuzzleItemId, { label: string; image: string }> = {
  pudding: { label: "プリン", image: "./assets/puzzle-pudding.webp" },
  cake: { label: "ケーキ", image: "./assets/puzzle-cake.webp" },
  icecream: { label: "アイス", image: "./assets/puzzle-icecream.webp" },
};

function startFreshRound(): void {
  sharedRound = null;
  round = createRound(createSeed());
  puzzle = createPuzzleState();
  choice = null;
  phase = "puzzle";
  shareNotice = "";
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  render();
}

function choosePuzzleSlot(slot: PuzzleSlot): void {
  if (phase !== "puzzle") return;
  puzzle = selectPuzzleSlot(puzzle, slot);
  if (isPuzzleSolved(puzzle)) {
    phase = "puzzleClear";
    render();
    window.setTimeout(() => {
      phase = "choosing";
      render();
    }, 1150);
    return;
  }
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
    text: `この冷蔵庫、誰んち？ 中身を見れば分かるらしい。${choice === round.correct ? "俺は当てた。" : "俺は外した。"}やってみて。`,
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

function characterImage(characterId: CharacterId, className: string): string {
  const character = getCharacter(characterId);
  return `<img class="${className}" src="${character.image}" alt="${character.revealName}">`;
}

function characterCard(characterId: CharacterId, index: number): string {
  const selected = choice === characterId;
  return `
    <button class="character-card ${selected ? "selected" : ""}" data-choice="${characterId}" ${phase === "choosing" ? "" : "disabled"} aria-label="候補 ${index + 1}">
      ${characterImage(characterId, "character-image")}
      <span class="candidate-number">${index + 1}</span>
    </button>`;
}

function puzzleSlotMarkup(itemId: PuzzleItemId, slot: PuzzleSlot): string {
  const item = PUZZLE_ITEMS[itemId];
  const selected = puzzle.selected === slot;
  return `
    <button class="puzzle-slot ${selected ? "selected" : ""}" data-puzzle-slot="${slot}" ${phase === "puzzle" ? "" : "disabled"} aria-label="マス ${slot + 1} ${item.label}">
      <img src="${item.image}" alt="${item.label}">
      <strong>${item.label}</strong>
    </button>`;
}

function puzzleMarkup(): string {
  return `
    <section class="puzzle-fridge" aria-label="冷蔵庫の3×3整理パズル">
      <div class="puzzle-fridge-top"><span>HIETA</span><strong>手数 ${puzzle.moves}</strong></div>
      <div class="puzzle-grid">
        ${puzzle.slots.map((item, slot) => puzzleSlotMarkup(item, slot)).join("")}
      </div>
      ${phase === "puzzleClear" ? `<div class="clear-label"><strong>CLEAR!</strong><span>${puzzle.moves}手で整理完了</span></div>` : ""}
    </section>
    <p class="puzzle-help">入れ替える2つを順番にタップして、同じ種類を1段ずつそろえよう</p>`;
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
        ${characterImage(round.correct, "answer-character")}
      </div>
      <h2>${message}</h2>
      <p class="clue-reveal">ちなみに、手に持っていた物は正解と一切関係ありません。</p>
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
  const puzzlePhase = phase === "puzzle" || phase === "puzzleClear";
  const isWaiting = phase === "pause";
  const rule = puzzlePhase ? "スイーツを種類ごとに1段へそろえて！" : "で、この冷蔵庫の持ち主は誰？";

  root.innerHTML = `
    <main class="game-shell">
      <header class="game-header">
        <p class="collection-name">知らんがなゲームス #01</p>
        <h1>ヒエヒエ冷蔵庫</h1>
        <p class="rule ${puzzlePhase ? "" : "twist-rule"}">${rule}</p>
        ${sharedRound && phase !== "result" ? `<p class="incoming-badge">友達と同じ問題です</p>` : ""}
      </header>

      ${puzzlePhase ? puzzleMarkup() : `
        <section class="fridge-scene ${isWaiting ? "thinking" : ""}" aria-label="甘い物でいっぱいの冷蔵庫">
          <img src="./assets/hiehie-fridge.webp" alt="プリン、ケーキ、アイスなどの甘い物がぎっしり詰まった冷蔵庫">
          ${isWaiting ? `<div class="thinking-label">判 定 中</div>` : ""}
        </section>
      ${phase !== "result" ? `
        <section class="choices" aria-label="持ち主の候補">
          ${round.order.map(characterCard).join("")}
        </section>
        <p class="fake-hint">手に持ってるもの……たぶんヒントです。</p>
      ` : resultMarkup()}`}
    </main>`;

  root.querySelectorAll<HTMLButtonElement>("[data-puzzle-slot]").forEach((button) => {
    button.addEventListener("click", () => choosePuzzleSlot(Number(button.dataset.puzzleSlot) as PuzzleSlot));
  });
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
