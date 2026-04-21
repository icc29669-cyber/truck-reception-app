// v3: /api/* および認証関連レスポンスはキャッシュ対象外（他ユーザーの情報漏洩防止）
const CACHE = "ns-reserve-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // 旧バージョンのキャッシュを全て削除
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // /api/* は絶対にキャッシュしない（認証レスポンス汚染対策）
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // その他は network-first（オフライン時のみキャッシュフォールバック）
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
