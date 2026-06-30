import "./style.css";
import type { Group } from "./types";
import {
  computeBalances,
  memberName,
  minimizeSettlements,
  totalAmount,
} from "./warikan";
import {
  loadGroups,
  loadCurrentId,
  newId,
  normalizeGroup,
  saveCurrentId,
  saveGroups,
} from "./storage";
import { buildShareUrl, readShareHash } from "./share";
import {
  type LlmSettings,
  extractExpenses,
  isLlmReady,
  loadLlmSettings,
  saveLlmSettings,
} from "./llm";

// ---- state ----
let groups: Group[] = loadGroups();
let currentId: string | null = loadCurrentId();
let llm: LlmSettings = loadLlmSettings();
let editingId: string | null = null;
let showLlm = false;

const app = document.querySelector<HTMLDivElement>("#app")!;

function persist(): void {
  saveGroups(groups);
  if (currentId) saveCurrentId(currentId);
}

function currentGroup(): Group | null {
  return groups.find((g) => g.id === currentId) ?? null;
}

function touch(g: Group): void {
  g.updatedAt = Date.now();
}

// ---- helpers ----
function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

// =============================================================
// 共有プレビュー（URL に #data= がある場合・読み取り専用）
// =============================================================
function renderSharePreview(g: Group): void {
  const balances = computeBalances(g);
  const settlements = minimizeSettlements(balances);
  app.innerHTML = `
    <header>
      <h1>👀 共有された割り勘</h1>
      <p class="sub">読み取り専用プレビュー。あなたの端末にはまだ保存されていません。</p>
    </header>
    <section class="card">
      <h2>${esc(g.name)}</h2>
      <p class="muted">メンバー ${g.members.length}人 / 支出 ${g.expenses.length}件 / 総額 ${yen(totalAmount(g))}</p>
      ${settlementHtml(g, settlements)}
    </section>
    <div class="actions">
      <button id="import-shared" class="primary">この割り勘を取り込む</button>
      <button id="discard-shared">破棄して自分のデータを開く</button>
    </div>
    <footer>${footerHtml()}</footer>
  `;
  app.querySelector("#import-shared")!.addEventListener("click", () => {
    const imported = normalizeGroup({ ...g, id: newId("g") });
    groups.push(imported);
    currentId = imported.id;
    persist();
    clearHash();
    render();
  });
  app.querySelector("#discard-shared")!.addEventListener("click", () => {
    clearHash();
    render();
  });
}

function clearHash(): void {
  if (typeof location !== "undefined") {
    history.replaceState(null, "", location.pathname + location.search);
  }
}

// =============================================================
// 精算結果（収支 + 最小送金リスト）— 共有プレビューとメインで共用
// =============================================================
function settlementHtml(g: Group, settlements: ReturnType<typeof minimizeSettlements>): string {
  const balances = computeBalances(g);
  const rows = balances
    .map((b) => {
      const cls = b.net > 0 ? "pos" : b.net < 0 ? "neg" : "zero";
      const label =
        b.net > 0 ? "受取" : b.net < 0 ? "支払" : "±0";
      return `<tr>
        <td>${esc(memberName(g.members, b.memberId))}</td>
        <td class="num">${yen(b.paid)}</td>
        <td class="num">${yen(b.owed)}</td>
        <td class="num ${cls}">${b.net > 0 ? "+" : ""}${yen(b.net)} <span class="tag">${label}</span></td>
      </tr>`;
    })
    .join("");

  const settleList =
    settlements.length === 0
      ? `<p class="muted">精算の必要はありません（全員清算済み）。</p>`
      : `<ul class="settle">` +
        settlements
          .map(
            (s) =>
              `<li><strong>${esc(memberName(g.members, s.from))}</strong> → <strong>${esc(memberName(g.members, s.to))}</strong> <span class="amt">${yen(s.amount)}</span></li>`,
          )
          .join("") +
        `</ul>`;

  return `
    <h3>収支</h3>
    <table class="balances">
      <thead><tr><th>名前</th><th class="num">立替</th><th class="num">負担</th><th class="num">差引</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <h3>精算（最小 ${settlements.length} 回の送金）</h3>
    ${settleList}
  `;
}

