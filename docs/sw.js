// يخزّن ملفات التطبيق ليعمل بلا إنترنت بعد أول زيارة
const CACHE = "qatr-v1.1";
const FILES = [
  "./", "index.html", "manifest.webmanifest", "css/style.css", "js/boot.js", "js/app.js",
  "data/part-a.js", "data/part-b.js", "data/part-c.js", "data/part-d.js", "data/part-e.js", "data/part-f.js",
  "fonts/Plex-Regular.ttf", "fonts/Plex-Medium.ttf", "fonts/Plex-SemiBold.ttf", "fonts/Plex-Bold.ttf",
  "fonts/ArefRuqaa-Regular.ttf", "fonts/ArefRuqaa-Bold.ttf", "fonts/Amiri-Regular.ttf", "fonts/Amiri-Bold.ttf",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
