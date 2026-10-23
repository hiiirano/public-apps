// 電波がなくても開けるよう、同じサイト内のファイルを控えておく。
// 画面は「控えをすぐ出し、裏で新しいものに入れ替える」。更新は次に開いたときに反映される。
const CACHE = "kakeibo-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./manifest.webmanifest"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "precache" || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter((u) => typeof u === "string" && u.startsWith(self.location.origin));
  event.waitUntil(caches.open(CACHE).then((c) => Promise.all(urls.map((u) => c.add(u).catch(() => {})))));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  const isPage = req.mode === "navigate";
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: isPage });
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => undefined);
      if (cached) {
        event.waitUntil(fresh);
        return cached;
      }
      const res = await fresh;
      if (res) return res;
      if (isPage) {
        const home = await cache.match("./");
        if (home) return home;
      }
      return new Response("オフラインです", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }),
  );
});
