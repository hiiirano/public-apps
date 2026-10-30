// 画面と動作の検査（テスト計画書 03 の E2E・画面・アクセシビリティ・通信・オフライン）。
// 使い方: npm run build && npx vite preview --port 4311 --host 127.0.0.1 を起動してから
//   npm run test:e2e   （URL と保存先は E2E_URL / E2E_OUT で変えられる）
import { chromium } from "playwright";
import fs from "node:fs";
import { createRequire } from "node:module";

const URL = process.env.E2E_URL || "http://127.0.0.1:4311/";
const OUT = process.env.E2E_OUT || new globalThis.URL("../test-results", import.meta.url).pathname;
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const ORIGIN = URL.replace(/\/$/, "").split("/").slice(0, 3).join("/");
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], audits: [], axe: [], external: [] };
const ok = (name, cond, detail = "") => report.checks.push({ name, ok: !!cond, detail: String(detail) });

const browser = await chromium.launch();

async function audit(page, label) {
  const r = await page.evaluate(() => {
    const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, small: [], tinyInput: [], overlaps: [] };
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0 && !el.closest("[hidden]") && !el.closest(".sr-only"); };
    const targets = [...document.querySelectorAll("button, a, input:not(.sr-only), select, label.file-btn, summary")].filter(vis)
      .filter((el) => !el.classList.contains("skip"));
    for (const el of targets) { const b = el.getBoundingClientRect(); if (b.width < 44 - 0.5 || b.height < 44 - 0.5) out.small.push(`${el.tagName}.${el.className} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20)}" ${Math.round(b.width)}x${Math.round(b.height)}`); }
    for (const el of document.querySelectorAll("input, select")) { if (!vis(el) || el.type === "checkbox") continue; if (parseFloat(getComputedStyle(el).fontSize) < 16) out.tinyInput.push(el.name || el.className); }
    // 画面に固定の部品（切り替え・お知らせ・記録中の帯）はスクロールで重なるので除く
    const fixed = (el) => !!el.closest(".tabbar, .toast, .session");
    const boxes = targets.filter((el) => !fixed(el)).map((el) => [el, el.getBoundingClientRect()]);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const [a, A] = boxes[i], [b, B] = boxes[j]; if (a.contains(b) || b.contains(a)) continue;
      const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (w > 1 && h > 1) out.overlaps.push(`${a.className}|${b.className}`);
    }
    // 固定の部品どうし・固定の部品の中の重なり
    const fx = targets.filter(fixed).map((el) => [el, el.getBoundingClientRect()]);
    for (let i = 0; i < fx.length; i++) for (let j = i + 1; j < fx.length; j++) {
      const [a, A] = fx[i], [b, B] = fx[j]; if (a.contains(b) || b.contains(a)) continue;
      const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (w > 1 && h > 1) out.overlaps.push(`固定 ${a.className}|${b.className}`);
    }
    return out;
  });
  report.audits.push({ label, ...r });
}

async function runAxe(page, label) {
  await page.addScriptTag({ path: AXE });
  const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target.join(" ") })));
  report.axe.push({ label, violations: res });
}

const fresh = async (page) => {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
};
const tabTo = (page, name) => page.click(`.tab:has-text("${name}")`);

// ---- 4幅 × ライト/ダーク の画面検査 ----
for (const scheme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: scheme, locale: "ja-JP", deviceScaleFactor: 1, bypassCSP: true }); // axe を差し込むため（CSP は動作の確認で見る）
    const page = await ctx.newPage();
    page.on("request", (r) => { if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) report.external.push(r.url()); });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await fresh(page);
    const tag = `${width}-${scheme}`;
    const shots = [];
    const step = async (name, fn) => {
      await fn?.();
      await page.waitForTimeout(150);
      await audit(page, `${tag} ${name}`);
      if (scheme === "light" || width === 390) await runAxe(page, `${tag} ${name}`);
      const file = `${tag}-${shots.length + 1}-${name}.png`;
      await page.screenshot({ path: `${OUT}/${file}`, fullPage: true });
      shots.push(file);
    };
    await step("home-empty");
    await step("home-demo", async () => { await page.click('[data-act="demo"]'); });
    await step("workout", async () => {
      await page.click('[data-fk="start-last"]');
      await page.click('[data-fk="rec-leg-press"]');
      await page.click('[data-fk="inc-w-leg-press"]');
      await page.click('[data-fk="rec-leg-press"]');
    });
    await step("picker", async () => {
      await page.click('[data-act="toggle-picker"]');
      await page.click('[data-act="picker-part"][data-part="chest"]');
    });
    await step("summary", async () => {
      await page.click('[data-act="close-picker"]');
      await page.click('[data-act="finish"]');
    });
    await step("history", async () => {
      await page.click('[data-act="close-summary"]');
      await tabTo(page, "履歴");
      await page.click(".h-head >> nth=0");
    });
    await step("exercises", async () => { await tabTo(page, "種目"); });
    await step("detail", async () => { await page.click('[data-fk="lib-chest-press"]'); });
    await step("settings", async () => { await tabTo(page, "設定"); });
    ok(`${tag} ページエラーなし`, errors.length === 0, errors.join(" / "));
    await ctx.close();
  }
}