// =============================================================
// メイン画面
// =============================================================
function render(): void {
  // 共有 URL で開かれたら最優先でプレビュー
  if (typeof location !== "undefined") {
    const shared = readShareHash(location.hash);
    if (shared) {
      renderSharePreview(shared);
      return;
    }
  }

  if (groups.length === 0) {
    renderEmpty();
    return;
  }
  if (!currentGroup()) {
    currentId = groups[0].id;
  }
  const g = currentGroup()!;
  const settlements = minimizeSettlements(computeBalances(g));

  app.innerHTML = `
    <header>
      <h1>🧮 割り勘 <span class="brand">warikan</span></h1>
      <p class="sub">アカウント不要・この端末だけに保存。結果はURLで共有できます。</p>
    </header>

    <section class="card">
      <div class="grouprow">
        <label>グループ
          <select id="group-select">
            ${groups
              .map(
                (gr) =>
                  `<option value="${gr.id}" ${gr.id === currentId ? "selected" : ""}>${esc(gr.name)}</option>`,
              )
              .join("")}
          </select>
        </label>
        <button id="new-group">＋新規</button>
        <button id="rename-group">名前変更</button>
        <button id="delete-group" class="danger">削除</button>
      </div>
    </section>

    <section class="card">
      <h2>メンバー（${g.members.length}人）</h2>
      <div class="members">
        ${g.members
          .map(
            (m) =>
              `<span class="chip">${esc(m.name)} <button class="rm-member" data-id="${m.id}" title="削除">×</button></span>`,
          )
          .join("")}
      </div>
      <form id="member-form" class="inline">
        <input id="member-name" type="text" placeholder="名前を追加" maxlength="20" />
        <button type="submit">追加</button>
      </form>
    </section>

    <section class="card">
      <h2>支出（${g.expenses.length}件 / 総額 ${yen(totalAmount(g))}）</h2>
      ${g.members.length < 1 ? `<p class="muted">先にメンバーを追加してください。</p>` : expenseFormHtml(g)}
      ${expenseListHtml(g)}
    </section>

    <section class="card result">
      ${settlementHtml(g, settlements)}
    </section>

    <section class="card">
      <h2>共有・バックアップ</h2>
      <div class="actions">
        <button id="share-url" class="primary">共有リンクをコピー</button>
        <button id="export-json">JSONエクスポート</button>
        <button id="import-json">JSONインポート</button>
        <button id="toggle-llm">${showLlm ? "LLM設定を隠す" : "AI明細取り込み"}</button>
      </div>
      <p id="share-msg" class="muted"></p>
      ${showLlm ? llmHtml() : ""}
    </section>

    <footer>${footerHtml()}</footer>
  `;

  bindMain(g);
}

function renderEmpty(): void {
  app.innerHTML = `
    <header>
      <h1>🧮 割り勘 <span class="brand">warikan</span></h1>
      <p class="sub">アカウント不要・この端末だけに保存。結果はURLで共有できます。</p>
    </header>
    <section class="card">
      <h2>はじめる</h2>
      <p class="muted">旅行・飲み会・同棲など、精算したいグループを作成します。</p>
      <form id="first-group" class="inline">
        <input id="first-group-name" type="text" placeholder="グループ名（例: 沖縄旅行）" maxlength="30" />
        <button type="submit" class="primary">作成</button>
      </form>
    </section>
    <footer>${footerHtml()}</footer>
  `;
  app.querySelector("#first-group")!.addEventListener("submit", (e) => {
    e.preventDefault();
    const name =
      (app.querySelector<HTMLInputElement>("#first-group-name")!.value || "").trim() ||
      "割り勘";
    createGroup(name);
  });
}

function expenseFormHtml(g: Group): string {
  const editing = editingId
    ? g.expenses.find((e) => e.id === editingId)
    : null;
  const memberOpts = (selected?: string) =>
    g.members
      .map(
        (m) =>
          `<option value="${m.id}" ${m.id === selected ? "selected" : ""}>${esc(m.name)}</option>`,
      )
      .join("");
  const checks = g.members
    .map((m) => {
      const on = editing
        ? editing.participantIds.includes(m.id)
        : true; // 新規は全員参加が既定
      return `<label class="check"><input type="checkbox" class="part" value="${m.id}" ${on ? "checked" : ""}/> ${esc(m.name)}</label>`;
    })
    .join("");
  return `
    <form id="expense-form" class="expense-form">
      <div class="row">
        <input id="ex-title" type="text" placeholder="項目（例: 居酒屋）" maxlength="40" value="${editing ? esc(editing.title) : ""}" />
        <input id="ex-amount" type="number" min="0" step="1" placeholder="金額" value="${editing ? editing.amount : ""}" />
        <label>立替
          <select id="ex-payer">${memberOpts(editing?.payerId ?? g.members[0]?.id)}</select>
        </label>
      </div>
      <div class="parts">対象: ${checks}</div>
      <div class="row">
        <button type="submit" class="primary">${editing ? "更新" : "追加"}</button>
        ${editing ? `<button type="button" id="cancel-edit">キャンセル</button>` : ""}
      </div>
    </form>
  `;
}

