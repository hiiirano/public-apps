// 画面と動作の検査（テスト計画書 03 の T3〜T7）。
// 使い方: npm run build && npx vite preview --port 4313 --host 127.0.0.1 を起動してから
//   npm run test:e2e   （URL と保存先は E2E_URL / E2E_OUT で変えられる）
// 端末の時計は 2026-10-23 12:00 に固定して調べる（見込みの数字を決まった値にするため）。
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const URL = process.env.E2E_URL || "http://127.0.0.1:4313/";
const OUT = process.env.E2E_OUT || new globalThis.URL("../test-results", import.meta.url).pathname;
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const NOW = new Date("2026-10-23T12:00:00");
const KEY = "kakeibo.notebook.v2";
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], audits: [], axe: [], external: [] };
const ok = (name, cond, detail = "") => report.checks.push({ name, ok: !!cond, detail: String(detail) });
const origin = new globalThis.URL(URL).origin;

// 見本の帳面（10月は1〜23日、9月は少し）
function sampleBook() {
  const ex = [];
  let n = 0;
  const add = (date, amount, cat, memo = "") => ex.push({ id: `s${n++}`, date, amount, cat, memo, at: n });
  add("2026-10-01", 78000, "home", "家賃");
  for (let d = 1; d <= 23; d++) {
    const dd = `2026-10-${String(d).padStart(2, "0")}`;
    if (d % 2) add(dd, 1800 + d * 37, "food", "スーパー");
    if (d % 3 === 0) add(dd, 1200, "eatout", "ランチ");
    if (d % 5 === 0) add(dd, 880, "transit");
    if (d === 12) add(dd, 6400, "social", "誕生日プレゼント");
    if (d === 18) add(dd, 3200, "hobby", "本");
    if (d === 20) add(dd, 2100, "daily", "洗剤とティッシュ、ほかにもいろいろ");
  }
  add("2026-09-10", 50000, "home");
  add("2026-09-12", 30000, "food");
  return { expenses: ex, budgets: { "2026-09": 130000 } };
}

const browser = await chromium.launch();

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ja-JP", acceptDownloads: true, ...opts });
  await ctx.clock.setFixedTime(NOW);
  const page = await ctx.newPage();
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(origin) && !u.startsWith("blob:") && !u.startsWith("data:")) report.external.push(u);
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => {
    errors.push(`ダイアログが出た: ${d.message()}`);
    d.dismiss();
  });
  return { ctx, page, errors };
}

async function audit(page, label) {
  const r = await page.evaluate(() => {
    const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, small: [], tinyInput: [], tinyText: [], overlaps: [] };
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0 && !el.closest("[hidden]") && !el.closest("details:not([open]) > :not(summary)"); };
    const targets = [...document.querySelectorAll("button, a, input:not([type=radio]):not(.sr-only), summary, label:has(input[type=radio]), label:has(input[type=file])")].filter(vis)
      .filter((el) => !el.classList.contains("skip"));
    for (const el of targets) { const b = el.getBoundingClientRect(); if (b.width < 44 - 0.5 || b.height < 44 - 0.5) out.small.push(`${el.tagName}.${el.className} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20)}" ${Math.round(b.width)}x${Math.round(b.height)}`); }
    for (const el of document.querySelectorAll("input")) { if (!vis(el) || el.type === "radio" || el.classList.contains("sr-only")) continue; if (parseFloat(getComputedStyle(el).fontSize) < 16) out.tinyInput.push(el.id || el.className); }
    // 本文（段落・ボタン・入力）の文字は 16px 以上。補足（.hint 等）は 13.5px 以上
    for (const el of document.querySelectorAll("p, li, button, label, dd, summary")) {
      if (!vis(el)) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const min = el.closest(".hint, .credit, .legend, .c-days, small, .stats dt, .b-name, .b-amt, .row-memo, .more-sum, .cats .hint") ? 13.5 : 16;
      if (fs < min - 0.01 && el.textContent.trim()) out.tinyText.push(`${el.tagName}.${el.className} ${fs}px`);
    }
    const boxes = targets.map((el) => [el, el.getBoundingClientRect()]);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const [a, A] = boxes[i], [b, B] = boxes[j]; if (a.contains(b) || b.contains(a)) continue;
      const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (w > 1 && h > 1 && !a.closest(".bottom-bar, .toast") && !b.closest(".bottom-bar, .toast")) out.overlaps.push(`${a.className}|${b.className}`);
    }
    out.tinyText = [...new Set(out.tinyText)];
    return out;
  });
  report.audits.push({ label, ...r });
}

