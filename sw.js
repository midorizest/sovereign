/* ==========================================================================
   SOVEREIGN — Service worker
   Pre-caches the whole app on first load so it runs fully offline.
   Strategy: cache-first for app files, falling back to network, and
   falling back to index.html for navigations when offline.
   To ship an update: change CACHE_VERSION — old caches are cleaned up.
   ========================================================================== */
const CACHE_VERSION = "sovereign-v1.8.0";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/content.js",
  "./js/app.js",
  "./js/security.js",
  "./js/sound-engine.js",
  "./js/noise-worklet.js",
  "./js/protocols.js",
  "./content/hand.js",
  "./content/lesson-science-of-retention.js",
  "./content/lesson-grounding-bioelectricity.js",
  "./content/lesson-role-of-breathwork.js",
  "./content/lesson-transmutation.js",
  "./content/lesson-esoteric-principles.js",
  "./content/lesson-pitfalls.js",
  "./content/lesson-akashic-window.js",
  "./content/lesson-planetary-hand.js",
  "./content/lesson-what-is-sexual-energy.js",
  "./content/guide.js",
  "./content/deepen.js",
  "./content/lesson-energetic-signature.js",
  "./fonts/cormorant-garamond.woff",
  "./fonts/cormorant-garamond-italic.woff",
  "./fonts/plus-jakarta-sans.woff",
  "./fonts/plus-jakarta-sans-italic.woff",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

// Install: download and store every app file.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: remove caches from older versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: serve from cache first; only same-origin GET requests are handled.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => (req.mode === "navigate" ? caches.match("./index.html") : Response.error()));
    })
  );
});

// Tapping a reminder notification brings the app to the front.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      return self.clients.openWindow("./");
    })
  );
});
