/* ==========================================================================
   SOVEREIGN — Service worker
   Pre-caches the whole app on first load so it runs fully offline.
   Strategy: cache-first for app files, falling back to network, and
   falling back to index.html for navigations when offline.
   To ship an update: change CACHE_VERSION — old caches are cleaned up.
   ========================================================================== */
const CACHE_VERSION = "sovereign-v1.14.0";

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
  "./content/daycycle.js",
  "./content/scripture.js",
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
  "./icons/icon-maskable-512.png",
  // Printables (Sovereign Library)
  "./library/catalog.js",
  "./library/covers/tracker-men.jpg",
  "./library/covers/tracker-women.jpg",
  "./library/fonts/OFL-CormorantGaramond.txt",
  "./library/fonts/OFL-PlusJakartaSans.txt",
  "./library/fonts/cormorant-garamond-latin-300-normal.woff2",
  "./library/fonts/cormorant-garamond-latin-400-italic.woff2",
  "./library/fonts/cormorant-garamond-latin-400-normal.woff2",
  "./library/fonts/cormorant-garamond-latin-500-normal.woff2",
  "./library/fonts/plus-jakarta-sans-latin-400-normal.woff2",
  "./library/fonts/plus-jakarta-sans-latin-500-normal.woff2",
  "./library/fonts/plus-jakarta-sans-latin-600-normal.woff2",
  "./library/index.html",
  "./library/library.css",
  "./library/library.js",
  "./library/pdf/tracker-men.pdf",
  "./library/pdf/tracker-women.pdf",
  "./library/vendor/pdfjs/LICENSE",
  "./library/vendor/pdfjs/pdf.min.mjs",
  "./library/vendor/pdfjs/pdf.worker.min.mjs",
  "./library/vendor/pdfjs/standard_fonts/FoxitDingbats.pfb",
  "./library/vendor/pdfjs/standard_fonts/FoxitFixed.pfb",
  "./library/vendor/pdfjs/standard_fonts/FoxitFixedBold.pfb",
  "./library/vendor/pdfjs/standard_fonts/FoxitFixedBoldItalic.pfb",
  "./library/vendor/pdfjs/standard_fonts/FoxitFixedItalic.pfb",
  "./library/vendor/pdfjs/standard_fonts/FoxitSerif.pfb",
  "./library/vendor/pdfjs/standard_fonts/FoxitSerifBold.pfb",
  "./library/vendor/pdfjs/standard_fonts/FoxitSerifBoldItalic.pfb",
  "./library/vendor/pdfjs/standard_fonts/FoxitSerifItalic.pfb",
  "./library/vendor/pdfjs/standard_fonts/FoxitSymbol.pfb",
  "./library/vendor/pdfjs/standard_fonts/LICENSE_FOXIT",
  "./library/vendor/pdfjs/standard_fonts/LICENSE_LIBERATION",
  "./library/vendor/pdfjs/standard_fonts/LiberationSans-Bold.ttf",
  "./library/vendor/pdfjs/standard_fonts/LiberationSans-BoldItalic.ttf",
  "./library/vendor/pdfjs/standard_fonts/LiberationSans-Italic.ttf",
  "./library/vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf",
  "./library/vendor/pdfjs/web/images/altText_add.svg",
  "./library/vendor/pdfjs/web/images/altText_disclaimer.svg",
  "./library/vendor/pdfjs/web/images/altText_done.svg",
  "./library/vendor/pdfjs/web/images/altText_spinner.svg",
  "./library/vendor/pdfjs/web/images/altText_warning.svg",
  "./library/vendor/pdfjs/web/images/annotation-check.svg",
  "./library/vendor/pdfjs/web/images/annotation-comment.svg",
  "./library/vendor/pdfjs/web/images/annotation-help.svg",
  "./library/vendor/pdfjs/web/images/annotation-insert.svg",
  "./library/vendor/pdfjs/web/images/annotation-key.svg",
  "./library/vendor/pdfjs/web/images/annotation-newparagraph.svg",
  "./library/vendor/pdfjs/web/images/annotation-noicon.svg",
  "./library/vendor/pdfjs/web/images/annotation-note.svg",
  "./library/vendor/pdfjs/web/images/annotation-paperclip.svg",
  "./library/vendor/pdfjs/web/images/annotation-paragraph.svg",
  "./library/vendor/pdfjs/web/images/annotation-pushpin.svg",
  "./library/vendor/pdfjs/web/images/cursor-editorFreeHighlight.svg",
  "./library/vendor/pdfjs/web/images/cursor-editorFreeText.svg",
  "./library/vendor/pdfjs/web/images/cursor-editorInk.svg",
  "./library/vendor/pdfjs/web/images/cursor-editorTextHighlight.svg",
  "./library/vendor/pdfjs/web/images/editor-toolbar-delete.svg",
  "./library/vendor/pdfjs/web/images/loading-icon.gif",
  "./library/vendor/pdfjs/web/images/messageBar_closingButton.svg",
  "./library/vendor/pdfjs/web/images/messageBar_warning.svg",
  "./library/vendor/pdfjs/web/images/secondaryToolbarButton-documentProperties.svg",
  "./library/vendor/pdfjs/web/images/toolbarButton-editorHighlight.svg",
  "./library/vendor/pdfjs/web/images/toolbarButton-menuArrow.svg",
  "./library/vendor/pdfjs/web/pdf_viewer.css",
  "./library/vendor/pdfjs/web/pdf_viewer.mjs"
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
