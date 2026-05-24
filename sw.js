const CACHE_NAME = "sioni-age11-cache-20260524-2";
const ASSETS = ["./", "./index.html", "./style.css?v=11.0.1", "./motions.css?v=11.0.1", "./v9-face.css?v=11.0.1", "./sioni-10.css?v=11.0.1", "./sioni-11.css?v=11.0.1", "./v4.css?v=11.0.1", "./v5.css?v=11.0.1", "./responses.js?v=11.0.1", "./responses-extra.js?v=11.0.1", "./sioni-10-lines.js?v=11.0.1", "./sioni-11-lines.js?v=11.0.1", "./memory-engine.js?v=11.0.1", "./v7.js?v=11.0.1", "./v4.js?v=11.0.1", "./v5.js?v=11.0.1", "./v5-motions.js?v=11.0.1", "./app.js?v=11.0.1", "./v7-life.js?v=11.0.1", "./idle.js?v=11.0.1", "./v5-version.js?v=11.0.1", "./v9-face-engine.js?v=11.0.1", "./persist.js?v=11.0.1", "./manifest.json?v=11.0.1", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
