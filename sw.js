// 시오니는 더 이상 오프라인 캐시(서비스워커)를 사용하지 않습니다.
// 업데이트가 즉시 반영되도록, 이 서비스워커는 스스로 모든 캐시를 비우고
// 등록을 해제(self-destruct)합니다. 기기에 남아 있던 옛 버전도 이걸로 정리돼요.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