function expenseListHtml(g: Group): string {
  if (g.expenses.length === 0) return `<p class="muted">まだ支出がありません。</p>`;
  const items = [...g.expenses]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(
      (e) => `
      <li>
        <div class="ex-main">
          <span class="ex-title">${esc(e.title)}</span>
          <span class="ex-amt">${yen(e.amount)}</span>
        </div>
        <div class="ex-sub muted">
          ${esc(memberName(g.members, e.payerId))} が立替 / 対象 ${e.participantIds.length}人
        </div>
        <div class="ex-actions">
          <button class="edit-ex" data-id="${e.id}">編集</button>
          <button class="del-ex danger" data-id="${e.id}">削除</button>
        </div>
      </li>`,
    )
    .join("");
  return `<ul class="expenses">${items}</ul>`;
}

function llmHtml(): string {
  return `
    <div class="llm">
      <p class="muted">明細やメモを貼ると AI が支出を抽出します（任意・OpenAI互換APIキーはこの端末のみに保存）。</p>
      <div class="row">
        <label><input type="checkbox" id="llm-enabled" ${llm.enabled ? "checked" : ""}/> 有効</label>
      </div>
      <div class="row">
        <input id="llm-endpoint" type="text" placeholder="エンドポイント" value="${esc(llm.endpoint)}" />
        <input id="llm-model" type="text" placeholder="モデル" value="${esc(llm.model)}" />
      </div>
      <div class="row">
        <input id="llm-key" type="password" placeholder="APIキー" value="${esc(llm.apiKey)}" />
        <button id="llm-save">設定を保存</button>
      </div>
      <textarea id="llm-text" placeholder="ここに明細/メモを貼り付け" rows="4"></textarea>
      <button id="llm-extract" ${isLlmReady(llm) ? "" : "disabled"}>AIで抽出して追加</button>
      <p id="llm-msg" class="muted"></p>
    </div>
  `;
}

function footerHtml(): string {
  return `データはこの端末のブラウザ(localStorage)だけに保存され、サーバーには送信されません。`;
}

// =============================================================
// イベント結線（full re-render なので毎回取り直す）
// =============================================================
function bindMain(g: Group): void {
  app.querySelector<HTMLSelectElement>("#group-select")!.addEventListener("change", (e) => {
    currentId = (e.target as HTMLSelectElement).value;
    editingId = null;
    persist();
    render();
  });
  app.querySelector("#new-group")!.addEventListener("click", () => {
    const name = (prompt("新しいグループ名") || "").trim();
    if (name) createGroup(name);
  });
  app.querySelector("#rename-group")!.addEventListener("click", () => {
    const name = (prompt("グループ名を変更", g.name) || "").trim();
    if (name) {
      g.name = name;
      touch(g);
      persist();
      render();
    }
  });
  app.querySelector("#delete-group")!.addEventListener("click", () => {
    if (!confirm(`「${g.name}」を削除しますか？この操作は取り消せません。`)) return;
    groups = groups.filter((x) => x.id !== g.id);
    currentId = groups[0]?.id ?? null;
    editingId = null;
    persist();
    render();
  });

  // メンバー
  app.querySelector("#member-form")!.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = app.querySelector<HTMLInputElement>("#member-name")!;
    const name = (input.value || "").trim();
    if (!name) return;
    g.members.push({ id: newId("m"), name });
    touch(g);
    persist();
    render();
  });
  app.querySelectorAll<HTMLButtonElement>(".rm-member").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id!;
      // この人が payer の支出があれば確認
      const used = g.expenses.some(
        (e) => e.payerId === id || e.participantIds.includes(id),
      );
      if (used && !confirm("このメンバーは支出に関係しています。削除すると関連も外れます。続けますか？")) return;
      g.members = g.members.filter((m) => m.id !== id);
      // 関連を掃除
      g.expenses = g.expenses.filter((e) => e.payerId !== id);
      for (const e of g.expenses) {
        e.participantIds = e.participantIds.filter((p) => p !== id);
        if (e.shares) delete e.shares[id];
      }
      touch(g);
      persist();
      render();
    });
  });

  // 支出フォーム
  const exForm = app.querySelector("#expense-form");
  if (exForm) {
    exForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = (app.querySelector<HTMLInputElement>("#ex-title")!.value || "").trim() || "支出";
      const amount = Math.max(0, Math.round(Number(app.querySelector<HTMLInputElement>("#ex-amount")!.value) || 0));
      const payerId = app.querySelector<HTMLSelectElement>("#ex-payer")!.value;
      const participantIds = Array.from(
        app.querySelectorAll<HTMLInputElement>(".part:checked"),
      ).map((c) => c.value);
      if (amount <= 0) {
        alert("金額を入力してください。");
        return;
      }
      if (participantIds.length === 0) {
        alert("対象メンバーを1人以上選んでください。");
        return;
      }
      if (editingId) {
        const ex = g.expenses.find((x) => x.id === editingId);
        if (ex) {
          ex.title = title;
          ex.amount = amount;
          ex.payerId = payerId;
          ex.participantIds = participantIds;
        }
        editingId = null;
      } else {
        g.expenses.push({
          id: newId("e"),
          title,
          amount,
          payerId,
          participantIds,
          createdAt: Date.now(),
        });
      }
      touch(g);
      persist();
      render();
    });
    const cancel = app.querySelector("#cancel-edit");
    if (cancel)
      cancel.addEventListener("click", () => {
        editingId = null;
        render();
      });
  }

  app.querySelectorAll<HTMLButtonElement>(".edit-ex").forEach((btn) =>
    btn.addEventListener("click", () => {
      editingId = btn.dataset.id!;
      render();
    }),
  );
  app.querySelectorAll<HTMLButtonElement>(".del-ex").forEach((btn) =>
    btn.addEventListener("click", () => {
      g.expenses = g.expenses.filter((e) => e.id !== btn.dataset.id);
      touch(g);
      persist();
      render();
    }),
  );

  // 共有・バックアップ
  app.querySelector("#share-url")!.addEventListener("click", async () => {
    const url = buildShareUrl(g, location.href);
    const msg = app.querySelector<HTMLParagraphElement>("#share-msg")!;
    try {
      await navigator.clipboard.writeText(url);
      msg.textContent = "共有リンクをコピーしました。相手はアカウント不要で結果を見られます。";
    } catch {
      msg.textContent = url;
    }
  });
  app.querySelector("#export-json")!.addEventListener("click", () => {
    downloadText(`warikan-${g.name}.json`, JSON.stringify(g, null, 2));
  });
  app.querySelector("#import-json")!.addEventListener("click", () => {
    importJson();
  });
  app.querySelector("#toggle-llm")!.addEventListener("click", () => {
    showLlm = !showLlm;
    render();
  });

  if (showLlm) bindLlm(g);
}

