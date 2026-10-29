// Sovereign Library: shelf + in-app PDF reader with fillable fields saved on the device.
import * as pdfjsLib from "./vendor/pdfjs/pdf.min.mjs";
import { CATALOG } from "./catalog.js";

globalThis.pdfjsLib = globalThis.pdfjsLib || pdfjsLib;
const { PDFViewer, EventBus, PDFLinkService } = await import("./vendor/pdfjs/web/pdf_viewer.mjs");
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;
const STD_FONTS = new URL("./vendor/pdfjs/standard_fonts/", import.meta.url).href;

const $ = (s) => document.querySelector(s);
// Inside the Sovereign app the Library runs in a frame; the app provides the bridge.
const bridge = () => window.SovereignBridge || (window.parent !== window ? window.parent.SovereignBridge : null) || null;
// The Library only runs inside Sovereign, which handles App lock and encrypts entries.
if (window.top === window && !window.SovereignBridge) { location.replace("../index.html"); await new Promise(() => {}); }

/* ---------------- Storage (IndexedDB, with localStorage fallback) ---------------- */
const DB_NAME = "sovereign-library", STORE = "entries";
let dbPromise = null;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbPromise;
}
async function loadEntry(id) {
  if (bridge()?.loadEntry) return bridge().loadEntry(id);
  const db = await openDb();
  if (db) {
    return new Promise((res) => {
      try {
        const r = db.transaction(STORE).objectStore(STORE).get(id);
        r.onsuccess = () => res(r.result || null);
        r.onerror = () => res(null);
      } catch { res(null); }
    });
  }
  try { return JSON.parse(localStorage.getItem(`${DB_NAME}:${id}`)) || null; } catch { return null; }
}
async function saveEntry(id, entry) {
  if (bridge()?.saveEntry) return bridge().saveEntry(id, entry);
  const db = await openDb();
  if (db) {
    return new Promise((res, rej) => {
      try {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(entry, id);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      } catch (e) { rej(e); }
    });
  }
  localStorage.setItem(`${DB_NAME}:${id}`, JSON.stringify(entry));
}
async function deleteEntry(id) {
  if (bridge()?.deleteEntry) return bridge().deleteEntry(id);
  const db = await openDb();
  if (db) {
    return new Promise((res) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = tx.onerror = () => res();
    });
  }
  try { localStorage.removeItem(`${DB_NAME}:${id}`); } catch {}
}

/* ---------------- Track (men / women) ---------------- */
function currentTrack() {
  const p = new URLSearchParams(location.search).get("track");
  if (p === "men" || p === "women") { try { localStorage.setItem("sovereign.track", p); } catch {} return p; }
  if (window.SOVEREIGN_TRACK === "men" || window.SOVEREIGN_TRACK === "women") return window.SOVEREIGN_TRACK;
  try { const s = localStorage.getItem("sovereign.track"); if (s === "men" || s === "women") return s; } catch {}
  return null;
}

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

/* ---------------- Shelf ---------------- */
async function renderShelf() {
  const track = currentTrack();
  const mine = $("#grid-mine"), other = $("#grid-other");
  mine.innerHTML = ""; other.innerHTML = "";
  for (const item of CATALOG) {
    const entry = await loadEntry(item.id);
    const card = document.createElement("button");
    card.className = "book";
    card.type = "button";
    card.setAttribute("aria-label", `Open ${item.title}, ${item.edition}`);
    const page = entry?.page || 0;
    const pct = page ? Math.max(4, Math.round((page / item.pages) * 100)) : 0;
    const filled = entry?.values ? Object.keys(entry.values).length : 0;
    card.innerHTML = `
      <img src="${item.cover}" alt="" loading="lazy">
      <div>
        <div class="ed">${item.edition}</div>
        <div class="tt">${item.title}</div>
        <p class="bl">${item.blurb}</p>
        <div class="meta">${
          entry
            ? `<span class="dot"></span><span>Page ${page || 1} of ${item.pages}</span><span class="bar"><i style="width:${pct}%"></i></span>`
            : `<span>${item.pages} pages · Not started</span>`
        }</div>
      </div>`;
    if (filled) card.querySelector(".meta").title = `${filled} entries saved`;
    card.addEventListener("click", () => openItem(item.id));
    const forMe = !track || item.track === "all" || item.track === track;
    (forMe ? mine : other).appendChild(card);
  }
  $("#also").hidden = other.children.length === 0;
  const back = new URLSearchParams(location.search).get("back");
  $("#shelf-back").hidden = !back && !bridge()?.close;
}
$("#shelf-back").addEventListener("click", () => {
  const back = new URLSearchParams(location.search).get("back");
  if (bridge()?.close) bridge().close();
  else if (back) location.href = back;
  else history.back();
});