// ---- 動作の確認（390 ライト）----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ja-JP" });
  const page = await ctx.newPage();
  page.on("request", (r) => { if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) report.external.push(r.url()); });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  page.on("dialog", (d) => { errors.push(`dialog: ${d.message()}`); d.dismiss(); });
  await fresh(page);
  ok("初めは上半身をすすめる", (await page.textContent(".rec-title")) === "上半身の日");
  ok("おすすめに絵が出る", (await page.$$(".mini-tiles img.art")).length === 4);

  // 1回目: 種目を選んで始める
  await page.click('text=種目を選んで始める');
  ok("種目選びが開く", await page.isVisible("#picker"));
  const allNames = await page.$$eval(".tile-name", (els) => els.map((e) => e.textContent));
  ok("マシンの見本がある", ["チェストプレス", "ラットプルダウン", "レッグプレス", "アブドミナル", "バイク"].every((n) => allNames.includes(n)), allNames.join());
  ok("種目に絵がある", (await page.$$("#picker .tile img.art")).length === allNames.length);
  await page.click('[data-act="picker-part"][data-part="chest"]');
  const chestNames = await page.$$eval(".tile-name", (els) => els.map((e) => e.textContent));
  ok("胸でしぼる", chestNames.includes("チェストプレス") && !chestNames.includes("レッグプレス"), chestNames.join());
  await page.click('.tile:has-text("チェストプレス")');
  ok("はじめての初期値 20kg×10", (await page.inputValue('[data-fk="in-w-chest-press"]')) === "20" && (await page.inputValue('[data-fk="in-r-chest-press"]')) === "10");
  for (let i = 0; i < 4; i++) await page.click('[aria-label="重さを2.5kgふやす"]');
  ok("＋で 30kg", (await page.inputValue('[data-fk="in-w-chest-press"]')) === "30");
  await page.click("text=1セット目を記録");
  ok("1セット目が並ぶ", (await page.textContent(".set-row")).replace(/\s/g, "").includes("30kg×10回"));
  ok("次の初期値は直前のセット", (await page.inputValue('[data-fk="in-w-chest-press"]')) === "30");
  await page.fill('[data-fk="in-r-chest-press"]', "８");
  await page.click("text=2セット目を記録");
  ok("全角の回数も読む", (await page.$$eval(".set-row", (els) => els[1].textContent.replace(/\s/g, ""))).includes("30kg×8回"));
  // バイク（分）
  await page.click('[data-act="toggle-picker"]');
  await page.click('[data-act="picker-part"][data-part="cardio"]');
  await page.click('.tile:has-text("バイク")');
  ok("バイクは重さの欄がない", (await page.$$('[data-fk="in-w-bike"]')).length === 0 && (await page.inputValue('[data-fk="in-r-bike"]')) === "10");
  await page.click('[aria-label="時間を1分ふやす"]');
  await page.click("text=1セット目を記録 >> nth=-1");
  // セットを消して元に戻す
  await page.click('[aria-label="チェストプレスの2セット目を消す"]');
  ok("セットを消す", (await page.$$("#card-chest-press .set-row")).length === 1);
  await page.click('#toast [data-act="undo"]');
  ok("元に戻す", (await page.$$("#card-chest-press .set-row")).length === 2);
  // 記録中の再読み込み
  await page.reload();
  ok("記録中を再読み込みで復元", (await page.$$("#card-chest-press .set-row")).length === 2 && (await page.$$("#card-bike .set-row")).length === 1);
  await page.click('[data-act="finish"]');
  ok("まとめが出る", (await page.textContent(".done-title")).includes("おつかれさま"));
  ok("まとめの総重量 540kg", (await page.textContent(".hero.done")).includes("540"));
  await page.click('[data-act="close-summary"]');
  ok("次は下半身をすすめる", (await page.textContent(".rec-title")) === "休む日" || (await page.textContent(".rec-title")) === "下半身の日");

  // 2回目: 前回と同じ種目 → 前回の記録が初期値、伸びたら分かる
  await page.click('[data-fk="start-last"]');
  ok("前回と同じ種目で始まる", (await page.$$(".ex-card")).length === 2);
  ok("前回の記録が見える", (await page.textContent("#card-chest-press .prev")).includes("30kg×10 / 30kg×8"));
  ok("前回の値が初期値", (await page.inputValue('[data-fk="in-w-chest-press"]')) === "30" && (await page.inputValue('[data-fk="in-r-chest-press"]')) === "10");
  await page.click('[aria-label="重さを2.5kgふやす"]');
  ok("記録前に自己ベストと分かる", (await page.textContent("#hint-chest-press")).includes("自己ベスト"));
  await page.click("#card-chest-press .btn-record");
  ok("自己ベストのお知らせ", (await page.textContent("#toast")).includes("自己ベスト"));
  ok("自己ベストの印", (await page.$$("#card-chest-press .b-record")).length === 1);
  await page.fill('[data-fk="in-w-chest-press"]', "30");
  await page.fill('[data-fk="in-r-chest-press"]', "9");
  await page.click("#card-chest-press .btn-record");
  ok("前回より上の印", (await page.$$("#card-chest-press .b-up")).length === 1 && (await page.textContent("#toast")).includes("前回より上"));
  await page.click('[aria-label="バイクを今日の記録から外す"]');
  await page.click('[data-act="finish"]');
  ok("伸びた種目がまとめに出る", (await page.textContent(".done-list")).includes("前回より"));
  await page.click('[data-act="close-summary"]');

  // 履歴
  await tabTo(page, "履歴");
  ok("履歴に2回", (await page.$$(".h-card")).length === 2);
  await page.click(".h-head >> nth=0");
  await page.click("text=この日の記録を消す");
  ok("履歴を消す", (await page.$$(".h-card")).length === 1);
  await page.click('#toast [data-act="undo"]');
  ok("履歴を元に戻す", (await page.$$(".h-card")).length === 2);

  // 種目: 自作（危ない文字も無害に出る）
  await tabTo(page, "種目");
  await page.click('[data-act="new-ex"]');
  await page.click(".ex-form button[type=submit]");
  ok("名前が空の注意", (await page.textContent(".field-msg")).includes("名前"));
  const evil = "<img src=x onerror=f()>";
  await page.evaluate(() => { window.f = () => { window.__x = 1; }; });
  await page.fill('[name="name"]', evil);
  await page.selectOption('[name="part"]', "back");
  await page.click(".ex-form button[type=submit]");
  ok("自作の種目が一覧に出る", (await page.$$eval(".tile-name", (els) => els.map((e) => e.textContent))).includes(evil));
  ok("名前は文字として出る", (await page.evaluate(() => window.__x)) === undefined && (await page.$$(".tile-name img")).length === 0);
  await page.click(`.tile:has-text("チェストプレス")`);
  ok("伸びのグラフ", (await page.$$(".chart .c-dot")).length === 2);
  ok("自己ベストの表示", (await page.textContent(".best")).includes("32.5kg"));
  await page.click("text=使わないので隠す");
  await page.click('[data-act="close-detail"]');
  ok("隠した種目", (await page.textContent(".hidden-list")).includes("チェストプレス"));

  // 設定: 色・壊れた保存・前の版
  await tabTo(page, "設定");
  await page.click('[data-act="theme"][data-v="dark"]');
  ok("暗い色に切り替え", (await page.getAttribute("html", "data-theme")) === "dark");
  await page.reload();
  ok("色の設定が残る", (await page.getAttribute("html", "data-theme")) === "dark");
  await tabTo(page, "設定");
  await page.click('[data-act="theme"][data-v="auto"]');
  await page.click('[data-act="wipe"]');
  await page.click('[data-act="wipe-ok"]');
  await tabTo(page, "履歴");
  ok("すべて消す", (await page.textContent("#view")).includes("まだ記録がありません"));

  await page.evaluate(() => localStorage.setItem("gym-log.v2", '{"v":2,"exercises":"broken"'));
  await page.reload();
  ok("壊れた保存でも開ける", (await page.textContent(".rec-title")) === "上半身の日");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("gymlog.exercises.v1", JSON.stringify([{ id: "leg-press", name: "レッグプレス", kind: "machine", group: "lower", metric: "reps" }]));
    localStorage.setItem("gymlog.workouts.v1", JSON.stringify([{ id: "old1", date: "2026-10-01", startedAt: Date.parse("2026-10-01T10:00:00"), endedAt: Date.parse("2026-10-01T10:30:00"), exercises: [{ exerciseId: "leg-press", sets: [{ weight: 60, reps: 10 }] }] }]));
  });
  await page.reload();
  await tabTo(page, "履歴");
  ok("前の版の記録を引き継ぐ", (await page.$$(".h-card")).length === 1 && (await page.textContent(".h-card")).includes("600kg"));

  // キーボードだけで1セット記録
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.focus('[data-fk="start-rec"]');
  await page.keyboard.press("Enter");
  ok("キーボードで始めると重さの欄へ", await page.evaluate(() => document.activeElement?.classList.contains("num-input")));
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  ok("キーボードで記録", (await page.$$(".set-row")).length === 1, await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80)));
  ok("動作中のページエラー・確認ダイアログなし", errors.length === 0, errors.join(" / "));
  await ctx.close();
}

