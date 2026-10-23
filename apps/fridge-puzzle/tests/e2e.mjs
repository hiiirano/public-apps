// 画面と動作の検査（テスト計画書 03 の T6〜T9）。
// 使い方: npm run build && npm run preview を起動してから npm run test:e2e
//   （URL と保存先は E2E_URL / E2E_OUT で変えられる）
import { chromium } from "playwright";
import fs from "node:fs";
import { createRequire } from "node:module";

const URL = process.env.E2E_URL || "http://127.0.0.1:4318/";
const OUT = process.env.E2E_OUT || new globalThis.URL("../test-results", import.meta.url).pathname;
const ORIGIN = new globalThis.URL(URL).origin;
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], audits: [], axe: [], external: [] };
const ok = (name, cond, detail = "") => report.checks.push({ name, ok: !!cond, detail: String(detail) });

const browser = await chromium.launch();

function watch(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:")) report.external.push(r.url());
  });
  return errors;
}

async function audit(page, label) {
  const r = await page.evaluate(() => {
    const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, small: [], tinyInput: [], overlaps: [], smallText: [] };
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0; };
    const targets = [...document.querySelectorAll("button, a, input")].filter(vis);
    for (const el of targets) { const b = el.getBoundingClientRect(); if (b.width < 44 - 0.5 || b.height < 44 - 0.5) out.small.push(`${el.tagName}.${el.className} ${Math.round(b.width)}x${Math.round(b.height)}`); }
    for (const el of document.querySelectorAll("input")) if (vis(el) && parseFloat(getComputedStyle(el).fontSize) < 16) out.tinyInput.push(el.id || el.className);
    // 文章（p・ボタンの文字）は 16px 以上
    for (const el of document.querySelectorAll("p, button, li, .cand-name")) {
      if (!vis(el) || el.closest(".sr-only")) continue;
      if (!el.textContent.trim()) continue;
      if (parseFloat(getComputedStyle(el).fontSize) < 15.5) out.smallText.push(`${el.className} ${getComputedStyle(el).fontSize}`);
    }
    const boxes = targets.map((el) => [el, el.getBoundingClientRect()]);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const [a, A] = boxes[i], [b, B] = boxes[j]; if (a.contains(b) || b.contains(a)) continue;
      const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (w > 1 && h > 1) out.overlaps.push(`${a.className}|${b.className}`);
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

const cellLabels = (page) => page.$$eval(".cell", (els) => els.map((e) => e.getAttribute("aria-label")));
const moves = async (page) => Number(await page.textContent("#hud-moves"));

/** ヒントの指が示す2マスを順に押して、今の面をクリアする。押した回数を返す */
async function clearStageWithHints(page) {
  let taps = 0;
  for (let k = 0; k < 30; k++) {
    if (!(await page.$(".phase-play"))) break;
    if (!(await page.$(".cell.hint-a"))) await page.click("#hint");
    const a = await page.getAttribute(".cell.hint-a", "data-slot");
    const b = await page.getAttribute(".cell.hint-b", "data-slot");
    await page.click(`[data-slot="${a}"]`);
    await page.click(`[data-slot="${b}"]`);
    taps++;
  }
  return taps;
}

async function playToQuestion(page) {
  for (let s = 0; s < 3; s++) {
    await page.waitForSelector(".phase-play");
    await clearStageWithHints(page);
    await page.waitForSelector(s < 2 ? `.phase-play .hud-v:has-text("${s + 2}/3")` : ".phase-question", { timeout: 8000 });
  }
}

// ---- T7 4幅 × ライト/ダーク の画面検査（動きを減らす設定で手早く） ----
for (const scheme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: scheme, reducedMotion: "reduce", locale: "ja-JP", bypassCSP: true });
    const page = await ctx.newPage();
    const errors = watch(page);
    await page.goto(URL);
    const tag = `${width}-${scheme}`;
    await page.waitForSelector(".cell");
    await audit(page, `${tag} パズル`);
    await page.screenshot({ path: `${OUT}/${tag}-1-puzzle.png`, fullPage: true });
    if (scheme === "light" || width === 390) await runAxe(page, `${tag} パズル`);
    await playToQuestion(page);
    await audit(page, `${tag} 持ち主当て`);
    await page.screenshot({ path: `${OUT}/${tag}-2-question.png`, fullPage: true });
    if (scheme === "light" || width === 390) await runAxe(page, `${tag} 持ち主当て`);
    await page.click(".cand >> nth=0");
    await page.waitForSelector(".phase-result");
    await audit(page, `${tag} 結果`);
    await page.screenshot({ path: `${OUT}/${tag}-3-result.png`, fullPage: true });
    if (scheme === "light" || width === 390) await runAxe(page, `${tag} 結果`);
    ok(`${tag} ページエラーなし`, errors.length === 0, errors.join(" / "));
    await ctx.close();
  }
}

