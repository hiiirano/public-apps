// 画面と動作の検査（テスト計画書 03 の E2E・画面・アクセシビリティ・通信・オフライン）。
// 使い方: npm run build && npx vite preview --port 4310 --host 127.0.0.1 を起動してから
//   npm run test:e2e   （URL と保存先は E2E_URL / E2E_OUT で変えられる）
import { chromium } from "playwright";
import fs from "node:fs";
import { createRequire } from "node:module";

const URL = process.env.E2E_URL || "http://127.0.0.1:4310/";
const OUT = process.env.E2E_OUT || new globalThis.URL("../test-results", import.meta.url).pathname;
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], audits: [], axe: [], external: [] };
const ok = (name, cond, detail = "") => report.checks.push({ name, ok: !!cond, detail });

const browser = await chromium.launch();

async function audit(page, label) {
  const r = await page.evaluate(() => {
    const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, small: [], tinyInput: [], overlaps: [] };
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0 && !el.closest("[hidden]"); };
    const targets = [...document.querySelectorAll("button, a, input:not([type=radio]), summary, label:has(input[type=radio])")].filter(vis)
      .filter((el) => !(el.tagName === "A" && el.closest(".credit")) && !el.classList.contains("skip"));
    for (const el of targets) { const b = el.getBoundingClientRect(); if (b.width < 44 - 0.5 || b.height < 44 - 0.5) out.small.push(`${el.tagName}.${el.className} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20)}" ${Math.round(b.width)}x${Math.round(b.height)}`); }
    for (const el of document.querySelectorAll("input")) { if (!vis(el) || el.type === "radio") continue; if (parseFloat(getComputedStyle(el).fontSize) < 16) out.tinyInput.push(el.id || el.className); }
    const boxes = targets.map((el) => [el, el.getBoundingClientRect()]);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const [a, A] = boxes[i], [b, B] = boxes[j]; if (a.contains(b) || b.contains(a)) continue;
      const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (w > 1 && h > 1 && !a.closest(".bottom-bar, .toast") && !b.closest(".bottom-bar, .toast")) out.overlaps.push(`${a.className}|${b.className}`);
    }
    return out;
  });
  report.audits.push({ label, ...r });
}

async function fillScenario(page) {
  await page.fill("#amount", "２８,６００円");
  await page.fill("#count", "7");
  await page.press("#count", "Enter");
  const ids = await page.$$eval(".person", (els) => els.map((e) => e.dataset.id));
  await page.fill(`#name-${ids[0]}`, "ひらの");
  await page.fill(`#name-${ids[1]}`, "たなか");
  await page.click(`label:has(> input[name="lv-${ids[1]}"][value="more"])`);
  await page.click(`label:has(> input[name="lv-${ids[2]}"][value="less"])`);
  await page.click(`label:has(> input[name="lv-${ids[3]}"][value="less"])`);
  await page.fill(`#name-${ids[4]}`, "はると");
  await page.click(`label:has(> input[name="lv-${ids[4]}"][value="gift"])`);
  return ids;
}