// ---- 記録の件数の上限（5,000回）----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await fresh(page);
  await page.click('[data-act="demo"]');
  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("gym-log.v2"));
    const base = st.workouts[0];
    st.workouts = Array.from({ length: 5001 }, (_, i) => ({ ...base, id: `m${i}` }));
    localStorage.setItem("gym-log.v2", JSON.stringify(st));
  });
  await page.reload();
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem("gym-log.v2")).workouts.length);
  ok("上限を超えた記録も再読み込みで消えない", kept === 5001, kept);
  await page.click('[data-fk="start-rec"]');
  ok("上限では始めずに知らせる", (await page.textContent("#toast")).includes("5,000回まで") && (await page.$$(".session")).length === 0);
  await ctx.close();
}

// ---- 保存できない環境 ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error("quota"); }; });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(URL);
  ok("保存できないお知らせ", await page.isVisible("#save-note"));
  await page.click('[data-fk="start-rec"]');
  await page.click(".btn-record >> nth=0");
  ok("保存できなくても記録できる", (await page.$$(".set-row")).length === 1 && errors.length === 0, errors.join());
  await ctx.close();
}

// ---- オフライン ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "allow" });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready.then(() => true), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await ctx.setOffline(true);
  let offlineOk = false;
  try {
    await page.reload({ waitUntil: "load" });
    await page.click('[data-fk="start-rec"]');
    await page.click(".btn-record >> nth=0");
    offlineOk = (await page.$$(".set-row")).length === 1;
  } catch (e) { report.offlineError = String(e); }
  ok("オフラインで開いて記録できる", offlineOk, report.offlineError || "");
  const cachedArt = await page.evaluate(async () => {
    const c = await caches.open((await caches.keys()).find((k) => k.startsWith("gym-log-")));
    return (await c.keys()).filter((r) => r.url.endsWith(".webp")).length;
  });
  ok("絵28点がオフライン用に保存されている", cachedArt === 28, String(cachedArt));
  await ctx.close();
}

await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
const bad = report.checks.filter((c) => !c.ok);
const auditBad = report.audits.filter((a) => a.overflowX || a.small.length || a.tinyInput.length || a.overlaps.length);
const axeBad = report.axe.filter((a) => a.violations.length);
console.log(`動作 ${report.checks.length - bad.length}/${report.checks.length} 合格`);
bad.forEach((c) => console.log("  NG", c.name, c.detail.slice(0, 300)));
console.log(`画面検査 ${report.audits.length - auditBad.length}/${report.audits.length} 合格`);
auditBad.forEach((a) => console.log("  NG", a.label, JSON.stringify({ x: a.overflowX, small: a.small.slice(0, 5), tiny: a.tinyInput, ov: a.overlaps.slice(0, 5) })));
console.log(`axe ${report.axe.length - axeBad.length}/${report.axe.length} 違反なし`);
axeBad.forEach((a) => console.log("  NG", a.label, JSON.stringify(a.violations)));
console.log(`外部への通信 ${new Set(report.external).size} 件`, [...new Set(report.external)].slice(0, 5).join(" "));
if (bad.length || auditBad.length || axeBad.length || report.external.length) process.exit(1);
