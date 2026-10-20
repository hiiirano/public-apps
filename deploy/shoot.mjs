// 公開用ステージ（deploy.sh が作る一時ディレクトリ）をローカル配信し、
// apps.json の各アプリをスマホ幅で撮影して <stage>/shots/<slug>.jpg に書き出す。
// mujinline.com のアプリ一覧はこの画像と apps.json を読みに来る。
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const stage = process.argv[2];
if (!stage) throw new Error('usage: node shoot.mjs <stage-dir>');
const apps = JSON.parse(await readFile(join(stage, 'apps.json'), 'utf8'));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (p.endsWith('/')) p += 'index.html';
  try {
    const body = await readFile(join(stage, p));
    res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

await mkdir(join(stage, 'shots'), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 300, height: 480 }, deviceScaleFactor: 2 });
for (const a of apps) {
  await page.goto(`${base}/${a.slug}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(stage, 'shots', `${a.slug}.jpg`), type: 'jpeg', quality: 80 });
  console.log(`    shot ${a.slug}`);
}
await browser.close();
server.close();
