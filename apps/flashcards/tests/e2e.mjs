// 画面と動作の検査（テスト計画書 03 の T3〜T7）。
// 使い方: npm run build && npm run preview（ポート 4316）を起動してから
//   npm run test:e2e   （URL と保存先は E2E_URL / E2E_OUT で変えられる）
import { chromium } from "playwright";
import fs from "node:fs";
import { createRequire } from "node:module";

const URL = process.env.E2E_URL || "http://127.0.0.1:4316/";
const OUT = process.env.E2E_OUT || new globalThis.URL("../test-results", import.meta.url).pathname;
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const ORIGIN = new globalThis.URL(URL).origin;
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], audits: [], axe: [], external: [] };
const ok = (name, cond, detail = "") => report.checks.push({ name, ok: !!cond, detail: String(detail) });

const browser = await chromium.launch();

function watch(page) {
  const errors = [];
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(ORIGIN) && !u.startsWith("data:") && !u.startsWith("blob:")) report.external.push(u);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

async function audit(page, label) {
  const r = await page.evaluate(() => {
    const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, small: [], tinyInput: [], tinyText: [], overlaps: [] };
    const vis = (el) => {
      const s = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0 && !el.closest("[hidden], [inert]");
    };
    const targets = [...document.querySelectorAll("button, a, input, select, textarea, summary")].filter(vis).filter((el) => !el.classList.contains("skip"));
    for (const el of targets) {
      const b = el.getBoundingClientRect();
      if (b.width < 44 - 0.5 || b.height < 44 - 0.5) out.small.push(`${el.tagName}.${el.className} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20)}" ${Math.round(b.width)}x${Math.round(b.height)}`);
    }
    for (const el of document.querySelectorAll("input, select, textarea")) {
      if (vis(el) && parseFloat(getComputedStyle(el).fontSize) < 16) out.tinyInput.push(el.id || el.className);
    }
    // 本文の文字は 16px 以上
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      const el = n.parentElement;
      if (!n.textContent.trim() || !el || !vis(el) || el.closest(".sr-only")) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16 - 0.01) out.tinyText.push(`${el.tagName}.${el.className} ${fs}px "${n.textContent.trim().slice(0, 12)}"`);
    }
    const boxes = targets.map((el) => [el, el.getBoundingClientRect()]);
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const [a, A] = boxes[i];
        const [b, B] = boxes[j];
        if (a.contains(b) || b.contains(a)) continue;
        const w = Math.min(A.right, B.right) - Math.max(A.left, B.left);
        const h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
        if (w > 1 && h > 1 && !a.closest(".toast") && !b.closest(".toast")) out.overlaps.push(`${a.className}|${b.className}`);
      }
    out.tinyText = [...new Set(out.tinyText)].slice(0, 8);
    return out;
  });
  report.audits.push({ label, ...r });
}

async function runAxe(page, label) {
  await page.addScriptTag({ path: AXE });
  const res = await page.evaluate(async () =>
    (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      n: v.nodes.length,
      sample: v.nodes[0]?.target.join(" "),
    })),
  );
  report.axe.push({ label, violations: res });
}

async function fresh(page) {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL + "#/");
  await page.reload();
}

const flipBtn = (page) => page.getByRole("button", { name: "めくって答えを見る" });
const grade = (page, label) => page.locator(".grade", { hasText: label });

// ---- 4幅 × ライト/ダーク ----
for (const scheme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: scheme, locale: "ja-JP", deviceScaleFactor: 1, bypassCSP: true });
    const page = await ctx.newPage();
    const errors = watch(page);
    await fresh(page);
    const tag = `${width}-${scheme}`;
    const shot = async (n) => {
      await page.waitForTimeout(450);
      await audit(page, `${tag} ${n}`);
      await page.screenshot({ path: `${OUT}/${tag}-${n}.png`, fullPage: true });
      if (scheme === "light" || width === 390) await runAxe(page, `${tag} ${n}`);
    };
    await shot("1-home-empty");
    await page.getByRole("button", { name: "中学英単語 20を入れる" }).click();
    await page.getByRole("button", { name: "都道府県の県庁所在地を入れる" }).click();
    await shot("2-home-decks");
    await page.getByRole("link", { name: /都道府県の県庁所在地/ }).first().click();
    await page.fill("#paste", "apple,りんご\nlibrary\t図書館\nひとつだけ");
    await shot("3-deck");
    await page.goto(URL + "#/");
    await page.getByRole("link", { name: /めくる 20枚/ }).first().click();
    await shot("4-study-front");
    await flipBtn(page).click();
    await shot("5-study-back");
    for (let i = 0; i < 20; i++) {
      await grade(page, "かんたん").click();
      if (i < 19) await flipBtn(page).click();
    }
    await page.getByRole("heading", { name: /今日の分、\s?おわり！/ }).waitFor();
    await shot("6-done");
    ok(`${tag} ページエラーなし`, errors.length === 0, errors.join(" / "));
    await ctx.close();
  }
}