async function runAxe(page, label) {
  await page.addScriptTag({ path: AXE });
  const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target.join(" ") })));
  report.axe.push({ label, violations: res });
}

// ---- T4・T5 画面検査（4幅 × ライト/ダーク × 空/記録あり）----
for (const scheme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    const { ctx, page, errors } = await newPage({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: scheme, deviceScaleFactor: 1, bypassCSP: true });
    await page.goto(URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const tag = `${width}-${scheme}`;
    await audit(page, `${tag} 空`);
    await page.screenshot({ path: `${OUT}/${tag}-1-empty.png`, fullPage: true });
    if (scheme === "light" || width === 390) await runAxe(page, `${tag} 空`);
    await page.evaluate(([k, b]) => localStorage.setItem(k, JSON.stringify(b)), [KEY, sampleBook()]);
    await page.reload();
    await page.locator("#amount").fill("1200");
    await page.click('label.cat:has(input[value="eatout"])');
    await audit(page, `${tag} 記録あり`);
    await page.screenshot({ path: `${OUT}/${tag}-2-filled.png`, fullPage: true });
    if (width === 390) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${OUT}/${tag}-3-first-view.png` });
    }
    if (scheme === "light" || width === 390) await runAxe(page, `${tag} 記録あり`);
    // 過去の月（ふりかえり）
    await page.click('[data-act="prev"]');
    await audit(page, `${tag} 9月`);
    if (width === 390) await page.screenshot({ path: `${OUT}/${tag}-4-past.png`, fullPage: true });
    if (scheme === "light" && width === 390) await runAxe(page, `${tag} 9月`);
    ok(`${tag} ページエラーなし`, errors.length === 0, errors.join(" / "));
    await ctx.close();
  }
}

async function importAndWait(page, file) {
  await page.evaluate(() => (document.querySelector("#toast").textContent = ""));
  await page.setInputFiles("#import-file", file);
  await page.waitForFunction(() => document.querySelector("#toast").textContent.trim() !== "", null, { timeout: 5000 });
}

// ---- T3 動作 ----
{
  const { ctx, page, errors } = await newPage();
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const text = (sel) => page.textContent(sel);
  ok("空のとき案内", (await text("#pace-body")).includes("まだ記録がありません"));
  ok("AI 連携・API キーの欄がない", !(await page.textContent("body")).match(/API|LLM|キーを/));
  ok("月の表示は1つ", (await page.$$(".month-title")).length === 1 && (await text("#month-title")) === "2026年10月");

  // 入力の誤り
  await page.click("#save-btn");
  ok("金額なしの注意", (await text("#amount-msg")).includes("金額を入れて"));
  ok("金額欄にフォーカスが戻る", await page.evaluate(() => document.activeElement?.id === "amount"));
  await page.fill("#amount", "abc");
  await page.click("#save-btn");
  ok("文字の注意", (await text("#amount-msg")).includes("数字"));
  await page.fill("#amount", "100000000");
  await page.click("#save-btn");
  ok("上限の注意", (await text("#amount-msg")).includes("99,999,999"));
  await page.fill("#amount", "0");
  await page.click("#save-btn");
  ok("0円の注意", (await text("#amount-msg")).includes("1円以上"));
  await page.fill("#amount", "１,２００円");
  await page.click("#save-btn");
  ok("費目なしの注意", (await text("#cat-msg")).includes("費目をえらんで") && (await page.$$(".row")).length === 0);

  // 金額 → 費目 → 書きこむ
  await page.click('label.cat:has(input[value="food"])');
  await page.click("#save-btn");
  ok("1件書ける（全角・カンマ・円）", (await page.$$(".row")).length === 1 && (await text(".row-amt")) === "¥1,200");
  ok("書いたあと欄が空になり費目も外れる", (await page.inputValue("#amount")) === "" && (await page.$$('input[name="cat"]:checked')).length === 0);
  ok("書いたお知らせと元に戻す", (await text("#toast")).includes("食費 1,200円 を書きました") && (await page.$$('#toast [data-act="undo"]')).length === 1);
  ok("月末の見込み（1,200 ÷ 23日 × 31日）", (await text(".big-num")) === "¥1,617", await text(".big-num"));
  ok("予算なしの案内", (await text("#pace-body")).includes("予算を決めると"));

  // Enter で書く
  await page.fill("#amount", "500");
  await page.click('label.cat:has(input[value="eatout"])');
  await page.press("#amount", "Enter");
  ok("Enter で書ける", (await page.$$(".row")).length === 2);

  // 予算 → 先回り警告
  await page.click('[data-act="go-budget"]');
  ok("予算を決めるで予算欄へ", await page.evaluate(() => document.activeElement?.id === "budget"));
  await page.fill("#budget", "2,000");
  await page.click('[data-act="budget-save"]');
  ok("このままだと予算をこえる", (await text(".verdict")).includes("このままだと予算を") && (await text(".verdict")).includes("¥291"), await text(".verdict"));
  ok("グラフに予算線と見込み線", (await page.$$(".c-budget")).length === 1 && (await page.$$(".c-proj.is-over")).length === 1);
  ok("1日あたりの額", (await text(".perday")).includes("残り 9日") && (await text(".perday")).includes("¥33"), await text(".perday"));
  await page.fill("#budget", "50000");
  await page.press("#budget", "Enter");
  ok("予算内のペース", (await text(".verdict")).includes("予算内のペース"));

  // 住まいはのばさない
  await page.fill("#amount", "49000");
  await page.click('label.cat:has(input[value="home"])');
  await page.click("#save-btn");
  ok("住まいはのばさず足す（49,000 + 1,700 ÷ 23 × 31）", (await text(".big-num")) === "¥51,291", await text(".big-num"));
  ok("もう予算をこえた", (await text(".verdict")).includes("予算を ¥700") && (await text(".verdict")).includes("こえています"), await text(".verdict"));
  await page.click('#toast [data-act="undo"]');
  ok("元に戻すで消える", (await page.$$(".row")).length === 2 && (await text(".verdict")).includes("予算内"));

  // 直す
  await page.click('.row:has(.row-cat:text("外食")) [data-act="edit"]');
  ok("直すで欄に入る", (await page.inputValue("#amount")) === "500" && (await page.isChecked('input[name="cat"][value="eatout"]')) && (await text("#h-entry")) === "記録を直す");
  await page.fill("#amount", "300");
  await page.click('label.cat:has(input[value="hobby"])');
  await page.click("#save-btn");
  ok("直せる", (await page.$$(".row")).length === 2 && (await text(".row:has(.row-cat:text('趣味')) .row-amt")) === "¥300" && (await text("#h-entry")) === "書きこむ");

  // 消す・元に戻す
  await page.click('.row:has(.row-cat:text("趣味")) [data-act="delete"]');
  ok("消せる", (await page.$$(".row")).length === 1);
  await page.click('#toast [data-act="undo"]');
  ok("消したのを元に戻す", (await page.$$(".row")).length === 2);

  // 日付とメモ、危ない文字
  await page.fill("#amount", "700");
  await page.click('label.cat:has(input[value="other"])');
  await page.click("#more summary");
  await page.fill("#date", "2026-09-15");
  await page.fill("#memo", '<img src=x onerror="window.__x=1">');
  await page.click("#save-btn");
  ok("ほかの月に書いたお知らせ", (await text("#toast")).includes("2026年9月のページに"));
  await page.click('[data-act="prev"]');
  ok("前の月へ", (await text("#month-title")) === "2026年9月" && (await page.$$(".row")).length === 1 && (await page.$$("#this-month:not([hidden])")).length === 1);
  ok("メモは文字として出る", (await text(".row-memo")).includes("<img") && (await page.$$(".row-memo img")).length === 0 && !(await page.evaluate(() => window.__x)));
  ok("過去の月はふりかえり", (await text("#h-pace")) === "この月のふりかえり" && (await text(".big-label")) === "この月の合計");
  ok("前の月は予算を引き継がない", (await text(".stats")).includes("なし"));
  await page.click('[data-act="this-month"]');
  await page.click('[data-act="next"]');
  ok("次の月は予算を引き継ぐ", (await text("#month-title")) === "2026年11月" && (await text("#budget-note")).includes("引き継いで") && (await text("#h-pace")) === "この月の予定");
  await page.click('[data-act="this-month"]');

  // キーボードだけで書く
  await page.focus("#amount");
  await page.keyboard.type("250");
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  ok("キーボードだけで書ける（矢印で食費→外食）", (await page.$$(".row")).length === 3 && (await text("#toast")).includes("250円"), await text("#toast"));

  // 再読み込みで残る
  await page.reload();
  ok("再読み込みで残る", (await page.$$(".row")).length === 3 && (await page.inputValue("#budget")) === "50,000", `${(await page.$$(".row")).length} ${await page.inputValue("#budget")}`);

  // 書き出し
  const [dj] = await Promise.all([page.waitForEvent("download"), page.click('[data-act="export-json"]')]);
  const jsonPath = path.join(OUT, "backup.json");
  await dj.saveAs(jsonPath);
  const backup = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  ok("JSON を書き出す", dj.suggestedFilename() === "kakeibo-2026-10-23.json" && backup.app === "kakeibo" && backup.expenses.length === 4 && backup.budgets["2026-10"] === 50000, `${dj.suggestedFilename()} ${backup.expenses.length} ${JSON.stringify(backup.budgets)}`);
  const [dc] = await Promise.all([page.waitForEvent("download"), page.click('[data-act="export-csv"]')]);
  const csvPath = path.join(OUT, "backup.csv");
  await dc.saveAs(csvPath);
  const csv = fs.readFileSync(csvPath, "utf8");
  ok("CSV を書き出す（BOM・見出し）", csv.startsWith("﻿日付,金額,費目,メモ,id") && csv.trim().split("\r\n").length === 5);

  // 全部消す → 読み込む
  await page.click('[data-act="wipe"]');
  ok("消す前に確かめる", await page.isVisible("#wipe-confirm"));
  await page.click('[data-act="wipe-no"]');
  ok("やめると何も消えない", (await page.$$(".row")).length === 3 && !(await page.isVisible("#wipe-confirm")));
  await page.click('[data-act="wipe"]');
  await page.click('[data-act="wipe-yes"]');
  ok("全部消せる", (await page.$$(".row")).length === 0 && (await page.inputValue("#budget")) === "");
  await importAndWait(page, jsonPath);
  ok("JSON を読み込む", (await page.$$(".row")).length === 3 && (await text("#toast")).includes("4件を読み込みました") && (await page.inputValue("#budget")) === "50,000", await text("#toast"));
  await importAndWait(page, jsonPath);
  ok("同じファイルを2回読んでも増えない", (await page.$$(".row")).length === 3 && (await text("#toast")).includes("同じ記録 4件"), await text("#toast"));
  await page.click('[data-act="wipe"]');
  await page.click('[data-act="wipe-yes"]');
  await importAndWait(page, csvPath);
  ok("CSV を読み込む", (await page.$$(".row")).length === 3 && (await text("#toast")).includes("4件を読み込みました"));
  await importAndWait(page, { name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{oops") });
  ok("読めないファイルの注意", (await text("#toast")).includes("読めませんでした") && (await page.$$(".row")).length === 3);

  // 前の版のデータ・壊れたデータ
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("kakeibo.expenses", JSON.stringify([{ id: "ex_1", date: "2026-10-02", amount: 980, category: "娯楽", memo: "映画", createdAt: "2026-10-02T00:00:00Z" }]));
    localStorage.setItem("kakeibo.budgets", JSON.stringify({ "2026-10": { month: "2026-10", income: 250000, savingsGoal: 50000, budgets: {} } }));
    localStorage.setItem("kakeibo.llm", JSON.stringify({ apiKey: "sk-test" }));
  });
  await page.reload();
  ok("前の版から引き継ぐ", (await text(".row-memo")) === "[娯楽] 映画" && (await page.inputValue("#budget")) === "200,000" && (await text("#toast")).includes("引き継ぎました"));
  ok("前の版の API キーを消す", (await page.evaluate(() => localStorage.getItem("kakeibo.llm"))) === null);
  await page.evaluate((k) => localStorage.setItem(k, "{broken"), KEY);
  await page.reload();
  ok("壊れた保存は初期状態で開き、元は取っておく", (await page.$$(".row")).length === 0 && (await page.evaluate(() => localStorage.getItem("kakeibo.notebook.v2.broken"))) === "{broken");
  ok("動作中のページエラーなし", errors.length === 0, errors.join(" / "));
  await ctx.close();
}

// ---- 保存できない環境 ----
{
  const { ctx, page, errors } = await newPage();
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  await page.goto(URL);
  await page.fill("#amount", "300");
  await page.click('label.cat:has(input[value="food"])');
  await page.click("#save-btn");
  ok("保存できなくても書ける・注意が出る", (await page.$$(".row")).length === 1 && (await page.isVisible("#save-note")), errors.join(" / "));
  await ctx.close();
}

// ---- T7 オフライン ----
{
  const { ctx, page } = await newPage({ serviceWorkers: "allow" });
  await page.goto(URL);
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready.then(() => true), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await ctx.setOffline(true);
  let offlineOk = false;
  try {
    await page.reload({ waitUntil: "load" });
    await page.fill("#amount", "400");
    await page.click('label.cat:has(input[value="food"])');
    await page.click("#save-btn");
    offlineOk = (await page.$$(".row")).length >= 1 && (await page.evaluate(() => document.fonts.check('700 16px "Kakeibo Mincho"')));
  } catch (e) {
    report.offlineError = String(e);
  }
  ok("オフラインで開いて書ける", offlineOk, report.offlineError || "");
  await ctx.close();
}

await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
const bad = report.checks.filter((c) => !c.ok);
const auditBad = report.audits.filter((a) => a.overflowX || a.small.length || a.tinyInput.length || a.tinyText.length || a.overlaps.length);
const axeBad = report.axe.filter((a) => a.violations.length);
console.log(`動作 ${report.checks.length - bad.length}/${report.checks.length} 合格`);
bad.forEach((c) => console.log("  NG", c.name, c.detail.slice(0, 300)));
console.log(`画面検査 ${report.audits.length - auditBad.length}/${report.audits.length} 合格`);
auditBad.forEach((a) => console.log("  NG", a.label, JSON.stringify({ x: a.overflowX, small: a.small.slice(0, 5), tiny: a.tinyInput, text: a.tinyText.slice(0, 5), ov: a.overlaps.slice(0, 5) })));
console.log(`axe ${report.axe.length - axeBad.length}/${report.axe.length} 違反なし`);
axeBad.forEach((a) => console.log("  NG", a.label, JSON.stringify(a.violations)));
console.log(`外部への通信 ${new Set(report.external).size} 件`, [...new Set(report.external)].slice(0, 5).join(" "));
if (bad.length || auditBad.length || axeBad.length || report.external.length) process.exit(1);
