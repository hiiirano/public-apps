import "./style.css";
import {
  type Card,
  type CardPair,
  type Deck,
  GRADE_INFO,
  ALL_GRADES,
} from "./types";
import { applyReview, buildQueue, summarizeDeck } from "./srs";
import {
  buildExport,
  loadCards,
  loadDecks,
  makeCard,
  makeDeck,
  parseImport,
  saveCards,
  saveDecks,
  seedIfFirstRun,
} from "./storage";
import {
  type LlmSettings,
  generateCards,
  isLlmReady,
  loadLlmSettings,
  saveLlmSettings,
} from "./llm";

// ---- state ----
seedIfFirstRun();
let decks: Deck[] = loadDecks();
let cards: Card[] = loadCards();
let llm: LlmSettings = loadLlmSettings();

type View = "home" | "deck" | "study";
let view: View = "home";
let currentDeckId: string | null = null;
let editingCardId: string | null = null;

// AI生成プレビュー（追加前の取捨選択用・非永続）
let aiPreview: CardPair[] = [];

// 学習セッション（非永続・in-memory）
interface Session {
  deckId: string;
  queue: Card[];
  idx: number;
  showBack: boolean;
  reviewed: number;
}
let session: Session | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;

function persist(): void {
  saveDecks(decks);
  saveCards(cards);
}

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!,
  );
}

function cardsOf(deckId: string): Card[] {
  return cards.filter((c) => c.deckId === deckId);
}

function currentDeck(): Deck | undefined {
  return decks.find((d) => d.id === currentDeckId);
}

// ---- render dispatch ----
function render(): void {
  if (view === "study" && session) renderStudy();
  else if (view === "deck" && currentDeck()) renderDeck();
  else {
    view = "home";
    renderHome();
  }
}

// ---- Home：デッキ一覧 ----
function renderHome(): void {
  const today = new Date();
  app.innerHTML = `
    <h1>🧠 暗記カード</h1>
    <p class="sub">テキストを貼ればAIがカードを自動生成。SM-2間隔反復で効率よく覚えられます。データはこの端末のブラウザにのみ保存されます。</p>

    <div class="card">
      <div class="row between">
        <h2>📚 デッキ</h2>
        <button id="new-deck">＋ 新しいデッキ</button>
      </div>
      ${
        decks.length === 0
          ? `<p class="empty">まだデッキがありません。「＋ 新しいデッキ」から始めましょう。</p>`
          : `<ul class="decks">${decks
              .map((d) => deckRow(d, today))
              .join("")}</ul>`
      }
    </div>

    ${llmPanel()}

    <div class="card">
      <details>
        <summary>💾 バックアップ（エクスポート / インポート）</summary>
        <p class="hint">この端末のデータをJSONで書き出し・読み込みできます。別の端末への移行やバックアップに使えます。インポートは既存データに追加されます。</p>
        <div class="row">
          <button type="button" class="ghost" id="export">エクスポート</button>
          <button type="button" class="ghost" id="import-btn">インポート</button>
          <input type="file" id="import-file" accept="application/json" hidden />
        </div>
        <p class="hint" id="io-status"></p>
      </details>
    </div>

    <footer>flashcards — オフラインで動く暗記カード。<a href="../">他のアプリ一覧</a></footer>
  `;
  wireHome();
}

function deckRow(d: Deck, today: Date): string {
  const s = summarizeDeck(cardsOf(d.id), today);
  return `
    <li class="deck" data-id="${d.id}">
      <div class="body">
        <div class="name">${esc(d.name)}</div>
        <div class="meta">
          <span class="tag total">${s.total}枚</span>
          ${s.due > 0 ? `<span class="tag due">復習 ${s.due}</span>` : ""}
          ${s.fresh > 0 ? `<span class="tag fresh">新規 ${s.fresh}</span>` : ""}
          ${s.due === 0 && s.fresh === 0 ? `<span class="tag done">今日はなし</span>` : ""}
        </div>
      </div>
      <div class="actions">
        <button class="mini ghost" data-act="open">開く</button>
        <button class="mini danger" data-act="del-deck">削除</button>
      </div>
    </li>`;
}

