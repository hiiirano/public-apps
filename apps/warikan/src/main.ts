import "./style.css";
import type { Level } from "./types";
import { calculate, differenceText, nameOf } from "./warikan";
import { load, save } from "./storage";
const state = load(),
  app = document.querySelector<HTMLDivElement>("#app")!;
const labels: Record<Level, string> = {
    gift: "おごり",
    less: "少なめ",
    normal: "ふつう",
    more: "多め",
  },
  levels = Object.keys(labels) as Level[];
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const yen = (n: number) => n.toLocaleString("ja-JP") + "円";
const art = (n: string, cls = "icon") =>
  `<img class="${cls}" src="./art/${n}.svg" alt="">`;
let copyText = "";
function persist() {
  document.querySelector("#save-status")!.textContent = save(state)
    ? "人数・名前・設定はこの端末に自動保存"
    : "端末に保存できません。画面を閉じると設定が失われます。";
}
function results() {
  const out = document.querySelector("#results")!;
  if (state.amount === "") {
    out.innerHTML = `<div class="empty">${art("plate", "empty-art")}<h2>お会計はいくら？</h2><p>合計を入れると、ここに1人分が出ます。</p></div>`;
    copyText = "";
    return;
  }
  try {
    const r = calculate(
      /^\d+$/.test(state.amount) ? Number(state.amount) : NaN,
      state.people,
      state.ratios,
      state.unit,
      state.host,
    );
    copyText =
      `本日の会計 ${yen(Number(state.amount))}\n` +
      state.people
        .map(
          (p, i) =>
            `${nameOf(p, i)}さん ${yen(r.amounts[i])}${i === state.host ? "（幹事・自分の分）" : ""}`,
        )
        .join("\n") +
      `\n集める額（幹事分含む） ${yen(r.collected)}\n${differenceText(r.difference)}${r.difference < 0 ? "（自分の分に追加）" : ""}\n${nameOf(state.people[state.host], state.host)}さんへお支払いください。`;
    out.innerHTML = `<div class="section-title"><h2>みんなのお支払い</h2><span class="pill">${state.people.length}人</span></div><p class="muted">${esc(nameOf(state.people[state.host], state.host))}さんへお支払い</p><div class="result-list">${state.people.map((p, i) => `<div class="result-person ${i === state.host ? "host-result" : ""}">${art("person" + (i % 4), "face")}<div><span>${esc(nameOf(p, i))}さん</span>${i === state.host ? "<small>幹事・受け取る側 / 自分の分</small>" : ""}<strong>${yen(r.amounts[i])}</strong></div></div>`).join("")}</div><div class="balance"><div>本日の会計 <b>${yen(Number(state.amount))}</b></div><div>集める額（幹事分含む） <b>${yen(r.collected)}</b></div><p class="difference">${differenceText(r.difference)}</p>${r.difference < 0 ? "<small>不足分は幹事の「自分の分」に追加します。</small>" : ""}<div>他の人から受け取る額 <b>${yen(r.received)}</b></div><div>幹事の実質負担 <b>${yen(r.hostActual)}</b></div></div><button id="copy" class="primary wide">${art("copy")}LINEに貼る文をコピー</button><p id="copy-status" role="status"></p><textarea id="copy-fallback" aria-label="LINEに貼る文" hidden readonly></textarea>`;
    document.querySelector("#copy")!.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyText);
        document.querySelector("#copy-status")!.textContent =
          "コピーしました。LINEに貼り付けて送れます。";
      } catch {
        const t =
          document.querySelector<HTMLTextAreaElement>("#copy-fallback")!;
        t.hidden = false;
        t.value = copyText;
        t.select();
        document.querySelector("#copy-status")!.textContent =
          "下の文を選択してコピーしてください。";
      }
    });
  } catch (e) {
    out.innerHTML = `<p role="alert" class="error">${esc((e as Error).message)}</p>`;
    copyText = "";
  }
}
function render() {
  app.innerHTML = `<header><div class="brand">WARIKAN <span>その場の割り勘</span></div><div class="hero"><div><h1>おいしい時間の、<br>お会計をさくっと。</h1><p>金額を入れて、みんなで割るだけ。</p></div><div class="hero-art">${art("beer", "beer")}${art("plate", "plate")}</div></div></header><main><div class="inputs"><section class="card amount-card"><label for="amount" class="step">01 本日のお会計</label><div class="amount-wrap"><input id="amount" inputmode="numeric" pattern="[0-9]*" maxlength="9" placeholder="0" value="${esc(state.amount)}" autocomplete="off"><span>円</span></div><div class="choices method">${["cash", "digital"].map((m) => `<button data-method="${m}" aria-pressed="${state.method === m}">${m === "cash" ? "現金" : "PayPayなど"}</button>`).join("")}</div><div class="round-row"><span>切り上げ単位</span><div class="choices units">${[1, 10, 100, 500].map((n) => `<button data-unit="${n}" aria-pressed="${state.unit === n}">${n}円</button>`).join("")}</div></div><button id="show-results" class="wide result-jump">割り勘の結果を見る</button></section><section class="card people-card"><div class="section-title"><h2>02 だれと割る？ <span>${state.people.length}人</span></h2><button id="add" aria-label="＋1人" ${state.people.length >= 100 ? "disabled" : ""}>${art("plus")}1人</button></div><p class="muted">名前は空欄でもOK。支払った人を幹事に。</p><div class="people">${state.people.map((p, i) => `<article class="person"><div class="person-head">${art("person" + (i % 4), "face")}<input data-name="${i}" aria-label="${i + 1}人目の名前" placeholder="${i + 1}人目" maxlength="30" value="${esc(p.name)}"><button data-remove="${i}" aria-label="${i + 1}人目を削除" ${state.people.length === 1 ? "disabled" : ""}>${art("trash")}</button></div><button class="host-choice" data-host="${i}" aria-pressed="${state.host === i}">${state.host === i ? "幹事 / 受け取る側" : "この人を幹事に"}</button><div class="choices levels">${levels.map((l) => `<button data-level="${l}" data-person="${i}" aria-pressed="${p.fixed === "" && p.level === l}">${labels[l]}</button>`).join("")}</div><label class="fixed">この人は<input data-fixed="${i}" inputmode="numeric" maxlength="9" placeholder="指定なし" value="${esc(p.fixed)}" aria-label="${i + 1}人目の固定額">円</label><small>固定額を入力すると優先（切り上げなし）</small></article>`).join("")}</div><details id="settings"><summary>${art("settings")} 傾斜の比率を変える</summary><p class="muted">固定額を引いた残りを、この比率で分けます。0は負担なし。</p><div class="ratio-grid">${levels.map((l) => `<label>${labels[l]}<input data-ratio="${l}" type="number" inputmode="decimal" min="0" max="100" step="0.1" value="${state.ratios[l]}"></label>`).join("")}</div><p>固定額の合計が会計を超える場合も指定額を維持し、差額をおつりとして表示します。</p></details></section></div><section class="card results" id="results" aria-label="計算結果" aria-live="polite"></section></main><div class="bottom"><button id="new">${art("refresh")}新しい会計</button><p>金額だけ消して、メンバーと設定はそのまま。</p><p id="save-status" role="status">人数・名前・設定はこの端末に自動保存</p></div><footer>登録不要。入力内容は外部に送信しません。<br>イラスト: Fluent Emoji (MIT) / アイコン: Tabler Icons (MIT)</footer>`;
  results();
}
app.addEventListener("input", (e) => {
  const el = e.target as HTMLInputElement;
  if (el.id === "amount") state.amount = el.value;
  else if (el.dataset.name !== undefined)
    state.people[+el.dataset.name].name = el.value;
  else if (el.dataset.fixed !== undefined)
    state.people[+el.dataset.fixed].fixed = el.value;
  else if (el.dataset.ratio)
    state.ratios[el.dataset.ratio as Level] =
      el.value === "" ? NaN : Number(el.value);
  else return;
  persist();
  results();
  if (el.dataset.fixed !== undefined)
    el.closest(".person")!
      .querySelectorAll<HTMLButtonElement>("[data-level]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(
            el.value === "" &&
              state.people[+el.dataset.fixed!].level === b.dataset.level,
          ),
        ),
      );
});
app.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest("button");
  if (!b) return;
  if (b.id === "show-results") {
    document
      .querySelector("#results")!
      .scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (b.id === "add")
    state.people.push({ name: "", level: "normal", fixed: "" });
  else if (b.dataset.remove !== undefined) {
    const i = +b.dataset.remove;
    state.people.splice(i, 1);
    state.host =
      state.host === i ? 0 : state.host > i ? state.host - 1 : state.host;
  } else if (b.dataset.host !== undefined) state.host = +b.dataset.host;
  else if (b.dataset.level) {
    const p = state.people[+b.dataset.person!];
    p.level = b.dataset.level as Level;
    p.fixed = "";
  } else if (b.dataset.method) {
    state.method = b.dataset.method;
    state.unit = state.method === "cash" ? 100 : 1;
  } else if (b.dataset.unit) state.unit = +b.dataset.unit;
  else if (b.id === "new") state.amount = "";
  else return;
  render();
  persist();
  if (b.id === "new")
    document.querySelector<HTMLInputElement>("#amount")!.focus();
  if (b.id === "add")
    document
      .querySelector<HTMLInputElement>(
        `[data-name="${state.people.length - 1}"]`,
      )!
      .focus();
});
render();