// ---- T6 1ラウンド通して遊ぶ（390 ライト・ふつうの動き） ----
let sharedUrl = "";
let firstBoard = [];
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ja-JP", permissions: ["clipboard-read", "clipboard-write"] });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, "share", { value: undefined }); });
  const page = await ctx.newPage();
  const errors = watch(page);
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(".cell");
  firstBoard = await cellLabels(page);

  // 説明を読まなくても、最初の1手を指が見せている
  ok("最初から指が出ている", await page.isVisible(".finger"));
  ok("指が示す2マスに 1・2 の印", (await page.$$(".cell.hint-a .hint-badge")).length === 1 && (await page.$$(".cell.hint-b .hint-badge")).length === 1);
  ok("1面目は3段×3列", (await page.$$(".cell")).length === 9);
  ok("手数0・目標が出ている", (await moves(page)) === 0 && (await page.textContent(".hud")).includes("目標"));
  await page.waitForTimeout(1300);
  const t1 = await page.textContent("#hud-time");
  ok("タイムが進む", t1 !== "0:00", t1);

  // 同じ種類どうしは入れかえない
  const labels = await cellLabels(page);
  const kindOf = (l) => l.split(" ").pop();
  const j = labels.findIndex((l, i) => i > 0 && kindOf(l) === kindOf(labels[0]));
  await page.click('[data-slot="0"]');
  await page.click(`[data-slot="${j}"]`);
  ok("同じ種類は手数に数えない", (await moves(page)) === 0);
  await page.click(`[data-slot="${j}"]`); // 選択をやめる
  ok("同じマスで選択をやめる", (await page.$$(".cell.is-selected")).length === 0);

  // 指のとおりに押す
  await page.click("#hint");
  const a = await page.getAttribute(".cell.hint-a", "data-slot");
  const b = await page.getAttribute(".cell.hint-b", "data-slot");
  await page.click(`[data-slot="${a}"]`);
  ok("1つ目を押すと選ばれ、指は2つ目へ", (await page.getAttribute(`[data-slot="${a}"]`, "aria-pressed")) === "true" && (await page.$(".finger.only-b")) !== null);
  const before = await cellLabels(page);
  await page.click(`[data-slot="${b}"]`);
  const after = await cellLabels(page);
  ok("2つ目で入れかわる", kindOf(after[a]) === kindOf(before[b]) && kindOf(after[b]) === kindOf(before[a]));
  ok("手数が1増える", (await moves(page)) === 1);
  ok("1手目の後は指が消える", !(await page.$(".finger")));

  await clearStageWithHints(page);
  await page.waitForSelector(".overlay.clear-pop");
  ok("クリア表示と★", (await page.textContent(".overlay")).includes("CLEAR") && (await page.$$(".overlay .stars .on")).length >= 1);
  await page.waitForSelector('.phase-play .hud-v:has-text("2/3")', { timeout: 6000 });
  ok("2面目は3段×4列に増える", (await page.$$(".cell")).length === 12 && (await page.$(".grid.cols-4")) !== null);
  ok("2面目は指が出ていない", !(await page.$(".finger")));

  // キーボードだけで1手
  await page.focus('[data-slot="0"]');
  await page.keyboard.press("ArrowRight");
  ok("矢印キーでマスを移動", (await page.evaluate(() => document.activeElement?.dataset.slot)) === "1");
  await page.keyboard.press("ArrowDown");
  ok("下の段へ移動", (await page.evaluate(() => document.activeElement?.dataset.slot)) === "5");

  // 手が止まると指が出る
  await page.waitForTimeout(10000);
  ok("10秒手が止まると指が出る", await page.isVisible(".finger"));
  await clearStageWithHints(page);
  await page.waitForSelector('.phase-play .hud-v:has-text("3/3")', { timeout: 6000 });
  ok("3面目は4段×4列", (await page.$$(".cell")).length === 16);
  const par3 = Number((await page.textContent(".hud-sub")).replace(/\D/g, ""));
  ok("面が進むほど目標手数が増える", par3 >= 6, par3);
  await clearStageWithHints(page);
  await page.waitForSelector(".overlay.all-clear", { timeout: 6000 });
  ok("ALL CLEAR が出る", (await page.textContent(".overlay")).includes("ALL CLEAR"));
  await page.waitForSelector(".phase-question", { timeout: 6000 });
  await page.screenshot({ path: `${OUT}/flow-question.png` });

  ok("突然「持ち主は誰？」", (await page.textContent("#q-title")).includes("持ち主は誰"));
  ok("候補は4人", (await page.$$(".cand")).length === 4);
  const held = await page.$$eval(".cand .held img", (els) => els.map((e) => e.getAttribute("src")));
  ok("4人とも何かを持っている（重ならない）", held.length === 4 && new Set(held).size === 4, held.join());
  ok("いかにもヒントっぽい一言", (await page.textContent(".fake-hint")).includes("ヒント"));
  const inside = await page.getAttribute(".fridge-inside", "aria-label");
  ok("冷蔵庫の中身がお菓子だけではない", inside.split("、").length >= 10, inside);

  await page.click(".cand >> nth=2");
  ok("判定中の間がある", (await page.textContent(".open-fridge")).includes("判定中"));
  await page.waitForSelector(".phase-result", { timeout: 5000 });
  const result = await page.textContent(".result");
  ok("正解の発表", /正解(！|は…)/.test(result));
  ok("オチ「持ち物は一切関係ありません」", result.includes("一切関係ありません"));
  ok("パズルの成績（★・手数・タイム）", result.includes("パズルの成績") && result.includes("最短"));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("hiehie-fridge.v2")));
  ok("遊んだ回数とベストを保存", saved?.plays === 1 && saved.best?.stars >= 3, JSON.stringify(saved));
  await page.screenshot({ path: `${OUT}/flow-result.png`, fullPage: true });

  await page.click("#share");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  sharedUrl = clip.split("\n").pop();
  ok("共有リンクをコピー", /#play=hiehie-fridge&v=2&seed=[a-z0-9]+&pick=2&m=\d+&t=\d+$/.test(sharedUrl), clip);
  ok("コピーのお知らせ", (await page.textContent(".share-notice")).includes("コピー"));

  await page.click("#again");
  await page.waitForSelector(".cell");
  ok("もう1回で1面目から", (await page.$$(".cell")).length === 9 && (await moves(page)) === 0);
  ok("もう1回では指がまた出る", await page.isVisible(".finger"));
  ok("ページエラーなし（通し）", errors.length === 0, errors.join(" / "));
  await ctx.close();
}

