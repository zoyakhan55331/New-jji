/**
 * Fiza Cyber Companion - Progressive Web App Service Worker
 */

const CACHE_NAME = "fiza-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Fiza PWA: Pre-caching core application assets.");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Fiza PWA: Evicting stale cache: ", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Let live voice websocket streams and node HTTP api operations bypass cached storage
  if (event.request.url.includes("/api/") || event.request.url.startsWith("ws:") || event.request.url.startsWith("wss:")) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch((err) => {
        // Fallback for document navigation when completely offline
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
