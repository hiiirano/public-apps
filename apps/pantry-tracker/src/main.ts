import "./style.css";
import {
  type Item,
  type ItemDraft,
  ALL_CATEGORIES,
  ALL_LOCATIONS,
  UNIT_SUGGESTIONS,
} from "./types";
import {
  type ItemFilter,
  daysUntilExpiry,
  filterItems,
  isLowStock,
  sortItems,
  summarize,
  urgencyOf,
} from "./inventory";
import { loadItems, makeItem, normalizeDraft, saveItems } from "./storage";
import {
  type LlmSettings,
  extractItems,
  isLlmReady,
  loadLlmSettings,
  saveLlmSettings,
} from "./llm";

// ---- state ----
let items: Item[] = loadItems();
let llm: LlmSettings = loadLlmSettings();
let editingId: string | null = null;
const filter: ItemFilter = {};

const app = document.querySelector<HTMLDivElement>("#app")!;

function persist(): void {
  saveItems(items);
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

function opt(values: readonly string[], selected?: string): string {
  return values
    .map(
      (v) =>
        `<option value="${esc(v)}"${v === selected ? " selected" : ""}>${esc(
          v,
        )}</option>`,
    )
    .join("");
}

function urgencyLabel(item: Item, today: Date): string {
  const days = daysUntilExpiry(item, today);
  const u = urgencyOf(item, today);
  if (u === "expired") return `<span class="tag expired">期限切れ ${-days!}日</span>`;
  if (u === "soon") return `<span class="tag soon">あと${days}日</span>`;
  if (u === "near") return `<span class="tag near">あと${days}日</span>`;
  if (item.expiry) return `<span class="tag">${esc(item.expiry)}</span>`;
  return "";
}

function render(): void {
  const today = new Date();
  const sum = summarize(items, today);
  const visible = sortItems(filterItems(items, filter, today), today);

  app.innerHTML = `
    <h1>🧺 在庫管理</h1>
    <p class="sub">家にある物を、消費期限と残量で管理。データはこの端末のブラウザだけに保存されます。</p>

    <div class="card">
      <div class="badges">
        <div class="badge expired"><span class="num">${sum.expired}</span><span class="lbl">期限切れ</span></div>
        <div class="badge soon"><span class="num">${sum.soon}</span><span class="lbl">3日以内</span></div>
        <div class="badge low"><span class="num">${sum.lowStock}</span><span class="lbl">残量わずか</span></div>
        <div class="badge"><span class="num">${sum.total}</span><span class="lbl">総アイテム</span></div>
      </div>
    </div>

    <div class="card">
      <h2>${editingId ? "✏️ 在庫を編集" : "➕ 在庫を追加"}</h2>
      <form id="item-form">
        <div class="grid">
          <div class="full">
            <label>品名 *</label>
            <input name="name" required placeholder="例: 牛乳" autocomplete="off" />
          </div>
          <div>
            <label>数量</label>
            <input name="qty" type="number" min="0" step="any" value="1" />
          </div>
          <div>
            <label>単位</label>
            <input name="unit" list="units" value="個" autocomplete="off" />
            <datalist id="units">${opt(UNIT_SUGGESTIONS)}</datalist>
          </div>
          <div>
            <label>カテゴリ</label>
            <select name="category">${opt(ALL_CATEGORIES)}</select>
          </div>
          <div>
            <label>保管場所</label>
            <select name="location">${opt(ALL_LOCATIONS)}</select>
          </div>
          <div>
            <label>消費/賞味期限（任意）</label>
            <input name="expiry" type="date" />
          </div>
          <div>
            <label>最低在庫（0=通知なし）</label>
            <input name="minQty" type="number" min="0" step="any" value="0" />
          </div>
          <div class="full">
            <label>メモ（任意）</label>
            <input name="note" autocomplete="off" />
          </div>
        </div>
        <div class="row end">
          ${editingId ? '<button type="button" class="ghost" id="cancel-edit">キャンセル</button>' : ""}
          <button type="submit">${editingId ? "更新" : "追加"}</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>📋 在庫一覧</h2>
      <div class="filters">
        <select id="f-category"><option value="">カテゴリ：全部</option>${opt(ALL_CATEGORIES, filter.category)}</select>
        <select id="f-location"><option value="">場所：全部</option>${opt(ALL_LOCATIONS, filter.location)}</select>
        <label class="inline"><input type="checkbox" id="f-actionable" ${filter.actionableOnly ? "checked" : ""}/> 要対応のみ</label>
        <input id="f-query" placeholder="品名で検索" value="${esc(filter.query ?? "")}" style="flex:1;min-width:120px" />
      </div>
      ${
        visible.length === 0
          ? `<p class="empty">${items.length === 0 ? "まだ在庫がありません。上のフォームから追加してください。" : "条件に合う在庫がありません。"}</p>`
          : `<ul class="items">${visible.map((it) => itemRow(it, today)).join("")}</ul>`
      }
    </div>

    <div class="card">
      <details class="llm" ${isLlmReady(llm) ? "" : ""}>
        <summary>🤖 LLM拡張（任意）— テキストから在庫を取り込む</summary>
        <p class="hint">レシートやメモを貼り付けて、在庫アイテムを自動抽出します。OpenAI互換APIキーが必要です。<br>
        APIキーはこの端末のブラウザ（localStorage）にのみ保存され、サーバーには送られません。未設定でも本体機能はすべて使えます。</p>
        <div class="grid">
          <label class="inline full"><input type="checkbox" id="llm-enabled" ${llm.enabled ? "checked" : ""}/> LLM拡張を有効にする</label>
          <div class="full"><label>エンドポイント</label><input id="llm-endpoint" value="${esc(llm.endpoint)}" /></div>
          <div><label>モデル</label><input id="llm-model" value="${esc(llm.model)}" /></div>
          <div><label>APIキー</label><input id="llm-key" type="password" value="${esc(llm.apiKey)}" placeholder="sk-..." /></div>
        </div>
        <div class="row end"><button type="button" class="ghost" id="llm-save">設定を保存</button></div>
        <div class="full" style="margin-top:10px">
          <label>取り込むテキスト</label>
          <textarea id="llm-text" rows="4" placeholder="例: 牛乳1本 2026-07-01まで / 卵1パック / トイレットペーパー2袋"></textarea>
        </div>
        <div class="row end"><button type="button" id="llm-extract">抽出して追加</button></div>
        <p class="hint" id="llm-status"></p>
      </details>
    </div>

    <footer>pantry-tracker — オフラインで動く在庫管理。<a href="../">他のアプリ一覧</a></footer>
  `;

  wire(today);
}

function itemRow(it: Item, today: Date): string {
  const u = urgencyOf(it, today);
  const low = isLowStock(it);
  return `
    <li class="item ${u}" data-id="${it.id}">
      <div class="body">
        <div class="name">${esc(it.name)}</div>
        <div class="meta">
          <span class="tag">${esc(it.category)}</span>
          <span class="tag">${esc(it.location)}</span>
          ${urgencyLabel(it, today)}
          ${low ? '<span class="tag low">残量わずか</span>' : ""}
          ${it.note ? esc(it.note) : ""}
        </div>
      </div>
      <div class="qty">
        <button class="mini ghost" data-act="dec" title="減らす">−</button>
        <span class="val">${formatQty(it.qty)}${esc(it.unit)}</span>
        <button class="mini ghost" data-act="inc" title="増やす">＋</button>
      </div>
      <div class="actions">
        <button class="mini ghost" data-act="edit">編集</button>
        <button class="mini danger" data-act="del">削除</button>
      </div>
    </li>`;
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function wire(_today: Date): void {
  const form = document.querySelector<HTMLFormElement>("#item-form")!;

  // 編集中なら値を流し込む
  if (editingId) {
    const cur = items.find((i) => i.id === editingId);
    if (cur) fillForm(form, cur);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const draft = readForm(form);
    if (!draft.name) return;
    if (editingId) {
      items = items.map((i) =>
        i.id === editingId
          ? { ...i, ...draft, updatedAt: new Date().toISOString() }
          : i,
      );
      editingId = null;
    } else {
      items = [...items, makeItem(draft)];
    }
    persist();
    render();
  });

  document
    .querySelector("#cancel-edit")
    ?.addEventListener("click", () => {
      editingId = null;
      render();
    });

  // リストの行内アクション（委譲）
  document.querySelector("ul.items")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!btn) return;
    const li = btn.closest<HTMLLIElement>("li.item");
    const id = li?.dataset.id;
    if (!id) return;
    const act = btn.dataset.act;
    if (act === "del") {
      items = items.filter((i) => i.id !== id);
      if (editingId === id) editingId = null;
    } else if (act === "edit") {
      editingId = id;
    } else if (act === "inc" || act === "dec") {
      items = items.map((i) =>
        i.id === id
          ? {
              ...i,
              qty: Math.max(0, +(i.qty + (act === "inc" ? 1 : -1)).toFixed(2)),
              updatedAt: new Date().toISOString(),
            }
          : i,
      );
    }
    persist();
    render();
  });

  // フィルタ
  bindFilter("#f-category", "category");
  bindFilter("#f-location", "location");
  document.querySelector("#f-actionable")?.addEventListener("change", (e) => {
    filter.actionableOnly = (e.target as HTMLInputElement).checked;
    render();
  });
  const q = document.querySelector<HTMLInputElement>("#f-query");
  q?.addEventListener("input", () => {
    filter.query = q.value;
    const today = new Date();
    const visible = sortItems(filterItems(items, filter, today), today);
    const ul = document.querySelector("ul.items");
    if (ul) ul.innerHTML = visible.map((it) => itemRow(it, today)).join("");
  });

  wireLlm();
}

