// 画面と動作の検査（テスト計画書 03 の E2E・画面・アクセシビリティ・通信・オフライン）。
// 使い方: npm run build && npx vite preview --port 4314 --host 127.0.0.1 を起動してから
//   npm run test:e2e   （URL と保存先は E2E_URL / E2E_OUT で変えられる）
import { chromium } from "playwright";
import fs from "node:fs";
import { createRequire } from "node:module";

const URL = process.env.E2E_URL || "http://127.0.0.1:4314/";
const OUT = process.env.E2E_OUT || new globalThis.URL("../test-results", import.meta.url).pathname;
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const ORIGIN = URL.split("/").slice(0, 3).join("/");
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], audits: [], axe: [], external: [] };
const ok = (name, cond, detail = "") => report.checks.push({ name, ok: !!cond, detail: String(detail) });

const browser = await chromium.launch();

async function audit(page, label) {
  const r = await page.evaluate(() => {
    const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, small: [], tinyInput: [], overlaps: [] };
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0 && !el.closest("[hidden]") && !el.closest("details:not([open]) > :not(summary)"); };
    const targets = [...document.querySelectorAll("button, a, input:not([type=radio]), summary, label:has(input[type=radio])")].filter(vis)
      .filter((el) => !el.classList.contains("skip"));
    for (const el of targets) { const b = el.getBoundingClientRect(); if (b.width < 44 - 0.5 || b.height < 44 - 0.5) out.small.push(`${el.tagName}.${el.className} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20)}" ${Math.round(b.width)}x${Math.round(b.height)}`); }
    for (const el of document.querySelectorAll("input, textarea")) { if (!vis(el) || el.type === "radio" || el.type === "checkbox") continue; if (parseFloat(getComputedStyle(el).fontSize) < 16) out.tinyInput.push(el.id || el.className); }
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

async function runAxe(page, label) {
  await page.addScriptTag({ path: AXE });
  const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target.join(" ") })));
  report.axe.push({ label, violations: res });
}

const weekText = (page) => page.textContent("#week-body");
const mains = (page) => page.$$eval(".dish-main .d-name", (els) => els.map((e) => e.textContent.trim()));

async function setupScenario(page) {
  await page.click('button.food[data-dislike="牛肉"]');
  await page.fill("#dislike-in", "ネギ");
  await page.press("#dislike-in", "Enter");
  await page.click('button.food[data-pantry="キャベツ"]');
  await page.fill("#pantry-in", "リンゴ");
  await page.click('button[data-add="pantry"]');
  await page.click('label.genre-opt:has(input[value="和"])');
}

// ---- 4幅 × ライト/ダーク の画面検査 ----
for (const scheme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: scheme, locale: "ja-JP", deviceScaleFactor: 1, bypassCSP: true });
    const page = await ctx.newPage();
    page.on("request", (r) => { if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:")) report.external.push(r.url()); });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
    const tag = `${width}-${scheme}`;
    await audit(page, `${tag} 初期`);
    await page.screenshot({ path: `${OUT}/${tag}-1-initial.png`, fullPage: true });
    await setupScenario(page);
    await page.click('[data-act="fold"]');
    await page.click('details.meal[data-day="2"] > summary');
    await page.click('details.meal[data-day="2"] details.ing > summary');
    await page.click('details.seasoning > summary');
    await audit(page, `${tag} 入力後`);
    await page.screenshot({ path: `${OUT}/${tag}-2-filled.png`, fullPage: true });
    if (width === 390) {
      await page.locator(".settings .foods").first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/${tag}-3-viewport-settings.png` });
      await page.locator("#week-h").scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/${tag}-4-viewport-week.png` });
    }
    if (scheme === "light" || width === 390) await runAxe(page, tag);
    ok(`${tag} ページエラーなし`, errors.length === 0, errors.join(" / "));
    await ctx.close();
  }
}