// ---- Deck：デッキ詳細 ----
function renderDeck(): void {
  const today = new Date();
  const deck = currentDeck()!;
  const list = cardsOf(deck.id);
  const s = summarizeDeck(list, today);
  const studyCount = s.due + s.fresh;

  app.innerHTML = `
    <div class="row between top">
      <button class="ghost back" id="to-home">← デッキ一覧</button>
    </div>
    <h1>${esc(deck.name)}</h1>

    <div class="card">
      <div class="badges">
        <div class="badge due"><span class="num">${s.due}</span><span class="lbl">復習</span></div>
        <div class="badge fresh"><span class="num">${s.fresh}</span><span class="lbl">新規</span></div>
        <div class="badge"><span class="num">${s.total}</span><span class="lbl">総カード</span></div>
      </div>
      <div class="row end" style="margin-top:12px">
        <button id="start-study" ${studyCount === 0 ? "disabled" : ""}>
          ${studyCount === 0 ? "今日の学習は完了" : `▶ 今日の学習（${studyCount}枚）`}
        </button>
      </div>
    </div>

    <div class="card">
      <h2>🤖 AIでカードを作る</h2>
      <p class="hint">ノートや教科書の文章を貼り付けて「カードを生成」を押すと、AIが一問一答に変換します。プレビューで選んでから追加できます。${
        isLlmReady(llm)
          ? ""
          : '<br><b>LLM拡張が未設定です。</b>下部の「LLM拡張」で有効化してください（無料で手動追加も使えます）。'
      }</p>
      <textarea id="ai-text" rows="5" placeholder="例: 鎌倉幕府は1192年に源頼朝が開いた。執権は北条氏が世襲した。&#10;ここに覚えたい内容を貼り付け…"></textarea>
      <div class="row end"><button type="button" id="ai-gen" ${isLlmReady(llm) ? "" : "disabled"}>カードを生成</button></div>
      <p class="hint" id="ai-status"></p>
      ${aiPreview.length > 0 ? aiPreviewBlock() : ""}
    </div>

    <div class="card">
      <h2>${editingCardId ? "✏️ カードを編集" : "✍️ 手動でカードを追加"}</h2>
      <form id="card-form">
        <div class="full"><label>表（問い）*</label><textarea name="front" rows="2" required placeholder="例: 鎌倉幕府の成立年は？"></textarea></div>
        <div class="full" style="margin-top:8px"><label>裏（答え）*</label><textarea name="back" rows="2" required placeholder="例: 1192年（諸説あり）"></textarea></div>
        <div class="row end">
          ${editingCardId ? '<button type="button" class="ghost" id="cancel-edit">キャンセル</button>' : ""}
          <button type="submit">${editingCardId ? "更新" : "追加"}</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>🗂️ カード一覧（${list.length}）</h2>
      ${
        list.length === 0
          ? `<p class="empty">まだカードがありません。AI生成か手動追加で作りましょう。</p>`
          : `<ul class="cardlist">${list.map(cardRow).join("")}</ul>`
      }
    </div>

    <footer>flashcards — <a href="../">他のアプリ一覧</a></footer>
  `;
  wireDeck();
}

function aiPreviewBlock(): string {
  return `
    <div class="preview">
      <div class="row between">
        <b>生成結果（${aiPreview.length}枚）</b>
        <label class="inline"><input type="checkbox" id="prev-all" checked /> 全選択</label>
      </div>
      <ul class="cardlist">
        ${aiPreview
          .map(
            (p, i) => `
          <li class="pcard">
            <label class="inline"><input type="checkbox" class="prev-chk" data-i="${i}" checked /></label>
            <div class="body">
              <div class="front">${esc(p.front)}</div>
              <div class="back">${esc(p.back)}</div>
            </div>
          </li>`,
          )
          .join("")}
      </ul>
      <div class="row end">
        <button type="button" class="ghost" id="prev-discard">破棄</button>
        <button type="button" id="prev-add">選択したカードを追加</button>
      </div>
    </div>`;
}