function bindFilter(sel: string, key: "category" | "location"): void {
  document.querySelector(sel)?.addEventListener("change", (e) => {
    const v = (e.target as HTMLSelectElement).value;
    filter[key] = v || undefined;
    render();
  });
}

function readForm(form: HTMLFormElement): ItemDraft {
  const fd = new FormData(form);
  return normalizeDraft({
    name: String(fd.get("name") ?? ""),
    qty: Number(fd.get("qty")),
    unit: String(fd.get("unit") ?? ""),
    category: fd.get("category") as ItemDraft["category"],
    location: fd.get("location") as ItemDraft["location"],
    expiry: (fd.get("expiry") as string) || undefined,
    minQty: Number(fd.get("minQty")),
    note: (fd.get("note") as string) || undefined,
  });
}

function fillForm(form: HTMLFormElement, it: Item): void {
  (form.elements.namedItem("name") as HTMLInputElement).value = it.name;
  (form.elements.namedItem("qty") as HTMLInputElement).value = String(it.qty);
  (form.elements.namedItem("unit") as HTMLInputElement).value = it.unit;
  (form.elements.namedItem("category") as HTMLSelectElement).value =
    it.category;
  (form.elements.namedItem("location") as HTMLSelectElement).value =
    it.location;
  (form.elements.namedItem("expiry") as HTMLInputElement).value =
    it.expiry ?? "";
  (form.elements.namedItem("minQty") as HTMLInputElement).value = String(
    it.minQty,
  );
  (form.elements.namedItem("note") as HTMLInputElement).value = it.note ?? "";
}