// ---- 動作の確認（390 ライト）----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ja-JP", permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  page.on("request", (r) => { if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:")) report.external.push(r.url()); });
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // 不具合4: 1日に主菜＋副菜＋汁物
  ok("初めから7日分", (await page.$$(".day")).length === 7);
  const perDay = await page.$$eval(".day", (els) => els.map((e) => e.querySelectorAll(".dish").length));
  ok("毎日 主菜＋副菜（＋汁物）", perDay.every((n) => n >= 2) && perDay.filter((n) => n === 3).length >= 5, perDay.join());
  ok("副菜と汁物のラベル", (await weekText(page)).includes("副菜・") && (await weekText(page)).includes("汁物・"));

  // 不具合1: 苦手なもの（ボタンと自由入力、言い換え）
  await page.click('button.food[data-dislike="牛肉"]');
  ok("牛肉ボタンが押された状態", (await page.getAttribute('button.food[data-dislike="牛肉"]', "aria-pressed")) === "true");
  ok("牛肉で牛こま切れ肉・合いびき肉が消える", !/牛こま切れ肉|合いびき肉/.test(await weekText(page)));
  ok("牛肉の説明に牛こま切れ肉", (await page.textContent("#dislike-list")).includes("牛こま切れ肉"));
  await page.fill("#dislike-in", "ネギ");
  await page.press("#dislike-in", "Enter");
  ok("ネギで長ねぎが消える", !(await weekText(page)).includes("長ねぎ"));
  ok("ネギの説明に「玉ねぎは外れません」", (await page.textContent("#dislike-list")).includes("玉ねぎは外れません"));
  ok("ネギ入力でねぎボタンも押された状態", (await page.getAttribute('button.food[data-dislike="ねぎ"]', "aria-pressed")) === "true");
  await page.fill("#dislike-in", "ねぎ");
  await page.press("#dislike-in", "Enter");
  ok("同じ意味の言葉は二重にならない", (await page.$$("#dislike-list .term")).length === 2);

  // 不具合2: 冷蔵庫の残り
  await page.click('button.food[data-pantry="キャベツ"]');
  await page.fill("#pantry-in", "リンゴ、大根");
  await page.click('button[data-add="pantry"]');
  const pantryText = await page.textContent("#pantry-list");
  ok("キャベツは何曜日で使うか出る", /キャベツ.*曜日で使います/.test(pantryText), pantryText);
  ok("リンゴは使わないと出る", /リンゴこの献立の料理では使いません/.test(pantryText), pantryText);
  ok("大根も使う", /大根.*曜日で使います/.test(pantryText), pantryText);
  ok("料理に「残り物：キャベツ」", (await page.$$eval(".uses", (els) => els.map((e) => e.textContent))).some((t) => t.includes("キャベツ")));
  ok("買い物リストに「家にある」", (await page.textContent("#shop-body")).includes("家にある"));
  ok("概要に残り物の数", (await page.textContent(".overview")).includes("残り物 2/3品"), await page.textContent(".overview"));
  await page.fill("#pantry-in", "ネギ");
  await page.press("#pantry-in", "Enter");
  ok("苦手と重なる残り物は「外れています」", /ネギ使う料理がほかの条件で外れています/.test(await page.textContent("#pantry-list")));
  await page.click('button[data-remove-pantry="ネギ"]');
  ok("×で残り物を消せる", !(await page.textContent("#pantry-list")).includes("ネギ"));

  // 不具合3: ジャンルは「多め」
  await page.click('label.genre-opt:has(input[value="和"])');
  const ov = await page.textContent(".overview");
  ok("和食多めで和食4日", ov.includes("和食 4日"), ov);
  ok("和食多めでも洋・中が混ざる", !ov.includes("洋食 0日") && !ov.includes("中華 0日"), ov);
  ok("選び方の説明", (await page.textContent("#genre-hint")).includes("7日のうち4日"));

  // アレルギー（安全側）
  await page.click('label.chip:has(input[value="卵"])');
  const allergenLines = await page.$$eval(".allergen", (els) => els.map((e) => e.textContent));
  ok("卵を外すと卵を含む料理が出ない", allergenLines.length >= 14 && allergenLines.every((t) => !t.includes("卵")), allergenLines.join("|").slice(0, 200));

  // 品数のスイッチ
  await page.click('label.switch:has(#withSoup)');
  ok("汁物をつけない", !(await weekText(page)).includes("汁物・"));
  await page.click('label.switch:has(#withSoup)');
  ok("汁物を戻す", (await weekText(page)).includes("汁物・"));

  // 畳む・開く（利用者の提案5）
  await page.click('[data-act="fold"]');
  ok("すべて閉じる", (await page.$$eval("details.meal", (els) => els.filter((e) => e.open).length)) === 0);
  ok("閉じても料理名が見える", (await page.textContent('details.meal[data-day="1"] > summary')).includes("ほか"));
  await page.click('details.meal[data-day="3"] > summary');
  ok("1日だけ開く", (await page.$$eval("details.meal", (els) => els.filter((e) => e.open).map((e) => e.dataset.day))).join() === "3");
  await page.click('[data-act="fold"]');
  ok("すべて開く", (await page.$$eval("details.meal", (els) => els.filter((e) => e.open).length)) === 7);

  // この日を変える
  const before = await mains(page);
  await page.click('[data-swap="3"]');
  const after = await mains(page);
  ok("この日を変える: 水曜だけ変わる", after[2] !== before[2] && after.filter((m, i) => m !== before[i]).length === 1, `${before[2]}→${after[2]}`);
  ok("この日を変えたお知らせ", (await page.textContent("#toast")).includes("水曜日"));
  await page.click('[data-act="reroll"]');
  ok("別の組み合わせで変わる", (await mains(page)).join() !== after.join());

  // 人数
  await page.click('[data-step="adults"][data-d="1"]');
  ok("大人を3人に", (await page.textContent("#adults-v")) === "3人" && (await page.textContent(".shop-meta")).includes("大人3人"));
  for (let i = 0; i < 12; i++) await page.click('[data-step="adults"][data-d="1"]');
  ok("大人は10人まで", (await page.textContent("#adults-v")) === "10人");
  for (let i = 0; i < 3; i++) await page.click('[data-step="children"][data-d="-1"]');
  ok("子どもは0人まで", (await page.textContent("#children-v")) === "0人");

  // 買い物リスト
  await page.click(".shop-group .item >> nth=0");
  ok("買ったチェック", (await page.textContent("#shop-count")).startsWith("1/"));
  await page.click('[data-act="copy-shop"]');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  ok("買い物リストのコピー", clip.startsWith("買い物リスト（") && clip.includes("【野菜】") && clip.includes("✓"), clip.slice(0, 80));
  await page.click('[data-act="copy-menu"]');
  const menu = await page.evaluate(() => navigator.clipboard.readText());
  ok("献立のコピー", menu.startsWith("今週の夕食\n月　") && menu.split("\n").length === 8, menu.slice(0, 80));

  // 再読み込みで復元
  const keep = await mains(page);
  await page.reload();
  ok("再読み込みで条件が戻る", (await page.getAttribute('button.food[data-dislike="牛肉"]', "aria-pressed")) === "true" && (await page.textContent("#adults-v")) === "10人" && (await page.isChecked('input[name="allergen"][value="卵"]')));
  ok("再読み込みで同じ献立", (await mains(page)).join() === keep.join());
  ok("再読み込みでチェックが戻る", (await page.textContent("#shop-count")).startsWith("1/"));

  // キーボードだけで操作
  await page.focus('button.food[data-dislike="なす"]');
  await page.keyboard.press("Space");
  ok("キーボードで苦手を選べる", (await page.getAttribute('button.food[data-dislike="なす"]', "aria-pressed")) === "true");
  await page.focus('input[name="genre"][value="中"]');
  await page.keyboard.press("Space");
  ok("キーボードでジャンルを選べる", (await page.textContent(".overview")).includes("中華 4日"));

  // 下の帯（スマホで条件を見ているとき）
  await page.locator(".settings .foods").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  ok("条件を見ているとき下に「献立を見る」", await page.isVisible("#bottom-bar"));
  await page.click("#bottom-bar .bottom-link");
  await page.waitForTimeout(600);
  ok("「献立を見る」で献立へ", await page.evaluate(() => { const b = document.querySelector("#week-h").getBoundingClientRect(); return b.top >= -2 && b.top < innerHeight; }));

  // 何も作れない条件
  await page.evaluate(() => localStorage.setItem("meal-planner.v3", JSON.stringify({ v: 3, input: { adults: 2, children: 0, genrePref: "おまかせ", excludeAllergens: ["卵", "乳", "小麦", "大豆"], dislikes: ["肉", "魚介"], pantry: [], withSide: true, withSoup: true, quickOnly: true, seed: 1 }, swaps: {}, checked: [] })));
  await page.reload();
  const alert = (await page.textContent("#week-body")) || "";
  ok("候補がないとき理由を出す", alert.includes("条件に合う主菜がありません") || (await page.$$(".day")).length === 7, alert.slice(0, 80));
  // 壊れた保存
  await page.evaluate(() => localStorage.setItem("meal-planner.v3", "{broken"));
  await page.reload();
  ok("壊れた保存でも初期状態で開く", (await page.$$(".day")).length === 7 && (await page.textContent("#adults-v")) === "2人");
  // 前の版の保存からアレルギーを引き継ぐ
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("meal-planner.input", JSON.stringify({ adults: 3, children: 0, genres: ["洋"], excludeAllergens: ["えび"], ngKeywords: ["セロリ"], pantry: [], withSide: true, quickOnly: false, seed: 1 })); });
  await page.reload();
  ok("前の版のアレルギーを引き継ぐ", (await page.isChecked('input[name="allergen"][value="えび"]')) && (await page.textContent("#adults-v")) === "3人");
  ok("前の版の古いキーは消す", (await page.evaluate(() => localStorage.getItem("meal-planner.input"))) === null);
  await ctx.close();
}

// ---- オフライン ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "allow" });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready.then(() => true), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await ctx.setOffline(true);
  let offlineOk = false;
  try {
    await page.reload({ waitUntil: "load" });
    await page.click('button.food[data-dislike="魚"]');
    await page.click('[data-swap="5"]');
    await page.locator(".day >> nth=4").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const imgs = await page.$$eval(".day:nth-child(5) img", (els) => els.length > 0 && els.every((e) => e.complete && e.naturalWidth > 0));
    const cachedArt = await page.evaluate(async () => (await (await caches.open("meal-planner-v3")).keys()).filter((r) => r.url.endsWith(".webp")).length);
    report.cachedArt = cachedArt;
    offlineOk = (await page.$$(".day")).length === 7 && imgs && cachedArt >= 40;
  } catch (e) { report.offlineError = String(e); }
  ok("オフラインで開いて献立を変えられる（絵も出る）", offlineOk, report.offlineError || "");
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