function cardRow(c: Card): string {
  const status = c.reviews === 0 ? "新規" : c.due ? `次回 ${c.due}` : "";
  return `
    <li class="ccard" data-id="${c.id}">
      <div class="body">
        <div class="front">${esc(c.front)}</div>
        <div class="back">${esc(c.back)}</div>
        ${status ? `<div class="meta"><span class="tag">${esc(status)}</span></div>` : ""}
      </div>
      <div class="actions">
        <button class="mini ghost" data-act="edit">編集</button>
        <button class="mini danger" data-act="del">削除</button>
      </div>
    </li>`;
}

// ---- Study：学習セッション ----
function renderStudy(): void {
  const ss = session!;
  if (ss.idx >= ss.queue.length) {
    app.innerHTML = `
      <h1>🎉 おつかれさま！</h1>
      <div class="card center">
        <p class="big">このデッキの今日の学習が終わりました。</p>
        <p class="hint">${ss.reviewed}枚を復習しました。</p>
        <div class="row center" style="margin-top:12px">
          <button id="study-home">デッキ一覧へ</button>
          <button class="ghost" id="study-deck">このデッキを開く</button>
        </div>
      </div>`;
    document
      .querySelector("#study-home")
      ?.addEventListener("click", () => goHome());
    document
      .querySelector("#study-deck")
      ?.addEventListener("click", () => openDeck(ss.deckId));
    return;
  }

  const card = ss.queue[ss.idx];
  const remaining = ss.queue.length - ss.idx;
  app.innerHTML = `
    <div class="row between top">
      <button class="ghost back" id="study-quit">× 中断</button>
      <span class="counter">あと ${remaining} 枚</span>
    </div>
    <div class="card study">
      <div class="face front">${esc(card.front).replace(/\n/g, "<br>")}</div>
      ${
        ss.showBack
          ? `<hr><div class="face back">${esc(card.back).replace(/\n/g, "<br>")}</div>`
          : ""
      }
    </div>
    ${
      ss.showBack
        ? `<div class="grades">${ALL_GRADES.map(gradeBtn).join("")}</div>`
        : `<div class="row center"><button id="reveal" class="wide">答えを見る</button></div>`
    }
  `;
  wireStudy();
}

function gradeBtn(g: (typeof ALL_GRADES)[number]): string {
  const info = GRADE_INFO[g];
  return `<button class="grade g-${g}" data-grade="${g}">
    <span class="gl">${info.label}</span><span class="gh">${info.hint}</span>
  </button>`;
}

// ---- shared: LLM panel ----
function llmPanel(): string {
  return `
    <div class="card">
      <details class="llm" ${isLlmReady(llm) ? "" : ""}>
        <summary>🤖 LLM拡張（任意）— AIカード生成を有効にする</summary>
        <p class="hint">OpenAI互換のAPIキーを設定すると、デッキ画面でテキストからカードを自動生成できます。<br>
        APIキーはこの端末のブラウザ（localStorage）にのみ保存され、サーバーには送られません。未設定でも手動追加・学習はすべて使えます。</p>
        <div class="grid">
          <label class="inline full"><input type="checkbox" id="llm-enabled" ${llm.enabled ? "checked" : ""}/> LLM拡張を有効にする</label>
          <div class="full"><label>エンドポイント</label><input id="llm-endpoint" value="${esc(llm.endpoint)}" /></div>
          <div><label>モデル</label><input id="llm-model" value="${esc(llm.model)}" /></div>
          <div><label>APIキー</label><input id="llm-key" type="password" value="${esc(llm.apiKey)}" placeholder="sk-..." /></div>
        </div>
        <div class="row end"><button type="button" class="ghost" id="llm-save">設定を保存</button></div>
        <p class="hint" id="llm-status"></p>
      </details>
    </div>`;
}

// ---- navigation ----
function goHome(): void {
  view = "home";
  currentDeckId = null;
  editingCardId = null;
  aiPreview = [];
  session = null;
  render();
}

