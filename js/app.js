/* ==========================================================================
   SOVEREIGN — Application logic (vanilla JS, no dependencies)

   Sections
     1.  Utilities
     2.  Storage (localStorage) & data model
     3.  Derived values: points, streaks
     4.  Theme
     5.  Onboarding
     6.  Navigation & overlays
     7.  Home: streak card + daily checklist
     8.  Protocols & guided timer
     9.  Library & lazy-loaded lessons
     9b. Guide (Build / Apply / Deepen / Books) & today's focus
     9c. Breath & mantra pacer, mala counter
     9d. Sound — binaural beats & isochronic tones
     10. Journal & calendar
     11. Settings: profile, export, import, reset
     12. Dialogs & toasts
     13. Milestones
     14. Reminders
     15. Service worker & boot
   ========================================================================== */
(() => {
  "use strict";
  const C = window.SOV; // content from content.js
  const APP_VERSION = "1.7.0";
  const STORAGE_KEY = "sovereign.v1";

  /* Platform: the same code runs as a website/PWA and as a Chrome extension.
     EXT     – running inside the extension (side panel or full-view tab)
     IS_FULL – the full-view tab (?full=1) rather than the side panel */
  const EXT = !!(window.chrome && chrome.runtime && chrome.runtime.id && chrome.storage);
  const IS_FULL = new URLSearchParams(location.search).has("full");
  const WRITER_ID = Math.random().toString(36).slice(2); // identifies this window's saves
  let appStarted = false;

  /* ========================================================================
     1. UTILITIES
     ======================================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /** Local-time date key, e.g. "2026-10-17". Never use toISOString (UTC). */
  const dateKey = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
  const todayKey = () => dateKey();

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  const fmtLongDate = (d) => d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ========================================================================
     2. STORAGE & DATA MODEL
     ------------------------------------------------------------------------
     state = {
       version, profile: { name, track, level, reminder, createdAt },
       days: { "YYYY-MM-DD": { practices: { grounding:{done,min}, breath:{…},
               meditation:{…}, retention:{status,count}, cycle:{phase} },
               protocols: ["grounding-reset"] } },
       journal: [ { id, date, ts, prompt, text } ],
       lessons: { "<lessonId>": "YYYY-MM-DD" },
       milestonesSeen: [ "<streakStart>:<days>" ],
       settings: { theme }, meta: { lastExport, backupDismissed, lastNotified },
       draft: ""
     }
     ======================================================================== */
  const blankState = () => ({
    version: 1,
    profile: null,
    days: {},
    journal: [],
    lessons: {},
    milestonesSeen: [],
    settings: { theme: "dark" },
    meta: { lastExport: null, backupDismissed: null, lastNotified: null },
    draft: ""
  });

  let state = blankState(); // filled in by loadState() during boot

  /** Load saved data. Extension: chrome.storage.local (with one-time migration
      from localStorage). Website: localStorage. */
  async function loadState() {
    if (EXT) {
      try {
        const r = await chrome.storage.local.get(STORAGE_KEY);
        if (r[STORAGE_KEY]) return normalise(r[STORAGE_KEY]);
      } catch (e) { console.warn("chrome.storage unavailable", e); }
    }
    return load();
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return blankState();
      return normalise(JSON.parse(raw));
    } catch (e) {
      console.warn("Could not read saved data", e);
      return blankState();
    }
  }
  /** Fill in any missing keys so older/imported data never crashes the app. */
  function normalise(s) {
    const b = blankState();
    return {
      ...b, ...s,
      settings: { ...b.settings, ...(s.settings || {}) },
      meta: { ...b.meta, ...(s.meta || {}) },
      days: s.days || {}, journal: Array.isArray(s.journal) ? s.journal : [],
      lessons: s.lessons || {}, milestonesSeen: s.milestonesSeen || []
    };
  }
  function save() {
    if (EXT) {
      // The writer id lets other open windows (panel ↔ full view) know the change came from elsewhere.
      chrome.storage.local.set({ [STORAGE_KEY]: state, "sovereign.writer": WRITER_ID })
        .catch(() => toast("Could not save — storage may be full. Please export a backup."));
      return;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { toast("Could not save — storage may be full. Please export a backup."); }
  }

  /** Extension only: keep the side panel and full-view tab in step. */
  function watchOtherWindows() {
    if (!EXT) return;
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[STORAGE_KEY]) return;
      if (changes["sovereign.writer"]?.newValue === WRITER_ID) return; // our own save
      const next = changes[STORAGE_KEY].newValue;
      if (!next || !next.profile) { location.reload(); return; }   // reset elsewhere
      if (!appStarted) { location.reload(); return; }               // onboarding finished elsewhere
      state = normalise(next);
      applyTheme();
      if ($("#settings").hidden) render();
    });
  }
  /** Get (and optionally create) a day record. */
  function day(key = todayKey(), create = false) {
    if (!state.days[key] && create) state.days[key] = { practices: {}, protocols: [] };
    return state.days[key] || { practices: {}, protocols: [] };
  }
  const journalOn = (key) => state.journal.some((j) => j.date === key);

  /* ========================================================================
     3. DERIVED VALUES — points & streaks
     ======================================================================== */
  function isPracticeDone(id, rec, key) {
    if (id === "journal") return journalOn(key);
    const p = rec.practices[id];
    if (!p) return false;
    if (id === "retention") return !!p.status;
    if (id === "cycle") return !!p.phase;
    return !!p.done;
  }
  const visiblePractices = () => C.PRACTICES.filter((p) => p.tracks.includes(state.profile.track));

  function pointsForDay(key) {
    const rec = day(key);
    let pts = 0;
    // Practices count regardless of track so switching track never erases history.
    for (const p of C.PRACTICES) if (isPracticeDone(p.id, rec, key)) pts += C.POINTS.practice;
    pts += new Set(rec.protocols || []).size * C.POINTS.protocol;
    if (rec.focus && rec.focus.done) pts += C.POINTS.practice; // applied today's Guide focus
    return pts;
  }
  function totalPoints() {
    const keys = new Set([...Object.keys(state.days), ...state.journal.map((j) => j.date)]);
    let total = 0;
    keys.forEach((k) => (total += pointsForDay(k)));
    total += Object.keys(state.lessons).length * C.POINTS.lesson;
    return total;
  }
  /** A day "counts" toward the streak if anything at all was practised. */
  const practiced = (key) => pointsForDay(key) > 0;

  function currentStreak() {
    let d = new Date();
    // If today isn't done yet, the streak is still alive from yesterday.
    if (!practiced(dateKey(d))) d = addDays(d, -1);
    let n = 0;
    while (practiced(dateKey(d))) { n++; d = addDays(d, -1); }
    return n;
  }
  function longestStreak() {
    const keys = [...new Set([...Object.keys(state.days), ...state.journal.map((j) => j.date)])]
      .filter(practiced).sort();
    let best = 0, run = 0, prev = null;
    for (const k of keys) {
      run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = k;
    }
    return Math.max(best, currentStreak());
  }

  /* ========================================================================
     4. THEME
     ======================================================================== */
  function applyTheme() {
    const t = state.settings.theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    $('meta[name="theme-color"]').setAttribute("content", t === "light" ? "#f6f2ea" : "#0b0b0c");
  }

  /* ========================================================================
     5. ONBOARDING
     ======================================================================== */
  const ob = { track: null, level: null };

  function startOnboarding() {
    $("#onboarding").hidden = false;
    $("#app").hidden = true;
    $("#disclaimer-text").innerHTML = C.DISCLAIMER;
    showStep(1);

    $("#ob-agree").addEventListener("change", (e) => ($("#ob-next-1").disabled = !e.target.checked));
    $("#ob-next-1").addEventListener("click", () => showStep(2));

    radioGroup($$("[data-track]"), (el) => { ob.track = el.dataset.track; $("#ob-next-2").disabled = false; });
    $("#ob-next-2").addEventListener("click", () => showStep(3));

    radioGroup($$("[data-level]"), (el) => { ob.level = el.dataset.level; $("#ob-next-3").disabled = false; });
    $("#ob-next-3").addEventListener("click", () => showStep(4));

    $("#ob-name").addEventListener("input", (e) => ($("#ob-finish").disabled = !e.target.value.trim()));
    $("#ob-name").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.value.trim()) finishOnboarding(); });
    $("#ob-finish").addEventListener("click", finishOnboarding);
  }
  function showStep(n) {
    $$(".ob-step").forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    const focusable = $(`.ob-step[data-step="${n}"]`).querySelector("input, button");
    focusable && focusable.focus();
  }
  /** Accessible radio-group behaviour for the choice cards (arrow keys + click). */
  function radioGroup(els, onPick) {
    els.forEach((el, i) => {
      el.tabIndex = i === 0 ? 0 : -1;
      el.addEventListener("click", () => pick(el));
      el.addEventListener("keydown", (e) => {
        const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!dir) return;
        e.preventDefault();
        const next = els[(i + dir + els.length) % els.length];
        next.focus(); pick(next);
      });
    });
    function pick(el) {
      els.forEach((x) => { x.setAttribute("aria-checked", x === el); x.tabIndex = x === el ? 0 : -1; });
      onPick(el);
    }
  }
  async function finishOnboarding() {
    state.profile = {
      name: $("#ob-name").value.trim().slice(0, 40),
      track: ob.track, level: ob.level,
      reminder: $("#ob-reminder").value || "",
      createdAt: new Date().toISOString()
    };
    save();
    if (state.profile.reminder) requestNotifyPermission();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    $("#onboarding").hidden = true;
    startApp();
  }

  /* ========================================================================
     6. NAVIGATION & OVERLAYS
     ======================================================================== */
  let currentView = "home";

  function go(view) {
    currentView = view;
    $$(".view").forEach((v) => (v.hidden = v.id !== `view-${view}`));
    $$(".nav-btn").forEach((b) => b.dataset.view === view ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
    render(view);
    window.scrollTo({ top: 0 });
    $("#main").focus({ preventScroll: true });
  }
  function render(view = currentView) {
    renderHeader();
    if (view === "home") renderHome();
    if (view === "protocols") renderProtocols();
    if (view === "library") renderLibrary();
    if (view === "journal") renderJournal();
    if (view === "guide") renderGuide();
  }

  /* Overlay helper: makes the rest of the app inert, traps focus, Esc closes. */
  let lastFocus = null;
  function openOverlay(el, onEscape) {
    lastFocus = document.activeElement;
    el.hidden = false;
    $("#app").inert = true;
    // Ignore Esc while a modal dialog sits on top — the dialog handles it.
    el._esc = (e) => { if (e.key === "Escape" && !$("#dialog").open) { e.preventDefault(); onEscape(); } };
    document.addEventListener("keydown", el._esc);
    const f = el.querySelector("button, input, select, textarea");
    f && f.focus();
  }
  function closeOverlay(el) {
    el.hidden = true;
    $("#app").inert = false;
    document.removeEventListener("keydown", el._esc);
    lastFocus && lastFocus.focus && lastFocus.focus();
  }

  /* ========================================================================
     7. HOME — streak card + daily checklist
     ======================================================================== */
  function renderHeader() {
    const h = new Date().getHours();
    const part = h < 5 ? "Still hours" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    $("#today-label").textContent = fmtLongDate(new Date());
    $("#greeting").textContent = `${part}, ${state.profile.name}`;
  }

  function renderHome() {
    const key = todayKey();
    const rec = day(key);
    const list = visiblePractices();
    const doneCount = list.filter((p) => isPracticeDone(p.id, rec, key)).length;

    // Streak card
    $("#streak-current").textContent = currentStreak();
    $("#streak-longest").textContent = longestStreak();
    $("#points-total").textContent = totalPoints().toLocaleString();
    $("#points-today").textContent = pointsForDay(key);
    const pct = Math.round((doneCount / list.length) * 100);
    $("#today-progress-fill").style.width = pct + "%";
    $("#today-progress").setAttribute("aria-valuemax", list.length);
    $("#today-progress").setAttribute("aria-valuenow", doneCount);
    $("#today-progress-caption").textContent = doneCount === list.length
      ? "All practices complete. Rest in what you've built."
      : `${doneCount} of ${list.length} practices complete`;

    // 7-day strip
    const strip = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(new Date(), -i), k = dateKey(d), on = practiced(k);
      const label = d.toLocaleDateString(undefined, { weekday: "narrow" });
      strip.push(`<div class="week-day ${i === 0 ? "today" : ""}">
        <span class="week-dot ${on ? "on" : ""}" role="img" aria-label="${d.toLocaleDateString(undefined, { weekday: "long" })}: ${on ? "practised" : "not practised"}"></span>
        <span aria-hidden="true">${label}</span></div>`);
    }
    $("#week-strip").innerHTML = strip.join("");

    // Checklist
    $("#practice-list").innerHTML = list.map((p) => practiceHTML(p, rec, key)).join("");

    renderFocus();

    // Principle of the day
    const pr = C.PRINCIPLES[dayIndex() % C.PRINCIPLES.length];
    $("#daily-principle").innerHTML = `<p class="q">“${esc(pr.q)}”</p><p class="src">${esc(pr.src)}</p>`;

    renderBanners();
  }

  function practiceHTML(p, rec, key) {
    const done = isPracticeDone(p.id, rec, key);
    const data = rec.practices[p.id] || {};
    const desc = typeof p.desc === "object" ? p.desc[state.profile.level] : p.desc;
    let body = "";

    if (p.kind === "minutes") {
      body = `<label class="minutes"><span class="visually-hidden">${p.name} minutes</span>
        <input type="number" inputmode="numeric" min="0" max="600" step="1" data-min="${p.id}" value="${data.min || ""}" placeholder="0">
        <span class="muted small">minutes</span></label>`;
    }
    if (p.kind === "retention") {
      const suggested = data.count ?? suggestRetentionCount(key);
      body = `<div class="seg" role="group" aria-label="Retention today">
          <button class="chip" data-ret="held" aria-pressed="${data.status === "held"}">Held</button>
          <button class="chip" data-ret="released" aria-pressed="${data.status === "released"}">Released</button>
        </div>
        <label class="minutes"><span class="muted small">Day</span>
          <input type="number" min="0" max="9999" data-retcount value="${data.status === "released" ? 0 : suggested}" aria-label="Retention day count">
        </label>
        ${data.status === "released" ? '<p class="muted small" style="flex-basis:100%;margin:4px 0 0">Noted without judgement. Every day is a new beginning.</p>' : ""}`;
    }
    if (p.kind === "cycle") {
      const ph = C.CYCLE_PHASES.find((c) => c.id === data.phase);
      body = `<div class="seg" role="group" aria-label="Cycle phase">
        ${C.CYCLE_PHASES.map((c) => `<button class="chip" data-phase="${c.id}" aria-pressed="${data.phase === c.id}">${c.label}</button>`).join("")}
        </div>${ph ? `<p class="muted small" style="flex-basis:100%;margin:6px 0 0">${esc(ph.note)}</p>` : ""}`;
    }
    if (p.kind === "journal") {
      body = `<button class="link-btn" data-goto="journal">${done ? "View today's entry" : "Write today's entry"}</button>`;
    }

    // Minutes-type practices have a tappable check; others complete through their controls.
    const checkable = p.kind === "minutes";
    const check = checkable
      ? `<button class="practice-check" data-toggle="${p.id}" aria-pressed="${done}" aria-label="Mark ${p.name} ${done ? "not done" : "done"}">${CHECK_SVG}</button>`
      : `<span class="practice-check" role="img" aria-label="${done ? "Complete" : "Not yet complete"}">${CHECK_SVG}</span>`;

    return `<li class="practice ${done ? "done" : ""}">
      <div class="practice-head">${check}
        <div class="practice-text"><div class="practice-name">${p.name}</div><div class="practice-desc">${esc(desc)}</div></div>
        <span class="practice-pts">+${C.POINTS.practice}</span>
      </div>
      <div class="practice-body">${body}</div>
    </li>`;
  }

  /** Suggest today's retention day count from the most recent previous check-in. */
  function suggestRetentionCount(key) {
    const prior = Object.keys(state.days).filter((k) => k < key && state.days[k].practices.retention?.status).sort().pop();
    if (!prior) return 1;
    const r = state.days[prior].practices.retention;
    return (r.status === "released" ? 0 : (r.count || 0)) + daysBetween(prior, key);
  }

  /* Event delegation for the checklist (one listener, survives re-renders). */
  function bindHome() {
    const listEl = $("#practice-list");

    listEl.addEventListener("click", (e) => {
      const key = todayKey();
      const t = e.target.closest("button");
      if (!t) return;
      const rec = day(key, true);

      if (t.dataset.toggle) {
        const id = t.dataset.toggle;
        const p = rec.practices[id] || (rec.practices[id] = { done: false, min: 0 });
        p.done = !p.done;
        commit(p.done ? `${cap(id === "breath" ? "breathwork" : id)} complete · +${C.POINTS.practice}` : null, `[data-toggle="${id}"]`);
      }
      if (t.dataset.ret) {
        const status = t.dataset.ret;
        const prev = rec.practices.retention?.status;
        if (prev === status) { delete rec.practices.retention; commit(null, `[data-ret="${status}"]`); return; }
        const countEl = $("[data-retcount]");
        let count = status === "released" ? 0 : Number(countEl.value) || suggestRetentionCount(key);
        if (status === "held" && count === 0) count = suggestRetentionCount(key) || 1;
        rec.practices.retention = { status, count };
        commit(status === "held" ? `Day ${count}. Held with intention · +${C.POINTS.practice}` : `Checked in honestly · +${C.POINTS.practice}`, `[data-ret="${status}"]`);
      }
      if (t.dataset.phase) {
        const same = rec.practices.cycle?.phase === t.dataset.phase;
        if (same) delete rec.practices.cycle; else rec.practices.cycle = { phase: t.dataset.phase };
        commit(same ? null : `Cycle noted · +${C.POINTS.practice}`, `[data-phase="${t.dataset.phase}"]`);
      }
      if (t.dataset.goto) go(t.dataset.goto);
    });

    listEl.addEventListener("change", (e) => {
      const rec = day(todayKey(), true);
      if (e.target.dataset.min) {
        const id = e.target.dataset.min;
        const min = Math.max(0, Math.min(600, Math.round(Number(e.target.value) || 0)));
        const p = rec.practices[id] || (rec.practices[id] = { done: false, min: 0 });
        const wasDone = p.done;
        p.min = min;
        if (min > 0) p.done = true;
        commit(!wasDone && p.done ? `${min} minutes logged · +${C.POINTS.practice}` : "Saved", `[data-min="${id}"]`);
      }
      if (e.target.matches("[data-retcount]")) {
        const r = rec.practices.retention;
        const n = Math.max(0, Math.round(Number(e.target.value) || 0));
        if (r && r.status === "held") { r.count = n; commit("Day count updated", "[data-retcount]"); }
      }
    });
  }

  /** Save, re-render, restore keyboard focus to the control used, check milestones. */
  function commit(message, focusSel) {
    save();
    renderHome();
    if (focusSel) { const el = $(focusSel); el && el.focus(); }
    if (message) toast(message);
    checkMilestones();
  }

  function renderBanners() {
    // Backup reminder: after 3+ days of data, every 14 days unless dismissed recently.
    const dataDays = Object.keys(state.days).length + state.journal.length;
    const since = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 86400000 : Infinity);
    const showBackup = dataDays >= 3 && since(state.meta.lastExport) > 14 && since(state.meta.backupDismissed) > 7;
    $("#backup-banner").innerHTML = showBackup
      ? `<div class="card banner"><p>Your progress lives only in this browser. Keep a backup.</p>
         <div class="btn-row"><button class="btn" data-banner="dismiss">Later</button><button class="btn btn-primary" data-banner="export">Export</button></div></div>`
      : "";

    // Reminder banner: past reminder time and nothing practised today.
    const r = state.profile.reminder;
    const now = new Date();
    const pastTime = r && `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` >= r;
    $("#reminder-banner").innerHTML = pastTime && !practiced(todayKey())
      ? `<div class="card banner"><p>Your practice time has arrived. Five minutes is enough to begin.</p>
         <button class="btn btn-primary" data-banner="reset">Grounding Reset</button></div>`
      : "";
  }
  function bindBanners() {
    $("#view-home").addEventListener("click", (e) => {
      const b = e.target.closest("[data-banner]");
      if (!b) return;
      if (b.dataset.banner === "export") exportData();
      if (b.dataset.banner === "dismiss") { state.meta.backupDismissed = new Date().toISOString(); save(); renderBanners(); }
      if (b.dataset.banner === "reset") startTimer("grounding-reset");
    });
  }

  /** Stable index that changes once per day (for rotating prompts/principles). */
  function dayIndex() {
    const d = new Date();
    return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
  }

  /* ========================================================================
     8. PROTOCOLS & GUIDED TIMER
     ======================================================================== */
  const LEVELS = ["beginner", "intermediate", "advanced"];

  const PTABS = [["guided", "Guided"], ["breath", "Breath"], ["sound", "Sound"]];
  let PTAB = "guided";

  async function renderProtocols() {
    const tabs = `<div class="tabs tabs-3" role="tablist" aria-label="Practice types">${PTABS.map(([id, label]) =>
      `<button class="tab" role="tab" id="ptab-${id}" data-ptab="${id}" aria-selected="${PTAB === id}" aria-controls="ptab-panel" tabindex="${PTAB === id ? 0 : -1}">${label}</button>`).join("")}</div>`;
    let body = "";
    if (PTAB === "guided") body = guidedHTML();
    if (PTAB === "breath") body = await breathHTML();
    if (PTAB === "sound") body = soundHTML();
    $("#protocol-list").innerHTML = tabs + `<div id="ptab-panel" role="tabpanel" aria-labelledby="ptab-${PTAB}">${body}</div>`;
    if (PTAB === "sound") refreshNowPlaying();
  }

  /** Beginner is open to all; Intermediate at that level or with Deepen open;
      Advanced only at Advanced level (the member can change level in Settings). */
  function protocolAllowed(p) {
    if (p.level === "beginner" || levelAllows(p.level)) return true;
    return p.level === "intermediate" && deepAllowed();
  }

  function guidedHTML() {
    const track = state.profile.track;
    const available = C.PROTOCOLS.filter((p) => p.tracks.includes(track));
    const groups = LEVELS.map((lvl) => {
      const items = available.filter((p) => p.level === lvl);
      if (!items.length) return "";
      return `<div class="cat-head"><h2>${cap(lvl)}</h2></div>` + items.map((p) => protocolCardHTML(p)).join("");
    }).join("");
    const upcoming = C.UPCOMING_PROTOCOLS.filter((p) => p.tracks.includes(track));
    return groups + (upcoming.length ? `<h2 class="upcoming-title">Unlocking in the next build</h2>
       <div class="upcoming">${upcoming.map((p) =>
         `<div class="card locked"><span>${esc(p.title)}</span><span class="meta" style="margin:0"><span class="tag">${cap(p.level)}</span></span></div>`).join("")}</div>` : "");
  }

  function protocolCardHTML(p) {
    const doneToday = (day().protocols || []).includes(p.id);
    if (!protocolAllowed(p)) {
      return `<article class="card proto-card locked">
        <div class="meta"><span class="tag">🔒 ${cap(p.level)}</span><span>${p.minutes} minutes</span></div>
        <h3 class="proto-title">${esc(p.title)}</h3>
        <p class="muted" style="margin:0">${esc(p.summary)}</p>
        <p class="hint" style="margin:10px 0 0">Opens at ${cap(p.level)} level${p.level === "intermediate" ? " or with Deepen open" : ""}. You can change your level in Settings.</p>
      </article>`;
    }
    const open = PROTO_OPEN.has(p.id);
    return `<article class="card proto-card">
      <div class="meta"><span class="tag">${cap(p.level)}</span><span>${p.minutes} minutes</span>
        ${p.tracks.length === 1 ? `<span class="tag">${p.tracks[0] === "men" ? "Men" : "Women"}</span>` : ""}
        ${doneToday ? '<span class="done-badge">✓ Done today</span>' : ""}</div>
      <h3 class="proto-title">${esc(p.title)}</h3>
      <p class="muted">${esc(p.summary)}</p>
      <button class="link-btn proto-more" data-pmore="${p.id}" aria-expanded="${open}" aria-controls="pd-${p.id}">${open ? "Hide details" : "Setup, steps & safety"}</button>
      <div class="proto-detail" id="pd-${p.id}" ${open ? "" : "hidden"}>
        <p class="g-label">Setup</p><p class="muted">${esc(p.setup)}</p>
        <p class="g-label">Steps</p>
        <ol class="g-steps">${p.steps.map((st) => `<li><strong>${esc(st.title)}</strong> · ${fmtTime(st.seconds)}<br>${esc(stepText(st))}</li>`).join("")}</ol>
        <p class="g-label">Benefits</p>
        <ul class="g-steps">${p.benefits.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
        ${p.caution ? `<p class="g-caution"><strong>Safety.</strong> ${esc(p.caution)}</p>` : ""}
        ${p.source ? `<p class="g-source">${esc(p.source)}</p>` : ""}
      </div>
      <button class="btn btn-primary btn-block btn-cta" data-start="${p.id}">Start protocol</button>
    </article>`;
  }
  const PROTO_OPEN = new Set();

  async function breathHTML() {
    try { await ensureGuide(); } catch { return '<p class="empty">Breath practices could not load. Connect once to download them.</p>'; }
    const tools = [...BASIC_PATTERNS, ...(deepAllowed() ? DEEP_PATTERNS : [])];
    return `<p class="view-sub" style="margin-bottom:16px">A guided breathing orb with mantra and nostril cues. Sessions log to Breathwork.</p>` +
      tools.map((t) => {
        const pat = C.PACER[t];
        const cycle = pat.phases.reduce((a, ph) => a + ph.s, 0);
        return `<button class="card item-card breath-card" data-pacer="${t}">
          <div class="meta"><span class="tag">${DEEP_PATTERNS.includes(t) ? "Deepen" : "All levels"}</span><span>${cycle}s per round</span></div>
          <h3>${esc(pat.title)}</h3><p class="muted" style="margin:0">${esc(pat.note)}</p></button>`;
      }).join("") +
      `<button class="card item-card breath-card" data-pacer="mala">
        <div class="meta"><span class="tag">Japa</span><span>108 repetitions</span></div>
        <h3>Mala Counter</h3><p class="muted" style="margin:0">Count 108 repetitions of your mantra. Logs to Meditation.</p></button>` +
      (deepAllowed() ? "" : '<p class="hint">Bija Ascent, the Six Healing Sounds and Retention open with Deepen in the Guide.</p>');
  }

  function soundHTML() {
    const S = C.SOUND;
    const credits = (S.credits || []).filter((c) => c.name && c.url);
    return `<p class="view-sub" style="margin-bottom:14px">Binaural beats and isochronic tones, generated live on your device. Put on headphones, choose a state, and go inward.</p>
      <div class="card hp-card">
        <div class="hp-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 15v-3a8 8 0 0 1 16 0v3" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="14" width="4" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></div>
        <div class="hp-text"><strong>Headphones required</strong><span class="muted small" id="hp-status">Binaural beats only work with one tone in each ear.</span></div>
        <button class="btn" data-hpcheck>Check L / R</button>
      </div>
      <div id="now-playing"></div>
      <div class="sound-grid">${S.presets.map((p) => `
        <button class="card sound-card" data-sound="${p.id}">
          <span class="sound-glyph ${/[α-ω]/.test(p.glyph) ? "" : "sym"}" aria-hidden="true">${p.glyph}</span>
          <span class="sound-name">${esc(p.name)}</span>
          <span class="sound-freq">${esc(p.band)} · ${p.beat} Hz${p.noise ? ` + ${cap(p.noise)}` : ""}</span>
          ${p.mode === "isochronic" ? '<span class="sound-flag">Isochronic · speakers OK</span>' : ""}
        </button>`).join("")}</div>
      <details class="card sound-safety"><summary>Safe listening</summary><p class="muted small" style="margin:10px 0 0">${esc(S.safety)}</p></details>
      ${credits.length ? `<h2 class="upcoming-title">Recommended creator</h2>` + credits.map((c) => `
        <article class="card book credit">
          <div class="book-spine" aria-hidden="true"></div>
          <div><h3 class="book-title">${esc(c.name)}</h3>
          ${c.note ? `<p class="book-note">${esc(c.note)}</p>` : ""}
          <a class="btn credit-link" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Visit their sessions ↗</a></div>
        </article>`).join("") : ""}`;
  }

  const stepText = (s) => {
    if (s.prompt) return s.prompt;
    if (s.byPhase) {
      const ph = day().practices.cycle?.phase || "unsure";
      return s.byPhase[ph] || s.byPhase.unsure;
    }
    return s.variants[state.profile.track] || s.variants.men;
  };

  /* ---- Timer engine: wall-clock based, so it stays accurate if the tab is throttled ---- */
  const T = { proto: null, idx: 0, stepEnd: 0, remaining: 0, running: false, raf: null, wake: null, startedAt: 0 };

  function startTimer(id) {
    const p = C.PROTOCOLS.find((x) => x.id === id);
    if (!p || !protocolAllowed(p)) return;
    Object.assign(T, { proto: p, idx: 0, running: true, startedAt: Date.now() });
    $("#timer-title").textContent = p.title;
    $("#timer-cue-slot").innerHTML = cueSliderHTML("timer-cue-vol");
    openOverlay($("#timer"), confirmEndTimer);
    enterStep(0);
    requestWakeLock();
    tick();
  }
  function enterStep(i) {
    T.idx = i;
    const s = T.proto.steps[i];
    T.remaining = s.seconds;
    T.stepEnd = Date.now() + s.seconds * 1000;
    $("#timer-step-count").textContent = `Step ${i + 1} of ${T.proto.steps.length}`;
    $("#timer-step-title").textContent = s.title;
    const prompt = $("#timer-prompt");
    prompt.textContent = stepText(s);
    prompt.style.animation = "none"; void prompt.offsetWidth; prompt.style.animation = "";
    $("#timer-back").disabled = i === 0;
    chime(i === 0 ? 528 : 432);
    updateTimerUI();
  }
  function tick() {
    cancelAnimationFrame(T.raf);
    if (!T.running) return;
    T.remaining = Math.max(0, (T.stepEnd - Date.now()) / 1000);
    if (T.remaining <= 0) {
      if (T.idx < T.proto.steps.length - 1) enterStep(T.idx + 1);
      else return completeTimer();
    }
    updateTimerUI();
    T.raf = requestAnimationFrame(() => setTimeout(tick, 250));
  }
  function updateTimerUI() {
    const steps = T.proto.steps;
    const total = steps.reduce((a, s) => a + s.seconds, 0);
    const before = steps.slice(0, T.idx).reduce((a, s) => a + s.seconds, 0);
    const left = total - before - (steps[T.idx].seconds - T.remaining);
    const shown = Math.ceil(left);
    $("#timer-time").textContent = fmtTime(shown);
    $("#timer-time").setAttribute("aria-label", `${Math.floor(shown / 60)} minutes ${shown % 60} seconds remaining`);
    $("#ring-fg").style.strokeDashoffset = String(565.49 * (1 - left / total));
    $("#timer").classList.toggle("breathing", T.running);
  }
  function toggleTimer() {
    if (T.running) {
      T.running = false;
      T.remaining = Math.max(0, (T.stepEnd - Date.now()) / 1000);
      $("#timer-toggle").textContent = "Resume";
    } else {
      T.running = true;
      T.stepEnd = Date.now() + T.remaining * 1000;
      $("#timer-toggle").textContent = "Pause";
      tick();
    }
    updateTimerUI();
  }
  function stopTimer() {
    T.running = false;
    cancelAnimationFrame(T.raf);
    releaseWakeLock();
    $("#timer-toggle").textContent = "Pause";
    closeOverlay($("#timer"));
  }
  async function confirmEndTimer() {
    const wasRunning = T.running;
    if (wasRunning) toggleTimer();
    const v = await dialog({
      title: "End this practice?",
      html: "<p class='muted'>Your progress in this session won't be logged.</p>",
      actions: [{ label: "Keep going", value: "stay" }, { label: "End", value: "end", primary: true }]
    });
    if (v === "end") stopTimer();
    else if (wasRunning) toggleTimer();
  }
  async function completeTimer() {
    const p = T.proto;
    stopTimer();
    chime(528, 2.4);
    const rec = day(todayKey(), true);
    rec.protocols = [...new Set([...(rec.protocols || []), p.id])];
    if (p.logsPractice) {
      const pr = rec.practices[p.logsPractice] || (rec.practices[p.logsPractice] = { done: false, min: 0 });
      pr.done = true;
      pr.min = Math.max(pr.min || 0, p.minutes);
    }
    save();
    render();
    const v = await dialog({
      title: "Practice complete",
      html: `<p>${esc(p.title)} is logged, along with ${p.minutes} minutes of ${p.logsPractice}.</p>
             <p class="muted">Sovereign Points: +${C.POINTS.protocol} protocol, +${C.POINTS.practice} practice.</p>`,
      actions: [{ label: "Close", value: "close" }, { label: "Journal now", value: "journal", primary: true }]
    });
    if (v === "journal") go("journal");
    checkMilestones();
  }
  function bindTimer() {
    $("#protocol-list").addEventListener("click", (e) => {
      const b = e.target.closest("[data-start]");
      if (b) startTimer(b.dataset.start);
    });
    $("#timer-toggle").addEventListener("click", toggleTimer);
    $("#timer-skip").addEventListener("click", () => {
      if (T.idx < T.proto.steps.length - 1) enterStep(T.idx + 1); else completeTimer();
      if (!T.running) toggleTimer();
    });
    $("#timer-back").addEventListener("click", () => { if (T.idx > 0) enterStep(T.idx - 1); if (!T.running) toggleTimer(); });
    $("#timer-close").addEventListener("click", confirmEndTimer);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && !$("#timer").hidden && T.running) requestWakeLock();
    });
  }

  /* Soft bell made with the Web Audio API — works offline, no audio files. */
  let audioCtx = null;
  /* Guidance chimes (timer steps, breath cues, mala bells, milestones).
     Their loudness follows Settings › Guidance sounds (0–100%, default 70%,
     about twice as loud as before v1.7). A limiter prevents distortion, and
     any sound session that is playing dips briefly so the cue is heard. */
  let chimeOut = null;
  const cueLevel = () => (state.settings.cueVolume ?? 0.7) * 3.2;
  function chime(freq = 432, dur = 1.8, vol = 1, { duck = true } = {}) {
    const level = cueLevel() * vol;
    if (level <= 0.001) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      if (!chimeOut) {
        chimeOut = audioCtx.createDynamicsCompressor();       // gentle limiter
        chimeOut.threshold.value = -10; chimeOut.knee.value = 6; chimeOut.ratio.value = 8;
        chimeOut.attack.value = 0.003; chimeOut.release.value = 0.25;
        chimeOut.connect(audioCtx.destination);
      }
      const t = audioCtx.currentTime;
      // A bell: fundamental, a soft octave, and a faint fifth above for presence
      [[1, 0.12], [2.01, 0.035], [3.0, 0.015]].forEach(([mult, base]) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "sine"; o.frequency.value = freq * mult;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, base * level), t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(chimeOut);
        o.start(t); o.stop(t + dur + 0.05);
      });
      if (duck) duckSession();
    } catch (_) { /* audio unavailable — silent is fine */ }
  }
  /** Dip a playing binaural/noise session for a moment so the chime cuts through. */
  function duckSession() {
    if (state.settings.duckSessions === false) return;
    if (EXT) { chrome.runtime.sendMessage({ target: "offscreen", type: "duck" }).catch(() => {}); return; }
    if (typeof SND !== "undefined" && SND.local && !SND.local.ended) SND.local.duck();
  }

  /* Shared "Guidance sounds" slider markup + behaviour, used in the pacer,
     the protocol timer and Settings so they always agree. */
  const cueSliderHTML = (id) => `
    <div class="cue-vol">
      <label class="sp-slider"><span>Guidance volume</span>
        <input type="range" class="cue-range" id="${id}" min="0" max="100" step="5" value="${Math.round((state.settings.cueVolume ?? 0.7) * 100)}" aria-valuetext="${Math.round((state.settings.cueVolume ?? 0.7) * 100)} percent"></label>
      <button class="link-btn cue-test" type="button" data-cuetest>Test</button>
    </div>`;
  function syncCueSliders() {
    const v = Math.round((state.settings.cueVolume ?? 0.7) * 100);
    $$(".cue-range").forEach((r) => { r.value = v; r.setAttribute("aria-valuetext", `${v} percent`); });
  }
  function bindCueSliders() {
    let saveT;
    document.addEventListener("input", (e) => {
      if (!e.target.classList?.contains("cue-range")) return;
      state.settings.cueVolume = Number(e.target.value) / 100;
      e.target.setAttribute("aria-valuetext", `${e.target.value} percent`);
      clearTimeout(saveT); saveT = setTimeout(save, 300);
    });
    document.addEventListener("change", (e) => {
      if (e.target.classList?.contains("cue-range")) { syncCueSliders(); chime(432, 1.2, 1, { duck: false }); }
    });
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-cuetest]")) chime(432, 1.4);
    });
  }
  async function requestWakeLock() {
    try { if ("wakeLock" in navigator) T.wake = await navigator.wakeLock.request("screen"); } catch (_) {}
  }
  function releaseWakeLock() { try { T.wake && T.wake.release(); } catch (_) {} T.wake = null; }

  /* ========================================================================
     9. LIBRARY & LAZY-LOADED LESSONS
     ======================================================================== */
  function levelAllows(lessonLevel) {
    return LEVELS.indexOf(lessonLevel) <= LEVELS.indexOf(state.profile.level);
  }
  /** Deeper material opens at Intermediate+, after a 30-day streak, or by the member's own choice. */
  const deepAllowed = () => state.profile.level !== "beginner" || longestStreak() >= 30 || !!state.settings.deepenUnlocked;
  const lessonAllowed = (l) => l.level === "beginner" || levelAllows(l.level) || deepAllowed();
  function renderLibrary() {
    $("#lesson-reader").hidden = true;
    $("#lesson-list").hidden = false;
    const ready = C.LESSONS.filter((l) => l.file);
    const later = C.LESSONS.filter((l) => !l.file);
    const total = C.LESSONS.length, completed = Object.keys(state.lessons).length;

    $("#lesson-list").innerHTML =
      `<div class="progress" role="progressbar" aria-label="Lessons completed" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${completed}" style="margin:0 0 6px">
         <span class="progress-fill" style="width:${(completed / total) * 100}%"></span></div>
       <p class="progress-caption" style="margin-bottom:18px">${completed} of ${total} lessons complete</p>` +
      ready.map((l) => lessonAllowed(l)
        ? `<button class="card item-card" data-lesson="${l.id}">
          <div class="meta"><span class="tag">${cap(l.level)}</span><span>${l.minutes} min read</span>
          ${state.lessons[l.id] ? '<span class="done-badge">✓ Complete</span>' : ""}</div>
          <h3>${esc(l.title)}</h3><p class="muted" style="margin:0">${esc(l.summary)}</p></button>`
        : `<div class="card item-card locked"><div class="meta"><span class="tag">🔒 ${cap(l.level)}</span></div>
          <h3>${esc(l.title)}</h3><p class="muted" style="margin:0">Unlocks at ${cap(l.level)} level or after a 30-day streak.</p></div>`).join("") +
      (later.length ? `<h2 class="upcoming-title">Coming in the next build</h2>
       <div class="upcoming">${later.map((l) => `<div class="card locked"><span>${esc(l.title)}</span>
         <span class="meta" style="margin:0"><span class="tag">${levelAllows(l.level) ? cap(l.level) : "🔒 " + cap(l.level)}</span></span></div>`).join("")}</div>` : "");
  }

  /** Inject a lesson script once, on demand (keeps first load light). */
  const loaded = {};
  function loadScript(src) {
    if (!loaded[src]) loaded[src] = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return loaded[src];
  }
  async function openLesson(id) {
    const l = C.LESSONS.find((x) => x.id === id);
    if (!l || !l.file || !lessonAllowed(l)) return;
    const reader = $("#lesson-reader");
    try { await loadScript(l.file); }
    catch { toast("Lesson could not load. Connect once to download it."); return; }
    const done = !!state.lessons[id];
    reader.innerHTML = `<button class="link-btn" data-back>← Library</button>
      <div class="meta" style="margin-top:14px"><span class="tag">${cap(l.level)}</span><span>${l.minutes} min read</span></div>
      <h2 tabindex="-1" id="lesson-h">${esc(l.title)}</h2>
      ${C.LESSON_TEXT[id]}
      <div class="lesson-foot">
        <button class="btn ${done ? "" : "btn-primary"}" data-complete="${id}" aria-pressed="${done}">${done ? "✓ Completed" : "Mark as complete"}</button>
        <button class="btn" data-back>Back to library</button>
      </div>`;
    $("#lesson-list").hidden = true;
    reader.hidden = false;
    window.scrollTo({ top: 0 });
    $("#lesson-h").focus();
  }
  function bindLibrary() {
    $("#lesson-list").addEventListener("click", (e) => {
      const b = e.target.closest("[data-lesson]");
      if (b) openLesson(b.dataset.lesson);
    });
    $("#lesson-reader").addEventListener("click", (e) => {
      if (e.target.closest("[data-back]")) renderLibrary();
      const c = e.target.closest("[data-complete]");
      if (c) {
        const id = c.dataset.complete;
        if (state.lessons[id]) delete state.lessons[id];
        else { state.lessons[id] = todayKey(); toast(`Lesson complete · +${C.POINTS.lesson}`); }
        save();
        const done = !!state.lessons[id];
        c.textContent = done ? "✓ Completed" : "Mark as complete";
        c.classList.toggle("btn-primary", !done);
        c.setAttribute("aria-pressed", done);
      }
    });
  }

  /* ========================================================================
     9b. GUIDE — "Build" and "Apply" tabs, plus today's focus on Home
     Content lives in content/guide.js and is loaded on first open.
     A member can make any item "today's focus"; it appears on Home with an
     "I applied it" check-in worth Sovereign Points. The focus stores a small
     snapshot (title + cue) so Home never needs to load the guide file.
     ======================================================================== */
  const G = { tab: "build", open: new Set(), query: "" };
  const pick = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v[state.profile.track] || v.men : v);

  const GTABS = ["build", "apply", "deepen", "books"];
  const GTAB_NAMES = { build: "Build", apply: "Apply", deepen: "Deepen", books: "Books" };

  /** Load the Build/Apply file first (it defines SOV.GUIDE), then Deepen + Books. */
  async function ensureGuide() {
    await loadScript("content/guide.js");
    await loadScript("content/deepen.js");
    await loadScript("content/hand.js");
  }

  /** All practice items for the current track, flattened with their tab. */
  function guideItems() {
    if (!C.GUIDE) return [];
    return ["build", "apply", "deepen"].filter((t) => C.GUIDE[t]).flatMap((tab) => C.GUIDE[tab].categories.flatMap((cat) =>
      cat.items.filter((i) => i.tracks.includes(state.profile.track)).map((i) => ({ ...i, tab }))));
  }
  const itemText = (i) => [pick(i.title), pick(i.why), pick(i.cue), (pick(i.steps) || []).join(" ")].join(" ").toLowerCase();
  const bookText = (b) => [b.title, b.author, b.note].join(" ").toLowerCase();

  async function renderGuide() {
    const panel = $("#guide-panel");
    if (!C.GUIDE || !C.GUIDE.deepen || !(C.PACER && C.PACER["hand-sun"])) {
      panel.innerHTML = '<p class="empty">Loading…</p>';
      try { await ensureGuide(); }
      catch { panel.innerHTML = '<p class="empty">The guide could not load. Connect once to download it.</p>'; return; }
    }
    $$("[data-gtab]").forEach((t) => {
      const on = t.dataset.gtab === G.tab;
      t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", `tab-${G.tab}`);
    $("#guide-search").placeholder = G.tab === "books" ? "Search books…" : "Search practices…";

    const q = G.query.trim().toLowerCase();
    const track = state.profile.track;

    /* --- Books --- */
    if (G.tab === "books") {
      const sec = C.GUIDE.books;
      const cats = sec.categories.map((cat) => {
        const books = cat.items.filter((b) => b.tracks.includes(track) && (!q || bookText(b).includes(q)));
        if (!books.length) return "";
        return `<div class="cat-head"><h2>${esc(cat.name)}</h2></div>` + books.map((b) => `<article class="card book">
            <div class="book-spine" aria-hidden="true"></div>
            <div><h3 class="book-title">${esc(b.title)}</h3>
            <p class="book-author">${esc(b.author)}${b.inLibrary ? ' <span class="g-focus-badge">· In your library</span>' : ""}</p>
            <p class="book-note">${esc(b.note)}</p></div></article>`).join("");
      }).join("");
      panel.innerHTML = (q ? "" : `<p class="guide-intro">${esc(sec.intro)}</p>`) + (cats || `<p class="empty">No books match “${esc(G.query)}”.</p>`);
      return;
    }

    /* --- Deepen gate --- */
    if (G.tab === "deepen" && !deepAllowed()) {
      panel.innerHTML = `<div class="card gate">
        <div class="sigil" aria-hidden="true"></div>
        <h2>For those ready to go deeper</h2>
        <p class="muted">Deepen holds advanced material: mantra and chant, breath retention, herbal allies, energetic protection, and creative channels. It opens at Intermediate level, or after a 30-day streak.</p>
        <p class="muted">You know your own readiness. If your foundation is steady, you may open it now.</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn btn-primary" data-unlock>I'm ready — open Deepen</button>
        </div></div>`;
      return;
    }

    /* --- Build / Apply / Deepen --- */
    const focusId = day().focus?.id;
    const match = (i) => !q || itemText(i).includes(q);
    const section = C.GUIDE[G.tab];
    const cats = section.categories.map((cat) => {
      const items = cat.items.filter((i) => i.tracks.includes(track) && match(i));
      if (!items.length) return "";
      return `<div class="cat-head"><h2>${esc(cat.name)}</h2><p>${esc(cat.sub)}</p></div>` +
        (cat.figure === "planetary-hand" && !q ? handFigure() : "") +
        items.map((i) => guideItemHTML(i, focusId === i.id)).join("");
    }).join("");

    const lessonBtn = G.tab === "deepen" && section.lesson && !q
      ? `<button class="card item-card lesson-link" data-glesson="${section.lesson}"><span class="eyebrow">Read first</span>
           <h3>${esc((C.LESSONS.find((l) => l.id === section.lesson) || {}).title || "")}</h3>
           <p class="muted" style="margin:0">Why cultivation changes your signature, and how your signature changes your reality.</p></button>` : "";

    let empty = "";
    if (!cats) {
      const other = ["build", "apply", "deepen"].find((t) => t !== G.tab && guideItems().some((i) => i.tab === t && match(i)) && (t !== "deepen" || deepAllowed()));
      empty = `<p class="empty">Nothing in ${GTAB_NAMES[G.tab]} matches “${esc(G.query)}”.${other ? ` Try the ${GTAB_NAMES[other]} tab.` : ""}</p>`;
    }
    panel.innerHTML = (q ? "" : `<p class="guide-intro">${esc(section.intro)}</p>`) + lessonBtn + (cats || empty);
  }

  /** Schematic right hand, palm facing you: which planet rules each finger. */
  function handFigure() {
    // Right hand, palm facing the viewer: thumb on the left, little finger on the right.
    const finger = (x, y, w, h) => `<rect class="hf-finger" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}"/>`;
    const label = (x, y, planet, seat, anchor = "middle") => `
      <text class="hf-planet" x="${x}" y="${y}" text-anchor="${anchor}">${planet}</text>
      <text class="hf-seat" x="${x}" y="${y + 16}" text-anchor="${anchor}">${seat}</text>`;
    return `<figure class="card hand-figure">
      <svg viewBox="0 0 340 394" role="img" aria-labelledby="hf-title hf-desc">
        <title id="hf-title">The planetary hand</title>
        <desc id="hf-desc">Right hand, palm facing you. Thumb: Mars. Index finger: Jupiter. Middle finger: Saturn. Ring finger: the Sun. Little finger: Mercury. The Moon rules the outer edge of the palm, and Venus the mound at the base of the thumb.</desc>
        <g transform="rotate(-42 112 300)">${finger(92, 196, 42, 124)}</g>
        ${finger(106, 92, 40, 140)}
        ${finger(150, 64, 40, 168)}
        ${finger(194, 80, 40, 152)}
        ${finger(238, 120, 36, 112)}
        <rect class="hf-palm" x="104" y="196" width="172" height="150" rx="56"/>
        <circle class="hf-mount" cx="140" cy="300" r="21"/>
        <circle class="hf-mount" cx="246" cy="296" r="21"/>
        ${label(126, 60, "Jupiter", "index")}
        ${label(170, 32, "Saturn", "middle")}
        ${label(214, 48, "Sun", "ring")}
        ${label(256, 88, "Mercury", "little")}
        ${label(46, 168, "Mars", "thumb")}
        ${label(140, 368, "Venus", "thumb mount")}
        ${label(300, 266, "Moon", "lunar mount")}
      </svg>
      <figcaption class="muted small">Right hand, palm facing you. Vedic finger rulers after Kurczak &amp; Fish.</figcaption>
    </figure>`;
  }

  function guideItemHTML(i, isFocus) {
    const open = G.open.has(i.id) || !!G.query.trim();
    const steps = pick(i.steps);
    const labels = { steps: "How", cue: "When to use it", ...(i.labels || {}) };
    const only = i.tracks.length === 1 ? `<span class="tag">${i.tracks[0] === "men" ? "Men" : "Women"}</span>` : "";
    return `<article class="card g-item">
      <button class="g-toggle" data-gopen="${i.id}" aria-expanded="${open}" aria-controls="g-${i.id}">
        <span class="g-title">${esc(pick(i.title))}</span>
        <span class="g-chev" aria-hidden="true">⌄</span>
        <span class="g-meta"><span>${esc(i.time)}</span>${only}${i.evidence ? `<span class="g-evidence">${esc(i.evidence)}</span>` : ""}${i.tool ? '<span class="tag">Guided</span>' : ""}${isFocus ? '<span class="g-focus-badge">★ Today’s focus</span>' : ""}</span>
      </button>
      <div class="g-body" id="g-${i.id}" ${open ? "" : "hidden"}>
        <p class="g-why">${esc(pick(i.why))}</p>
        <p class="g-label">${esc(labels.steps)}</p>
        <ol class="g-steps">${steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
        <p class="g-label">${esc(labels.cue)}</p>
        <p class="g-cue">${esc(pick(i.cue))}</p>
        ${i.caution ? `<p class="g-caution"><strong>Note.</strong> ${esc(pick(i.caution))}</p>` : ""}
        ${i.source ? `<p class="g-source">${esc(i.source)}</p>` : ""}
        <div class="g-actions">
          ${i.tool ? `<button class="btn btn-primary" data-gtool="${i.id}">Practise now</button>` : ""}
          <button class="btn ${isFocus || i.tool ? "" : "btn-primary"}" data-gfocus="${i.id}" aria-pressed="${isFocus}">${isFocus ? "★ Today’s focus" : "Make this today’s focus"}</button>
          ${i.link ? `<button class="btn" data-glink="${i.link.view}">${esc(i.link.label)}</button>` : ""}
          ${i.lesson ? `<button class="btn" data-glesson="${i.lesson}">Read the lesson</button>` : ""}
        </div>
      </div>
    </article>`;
  }

  function bindGuide() {
    const view = $("#view-guide");
    // Tabs: click + arrow keys (WAI-ARIA tabs pattern)
    const tabs = $$("[data-gtab]");
    tabs.forEach((t, idx) => {
      t.addEventListener("click", () => { G.tab = t.dataset.gtab; renderGuide(); });
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const next = tabs[(idx + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        G.tab = next.dataset.gtab; renderGuide(); next.focus();
      });
    });
    let searchTimer;
    $("#guide-search").addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { G.query = e.target.value; renderGuide(); }, 150);
    });
    view.addEventListener("click", (e) => {
      const openBtn = e.target.closest("[data-gopen]");
      if (openBtn) {
        const id = openBtn.dataset.gopen;
        const body = $(`#g-${id}`);
        const nowOpen = body.hidden;
        body.hidden = !nowOpen;
        openBtn.setAttribute("aria-expanded", nowOpen);
        nowOpen ? G.open.add(id) : G.open.delete(id);
        return;
      }
      const f = e.target.closest("[data-gfocus]");
      if (f) {
        const item = guideItems().find((i) => i.id === f.dataset.gfocus);
        const rec = day(todayKey(), true);
        if (rec.focus?.id === item.id) { delete rec.focus; toast("Focus cleared"); }
        else {
          rec.focus = { id: item.id, title: pick(item.title), cue: pick(item.cue), done: false };
          toast("Set as today’s focus — it’s on Home");
        }
        save();
        G.open.add(item.id);
        renderGuide();
        const again = $(`[data-gfocus="${item.id}"]`); again && again.focus();
        return;
      }
      const l = e.target.closest("[data-glink]");
      if (l) go(l.dataset.glink);
      const t = e.target.closest("[data-gtool]");
      if (t) {
        const item = guideItems().find((i) => i.id === t.dataset.gtool);
        if (item.tool.type === "mala") openMala(item.tool.mantra);
        else openPacer(item.tool.pattern);
      }
      if (e.target.closest("[data-unlock]")) {
        state.settings.deepenUnlocked = true; save();
        toast("Deepen is open. Go gently.");
        renderGuide();
      }
      const ls = e.target.closest("[data-glesson]");
      if (ls) { go("library"); openLesson(ls.dataset.glesson); }
    });
  }

  /** Home card for today's focus. */
  function renderFocus() {
    const f = day().focus;
    const el = $("#focus-card");
    if (!f) {
      el.innerHTML = `<div class="card focus-empty"><p>Choose one practice to apply in your life today.</p>
        <button class="btn" data-focus="choose">Open Guide</button></div>`;
      return;
    }
    el.innerHTML = `<div class="card focus-card ${f.done ? "done" : ""}">
      <p class="eyebrow">Today’s focus</p>
      <h2>${esc(f.title)}</h2>
      <p class="g-cue">${esc(f.cue)}</p>
      <div class="btn-row">
        <button class="btn ${f.done ? "" : "btn-primary"}" data-focus="done" aria-pressed="${!!f.done}">${f.done ? "✓ Applied today" : `I applied it · +${C.POINTS.practice}`}</button>
        <button class="btn" data-focus="open">View steps</button>
      </div>
      ${f.done ? "" : focusReminderHTML(f)}</div>`;
  }

  /* Optional, one-per-day reminder for today's focus. Never set automatically. */
  let focusEditing = false;
  const fmtClock = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
  const nowHHMM = () => { const n = new Date(); return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`; };
  function focusReminderHTML(f) {
    if (state.settings.reminders === false) return `<p class="focus-remind muted small">Reminders are off in Settings.</p>`;
    if (focusEditing) {
      const suggestion = f.remindAt || (() => { const d = new Date(Date.now() + 2 * 3600e3); return d.getDate() === new Date().getDate() ? `${String(d.getHours()).padStart(2, "0")}:00` : "21:00"; })();
      return `<div class="focus-remind editing">
        <label class="visually-hidden" for="focus-time">Reminder time</label>
        <input type="time" id="focus-time" value="${suggestion}">
        <button class="btn" data-focus="remind-save">Set</button>
        <button class="link-btn" data-focus="remind-cancel">Cancel</button></div>`;
    }
    if (f.remindAt) return `<p class="focus-remind"><span class="bell" aria-hidden="true">◦</span> A gentle reminder at <strong>${fmtClock(f.remindAt)}</strong>${f.notified ? " (sent)" : ""} ·
      <button class="link-btn" data-focus="remind-edit">Change</button> · <button class="link-btn" data-focus="remind-clear">Remove</button></p>`;
    return `<p class="focus-remind"><button class="link-btn" data-focus="remind-edit">Remind me later today</button></p>`;
  }
  function bindFocus() {
    $("#focus-card").addEventListener("click", (e) => {
      const b = e.target.closest("[data-focus]");
      if (!b) return;
      const rec = day(todayKey(), true);
      if (b.dataset.focus === "done" && rec.focus) {
        rec.focus.done = !rec.focus.done;
        commit(rec.focus.done ? `Applied in the real world · +${C.POINTS.practice}` : null, '[data-focus="done"]');
      }
      if (b.dataset.focus === "choose") go("guide");
      if (b.dataset.focus === "remind-edit") { focusEditing = true; renderFocus(); $("#focus-time")?.focus(); }
      if (b.dataset.focus === "remind-cancel") { focusEditing = false; renderFocus(); }
      if (b.dataset.focus === "remind-clear" && rec.focus) { delete rec.focus.remindAt; delete rec.focus.notified; save(); renderFocus(); toast("Reminder removed"); }
      if (b.dataset.focus === "remind-save" && rec.focus) {
        const t = $("#focus-time").value;
        if (!t) return;
        if (t <= nowHHMM()) { toast("That time has already passed today."); return; }
        rec.focus.remindAt = t; rec.focus.notified = false; focusEditing = false;
        save(); requestNotifyPermission(); renderFocus();
        toast(`A gentle reminder at ${fmtClock(t)}`);
      }
      if (b.dataset.focus === "open" && rec.focus) {
        G.open.add(rec.focus.id);
        // Open the right tab once the guide is loaded.
        ensureGuide().then(() => {
          const item = guideItems().find((i) => i.id === rec.focus.id);
          if (item) G.tab = item.tab;
          G.query = ""; $("#guide-search").value = "";
          go("guide");
          setTimeout(() => { const t = $(`[data-gopen="${rec.focus.id}"]`); t && (t.scrollIntoView({ block: "center" }), t.focus()); }, 60);
        }).catch(() => go("guide"));
      }
    });
  }

  /* ========================================================================
     9c. BREATH & MANTRA PACER + MALA COUNTER
     A breathing orb that expands on inhale, holds, and contracts on exhale,
     with the mantra or nostril cue for each phase. Finishing (or closing
     after at least one minute) logs the minutes as Breathwork. The mala
     counter counts 108 repetitions and logs the time as Meditation.
     Patterns live in content/deepen.js (SOV.PACER).
     ======================================================================== */
  const P = { pattern: null, id: null, idx: 0, phaseEnd: 0, phaseLeft: 0, running: false,
              elapsed: 0, lastTick: 0, minutes: 5, timer: null, mode: "breath",
              mala: { count: 0, mantra: "", started: 0 } };
  const BASIC_PATTERNS = ["so-hum", "nadi", "bhramari", "478", "aum"];
  const DEEP_PATTERNS = ["bija", "healing-sounds", "kumbhaka"];

  function logMinutes(practiceId, minutes) {
    const rec = day(todayKey(), true);
    const p = rec.practices[practiceId] || (rec.practices[practiceId] = { done: false, min: 0 });
    const wasDone = !!p.done;
    p.min = Math.min(600, (p.min || 0) + minutes);
    p.done = true;
    save();
    return !wasDone;
  }

  async function openPacer(id) {
    try { await ensureGuide(); } catch { toast("Practice could not load. Connect once to download it."); return; }
    const pat = C.PACER[id];
    if (!pat) return;
    Object.assign(P, { pattern: pat, id, mode: "breath", running: false, elapsed: 0 });
    $("#pacer-title").textContent = pat.title;
    $("#pacer-note").textContent = pat.note;
    $("#pacer-eyebrow").textContent = "Breath & Mantra";
    $("#pacer-setup").hidden = false;
    $("#pacer-run").hidden = true;
    $("#mala-run").hidden = true;
    $("#pacer-cue-slot").innerHTML = cueSliderHTML("pacer-cue-vol");
    renderPacerSetup();
    openOverlay($("#pacer"), closePacer);
  }
  function renderPacerSetup() {
    const cycle = P.pattern.phases.reduce((a, ph) => a + ph.s, 0);
    $("#pacer-durations").innerHTML = [3, 5, 10, 15].map((m) =>
      `<button class="chip" data-pmin="${m}" aria-pressed="${P.minutes === m}">${m} min</button>`).join("");
    const sound = state.settings.pacerSound !== false;
    $("#pacer-sound").setAttribute("aria-pressed", sound);
    $("#pacer-sound").textContent = sound ? "Sound cues: on" : "Sound cues: off";
    $("#pacer-cycle").textContent = `One round is ${cycle} seconds · ${P.pattern.phases.map((ph) => `${ph.label} ${ph.s}`).join(" · ")}`;
  }
  function startPacer() {
    $("#pacer-setup").hidden = true;
    $("#pacer-run").hidden = false;
    P.running = true; P.elapsed = 0; P.lastTick = Date.now();
    $("#pacer-toggle").textContent = "Pause";
    enterPhase(0);
    requestWakeLock();
    clearInterval(P.timer);
    P.timer = setInterval(pacerTick, 200);
    $("#pacer-toggle").focus();
  }
  function enterPhase(i) {
    P.idx = i;
    const ph = P.pattern.phases[i];
    P.phaseLeft = ph.s;
    P.phaseEnd = Date.now() + ph.s * 1000;
    $("#pacer-phase").textContent = ph.label;
    $("#pacer-sub").textContent = ph.sub;
    const orb = $("#pacer-orb");
    orb.style.transitionDuration = `${ph.s}s`;
    if (ph.grow === 1) orb.style.transform = "scale(1)";
    if (ph.grow === 0) orb.style.transform = "scale(.5)";
    orb.classList.toggle("holding", ph.grow === null);
    if (state.settings.pacerSound !== false) chime(ph.grow === 1 ? 396 : ph.grow === 0 ? 264 : 528, 1.1, 0.75);
  }
  function pacerTick() {
    if (!P.running) return;
    const now = Date.now();
    P.elapsed += now - P.lastTick; P.lastTick = now;
    P.phaseLeft = Math.max(0, (P.phaseEnd - now) / 1000);
    if (P.phaseLeft <= 0) {
      const next = (P.idx + 1) % P.pattern.phases.length;
      if (next === 0 && P.elapsed >= P.minutes * 60000) return finishPacer();
      enterPhase(next);
    }
    $("#pacer-count").textContent = Math.ceil(P.phaseLeft);
    const left = Math.max(0, P.minutes * 60 - P.elapsed / 1000);
    $("#pacer-remaining").textContent = left > 0 ? `${fmtTime(Math.ceil(left))} remaining` : "Completing this round…";
  }
  function togglePacer() {
    if (P.running) {
      P.running = false;
      P.phaseLeft = Math.max(0, (P.phaseEnd - Date.now()) / 1000);
      const orb = $("#pacer-orb");
      orb.style.transform = getComputedStyle(orb).transform; // freeze mid-breath
      $("#pacer-toggle").textContent = "Resume";
    } else {
      P.running = true; P.lastTick = Date.now();
      enterPhase(P.idx); // restart the current phase cleanly
      $("#pacer-toggle").textContent = "Pause";
    }
  }
  function finishPacer() {
    const mins = Math.round(P.elapsed / 60000);
    stopPacer();
    if (mins >= 1) {
      const target = P.pattern.logs || "breath";
      const fresh = logMinutes(target, mins);
      chime(528, 2.4);
      toast(`${mins} min of ${target === "breath" ? "breathwork" : "meditation"} logged${fresh ? ` · +${C.POINTS.practice}` : ""}`);
      render(); checkMilestones();
    }
  }
  function stopPacer() {
    P.running = false;
    clearInterval(P.timer);
    releaseWakeLock();
    const orb = $("#pacer-orb");
    orb.style.transitionDuration = "0s"; orb.style.transform = "scale(.5)";
    closeOverlay($("#pacer"));
  }
  function closePacer() {
    if (P.mode === "mala") return finishMala(false);
    if (!$("#pacer-run").hidden && P.elapsed >= 60000) return finishPacer();
    stopPacer();
  }

  /* --- Mala counter --- */
  async function openMala(mantra) {
    Object.assign(P, { mode: "mala", mala: { count: 0, mantra: mantra || "Om Namah Shivaya", started: Date.now() } });
    $("#pacer-eyebrow").textContent = "Japa";
    $("#pacer-title").textContent = "108 Repetitions";
    $("#pacer-note").textContent = "One repetition per tap. Begin aloud, then whisper, then repeat silently.";
    $("#pacer-setup").hidden = true;
    $("#pacer-run").hidden = true;
    $("#mala-run").hidden = false;
    $("#pacer-cue-slot").innerHTML = cueSliderHTML("pacer-cue-vol");
    $("#mala-mantra").value = P.mala.mantra;
    updateMala();
    openOverlay($("#pacer"), closePacer);
    requestWakeLock();
    $("#mala-tap").focus();
  }
  function updateMala() {
    const n = P.mala.count;
    $("#mala-count").textContent = n;
    $("#mala-tap").setAttribute("aria-label", `Count repetition. ${n} of 108.`);
    $("#mala-ring").style.strokeDashoffset = String(565.49 * (1 - n / 108));
  }
  function malaTap() {
    if (P.mala.count >= 108) return;
    P.mala.count++;
    if (navigator.vibrate) navigator.vibrate(12);
    if (P.mala.count % 27 === 0 && state.settings.pacerSound !== false) chime(432, 1.6, 0.85);
    updateMala();
    if (P.mala.count === 108) setTimeout(() => finishMala(true), 400);
  }
  function finishMala(complete) {
    const mins = Math.round((Date.now() - P.mala.started) / 60000);
    const count = P.mala.count;
    releaseWakeLock();
    closeOverlay($("#pacer"));
    P.mode = "breath";
    if (count >= 27 || mins >= 3) {
      const fresh = logMinutes("meditation", Math.max(1, mins));
      chime(528, 2.4);
      toast(`${complete ? "Full mala complete" : `${count} repetitions`} · ${Math.max(1, mins)} min meditation logged${fresh ? ` · +${C.POINTS.practice}` : ""}`);
      render(); checkMilestones();
    }
  }

  function bindPacer() {
    $("#pacer-durations").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pmin]");
      if (!b) return;
      P.minutes = Number(b.dataset.pmin);
      renderPacerSetup();
      $(`[data-pmin="${P.minutes}"]`).focus();
    });
    $("#pacer-sound").addEventListener("click", () => {
      state.settings.pacerSound = state.settings.pacerSound === false; save(); renderPacerSetup();
    });
    $("#pacer-begin").addEventListener("click", startPacer);
    $("#pacer-toggle").addEventListener("click", togglePacer);
    $("#pacer-finish").addEventListener("click", finishPacer);
    $("#pacer-close").addEventListener("click", closePacer);
    $("#mala-tap").addEventListener("click", malaTap);
    $("#mala-undo").addEventListener("click", () => { if (P.mala.count > 0) { P.mala.count--; updateMala(); } });
    $("#mala-finish").addEventListener("click", () => finishMala(P.mala.count >= 108));
    $("#mala-mantra").addEventListener("change", (e) => { P.mala.mantra = e.target.value.trim() || "Om Namah Shivaya"; });

    // Protocols tab shortcut list
    $("#protocol-list").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pacer]");
      if (!b) return;
      if (b.dataset.pacer === "mala") openMala();
      else openPacer(b.dataset.pacer);
    });
  }

  /* ========================================================================
     9d. SOUND — binaural beats & isochronic tones
     Website: the engine (js/sound-engine.js) runs in this page.
     Extension: it runs in a hidden offscreen document so a session keeps
     playing when the side panel closes; this page sends it commands, and the
     background worker logs finished sessions to Meditation.
     Pause is implemented as "stop and remember where we were", then resume
     restarts from that point with a gentle fade-in.
     ======================================================================== */
  const SND = { local: null, preset: null, paused: null, poll: null, last: null, userStopped: false, opts: { minutes: 20, volume: 0.6, noise: 0.5 } };
  const presetById = (id) => C.SOUND.presets.find((p) => p.id === id);

  const sndEngine = {
    async start(preset, opts) {
      if (EXT) {
        await chrome.runtime.sendMessage({ target: "bg", type: "sound-ensure" });
        return chrome.runtime.sendMessage({ target: "offscreen", type: "start", preset, opts });
      }
      if (SND.local && !SND.local.ended) await SND.local.stop({ log: true, fade: false });
      SND.local = new SovSound.Session(preset, opts, onLocalEnd).start();
    },
    async status() {
      if (EXT) {
        try { const r = await chrome.runtime.sendMessage({ target: "offscreen", type: "status" }); return r && r.playing ? r : null; }
        catch { return null; }
      }
      return SND.local && !SND.local.ended ? SND.local.status() : null;
    },
    stop(opts) {
      if (EXT) return chrome.runtime.sendMessage({ target: "offscreen", type: "stop", opts }).catch(() => null);
      return SND.local ? SND.local.stop(opts) : Promise.resolve(null);
    },
    set(kind, value) {
      if (EXT) return chrome.runtime.sendMessage({ target: "offscreen", type: "set", kind, value }).catch(() => {});
      if (!SND.local) return;
      kind === "volume" ? SND.local.setVolume(value) : SND.local.setNoise(value);
    }
  };

  /** Website only: the page logs its own finished sessions. */
  function onLocalEnd(r) {
    if (!r.log || r.minutes < 1) return;
    const fresh = logMinutes("meditation", r.minutes);
    toast(`${r.completed ? "Session complete" : "Session ended"} · ${r.minutes} min meditation logged${fresh ? ` · +${C.POINTS.practice}` : ""}`);
    render(); checkMilestones();
  }

  async function refreshNowPlaying() {
    const el = $("#now-playing");
    if (!el) return;
    const st = await sndEngine.status();
    const paused = SND.paused;
    const id = st?.presetId || paused?.preset.id;
    if (!id) { el.innerHTML = ""; return; }
    const p = presetById(id);
    el.innerHTML = `<button class="card now-playing" data-sound="${id}">
      <span class="np-dot ${st ? "on" : ""}" aria-hidden="true"></span>
      <span><span class="eyebrow" style="display:block;margin:0">${st ? "Now playing" : "Paused"}</span>
      <span class="sound-name">${esc(p.name)}</span></span>
      <span class="muted small">${st ? fmtTime(Math.max(0, Math.ceil(st.total - st.elapsed))) + " left" : "Tap to resume"}</span></button>`;
  }

  /* ---- Player overlay ---- */
  async function openSoundPlayer(id) {
    const p = presetById(id);
    SND.preset = p;
    const st = await sndEngine.status();
    const isCurrent = st && st.presetId === id;
    const isPaused = SND.paused && SND.paused.preset.id === id;
    if (!isCurrent && !isPaused) SND.opts = { ...SND.opts, minutes: p.minutes, noise: p.noise ? 0.5 : 0 };
    $("#sp-eyebrow").textContent = `${p.glyph}  ${p.band} · ${p.beat} Hz`;
    $("#sp-title").textContent = p.name;
    $("#sp-desc").textContent = p.desc;
    const L = p.carrier - p.beat / 2, R = p.carrier + p.beat / 2;
    $("#sp-freqs").textContent = p.mode === "isochronic"
      ? `${p.carrier} Hz tone pulsing ${p.beat}× per second · headphones or speakers`
      : `Left ${+L.toFixed(2)} Hz · Right ${+R.toFixed(2)} Hz → ${p.beat} Hz beat`;
    $("#sp-pairs").textContent = p.pairs ? `Pairs with: ${p.pairs}` : "";
    $("#sp-noise-row").hidden = !p.noise;
    $("#sp-noise-label").textContent = p.noise ? `${cap(p.noise)} noise` : "Noise";
    $("#sp-volume").value = Math.round((st?.volume ?? SND.opts.volume) * 100);
    $("#sp-noise").value = Math.round((st?.noise ?? SND.opts.noise) * 100);
    renderDurations();
    setPlayerMode(isCurrent ? "playing" : isPaused ? "paused" : "setup");
    openOverlay($("#sound-player"), closeSoundPlayer);
    startPoll();
  }
  function renderDurations() {
    $("#sp-durations").innerHTML = [10, 15, 20, 30, 45, 60].map((m) =>
      `<button class="chip" data-smin="${m}" aria-pressed="${SND.opts.minutes === m}">${m} min</button>`).join("");
  }
  function setPlayerMode(mode) {
    SND.mode = mode;
    $("#sound-player").dataset.mode = mode;
    $("#sp-setup").hidden = mode !== "setup";
    $("#sp-running").hidden = mode === "setup";
    $("#sp-toggle").textContent = mode === "paused" ? "Resume" : "Pause";
    if (mode === "paused" && SND.paused) updatePlayerTime(SND.paused.elapsed, SND.paused.opts.minutes * 60);
  }
  function updatePlayerTime(elapsed, total) {
    const left = Math.max(0, Math.ceil(total - elapsed));
    $("#sp-time").textContent = fmtTime(left);
    $("#sp-time").setAttribute("aria-label", `${Math.floor(left / 60)} minutes ${left % 60} seconds remaining`);
    $("#sp-ring").style.strokeDashoffset = String(565.49 * (1 - Math.min(1, elapsed / total)));
  }
  function startPoll() {
    clearInterval(SND.poll);
    SND.poll = setInterval(pollPlayer, 500);
    pollPlayer();
  }
  async function pollPlayer() {
    if (SND.mode !== "playing") return;
    const st = await sndEngine.status();
    if (st && st.presetId === SND.preset.id) {
      SND.last = st;
      updatePlayerTime(st.elapsed, st.total);
    } else if (SND.last && !SND.userStopped) {
      // Session ended on its own: normally the timer finished; in the extension,
      // ask the background to log it in case Chrome closed the audio page early.
      const done = SND.last.elapsed >= SND.last.total - SovSound.FADE_OUT - 1;
      const mins = Math.round((done ? SND.last.total : SND.last.elapsed) / 60);
      SND.last = null;
      setPlayerMode("setup");
      if (EXT) {
        await chrome.runtime.sendMessage({ target: "bg", type: "sound-flush" }).catch(() => {});
        if (mins >= 1) toast(`${done ? "Session complete" : "Session ended"} · ${mins} min meditation logged`);
      }
    }
  }
  async function soundBegin() {
    SND.userStopped = false; SND.paused = null; SND.last = null;
    const opts = { minutes: SND.opts.minutes, volume: $("#sp-volume").value / 100, noise: $("#sp-noise").value / 100, offset: 0 };
    SND.opts = { ...SND.opts, ...opts };
    try { await sndEngine.start(SND.preset, opts); }
    catch (e) { console.warn(e); toast("Audio could not start on this device."); return; }
    setPlayerMode("playing");
    requestWakeLock();
  }
  async function soundToggle() {
    if (SND.mode === "playing") {
      const st = await sndEngine.status();
      SND.userStopped = true;
      const opts = { minutes: SND.opts.minutes, volume: $("#sp-volume").value / 100, noise: $("#sp-noise").value / 100 };
      SND.paused = { preset: SND.preset, elapsed: st ? st.elapsed : 0, opts };
      await sndEngine.stop({ log: false, fade: false });
      setPlayerMode("paused");
    } else if (SND.mode === "paused" && SND.paused) {
      const { preset, elapsed, opts } = SND.paused;
      SND.userStopped = false; SND.last = null;
      try { await sndEngine.start(preset, { ...opts, offset: elapsed }); } catch { toast("Audio could not resume."); return; }
      SND.paused = null;
      setPlayerMode("playing");
    }
  }
  async function soundStop() {
    SND.userStopped = true;
    if (SND.mode === "paused" && SND.paused) {
      const mins = Math.round(SND.paused.elapsed / 60);
      SND.paused = null;
      if (mins >= 1) {
        const fresh = logMinutes("meditation", mins);
        toast(`${mins} min meditation logged${fresh ? ` · +${C.POINTS.practice}` : ""}`);
        render(); checkMilestones();
      }
    } else {
      $("#sp-time").textContent = "Fading…";
      const r = await sndEngine.stop({ log: true, fade: true });
      if (EXT && r && r.minutes >= 1) toast(`${r.minutes} min meditation logged`);
    }
    SND.last = null;
    setPlayerMode("setup");
    releaseWakeLock();
  }
  function closeSoundPlayer() {
    clearInterval(SND.poll);
    closeOverlay($("#sound-player"));
    if (currentView === "protocols" && PTAB === "sound") refreshNowPlaying();
  }

  function bindSound() {
    $("#protocol-list").addEventListener("click", (e) => {
      const more = e.target.closest("[data-pmore]");
      if (more) {
        const id = more.dataset.pmore, panel = $(`#pd-${id}`), opening = panel.hidden;
        panel.hidden = !opening; more.setAttribute("aria-expanded", opening);
        more.textContent = opening ? "Hide details" : "Setup, steps & safety";
        opening ? PROTO_OPEN.add(id) : PROTO_OPEN.delete(id);
        return;
      }
      const t = e.target.closest("[data-ptab]");
      if (t) { PTAB = t.dataset.ptab; renderProtocols().then(() => { const b = $(`[data-ptab="${PTAB}"]`); b && b.focus(); }); return; }
      const s = e.target.closest("[data-sound]");
      if (s) { openSoundPlayer(s.dataset.sound); return; }
      if (e.target.closest("[data-hpcheck]")) {
        const out = $("#hp-status");
        SovSound.headphoneCheck((step) => {
          out.textContent = step === "left" ? "◀ You should hear this in your LEFT ear…"
            : step === "right" ? "You should hear this in your RIGHT ear ▶"
            : "If the sides were swapped, turn your headphones around.";
        });
      }
    });
    $("#protocol-list").addEventListener("keydown", (e) => {
      const t = e.target.closest("[data-ptab]");
      if (!t || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      e.preventDefault();
      const i = PTABS.findIndex(([id]) => id === PTAB);
      PTAB = PTABS[(i + (e.key === "ArrowRight" ? 1 : -1) + PTABS.length) % PTABS.length][0];
      renderProtocols().then(() => $(`[data-ptab="${PTAB}"]`).focus());
    });
    $("#sp-durations").addEventListener("click", (e) => {
      const b = e.target.closest("[data-smin]");
      if (!b) return;
      SND.opts.minutes = Number(b.dataset.smin); renderDurations();
      $(`[data-smin="${SND.opts.minutes}"]`).focus();
    });
    $("#sp-begin").addEventListener("click", soundBegin);
    $("#sp-toggle").addEventListener("click", soundToggle);
    $("#sp-stop").addEventListener("click", soundStop);
    $("#sp-close").addEventListener("click", closeSoundPlayer);
    $("#sp-volume").addEventListener("input", (e) => { SND.opts.volume = e.target.value / 100; sndEngine.set("volume", SND.opts.volume); });
    $("#sp-noise").addEventListener("input", (e) => { SND.opts.noise = e.target.value / 100; sndEngine.set("noise", SND.opts.noise); });
  }

  /* ========================================================================
     10. JOURNAL & CALENDAR
     ======================================================================== */
  const cal = { year: new Date().getFullYear(), month: new Date().getMonth(), selected: null };

  function renderJournal() {
    $("#journal-prompt").textContent = C.PROMPTS[dayIndex() % C.PROMPTS.length];
    const ta = $("#journal-text");
    if (document.activeElement !== ta) ta.value = state.draft || "";
    renderCalendar();
    renderEntries();
  }
  function renderCalendar() {
    const first = new Date(cal.year, cal.month, 1);
    const daysIn = new Date(cal.year, cal.month + 1, 0).getDate();
    const tk = todayKey();
    $("#cal-title").textContent = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    const dows = [...Array(7)].map((_, i) =>
      `<div class="cal-dow" role="columnheader" aria-hidden="true">${new Date(2023, 0, 1 + i).toLocaleDateString(undefined, { weekday: "narrow" })}</div>`);
    const cells = [...Array(first.getDay())].map(() => "<div></div>");
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(cal.year, cal.month, d), k = dateKey(date);
      const j = journalOn(k), pr = practiced(k), future = k > tk;
      const label = `${date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}${j ? ", journal entry" : ""}${pr ? ", practised" : ""}`;
      cells.push(`<button class="cal-day ${k === tk ? "today" : ""} ${cal.selected === k ? "selected" : ""} ${future ? "future" : ""}"
        data-day="${k}" aria-label="${label}" aria-pressed="${cal.selected === k}" ${future ? "disabled" : ""}>
        <span>${d}</span><span class="cal-dots">${j ? '<span class="dot dot-journal"></span>' : ""}${pr ? '<span class="dot dot-practice"></span>' : ""}</span></button>`);
    }
    $("#cal-grid").innerHTML = dows.join("") + cells.join("");
    const now = new Date();
    $("#cal-next").disabled = cal.year === now.getFullYear() && cal.month === now.getMonth();
  }
  function renderEntries() {
    let entries, title;
    if (cal.selected) {
      entries = state.journal.filter((j) => j.date === cal.selected);
      title = fmtLongDate(parseKey(cal.selected));
    } else {
      const prefix = `${cal.year}-${String(cal.month + 1).padStart(2, "0")}`;
      entries = state.journal.filter((j) => j.date.startsWith(prefix));
      title = `Entries · ${new Date(cal.year, cal.month, 1).toLocaleDateString(undefined, { month: "long" })}`;
    }
    entries.sort((a, b) => b.ts.localeCompare(a.ts));
    $("#entries-title").textContent = title;
    $("#entries-list").innerHTML = entries.length
      ? entries.map((j) => `<article class="card entry">
          <time datetime="${j.ts}">${new Date(j.ts).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
          ${j.prompt ? `<p class="entry-prompt">${esc(j.prompt)}</p>` : ""}
          <p class="entry-text">${esc(j.text)}</p>
          <div class="entry-actions"><button class="link-btn small" data-del="${j.id}">Delete</button></div>
        </article>`).join("")
      : `<p class="empty">${cal.selected ? "No entry on this day." : "No entries this month yet."}</p>`;
  }
  function bindJournal() {
    let draftTimer;
    $("#journal-text").addEventListener("input", (e) => {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(() => { state.draft = e.target.value; save(); $("#journal-status").textContent = "Draft saved"; }, 500);
    });
    $("#journal-save").addEventListener("click", () => {
      const text = $("#journal-text").value.trim();
      if (!text) { toast("Write something first."); $("#journal-text").focus(); return; }
      clearTimeout(draftTimer); // stop a pending draft-save from restoring the old text
      const now = new Date();
      state.journal.push({
        id: `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        date: dateKey(now), ts: now.toISOString(),
        prompt: $("#journal-prompt").textContent, text
      });
      const first = state.journal.filter((j) => j.date === dateKey(now)).length === 1;
      state.draft = "";
      save();
      $("#journal-text").value = "";
      $("#journal-status").textContent = "";
      cal.year = now.getFullYear(); cal.month = now.getMonth(); cal.selected = null;
      renderJournal();
      toast(first ? `Entry saved · +${C.POINTS.practice}` : "Entry saved");
      checkMilestones();
    });
    $("#cal-prev").addEventListener("click", () => { shiftMonth(-1); });
    $("#cal-next").addEventListener("click", () => { shiftMonth(1); });
    $("#cal-grid").addEventListener("click", (e) => {
      const b = e.target.closest("[data-day]");
      if (!b) return;
      cal.selected = cal.selected === b.dataset.day ? null : b.dataset.day;
      renderCalendar(); renderEntries();
      const again = $(`[data-day="${b.dataset.day}"]`); again && again.focus();
    });
    $("#entries-list").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-del]");
      if (!b) return;
      const v = await dialog({ title: "Delete this entry?", html: "<p class='muted'>This cannot be undone.</p>",
        actions: [{ label: "Cancel", value: "no" }, { label: "Delete", value: "yes", danger: true }] });
      if (v !== "yes") return;
      state.journal = state.journal.filter((j) => j.id !== b.dataset.del);
      save(); renderCalendar(); renderEntries();
    });
  }
  function shiftMonth(n) {
    const d = new Date(cal.year, cal.month + n, 1);
    cal.year = d.getFullYear(); cal.month = d.getMonth(); cal.selected = null;
    renderCalendar(); renderEntries();
  }

  /* ========================================================================
     11. SETTINGS — profile, theme, export / import / reset
     ======================================================================== */
  function openSettings() {
    const p = state.profile;
    const seg = (name, opts, cur) => `<div class="seg" role="group" aria-label="${name}">${opts.map(([v, l]) =>
      `<button class="chip" data-set="${name}" data-val="${v}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div>`;
    $("#settings-body").innerHTML = `
      <div class="setting-group"><h3>Name</h3>
        <label class="visually-hidden" for="set-name">Name</label>
        <input type="text" id="set-name" maxlength="40" value="${esc(p.name)}"></div>
      <div class="setting-group"><h3>Track</h3>${seg("track", [["men", "Men"], ["women", "Women"]], p.track)}</div>
      <div class="setting-group"><h3>Level</h3>${seg("level", LEVELS.map((l) => [l, cap(l)]), p.level)}</div>
      <div class="setting-group"><h3>Gentle reminders</h3>
        ${seg("reminders", [["on", "On"], ["off", "Off"]], state.settings.reminders === false ? "off" : "on")}
        <label class="field" style="margin:14px 0 10px"><span class="field-label">Daily practice reminder</span>
          <input type="time" id="set-reminder" value="${esc(p.reminder || "")}"></label>
        <p class="field-label" style="margin-bottom:6px">Reminder sound</p>
        <div class="btn-row" style="align-items:center">${seg("reminderSound", [["om", "Om"], ["silent", "Silent"]], state.settings.reminderSound === "silent" ? "silent" : "om")}
          <button class="link-btn" id="set-om-preview">Preview</button></div>
        <p class="hint" style="margin-top:10px">Nothing is ever scheduled for you. At most two a day: your daily practice reminder (leave blank for none), and a focus reminder only if you add one on Home. Each is skipped if it's already done.
          Times follow this device's time zone (${esc(Intl.DateTimeFormat().resolvedOptions().timeZone || "local time")}).
          ${EXT ? "Reminders arrive even when Sovereign is closed, as long as Chrome is running." : "On the web, reminders arrive while Sovereign is open or minimised."}</p></div>
      <div class="setting-group"><h3>Guidance sounds</h3>
        ${cueSliderHTML("set-cue-vol")}
        ${seg("duckSessions", [["on", "Dip frequencies during cues"], ["off", "Keep frequencies steady"]], state.settings.duckSessions === false ? "off" : "on")}
        <p class="hint" style="margin-top:10px">The bells and tones that guide breath, protocol steps and mala counts. When a Sound session is playing, it can dip for a moment so each cue is easy to hear. To change the frequencies themselves, use the volume slider in the Sound player.</p></div>
      <div class="setting-group"><h3>Appearance</h3>${seg("theme", [["dark", "Dark"], ["light", "Light"]], state.settings.theme)}</div>
      <div class="setting-group"><h3>Your data</h3>
        <p class="hint">Everything is stored only in this browser. Clearing browser data will erase it.
        ${state.meta.lastExport ? `Last backup: ${new Date(state.meta.lastExport).toLocaleDateString()}.` : "<strong>No backup yet.</strong>"}</p>
        <div class="btn-row">
          <button class="btn" id="set-export">Export backup</button>
          <button class="btn" id="set-import">Import backup</button>
          <input type="file" id="set-import-file" accept="application/json,.json" hidden>
        </div></div>
      <div class="setting-group"><h3>About</h3>
        <div class="btn-row"><button class="btn" id="set-disclaimer">Read disclaimer</button></div></div>
      <div class="setting-group"><h3>Danger zone</h3>
        <button class="btn btn-danger" id="set-reset">Reset all data</button></div>
      <p class="version">Sovereign v${APP_VERSION} · Stored on this device only</p>`;
    openOverlay($("#settings"), closeSettings);
  }
  function closeSettings() { closeOverlay($("#settings")); render(); }

  function bindSettings() {
    $("#open-settings").addEventListener("click", openSettings);
    $("#close-settings").addEventListener("click", closeSettings);
    $("#settings").addEventListener("click", (e) => { if (e.target.id === "settings") closeSettings(); });

    const body = $("#settings-body");
    body.addEventListener("click", async (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.set) {
        const { set, val } = b.dataset;
        if (set === "theme") { state.settings.theme = val; applyTheme(); }
        else if (set === "reminders") state.settings.reminders = val === "on";
        else if (set === "reminderSound") state.settings.reminderSound = val;
        else if (set === "duckSessions") state.settings.duckSessions = val === "on";
        else state.profile[set] = val;
        save();
        $$(`[data-set="${set}"]`, body).forEach((x) => x.setAttribute("aria-pressed", x.dataset.val === val));
        toast(set === "duckSessions" ? (val === "on" ? "Frequencies will dip during cues" : "Frequencies stay steady") : set === "reminders" ? `Reminders ${val}` : set === "reminderSound" ? `Reminder sound: ${cap(val)}` : `${cap(set)} set to ${cap(val)}`);
      }
      if (b.id === "set-om-preview") { b.disabled = true; SovSound.playOm(0.8).finally(() => (b.disabled = false)); }
      if (b.id === "set-export") exportData();
      if (b.id === "set-import") $("#set-import-file").click();
      if (b.id === "set-disclaimer") dialog({ title: "Disclaimer", html: `<div class="disclaimer" style="max-height:60vh">${C.DISCLAIMER}</div>`, actions: [{ label: "Close", value: "x", primary: true }] });
      if (b.id === "set-reset") resetData();
    });
    body.addEventListener("change", (e) => {
      if (e.target.id === "set-name" && e.target.value.trim()) { state.profile.name = e.target.value.trim().slice(0, 40); save(); renderHeader(); toast("Name saved"); }
      if (e.target.id === "set-reminder") {
        state.profile.reminder = e.target.value; save();
        if (e.target.value) { requestNotifyPermission(); toast(`Reminder set for ${e.target.value}`); } else toast("Reminder off");
      }
      if (e.target.id === "set-import-file" && e.target.files[0]) importData(e.target.files[0]);
    });
  }

  function exportData() {
    const payload = { app: "sovereign", version: APP_VERSION, exportedAt: new Date().toISOString(), data: state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sovereign-backup-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    state.meta.lastExport = new Date().toISOString();
    save();
    if (currentView === "home") renderBanners();
    toast("Backup saved to your Downloads folder");
  }

  async function importData(file) {
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed.app === "sovereign" ? parsed.data : null;
      if (!data || !data.profile) throw new Error("not a Sovereign backup");
      const v = await dialog({
        title: "Replace current data?",
        html: `<p>This backup is from <strong>${new Date(parsed.exportedAt).toLocaleDateString()}</strong> and belongs to <strong>${esc(data.profile.name)}</strong>.</p>
               <p class="muted">Importing replaces everything currently on this device.</p>`,
        actions: [{ label: "Cancel", value: "no" }, { label: "Import", value: "yes", primary: true }]
      });
      if (v !== "yes") return;
      state = normalise(data);
      save(); applyTheme();
      closeSettings();
      go("home");
      toast("Backup restored");
    } catch (err) {
      dialog({ title: "Import failed", html: "<p class='muted'>That file isn't a valid Sovereign backup.</p>", actions: [{ label: "OK", value: "ok", primary: true }] });
    } finally {
      const f = $("#set-import-file"); if (f) f.value = "";
    }
  }

  async function resetData() {
    const v = await dialog({
      title: "Reset all data?",
      html: `<p>This permanently erases your profile, streaks, points and journal from this device.</p>
             <label class="field"><span class="field-label">Type RESET to confirm</span><input type="text" id="reset-confirm" autocomplete="off"></label>`,
      actions: [{ label: "Cancel", value: "no" }, { label: "Erase everything", value: "yes", danger: true }],
      read: () => $("#reset-confirm").value
    });
    if (v.value === "yes" && v.read.trim().toUpperCase() === "RESET") {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      if (EXT) await chrome.storage.local.remove([STORAGE_KEY, "sovereign.writer"]).catch(() => {});
      location.reload();
    } else if (v.value === "yes") toast("Not reset — confirmation didn't match.");
  }

  /* ========================================================================
     12. DIALOGS & TOASTS
     ======================================================================== */
  /** Promise-based modal. Returns the chosen action value
      (or {value, read} when a `read` callback is supplied). */
  function dialog({ title, html, actions, read }) {
    const d = $("#dialog");
    $("#dialog-title").textContent = title;
    $("#dialog-body").innerHTML = html;
    $("#dialog-actions").innerHTML = actions.map((a) =>
      `<button class="btn ${a.primary ? "btn-primary" : ""} ${a.danger ? "btn-danger" : ""}" value="${a.value}">${esc(a.label)}</button>`).join("");
    return new Promise((resolve) => {
      let captured = "";
      const onClick = () => { if (read) captured = read(); };
      d.addEventListener("click", onClick, { capture: true });
      d.addEventListener("close", () => {
        d.removeEventListener("click", onClick, { capture: true });
        const value = d.returnValue || "cancel";
        resolve(read ? { value, read: captured } : value);
      }, { once: true });
      d.returnValue = "";
      d.showModal();
    });
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ========================================================================
     13. MILESTONES — celebrated once per streak run
     ======================================================================== */
  async function checkMilestones() {
    const s = currentStreak();
    if (!s) return;
    const startKey = dateKey(addDays(new Date(), -(s - 1) - (practiced(todayKey()) ? 0 : 1)));
    const hits = Object.keys(C.MILESTONES).map(Number).filter((m) => m <= s && !state.milestonesSeen.includes(`${startKey}:${m}`));
    if (!hits.length) return;
    hits.forEach((m) => state.milestonesSeen.push(`${startKey}:${m}`));
    save();
    const m = Math.max(...hits), info = C.MILESTONES[m];
    chime(528, 3);
    await dialog({
      title: info.title,
      html: `<div class="milestone-num" aria-hidden="true">${m}</div><p>${esc(info.text)}</p>`,
      actions: [{ label: "Continue", value: "ok", primary: true }]
    });
  }

  /* ========================================================================
     14. REMINDERS
     Without a server, a web app can only notify while it is open or
     minimised. We check every 30s and show a system notification if
     permitted, plus an in-app banner on Home.
     ======================================================================== */
  function requestNotifyPermission() {
    if (EXT) return; // the extension's background worker handles notifications
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
  }
  /** Play the Om (unless silent) and show a system notification if allowed. Website only. */
  function deliverReminder(title, body, tag) {
    const om = state.settings.reminderSound !== "silent";
    if (om && window.SovSound) SovSound.playOm(0.8).catch(() => {});
    if ("Notification" in window && Notification.permission === "granted") {
      const opts = { body, icon: "icons/icon-192.png", tag, silent: om };
      navigator.serviceWorker?.ready
        .then((reg) => reg.showNotification(title, opts))
        .catch(() => { try { new Notification(title, opts); } catch (_) {} });
    }
  }

  function checkReminder() {
    if (!state.profile || state.settings.reminders === false) return;
    const tk = todayKey(), hhmm = nowHHMM();

    // Daily practice reminder — only if nothing has been practised today.
    const r = state.profile.reminder;
    if (r && hhmm >= r && state.meta.lastNotified !== tk && !practiced(tk)) {
      state.meta.lastNotified = tk; save();
      if (!EXT) deliverReminder("Sovereign", "Your practice time has arrived. Five minutes is enough to begin.", "sovereign-reminder");
      if (currentView === "home") renderBanners();
    }

    // Focus reminder — only if the member set one and hasn't applied the focus yet.
    // (In the extension the background worker delivers it, even when the panel is closed.)
    const f = day().focus;
    if (!EXT && f && f.remindAt && !f.done && !f.notified && hhmm >= f.remindAt) {
      f.notified = true; save();
      deliverReminder("Today’s focus", `${f.title}. ${f.cue}`, "sovereign-focus");
      toast(`Today’s focus: ${f.title}`);
      if (currentView === "home") renderFocus();
    }
  }

  /* ========================================================================
     15. SERVICE WORKER & BOOT
     ======================================================================== */
  function registerSW() {
    if (EXT) return; // extension files are packaged locally — already offline
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol === "file:") { console.info("Offline mode needs the app served over http(s)."); return; }
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW registration failed", e));
  }

  function startApp() {
    appStarted = true;
    $("#app").hidden = false;
    // Extension side panel: offer the roomier full-view tab.
    if (EXT && !IS_FULL) {
      const b = $("#open-full");
      b.hidden = false;
      b.addEventListener("click", () => chrome.tabs.create({ url: chrome.runtime.getURL("index.html?full=1") }));
    }
    if (IS_FULL) document.body.classList.add("full-view");
    bindHome(); bindBanners(); bindGuide(); bindFocus(); bindPacer(); bindSound(); bindCueSliders(); bindTimer(); bindLibrary(); bindJournal(); bindSettings();
    $$(".nav-btn").forEach((b) => b.addEventListener("click", () => go(b.dataset.view)));
    go("home");
    checkMilestones();
    checkReminder();
    setInterval(checkReminder, 30000);
    // Re-render when the date rolls over at midnight or when returning to the app.
    let lastDay = todayKey();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && todayKey() !== lastDay) { lastDay = todayKey(); render(); }
    });
  }

  async function boot() {
    state = await loadState();
    applyTheme();
    registerSW();
    watchOtherWindows();
    if (state.profile) startApp(); else startOnboarding();
  }
  boot();
})();