// ---- T6 友だちが共有リンクを開く ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ja-JP" });
  const page = await ctx.newPage();
  const errors = watch(page);
  await page.goto(sharedUrl);
  await page.waitForSelector(".cell");
  ok("友だちの問題だと分かる", (await page.textContent(".from-friend")).includes("友だち"));
  ok("友だちにも同じ1面目", (await cellLabels(page)).join() === firstBoard.join());
  await playToQuestion(page);
  await page.click(".cand >> nth=0");
  await page.waitForSelector(".phase-result");
  const text = await page.textContent(".result");
  ok("送った人の答えと成績を並べる", text.includes("送った人") && /送った人: \d+手/.test(text), text.slice(0, 200));
  ok("ページエラーなし（友だち）", errors.length === 0, errors.join(" / "));

  // 違う問題が出る（3回開いて少なくとも2種類）
  const boards = new Set();
  for (let i = 0; i < 3; i++) {
    await page.goto(URL);
    await page.waitForSelector(".cell");
    boards.add((await cellLabels(page)).join());
  }
  ok("開くたびに盤面が変わる", boards.size >= 2, boards.size);

  // 壊れたリンク・前の版のリンク
  for (const bad of ["#play=hiehie-fridge&v=2&seed=BAD!&pick=9", "#play=hiehie-fridge&round=sweets-02&seed=abc12345&pick=0", "#%E0%A4%A"]) {
    await page.goto("about:blank");
    await page.goto(URL + bad);
    await page.waitForSelector(".cell");
    const note = (await page.$(".notice")) ? await page.textContent(".notice") : "";
    ok(`壊れたリンクは新しい問題に（${bad.slice(0, 28)}）`, note.includes("新しい問題") && !page.url().includes("#") && !(await page.$(".from-friend")), note);
  }
  // 保存が壊れていても遊べる
  await page.evaluate(() => localStorage.setItem("hiehie-fridge.v2", "{broken"));
  await page.reload();
  await page.waitForSelector(".cell");
  ok("保存が壊れていても開ける", (await page.$$(".cell")).length === 9);
  await ctx.close();
}