// ---- 動作の確認（390 ライト）----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ja-JP", permissions: ["clipboard-read", "clipboard-write"], acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = watch(page);
  await fresh(page);
  ok("初めは見本の案内", (await page.textContent(".today")).includes("見本"));

  // 見本を入れる
  await page.getByRole("button", { name: "中学英単語 20を入れる" }).click();
  ok("見本を入れると「めくる 20枚」", await page.getByRole("link", { name: /めくる 20枚/ }).isVisible());
  ok("見本のボタンが「開く」に変わる", await page.locator(".sample", { hasText: "中学英単語 20" }).getByRole("link", { name: "開く" }).isVisible());

  // 新しい単語帳
  await page.getByLabel("新しい単語帳を作る").fill("テスト帳");
  await page.getByRole("button", { name: "作る" }).click();
  await page.getByRole("heading", { level: 1, name: "テスト帳" }).waitFor();
  ok("新しい単語帳の画面に移る", page.url().includes("#/deck/"));
  ok("空の単語帳は「まだカードがありません」", (await page.textContent(".deck-go")).includes("まだカードがありません"));

  // 貼り付けでまとめて
  await page.getByLabel("ここに貼り付け").fill("apple,りんご\nlibrary\t図書館\n北海道\n札幌市\n\nひとつだけ\n<img src=x onerror=window.__x=1>,あやしい");
  const prev = await page.textContent("#paste-preview");
  ok("貼り付けの見込み: 4枚・1行は入れられない", prev.includes("4枚 作れます") && prev.includes("1行") && prev.includes("裏がありません"), prev);
  await page.getByRole("button", { name: "4枚を入れる" }).click();
  ok("4枚入る", (await page.$$(".card-row")).length === 4);
  ok("入力は無害化して表示", (await page.evaluate(() => window.__x)) === undefined && (await page.textContent(".card-list")).includes("<img src=x"));
  await page.getByLabel("ここに貼り付け").fill("apple,りんご\nnew,新しい");
  ok("同じカードはとばす", (await page.textContent("#paste-preview")).includes("同じカード 1枚"));
  await page.getByRole("button", { name: "1枚を入れる" }).click();
  ok("5枚になる", (await page.$$(".card-row")).length === 5);

  // 1枚ずつ
  await page.getByRole("button", { name: "1枚入れる" }).click();
  ok("表が空なら注意", (await page.textContent("#one-msg")).includes("表を入れて"));
  await page.getByLabel("表（問題）").fill("borrow");
  await page.getByLabel("裏（答え）").fill("借りる");
  await page.getByRole("button", { name: "1枚入れる" }).click();
  ok("1枚ずつ入れられる", (await page.$$(".card-row")).length === 6 && (await page.textContent(".card-list")).includes("借りる"));

  // 直す
  await page.getByRole("button", { name: "「apple」を直す" }).click();
  await page.getByLabel("裏", { exact: true }).fill("りんご（くだもの）");
  await page.getByRole("button", { name: "保存" }).click();
  ok("カードを直せる", (await page.textContent(".card-list")).includes("りんご（くだもの）"));

  // 消す → 元に戻す
  await page.getByRole("button", { name: "「borrow」を消す" }).click();
  ok("消すと5枚", (await page.$$(".card-row")).length === 5);
  await page.getByRole("button", { name: "元に戻す" }).click();
  ok("元に戻すで6枚", (await page.$$(".card-row")).length === 6);

  // めくる
  await page.getByRole("link", { name: /めくる（6枚）/ }).click();
  ok("のこり6枚", (await page.textContent(".left")).includes("6"));
  ok("めくる前は答えが読み上げ対象外", (await page.getAttribute(".face-back", "aria-hidden")) === "true");
  await flipBtn(page).click();
  ok("めくると答えにフォーカス", await page.evaluate(() => document.activeElement?.id === "answer"));
  const whens = await page.$$eval(".g-when", (els) => els.map((e) => e.textContent.trim()));
  ok("ボタンに次の日（新しいカード）", whens.join() === "もう一度,次はあした,次はあさって,次は4日後", whens.join());
  const firstFront = (await page.textContent(".face-front .face-text")).replace("表: ", "");
  await grade(page, "わからない").click();
  ok("わからないは残り枚数が減らない", (await page.textContent(".left")).includes("6"));
  // ひとつ戻す
  await page.getByRole("button", { name: "ひとつ戻す" }).click();
  ok("ひとつ戻すで前のカードの裏に戻る", (await page.textContent(".face-back .face-q")).includes(firstFront.trim()) && (await page.isVisible(".grades")));
  await grade(page, "わからない").click();
  await page.waitForTimeout(400);
  const seen = [];
  for (let i = 0; i < 20; i++) {
    if (await page.getByRole("heading", { name: /今日の分、\s?おわり！/ }).isVisible()) break;
    seen.push((await page.textContent(".face-front .face-text")).replace("表: ", "").trim());
    await flipBtn(page).click();
    await grade(page, "わかった").click();
    await page.waitForTimeout(400);
  }
  ok("「わからない」のカードがもう一度出る", seen.includes(firstFront.trim()), seen.join("|"));
  ok("おわりの画面とごほうび", await page.getByRole("img", { name: "大変よくできました" }).isVisible());
  const tally = await page.textContent(".tally");
  ok("答えの数（わからない1・わかった6）", /わからない\s*1/.test(tally) && /わかった\s*6/.test(tally), tally);
  ok("つづけた日数 1日", (await page.textContent(".done")).includes("1日つづけています"));

  // キーボードだけで
  await page.goto(URL + "#/");
  await page.getByRole("link", { name: /めくる 20枚/ }).click();
  await page.waitForSelector(".flash");
  await page.locator("h1").first().focus();
  await page.keyboard.press("Space");
  ok("スペースでめくる", await page.isVisible(".grades"));
  await page.keyboard.press("3");
  await page.waitForTimeout(400);
  ok("3 で「わかった」→ 次へ", (await page.textContent(".left")).includes("19"));
  await page.keyboard.press("Enter");
  ok("Enter（めくるボタン）でめくる", await page.isVisible(".grades"));
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  ok("Tab で答えのボタンへ移って Enter", (await page.textContent(".left")).includes("18") || (await page.textContent(".left")).includes("19"));

  // 再読み込みで残る
  await page.goto(URL + "#/");
  await page.reload();
  ok("再読み込みで残る（2冊・つづけた日）", (await page.$$(".deck-tile")).length === 2 && (await page.textContent(".today")).includes("1日つづけています"));

  // 1日の新しいカード
  await page.getByRole("button", { name: "都道府県の県庁所在地を入れる" }).click();
  ok("47枚の見本でも、新しいカードは1日20枚", await page.getByRole("link", { name: /めくる 20枚/ }).last().isVisible());
  await page.getByLabel("新しいカードは1日に（1冊ごと）").selectOption("5");
  ok("5枚にすると「めくる 5枚」", await page.locator(".deck-tile", { hasText: "都道府県" }).getByRole("link", { name: /めくる 5枚/ }).isVisible());

  // 書き出し
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "書き出す" }).click()]);
  const file = `${OUT}/export.json`;
  await dl.saveAs(file);
  const exported = JSON.parse(fs.readFileSync(file, "utf8"));
  ok("書き出したファイル（3冊・73枚）", dl.suggestedFilename().startsWith("anki-cards-") && exported.decks.length === 3 && exported.cards.length === 73, `${exported.decks.length}/${exported.cards.length}`);

  // 同じファイルを足す → 何も増えない
  await page.setInputFiles("#import-file", file);
  ok("読み込む前に中身を見せる", (await page.textContent(".import-confirm")).includes("3冊") && (await page.textContent(".import-confirm")).includes("73枚"));
  await page.getByRole("button", { name: "今のデータに足す" }).click();
  ok("同じものは足さない", (await page.textContent("#toast")).includes("カード 0枚") && (await page.$$(".deck-tile")).length === 3);

  // 単語帳を消す → 元に戻す
  await page.getByRole("link", { name: /テスト帳/ }).click();
  await page.getByRole("button", { name: "この単語帳を消す" }).click();
  await page.waitForFunction(() => location.hash === "#/" && document.querySelectorAll(".deck-tile").length === 2, null, { timeout: 3000 }).catch(() => {});
  ok("単語帳を消せる", (await page.$$(".deck-tile")).length === 2);
  await page.getByRole("button", { name: "元に戻す" }).click();
  ok("消した単語帳を元に戻せる", (await page.$$(".deck-tile")).length === 3);

  // 名前を変える・文字でコピー
  await page.getByRole("link", { name: /テスト帳/ }).click();
  await page.getByLabel("名前").fill("  英語  まとめ ");
  await page.getByRole("button", { name: "変える" }).click();
  ok("名前を変えられる（空白はつめる）", (await page.textContent("h1")) === "英語 まとめ");
  await page.getByRole("button", { name: "文字でコピー" }).click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  ok("文字でコピー（表<タブ>裏）", clip.split("\n").length === 6 && clip.includes("apple\tりんご（くだもの）"), clip.slice(0, 80));

  // 全部消して、ファイルから入れかえる
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL + "#/");
  await page.reload();
  await page.setInputFiles("#import-file", file);
  await page.getByRole("button", { name: "今のデータと入れかえる" }).click();
  ok("別の端末で読み込める（3冊）", (await page.$$(".deck-tile")).length === 3);
  ok("読み込みでつづけた日も戻る", (await page.textContent(".today")).includes("1日つづけています"));

  // 読めないファイル
  fs.writeFileSync(`${OUT}/bad.json`, '{"hello": 1}');
  await page.setInputFiles("#import-file", `${OUT}/bad.json`);
  await page.waitForFunction(() => document.querySelector("#toast").textContent.includes("読み込めません"), null, { timeout: 3000 }).catch(() => {});
  ok("読めないファイルは知らせる", (await page.textContent("#toast")).includes("読み込めません"));

  // 引用符・タグ入りの id を読み込んでも、HTML に入らない
  const evilId = 'x" onmouseover="window.__y=1" data-z="<b>';
  fs.writeFileSync(`${OUT}/evil.json`, JSON.stringify({ version: 2, newPerDay: 20, days: [], decks: [{ id: evilId, name: "<i>あやしい</i>", art: "own", createdAt: "2026-10-01T00:00:00.000Z" }], cards: [{ id: "<img src=x onerror=window.__y=2>", deckId: evilId, front: "q", back: "a", repetitions: 0, interval: 0, easeFactor: 2.5, reviews: 0, lapses: 0, createdAt: "2026-10-01T00:00:00.000Z" }] }));
  await page.setInputFiles("#import-file", `${OUT}/evil.json`);
  await page.getByRole("button", { name: "今のデータに足す" }).click();
  const hrefs = await page.$$eval(".deck-link", (els) => els.map((e) => e.getAttribute("href")));
  ok("読み込んだ id は振り直して安全な文字だけ", hrefs.every((h) => /^#\/deck\/[\w-]+$/.test(h)) && (await page.$$('[onmouseover], [data-z]')).length === 0, hrefs.join(" "));
  await page.getByRole("link", { name: /あやしい/ }).click();
  await page.waitForSelector(".card-row");
  ok("振り直した単語帳を開ける・注入されない", (await page.textContent("h1")) === "<i>あやしい</i>" && (await page.evaluate(() => window.__y)) === undefined);

  // 単語帳の上限（200冊）
  await page.evaluate(() => {
    const decks = Array.from({ length: 200 }, (_, i) => ({ id: `d${i}`, name: `帳${i}`, art: "own", createdAt: "2026-10-01T00:00:00.000Z" }));
    localStorage.setItem("flashcards.v2", JSON.stringify({ version: 2, decks, cards: [], days: [], newPerDay: 20 }));
  });
  await page.goto(URL + "#/");
  await page.reload();
  await page.getByLabel("新しい単語帳を作る").fill("201冊目");
  await page.getByRole("button", { name: "作る" }).click();
  ok("200冊で作れないと知らせる", (await page.textContent("#new-deck-msg")).includes("200冊まで") && (await page.$$(".deck-tile")).length === 200);
  await page.getByRole("button", { name: "中学英単語 20を入れる" }).click();
  ok("見本も上限で止めて知らせる", (await page.textContent("#toast")).includes("200冊まで") && (await page.$$(".deck-tile")).length === 200);
  await page.reload();
  ok("再読み込みで1冊も消えない", (await page.$$(".deck-tile")).length === 200 && !(await page.isVisible("#notice")));

  // 壊れた保存内容
  await page.evaluate(() => localStorage.setItem("flashcards.v2", "{こわれた"));
  await page.reload();
  ok("壊れた保存内容は空で始めて知らせる", (await page.textContent("#notice")).includes("読めなかった") && (await page.$$(".deck-tile")).length === 0);
  ok("壊れた内容は控えに残す", (await page.evaluate(() => localStorage.getItem("flashcards.v2.broken"))) === "{こわれた");

  // 前の版のデータ
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("flashcards.decks", JSON.stringify([{ id: "dk_1", name: "サンプル：四字熟語", createdAt: "2026-06-01T00:00:00.000Z" }]));
    localStorage.setItem("flashcards.cards", JSON.stringify([{ id: "cd_1", deckId: "dk_1", front: "一期一会", back: "一生に一度の出会い", repetitions: 0, interval: 0, easeFactor: 2.5, reviews: 0, createdAt: "2026-06-01T00:00:00.000Z" }]));
  });
  await page.reload();
  ok("前の版のデータを引き継ぐ", (await page.textContent("#notice")).includes("引き継ぎ") && (await page.textContent(".deck-grid")).includes("四字熟語"));
  ok("動作中のページエラーなし", errors.length === 0, errors.join(" / "));
  await ctx.close();
}

