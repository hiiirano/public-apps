// 画面と動作の検査（テスト計画書 03 の E2E・画面・アクセシビリティ・通信・オフライン）。
// 使い方: npm run build && npx vite preview --port 4315 --host 127.0.0.1 を起動してから
//   npm run test:e2e   （URL と保存先は E2E_URL / E2E_OUT で変えられる）
import { chromium } from "playwright";
import fs from "node:fs";
import { createRequire } from "node:module";

const URL = process.env.E2E_URL || "http://127.0.0.1:4315/";
const OUT = process.env.E2E_OUT || new globalThis.URL("../test-results", import.meta.url).pathname;
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const ORIGIN = new globalThis.URL(URL).origin;
const NOW = new Date("2026-10-23T09:00:00+09:00"); // 2026-10-23（金）東京の朝
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], audits: [], axe: [], external: [] };
const ok = (name, cond, detail = "") => report.checks.push({ name, ok: !!cond, detail: String(detail) });

const browser = await chromium.launch();

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ja-JP", timezoneId: "Asia/Tokyo", deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(ORIGIN) && !u.startsWith("data:") && !u.startsWith("blob:")) report.external.push(u);
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install({ time: NOW });
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  return { ctx, page, errors };
}

async function audit(page, label) {
  const r = await page.evaluate(() => {
    const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, small: [], tinyInput: [], tinyText: [], overlaps: [] };
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0 && !el.closest("[hidden]") && !el.classList.contains("sr-only"); };
    const targets = [...document.querySelectorAll("button, a, input:not([type=radio]), summary, label:has(input[type=radio])")].filter(vis).filter((el) => !el.classList.contains("skip"));
    for (const el of targets) { const b = el.getBoundingClientRect(); if (b.width < 44 - 0.5 || b.height < 44 - 0.5) out.small.push(`${el.tagName}.${el.className} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20)}" ${Math.round(b.width)}x${Math.round(b.height)}`); }
    for (const el of document.querySelectorAll("input")) { if (!vis(el) || el.type === "radio") continue; if (parseFloat(getComputedStyle(el).fontSize) < 16) out.tinyInput.push(el.id || el.className); }
    // 本文（段落・一覧）の文字が 16px 未満になっていないか（札や数の注記は除く）
    for (const el of document.querySelectorAll("p, li > span:not(.pill):not(.tqty):not(.wnum), .hint")) { if (!vis(el) || !el.textContent.trim()) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 15.5 && !el.closest(".pill, .tchip, .qplace, .urow-place, .st-count, .nlabel")) out.tinyText.push(`${el.className || el.tagName} ${fs}`); }
    const boxes = targets.map((el) => [el, el.getBoundingClientRect()]);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const [a, A] = boxes[i], [b, B] = boxes[j]; if (a.contains(b) || b.contains(a)) continue;
      const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (w > 1 && h > 1 && !a.closest(".toast") && !b.closest(".toast") && !!a.closest("dialog") === !!b.closest("dialog")) out.overlaps.push(`${a.className}|${b.className}`);
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

// ---- 4幅 × ライト/ダーク の画面検査 ----
for (const scheme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    const { ctx, page, errors } = await newPage({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: scheme, bypassCSP: true });
    const tag = `${width}-${scheme}`;
    await audit(page, `${tag} 空`);
    await page.screenshot({ path: `${OUT}/${tag}-1-empty.png`, fullPage: true });
    if (width === 390 || scheme === "light") await runAxe(page, `${tag} 空`);
    await page.click("#sample-btn");
    await page.click('#toast [data-act="undo"]'); // 取り消しの帯を消してから見る
    await page.click("#sample-btn");
    await page.evaluate(() => (document.querySelector("#toast").hidden = true));
    await page.click("#quick-more");
    await audit(page, `${tag} 見本`);
    await page.screenshot({ path: `${OUT}/${tag}-2-sample.png`, fullPage: true });
    if (width === 390 || scheme === "light") await runAxe(page, `${tag} 見本`);
    await page.click(".st-fridge .tile >> nth=0");
    await page.click("#art-pick summary");
    await audit(page, `${tag} 直す画面`);
    await page.screenshot({ path: `${OUT}/${tag}-3-dialog.png` });
    if (width === 390) await runAxe(page, `${tag} 直す画面`);
    ok(`${tag} ページエラーなし`, errors.length === 0, errors.join(" / "));
    await ctx.close();
  }
}

