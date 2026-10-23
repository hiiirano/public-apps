// 画面と動作の検査（テスト計画書 03 の E2E・画面・アクセシビリティ・通信・オフライン）。
// 使い方: npm run build && npx vite preview --port 4317 --host 127.0.0.1 を起動してから
//   npm run test:e2e   （URL と保存先は E2E_URL / E2E_OUT で変えられる）
import { chromium } from "playwright";
import fs from "node:fs";
import { createRequire } from "node:module";

const URL = process.env.E2E_URL || "http://127.0.0.1:4317/";
const OUT = process.env.E2E_OUT || new globalThis.URL("../test-results", import.meta.url).pathname;
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const ORIGIN = new globalThis.URL(URL).origin;
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], audits: [], axe: [], external: [] };
const ok = (name, cond, detail = "") => report.checks.push({ name, ok: !!cond, detail: String(detail) });
const watch = (page) => page.on("request", (r) => { if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:")) report.external.push(r.url()); });

const browser = await chromium.launch();

async function audit(page, label) {
  const r = await page.evaluate(() => {
    const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, small: [], tinyInput: [], tinyText: [], overlaps: [] };
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0 && !el.closest("[hidden]") && !(el.closest("details:not([open])") && !el.matches("summary")); };
    const targets = [...document.querySelectorAll("button, a, input, select, summary")].filter(vis).filter((el) => !el.classList.contains("skip"));
    for (const el of targets) { const b = el.getBoundingClientRect(); if (b.width < 44 - 0.5 || b.height < 44 - 0.5) out.small.push(`${el.tagName}.${el.className} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20)}" ${Math.round(b.width)}x${Math.round(b.height)}`); }
    for (const el of document.querySelectorAll("input, select")) { if (vis(el) && parseFloat(getComputedStyle(el).fontSize) < 16) out.tinyInput.push(el.id || el.className); }
    // 本文（説明文・案内文）は 16px 以上
    for (const el of document.querySelectorAll(".lead, .summary, .step-text, .facts dd, .notice, .cautions li, .foot p")) { if (vis(el) && parseFloat(getComputedStyle(el).fontSize) < 16) out.tinyText.push(el.className); }
    const boxes = targets.map((el) => [el, el.getBoundingClientRect()]);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const [a, A] = boxes[i], [b, B] = boxes[j]; if (a.contains(b) || b.contains(a)) continue;
      const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (w > 1 && h > 1) out.overlaps.push(`${a.tagName}.${a.className}|${b.tagName}.${b.className}`);
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

async function fresh(page) {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

const sunOf = async (page, mode) => (await page.textContent(`.route-card.${mode} .rc-big b`)).trim();

// ---- 4幅 × ライト/ダーク の画面検査 ----
for (const scheme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: scheme, locale: "ja-JP", deviceScaleFactor: 1, bypassCSP: true });
    const page = await ctx.newPage();
    watch(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await fresh(page);
    await page.evaluate(() => document.fonts.ready);
    const tag = `${width}-${scheme}`;
    await audit(page, `${tag} 初期`);
    await page.screenshot({ path: `${OUT}/${tag}-1-initial.png`, fullPage: true });
    // 近い道を地図に出し、根拠の表も開く
    await page.getByLabel("出発", { exact: true }).selectOption("tocho");
    await page.getByLabel("到着", { exact: true }).selectOption("sanchome");
    await page.click("button.route-card.shortest");
    await page.click("details.more summary");
    await audit(page, `${tag} 操作後`);
    await page.screenshot({ path: `${OUT}/${tag}-2-shortest.png`, fullPage: true });
    if (width === 390 || width === 1280) {
      await page.locator(".map-card").screenshot({ path: `${OUT}/${tag}-3-map.png` });
    }
    if (scheme === "light" || width === 390) await runAxe(page, `${tag} 操作後`);
    ok(`${tag} ページエラーなし`, errors.length === 0, errors.join(" / "));
    await ctx.close();
  }
}

// ---- 動作の確認（390 ライト）----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ja-JP" });
  const page = await ctx.newPage();
  watch(page);
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  await fresh(page);
  ok("初期は 西口→区役所", (await page.inputValue("#from")) === "west_exit" && (await page.inputValue("#to")) === "ward_office");
  ok("「目安です」が見える", await page.locator(".notice").filter({ hasText: "目安です" }).isVisible());
  ok("初期は日陰の道を地図に表示", (await page.getAttribute("button.route-card.shade", "aria-pressed")) === "true");
  ok("日なた: 日陰の道1分・近い道8分", (await sunOf(page, "shade")) === "1" && (await sunOf(page, "shortest")) === "8", `${await sunOf(page, "shade")} ${await sunOf(page, "shortest")}`);
  ok("くらべた結果の文", (await page.textContent(".summary")).includes("日なたが約7分へります"), await page.textContent(".summary"));
  const segW = await page.$$eval(".route-card.shade .seg", (els) => els.map((e) => e.getBoundingClientRect().width));
  ok("道の帯は長さに比例（日陰660m:日なた50m）", segW.length === 2 && segW[0] > segW[1] * 8, segW.join());
  ok("日陰 92%", (await page.textContent(".route-card.shade .rc-stats")).includes("日陰 92%"));
  ok("歩き方は5歩・最後だけ地上", (await page.$$(".step")).length === 5 && (await page.$$(".step.outdoor")).length === 1);
  ok("地図に日なたの印が1つ", (await page.$$("svg.map use")).length === 1);

  // 近い道を地図に出す
  await page.click("button.route-card.shortest");
  ok("近い道を押すと地図に表示", (await page.getAttribute("button.route-card.shortest", "aria-pressed")) === "true" && (await page.getAttribute("button.route-card.shade", "aria-pressed")) === "false");
  ok("近い道の歩き方は2歩・地上あり", (await page.$$(".step")).length === 2 && (await page.$$(".step.outdoor")).length === 1);
  ok("地図の説明が近い道に", (await page.getAttribute("svg.map", "aria-label")).includes("近い道"));

  // 到着を変える → 三丁目は地下だけで行ける
  await page.getByLabel("出発", { exact: true }).selectOption("east_exit");
  await page.getByLabel("到着", { exact: true }).selectOption("sanchome");
  await page.click("button.route-card.shade");
  ok("東口→三丁目 日陰の道は日なた0分・100%", (await sunOf(page, "shade")) === "0" && (await page.textContent(".route-card.shade .rc-stats")).includes("100%"));
  ok("読み上げ用の知らせ", (await page.textContent("#live")).includes("東口から三丁目"), await page.textContent("#live"));

  // 入れかえ
  await page.click("#swap");
  ok("入れかえで 三丁目→東口", (await page.inputValue("#from")) === "sanchome" && (await page.inputValue("#to")) === "east_exit");
  ok("入れかえ後もボタンにフォーカス", await page.evaluate(() => document.activeElement?.id === "swap"));

  // 出発と同じ場所を到着に選ぶと入れかわる
  await page.getByLabel("到着", { exact: true }).selectOption("sanchome");
  ok("同じ場所を選ぶと入れかわる", (await page.inputValue("#from")) === "east_exit" && (await page.inputValue("#to")) === "sanchome");

  // 2つが同じ道
  await page.getByLabel("出発", { exact: true }).selectOption("west_exit");
  await page.getByLabel("到着", { exact: true }).selectOption("east_exit");
  ok("同じ道なら札は1枚・押すボタンなし", (await page.$$(".route-card")).length === 1 && (await page.$$("button[data-mode]")).length === 0);
  ok("同じ道の説明", (await page.textContent(".summary")).includes("そのまま日陰の道"));

  // 根拠の表
  await page.click("details.more summary");
  ok("根拠は12区間", (await page.$$(".evidence li")).length === 12);
  ok("出典のリンクは別画面・referrer なし", (await page.$$eval(".sources a", (as) => as.every((a) => a.target === "_blank" && a.rel.includes("noreferrer")))));

  // 「くわしく」で説明へ
  await page.click(".notice a");
  ok("「くわしく」で説明へ移動", (await page.evaluate(() => location.hash)) === "#about");

  // 再読み込みで復元
  await page.getByLabel("出発", { exact: true }).selectOption("tocho");
  await page.getByLabel("到着", { exact: true }).selectOption("ward_office");
  await page.click("button.route-card.shortest");
  await page.reload();
  ok("再読み込みで復元", (await page.inputValue("#from")) === "tocho" && (await page.inputValue("#to")) === "ward_office" && (await page.getAttribute("button.route-card.shortest", "aria-pressed")) === "true");

  // 壊れた保存
  await page.evaluate(() => localStorage.setItem("shade-map.shinjuku.v2", '{"from":"<img src=x onerror=alert(1)>","to":1}'));
  await page.reload();
  ok("壊れた保存は初期状態", (await page.inputValue("#from")) === "west_exit" && (await page.$$("img[src=x]")).length === 0);

  // 前の版の URL
  await page.goto(URL + "#from=tocho&to=sanchome&mode=shortest");
  ok("前の版の URL を読む", (await page.inputValue("#from")) === "tocho" && (await page.inputValue("#to")) === "sanchome" && (await page.getAttribute("button.route-card.shortest", "aria-pressed")) === "true");
  ok("URL の # は消える", (await page.evaluate(() => location.hash)) === "");

  // キーボードだけで: 札を選ぶ
  await fresh(page);
  await page.focus("#swap");
  for (let i = 0; i < 3; i++) await page.keyboard.press("Tab"); // 到着 → 日陰の道 → 近い道
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-mode"));
  await page.keyboard.press("Space");
  ok("キーボードで札を選べる", focused === "shortest" && (await page.getAttribute("button.route-card.shortest", "aria-pressed")) === "true", focused);
  ok("選んだ札にフォーカスが残る", await page.evaluate(() => document.activeElement?.getAttribute("data-mode") === "shortest"));
  await page.keyboard.press("Enter");
  ok("Enter でも押せる（同じ札）", (await page.getAttribute("button.route-card.shortest", "aria-pressed")) === "true");

  // 全組み合わせでエラーなし
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  const ids = await page.$$eval("#from option", (os) => os.map((o) => o.value));
  for (const a of ids) for (const b of ids) {
    if (a === b) continue;
    await page.getByLabel("出発", { exact: true }).selectOption(a);
    await page.getByLabel("到着", { exact: true }).selectOption(b);
    const s = Number(await sunOf(page, "shade"));
    const sh = (await page.$$(".route-card.shortest")).length ? Number(await sunOf(page, "shortest")) : s;
    if (!(s <= sh)) errs.push(`${a}->${b} 日陰の道の方が日なたが長い`);
    if ((await page.$$(".step")).length === 0) errs.push(`${a}->${b} 歩き方が空`);
  }
  ok("全20組で表示でき、日陰の道の日なた≦近い道", errs.length === 0, errs.join(" / "));
  ok("コンソールのエラー（CSP 違反を含む）なし", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" / "));
  await ctx.close();
}

// ---- 保存できない環境 ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error("blocked"); }; });
  const page = await ctx.newPage();
  watch(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(URL);
  await page.click("button.route-card.shortest");
  ok("保存できなくても使える", errors.length === 0 && (await page.getAttribute("button.route-card.shortest", "aria-pressed")) === "true", errors.join());
  ok("保存できないことを伝える", (await page.textContent(".foot")).includes("保存できません"));
  await ctx.close();
}

// ---- オフライン ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "allow" });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(URL);
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready.then(() => true), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await ctx.setOffline(true);
  let offlineOk = false;
  try {
    await page.reload({ waitUntil: "load" });
    await page.getByLabel("到着", { exact: true }).selectOption("sanchome");
    offlineOk = (await page.$$(".step")).length > 0 && (await page.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0)));
  } catch (e) { report.offlineError = String(e); }
  ok("オフラインで開いて道をさがせる（絵も出る）", offlineOk, report.offlineError || "");
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