function bindLlm(g: Group): void {
  app.querySelector("#llm-save")!.addEventListener("click", () => {
    llm = {
      enabled: app.querySelector<HTMLInputElement>("#llm-enabled")!.checked,
      endpoint: app.querySelector<HTMLInputElement>("#llm-endpoint")!.value.trim(),
      model: app.querySelector<HTMLInputElement>("#llm-model")!.value.trim(),
      apiKey: app.querySelector<HTMLInputElement>("#llm-key")!.value.trim(),
    };
    saveLlmSettings(llm);
    render();
  });
  const extractBtn = app.querySelector<HTMLButtonElement>("#llm-extract");
  if (extractBtn)
    extractBtn.addEventListener("click", async () => {
      const text = app.querySelector<HTMLTextAreaElement>("#llm-text")!.value;
      const msg = app.querySelector<HTMLParagraphElement>("#llm-msg")!;
      msg.textContent = "抽出中…";
      try {
        const items = await extractExpenses(
          text,
          llm,
          g.members.map((m) => m.name),
        );
        let added = 0;
        for (const it of items) {
          const payer =
            g.members.find((m) => m.name === it.payer)?.id ??
            g.members[0]?.id;
          if (!payer) break;
          g.expenses.push({
            id: newId("e"),
            title: it.title,
            amount: it.amount,
            payerId: payer,
            participantIds: g.members.map((m) => m.id),
            createdAt: Date.now(),
          });
          added++;
        }
        touch(g);
        persist();
        msg.textContent = `${added}件を追加しました。`;
        setTimeout(render, 600);
      } catch (err) {
        msg.textContent = `抽出に失敗しました: ${(err as Error).message}`;
      }
    });
}

// ---- group lifecycle ----
function createGroup(name: string): void {
  const g: Group = {
    id: newId("g"),
    name,
    members: [],
    expenses: [],
    updatedAt: Date.now(),
  };
  groups.push(g);
  currentId = g.id;
  editingId = null;
  persist();
  render();
}

// ---- file io ----
function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        const g = normalizeGroup({ ...obj, id: newId("g") });
        groups.push(g);
        currentId = g.id;
        persist();
        render();
      } catch {
        alert("JSONの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

// 共有リンクで開かれた状態からハッシュが変わったら再描画
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", render);
}

render();
