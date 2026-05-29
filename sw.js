const CACHE_NAME = "sioni-v13-cache-20260529-2";
const ASSETS = ["./", "./index.html", "./style.css?v=13.0.0", "./motions.css?v=13.0.0", "./v9-face.css?v=13.0.0", "./sioni-10.css?v=13.0.0", "./sioni-11.css?v=13.0.0", "./sioni-v13.css?v=13.0.0", "./v4.css?v=13.0.0", "./v5.css?v=13.0.0", "./responses.js?v=13.0.0", "./responses-extra.js?v=13.0.0", "./sioni-10-lines.js?v=13.0.0", "./sioni-11-lines.js?v=13.0.0", "./memory-engine.js?v=13.0.0", "./v7.js?v=13.0.0", "./v4.js?v=13.0.0", "./v5.js?v=13.0.0", "./v5-motions.js?v=13.0.0", "./app.js?v=13.0.0", "./v7-life.js?v=13.0.0", "./idle.js?v=13.0.0", "./v5-version.js?v=13.0.0", "./v9-face-engine.js?v=13.0.0", "./camera-vision.js?v=13.0.0", "./persist.js?v=13.0.0", "./manifest.json?v=13.0.0", "./icon.svg"];

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
