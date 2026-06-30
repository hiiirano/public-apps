import "./style.css";
import {
  type Category,
  type Expense,
  type ExpenseDraft,
  type MonthBudget,
  ALL_CATEGORIES,
  CATEGORY_EMOJI,
  CATEGORY_HINT,
} from "./types";
import {
  budgetTotal,
  expensesOfMonth,
  monthKeyOf,
  monthOfDate,
  sortExpenses,
  summarize,
  toCsv,
  yen,
} from "./kakeibo";
import {
  budgetFor,
  loadBudgets,
  loadExpenses,
  makeExpense,
  normalizeDraft,
  saveBudgets,
  saveExpenses,
  todayYmd,
} from "./storage";
import {
  type LlmSettings,
  extractExpenses,
  isLlmReady,
  loadLlmSettings,
  saveLlmSettings,
} from "./llm";

// ---- state ----
let expenses: Expense[] = loadExpenses();
let budgets: Record<string, MonthBudget> = loadBudgets();
let llm: LlmSettings = loadLlmSettings();
let currentMonth: string = monthKeyOf(new Date());
let editingId: string | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;

function persistExpenses(): void {
  saveExpenses(expenses);
}
function persistBudgets(): void {
  saveBudgets(budgets);
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

/** 保有データに存在する月キー＋当月＋当月の前月を候補にする */
function monthOptions(): string[] {
  const set = new Set<string>([currentMonth]);
  for (const e of expenses) {
    const m = monthOfDate(e.date);
    if (m) set.add(m);
  }
  for (const k of Object.keys(budgets)) set.add(k);
  return [...set].sort().reverse();
}

function render(): void {
  const today = new Date();
  const budget = budgetFor(budgets, currentMonth);
  const sum = summarize(budget, expenses, today);
  const list = sortExpenses(expensesOfMonth(expenses, currentMonth));
  const editing = editingId
    ? (expenses.find((e) => e.id === editingId) ?? null)
    : null;

  app.innerHTML = `
    <h1>📒 家計簿 <span class="brand">kakeibo</span></h1>
    <p class="sub">使う前に向き合う家計簿。データはこの端末のブラウザだけに保存され、サーバーには送られません。登録不要・無料。</p>

    <div class="card">
      <div class="monthbar">
        <label class="inline">対象月
          <select id="month-select">${opt(monthOptions(), currentMonth)}</select>
        </label>
        <input type="month" id="month-pick" value="${currentMonth}" />
      </div>
    </div>

    ${dashboardCard(sum)}

    ${budgetCard(budget, sum.available)}

    <div class="card">
      <h2>${editing ? "✏️ 支出を編集" : "➕ 支出を記録"}</h2>
      <form id="exp-form">
        <div class="grid">
          <div>
            <label>日付</label>
            <input name="date" type="date" value="${esc(editing?.date ?? defaultExpDate())}" />
          </div>
          <div>
            <label>金額（円）</label>
            <input name="amount" type="number" min="0" step="1" inputmode="numeric" placeholder="例: 1200" value="${editing ? String(editing.amount) : ""}" />
          </div>
          <div>
            <label>分類</label>
            <select name="category">${opt(ALL_CATEGORIES, editing?.category ?? "必需")}</select>
          </div>
          <div class="full">
            <label>メモ（任意）</label>
            <input name="memo" autocomplete="off" placeholder="例: スーパー / ランチ" value="${esc(editing?.memo ?? "")}" />
          </div>
        </div>
        <p class="hint" id="cat-hint">${esc(CATEGORY_HINT[editing?.category ?? "必需"])}</p>
        <div class="row end">
          ${editing ? '<button type="button" class="ghost" id="cancel-edit">キャンセル</button>' : ""}
          <button type="submit">${editing ? "更新" : "記録"}</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>📋 ${esc(currentMonth)} の支出（${list.length}件）</h2>
      ${
        list.length === 0
          ? `<p class="empty">この月の支出はまだありません。上のフォームから記録してください。</p>`
          : `<ul class="items">${list.map(expRow).join("")}</ul>`
      }
      ${list.length > 0 ? `<div class="row end"><button type="button" class="ghost" id="export-csv">CSV出力</button><button type="button" class="ghost" id="export-json">JSON出力</button></div>` : ""}
    </div>

    ${reflectionCard(sum)}

    <div class="card">
      <details class="llm">
        <summary>🤖 LLM拡張（任意）— レシート/明細から支出を取り込む</summary>
        <p class="hint">レシートや明細を貼り付けて、支出を自動抽出します。OpenAI互換APIキーが必要です。<br>
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
          <textarea id="llm-text" rows="4" placeholder="例: 6/30 スーパー 2380円 / ランチ 980円 / 文庫本 760円"></textarea>
        </div>
        <div class="row end"><button type="button" id="llm-extract">抽出して追加</button></div>
        <p class="hint" id="llm-status"></p>
      </details>
    </div>

    <div class="card danger-zone">
      <div class="row" style="justify-content:space-between">
        <span class="hint">バックアップから戻す／全消去</span>
        <span>
          <label class="ghost-btn">JSON取り込み<input type="file" id="import-json" accept="application/json" hidden /></label>
          <button type="button" class="danger mini" id="wipe">全データ削除</button>
        </span>
      </div>
    </div>

    <footer>kakeibo — オフラインで動く家計簿。<a href="../">他のアプリ一覧</a></footer>
  `;

  wire();
}

function defaultExpDate(): string {
  // 対象月が当月なら今日、過去/未来月ならその月の1日
  const now = new Date();
  if (monthKeyOf(now) === currentMonth) return todayYmd(now);
  return `${currentMonth}-01`;
}

function dashboardCard(sum: ReturnType<typeof summarize>): string {
  const spentPct =
    sum.available > 0
      ? Math.min(100, Math.round((sum.spentTotal / sum.available) * 100))
      : sum.spentTotal > 0
        ? 100
        : 0;
  const savingsClass = sum.savingsOnTrack ? "ok" : "warn-text";
  return `
    <div class="card">
      <div class="badges">
        <div class="badge"><span class="num">${yen(sum.available)}</span><span class="lbl">使えるお金</span></div>
        <div class="badge"><span class="num">${yen(sum.spentTotal)}</span><span class="lbl">使った</span></div>
        <div class="badge ${sum.remainingTotal < 0 ? "over" : ""}"><span class="num">${yen(sum.remainingTotal)}</span><span class="lbl">残り</span></div>
      </div>
      <div class="bar" title="使えるお金に対する支出">
        <div class="bar-fill ${spentPct >= 100 ? "over" : ""}" style="width:${spentPct}%"></div>
      </div>
      <p class="savings ${savingsClass}">
        ${sum.savingsOnTrack ? "✅" : "⚠️"} このペースでの貯金見込み <b>${yen(sum.projectedSavings)}</b>
        （目標 ${yen(sum.savingsGoal)}）
      </p>
    </div>`;
}

function budgetCard(budget: MonthBudget, available: number): string {
  const bt = budgetTotal(budget);
  const overAlloc = bt > available && available > 0;
  const rows = ALL_CATEGORIES.map((c) => {
    return `
      <div class="brow">
        <span class="bname">${CATEGORY_EMOJI[c]} ${c}</span>
        <input class="bval" data-cat="${c}" type="number" min="0" step="1" inputmode="numeric" value="${budget.budgets[c] || 0}" />
      </div>`;
  }).join("");
  return `
    <div class="card">
      <details ${budget.income === 0 ? "open" : ""}>
        <summary>⚙️ ${esc(currentMonth)} の予算設定（収入・貯金目標・4分類）</summary>
        <div class="grid" style="margin-top:10px">
          <div><label>今月の収入</label><input id="b-income" type="number" min="0" step="1" inputmode="numeric" value="${budget.income || 0}" /></div>
          <div><label>貯金目標</label><input id="b-savings" type="number" min="0" step="1" inputmode="numeric" value="${budget.savingsGoal || 0}" /></div>
        </div>
        <p class="hint">使えるお金 = 収入 − 貯金目標 = <b>${yen(available)}</b>。これを4分類に配分します。</p>
        <div class="budgets">${rows}</div>
        <p class="hint ${overAlloc ? "warn-text" : ""}">配分合計 <b>${yen(bt)}</b> / 使えるお金 ${yen(available)}${overAlloc ? "（配分が使えるお金を超えています）" : ""}</p>
        <div class="row end">
          <button type="button" class="ghost" id="budget-auto">均等に自動配分</button>
          <button type="button" id="budget-save">予算を保存</button>
        </div>
      </details>
    </div>`;
}

function reflectionCard(sum: ReturnType<typeof summarize>): string {
  const rows = sum.byCategory
    .map((cs) => {
      const pct =
        cs.budget > 0
          ? Math.min(100, Math.round((cs.spent / cs.budget) * 100))
          : cs.spent > 0
            ? 100
            : 0;
      const projPct =
        cs.budget > 0
          ? Math.min(110, Math.round((cs.projected / cs.budget) * 100))
          : 0;
      const cls = cs.overBudget ? "over" : cs.projectedOver ? "pace" : "";
      const note = cs.overBudget
        ? `<span class="tag over">予算超過 ${yen(-cs.remaining)}</span>`
        : cs.projectedOver
          ? `<span class="tag pace">このペースだと月末 ${yen(cs.projected)}</span>`
          : `<span class="tag">残り ${yen(cs.remaining)}</span>`;
      return `
        <div class="cat">
          <div class="cat-head">
            <span class="bname">${CATEGORY_EMOJI[cs.category]} ${cs.category}</span>
            <span class="cat-amt">${yen(cs.spent)} / ${yen(cs.budget)}</span>
          </div>
          <div class="bar small">
            <div class="bar-fill ${cls}" style="width:${pct}%"></div>
            ${projPct > pct ? `<div class="bar-proj" style="left:${Math.min(100, projPct)}%" title="月末予測"></div>` : ""}
          </div>
          <div class="cat-note">${note}</div>
        </div>`;
    })
    .join("");
  return `
    <div class="card">
      <h2>📊 分類別の予算ペース</h2>
      <p class="hint">「このペースだと月末に超過」を先回りで警告します（バーンレート予測）。━ は月末の着地予測位置。</p>
      ${rows}
    </div>`;
}

function expRow(e: Expense): string {
  return `
    <li class="item cat-${e.category}" data-id="${e.id}">
      <div class="body">
        <div class="name">${yen(e.amount)} <span class="tag">${CATEGORY_EMOJI[e.category]} ${e.category}</span></div>
        <div class="meta">${esc(e.date)}${e.memo ? " ・ " + esc(e.memo) : ""}</div>
      </div>
      <div class="actions">
        <button class="mini ghost" data-act="edit">編集</button>
        <button class="mini danger" data-act="del">削除</button>
      </div>
    </li>`;
}

// ---- wiring ----
function wire(): void {
  // 月切替
  document.querySelector("#month-select")?.addEventListener("change", (e) => {
    currentMonth = (e.target as HTMLSelectElement).value;
    editingId = null;
    render();
  });
  document.querySelector("#month-pick")?.addEventListener("change", (e) => {
    const v = (e.target as HTMLInputElement).value;
    if (/^\d{4}-\d{2}$/.test(v)) {
      currentMonth = v;
      editingId = null;
      render();
    }
  });

  // 予算保存
  document.querySelector("#budget-save")?.addEventListener("click", saveBudgetFromForm);
  document.querySelector("#budget-auto")?.addEventListener("click", () => {
    const income = numVal("#b-income");
    const savings = numVal("#b-savings");
    const avail = Math.max(0, income - savings);
    const each = Math.floor(avail / ALL_CATEGORIES.length);
    document.querySelectorAll<HTMLInputElement>(".bval").forEach((el) => {
      el.value = String(each);
    });
  });

  // 支出フォーム
  const form = document.querySelector<HTMLFormElement>("#exp-form")!;
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const draft = readExpForm(form);
    if (draft.amount <= 0) return;
    if (editingId) {
      expenses = expenses.map((e) =>
        e.id === editingId ? { ...e, ...draft } : e,
      );
      editingId = null;
    } else {
      expenses = [...expenses, makeExpense(draft)];
    }
    persistExpenses();
    render();
  });
  form.querySelector<HTMLSelectElement>('[name="category"]')?.addEventListener(
    "change",
    (e) => {
      const hint = document.querySelector("#cat-hint");
      const c = (e.target as HTMLSelectElement).value as Category;
      if (hint) hint.textContent = CATEGORY_HINT[c] ?? "";
    },
  );
  document.querySelector("#cancel-edit")?.addEventListener("click", () => {
    editingId = null;
    render();
  });

  // 一覧の行アクション（委譲）
  document.querySelector("ul.items")?.addEventListener("click", (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!btn) return;
    const id = btn.closest<HTMLLIElement>("li.item")?.dataset.id;
    if (!id) return;
    if (btn.dataset.act === "del") {
      expenses = expenses.filter((e) => e.id !== id);
      if (editingId === id) editingId = null;
      persistExpenses();
      render();
    } else if (btn.dataset.act === "edit") {
      editingId = id;
      render();
      app.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // エクスポート
  document.querySelector("#export-csv")?.addEventListener("click", () => {
    const csv = "﻿" + toCsv(expensesOfMonth(expenses, currentMonth));
    download(`kakeibo-${currentMonth}.csv`, csv, "text/csv;charset=utf-8");
  });
  document.querySelector("#export-json")?.addEventListener("click", () => {
    const data = JSON.stringify({ expenses, budgets }, null, 2);
    download(`kakeibo-backup.json`, data, "application/json");
  });

  // インポート / 全消去
  document
    .querySelector<HTMLInputElement>("#import-json")
    ?.addEventListener("change", onImport);
  document.querySelector("#wipe")?.addEventListener("click", () => {
    if (
      confirm("この端末のkakeiboデータ（支出・予算）を全て削除します。よろしいですか？")
    ) {
      expenses = [];
      budgets = {};
      persistExpenses();
      persistBudgets();
      render();
    }
  });

  wireLlm();
}

function saveBudgetFromForm(): void {
  const b: MonthBudget = {
    month: currentMonth,
    income: numVal("#b-income"),
    savingsGoal: numVal("#b-savings"),
    budgets: { 必需: 0, 娯楽: 0, 文化: 0, 予備: 0 },
  };
  document.querySelectorAll<HTMLInputElement>(".bval").forEach((el) => {
    const c = el.dataset.cat as Category;
    b.budgets[c] = Math.max(0, Math.round(Number(el.value) || 0));
  });
  budgets = { ...budgets, [currentMonth]: b };
  persistBudgets();
  render();
}

function numVal(sel: string): number {
  const el = document.querySelector<HTMLInputElement>(sel);
  return Math.max(0, Math.round(Number(el?.value) || 0));
}

function readExpForm(form: HTMLFormElement): ExpenseDraft {
  const fd = new FormData(form);
  return normalizeDraft({
    date: String(fd.get("date") ?? ""),
    amount: Number(fd.get("amount")),
    category: fd.get("category") as Category,
    memo: (fd.get("memo") as string) || undefined,
  });
}

function download(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function onImport(ev: Event): void {
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(String(reader.result));
      if (Array.isArray(obj.expenses)) {
        expenses = loadFrom(obj.expenses);
        persistExpenses();
      }
      if (obj.budgets && typeof obj.budgets === "object") {
        budgets = { ...budgets, ...obj.budgets };
        persistBudgets();
      }
      render();
      alert("取り込みました。");
    } catch {
      alert("JSONの読み込みに失敗しました。");
    }
  };
  reader.readAsText(file);
}