// ---- 動作の確認（390 ライト）----
{
  const { ctx, page, errors } = await newPage({ acceptDownloads: true });
  const text = (sel) => page.textContent(sel);
  ok("空のとき案内", (await text("#urgent")).includes("まだ何も入っていません") && (await page.isVisible("#sample-btn")));
  ok("空のとき3つの置き場所", (await page.$$eval(".st-empty", (e) => e.length)) === 3);
  ok("今日の日付", (await text(".today-date")).includes("10/23（金）"), await text(".today-date"));

  // よく買う物をボタンで入れる
  await page.click('button.qbtn:has-text("牛乳")');
  ok("牛乳が冷蔵庫に入る", (await text(".st-fridge")).includes("牛乳") && (await text(".st-fridge .tile")).includes("あと7日"), await text(".st-fridge"));
  ok("入れたお知らせに期限", (await text("#toast")).includes("期限 10/30（金）"), await text("#toast"));
  // お知らせの「直す」から期限を今日に
  await page.click('#toast button:has-text("直す")');
  ok("直す画面が開く", await page.isVisible("#dlg"));
  await page.click('#dlg button.chip:has-text("今日")');
  ok("期限を今日にすると「今日まで」", (await text("#f-exp-msg")).includes("今日まで"));
  await page.click('#dlg button:has-text("1か月後")');
  ok("1か月後は 11/23", (await page.inputValue("#f-exp")) === "2026-11-23", await page.inputValue("#f-exp"));
  await page.click('#dlg button.chip:has-text("今日")');
  await page.click("#dlg-save");
  ok("保存で閉じる", !(await page.isVisible("#dlg")));
  ok("棚の札が「今日まで」", (await text(".st-fridge .tile")).includes("今日まで"));
  ok("そろそろ使う物に出る", (await text("#urgent")).includes("牛乳"));
  ok("今日までの数 1", (await text(".tchip.lv-today .tnum")) === "1");

  // ほかの物を入れる
  await page.click('button:has-text("ほかの物を入れる")');
  await page.click("#dlg-save");
  ok("名前が空だと注意", (await text("#f-name-msg")).includes("名前を入れて"));
  await page.fill("#f-name", "鶏むね肉");
  ok("名前から絵を当てる", (await page.getAttribute("#dlg-art", "src")).includes("chicken"));
  await page.click('label.seg-opt:has-text("冷凍庫")');
  await page.click('[data-act="qty-inc"]');
  await page.click('[data-act="qty-inc"]');
  await page.fill("#f-exp", "2026-10-25");
  ok("日付を入れると「あと2日」", (await text("#f-exp-msg")).includes("あと2日"));
  await page.click("#dlg-save");
  ok("冷凍庫に ×3 で入る", (await text(".st-freezer")).includes("鶏むね肉") && (await text(".st-freezer .tqty")) === "×3" && (await text(".st-freezer .tile")).includes("あと2日"));

  // 絵を自分で選ぶ
  await page.click('button:has-text("ほかの物を入れる")');
  await page.fill("#f-name", "<b>x</b>");
  await page.click("#art-pick summary");
  await page.click('label.art-opt:has(input[value="can"])');
  ok("選んだ絵になる", (await page.getAttribute("#dlg-art", "src")).includes("can"));
  await page.click('label.seg-opt:has-text("棚")');
  await page.click('#dlg button:has-text("期限なし")');
  await page.click("#dlg-save");
  ok("入力は文字として出る（タグにならない）", (await page.$$eval(".st-shelf .tname", (e) => e.map((x) => x.textContent))).includes("<b>x</b>") && (await page.$$(".st-shelf .tname b")).length === 0);
  ok("期限なしの札", (await text(".st-shelf .tile")).includes("期限なし"));

  // 使った・捨てた・元に戻す
  await page.click('.urow:has-text("牛乳") button:has-text("使った")');
  ok("使ったら在庫から消える", !(await text(".st-fridge")).includes("牛乳"));
  ok("記録に「使い切った 1」", (await text(".num.used .nval")).startsWith("1"));
  await page.click('.st-freezer .tile:has-text("鶏むね肉")');
  ok("2つ以上なら「1つ捨てた」", (await text('[data-act="dlg-wasted"]')).includes("1つ捨てた"));
  await page.click('[data-act="dlg-wasted"]');
  ok("1つ捨てると ×2", (await text(".st-freezer .tqty")) === "×2");
  ok("記録に「捨てた 1」", (await text(".num.wasted .nval")).startsWith("1"));
  ok("捨てた割合 50%", (await text(".rate")).includes("50%"), await text(".rate"));
  await page.click('#toast [data-act="undo"]');
  ok("元に戻すと ×3・捨てた記録も消える", (await text(".st-freezer .tqty")) === "×3" && (await text(".num.wasted .nval")).startsWith("0"));
  // 2回捨てると「買いすぎかも」
  for (let i = 0; i < 2; i++) {
    await page.click('.st-freezer .tile:has-text("鶏むね肉")');
    await page.click('[data-act="dlg-wasted"]');
  }
  ok("2つ捨てると「買いすぎかも」", (await text(".overbuy")).includes("鶏むね肉"), await text("#stats"));
  // 記録せずに消す
  await page.click('.st-shelf .tile:has-text("<b>x</b>")');
  await page.click('[data-act="dlg-remove"]');
  ok("記録せずに消す", (await page.$$(".st-shelf .tile")).length === 0 && (await text("#toast")).includes("記録はしていません"));
  await page.keyboard.press("Escape");

  // 日付が変わる（開いたまま夜をまたぐ）
  await page.clock.setSystemTime(new Date("2026-10-25T00:00:30+09:00"));
  await page.clock.runFor(61_000);
  ok("日付が変わると表示も変わる", (await text(".today-date")).includes("10/25（日）") && (await text(".st-freezer .tile")).includes("今日まで"), await text(".st-freezer .tile"));
  await page.clock.setSystemTime(new Date("2026-10-26T08:00:00+09:00"));
  await page.clock.runFor(61_000);
  ok("期限を過ぎると「1日すぎ」", (await text(".st-freezer .tile")).includes("1日すぎ") && (await text(".tchip.lv-expired .tnum")) === "1");

  // 再読み込みで残る
  await page.reload();
  ok("再読み込みで残る", (await text(".st-freezer")).includes("鶏むね肉") && (await text("#stats")).includes("捨てた"));

  // 書き出し・すべて消す・読み込み
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('button:has-text("書き出す")')]);
  const file = `${OUT}/export.json`;
  await dl.saveAs(file);
  const exported = JSON.parse(fs.readFileSync(file, "utf8"));
  ok("書き出したファイル", dl.suggestedFilename().startsWith("pantry-2026-") && exported.kind === "pantry-tracker" && exported.items.length === 1 && exported.log.length === 3, dl.suggestedFilename());
  await page.click('button:has-text("すべて消す")');
  ok("すべて消す", (await page.$$(".tile")).length === 0);
  const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click('button:has-text("読み込む")')]);
  await fc.setFiles(file);
  await page.waitForFunction(() => document.querySelectorAll(".tile").length === 1);
  ok("読み込むと元どおり", (await text(".st-freezer")).includes("鶏むね肉") && (await text("#data-msg")).includes("読み込みました"));
  fs.writeFileSync(`${OUT}/bad.json`, '{"kind":"other"}');
  const [fc2] = await Promise.all([page.waitForEvent("filechooser"), page.click('button:has-text("読み込む")')]);
  await fc2.setFiles(`${OUT}/bad.json`);
  await page.waitForFunction(() => document.querySelector("#data-msg").textContent.includes("読み込めません"));
  ok("違うファイルは読み込まず、中身も変えない", (await page.$$(".tile")).length === 1);

  // 悪意のある id・名前を含むファイルを読み込んでも、HTML が混ざらない
  const evil = { kind: "pantry-tracker", version: 2, exportedOn: "2026-10-23", freq: {},
    items: [{ id: '"><img src=x id=pwned onerror="window.__pwned=1">', name: '"><b id=pwn2>x', art: "milk", place: "fridge", qty: 1, expiry: "2026-10-23", addedOn: "2026-10-23" }],
    log: [{ id: "<svg onload=window.__pwned=3>", name: "<b>悪</b>", art: "egg", outcome: "wasted", qty: 2, date: "2026-10-22" }] };
  fs.writeFileSync(`${OUT}/evil.json`, JSON.stringify(evil));
  const [fc3] = await Promise.all([page.waitForEvent("filechooser"), page.click('button:has-text("読み込む")')]);
  await fc3.setFiles(`${OUT}/evil.json`);
  await page.waitForFunction(() => document.querySelector("#data-msg").textContent.includes("読み込みました"));
  await page.waitForTimeout(300);
  const pw = await page.evaluate(() => ({ flag: window.__pwned ?? null, img: !!document.querySelector("#pwned, #pwn2, .tile img[src='x'], #stats b, #stats svg[onload]"), ids: [...document.querySelectorAll("[data-id]")].map((e) => e.dataset.id) }));
  ok("悪意のあるファイルでも HTML が混ざらない", pw.flag === null && !pw.img && pw.ids.every((i) => /^[A-Za-z0-9_-]{1,64}$/.test(i)), JSON.stringify(pw));
  ok("悪意のある名前は文字のまま出る", (await page.$$eval(".tname", (e) => e.map((x) => x.textContent))).some((t) => t === '"><b id=pwn2>x'));
  await page.click('.st-fridge .tile');
  ok("振り直した id で開ける", await page.isVisible("#dlg"));
  await page.keyboard.press("Escape");
  await page.click('#toast [data-act="undo"]').catch(() => {});
  await Promise.all([page.waitForEvent("filechooser"), page.click('button:has-text("読み込む")')]).then(([f]) => f.setFiles(file));
  await page.waitForFunction(() => [...document.querySelectorAll(".tname")].some((e) => e.textContent === "鶏むね肉"));

  // よく買う物は「ぜんぶ見る」で32種
  await page.click("#quick-more");
  ok("ぜんぶ見るで32種", (await page.$$(".qbtn")).length === 32);
  ok("ぜんぶ見るの状態を伝える", (await page.getAttribute("#quick-more", "aria-expanded")) === "true");

  // キーボードだけで入れる
  await page.focus('button.qbtn:has-text("卵")');
  await page.keyboard.press("Enter");
  ok("キーボードで卵を入れる", (await text(".st-fridge")).includes("卵"));
  await page.focus('.st-fridge .tile:has-text("卵")');
  await page.keyboard.press("Enter");
  ok("キーボードで開く", await page.isVisible("#dlg"));
  await page.keyboard.press("Escape");
  ok("Esc で閉じる", !(await page.isVisible("#dlg")));

  // 古い形式（v0.1）からの移しかえと、AI 設定（API キー）の削除
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("pantry-tracker.items", JSON.stringify([{ id: "x", name: "ヨーグルト", qty: 2, unit: "個", category: "食品", location: "冷蔵", expiry: "2026-10-27", minQty: 0 }]));
    localStorage.setItem("pantry-tracker.llm", JSON.stringify({ apiKey: "sk-test" }));
  });
  await page.reload();
  ok("古い形式の在庫を読み込む", (await text(".st-fridge")).includes("ヨーグルト"));
  ok("古い API キーを消す", (await page.evaluate(() => localStorage.getItem("pantry-tracker.llm"))) === null);
  ok("API キーの入力欄がない", (await page.$$('input[type="password"], #llm-key')).length === 0);
  // 壊れた保存内容
  await page.evaluate(() => localStorage.setItem("pantry-tracker.v2", "{broken"));
  await page.reload();
  ok("壊れた保存内容でも開ける", (await text("#urgent")).includes("まだ何も"));
  ok("動作中のページエラーなし", errors.length === 0, errors.join(" / "));
  await ctx.close();
}

// ---- 保存できない環境 ----
{
  const { ctx, page, errors } = await newPage();
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error("quota"); }; });
  await page.reload();
  await page.click('button.qbtn:has-text("牛乳")');
  ok("保存できなくても使える", (await page.textContent(".st-fridge")).includes("牛乳") && (await page.textContent("#save-note")).includes("保存できない"));
  ok("保存できない環境でエラーなし", errors.length === 0, errors.join(" / "));
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
    await page.click('button.qbtn:has-text("パン")');
    offlineOk = (await page.textContent(".st-shelf")).includes("パン");
    offlineOk &&= await page.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  } catch (e) { report.offlineError = String(e); }
  ok("オフラインで開いて使える（絵も出る）", offlineOk, report.offlineError || "");
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