/* ---------------- Reader ---------------- */
let session = null; // { item, pdf, viewer, idToKey, keyToId, page, saveTimer, dirty }

function setStatus(text) { $("#r-status").textContent = text; }

async function openItem(id, { push = true } = {}) {
  const item = CATALOG.find((c) => c.id === id);
  if (!item) return;
  if (push) history.pushState({ read: id }, "", `#read/${id}`);
  await closeSession();
  $("#shelf").hidden = true;
  $("#reader").hidden = false;
  $("#r-title").textContent = `${item.title} · ${item.edition.replace(" Edition", "")}`;
  setStatus("Opening…");

  const container = $("#viewerContainer");
  const viewerEl = $("#viewer");
  viewerEl.innerHTML = "";
  container.scrollTop = 0;

  const eventBus = new EventBus();
  const linkService = new PDFLinkService({ eventBus });
  const viewer = new PDFViewer({
    container, viewer: viewerEl, eventBus, linkService,
    annotationMode: pdfjsLib.AnnotationMode.ENABLE_FORMS,
    textLayerMode: 0,
    removePageBorders: true,
  });
  linkService.setViewer(viewer);

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ url: item.file, standardFontDataUrl: STD_FONTS, isEvalSupported: false }).promise;
  } catch (e) {
    console.error(e);
    setStatus("");
    toast("Couldn't open this book. Check that the PDF is in the library folder.");
    return;
  }

  // Map field names <-> annotation ids so saved entries survive a re-exported PDF.
  const idToKey = {}, keyToId = {};
  const fields = (await pdf.getFieldObjects()) || {};
  for (const [name, arr] of Object.entries(fields)) {
    let i = 0;
    for (const f of arr) {
      if (!f.id || f.type === "") continue;
      const key = `${name}#${i++}`;
      idToKey[f.id] = key; keyToId[key] = f.id;
    }
  }

  const s = { item, pdf, viewer, eventBus, idToKey, keyToId, page: 1, saveTimer: null, dirty: false };
  session = s;

  // Restore saved entries before pages render.
  const entry = await loadEntry(item.id);
  const storage = pdf.annotationStorage;
  if (entry?.values) {
    for (const [key, val] of Object.entries(entry.values)) {
      const aid = keyToId[key];
      if (aid) storage.setValue(aid, val);
    }
  }
  // Autosave on every field change.
  const origSet = storage.setValue.bind(storage);
  storage.setValue = (k, v) => { origSet(k, v); if (session === s) scheduleSave(s); };

  eventBus.on("pagesinit", () => {
    viewer.currentScaleValue = "page-width";
    const start = Math.min(Math.max(entry?.page || 1, 1), pdf.numPages);
    if (start > 1) viewer.currentPageNumber = start;
    setStatus(entry ? "Saved on this device" : "");
  });
  eventBus.on("pagechanging", (e) => {
    s.page = e.pageNumber;
    $("#r-page").textContent = e.pageNumber;
    scheduleSave(s, 1500, false);
  });
  window.addEventListener("resize", onResize);

  $("#r-pages").textContent = pdf.numPages;
  $("#r-page").textContent = 1;
  viewer.setDocument(pdf);
  linkService.setDocument(pdf, null);
}

function onResize() {
  if (session?.viewer && session.viewer.currentScaleValue === "page-width") session.viewer.currentScaleValue = "page-width";
}

function collectValues(s) {
  const all = s.pdf.annotationStorage.getAll() || {};
  const values = {};
  for (const [aid, val] of Object.entries(all)) {
    const key = s.idToKey[aid];
    if (!key || val == null) continue;
    try { values[key] = JSON.parse(JSON.stringify(val)); } catch {}
  }
  return values;
}

function scheduleSave(s, delay = 600, fieldsChanged = true) {
  if (fieldsChanged) { s.dirty = true; setStatus("Saving…"); }
  clearTimeout(s.saveTimer);
  s.saveTimer = setTimeout(() => flushSave(s), delay);
}

