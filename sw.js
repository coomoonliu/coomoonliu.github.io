/* Metaverse mobile terminal — cache static shell only. Never invent Settled offline. */
const CACHE = "stone-metaverse-terminal-v3";
const PRECACHE = [
  "./metaverse-app.html",
  "./assets/site.css",
  "./assets/metaverse-app.css",
  "./assets/app-icon.svg",
  "./manifest.webmanifest",
  "./enter.html",
  "./metaverse-delivery-accept.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Never cache control-plane API / api-bridge — always network for live Accept.
  if (url.pathname.includes("/api/") || url.pathname.endsWith("api-bridge.json")) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
