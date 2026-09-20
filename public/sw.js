// Service Worker بسيط — يخزّن قشرة التطبيق فقط (App Shell) مؤقتاً لتسريع الإقلاع.
// لا يخزّن أي بيانات ديناميكية (لا API ولا صفحات محتوى)، فتبقى دائماً محدّثة من الشبكة.
const CACHE_NAME = "ibn-aljawzy-shell-v1";
const SHELL_ASSETS = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // لا نتدخل إلا في أصول القشرة الثابتة؛ كل شيء آخر (صفحات، API) يذهب للشبكة مباشرة.
  if (event.request.method !== "GET" || !SHELL_ASSETS.includes(url.pathname)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