function openDeck(id: string): void {
  view = "deck";
  currentDeckId = id;
  editingCardId = null;
  aiPreview = [];
  render();
}

// ---- wiring: Home ----
function wireHome(): void {
  document.querySelector("#new-deck")?.addEventListener("click", () => {
    const name = prompt("デッキ名を入力してください", "新しいデッキ");
    if (name === null) return;
    const deck = makeDeck(name);
    decks = [...decks, deck];
    persist();
    openDeck(deck.id);
  });

  document.querySelector("ul.decks")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    const li = (e.target as HTMLElement).closest<HTMLLIElement>("li.deck");
    const id = li?.dataset.id;
    if (!id) return;
    const act = btn?.dataset.act;
    if (act === "del-deck") {
      const d = decks.find((x) => x.id === id);
      const n = cardsOf(id).length;
      if (!confirm(`「${d?.name}」を削除しますか？カード${n}枚も削除されます。`))
        return;
      decks = decks.filter((x) => x.id !== id);
      cards = cards.filter((c) => c.deckId !== id);
      persist();
      render();
    } else {
      openDeck(id);
    }
  });

  wireLlm();
  wireIo();
}

function wireIo(): void {
  const status = document.querySelector<HTMLParagraphElement>("#io-status");
  document.querySelector("#export")?.addEventListener("click", () => {
    const data = JSON.stringify(buildExport(decks, cards), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });
  const file = document.querySelector<HTMLInputElement>("#import-file");
  document
    .querySelector("#import-btn")
    ?.addEventListener("click", () => file?.click());
  file?.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (!f) return;
    const text = await f.text();
    const parsed = parseImport(text);
    if (!parsed) {
      if (status) {
        status.textContent = "読み込めませんでした（形式が不正です）。";
        status.className = "warn";
      }
      return;
    }
    // id 衝突は除外して追加
    const deckIds = new Set(decks.map((d) => d.id));
    const cardIds = new Set(cards.map((c) => c.id));
    const newDecks = parsed.decks.filter((d) => !deckIds.has(d.id));
    const newCards = parsed.cards.filter((c) => !cardIds.has(c.id));
    decks = [...decks, ...newDecks];
    cards = [...cards, ...newCards];
    persist();
    render();
  });
}

// ---- wiring: Deck ----
function wireDeck(): void {
  document.querySelector("#to-home")?.addEventListener("click", () => goHome());

  document.querySelector("#start-study")?.addEventListener("click", () => {
    const today = new Date();
    const queue = buildQueue(cardsOf(currentDeckId!), today);
    if (queue.length === 0) return;
    session = {
      deckId: currentDeckId!,
      queue,
      idx: 0,
      showBack: false,
      reviewed: 0,
    };
    view = "study";
    render();
  });

  // 手動追加 / 編集
  const form = document.querySelector<HTMLFormElement>("#card-form")!;
  if (editingCardId) {
    const cur = cards.find((c) => c.id === editingCardId);
    if (cur) {
      (form.elements.namedItem("front") as HTMLTextAreaElement).value =
        cur.front;
      (form.elements.namedItem("back") as HTMLTextAreaElement).value = cur.back;
    }
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const front = String(fd.get("front") ?? "").trim();
    const back = String(fd.get("back") ?? "").trim();
    if (!front || !back) return;
    if (editingCardId) {
      cards = cards.map((c) =>
        c.id === editingCardId
          ? { ...c, front, back, updatedAt: new Date().toISOString() }
          : c,
      );
      editingCardId = null;
    } else {
      cards = [...cards, makeCard(currentDeckId!, { front, back })];
    }
    persist();
    render();
  });
  document.querySelector("#cancel-edit")?.addEventListener("click", () => {
    editingCardId = null;
    render();
  });

  // カード一覧の行内アクション
  document.querySelector("ul.cardlist")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!btn) return;
    const li = btn.closest<HTMLLIElement>("li.ccard");
    const id = li?.dataset.id;
    if (!id) return;
    const act = btn.dataset.act;
    if (act === "del") {
      cards = cards.filter((c) => c.id !== id);
      if (editingCardId === id) editingCardId = null;
      persist();
      render();
    } else if (act === "edit") {
      editingCardId = id;
      render();
    }
  });

  wireAi();
}

