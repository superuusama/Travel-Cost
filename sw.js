/* Travel Cost Service Worker - 离线缓存 */
const CACHE = "travel-cost-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// 安装：预缓存核心文件
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

// 激活：清理旧缓存
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 请求：先走缓存，命中即用（离线可用）；未命中再联网，并顺手缓存
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // 汇率 API 等外部请求：网络优先，失败就算了（不阻塞）
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