function wireLlm(): void {
  const status = document.querySelector<HTMLParagraphElement>("#llm-status")!;

  document.querySelector("#llm-save")?.addEventListener("click", () => {
    llm = {
      enabled:
        document.querySelector<HTMLInputElement>("#llm-enabled")!.checked,
      endpoint:
        document.querySelector<HTMLInputElement>("#llm-endpoint")!.value.trim(),
      model: document.querySelector<HTMLInputElement>("#llm-model")!.value.trim(),
      apiKey: document.querySelector<HTMLInputElement>("#llm-key")!.value.trim(),
    };
    saveLlmSettings(llm);
    status.textContent = "設定を保存しました。";
    status.className = "hint";
  });

  document
    .querySelector("#llm-extract")
    ?.addEventListener("click", async () => {
      const text =
        document.querySelector<HTMLTextAreaElement>("#llm-text")!.value;
      if (!isLlmReady(llm)) {
        status.textContent =
          "先にLLM拡張を有効化し、APIキー等を保存してください。";
        status.className = "warn";
        return;
      }
      status.textContent = "抽出中…";
      status.className = "hint";
      try {
        const drafts = await extractItems(text, llm);
        if (drafts.length === 0) {
          status.textContent = "抽出できる在庫が見つかりませんでした。";
          status.className = "warn";
          return;
        }
        items = [...items, ...drafts.map((d) => makeItem(d))];
        persist();
        render();
        // render後の新しい status 要素へ反映
        const s2 =
          document.querySelector<HTMLParagraphElement>("#llm-status");
        if (s2) {
          s2.textContent = `${drafts.length}件を追加しました。`;
          s2.className = "hint";
        }
        document.querySelector<HTMLDetailsElement>("details.llm")!.open = true;
      } catch (err) {
        status.textContent = `失敗: ${(err as Error).message}`;
        status.className = "warn";
      }
    });
}

render();