function wireAi(): void {
  const status = document.querySelector<HTMLParagraphElement>("#ai-status");
  document.querySelector("#ai-gen")?.addEventListener("click", async () => {
    const text = document.querySelector<HTMLTextAreaElement>("#ai-text")!.value;
    if (!isLlmReady(llm)) return;
    if (!text.trim()) {
      if (status) {
        status.textContent = "テキストを入力してください。";
        status.className = "warn";
      }
      return;
    }
    if (status) {
      status.textContent = "生成中…（数秒かかります）";
      status.className = "hint";
    }
    try {
      const pairs = await generateCards(text, llm);
      if (pairs.length === 0) {
        if (status) {
          status.textContent = "カードを生成できませんでした。";
          status.className = "warn";
        }
        return;
      }
      aiPreview = pairs;
      render();
    } catch (err) {
      const s2 = document.querySelector<HTMLParagraphElement>("#ai-status");
      if (s2) {
        s2.textContent = `失敗: ${(err as Error).message}`;
        s2.className = "warn";
      }
    }
  });

  // プレビュー操作
  document.querySelector("#prev-all")?.addEventListener("change", (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    document
      .querySelectorAll<HTMLInputElement>(".prev-chk")
      .forEach((c) => (c.checked = checked));
  });
  document.querySelector("#prev-discard")?.addEventListener("click", () => {
    aiPreview = [];
    render();
  });
  document.querySelector("#prev-add")?.addEventListener("click", () => {
    const chosen: CardPair[] = [];
    document.querySelectorAll<HTMLInputElement>(".prev-chk").forEach((chk) => {
      if (chk.checked) {
        const i = Number(chk.dataset.i);
        if (aiPreview[i]) chosen.push(aiPreview[i]);
      }
    });
    if (chosen.length === 0) return;
    cards = [...cards, ...chosen.map((p) => makeCard(currentDeckId!, p))];
    aiPreview = [];
    persist();
    render();
  });
}

// ---- wiring: Study ----
function wireStudy(): void {
  document.querySelector("#study-quit")?.addEventListener("click", () => {
    if (currentDeckId) openDeck(currentDeckId);
    else goHome();
  });
  document.querySelector("#reveal")?.addEventListener("click", () => {
    session!.showBack = true;
    render();
  });
  document.querySelector(".grades")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    const grade = btn?.dataset.grade as (typeof ALL_GRADES)[number] | undefined;
    if (!grade) return;
    const ss = session!;
    const card = ss.queue[ss.idx];
    const today = new Date();
    const updated = applyReview(card, grade, today);
    cards = cards.map((c) => (c.id === updated.id ? updated : c));
    persist();
    ss.reviewed += 1;
    // 「もう一度」は当セッション末尾に再投入（取りこぼし防止・非永続）
    if (grade === "again") ss.queue.push(updated);
    ss.idx += 1;
    ss.showBack = false;
    render();
  });
}

// ---- shared: LLM settings ----
function wireLlm(): void {
  const status = document.querySelector<HTMLParagraphElement>("#llm-status");
  document.querySelector("#llm-save")?.addEventListener("click", () => {
    llm = {
      enabled: document.querySelector<HTMLInputElement>("#llm-enabled")!.checked,
      endpoint: document
        .querySelector<HTMLInputElement>("#llm-endpoint")!
        .value.trim(),
      model: document
        .querySelector<HTMLInputElement>("#llm-model")!
        .value.trim(),
      apiKey: document
        .querySelector<HTMLInputElement>("#llm-key")!
        .value.trim(),
    };
    saveLlmSettings(llm);
    if (status) {
      status.textContent = "設定を保存しました。";
      status.className = "hint";
    }
  });
}

render();