// ---- T9 オフライン ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "allow" });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready.then(() => true), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await ctx.setOffline(true);
  let offlineOk = false;
  try {
    for (let i = 0; i < 3; i++) {
      await page.reload({ waitUntil: "load" });
      await page.waitForSelector(".cell", { timeout: 5000 });
      const imgsOk = await page.$$eval(".cell-img", (els) => els.every((e) => e.complete && e.naturalWidth > 0));
      if (!imgsOk) throw new Error("絵が出ない");
    }
    await page.click("#hint");
    offlineOk = (await page.$$(".cell.hint-a")).length === 1;
  } catch (e) { report.offlineError = String(e); }
  ok("オフラインで開いて遊べる（絵も出る）", offlineOk, report.offlineError || "");
  await ctx.close();
}

await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
const bad = report.checks.filter((c) => !c.ok);
const auditBad = report.audits.filter((a) => a.overflowX || a.small.length || a.tinyInput.length || a.overlaps.length || a.smallText.length);
const axeBad = report.axe.filter((a) => a.violations.length);
console.log(`動作 ${report.checks.length - bad.length}/${report.checks.length} 合格`);
bad.forEach((c) => console.log("  NG", c.name, c.detail.slice(0, 300)));
console.log(`画面検査 ${report.audits.length - auditBad.length}/${report.audits.length} 合格`);
auditBad.forEach((a) => console.log("  NG", a.label, JSON.stringify({ x: a.overflowX, small: a.small.slice(0, 5), tiny: a.tinyInput, ov: a.overlaps.slice(0, 5), text: a.smallText.slice(0, 5) })));
console.log(`axe ${report.axe.length - axeBad.length}/${report.axe.length} 違反なし`);
axeBad.forEach((a) => console.log("  NG", a.label, JSON.stringify(a.violations)));
console.log(`外部への通信 ${new Set(report.external).size} 件`, [...new Set(report.external)].slice(0, 5).join(" "));
if (bad.length || auditBad.length || axeBad.length || report.external.length) process.exit(1);