/** インポート時の最小バリデーション（storage の正規化を通す） */
function loadFrom(raw: unknown[]): Expense[] {
  const saved = JSON.stringify(raw);
  try {
    localStorage.setItem("kakeibo.expenses", saved);
  } catch {
    // 無視
  }
  return loadExpenses();
}

function wireLlm(): void {
  const status = document.querySelector<HTMLParagraphElement>("#llm-status")!;

  document.querySelector("#llm-save")?.addEventListener("click", () => {
    llm = {
      enabled: document.querySelector<HTMLInputElement>("#llm-enabled")!.checked,
      endpoint: document.querySelector<HTMLInputElement>("#llm-endpoint")!.value.trim(),
      model: document.querySelector<HTMLInputElement>("#llm-model")!.value.trim(),
      apiKey: document.querySelector<HTMLInputElement>("#llm-key")!.value.trim(),
    };
    saveLlmSettings(llm);
    status.textContent = "設定を保存しました。";
    status.className = "hint";
  });

  document.querySelector("#llm-extract")?.addEventListener("click", async () => {
    const text = document.querySelector<HTMLTextAreaElement>("#llm-text")!.value;
    if (!isLlmReady(llm)) {
      status.textContent = "先にLLM拡張を有効化し、APIキー等を保存してください。";
      status.className = "warn";
      return;
    }
    status.textContent = "抽出中…";
    status.className = "hint";
    try {
      const drafts = await extractExpenses(text, llm, defaultExpDate());
      if (drafts.length === 0) {
        status.textContent = "抽出できる支出が見つかりませんでした。";
        status.className = "warn";
        return;
      }
      expenses = [...expenses, ...drafts.map((d) => makeExpense(d))];
      persistExpenses();
      render();
      const s2 = document.querySelector<HTMLParagraphElement>("#llm-status");
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
