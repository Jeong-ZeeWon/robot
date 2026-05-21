const CACHE_NAME = "sioni-v6-cache-20260521-3";
const ASSETS = ["./", "./index.html", "./style.css?v=6.0.2", "./motions.css?v=6.0.2", "./v4.css?v=6.0.2", "./v5.css?v=6.0.2", "./responses.js?v=6.0.2", "./responses-extra.js?v=6.0.2", "./v4.js?v=6.0.2", "./v5.js?v=6.0.2", "./v5-motions.js?v=6.0.2", "./app.js?v=6.0.2", "./idle.js?v=6.0.2", "./v5-version.js?v=6.0.2", "./persist.js?v=6.0.2", "./manifest.json?v=6.0.2", "./icon.svg"];

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
