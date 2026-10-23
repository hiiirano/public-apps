// 画面と動作の検査（テスト計画書 03 の T3〜T7: 動作・画面・アクセシビリティ・通信・オフライン）。
// 使い方: npm run build && npx vite preview --port 4312 --host 127.0.0.1 を起動してから
//   npm run test:e2e   （URL と保存先は E2E_URL / E2E_OUT で変えられる）
import { chromium } from "playwright";
import fs from "node:fs";
import { createRequire } from "node:module";

const URL = process.env.E2E_URL || "http://127.0.0.1:4312/";
const OUT = process.env.E2E_OUT || new globalThis.URL("../test-results", import.meta.url).pathname;
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], audits: [], axe: [], external: [] };
const ok = (name, cond, detail = "") => report.checks.push({ name, ok: !!cond, detail: String(detail) });
const ORIGIN = URL.split("/").slice(0, 3).join("/");

const browser = await chromium.launch();

async function audit(page, label) {
  const r = await page.evaluate(() => {
    const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, small: [], tinyInput: [], tinyText: [], overlaps: [] };
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0 && !el.closest("[hidden]") && !(el.closest("details:not([open])") && !el.closest("summary")); };
    const targets = [...document.querySelectorAll("button, a, input:not([type=radio]), summary, label:has(input[type=radio])")].filter(vis)
      .filter((el) => !el.classList.contains("skip"));
    for (const el of targets) { const b = el.getBoundingClientRect(); if (b.width < 44 - 0.5 || b.height < 44 - 0.5) out.small.push(`${el.tagName}.${el.className} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20)}" ${Math.round(b.width)}x${Math.round(b.height)}`); }
    for (const el of document.querySelectorAll("input")) { if (!vis(el) || el.type === "radio") continue; if (parseFloat(getComputedStyle(el).fontSize) < 16) out.tinyInput.push(el.id || el.className); }
    // 本文の文字は 16px 以上（SVG の中は除く）
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement; if (!n.textContent.trim() || !el || el.closest("svg, .sr-only, .vh") || !vis(el)) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 16 - 0.01) out.tinyText.push(`${el.className || el.tagName} ${fs}px "${n.textContent.trim().slice(0, 12)}"`);
    }
    const boxes = targets.map((el) => [el, el.getBoundingClientRect()]);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const [a, A] = boxes[i], [b, B] = boxes[j]; if (a.contains(b) || b.contains(a)) continue;
      const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (w > 1 && h > 1 && !a.closest(".toast") && !b.closest(".toast")) out.overlaps.push(`${a.className}|${b.className}`);
    }
    out.tinyText = [...new Set(out.tinyText)];
    return out;
  });
  report.audits.push({ label, ...r });
}

const radio = (name, value) => `label:has(> input[name="${name}"][value="${value}"])`;
const text = (page, sel) => page.textContent(sel).then((s) => (s || "").replace(/\s+/g, " ").trim());

async function fillProfile(page) {
  await page.click(radio("sex", "female"));
  await page.fill("#in-age", "30");
  await page.fill("#in-heightCm", "１５８"); // 全角
  await page.fill("#in-weightKg", "52kg"); // 単位つき
}