for (const scheme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: scheme, locale: "ja-JP", deviceScaleFactor: 1, bypassCSP: true });
    const page = await ctx.newPage();
    page.on("request", (r) => { if (!r.url().startsWith(URL.replace(/\/$/, "").split("/").slice(0, 3).join("/"))) report.external.push(r.url()); });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const tag = `${width}-${scheme}`;
    await audit(page, `${tag} 初期`);
    await page.screenshot({ path: `${OUT}/${tag}-1-initial.png`, fullPage: true });
    await fillScenario(page);
    await page.click("#ratio-toggle");
    await audit(page, `${tag} 入力後`);
    await page.screenshot({ path: `${OUT}/${tag}-2-filled.png`, fullPage: true });
    if (width === 390) {
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/${tag}-3-viewport-bar.png` });
      await page.locator("#result").scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/${tag}-4-viewport-result.png` });
    }
    if (AXE && scheme === "light" || AXE && width === 390) {
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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ja-JP", permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok("空のとき案内", (await page.textContent("#result-body")).includes("金額を入れると"));
  const ids = await fillScenario(page);
  const amounts = await page.$$eval(".pay-amount", (els) => els.map((e) => e.textContent.replace(/[^\d]/g, "")));
  ok("場面1.1 の金額", amounts.join() === "5000,6000,4000,4000,0,5000,5000", amounts.join());
  ok("おつり表示", (await page.textContent(".diff")).includes("幹事のおつり 400円"), await page.textContent(".diff"));
  ok("全角入力が金額に", (await page.textContent(".sums")).includes("28,600円"));
  await page.click('[data-act="copy"]');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  ok("コピーした文", clip.startsWith("本日の会計 28,600円（7人）") && clip.includes("たなかさん 6,000円（多め ×1.2）"), clip);
  ok("コピーのお知らせ", (await page.textContent("#toast")).includes("コピーしました"));
  // 割合を変える
  await page.click('button[data-ratio="more"][data-d="1"]');
  ok("多め ×1.3 がボタンに反映", (await page.textContent(`label.lv-more`)).includes("×1.3"));
  await page.click('button[data-ratio="reset"]');
  // 金額指定
  await page.click(`[data-k="${ids[5]}:fix"]`);
  await page.fill(`#fixed-${ids[5]}`, "10000");
  const a2 = await page.$$eval(".pay-amount", (els) => els.map((e) => e.textContent.replace(/[^\d]/g, "")));
  ok("金額指定 1万円", a2[5] === "10000", a2.join());
  await page.fill(`#fixed-${ids[5]}`, "30000");
  ok("指定額超過のエラー", (await page.textContent("#result-body")).includes("超えています"));
  await page.click(`[data-k="${ids[5]}:unfix"]`);
  // 削除と元に戻す
  await page.click(`[data-k="${ids[1]}:remove"]`);
  ok("削除で6人", (await page.$$(".person")).length === 6);
  await page.click('#toast [data-act="undo"]');
  ok("元に戻すで7人・名前も戻る", (await page.$$(".person")).length === 7 && (await page.inputValue(`#name-${ids[1]}`)) === "たなか");
  // 幹事を変える
  await page.check(`input[name="host"][value="${ids[2]}"]`, { force: true });
  ok("幹事の切り替え", (await page.$$eval(".person.is-host", (e) => e.map((x) => x.dataset.id))).join() === ids[2]);
  // 再読み込みで復元
  await page.reload();
  ok("再読み込みで復元", (await page.$$(".person")).length === 7 && (await page.inputValue(`#name-${ids[0]}`)) === "ひらの" && (await page.inputValue("#amount")) === "28,600");
  // 新しい会計
  await page.click('[data-act="new"]');
  ok("新しい会計で金額だけ消える", (await page.inputValue("#amount")) === "" && (await page.$$(".person")).length === 7);
  // 全員おごり
  await page.fill("#amount", "1000");
  await page.fill("#count", "2");
  await page.press("#count", "Enter");
  const two = await page.$$eval(".person", (els) => els.map((e) => e.dataset.id));
  for (const id of two) await page.click(`label:has(> input[name="lv-${id}"][value="gift"])`);
  ok("全員おごりのエラー", (await page.textContent("#result-body")).includes("全員"));
  // 上限と文字
  await page.fill("#amount", "abc");
  ok("文字の注意", (await page.textContent("#amount-msg")).includes("数字"));
  await page.fill("#amount", "10000000");
  ok("上限の注意", (await page.textContent("#amount-msg")).includes("9,999,999"));
  // 30人
  await page.fill("#amount", "300000");
  await page.fill("#count", "99");
  await page.press("#count", "Enter");
  ok("人数は30人まで", (await page.$$(".person")).length === 30 && (await page.inputValue("#count")) === "30");
  const faces = await page.$$eval(".person .face", (els) => els.slice(0, 12).map((e) => e.getAttribute("src")));
  ok("12人まで顔が重ならない", new Set(faces).size === 12);
  // キーボードだけで割合ボタンへ
  await page.keyboard.press("Tab");
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
    await page.fill("#amount", "4000");
    offlineOk = (await page.textContent(".pay-amount")).includes("1,000");
  } catch (e) { report.offlineError = String(e); }
  ok("オフラインで開いて計算できる", offlineOk, report.offlineError || "");
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