// ---- 動きを減らす設定 ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await fresh(page);
  await page.getByRole("button", { name: "中学英単語 20を入れる" }).click();
  await page.getByRole("link", { name: /めくる 20枚/ }).click();
  await page.waitForSelector(".flash-inner");
  ok("動きを減らす: 札の回転にアニメーションなし", (await page.$eval(".flash-inner", (e) => getComputedStyle(e).transitionDuration)) === "0s");
  await flipBtn(page).click();
  await grade(page, "わかった").click();
  ok("動きを減らす: すぐ次のカード", (await page.textContent(".left")).includes("19"));
  await ctx.close();
}

// ---- 保存できない環境 ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("QuotaExceeded");
    };
  });
  const page = await ctx.newPage();
  const errors = watch(page);
  await page.goto(URL);
  await page.getByRole("button", { name: "中学英単語 20を入れる" }).click();
  ok("保存できなくても使える・知らせる", (await page.$$(".deck-tile")).length === 1 && (await page.textContent("#save-note")).includes("保存できない"));
  ok("保存できない環境でページエラーなし", errors.length === 0, errors.join(" / "));
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
    await page.getByRole("button", { name: "中学英単語 20を入れる" }).click();
    await page.getByRole("link", { name: /めくる 20枚/ }).click();
    await flipBtn(page).click();
    offlineOk = await page.isVisible(".grades");
  } catch (e) {
    report.offlineError = String(e);
  }
  ok("オフラインで開いてめくれる", offlineOk, report.offlineError || "");
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
auditBad.forEach((a) => console.log("  NG", a.label, JSON.stringify({ x: a.overflowX, small: a.small.slice(0, 5), tiny: a.tinyInput, text: a.tinyText, ov: a.overlaps.slice(0, 5) })));
console.log(`axe ${report.axe.length - axeBad.length}/${report.axe.length} 違反なし`);
axeBad.forEach((a) => console.log("  NG", a.label, JSON.stringify(a.violations)));
console.log(`外部への通信 ${new Set(report.external).size} 件`, [...new Set(report.external)].slice(0, 5).join(" "));
if (bad.length || auditBad.length || axeBad.length || report.external.length) process.exit(1);