for (const scheme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: scheme, locale: "ja-JP", deviceScaleFactor: 1, bypassCSP: true });
    const page = await ctx.newPage();
    page.on("request", (r) => { if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) report.external.push(r.url()); });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const tag = `${width}-${scheme}`;
    await audit(page, `${tag} 初期`);
    await page.screenshot({ path: `${OUT}/${tag}-1-initial.png`, fullPage: true });
    await fillProfile(page);
    await page.click(radio("goal", "cut"));
    await page.click("#adv summary");
    await page.click('[data-food="rice"]');
    await page.click('[data-food="egg"]');
    await page.click("#custom summary");
    await page.waitForTimeout(300);
    await audit(page, `${tag} 入力後`);
    await page.screenshot({ path: `${OUT}/${tag}-2-filled.png`, fullPage: true });
    if (width === 390) {
      await page.locator("#result").scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${OUT}/${tag}-3-viewport-result.png` });
    }
    if (scheme === "light" || width === 390) {
      await page.addScriptTag({ path: AXE });
      const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target.join(" ") })));
      report.axe.push({ label: tag, violations: res });
    }
    ok(`${tag} ページエラーなし`, errors.length === 0, errors.join(" / "));
    await ctx.close();
  }
}

// ---- 動作の確認（390 ライト）----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ja-JP", acceptDownloads: true });
  const page = await ctx.newPage();
  const cspErrors = [];
  page.on("console", (m) => { if (m.type() === "error") cspErrors.push(m.text()); });
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok("空のとき案内", (await text(page, "#result-body")).includes("性別・年齢・身長・体重を入れると"));
  ok("空のとき記録の案内", (await text(page, "#log-summary")).includes("目標は"));

  await fillProfile(page);
  await page.click("#in-age");
  ok("欄を離れると全角が半角に整う", (await page.inputValue("#in-heightCm")) === "158" && (await page.inputValue("#in-weightKg")) === "52");
  ok("見本の人の目標 1,645 kcal", (await text(page, "#target-kcal")) === "1,645", await text(page, "#target-kcal"));
  const g = await page.$$eval(".pfc-g", (els) => els.map((e) => e.textContent.replace(/\D/g, "")));
  ok("PFC 78 / 46 / 230 g", g.join() === "78,46,230", g.join());
  ok("割合 19% / 25% / 56%", (await text(page, ".pfc-list")).match(/19%.*25%.*56%/) !== null);
  ok("ごはん 約7杯分の言い換え", (await text(page, ".eq")).includes("ごはん 約7杯分"));
  ok("円グラフに読み上げ用の説明", ((await page.getAttribute(".ring", "aria-label")) || "").includes("たんぱく質 19%"));
  ok("BMI 20.8 普通体重", (await text(page, ".stats")).includes("20.8") && (await text(page, ".stats")).includes("普通体重"));

  // キーで1文字ずつ入れても、欄から外れず、途中の値で目標が壊れない
  await page.fill("#in-age", "");
  await page.click("#in-age");
  await page.keyboard.type("45");
  ok("1文字ずつ入れても入力欄にとどまる", (await page.evaluate(() => document.activeElement?.id)) === "in-age");
  ok("年齢 45 で目標が変わる", (await text(page, "#target-kcal")) === String(Math.round((520 + 987.5 - 225 - 161) * 1.375)).replace(/\B(?=(\d{3})+$)/, ","), await text(page, "#target-kcal"));
  await page.fill("#in-age", "15");
  ok("範囲外の年齢で注意", (await text(page, "#msg-age")).includes("18〜100"));
  ok("範囲外のときは直前の値で計算", (await text(page, "#target-kcal")) !== "", await text(page, "#target-kcal"));
  await page.fill("#in-age", "あ");
  ok("文字の注意", (await text(page, "#msg-age")).includes("数字"));
  await page.fill("#in-age", "30");
  ok("直すと注意が消える", (await text(page, "#msg-age")) === "");

  await page.click(radio("activity", "active"));
  ok("よく動く → 2,064 kcal", (await text(page, "#target-kcal")) === "2,064", await text(page, "#target-kcal"));
  await page.click(radio("activity", "sedentary"));
  await page.click(radio("goal", "cut"));
  ok("やせる＋動かない → 基礎代謝まで引き上げ", (await text(page, "#result-body")).includes("基礎代謝（1,197 kcal）まで引き上げ"));
  await page.click(radio("goal", "maintain"));
  await page.click(radio("activity", "light"));

  // 割合を変える
  await page.click("#adv summary");
  await page.fill("#in-fatPercent", "40");
  ok("脂質 40% → 目安より多めと出る", (await text(page, "#result-body")).includes("脂質が国の目安より多め"));
  await page.click('[data-act="adv-reset"]');
  ok("はじめの値に戻す", (await page.inputValue("#in-fatPercent")) === "25" && (await text(page, "#target-kcal")) === "1,645");

  // 記録
  await page.click('[data-food="rice"]');
  ok("ごはんを記録 → お知らせ", (await text(page, "#toast")).includes("ごはんを記録しました"));
  ok("あと 1,411 kcal", /あと\s*1,411\s*kcal/.test(await text(page, "#log-summary")), await text(page, "#log-summary"));
  const barW = await page.$eval("#log-summary .bar-kcal .bar-fill", (el) => el.getBoundingClientRect().width);
  ok("カロリーの棒が伸びる（CSP の下でも）", barW > 10, barW);
  await page.click('#toast [data-act="undo"]');
  ok("元に戻すで記録 0 件", (await page.$$(".entry")).length === 0);
  await page.click('[data-food="rice"]');
  await page.click('[data-food="egg"]');
  await page.click('[data-food="chicken"]');
  ok("3件記録", (await page.$$(".entry")).length === 3);
  await page.click('.entry:has-text("卵") .icon-btn');
  ok("1件消すと2件", (await page.$$(".entry")).length === 2 && !(await text(page, "#entries")).includes("卵"));
  // そのほかの食べ物
  await page.click("#custom summary");
  await page.click('#custom-form button[type="submit"]');
  ok("何も入れずに記録 → 注意", (await text(page, "#c-msg")).includes("どれか"));
  await page.fill("#c-name", "<b>牛丼</b>");
  await page.fill("#c-protein", "20");
  await page.fill("#c-fat", "２５");
  await page.fill("#c-carbs", "90");
  await page.click('#custom-form button[type="submit"]');
  const first = await text(page, ".entry:first-child");
  ok("PFC からカロリーを計算（665 kcal）", first.includes("665"), first);
  ok("名前はそのまま文字で出る（無害化）", first.includes("<b>牛丼</b>") && (await page.$$(".entry b")).length === 0, first);
  await page.fill("#c-kcal", "abc");
  await page.click('#custom-form button[type="submit"]');
  ok("カロリーに文字 → 注意", (await text(page, "#c-msg")).includes("数字"));
  await page.fill("#c-kcal", "");
  // 食べすぎ
  for (let i = 0; i < 6; i++) await page.click('[data-food="pasta"]');
  ok("目標を超えると「多く食べています」", (await text(page, "#log-summary")).includes("多く食べています"));
  // 別の日
  await page.fill("#log-date", "2026-01-01");
  ok("別の日は記録 0 件", (await page.$$(".entry")).length === 0 && (await text(page, "#entries")).includes("まだありません"));
  await page.click('[data-act="today"]');
  ok("今日に戻ると記録が出る", (await page.$$(".entry")).length === 9, (await page.$$(".entry")).length);

  // 再読み込み
  await page.reload();
  ok("再読み込みで復元", (await page.inputValue("#in-age")) === "30" && (await page.$$(".entry")).length === 9 && (await text(page, "#target-kcal")) === "1,645");

  // 書き出し
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('[data-act="export"]')]);
  const saved = `${OUT}/backup.json`;
  await dl.saveAs(saved);
  ok("書き出したファイルに記録 9 件", JSON.parse(fs.readFileSync(saved, "utf8")).log.length === 9);

  // すべて消す → 元に戻す
  await page.click('[data-act="reset"]');
  ok("すべて消すと空", (await text(page, "#result-body")).includes("を入れると") && (await page.inputValue("#in-age")) === "");
  await page.click('#toast [data-act="undo"]');
  ok("元に戻すで復元", (await page.inputValue("#in-age")) === "30" && (await page.$$(".entry")).length === 9);

  // 読み込み
  await page.click('[data-act="reset"]');
  await page.setInputFiles("#import-file", saved);
  await page.waitForTimeout(300);
  ok("読み込みで復元", (await page.$$(".entry")).length === 9 && (await text(page, "#toast")).includes("読み込みました"));
  const badFile = `${OUT}/bad.json`;
  fs.writeFileSync(badFile, '{"hello":1}');
  await page.setInputFiles("#import-file", badFile);
  await page.waitForTimeout(300);
  ok("ほかのファイルは読まない", (await text(page, "#toast")).includes("読み込めませんでした") && (await page.$$(".entry")).length === 9);

  // 見本
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('[data-act="sample"]');
  ok("見本の値で試す", (await text(page, "#target-kcal")) === "1,645" && (await page.inputValue("#in-heightCm")) === "158");

  // 前の版からの引き継ぎ（API キーは消す）
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("macro.profile", JSON.stringify({ sex: "male", age: 30, heightCm: 170, weightKg: 65, activity: "moderate", goal: "maintain", proteinPerKg: 2, fatPercent: 0.25 }));
    localStorage.setItem("macro.llm", JSON.stringify({ apiKey: "sk-secret" }));
  });
  await page.reload();
  ok("前の版の体の情報を引き継ぐ", (await page.inputValue("#in-heightCm")) === "170" && (await text(page, "#target-kcal")) === "2,430", await text(page, "#target-kcal"));
  ok("前の版の API キーを消す", (await page.evaluate(() => localStorage.getItem("macro.llm"))) === null);

  // 壊れた保存内容
  await page.evaluate(() => localStorage.setItem("macro-planner.v2", "{broken"));
  await page.reload();
  ok("壊れた保存内容でも初期状態で開く", (await text(page, "#result-body")).includes("を入れると"));

  ok("コンソールのエラー（CSP 違反など）なし", cspErrors.length === 0, cspErrors.slice(0, 3).join(" / "));
  // キーボードだけで: 性別を選び、年齢へ
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.focus('input[name="sex"][value="female"]');
  await page.keyboard.press("Space");
  ok("キーボードで性別を選べる", await page.isChecked('input[name="sex"][value="female"]'));
  await page.keyboard.press("Tab");
  ok("Tab で年齢の欄へ", (await page.evaluate(() => document.activeElement?.id)) === "in-age");
  await ctx.close();
}

// ---- 保存できない環境 ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error("blocked"); }; });
  const page = await ctx.newPage();
  await page.goto(URL);
  await fillProfile(page);
  ok("保存できなくても計算できる", (await text(page, "#target-kcal")) === "1,645");
  ok("保存できない旨を出す", (await text(page, "#save-note")).includes("保存できない"));
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
    await page.click('[data-act="sample"]');
    offlineOk = (await text(page, "#target-kcal")) === "1,645";
    const broken = await page.$$eval("img", (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).length);
    ok("オフラインでも絵が出る", broken === 0, broken);
  } catch (e) { report.offlineError = String(e); }
  ok("オフラインで開いて計算できる", offlineOk, report.offlineError || "");
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
auditBad.forEach((a) => console.log("  NG", a.label, JSON.stringify({ x: a.overflowX, small: a.small.slice(0, 5), tiny: a.tinyInput, text: a.tinyText.slice(0, 6), ov: a.overlaps.slice(0, 5) })));
console.log(`axe ${report.axe.length - axeBad.length}/${report.axe.length} 違反なし`);
axeBad.forEach((a) => console.log("  NG", a.label, JSON.stringify(a.violations)));
console.log(`外部への通信 ${new Set(report.external).size} 件`, [...new Set(report.external)].slice(0, 5).join(" "));
if (bad.length || auditBad.length || axeBad.length || report.external.length) process.exit(1);