async function flushSave(s) {
  clearTimeout(s.saveTimer);
  const prev = (await loadEntry(s.item.id)) || {};
  const entry = {
    values: s.dirty ? collectValues(s) : prev.values || {},
    page: s.page,
    updatedAt: new Date().toISOString(),
  };
  if (!s.dirty && !prev.values && s.page <= 1) return; // nothing worth keeping yet
  try {
    await saveEntry(s.item.id, entry);
    if (session === s) setStatus("Saved on this device");
  } catch (e) {
    console.error(e);
    if (session === s) setStatus("Not saved");
    toast("Couldn't save on this device. Try “Save a copy” to keep your entries.");
  }
}

async function closeSession() {
  const s = session;
  if (!s) return;
  session = null;
  window.removeEventListener("resize", onResize);
  await flushSave(s);
  try { s.viewer.setDocument(null); } catch {}
  try { await s.pdf.destroy(); } catch {}
}

async function closeReader({ pop = true } = {}) {
  closeMenu();
  await closeSession();
  $("#reader").hidden = true;
  $("#shelf").hidden = false;
  await renderShelf();
  if (pop && location.hash.startsWith("#read/")) history.back();
}

/* ---------------- Reader controls ---------------- */
$("#btn-close").addEventListener("click", () => closeReader());
$("#btn-prev").addEventListener("click", () => session?.viewer.previousPage());
$("#btn-next").addEventListener("click", () => session?.viewer.nextPage());
$("#btn-zoomin").addEventListener("click", () => { if (session) session.viewer.currentScale = Math.min(session.viewer.currentScale * 1.2, 4); });
$("#btn-zoomout").addEventListener("click", () => { if (session) session.viewer.currentScale = Math.max(session.viewer.currentScale / 1.2, 0.4); });

function closeMenu() { $("#menu").hidden = true; $("#btn-menu").setAttribute("aria-expanded", "false"); }
$("#btn-menu").addEventListener("click", (e) => {
  e.stopPropagation();
  const m = $("#menu");
  m.hidden = !m.hidden;
  $("#btn-menu").setAttribute("aria-expanded", String(!m.hidden));
});
document.addEventListener("click", (e) => { if (!$("#menu").contains(e.target)) closeMenu(); });

$("#m-contents").addEventListener("click", () => {
  closeMenu();
  if (session) session.viewer.currentPageNumber = session.item.contentsPage || 1;
});

$("#m-save").addEventListener("click", async () => {
  closeMenu();
  if (!session) return;
  const s = session;
  setStatus("Preparing copy…");
  try {
    const bytes = await s.pdf.saveDocument();
    const name = `Sovereign ${s.item.title} (${s.item.edition}).pdf`;
    // Native hook: if the Android shell exposes a bridge, hand it the file.
    if (bridge()?.savePdf) {
      let bin = ""; const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      await bridge().savePdf(name, btoa(bin));
      toast("Copy saved");
    } else {
      const file = new File([bytes], name, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file); a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        toast("Copy downloaded");
      }
    }
  } catch (e) {
    if (e?.name !== "AbortError") { console.error(e); toast("Couldn't make a copy right now."); }
  }
  if (session === s) setStatus("Saved on this device");
});

$("#m-reset").addEventListener("click", async () => {
  closeMenu();
  if (!session) return;
  if (!confirm("Clear everything you've written in this book on this device? This can't be undone.")) return;
  const id = session.item.id;
  session.dirty = false;
  clearTimeout(session.saveTimer);
  const s = session; session = null;
  try { s.viewer.setDocument(null); await s.pdf.destroy(); } catch {}
  await deleteEntry(id);
  await openItem(id, { push: false });
  toast("Started fresh");
});

// Keep entries safe if the app is backgrounded or closed.
document.addEventListener("visibilitychange", () => { if (document.hidden && session) flushSave(session); });
window.addEventListener("pagehide", () => { if (session) flushSave(session); });

// Android back button / browser back closes the reader.
window.addEventListener("popstate", () => {
  const m = location.hash.match(/^#read\/(.+)$/);
  if (m) openItem(m[1], { push: false });
  else if (!$("#reader").hidden) closeReader({ pop: false });
});

/* ---------------- Boot ---------------- */
await renderShelf();
const startHash = location.hash.match(/^#read\/(.+)$/);
if (startHash) openItem(startHash[1], { push: false });

// Small API for the host app.
window.SovereignLibrary = {
  open: (id) => openItem(id),
  close: () => closeReader(),
  catalog: CATALOG,
};
