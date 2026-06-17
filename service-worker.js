const CACHE_NAME = "geo-poker-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./places_data.js",
  "./country_outlines.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
