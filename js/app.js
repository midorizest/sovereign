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
  const APP_VERSION = "1.16.0";
  const STORAGE_KEY = "sovereign.v1";

  /* Platform: the same code runs as a website/PWA and as a Chrome extension.
     EXT     – running inside the extension (side panel or full-view tab)
     IS_FULL – the full-view tab (?full=1) rather than the side panel */
  const EXT = !!(window.chrome && chrome.runtime && chrome.runtime.id && chrome.storage);
  const IS_FULL = new URLSearchParams(location.search).has("full");
  /* NATIVE – running inside the Android app (Capacitor). Native plugins give
     real reminders when the app is closed, the back button, and a share sheet
     for backups. */
  const CAP = window.Capacitor;
  const NATIVE = !!(CAP && ((CAP.isNativePlatform && CAP.isNativePlatform()) || (CAP.getPlatform && CAP.getPlatform() !== "web")));
  const plugin = (name) => {
    if (!NATIVE) return null;
    const p = CAP.Plugins && CAP.Plugins[name];
    if (p) return p;
    try { return CAP.registerPlugin ? CAP.registerPlugin(name) : null; } catch (_) { return null; }
  };
  const WRITER_ID = Math.random().toString(36).slice(2); // identifies this window's saves
  let saveSeq = 0;
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
    draft: "",
    security: null,  // { enabled, salt, iter, check, autoLock, fails, waitUntil } when App lock is on
    // Daycycle (optional): birth date is encrypted (dobEnc) when App lock is on.
    // feel: evening check-ins (1–5); briefs: next days' reminder lines, kept only when notifications show details.
    daycycle: { on: false, dob: "", dobEnc: null, wake: "07:00", sleep: "22:30", planOpen: false, feel: {}, briefs: {} }
  });

  let state = blankState(); // filled in by loadState() during boot

  /* ========================================================================
     SECURITY — App lock, encrypted journal, encrypted backups
     With App lock on, journal entries and drafts are stored encrypted
     (AES-256-GCM, key derived from the passcode with PBKDF2). The key lives
     only in memory while Sovereign is unlocked. Practice logs stay readable
     so reminders and streaks keep working, but the whole app sits behind
     the lock screen, and backups are encrypted in full.
     ======================================================================== */
  let KEY = null;               // CryptoKey while unlocked
  const PLAIN = new Map();      // decrypted journal entries: id → { prompt, text }
  let draftPlain = "";
  let DOB_PLAIN = "";            // decrypted Daycycle birth date while unlocked
  let unlockedOnce = false;
  const secOn = () => !!state.security?.enabled;

  /* Faith path (Settings › Faith & Scripture): "open" (default), "blended" or "christian".
     Blended adds Scripture and Christian prayer; Christian also sets aside
     practices from other traditions and swaps in Christian ones. */
  const faith = () => state.settings.faith || "open";
  const scriptureOn = () => faith() !== "open" && !!C.SCRIPTURE;
  const christian = () => faith() === "christian" && !!C.SCRIPTURE;
  const hiddenFor = (kind, id) => christian() && C.SCRIPTURE.HIDE[kind].includes(id);
  const reminderSound = () => { const r = state.settings.reminderSound || "om"; return r === "om" && faith() === "christian" ? "bell" : r; };
  const translation = () => (state.settings.translation === "web" ? "web" : "kjv");
  const verseText = (ref) => C.SCRIPTURE?.VERSES[ref]?.[translation()] || "";
  const verseHTML = (ref) => `<blockquote class="verse"><p>${esc(verseText(ref))}</p><cite>${esc(ref)} · ${C.SCRIPTURE.SHORT[translation()]}</cite></blockquote>`;
  const GRACE_KEY = "sovereign.grace";

  function entryView(j) {
    if (!j.enc) return j;
    return { ...j, ...(PLAIN.get(j.id) || { prompt: "", text: "Locked entry" }) };
  }
  async function decryptJournal() {
    if (!KEY) return;
    for (const j of state.journal) {
      if (j.enc && !PLAIN.has(j.id)) {
        try { PLAIN.set(j.id, await SovSecure.decryptJSON(KEY, j.enc)); } catch (_) { PLAIN.set(j.id, { prompt: "", text: "This entry could not be decrypted." }); }
      }
    }
    if (state.draftEnc) { try { draftPlain = await SovSecure.decryptText(KEY, state.draftEnc); } catch (_) { draftPlain = ""; } }
    if (state.daycycle.dobEnc) { try { DOB_PLAIN = await SovSecure.decryptText(KEY, state.daycycle.dobEnc); } catch (_) { DOB_PLAIN = ""; } }
  }
  /** Encrypt every plain journal entry and the draft with `key` (used when turning the lock on or changing it). */
  async function encryptJournalWith(key) {
    const out = [];
    for (const j of state.journal) {
      const plain = j.enc ? PLAIN.get(j.id) : { prompt: j.prompt || "", text: j.text || "" };
      if (!plain) { out.push(j); continue; }
      PLAIN.set(j.id, plain);
      out.push({ id: j.id, date: j.date, ts: j.ts, enc: await SovSecure.encryptJSON(key, plain) });
    }
    state.journal = out;
    const d = state.draftEnc ? draftPlain : state.draft;
    draftPlain = d || "";
    state.draftEnc = draftPlain ? await SovSecure.encryptText(key, draftPlain) : null;
    state.draft = "";
    const dob = state.daycycle.dobEnc ? DOB_PLAIN : state.daycycle.dob;
    DOB_PLAIN = dob || "";
    state.daycycle.dobEnc = dob ? await SovSecure.encryptText(key, dob) : null;
    state.daycycle.dob = "";
    await relockLibrary(KEY, key);
  }
  function decryptedJournalPlain() {
    return state.journal.map((j) => j.enc ? { id: j.id, date: j.date, ts: j.ts, ...(PLAIN.get(j.id) || { prompt: "", text: "" }) } : j);
  }

  /* Extension: keep the unlocked key in Chrome's memory-only session storage
     for the chosen auto-lock window, so reopening the side panel doesn't ask
     again every time. It is never written to disk and is cleared when Chrome
     closes, when you lock, or when the window expires. */
  async function setGrace() {
    if (!EXT || !KEY || !chrome.storage.session) return;
    const mins = Number(state.security?.autoLock ?? 5);
    if (mins <= 0) return clearGrace();
    try { await chrome.storage.session.set({ [GRACE_KEY]: { key: await SovSecure.exportKey(KEY), until: Date.now() + mins * 60000 } }); } catch (_) {}
  }
  async function clearGrace() { if (EXT && chrome.storage.session) { try { await chrome.storage.session.remove(GRACE_KEY); } catch (_) {} } }
  async function useGrace() {
    if (!EXT || !chrome.storage.session) return false;
    try {
      const g = (await chrome.storage.session.get(GRACE_KEY))[GRACE_KEY];
      if (!g || g.until < Date.now()) { await clearGrace(); return false; }
      const key = await SovSecure.importKey(g.key);
      await SovSecure.decryptText(key, state.security.check); // confirm it matches the current lock
      KEY = key; return true;
    } catch (_) { await clearGrace(); return false; }
  }

  /* ---- Lock screen ---- */
  function showLock() {
    // Close anything open first: a running protocol stops, the breath pacer or
    // mala logs what was done, and a Sound session keeps playing.
    const d = $("#dialog"); if (d.open) d.close();
    try { if (!$("#timer").hidden) stopTimer(); } catch (_) {}
    try { if (!$("#pacer").hidden) closePacer(); } catch (_) {}
    try { if (!$("#sound-player").hidden) closeSoundPlayer(); } catch (_) {}
    try { if (!$("#settings").hidden) closeOverlay($("#settings")); } catch (_) {}
    try { if (TRK.entry) trFlush(); } catch (_) {}
    try { if (!$("#journey").hidden) closeOverlay($("#journey")); TRK.entry = null; } catch (_) {}
    try { if (!$("#daycycle").hidden) closeOverlay($("#daycycle")); } catch (_) {}
    try { if (!$("#printables").hidden) { closeOverlay($("#printables")); $("#printables-frame").removeAttribute("src"); delete $("#printables-frame").dataset.src; } } catch (_) {}
    KEY = null; PLAIN.clear(); draftPlain = ""; DOB_PLAIN = "";
    clearGrace();
    $("#app").inert = true; $("#app").hidden = true;
    const ta = $("#journal-text"); if (ta) ta.value = "";
    $("#entries-list") && ($("#entries-list").innerHTML = "");
    $("#lockscreen").hidden = false;
    $("#lock-input").value = ""; $("#lock-msg").textContent = "";
    updateLockWait();
    setTimeout(() => $("#lock-input").focus(), 50);
  }
  function lockWaitLeft() { return Math.max(0, (state.security?.waitUntil || 0) - Date.now()); }
  let waitTimer;
  function updateLockWait() {
    clearInterval(waitTimer);
    const tick = () => {
      const left = lockWaitLeft();
      $("#lock-submit").disabled = left > 0; $("#lock-input").disabled = left > 0;
      if (left > 0) $("#lock-msg").textContent = `Too many attempts. Try again in ${Math.ceil(left / 1000)} s.`;
      else { clearInterval(waitTimer); if (/Too many/.test($("#lock-msg").textContent)) $("#lock-msg").textContent = ""; $("#lock-input").focus(); }
    };
    tick(); if (lockWaitLeft() > 0) waitTimer = setInterval(tick, 1000);
  }
  async function tryUnlock(e) {
    e.preventDefault();
    if (lockWaitLeft() > 0) return;
    const pass = $("#lock-input").value;
    if (!pass) return;
    $("#lock-submit").disabled = true; $("#lock-msg").textContent = "Unlocking…";
    const key = await SovSecure.unlock(pass, state.security);
    $("#lock-input").value = "";
    if (!key) {
      const fails = (state.security.fails || 0) + 1;
      state.security.fails = fails;
      // After 5 wrong tries: wait 30 s, doubling each time, up to 15 min.
      if (fails >= 5) state.security.waitUntil = Date.now() + Math.min(900000, 30000 * 2 ** (fails - 5));
      save();
      $("#lock-msg").textContent = fails >= 5 ? "" : "That passcode didn't match.";
      $("#lock-submit").disabled = false;
      updateLockWait();
      return;
    }
    KEY = key;
    state.security.fails = 0; state.security.waitUntil = 0; save();
    await afterUnlock();
  }
  async function afterUnlock() {
    await decryptJournal();
    await setGrace();
    $("#lockscreen").hidden = true;
    $("#app").hidden = false; $("#app").inert = false;
    if (!appStarted) startApp(); else render();
    unlockedOnce = true;
  }
  async function forgotPasscode() {
    const v = await dialog({
      title: "Forgot your passcode?",
      html: `<p>Your passcode can't be recovered — it's never stored anywhere, which is what keeps your journal private.</p>
             <p>You can remove the lock. <strong>Your encrypted journal entries will be permanently erased</strong>, along with your Daycycle birth date and your 40-Day Tracker entries. Your practice history, streaks and settings stay.</p>
             <p class="muted">If you have an encrypted backup, you'll still need the passcode you used when you made it.</p>
             <label class="field"><span class="field-label">Type ERASE to confirm</span><input type="text" id="forgot-confirm" autocomplete="off"></label>`,
      actions: [{ label: "Cancel", value: "no" }, { label: "Erase journal & remove lock", value: "yes", danger: true }],
      read: () => $("#forgot-confirm").value
    });
    if (v.value !== "yes" || v.read.trim().toUpperCase() !== "ERASE") return;
    state.journal = state.journal.filter((j) => !j.enc);
    state.draftEnc = null; state.draft = "";
    state.daycycle.dobEnc = null; state.daycycle.briefs = {};
    try { const all = await readLibraryEntries(); for (const [id, raw] of Object.entries(all)) if (raw && raw.enc) await libDel(id); } catch (_) {}
    state.security = null;
    save(); await clearGrace();
    toast("Lock removed. Your journal was erased.");
    $("#lockscreen").hidden = true; $("#app").hidden = false; $("#app").inert = false;
    if (!appStarted) startApp(); else render();
  }

  /* Auto-lock: when Sovereign has been hidden or closed for the chosen time. */
  let hiddenAt = 0;
  function bindAutoLock() {
    document.addEventListener("visibilitychange", () => {
      if (!secOn() || !KEY) return;
      const mins = Number(state.security.autoLock ?? 5);
      if (document.visibilityState === "hidden") { hiddenAt = Date.now(); if (mins <= 0) showLock(); }
      else if (hiddenAt && Date.now() - hiddenAt >= mins * 60000) showLock();
      else setGrace();
    });
  }

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
      daycycle: { ...b.daycycle, ...(s.daycycle || {}) },
      days: s.days || {}, journal: Array.isArray(s.journal) ? s.journal : [],
      lessons: s.lessons || {}, milestonesSeen: s.milestonesSeen || []
    };
  }
  function save() {
    if (EXT) {
      // The writer id lets other open windows (panel ↔ full view) know the change came from elsewhere.
      chrome.storage.local.set({ [STORAGE_KEY]: state, "sovereign.writer": `${WRITER_ID}:${++saveSeq}` })
        .catch(() => toast("Could not save — storage may be full. Please export a backup."));
      return;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { toast("Could not save — storage may be full. Please export a backup."); }
    if (NATIVE) queueNativeSchedule();
  }

  /* ========================================================================
     NATIVE (Android) — reminders, back button, backups
     Reminders are scheduled with the system as one-shot alarms for the next
     7 days, recomputed after every change: today's is skipped once you've
     practised, the focus reminder is skipped once applied, and everything is
     cancelled when reminders are off. So they arrive even when Sovereign is
     closed, but still never more than two a day.
     ======================================================================== */
  let nativeTimer = null, channelsReady = false;
  function queueNativeSchedule() { clearTimeout(nativeTimer); nativeTimer = setTimeout(scheduleNative, 800); }
  async function ensureChannels() {
    const LN = plugin("LocalNotifications");
    if (!LN || channelsReady) return;
    try {
      // Android plays a channel's sound; the Om lives in res/raw/om.wav.
      await LN.createChannel({ id: "sovereign-om", name: "Reminders · Om", description: "Gentle reminders with the Om sound", importance: 4, sound: "om.wav", visibility: 0, vibration: true });
      await LN.createChannel({ id: "sovereign-bell", name: "Reminders · Bell", description: "Gentle reminders with a church bell", importance: 4, sound: "bell.wav", visibility: 0, vibration: true });
      await LN.createChannel({ id: "sovereign-quiet", name: "Reminders · Silent", description: "Gentle reminders without sound", importance: 2, visibility: 0, vibration: false });
      channelsReady = true;
    } catch (_) {}
  }
  async function scheduleNative() {
    const LN = plugin("LocalNotifications");
    if (!LN) return;
    try {
      const pending = await LN.getPending();
      const mine = (pending.notifications || []).filter((n) => n.id >= 100 && n.id <= 200).map((n) => ({ id: n.id }));
      if (mine.length) await LN.cancel({ notifications: mine });
      if (!state.profile) return;
      if (state.settings.reminders === false) return;
      await ensureChannels();
      const channelId = { silent: "sovereign-quiet", bell: "sovereign-bell" }[reminderSound()] || "sovereign-om";
      const discreet = state.settings.discreet !== false;
      const now = new Date(), list = [];
      const r = state.profile.reminder;
      if (r) {
        const [h, m] = r.split(":").map(Number);
        for (let i = 0; i < 7; i++) {
          const at = new Date(); at.setDate(at.getDate() + i); at.setHours(h, m, 0, 0);
          if (at <= now || (i === 0 && practiced(todayKey()))) continue;
          list.push({ id: 100 + i, title: "Sovereign", channelId, schedule: { at, allowWhileIdle: true },
            body: dailyReminderBody(dateKey(at)), largeBody: dailyReminderBody(dateKey(at)) });
        }
      }
      const f = day().focus;
      if (f && f.remindAt && !f.done) {
        const [h, m] = f.remindAt.split(":").map(Number);
        const at = new Date(); at.setHours(h, m, 0, 0);
        if (at > now) list.push({ id: 200, channelId, schedule: { at, allowWhileIdle: true },
          title: discreet ? "Sovereign" : "Today’s focus", body: discreet ? "A gentle reminder from Sovereign." : `${f.title}. ${f.cue}` });
      }
      if (list.length) await LN.schedule({ notifications: list });
    } catch (e) { console.warn("Could not schedule reminders", e); }
  }
  function bindNative() {
    if (!NATIVE) return;
    document.body.classList.add("native");
    const NA = plugin("SovereignAudio");
    try {
      const h = NA && NA.addListener("action", ({ action }) => {
        if (action === "pause") pauseSound();
        else if (action === "play") resumeSound();
        else if (action === "stop") soundStop();
      });
      h && h.catch && h.catch(() => {});
    } catch (_) {}
    const App = plugin("App");
    App && App.addListener("backButton", () => {
      // Back closes whatever is open, then returns Home, then leaves the app.
      const d = $("#dialog");
      if (d.open) { d.close(); return; }
      if (!$("#timer").hidden) { $("#timer-close").click(); return; }
      if (!$("#pacer").hidden) { $("#pacer-close").click(); return; }
      if (!$("#sound-player").hidden) { $("#sp-close").click(); return; }
      if (!$("#settings").hidden) { closeSettings(); return; }
      if (!$("#daycycle").hidden) { closeDaycycle(); return; }
      if (!$("#printables").hidden) { printablesBack(); return; }
      if (!$("#journey").hidden) { trackerBack(); return; }
      if (!$("#lesson-reader").hidden && currentView === "library") { renderLibrary(); return; }
      if (appStarted && currentView !== "home" && !$("#app").hidden) { go("home"); return; }
      App.exitApp();
    });
    // Coming back to the app: refresh the day and the reminder schedule.
    App && App.addListener("resume", () => { if (appStarted) { render(); queueNativeSchedule(); } });
    queueNativeSchedule();
  }
  /** Android: save the backup through the share sheet (Files, Drive, email…). */
  async function nativeExport(json, filename) {
    const FS = plugin("Filesystem"), Share = plugin("Share");
    if (!FS || !Share) throw new Error("plugins missing");
    const w = await FS.writeFile({ path: filename, data: json, directory: "CACHE", encoding: "utf8" });
    await Share.share({ title: "Sovereign backup", dialogTitle: "Save your Sovereign backup", url: w.uri });
  }

  /** Extension only: keep the side panel and full-view tab in step. */
  function watchOtherWindows() {
    if (!EXT) return;
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[STORAGE_KEY]) return;
      if (String(changes["sovereign.writer"]?.newValue || "").startsWith(WRITER_ID + ":")) return; // our own save
      const next = changes[STORAGE_KEY].newValue;
      if (!next || !next.profile) { location.reload(); return; }   // reset elsewhere
      if (!appStarted) { location.reload(); return; }               // onboarding finished elsewhere
      if ((next.security?.salt || "") !== (state.security?.salt || "")) { location.reload(); return; } // lock turned on/off/changed elsewhere
      state = normalise(next);
      applyTheme();
      if (secOn() && !KEY) return;                                   // locked: show nothing
      decryptJournal().then(() => { if ($("#settings").hidden) render(); });
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

    radioGroup($$("[data-faith]"), (el) => { ob.faith = el.dataset.faith; $("#ob-next-4").disabled = false; });
    $("#ob-next-4").addEventListener("click", () => showStep(5));

    // Daycycle: optional, offered once during setup.
    const dobOk = () => { const v = $("#ob-dob").value; return !!v && v <= todayKey() && v >= "1900-01-01"; };
    $("#ob-dob").max = todayKey();
    $("#ob-dob").addEventListener("input", () => ($("#ob-dc-on").disabled = !dobOk()));
    $("#ob-dc-on").addEventListener("click", () => { if (!dobOk()) return; ob.dc = { dob: $("#ob-dob").value, wake: $("#ob-wake").value || "07:00", sleep: $("#ob-sleep").value || "22:30" }; showStep(6); });
    $("#ob-dc-skip").addEventListener("click", () => { ob.dc = null; showStep(6); });

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
    state.settings.faith = ob.faith || "open";
    state.daycycle.introSeen = true;
    if (ob.dc) Object.assign(state.daycycle, { on: true, dob: ob.dc.dob, wake: ob.dc.wake, sleep: ob.dc.sleep });
    if (state.settings.faith === "christian") { state.settings.reminderSound = "bell"; G.tab = "scripture"; }
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
    $("#lock-now").hidden = !secOn();
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
    renderDaycycleCard();
    renderTrackerCard();
    if (refreshBriefs()) save();

    // Principle of the day
    // Christian path: a verse every day. Blended: verse and principle on alternate days.
    if (scriptureOn() && (christian() || dayIndex() % 2 === 0)) {
      const ref = C.SCRIPTURE.DAILY[Math.floor(dayIndex() / (christian() ? 1 : 2)) % C.SCRIPTURE.DAILY.length];
      $("#daily-principle").innerHTML = `<p class="eyebrow verse-eyebrow">Verse of the day</p><p class="q">${esc(verseText(ref))}</p>
        <p class="src">${esc(ref)} · ${C.SCRIPTURE.SHORT[translation()]}</p>
        <button class="link-btn verse-help" data-scripture-help>Struggling? Find a verse for it</button>`;
    } else {
      const pr = C.PRINCIPLES[dayIndex() % C.PRINCIPLES.length];
      $("#daily-principle").innerHTML = `<p class="q">“${esc(pr.q)}”</p><p class="src">${esc(pr.src)}</p>`;
    }

    renderBanners();
  }

  function practiceHTML(p, rec, key) {
    const done = isPracticeDone(p.id, rec, key);
    const data = rec.practices[p.id] || {};
    const desc = typeof p.desc === "object" ? p.desc[state.profile.level] : p.desc;
    let body = "";

    if (p.kind === "minutes") {
      body = `<label class="minutes"><span class="visually-hidden">${p.name} minutes</span>
        <input type="number" inputmode="numeric" min="0" max="600" step="1" data-min="${p.id}" value="${esc(data.min || "")}" placeholder="0">
        <span class="muted small">minutes</span></label>`;
    }
    if (p.kind === "retention") {
      const suggested = data.count ?? suggestRetentionCount(key);
      body = `<div class="seg" role="group" aria-label="Retention today">
          <button class="chip" data-ret="held" aria-pressed="${data.status === "held"}">Held</button>
          <button class="chip" data-ret="released" aria-pressed="${data.status === "released"}">Released</button>
        </div>
        <label class="minutes"><span class="muted small">Day</span>
          <input type="number" min="0" max="9999" data-retcount value="${esc(data.status === "released" ? 0 : suggested)}" aria-label="Retention day count">
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
    $("#tracker-card").addEventListener("click", (e) => {
      const b = e.target.closest("[data-trc]"); if (!b) return;
      if (b.dataset.trc === "today") openTracker("today");
      else if (b.dataset.trc === "final") openTracker().then(() => { if (state.tracker?.ack) trGo("review", { review: "final" }); });
      else { TRK.view = "overview"; openTracker(); }
    });
    $("#daily-principle").addEventListener("click", (e) => {
      if (!e.target.closest("[data-scripture-help]")) return;
      G.tab = "scripture"; G.query = ""; $("#guide-search").value = "";
      go("guide");
      setTimeout(() => { const h = $("#struggles-head"); h && h.scrollIntoView({ block: "start" }); $(".struggles .chip")?.focus({ preventScroll: true }); }, 120);
    });
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
    const available = C.PROTOCOLS.filter((p) => p.tracks.includes(track) && !hiddenFor("protocols", p.id));
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
    const christianTools = scriptureOn() ? C.SCRIPTURE.PACER_ORDER : [];
    const tools = [...christianTools, ...[...BASIC_PATTERNS, ...(deepAllowed() ? DEEP_PATTERNS : [])].filter((t) => !hiddenFor("pacer", t))];
    const card = (t) => {
      const pat = pacerPattern(t);
      const cycle = pat.phases.reduce((a, ph) => a + ph.s, 0);
      const tag = christianTools.includes(t) ? "Breath prayer" : DEEP_PATTERNS.includes(t) ? "Deepen" : "All levels";
      return `<button class="card item-card breath-card" data-pacer="${t}">
        <div class="meta"><span class="tag">${tag}</span><span>${cycle}s per round</span></div>
        <h3>${esc(pat.title)}</h3><p class="muted" style="margin:0">${esc(pat.note)}</p></button>`;
    };
    const rope = `<button class="card item-card breath-card" data-pacer="rope">
        <div class="meta"><span class="tag">Prayer rope</span><span>100 prayers</span></div>
        <h3>Prayer Rope</h3><p class="muted" style="margin:0">Count 100 prayers of the Jesus Prayer, or a line of Scripture. Logs to Meditation.</p></button>`;
    const mala = `<button class="card item-card breath-card" data-pacer="mala">
        <div class="meta"><span class="tag">Japa</span><span>108 repetitions</span></div>
        <h3>Mala Counter</h3><p class="muted" style="margin:0">Count 108 repetitions of your mantra. Logs to Meditation.</p></button>`;
    return `<p class="view-sub" style="margin-bottom:16px">A guided breathing orb with ${christian() ? "prayer" : "mantra"} and nostril cues. Sessions log to Breathwork.</p>` +
      tools.map(card).join("") + (scriptureOn() ? rope : "") + (christian() ? "" : mala) +
      (deepAllowed() ? "" : `<p class="hint">${christian() ? "Breath retention opens" : "Bija Ascent, the Six Healing Sounds and Retention open"} with Deepen in the Guide.</p>`);
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
    if (!p || !protocolAllowed(p) || hiddenFor("protocols", p.id)) return;
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
    renderPrintablesShelf();
    const lessons = C.LESSONS.filter((l) => !hiddenFor("lessons", l.id));
    const ready = lessons.filter((l) => l.file);
    const later = lessons.filter((l) => !l.file);
    const total = lessons.length, completed = lessons.filter((l) => state.lessons[l.id]).length;

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
  /* ---- Printables (library/): fillable PDFs saved on the device ---- */
  let PRINTABLES = null;
  async function renderPrintablesShelf() {
    const el = $("#printables-shelf");
    $("#printables-shelf").hidden = false;
    try { PRINTABLES = PRINTABLES || (await import("../library/catalog.js")).CATALOG; } catch (e) { console.warn(e); el.innerHTML = ""; return; }
    const track = state.profile.track;
    const items = [...PRINTABLES].sort((a, b) => (b.track === track) - (a.track === track));
    const mine = items.filter((i) => i.track === track || i.track === "all");
    el.innerHTML = `<div class="cat-head" style="margin-top:6px"><h2>Printables</h2><p>Fill them in right here. Everything saves on this device.</p></div>
      <div class="printable-row">${(mine.length ? mine : items).map((i) => i.id === trId() && TR() ? `<div class="card printable-card built-in">
        <img src="library/${esc(i.cover)}" alt="">
        <span><span class="eyebrow" style="display:block;margin:0 0 4px">${esc(i.edition)}</span>
        <span class="printable-title">${esc(i.title)}</span>
        <span class="muted small">${trStart() ? `Day ${trTodayN()} of 40 · began ${esc(trShortDate(trStart()))}` : "Built into the app: one day per page, easy to fill in."}</span>
        <span class="btn-row" style="margin-top:12px"><button class="btn btn-primary" data-tracker-open>${trStart() ? "Continue" : "Begin"}</button>
        <button class="link-btn" data-printable="${esc(i.id)}">View as printable</button></span></span></div>` : `<button class="card printable-card" data-printable="${esc(i.id)}">
        <img src="library/${esc(i.cover)}" alt="" loading="lazy">
        <span><span class="eyebrow" style="display:block;margin:0 0 4px">${esc(i.edition)}</span>
        <span class="printable-title">${esc(i.title)}</span>
        <span class="muted small">${esc(i.blurb)}</span></span></button>`).join("")}</div>
      ${mine.length && mine.length < items.length ? `<button class="link-btn" data-printable="">See all printables</button>` : ""}`;
  }
  async function openPrintables(id) {
    const f = $("#printables-frame"), src = `library/index.html?track=${state.profile.track}`;
    openOverlay($("#printables"), closePrintables);
    if (f.dataset.src !== src) {
      f.dataset.src = src;
      await new Promise((res) => { f.addEventListener("load", res, { once: true }); f.src = src; });
    }
    // The Library sets up its API once its shelf has loaded.
    for (let i = 0; i < 60 && !f.contentWindow?.SovereignLibrary; i++) await new Promise((r) => setTimeout(r, 50));
    if (id && f.contentWindow?.SovereignLibrary) f.contentWindow.SovereignLibrary.open(id);
    setTimeout(() => f.focus(), 200);
  }
  async function closePrintables() {
    const lib = $("#printables-frame").contentWindow?.SovereignLibrary;
    // Close any open book first so its entries are saved.
    try { if (lib && !$("#printables-frame").contentDocument.querySelector("#reader").hidden) await lib.close(); } catch (_) {}
    closeOverlay($("#printables"));
    if (currentView === "library") renderPrintablesShelf();
  }
  /** Back button: close an open book, then the Library itself. */
  function printablesBack() {
    try {
      const doc = $("#printables-frame").contentDocument;
      if (doc && !doc.querySelector("#reader").hidden) { $("#printables-frame").contentWindow.SovereignLibrary.close(); return; }
    } catch (_) {}
    closePrintables();
  }
  // The Library page calls these from inside its frame.
  window.SovereignBridge = {
    close: () => closePrintables(),
    loadEntry: (id) => libGet(id),
    saveEntry: (id, entry) => libPut(id, entry),
    deleteEntry: (id) => libDel(id),
    ...(NATIVE ? { savePdf: async (name, base64) => {
      const FS = plugin("Filesystem"), Share = plugin("Share");
      const safe = name.replace(/[^\w .()-]+/g, "");
      const r = await FS.writeFile({ path: safe, data: base64, directory: "CACHE" });
      await Share.share({ title: safe, url: r.uri }).catch(() => {});
    } } : {})
  };

  /* Printable entries live in the Library's own IndexedDB ("sovereign-library").
     Backups carry them, and Reset erases them. */
  /* Tracker and printable entries go through the app, which encrypts them with
     the App-lock key while the lock is on (just like the journal). */
  async function libGet(id) {
    const raw = await readLibEntry(id);
    if (!raw || !raw.enc) return raw;
    if (!KEY) return null;
    try { return await SovSecure.decryptJSON(KEY, raw.enc); } catch (_) { return null; }
  }
  function libPut(id, entry) {
    const key = secOn() ? KEY : null;   // captured now, so a save begun just before locking still completes
    if (secOn() && !key) return Promise.resolve();   // locked: never write plain text
    return key ? SovSecure.encryptJSON(key, entry).then((enc) => writeLibEntry(id, { enc })) : writeLibEntry(id, entry);
  }
  async function libDel(id) {
    const db = await libDb(); if (!db) return;
    await new Promise((res) => { const tx = db.transaction("entries", "readwrite"); tx.objectStore("entries").delete(id); tx.oncomplete = tx.onerror = () => { db.close(); res(); }; });
  }
  /** Re-encrypt every Library entry: oldKey → newKey (null means plain text). */
  async function relockLibrary(oldKey, newKey) {
    const all = await readLibraryEntries().catch(() => ({}));
    for (const [id, raw] of Object.entries(all)) {
      let plain = raw;
      if (raw && raw.enc) { if (!oldKey) continue; try { plain = await SovSecure.decryptJSON(oldKey, raw.enc); } catch (_) { continue; } }
      await writeLibEntry(id, newKey ? { enc: await SovSecure.encryptJSON(newKey, plain) } : plain);
    }
  }

  function libDb() {
    return new Promise((res) => {
      try { const q = indexedDB.open("sovereign-library", 1); q.onupgradeneeded = () => q.result.createObjectStore("entries"); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }
      catch (_) { res(null); }
    });
  }
  async function readLibraryEntries() {
    const db = await libDb(); if (!db) return {};
    return new Promise((res) => {
      const out = {}, st = db.transaction("entries").objectStore("entries"), cur = st.openCursor();
      cur.onsuccess = () => { const c = cur.result; if (c) { out[c.key] = c.value; c.continue(); } else { db.close(); res(out); } };
      cur.onerror = () => { db.close(); res(out); };
    });
  }
  async function writeLibraryEntries(entries) {
    const db = await libDb(); if (!db || !entries) return;
    await new Promise((res) => {
      const tx = db.transaction("entries", "readwrite"), st = tx.objectStore("entries");
      st.clear(); Object.entries(entries).forEach(([k, v]) => st.put(v, k));
      tx.oncomplete = tx.onerror = () => { db.close(); res(); };
    });
  }

  function bindLibrary() {
    $("#printables-shelf").addEventListener("click", (e) => {
      if (e.target.closest("[data-tracker-open]")) { openTracker(trStart() ? "today" : undefined); return; }
      const b = e.target.closest("[data-printable]");
      if (b) openPrintables(b.dataset.printable);
    });
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
  const G = { tab: "build", open: new Set(), query: "", struggle: null };
  const pick = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v[state.profile.track] || v.men : v);

  const GTABS = ["build", "apply", "deepen", "books"];
  const GTAB_NAMES = { scripture: "Scripture", build: "Build", apply: "Apply", deepen: "Deepen", books: "Books" };

  /** Load the Build/Apply file first (it defines SOV.GUIDE), then Deepen + Books. */
  async function ensureGuide() {
    await loadScript("content/guide.js");
    await loadScript("content/deepen.js");
    await loadScript("content/hand.js");
    if (C.SCRIPTURE && C.GUIDE) C.GUIDE.scripture = C.SCRIPTURE.guide;
  }

  /** All practice items for the current track, flattened with their tab. */
  function guideItems() {
    if (!C.GUIDE) return [];
    return ["build", "apply", "deepen", ...(scriptureOn() ? ["scripture"] : [])].filter((t) => C.GUIDE[t]).flatMap((tab) => C.GUIDE[tab].categories
      .filter((cat) => !hiddenFor("guideCats", cat.name))
      .flatMap((cat) => cat.items.filter((i) => i.tracks.includes(state.profile.track) && !hiddenFor("guide", i.id)).map((i) => ({ ...i, tab }))));
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
    // The Scripture tab appears on the Blended and Christian paths.
    if (G.tab === "scripture" && !scriptureOn()) G.tab = "build";
    $("#tab-scripture").hidden = !scriptureOn();
    $("#tab-scripture").parentElement.classList.toggle("tabs-5", scriptureOn());
    $$("[data-gtab]").forEach((t) => {
      const on = t.dataset.gtab === G.tab;
      t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", `tab-${G.tab}`);
    $("#guide-search").placeholder = G.tab === "books" ? "Search books…" : G.tab === "scripture" ? "Search verses and practices…" : "Search practices…";

    const q = G.query.trim().toLowerCase();
    const track = state.profile.track;

    /* --- Books --- */
    if (G.tab === "books") {
      const sec = C.GUIDE.books;
      const bookCats = [...(scriptureOn() ? [C.SCRIPTURE.BOOKS] : []), ...sec.categories.filter((cat) => !hiddenFor("bookCats", cat.name))];
      const cats = bookCats.map((cat) => {
        const books = cat.items.filter((b) => (!b.tracks || b.tracks.includes(track)) && (!q || bookText(b).includes(q)));
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

    /* --- Scripture (Blended & Christian paths) --- */
    if (G.tab === "scripture") { panel.innerHTML = scriptureHTML(q); return; }

    /* --- Deepen gate --- */
    if (G.tab === "deepen" && !deepAllowed()) {
      panel.innerHTML = `<div class="card gate">
        <div class="sigil" aria-hidden="true"></div>
        <h2>For those ready to go deeper</h2>
        <p class="muted">Deepen holds advanced material: ${christian() ? "breath for the inward journey, herbal allies, guarding your attention" : "mantra and chant, breath retention, herbal allies, energetic protection"}, and creative channels. It opens at Intermediate level, or after a 30-day streak.</p>
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
    const cats = section.categories.filter((cat) => !hiddenFor("guideCats", cat.name)).map((cat) => {
      const items = cat.items.filter((i) => i.tracks.includes(track) && match(i) && !hiddenFor("guide", i.id));
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
      const other = ["build", "apply", "deepen", ...(scriptureOn() ? ["scripture"] : [])].find((t) => t !== G.tab && guideItems().some((i) => i.tab === t && match(i)) && (t !== "deepen" || deepAllowed()));
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
        ${i.refs && scriptureOn() ? `<div class="g-verses">${i.refs.map(verseHTML).join("")}</div>` : ""}
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
        const vis = tabs.filter((x) => !x.hidden), at = vis.indexOf(t);
        const next = vis[(at + (e.key === "ArrowRight" ? 1 : -1) + vis.length) % vis.length];
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
        else if (item.tool.type === "rope") openMala(item.tool.mantra, 100);
        else openPacer(item.tool.pattern);
      }
      if (e.target.closest("[data-unlock]")) {
        state.settings.deepenUnlocked = true; save();
        toast("Deepen is open. Go gently.");
        renderGuide();
      }
      const ls = e.target.closest("[data-glesson]");
      if (ls) { go("library"); openLesson(ls.dataset.glesson); }
      const st = e.target.closest("[data-struggle]");
      if (st) {
        G.struggle = G.struggle === st.dataset.struggle ? null : st.dataset.struggle;
        renderGuide();
        const again = $(`[data-struggle="${st.dataset.struggle}"]`); again && again.focus();
        if (G.struggle) $("#struggle-verse")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      const tp = e.target.closest("[data-tpacer]");
      if (tp) openPacer(tp.dataset.tpacer);
      const tg = e.target.closest("[data-tguide]");
      if (tg) openGuideItem(tg.dataset.tguide);
    });
  }
  /** Switch to the tab holding a Guide item, open it and bring it into view. */
  function openGuideItem(id) {
    const item = guideItems().find((i) => i.id === id);
    if (!item) return;
    G.tab = item.tab; G.query = ""; $("#guide-search").value = ""; G.open.add(id);
    renderGuide();
    setTimeout(() => { const t = $(`[data-gopen="${id}"]`); t && (t.scrollIntoView({ block: "center" }), t.focus()); }, 60);
  }

  /** Guide › Scripture: verses for hard moments, the teachings cross-referenced, Christian practices. */
  function scriptureHTML(q) {
    const S = C.SCRIPTURE, track = state.profile.track;
    const has = (txt) => !q || txt.toLowerCase().includes(q);
    const struggles = S.STRUGGLES.filter((x) => has(x.name + " " + x.refs.map(verseText).join(" ")));
    const cur = S.STRUGGLES.find((x) => x.id === G.struggle);
    const sHTML = struggles.length ? `<div class="cat-head" id="struggles-head"><h2>When you're struggling</h2><p>Tap what you're facing for a word to hold onto.</p></div>
      <div class="struggles" role="group" aria-label="What you're facing">${struggles.map((x) =>
        `<button class="chip" data-struggle="${x.id}" aria-pressed="${G.struggle === x.id}" aria-controls="struggle-verse">${esc(x.name)}</button>`).join("")}</div>
      <div id="struggle-verse" aria-live="polite">${cur ? `<div class="card struggle-card"><p class="eyebrow">${esc(cur.name)}</p>${cur.refs.map(verseHTML).join("")}
        <p class="hint" style="margin:10px 0 0">Read it slowly, twice. Then breathe it: in on the first half, out on the second.</p></div>` : ""}</div>
      <p class="g-source">${esc(S.STRUGGLES_CREDIT)}</p>` : "";
    const teachLink = (t) => {
      const l = t.link; if (!l) return "";
      if (l.type === "lesson") { const les = C.LESSONS.find((x) => x.id === l.id); return les && !hiddenFor("lessons", l.id) && lessonAllowed(les) ? `<div class="g-actions"><button class="btn" data-glesson="${l.id}">Read the lesson</button></div>` : ""; }
      if (l.type === "pacer") return `<div class="g-actions"><button class="btn btn-primary" data-tpacer="${l.id}">Pray it with the breath</button></div>`;
      if (l.type === "guide") return guideItems().some((i) => i.id === l.id) ? `<div class="g-actions"><button class="btn" data-tguide="${l.id}">See the practice</button></div>` : "";
      return "";
    };
    const teach = S.TEACHINGS.filter((t) => has([t.title, t.teaching, t.text, ...t.refs.map(verseText)].join(" ")));
    const tHTML = teach.length ? `<div class="cat-head"><h2>Sovereign's teachings in Scripture</h2><p>Each core teaching, read alongside the Bible.</p></div>` +
      teach.map((t) => {
        const open = G.open.has(t.id) || !!q;
        return `<article class="card g-item teach">
          <button class="g-toggle" data-gopen="${t.id}" aria-expanded="${open}" aria-controls="g-${t.id}">
            <span class="g-title">${esc(t.title)}</span><span class="g-chev" aria-hidden="true">⌄</span>
            <span class="g-meta"><span>${esc(t.teaching)}</span><span class="tag">${t.refs.length} ${t.refs.length === 1 ? "verse" : "verses"}</span></span></button>
          <div class="g-body" id="g-${t.id}" ${open ? "" : "hidden"}><p class="g-why">${esc(t.text)}</p>
            <div class="g-verses">${t.refs.map(verseHTML).join("")}</div>${teachLink(t)}</div></article>`;
      }).join("") : "";
    const focusId = day().focus?.id;
    const cats = S.guide.categories.map((cat) => {
      const items = cat.items.filter((i) => i.tracks.includes(track) && (!q || itemText(i).includes(q)));
      if (!items.length) return "";
      return `<div class="cat-head"><h2>${esc(cat.name)}</h2><p>${esc(cat.sub)}</p></div>` + items.map((i) => guideItemHTML(i, focusId === i.id)).join("");
    }).join("");
    const body = sHTML + tHTML + cats;
    return (q ? "" : `<p class="guide-intro">${esc(S.guide.intro)}</p>`) + (body || `<p class="empty">Nothing in Scripture matches “${esc(G.query)}”.</p>`);
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
    if (f.remindAt) return `<p class="focus-remind"><span class="bell" aria-hidden="true">◦</span> A gentle reminder at <strong>${esc(fmtClock(f.remindAt))}</strong>${f.notified ? " (sent)" : ""} ·
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
     9b. DAYCYCLE — optional day plan from three biorhythm cycles
     Off by default (Settings). Computed on the device from the birth date,
     which is encrypted when App lock is on. Each part of the day points to a
     real Sovereign practice the member's track and level allow. An evening
     check-in lets each person see, after a month, whether it matches them.
     The morning brief rides on the daily reminder; tomorrow's turning points
     appear only inside the app, never as an extra notification.
     ======================================================================== */
  const DC = () => C.DAYCYCLE;
  const dcDob = () => (state.daycycle.dobEnc ? DOB_PLAIN : state.daycycle.dob) || "";
  const dcReady = () => !!(state.daycycle.on && dcDob() && DC());
  const dcT = (key = todayKey()) => DC().daysAlive(dcDob(), key);
  const PACER_NAMES = { "so-hum": "So Hum breath", nadi: "Alternate Nostril Breath", bhramari: "Bee Breath", "478": "4-7-8 Breath", aum: "AUM Chant" };
  const DC_COLOR = { phy: "var(--cy-phy)", emo: "var(--cy-emo)", int: "var(--cy-int)", all: "var(--muted)" };

  /** Women's track: the most recent cycle phase logged in the last 5 days. */
  function dcPhase() {
    if (state.profile.track !== "women") return null;
    for (let i = 0; i < 5; i++) {
      const ph = state.days[dateKey(addDays(new Date(), -i))]?.practices?.cycle?.phase;
      if (ph && ph !== "unsure") return ph;
    }
    return null;
  }
  /** First suggestion the member's track and level allow → { label, attr }. */
  function dcAction(acts) {
    for (let a of acts || []) {
      if (a.type === "pacer" && hiddenFor("pacer", a.id) && C.SCRIPTURE.SWAP[a.id]) a = { ...a, id: C.SCRIPTURE.SWAP[a.id] };
      if (a.type === "protocol" && hiddenFor("protocols", a.id)) continue;
      if (a.type === "protocol") {
        const p = C.PROTOCOLS.find((x) => x.id === a.id);
        if (p && p.tracks.includes(state.profile.track) && protocolAllowed(p)) return { label: p.title, sub: `${p.minutes}-minute protocol`, attr: `data-dc-start="${p.id}"` };
      }
      if (a.type === "pacer" && C.SCRIPTURE?.PACER[a.id]) return { label: C.SCRIPTURE.PACER[a.id].title, sub: "Breath prayer", attr: `data-dc-pacer="${a.id}"` };
      if (a.type === "pacer" && PACER_NAMES[a.id] && (BASIC_PATTERNS.includes(a.id) || deepAllowed())) return { label: PACER_NAMES[a.id], sub: "Breath & mantra", attr: `data-dc-pacer="${a.id}"` };
      if (a.type === "sound") {
        const p = C.SOUND.presets.find((x) => x.id === a.id);
        if (p) return { label: `${p.name} sound`, sub: `${p.band} · ${p.minutes} min`, attr: `data-dc-sound="${p.id}"` };
      }
      if (a.type === "lesson") {
        const l = C.LESSONS.find((x) => lessonAllowed(x) && !state.lessons[x.id] && !hiddenFor("lessons", x.id));
        if (l) return { label: l.title, sub: `${l.minutes}-minute lesson`, attr: `data-dc-lesson="${l.id}"` };
      }
      if (a.type === "journal") return { label: "Write it out in your journal", sub: "Journal", attr: "data-dc-journal" };
      if (a.type === "guide") {
        const g = guideItems().find((x) => x.id === a.id);
        if (g) return { label: pick(g.title), sub: `Guide · ${g.time}`, attr: `data-dc-guide="${g.id}"` };
      }
    }
    return null;
  }
  const dcActBtn = (act, primary) => act ? `<button class="dc-act ${primary ? "primary" : ""}" ${act.attr}>
      <span class="dc-act-label">${esc(act.label)}</span><span class="dc-act-sub">${esc(act.sub)}</span><span aria-hidden="true" class="dc-act-arrow">→</span></button>` : "";

  function dcToday() {
    const t = dcT(), phase = dcPhase();
    const blocks = DC().plan(t, { phase, scripture: scriptureOn() });
    const key = DC().keyBlock(t, blocks), act = dcAction(key.act);
    const sum = DC().summary(dcDob(), todayKey(), { phase, practice: act ? act.label : "",
      history: Object.entries(state.daycycle.feel).map(([day, feel]) => ({ day, feel })), match: DC().match(dcDob(), state.daycycle.feel) });
    return { t, phase, blocks, read: DC().readings(t), head: DC().headline(t), key, act, sum };
  }
  /** Clock time for a plan block, placed between wake and sleep. */
  const toMin = (hhmm) => { const [h, m] = (hhmm || "07:00").split(":").map(Number); return h * 60 + m; };
  const fromMin = (x) => { x = ((Math.round(x) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
  function dcTimes(blocks) {
    const w = toMin(state.daycycle.wake || "07:00");
    let sl = toMin(state.daycycle.sleep || "22:30"); if (sl <= w) sl += 1440;
    const span = sl - w;
    return blocks.map((b) => ({ ...b, min: b.at != null ? w + Math.min(b.at, span * 0.2) : b.before != null ? sl - Math.min(b.before, span * 0.25) : w + b.frac * span }))
      .sort((a, b) => a.min - b.min);
  }
  /* On the Christian and Blended paths, a verse that fits the shape of the day. */
  const DC_VERSES = { turn: ["Isaiah 26:3", "Psalm 46:10"], strong: ["Colossians 3:23", "Ephesians 2:10"], recharge: ["Isaiah 40:31", "Matthew 11:28-30"],
    "lean-phy": ["Isaiah 40:29", "Isaiah 40:31"], "lean-emo": ["Psalm 42:11", "Philippians 4:6-7"], "lean-int": ["James 1:5-6", "Proverbs 4:23"] };
  function dcMeter(r, big) {
    const w = Math.abs(r.v) * 50;
    return `<div class="dc-read ${big ? "big" : ""}" style="--c:${DC_COLOR[r.k]}">
      <span class="dc-name">${r.n}</span>
      <span class="dc-val">${DC().signed(r.v)}</span>
      <span class="dc-state ${r.state.id}">${r.state.label}</span>
      <span class="dc-meter" aria-hidden="true"><i style="left:${r.v >= 0 ? 50 : 50 - w}%;width:${w}%"></i></span>
      ${big ? `<span class="dc-trend">${r.state.up ? "Rising" : "Falling"} · ${r.p}-day cycle</span>` : ""}</div>`;
  }
  function dcFeelHTML() {
    const cur = state.daycycle.feel[todayKey()];
    return `<div class="dc-feel"><p class="field-label">How did today actually feel?</p>
      <div class="seg" role="group" aria-label="How today felt">${DC().FEEL.map(([n, l]) =>
        `<button class="chip" data-dc-feel="${n}" aria-pressed="${cur === n}">${l}</button>`).join("")}</div></div>`;
  }

  function renderDaycycleCard() {
    const el = $("#daycycle-card");
    if (!el) return;
    if (!DC()) { el.innerHTML = ""; return; }
    if (!state.daycycle.on) {
      el.innerHTML = state.daycycle.introSeen ? "" : `<div class="card dc-card dc-intro">
        <p class="eyebrow">New · Daycycle</p>
        <h2>Plan your day by your cycles</h2>
        <p class="muted">Three natural rhythms from your birth date (physical, emotional and intellectual), with a practice suggested for each part of your day. Optional, and it stays on this device.</p>
        <div class="dc-fields">
          <label class="field"><span class="field-label">Birth date</span><input type="date" id="dc-intro-dob" max="${todayKey()}"></label>
          <label class="field"><span class="field-label">Usual wake time</span><input type="time" id="dc-intro-wake" value="${esc(state.daycycle.wake || "07:00")}"></label>
          <label class="field"><span class="field-label">Usual bedtime</span><input type="time" id="dc-intro-sleep" value="${esc(state.daycycle.sleep || "22:30")}"></label>
        </div>
        <div class="btn-row" style="margin-top:14px;align-items:center"><button class="btn btn-primary" data-dc-intro="on">Turn on Daycycle</button>
          <button class="link-btn" data-dc-intro="skip">Not now</button></div></div>`;
      return;
    }
    if (!dcDob()) {
      el.innerHTML = `<div class="card dc-card dc-empty"><p class="eyebrow">Daycycle</p>
        <p>Add your birth date to see today's cycles and a plan for the day.</p>
        <button class="btn" data-dc-setup>Add birth date</button></div>`;
      return;
    }
    const d = dcToday(), act = d.act, tom = DC().tomorrow(d.t);
    const evening = new Date().getHours() >= 17 || state.daycycle.feel[todayKey()];
    el.innerHTML = `<div class="card dc-card">
      <p class="eyebrow">Daycycle</p>
      <h2>${esc(d.head.h)}</h2>
      <p class="dc-lead">${esc(d.sum.lead)}</p>
      <div class="dc-reads">${d.read.map((r) => dcMeter(r)).join("")}</div>
      ${d.phase ? `<p class="dc-phase">${esc(DC().PHASE[d.phase])}</p>` : ""}
      ${act ? `<p class="field-label" style="margin:14px 0 6px">Suggested for today</p>${dcActBtn(act, true)}` : ""}
      ${tom ? `<p class="dc-tomorrow"><span aria-hidden="true">◦</span> Tomorrow: ${esc(tom)}</p>` : ""}
      ${evening ? dcFeelHTML() : ""}
      <button class="link-btn dc-open" data-dc-open>Read my day</button></div>`;
  }

  async function openDaycycle() {
    try { await ensureGuide(); } catch (_) {} // some suggestions open Guide practices
    renderDaycycleBody();
    if ($("#daycycle").hidden) openOverlay($("#daycycle"), closeDaycycle);
  }
  function closeDaycycle() { closeOverlay($("#daycycle")); }
  function renderDaycycleBody() {
    const d = dcToday(), wake = state.daycycle.wake || "07:00", sleep = state.daycycle.sleep || "22:30";
    const timed = dcTimes(d.blocks), open = !!state.daycycle.planOpen;
    const vRefs = scriptureOn() ? DC_VERSES[d.sum.theme] : null;
    const vRef = vRefs ? vRefs[d.t % vRefs.length] : null;
    const up = DC().upcoming(dcDob(), todayKey(), 30, 8);
    const m = DC().match(dcDob(), state.daycycle.feel);
    const fmtD = (k) => parseKey(k).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    $("#daycycle-body").innerHTML = `
      <p class="eyebrow">${fmtLongDate(new Date())}</p>
      <h3 class="dc-head">${esc(d.head.h)}</h3>
      <div class="dc-reads big">${d.read.map((r) => dcMeter(r, true)).join("")}</div>

      <h4 class="dc-sec">Your day in brief</h4>
      <div class="dc-summary">${d.sum.paras.filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      ${d.act ? dcActBtn(d.act, true) : ""}
      ${vRef ? verseHTML(vRef) : ""}

      <button class="dc-plan-toggle" data-dc-plan aria-expanded="${open}" aria-controls="dc-plan">
        <span><span class="dc-sec" style="margin:0">Plan by the hour</span>
        <span class="muted small">${fmtClock(wake)} to ${fmtClock(sleep)}. For days you'd like more structure.</span></span>
        <span class="g-chev" aria-hidden="true">⌄</span></button>
      <div id="dc-plan" ${open ? "" : "hidden"}>
        <ol class="dc-plan">${timed.map((b) => `<li style="--c:${DC_COLOR[b.k]}">
          <span class="dc-when">${fmtClock(fromMin(b.min))}</span><strong class="dc-what">${esc(b.what)}</strong>
          <p>${esc(b.txt)}</p>${dcActBtn(dcAction(b.act))}</li>`).join("")}</ol>
        <p class="hint">Timed from your wake and sleep times, which you can change in Settings.</p>
      </div>

      ${dcFeelHTML()}

      <h4 class="dc-sec">Fifteen days either side</h4>
      <div class="dc-chart">${dcChart(d.t)}
        <div class="dc-legend">${DC().CYCLES.map((c) => `<span style="--c:${DC_COLOR[c.k]}">${c.n} · ${c.p}d</span>`).join("")}</div></div>

      <h4 class="dc-sec">Coming up</h4>
      ${up.length ? `<dl class="dc-up">${up.map((r) => `<div><dt>${fmtD(r.date)}</dt><dd>${esc(r.events.join(" · "))}</dd></div>`).join("")}</dl>` : `<p class="muted">No turning points in the next 30 days.</p>`}

      <h4 class="dc-sec">Does it match you?</h4>
      ${m.ready ? `<p>${esc(m.verdict)}</p>
        <p class="muted small">Based on ${m.n} evening check-ins. ${m.cycles[0].r >= 0.2 ? `${m.cycles[0].n} follows you most closely.` : "No single cycle stands out."}</p>`
      : `<p class="muted">Rate how each day felt in the evening. After ${m.need} check-ins, Sovereign shows how closely the cycles match your real days.</p>
        <div class="progress" role="progressbar" aria-label="Check-ins so far" aria-valuemin="0" aria-valuemax="${m.need}" aria-valuenow="${m.n}"><span class="progress-fill" style="width:${Math.round(m.n / m.need * 100)}%"></span></div>
        <p class="progress-caption">${m.n} of ${m.need} days</p>`}

      <p class="dc-disclaimer">${esc(DC().DISCLAIMER)}</p>`;
  }
  function dcChart(t0) {
    const W = 360, H = 190, L = 30, R = 6, T = 10, B = 24, N = 15;
    const x = (i) => L + ((i + N) * (W - L - R)) / (2 * N), y = (v) => T + ((1 - v) / 2) * (H - T - B);
    let g = `<g class="dc-axis">`;
    [1, 0, -1].forEach((v) => { g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="${v === 0 ? "zero" : ""}"/><text x="${L - 5}" y="${y(v) + 3}" text-anchor="end">${v > 0 ? "+100" : v < 0 ? "−100" : "0"}</text>`; });
    for (let i = -N; i <= N; i += 5) g += `<text x="${x(i)}" y="${H - 7}" text-anchor="middle">${i === 0 ? "today" : (i > 0 ? "+" : "−") + Math.abs(i)}</text>`;
    g += `</g><line class="dc-today" x1="${x(0)}" x2="${x(0)}" y1="${T}" y2="${H - B}"/>`;
    DC().CYCLES.forEach((c) => {
      let dpath = "";
      for (let s = -N * 4; s <= N * 4; s++) { const i = s / 4; dpath += (s === -N * 4 ? "M" : "L") + x(i).toFixed(1) + "," + y(DC().val(t0 + i, c.p)).toFixed(1); }
      g += `<path d="${dpath}" style="stroke:${DC_COLOR[c.k]}"/><circle cx="${x(0)}" cy="${y(DC().val(t0, c.p)).toFixed(1)}" r="3.5" style="fill:${DC_COLOR[c.k]}"/>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Wave chart of the three cycles, fifteen days before and after today">${g}</svg>`;
  }

  /** Lines for the daily reminder, kept only while notifications show details. */
  function refreshBriefs() {
    const out = {};
    if (dcReady() && state.settings.discreet === false && !secOn()) {
      for (let i = 0; i < 8; i++) {
        const k = dateKey(addDays(new Date(), i)), t = dcT(k);
        const act = dcAction(DC().keyBlock(t, DC().plan(t, { phase: i === 0 ? dcPhase() : null })).act);
        out[k] = DC().brief(t) + (act ? `. Suggested: ${act.label}` : "");
      }
    }
    const changed = JSON.stringify(out) !== JSON.stringify(state.daycycle.briefs || {});
    state.daycycle.briefs = out;
    return changed;
  }
  function dailyReminderBody(key) {
    if (state.settings.discreet !== false) return "A gentle reminder from Sovereign.";
    const b = state.daycycle.on && state.daycycle.briefs?.[key];
    return b ? `${b}.` : "Your practice time has arrived. Five minutes is enough to begin.";
  }
  async function setDob(v) {
    if (v && (v > todayKey() || v < "1900-01-01")) { toast("Please enter a real birth date."); return; }
    if (secOn() && KEY) {
      DOB_PLAIN = v || "";
      state.daycycle.dobEnc = v ? await SovSecure.encryptText(KEY, v) : null;
      state.daycycle.dob = "";
    } else state.daycycle.dob = v || "";
    refreshBriefs(); save();
    toast(v ? "Birth date saved on this device" : "Birth date removed");
  }
  function daycycleSettingsHTML(seg) {
    const on = !!state.daycycle.on;
    return `<div class="setting-group"><h3>Daycycle</h3>
      ${seg("daycycle", [["on", "On"], ["off", "Off"]], on ? "on" : "off")}
      ${on ? `<div class="dc-fields">
        <label class="field"><span class="field-label">Birth date</span><input type="date" id="set-dc-dob" max="${todayKey()}" value="${esc(dcDob())}"></label>
        <label class="field"><span class="field-label">Usual wake time</span><input type="time" id="set-dc-wake" value="${esc(state.daycycle.wake || "07:00")}"></label>
        <label class="field"><span class="field-label">Usual bedtime</span><input type="time" id="set-dc-sleep" value="${esc(state.daycycle.sleep || "22:30")}"></label></div>` : ""}
      <p class="hint" style="margin-top:10px">An optional way to plan your day with three classic biorhythm cycles (physical, emotional and intellectual) from your birth date, each matched to a Sovereign practice.
        Your birth date stays on this device${secOn() ? " and is encrypted with your passcode" : " and is encrypted when App lock is on"}. When reminder notifications show details, your daily reminder carries the day's brief.
        Biorhythms aren't scientifically proven, so an evening check-in shows how well it matches you.</p></div>`;
  }

  function bindDaycycle() {
    const handler = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const inSheet = !$("#daycycle").hidden;
      const leave = () => { if (inSheet) closeDaycycle(); };
      if (b.hasAttribute("data-dc-open")) openDaycycle();
      else if (b.dataset.dcIntro === "skip") { state.daycycle.introSeen = true; save(); renderDaycycleCard(); toast("You can turn on Daycycle any time in Settings."); }
      else if (b.dataset.dcIntro === "on") {
        const v = $("#dc-intro-dob").value;
        if (!v || v > todayKey() || v < "1900-01-01") { toast("Enter your birth date first."); $("#dc-intro-dob").focus(); return; }
        state.daycycle.on = true; state.daycycle.introSeen = true; state.daycycle.wake = $("#dc-intro-wake").value || "07:00"; state.daycycle.sleep = $("#dc-intro-sleep").value || "22:30";
        setDob(v).then(() => { renderDaycycleCard(); toast("Daycycle is on"); $("#daycycle-card [data-dc-open]")?.focus(); });
      }
      else if (b.hasAttribute("data-dc-setup")) { openSettings(); setTimeout(() => $("#set-dc-dob")?.focus(), 60); }
      else if (b.dataset.dcStart) { leave(); startTimer(b.dataset.dcStart); }
      else if (b.dataset.dcPacer) { leave(); openPacer(b.dataset.dcPacer); }
      else if (b.dataset.dcSound) { leave(); openSoundPlayer(b.dataset.dcSound); }
      else if (b.dataset.dcLesson) { leave(); go("library"); openLesson(b.dataset.dcLesson); }
      else if (b.hasAttribute("data-dc-journal")) { leave(); go("journal"); }
      else if (b.dataset.dcGuide) { leave(); go("guide"); openGuideItem(b.dataset.dcGuide); }
      else if (b.hasAttribute("data-dc-plan")) {
        state.daycycle.planOpen = !state.daycycle.planOpen; save();
        $("#dc-plan").hidden = !state.daycycle.planOpen; b.setAttribute("aria-expanded", state.daycycle.planOpen);
      }
      else if (b.dataset.dcFeel) {
        const n = Number(b.dataset.dcFeel), k = todayKey();
        if (state.daycycle.feel[k] === n) delete state.daycycle.feel[k]; else state.daycycle.feel[k] = n;
        save(); renderDaycycleCard();
        if (inSheet) renderDaycycleBody();
        const sel = `[data-dc-feel="${n}"]`; const f = inSheet ? $(`#daycycle ${sel}`) : $(`#daycycle-card ${sel}`); f && f.focus();
        if (state.daycycle.feel[k]) toast("Noted. Thank you for checking in.");
      }
    };
    $("#daycycle-card").addEventListener("click", handler);
    $("#daycycle-body").addEventListener("click", handler);
    $("#close-daycycle").addEventListener("click", closeDaycycle);
    $("#daycycle").addEventListener("click", (e) => { if (e.target.id === "daycycle") closeDaycycle(); });
  }

  /* ========================================================================
     9f. 40-DAY ENERGY TRACKER — built in
     The printable's tracker in the app's own screens. Entries are stored in
     the Library's database under the printable's field names, so the built-in
     tracker and the PDF show the same entries, and backups carry them. Where
     the tracker overlaps with Home (practice minutes, held/released, cycle
     phase), the two stay in step.
     ======================================================================== */
  const TR = () => C.TRACKER;
  const trEd = () => (state.profile.track === "women" ? "women" : "men");
  const trId = () => `tracker-${trEd()}`;
  const pad2 = (n) => String(n).padStart(2, "0");
  const TRK = { entry: null, view: "overview", day: 1, review: null, timer: null };
  const TR_PRACTICES = [["grounding", "Grounding"], ["breath", "Breath"], ["meditation", "Meditation"]];
  const RATE = ["1", "2", "3", "4", "5"];

  async function readLibEntry(id) {
    const db = await libDb(); if (!db) return null;
    return new Promise((res) => {
      try { const g = db.transaction("entries").objectStore("entries").get(id); g.onsuccess = () => { db.close(); res(g.result || null); }; g.onerror = () => { db.close(); res(null); }; }
      catch (_) { db.close(); res(null); }
    });
  }
  async function writeLibEntry(id, entry) {
    const db = await libDb(); if (!db) return;
    await new Promise((res) => { const tx = db.transaction("entries", "readwrite"); tx.objectStore("entries").put(entry, id); tx.oncomplete = tx.onerror = () => { db.close(); res(); }; });
  }
  const TV = () => (TRK.entry.values = TRK.entry.values || {});
  const tGet = (name) => TV()[`${name}#0`]?.value;
  const tRadio = (name, opts) => { const i = opts.findIndex((_, k) => TV()[`${name}#${k}`]?.value === true); return i < 0 ? null : opts[i]; };
  function tSet(name, v) { TV()[`${name}#0`] = { value: v }; trQueue(); }
  function tSetRadio(name, opts, val) { opts.forEach((o, k) => { TV()[`${name}#${k}`] = { value: o === val }; }); trQueue(); }
  function trQueue() { clearTimeout(TRK.timer); TRK.timer = setTimeout(trFlush, 400); const s = $("#tr-status"); if (s) s.textContent = "Saving…"; }
  async function trFlush() {
    clearTimeout(TRK.timer);
    if (!TRK.entry) return;
    TRK.entry.updatedAt = new Date().toISOString();
    await libPut(trId(), TRK.entry);
    const s = $("#tr-status"); if (s) s.textContent = "Saved on this device";
  }

  const trStart = () => state.tracker?.start || "";
  const trDate = (n) => dateKey(addDays(parseKey(trStart()), n - 1));
  const trTodayN = () => Math.min(40, Math.max(1, daysBetween(trStart(), todayKey()) + 1));
  const trShortDate = (k) => parseKey(k).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  /** Reading order: days with a review after each week, then the Day 40 review. */
  const TR_SEQ = (() => { const s = []; for (let n = 1; n <= 40; n++) { s.push({ t: "day", n }); if (n % 7 === 0 && n <= 35) s.push({ t: "review", k: n / 7 }); } s.push({ t: "review", k: "final" }); return s; })();
  const dayHasEntry = (n) => { const p = `d${pad2(n)}_`; return Object.entries(TV()).some(([k, v]) => k.startsWith(p) && !k.startsWith(`${p}date`) && v && v.value && v.value !== ""); };
  const reviewHasEntry = (k) => { const p = k === "final" ? "final_" : `week${k}_`; return Object.entries(TV()).some(([key, v]) => key.startsWith(p) && v && v.value && v.value !== ""); };

  /** Home → tracker: bring in what was already logged on Home for that date. */
  function trPullFromHome(n) {
    const k = trDate(n);
    if (k > todayKey()) return;
    const rec = state.days[k]?.practices || {}, d = `d${pad2(n)}`;
    let changed = false;
    TR_PRACTICES.forEach(([id]) => {
      const p = rec[id];
      if (p?.done && !tGet(`${d}_${id}`)) { TV()[`${d}_${id}#0`] = { value: true }; changed = true; }
      if (p?.min && !tGet(`${d}_${id}_min`)) { TV()[`${d}_${id}_min#0`] = { value: String(p.min) }; changed = true; }
    });
    if (trEd() === "men" && rec.retention?.status && !tRadio(`${d}_retention`, ["held", "released"])) { ["held", "released"].forEach((o, i) => (TV()[`${d}_retention#${i}`] = { value: o === rec.retention.status })); changed = true; }
    if (trEd() === "women" && rec.cycle?.phase && !tRadio(`${d}_cycle`, TR().phases.map((x) => x[0]))) { TR().phases.forEach(([o], i) => (TV()[`${d}_cycle#${i}`] = { value: o === rec.cycle.phase })); changed = true; }
    if (!tGet(`${d}_date`)) { TV()[`${d}_date#0`] = { value: trShortDate(k) }; changed = true; }
    if (changed) trQueue();
  }
  /** Tracker → Home: keep Home's checklist in step for that date (never for future days). */
  function trPushToHome(n, what, val) {
    const k = trDate(n);
    if (k > todayKey()) return;
    const rec = day(k, true);
    if (what === "retention") rec.practices.retention = val ? { status: val, count: val === "released" ? 0 : suggestRetentionCount(k) } : undefined;
    else if (what === "cycle") rec.practices.cycle = val ? { phase: val } : undefined;
    else {
      const p = rec.practices[what] || (rec.practices[what] = { done: false, min: 0 });
      if (typeof val === "boolean") p.done = val; else { p.min = Math.max(0, Math.min(600, Math.round(Number(val) || 0))); if (p.min > 0) p.done = true; }
    }
    Object.keys(rec.practices).forEach((x) => rec.practices[x] === undefined && delete rec.practices[x]);
    save();
  }

  async function openTracker(target) {
    if (!TR()) return;
    TRK.entry = (await libGet(trId())) || { values: {}, page: 1 };
    if (!state.tracker?.ack) TRK.view = "intro";
    else if (!trStart()) TRK.view = "start";
    else if (target === "today") { TRK.view = "day"; TRK.day = trTodayN(); }
    else if (!TRK.view || TRK.view === "start") TRK.view = "overview";
    $("#journey-title").textContent = "40-Day Tracker";
    renderTracker();
    if ($("#journey").hidden) openOverlay($("#journey"), closeTracker);
  }
  async function closeTracker() {
    await trFlush();
    closeOverlay($("#journey"));
    if (currentView === "home") renderHome();
    if (currentView === "library") renderPrintablesShelf();
  }
  function trGo(view, opts = {}) {
    Object.assign(TRK, { view }, opts);
    renderTracker();
    $("#journey .sheet-inner").scrollTop = 0;
    setTimeout(() => $("#journey-body h3, #journey-body .tr-num")?.focus?.(), 30);
  }
  function renderTracker() {
    const b = $("#journey-body");
    if (TRK.view === "intro") b.innerHTML = trIntroHTML();
    else if (TRK.view === "start") b.innerHTML = trStartHTML();
    else if (TRK.view === "day") { trPullFromHome(TRK.day); b.innerHTML = trDayHTML(TRK.day); }
    else if (TRK.view === "review") b.innerHTML = trReviewHTML(TRK.review);
    else b.innerHTML = trOverviewHTML();
  }

  const trDots = (name, opts, labels, cur, aria) => `<div class="tr-dots" role="radiogroup" aria-label="${esc(aria)}">${opts.map((o, i) =>
    `<button class="tr-dot" role="radio" aria-checked="${cur === o}" data-tr-radio="${name}" data-opts="${opts.join(",")}" data-val="${o}" aria-label="${esc(labels ? labels[i] : o)}">${esc(labels ? labels[i] : o)}</button>`).join("")}</div>`;
  const trChips = (name, opts, labels, cur, aria) => `<div class="seg tr-seg" role="radiogroup" aria-label="${esc(aria)}">${opts.map((o, i) =>
    `<button class="chip" role="radio" aria-checked="${cur === o}" aria-pressed="${cur === o}" data-tr-radio="${name}" data-opts="${opts.join(",")}" data-val="${o}">${esc(labels[i])}</button>`).join("")}</div>`;
  const trText = (name, label, rows = 3, hint = "") => `<label class="field tr-field"><span class="field-label">${label}</span>
    <textarea data-tr-text="${name}" rows="${rows}" placeholder="${esc(hint)}">${esc(tGet(name) || "")}</textarea></label>`;
  const trFoot = () => `<p class="tr-status muted small" id="tr-status" aria-live="polite">Saved on this device</p>`;

  const TR_SIGIL = `<svg class="tr-sigil" viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="0.1 5.4" stroke-linecap="round"/>
    <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" stroke-width="1"/>
    <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" stroke-width=".6" opacity=".7"/>
    <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" stroke-width=".9"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => { const a = (i / 7) * Math.PI * 2 - Math.PI / 2 + 0.45; return `<circle cx="${(100 + 60 * Math.cos(a)).toFixed(1)}" cy="${(100 + 60 * Math.sin(a)).toFixed(1)}" r="2.2" fill="currentColor"/>`; }).join("")}
    <path d="M58 100 Q100 66 142 100 Q100 134 58 100 Z" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="100" cy="100" r="11" fill="none" stroke="currentColor" stroke-width="1"/>
    <circle cx="100" cy="100" r="6" fill="currentColor"/></svg>`;

  /** The tracker's opening pages: cover and "How to use this tracker". Must be acknowledged once. */
  function trIntroHTML() {
    const T = TR(), ed = trEd();
    const [before, choice] = T.before[ed].split(/ (?=(?:Retention|Cycle awareness) is a personal choice)/);
    return `<div class="tr-cover">
        <p class="tr-edition">${ed === "men" ? "Men’s" : "Women’s"} Edition</p>
        ${TR_SIGIL}
        <p class="tr-wordmark">SOVEREIGN</p>
        <span class="tr-rule" aria-hidden="true"></span>
        <p class="tr-subtitle">${esc(T.title)}</p>
        <p class="tr-cover-tag">${esc(T.tagline)}</p>
        <p class="tr-series">Pupil Club · Sovereign Series</p>
      </div>
      <p class="eyebrow" style="margin-top:28px">Begin here</p>
      <h3 class="tr-h" tabindex="-1">How to use this tracker</h3>
      ${T.intro[ed].map((p) => `<p>${esc(p)}</p>`).join("")}
      <p><strong>Before you begin.</strong> ${esc(before.replace(/^This/, "this").replace(/^this/, "This"))}</p>
      ${choice ? `<p>${esc(choice)}</p>` : ""}
      <div class="tr-yourway">
        <p class="tr-label">Use it your way</p>
        <p><strong>In the app</strong><br>One day per page. Tap a dot to rate, tick what you practised, and write as much or as little as you like. Everything saves on this device as you go.</p>
        <p><strong>On paper or a tablet</strong><br>Open “View as printable” from the tracker to see the original pages, with your entries already filled in. Save a copy to print or use in GoodNotes, Notability, Xodo or Adobe.</p>
        <p><strong>Getting around</strong><br>“All 40 days” shows every day and each weekly review. Home shows today’s prompt once you begin.</p>
      </div>
      <label class="check-row tr-ack"><input type="checkbox" id="tr-ack"${state.tracker?.ack ? " checked" : ""}>
        <span>I understand. This is a reflective practice, not medical or psychological advice, and I will stop any practice that makes me feel unwell.</span></label>
      <button class="btn btn-primary btn-block btn-cta" data-tr-ack ${state.tracker?.ack ? "" : "disabled"}>Continue</button>`;
  }

  function trStartHTML() {
    const T = TR(), ed = trEd();
    return `<p class="eyebrow">${ed === "men" ? "Men’s" : "Women’s"} Edition · Sovereign Series</p>
      <h3 class="tr-h">${esc(T.title)}</h3>
      <p class="tr-tagline">${esc(T.tagline)}</p>
      <div class="card tr-commit">
        <p class="eyebrow">My commitment</p>
        <p class="tr-commit-line">${esc(T.commitment)}</p>
        <label class="field"><span class="field-label">Name</span><input type="text" data-tr-text="commit_name" value="${esc(tGet("commit_name") || state.profile.name)}" maxlength="60"></label>
        <label class="field"><span class="field-label">I begin on</span><input type="date" id="tr-start" value="${esc(trStart() || todayKey())}" max="${todayKey()}"></label>
        ${trText("commit_intention", "I am directing this energy toward", 3)}
        <label class="field"><span class="field-label">Signed</span><input type="text" data-tr-text="commit_sign" value="${esc(tGet("commit_sign") || "")}" maxlength="60" placeholder="Type your name to sign"></label>
        <button class="btn btn-primary btn-block" data-tr-begin>${trStart() ? "Save" : "Begin the forty days"}</button>
      </div>
      <p class="hint">Started on paper already? Set the date you began, and the days line up.</p>`;
  }

  function trOverviewHTML() {
    const T = TR(), now = trTodayN(), started = trStart() <= todayKey();
    const done = Array.from({ length: 40 }, (_, i) => dayHasEntry(i + 1)).filter(Boolean).length;
    const cell = (n) => {
      const k = trDate(n), fut = k > todayKey(), has = dayHasEntry(n);
      return `<button class="tr-cell ${has ? "has" : ""} ${n === now && started ? "now" : ""} ${fut ? "future" : !has ? "missed" : ""}" data-tr-day="${n}"
        aria-label="Day ${n}, ${trShortDate(k)}${has ? ", filled in" : fut ? ", ahead" : ""}">${n}</button>`;
    };
    const rev = (k, label) => `<button class="tr-cell rev ${reviewHasEntry(k) ? "has" : ""}" data-tr-review="${k}" aria-label="${esc(label)}">${k === "final" ? "40" : "R"}</button>`;
    const rows = T.weeks.map((w) => `<div class="tr-row"><span class="tr-rowlabel">Week ${w.n}</span><div class="tr-cells">${Array.from({ length: 7 }, (_, i) => cell(w.from + i)).join("")}${rev(w.n, w.name)}</div></div>`).join("") +
      `<div class="tr-row"><span class="tr-rowlabel">Final</span><div class="tr-cells">${[36, 37, 38, 39, 40].map(cell).join("")}${rev("final", T.final.name)}</div></div>`;
    return `<p class="eyebrow">${trEd() === "men" ? "Men’s" : "Women’s"} Edition · began ${esc(trShortDate(trStart()))}</p>
      <h3 class="tr-h">${started ? `Day ${now} of 40` : "Begins soon"}</h3>
      <div class="progress" role="progressbar" aria-label="Days filled in" aria-valuemin="0" aria-valuemax="40" aria-valuenow="${done}"><span class="progress-fill" style="width:${done / 40 * 100}%"></span></div>
      <p class="progress-caption">${done} of 40 days filled in</p>
      ${started ? `<button class="btn btn-primary btn-block" data-tr-day="${now}">Open today’s page</button>` : ""}
      <div class="tr-grid">${rows}</div>
      <p class="hint tr-legend"><span class="tr-key has"></span> filled in <span class="tr-key now"></span> today <span class="tr-key rev">R</span> weekly review</p>
      <div class="btn-row tr-links">
        <button class="btn" data-tr-intro>Introduction</button>
        <button class="btn" data-tr-commit>My commitment</button>
        <button class="btn" data-tr-printable>View as printable</button>
        <button class="link-btn tr-reset" data-tr-reset>Start over</button>
      </div>`;
  }

  function trNavHTML(i) {
    const prev = TR_SEQ[i - 1], next = TR_SEQ[i + 1];
    const lab = (x) => x.t === "day" ? `Day ${x.n}` : x.k === "final" ? "Day 40 Review" : `Week ${x.k} Review`;
    const attr = (x) => x.t === "day" ? `data-tr-day="${x.n}"` : `data-tr-review="${x.k}"`;
    return `<div class="tr-nav">${prev ? `<button class="btn" ${attr(prev)} aria-label="Previous: ${lab(prev)}">‹ ${lab(prev)}</button>` : "<span></span>"}
      <button class="link-btn" data-tr-overview>All 40 days</button>
      ${next ? `<button class="btn" ${attr(next)} aria-label="Next: ${lab(next)}">${lab(next)} ›</button>` : "<span></span>"}</div>`;
  }

  function trDayHTML(n) {
    const T = TR(), ed = trEd(), d = `d${pad2(n)}`, k = trDate(n), fut = k > todayKey();
    const idx = TR_SEQ.findIndex((x) => x.t === "day" && x.n === n);
    const prac = TR_PRACTICES.map(([id, label]) => `<div class="tr-prac">
        <button class="tr-check" role="checkbox" aria-checked="${!!tGet(`${d}_${id}`)}" data-tr-check="${d}_${id}" data-home="${id}">${CHECK_SVG}<span>${label}</span></button>
        <label class="tr-min"><input type="number" inputmode="numeric" min="0" max="600" data-tr-text="${d}_${id}_min" data-home-min="${id}" value="${esc(tGet(`${d}_${id}_min`) || "")}" placeholder="0" aria-label="${label} minutes"><span class="muted small">min</span></label></div>`).join("") +
      `<div class="tr-prac"><button class="tr-check" role="checkbox" aria-checked="${!!tGet(`${d}_movement`)}" data-tr-check="${d}_movement">${CHECK_SVG}<span>Movement</span></button></div>`;
    const mudra = christian() ? "" : `<div class="tr-sec"><p class="tr-label">Mudra <button class="link-btn tr-what" data-tr-hand>What’s this?</button></p>
      <div class="seg tr-seg">${T.mudras.map(([id, g, name]) => `<button class="chip tr-mudra" aria-pressed="${!!tGet(`${d}_mudra_${id}`)}" data-tr-check="${d}_mudra_${id}"><span aria-hidden="true">${g}</span> ${name}</button>`).join("")}</div></div>`;
    const check = ed === "men"
      ? `${trChips(`${d}_retention`, ["held", "released"], ["Held", "Released"], tRadio(`${d}_retention`, ["held", "released"]), "Held or released")}
         <p class="tr-label" style="margin-top:14px">Urge strength</p>${trDots(`${d}_urge`, RATE, null, tRadio(`${d}_urge`, RATE), "Urge strength, 1 to 5")}`
      : trChips(`${d}_cycle`, T.phases.map((x) => x[0]), T.phases.map((x) => x[1]), tRadio(`${d}_cycle`, T.phases.map((x) => x[0])), "Cycle phase");
    const week = T.weeks.find((w) => n >= w.from && n <= w.to);
    return `<div class="tr-dayhead"><span class="tr-num" tabindex="-1">${pad2(n)}</span>
        <span><span class="eyebrow" style="display:block;margin:0">Day ${n} of 40${week ? ` · Week ${week.n}` : ""}</span><span class="tr-date">${esc(fmtLongDate(parseKey(k)))}</span></span></div>
      ${fut ? `<p class="hint">This day is still ahead. You can read its prompt now and fill it in on the day.</p>` : ""}
      <blockquote class="tr-prompt">${esc(T.prompts[ed][n - 1])}</blockquote>
      <fieldset class="tr-body" ${fut ? "disabled" : ""}>
        <div class="tr-sec"><p class="tr-label">Energy today</p>${trDots(`${d}_energy`, RATE, null, tRadio(`${d}_energy`, RATE), "Energy today, 1 to 5")}</div>
        <div class="tr-sec"><p class="tr-label">Practices</p>${prac}</div>
        ${mudra}
        <div class="tr-sec"><p class="tr-label">Check-in</p>${check}</div>
        ${trText(`${d}_directed`, "Where I directed the energy", 3)}
        ${trText(`${d}_journal`, esc(T.prompts[ed][n - 1]), 5, "Write freely")}
      </fieldset>
      ${trFoot()}${trNavHTML(idx)}`;
  }

  function trReviewHTML(k) {
    const T = TR(), ed = trEd(), fin = k === "final", w = fin ? null : T.weeks[k - 1];
    const p = fin ? "final" : `week${k}`, qs = fin ? T.final.questions : T.reviewQ[ed];
    const idx = TR_SEQ.findIndex((x) => x.t === "review" && String(x.k) === String(k));
    return `<p class="eyebrow">${fin ? "Forty days" : `Days ${w.from}–${w.to}`}</p>
      <h3 class="tr-h" tabindex="-1">${esc(fin ? T.final.name : w.name)}</h3>
      ${w?.title ? `<div class="tr-milestone"><p class="tr-mtitle">${esc(w.title)}</p><p>${esc(w.text)}</p></div>` : ""}
      <div class="tr-sec"><p class="tr-label">${fin ? "Overall" : "My week, overall"}</p>${trDots(`${p}_overall`, RATE, null, tRadio(`${p}_overall`, RATE), "Overall, 1 to 5")}</div>
      ${qs.map((q, i) => trText(`${p}_q${i + 1}`, esc(q), 4)).join("")}
      ${fin ? `<div class="card tr-closing"><p class="eyebrow">${esc(T.final.closingTitle)}</p><p>${esc(T.final.closing)}</p><p class="tr-quote">${esc(T.final.quote)}</p></div>` : ""}
      ${trFoot()}${trNavHTML(idx)}`;
  }

  function trCurrentDayOf(el) { const m = el.closest("[data-tr-text], [data-tr-check], [data-tr-radio]"); const name = m && (m.dataset.trText || m.dataset.trCheck || m.dataset.trRadio) || ""; const x = name.match(/^d(\d\d)_/); return x ? Number(x[1]) : null; }

  function bindTracker() {
    const body = $("#journey-body");
    $("#close-journey").addEventListener("click", closeTracker);
    $("#journey").addEventListener("click", (e) => { if (e.target.id === "journey") closeTracker(); });
    body.addEventListener("click", async (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.trDay) return trGo("day", { day: Number(b.dataset.trDay) });
      if (b.dataset.trReview) return trGo("review", { review: b.dataset.trReview === "final" ? "final" : Number(b.dataset.trReview) });
      if (b.hasAttribute("data-tr-overview")) return trGo("overview");
      if (b.hasAttribute("data-tr-commit")) return trGo("start");
      if (b.hasAttribute("data-tr-intro")) return trGo("intro");
      if (b.hasAttribute("data-tr-ack")) {
        if (!$("#tr-ack").checked) return;
        state.tracker = { ...(state.tracker || {}), ack: state.tracker?.ack || new Date().toISOString() }; save();
        return trGo(trStart() ? "overview" : "start");
      }
      if (b.hasAttribute("data-tr-printable")) { await trFlush(); closeOverlay($("#journey")); return openPrintables(trId()); }
      if (b.hasAttribute("data-tr-hand")) { await trFlush(); closeOverlay($("#journey")); go("guide"); return ensureGuide().then(() => openGuideItem("hand-overview")); }
      if (b.hasAttribute("data-tr-begin")) {
        const start = $("#tr-start").value || todayKey();
        if (start > todayKey()) { toast("Choose today or a day in the past."); return; }
        const first = !trStart();
        state.tracker = { ...(state.tracker || {}), start, edition: trEd() }; save();
        tSet("commit_start", fmtLongDate(parseKey(start)));
        const nm = body.querySelector('[data-tr-text="commit_name"]')?.value.trim(); if (nm && !tGet("commit_name")) tSet("commit_name", nm);
        await trFlush();
        toast(first ? "Day one begins. Go gently." : "Commitment saved");
        return first ? trGo("day", { day: trTodayN() }) : trGo("overview");
      }
      if (b.hasAttribute("data-tr-reset")) {
        const v = await dialog({ title: "Start the forty days over?", html: "<p>This clears every entry in your tracker, in the app and in the printable. Your Home practice history stays.</p>",
          actions: [{ label: "Cancel", value: "no" }, { label: "Clear and start over", value: "yes", danger: true }] });
        if (v !== "yes") return;
        TRK.entry = { values: {}, page: 1 }; await libPut(trId(), TRK.entry);
        state.tracker = state.tracker?.ack ? { ack: state.tracker.ack } : null; save();
        toast("Cleared. Begin again whenever you're ready."); return trGo("start");
      }
      if (b.dataset.trRadio) {
        const name = b.dataset.trRadio, opts = b.dataset.opts.split(","), val = b.getAttribute("aria-checked") === "true" ? null : b.dataset.val;
        tSetRadio(name, opts, val);
        b.parentElement.querySelectorAll("[data-tr-radio]").forEach((x) => { const on = x.dataset.val === val; x.setAttribute("aria-checked", on); if (x.classList.contains("chip")) x.setAttribute("aria-pressed", on); });
        const n = trCurrentDayOf(b);
        if (n && /_retention$/.test(name)) trPushToHome(n, "retention", val);
        if (n && /_cycle$/.test(name)) trPushToHome(n, "cycle", val);
        return;
      }
      if (b.dataset.trCheck) {
        const name = b.dataset.trCheck, on = !tGet(name);
        tSet(name, on);
        b.setAttribute(b.classList.contains("chip") ? "aria-pressed" : "aria-checked", on);
        if (b.dataset.home) trPushToHome(trCurrentDayOf(b), b.dataset.home, on);
      }
    });
    body.addEventListener("change", (e) => {
      if (e.target.id === "tr-ack") body.querySelector("[data-tr-ack]").disabled = !e.target.checked;
    });
    body.addEventListener("input", (e) => {
      const t = e.target.closest("[data-tr-text]"); if (!t) return;
      tSet(t.dataset.trText, t.value);
      if (t.dataset.homeMin) {
        const n = trCurrentDayOf(t), check = body.querySelector(`[data-tr-check="${t.dataset.trText.replace(/_min$/, "")}"]`);
        if (Number(t.value) > 0 && check && check.getAttribute("aria-checked") !== "true") { tSet(check.dataset.trCheck, true); check.setAttribute("aria-checked", "true"); }
        clearTimeout(t._home); t._home = setTimeout(() => trPushToHome(n, t.dataset.homeMin, t.value), 600);
      }
    });
  }
  /** Back button inside the tracker: page → overview → close. */
  function trackerBack() {
    if (state.tracker?.ack && trStart() && (TRK.view === "day" || TRK.view === "review" || TRK.view === "start" || TRK.view === "intro")) trGo("overview");
    else if (TRK.view === "start" && state.tracker?.ack && !trStart()) trGo("intro");
    else closeTracker();
  }

  function renderTrackerCard() {
    const el = $("#tracker-card");
    if (!el) return;
    if (!TR() || !trStart() || state.tracker?.edition && state.tracker.edition !== trEd()) { el.innerHTML = ""; return; }
    const n = trTodayN(), over = daysBetween(trStart(), todayKey()) >= 40;
    if (over && daysBetween(trStart(), todayKey()) > 47) { el.innerHTML = ""; return; }
    el.innerHTML = `<div class="card tr-card">
      <p class="eyebrow">${esc(TR().title)}</p>
      <h2>${over ? "Forty days complete" : `Day ${n} of 40`}</h2>
      <div class="progress" aria-hidden="true"><span class="progress-fill" style="width:${Math.min(40, n) / 40 * 100}%"></span></div>
      ${over ? `<p class="muted" style="margin:12px 0 0">Close the forty days with your Day 40 review.</p>` : `<p class="tr-card-prompt">${esc(TR().prompts[trEd()][n - 1])}</p>`}
      <div class="btn-row" style="margin-top:14px">
        <button class="btn btn-primary" data-trc="${over ? "final" : "today"}">${over ? "Day 40 review" : "Open today’s page"}</button>
        <button class="btn" data-trc="all">All 40 days</button></div></div>`;
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
  /** Look up a breath pattern; on the Christian path, other traditions' mantras become breath prayers. */
  function pacerPattern(id) {
    if (hiddenFor("pacer", id) && C.SCRIPTURE.SWAP[id]) id = C.SCRIPTURE.SWAP[id];
    return (C.SCRIPTURE && C.SCRIPTURE.PACER[id]) || (C.PACER && C.PACER[id]) || null;
  }
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
    const pat = pacerPattern(id);
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
  async function openMala(mantra, total = 108) {
    if (total === 108 && christian()) { mantra = C.SCRIPTURE.ROPE_PRAYER; total = 100; }
    const rope = total === 100;
    Object.assign(P, { mode: "mala", mala: { count: 0, total, rope, mantra: mantra || "Om Namah Shivaya", started: Date.now() } });
    $("#pacer-eyebrow").textContent = rope ? "Prayer Rope" : "Japa";
    $("#pacer-title").textContent = rope ? "100 Prayers" : "108 Repetitions";
    $("#pacer-note").textContent = rope ? "One prayer per tap, one knot of the rope. Begin aloud, then whisper, then pray silently." : "One repetition per tap. Begin aloud, then whisper, then repeat silently.";
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
    const total = P.mala.total || 108;
    $("#mala-tap").setAttribute("aria-label", `Count ${P.mala.rope ? "prayer" : "repetition"}. ${n} of ${total}.`);
    $("#mala-ring").style.strokeDashoffset = String(565.49 * (1 - n / total));
  }
  function malaTap() {
    const total = P.mala.total || 108;
    if (P.mala.count >= total) return;
    P.mala.count++;
    if (navigator.vibrate) navigator.vibrate(12);
    if (P.mala.count % (total / 4) === 0 && state.settings.pacerSound !== false) chime(432, 1.6, 0.85);
    updateMala();
    if (P.mala.count === total) setTimeout(() => finishMala(true), 400);
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
      toast(`${complete ? (P.mala.rope ? "Prayer rope complete" : "Full mala complete") : `${count} ${P.mala.rope ? "prayers" : "repetitions"}`} · ${Math.max(1, mins)} min meditation logged${fresh ? ` · +${C.POINTS.practice}` : ""}`);
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
    $("#mala-finish").addEventListener("click", () => finishMala(P.mala.count >= (P.mala.total || 108)));
    $("#mala-mantra").addEventListener("change", (e) => { P.mala.mantra = e.target.value.trim() || "Om Namah Shivaya"; });

    // Protocols tab shortcut list
    $("#protocol-list").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pacer]");
      if (!b) return;
      if (b.dataset.pacer === "mala") openMala();
      else if (b.dataset.pacer === "rope") openMala(C.SCRIPTURE.ROPE_PRAYER, 100);
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
    setTimeout(refreshMini, 0);
    if (!r.log || r.minutes < 1) return;
    const fresh = logMinutes("meditation", r.minutes);
    toast(`${r.completed ? "Session complete" : "Session ended"} · ${r.minutes} min meditation logged${fresh ? ` · +${C.POINTS.practice}` : ""}`);
    render(); checkMilestones();
  }

  /* "Now playing" card on the Sound tab. Rendered once, then a 1-second
     ticker updates only the time, so the countdown moves without the card
     being rebuilt (which would steal focus or flicker). The ticker stops by
     itself when you leave the Sound tab or the session ends. */
  let npTicker = null, npState = "";
  async function refreshNowPlaying() {
    const el = $("#now-playing");
    if (!el) { stopNowPlaying(); return; }
    const st = await sndEngine.status();
    const paused = SND.paused;
    const id = st?.presetId || paused?.preset.id;
    const key = id ? `${id}:${st ? "on" : "paused"}` : "";
    if (!id) { el.innerHTML = ""; npState = ""; stopNowPlaying(); return; }
    if (key !== npState || !el.firstElementChild) {
      const p = presetById(id);
      el.innerHTML = `<button class="card now-playing" data-sound="${id}">
        <span class="np-dot ${st ? "on" : ""}" aria-hidden="true"></span>
        <span><span class="eyebrow" style="display:block;margin:0">${st ? "Now playing" : "Paused"}</span>
        <span class="sound-name">${esc(p.name)}</span></span>
        <span class="muted small np-time"></span></button>`;
      npState = key;
    }
    const timeEl = el.querySelector(".np-time");
    if (st) {
      const left = Math.max(0, Math.ceil(st.total - st.elapsed));
      timeEl.textContent = `${fmtTime(left)} left`;
      el.firstElementChild.setAttribute("aria-label", `Now playing ${presetById(id).name}, ${Math.floor(left / 60)} minutes left. Open player.`);
      if (!npTicker) npTicker = setInterval(tickNowPlaying, 1000);
    } else {
      timeEl.textContent = paused ? `${fmtTime(Math.max(0, Math.ceil(paused.opts.minutes * 60 - paused.elapsed)))} left · tap to resume` : "Tap to resume";
      stopNowPlaying();
    }
  }
  function tickNowPlaying() {
    const visible = currentView === "protocols" && PTAB === "sound" && document.visibilityState === "visible" && $("#sound-player").hidden;
    if (!visible) { stopNowPlaying(); return; }
    refreshNowPlaying();
  }
  function stopNowPlaying() { clearInterval(npTicker); npTicker = null; }

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
    refreshMini();
  }
  /* Pause, resume and stop work from status, not from which screen is open,
     so the Sound player, the mini player and the phone's media notification
     all control the same session. */
  async function pauseSound() {
    const st = await sndEngine.status();
    if (!st) return;
    const preset = presetById(st.presetId);
    SND.userStopped = true;
    SND.paused = { preset, elapsed: st.elapsed, opts: { minutes: st.total / 60, volume: st.volume, noise: st.noise } };
    await sndEngine.stop({ log: false, fade: false });
    if (SND.preset?.id === preset.id) setPlayerMode("paused");
    refreshMini();
  }
  async function resumeSound() {
    if (!SND.paused) return;
    const { preset, elapsed, opts } = SND.paused;
    SND.userStopped = false; SND.last = null;
    try { await sndEngine.start(preset, { ...opts, offset: elapsed }); } catch { toast("Audio could not resume."); return; }
    SND.paused = null; SND.preset = preset; SND.opts = { ...SND.opts, ...opts };
    setPlayerMode("playing");
    if (!$("#sound-player").hidden) startPoll();
    refreshMini();
  }
  async function soundToggle() {
    if (await sndEngine.status()) await pauseSound(); else await resumeSound();
  }
  async function soundStop() {
    SND.userStopped = true;
    const st = await sndEngine.status();
    if (!st && SND.paused) {
      const mins = Math.round(SND.paused.elapsed / 60);
      SND.paused = null;
      if (mins >= 1) {
        const fresh = logMinutes("meditation", mins);
        toast(`${mins} min meditation logged${fresh ? ` · +${C.POINTS.practice}` : ""}`);
        render(); checkMilestones();
      }
    } else if (st) {
      $("#sp-time").textContent = "Fading…";
      $("#mp-sub").textContent = "Fading…";
      const r = await sndEngine.stop({ log: true, fade: true });
      if (EXT && r && r.minutes >= 1) toast(`${r.minutes} min meditation logged`);
    }
    SND.last = null;
    setPlayerMode("setup");
    releaseWakeLock();
    refreshMini();
  }

  /* ---- Mini player: above the navigation on every screen ---- */
  let mpTimer = null, naState = "";
  async function refreshMini() {
    const el = $("#mini-player");
    if (!el) return;
    const st = await sndEngine.status();
    const paused = st ? null : SND.paused;
    const id = st?.presetId || paused?.preset.id;
    const show = !!id && !$("#app").hidden;
    el.hidden = !show;
    document.body.classList.toggle("has-mini", show);
    nativeAudioSync(st, paused, id && presetById(id));
    if (!show) { clearInterval(mpTimer); mpTimer = null; return; }
    const p = presetById(id);
    const elapsed = st ? st.elapsed : paused.elapsed, total = st ? st.total : paused.opts.minutes * 60;
    const left = Math.max(0, Math.ceil(total - elapsed));
    $("#mp-glyph").textContent = p.glyph;
    $("#mp-name").textContent = p.name;
    if (!st || $("#mp-sub").textContent !== "Fading…") {
      $("#mp-sub").textContent = st ? (st.interrupted ? "Reconnecting audio…" : st.ending ? "Fading…" : `${fmtTime(left)} left · ${p.band}`) : `Paused · ${fmtTime(left)} left`;
    }
    $("#mp-bar").style.width = `${Math.min(100, (elapsed / total) * 100)}%`;
    el.classList.toggle("paused", !st);
    $("#mp-toggle").setAttribute("aria-label", st ? `Pause ${p.name}` : `Resume ${p.name}`);
    $("#mp-open").setAttribute("aria-label", `${p.name}, ${st ? "playing" : "paused"}, ${Math.floor(left / 60)} minutes left. Open the player.`);
    if (!mpTimer) mpTimer = setInterval(refreshMini, 1000);
  }
  function bindMini() {
    $("#mp-open").addEventListener("click", async () => {
      const st = await sndEngine.status();
      const id = st?.presetId || SND.paused?.preset.id;
      if (id) openSoundPlayer(id);
    });
    $("#mp-toggle").addEventListener("click", soundToggle);
    $("#mp-stop").addEventListener("click", soundStop);
    // Coming back to the app: if the system paused the audio, pick it up again.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") { SND.local?.recover?.(); refreshMini(); }
    });
  }

  /* Android: a foreground media service with a playback notification keeps
     the session alive while Sovereign is in the background or the screen is
     off, and lets lock-screen, notification and headset buttons control it. */
  function nativeAudioSync(st, paused, p) {
    const A = plugin("SovereignAudio");
    if (!A) return;
    const key = st && p ? `play:${p.id}` : paused && p ? `pause:${p.id}` : "off";
    if (key === naState) return;
    naState = key;
    if (key === "off") { A.stop().catch(() => {}); return; }
    A.start({ title: p.name, text: st ? `${p.band} · ${p.beat} Hz · Sovereign` : "Paused · Sovereign", playing: !!st }).catch((e) => console.warn("Background audio unavailable", e));
  }

  function closeSoundPlayer() {
    clearInterval(SND.poll);
    closeOverlay($("#sound-player"));
    if (currentView === "protocols" && PTAB === "sound") refreshNowPlaying();
    refreshMini();
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
    $("#journal-prompt").textContent = scriptureOn() && (christian() || dayIndex() % 2 === 1)
      ? C.SCRIPTURE.PROMPTS[dayIndex() % C.SCRIPTURE.PROMPTS.length]
      : C.PROMPTS[dayIndex() % C.PROMPTS.length];
    const ta = $("#journal-text");
    if (document.activeElement !== ta) ta.value = secOn() ? draftPlain : (state.draft || "");
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
      ? entries.map((j) => entryView(j)).map((j) => `<article class="card entry">
          <time datetime="${esc(j.ts)}">${new Date(j.ts).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
          ${j.prompt ? `<p class="entry-prompt">${esc(j.prompt)}</p>` : ""}
          <p class="entry-text">${esc(j.text)}</p>
          <div class="entry-actions"><button class="link-btn small" data-del="${esc(j.id)}">Delete</button></div>
        </article>`).join("")
      : `<p class="empty">${cal.selected ? "No entry on this day." : "No entries this month yet."}</p>`;
  }
  function bindJournal() {
    let draftTimer;
    $("#journal-text").addEventListener("input", (e) => {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(async () => {
        if (secOn() && KEY) { draftPlain = e.target.value; state.draftEnc = draftPlain ? await SovSecure.encryptText(KEY, draftPlain) : null; state.draft = ""; }
        else state.draft = e.target.value;
        save(); $("#journal-status").textContent = secOn() ? "Draft saved · encrypted" : "Draft saved";
      }, 500);
    });
    $("#journal-save").addEventListener("click", async () => {
      const text = $("#journal-text").value.trim();
      if (!text) { toast("Write something first."); $("#journal-text").focus(); return; }
      clearTimeout(draftTimer); // stop a pending draft-save from restoring the old text
      const now = new Date();
      const entry = {
        id: `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        date: dateKey(now), ts: now.toISOString()
      };
      const content = { prompt: $("#journal-prompt").textContent, text };
      if (secOn() && KEY) { entry.enc = await SovSecure.encryptJSON(KEY, content); PLAIN.set(entry.id, content); }
      else Object.assign(entry, content);
      state.journal.push(entry);
      const first = state.journal.filter((j) => j.date === dateKey(now)).length === 1;
      state.draft = ""; state.draftEnc = null; draftPlain = "";
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
    renderSettingsBody();
    if ($("#settings").hidden) openOverlay($("#settings"), closeSettings);
  }
  function renderSettingsBody() {
    const p = state.profile;
    const seg = (name, opts, cur) => `<div class="seg" role="group" aria-label="${name}">${opts.map(([v, l]) =>
      `<button class="chip" data-set="${name}" data-val="${v}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div>`;
    $("#settings-body").innerHTML = `
      <div class="setting-group"><h3>Name</h3>
        <label class="visually-hidden" for="set-name">Name</label>
        <input type="text" id="set-name" maxlength="40" value="${esc(p.name)}"></div>
      <div class="setting-group"><h3>Track</h3>${seg("track", [["men", "Men"], ["women", "Women"]], p.track)}</div>
      <div class="setting-group"><h3>Level</h3>${seg("level", LEVELS.map((l) => [l, cap(l)]), p.level)}</div>
      <div class="setting-group"><h3>Faith &amp; Scripture</h3>
        ${seg("faith", [["open", "Open"], ["blended", "Blended"], ["christian", "Christian"]], faith())}
        ${faith() !== "open" ? `<p class="field-label" style="margin:14px 0 6px">Bible translation</p>
          ${seg("translation", [["kjv", "King James"], ["web", "World English"]], translation())}` : ""}
        <p class="hint" style="margin-top:10px">${faith() === "christian" ? "Sovereign is grounded in Scripture and Christian prayer. Practices from other traditions are set aside, and Christian breath prayers take their place."
          : faith() === "blended" ? "The full practice, with Scripture and Christian prayer alongside it, and a verse every other day on Home."
          : "The practice as taught, drawing on Taoist, yogic and esoteric sources. Choose Blended or Christian to add Scripture and Christian prayer."}
          ${faith() !== "open" ? " Both translations are in the public domain. The King James uses “the LORD”, and the World English Bible is in modern English." : ""}</p></div>
      <div class="setting-group"><h3>Gentle reminders</h3>
        ${seg("reminders", [["on", "On"], ["off", "Off"]], state.settings.reminders === false ? "off" : "on")}
        <label class="field" style="margin:14px 0 10px"><span class="field-label">Daily practice reminder</span>
          <input type="time" id="set-reminder" value="${esc(p.reminder || "")}"></label>
        <p class="field-label" style="margin-bottom:6px">Reminder sound</p>
        <div class="btn-row" style="align-items:center">${seg("reminderSound", christian() ? [["bell", "Bell"], ["silent", "Silent"]] : [["om", "Om"], ["bell", "Bell"], ["silent", "Silent"]], reminderSound())}
          <button class="link-btn" id="set-om-preview">Preview</button></div>
        <p class="hint" style="margin-top:10px">Nothing is ever scheduled for you. At most two a day: your daily practice reminder (leave blank for none), and a focus reminder only if you add one on Home. Each is skipped if it's already done.
          Times follow this device's time zone (${esc(Intl.DateTimeFormat().resolvedOptions().timeZone || "local time")}).
          ${NATIVE ? "Reminders arrive even when Sovereign is closed." : EXT ? "Reminders arrive even when Sovereign is closed, as long as Chrome is running." : "On the web, reminders arrive while Sovereign is open or minimised."}</p></div>
      ${daycycleSettingsHTML(seg)}
      <div class="setting-group"><h3>Guidance sounds</h3>
        ${cueSliderHTML("set-cue-vol")}
        ${seg("duckSessions", [["on", "Dip frequencies during cues"], ["off", "Keep frequencies steady"]], state.settings.duckSessions === false ? "off" : "on")}
        <p class="hint" style="margin-top:10px">The bells and tones that guide breath, protocol steps and mala counts. When a Sound session is playing, it can dip for a moment so each cue is easy to hear. To change the frequencies themselves, use the volume slider in the Sound player.</p></div>
      <div class="setting-group"><h3>Appearance</h3>${seg("theme", [["dark", "Dark"], ["light", "Light"]], state.settings.theme)}</div>
      <div class="setting-group"><h3>Privacy &amp; security</h3>
        ${secOn() ? `
          <p class="sec-status"><span class="sec-dot" aria-hidden="true"></span> App lock is on · journal and backups encrypted</p>
          <p class="field-label" style="margin:12px 0 6px">Lock automatically</p>
          ${seg("autoLock", [["0", "When closed"], ["5", "After 5 min"], ["30", "After 30 min"]], String(state.security.autoLock ?? 5))}
          <div class="btn-row" style="margin-top:12px"><button class="btn" id="sec-change">Change passcode</button><button class="btn" id="sec-off">Turn off lock</button></div>`
        : `<p class="hint" style="margin-top:0">Protect Sovereign with a passcode. Your journal and drafts are then stored encrypted, and backups are encrypted too.</p>
          <button class="btn btn-primary" id="sec-on">Turn on App lock</button>`}
        <p class="field-label" style="margin:16px 0 6px">Reminder notifications</p>
        ${seg("discreet", [["on", "Discreet"], ["off", "Show details"]], state.settings.discreet === false ? "off" : "on")}
        <p class="hint" style="margin-top:10px">Discreet notifications say only "A gentle reminder from Sovereign", so nothing personal appears on your screen. Sovereign never sends your data anywhere and can't load anything from the internet.</p></div>
      <div class="setting-group"><h3>Your data</h3>
        <p class="hint">${NATIVE ? "Everything is stored only on this phone. Uninstalling Sovereign erases it." : "Everything is stored only in this browser. Clearing browser data will erase it."}
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
        else if (set === "discreet") state.settings.discreet = val === "on";
        else if (set === "faith" || set === "translation") {
          state.settings[set] = val;
          if (set === "faith") { if (val === "christian" && state.settings.reminderSound !== "silent") state.settings.reminderSound = "bell"; G.tab = val === "christian" ? "scripture" : "build"; G.open.clear(); }
          save(); renderSettingsBody();
          toast(set === "faith" ? ({ open: "Open path", blended: "Blended path: Scripture added", christian: "Christian path" })[val] : `Bible: ${C.SCRIPTURE.TRANSLATIONS[val]}`);
          $(`[data-set="${set}"][data-val="${val}"]`)?.focus();
          return;
        }
        else if (set === "daycycle") { state.daycycle.on = val === "on"; state.daycycle.introSeen = true; refreshBriefs(); save(); renderSettingsBody(); toast(val === "on" ? "Daycycle is on" : "Daycycle is off"); if (val === "on" && !dcDob()) $("#set-dc-dob")?.focus(); return; }
        else if (set === "autoLock") { state.security.autoLock = Number(val); setGrace(); }
        else state.profile[set] = val;
        if (set === "discreet") refreshBriefs();
        save();
        $$(`[data-set="${set}"]`, body).forEach((x) => x.setAttribute("aria-pressed", x.dataset.val === val));
        toast(set === "discreet" ? (val === "on" ? "Notifications are discreet" : "Notifications show details") : set === "autoLock" ? (val === "0" ? "Locks whenever Sovereign is closed" : `Locks after ${val} minutes away`) : set === "duckSessions" ? (val === "on" ? "Frequencies will dip during cues" : "Frequencies stay steady") : set === "reminders" ? `Reminders ${val}` : set === "reminderSound" ? `Reminder sound: ${cap(val)}` : `${cap(set)} set to ${cap(val)}`);
      }
      if (b.id === "set-om-preview") { const k = reminderSound() === "silent" ? (christian() ? "bell" : "om") : reminderSound(); b.disabled = true; SovSound.playReminder(k, 0.8).finally(() => (b.disabled = false)); }
      if (b.id === "set-export") exportData();
      if (b.id === "sec-on") enableLock();
      if (b.id === "sec-change") changeLock();
      if (b.id === "sec-off") disableLock();
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
      if (e.target.id === "set-dc-dob") setDob(e.target.value);
      if (e.target.id === "set-dc-wake" && e.target.value) { state.daycycle.wake = e.target.value; save(); toast(`Wake time ${fmtClock(e.target.value)}`); }
      if (e.target.id === "set-dc-sleep" && e.target.value) { state.daycycle.sleep = e.target.value; save(); toast(`Bedtime ${fmtClock(e.target.value)}`); }
    });
  }

  /* ---- App lock settings ---- */
  const passFields = (labels) => labels.map(([id, label, ac]) =>
    `<label class="field"><span class="field-label">${label}</span><input type="password" id="${id}" autocomplete="${ac}" maxlength="128"></label>`).join("");
  async function askNewPasscode(title, intro) {
    const v = await dialog({
      title,
      html: `<p class="muted">${intro}</p>${passFields([["pass-new", "New passcode (at least 4 characters)", "new-password"], ["pass-confirm", "Confirm passcode", "new-password"]])}
             <p class="hint">A phrase of several words is far stronger than a 4-digit PIN. It can't be recovered if forgotten.</p>`,
      actions: [{ label: "Cancel", value: "no" }, { label: "Save passcode", value: "yes", primary: true }],
      read: () => [$("#pass-new").value, $("#pass-confirm").value]
    });
    if (v.value !== "yes") return null;
    const [a, b] = v.read;
    if (a.length < 4) { toast("Use at least 4 characters."); return null; }
    if (a !== b) { toast("The passcodes didn't match."); return null; }
    return a;
  }
  async function confirmCurrent(title) {
    const v = await dialog({ title, html: passFields([["pass-cur", "Current passcode", "current-password"]]),
      actions: [{ label: "Cancel", value: "no" }, { label: "Continue", value: "yes", primary: true }], read: () => $("#pass-cur").value });
    if (v.value !== "yes") return false;
    const ok = await SovSecure.unlock(v.read, state.security);
    if (!ok) toast("That passcode didn't match.");
    return !!ok;
  }
  async function applyNewPasscode(pass) {
    toast("Encrypting…");
    const { record, key } = await SovSecure.createLock(pass);
    if (state.security?.enabled && KEY) await decryptJournal();
    await encryptJournalWith(key);
    state.security = { ...record, autoLock: state.security?.autoLock ?? 5, fails: 0, waitUntil: 0 };
    KEY = key;
    save(); await setGrace();
  }
  async function enableLock() {
    const pass = await askNewPasscode("Turn on App lock", "Choose a passcode to open Sovereign. Your journal and drafts will be stored encrypted.");
    if (!pass) return;
    await applyNewPasscode(pass);
    toast("App lock is on");
    openSettings(); $("#lock-now").hidden = false;
  }
  async function changeLock() {
    if (!(await confirmCurrent("Change passcode"))) return;
    const pass = await askNewPasscode("New passcode", "Your journal will be re-encrypted with the new passcode.");
    if (!pass) return;
    await applyNewPasscode(pass);
    toast("Passcode changed");
    openSettings();
  }
  async function disableLock() {
    if (!(await confirmCurrent("Turn off App lock"))) return;
    await decryptJournal();
    await relockLibrary(KEY, null);
    state.journal = decryptedJournalPlain();
    state.draft = draftPlain; state.draftEnc = null;
    if (state.daycycle.dobEnc) { state.daycycle.dob = DOB_PLAIN; state.daycycle.dobEnc = null; }
    state.security = null; KEY = null; PLAIN.clear();
    save(); await clearGrace();
    $("#lock-now").hidden = true;
    toast("App lock is off. Your journal is no longer encrypted.");
    openSettings();
  }

  async function exportData() {
    const full = { ...state, library: await readLibraryEntries().catch(() => ({})) };
    let payload = { app: "sovereign", version: APP_VERSION, exportedAt: new Date().toISOString(), data: full };
    // With App lock on, the whole backup is encrypted with the passcode.
    if (secOn() && KEY) {
      const box = await SovSecure.encryptJSON(KEY, full);
      payload = { app: "sovereign", version: APP_VERSION, exportedAt: payload.exportedAt, encrypted: true,
        salt: state.security.salt, iter: state.security.iter, check: state.security.check, ...box };
    }
    if (NATIVE) {
      try {
        await nativeExport(JSON.stringify(payload, null, 2), `sovereign-backup-${todayKey()}.json`);
        state.meta.lastExport = new Date().toISOString(); save();
        if (currentView === "home") renderBanners();
        toast("Choose where to keep your backup — Files or Drive work well");
      } catch (e) { if (!/cancel/i.test(String(e?.message || e))) toast("Backup could not be shared."); }
      return;
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sovereign-backup-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    state.meta.lastExport = new Date().toISOString();
    save();
    if (currentView === "home") renderBanners();
    toast(secOn() ? "Encrypted backup saved to your Downloads folder" : "Backup saved to your Downloads folder");
  }

  async function importData(file) {
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.app !== "sovereign") throw new Error("not a Sovereign backup");
      let data = parsed.data, importKey = null;
      if (parsed.encrypted) {
        const v = await dialog({
          title: "Encrypted backup",
          html: `<p>This backup is protected. Enter the passcode that was in use when it was made.</p>
                 <label class="field"><span class="field-label">Passcode</span><input type="password" id="import-pass" autocomplete="off"></label>`,
          actions: [{ label: "Cancel", value: "no" }, { label: "Unlock backup", value: "yes", primary: true }],
          read: () => $("#import-pass").value
        });
        if (v.value !== "yes") return;
        importKey = await SovSecure.unlock(v.read, { salt: parsed.salt, iter: parsed.iter, check: parsed.check });
        if (!importKey) { dialog({ title: "Wrong passcode", html: "<p class='muted'>That passcode doesn't open this backup.</p>", actions: [{ label: "OK", value: "ok", primary: true }] }); return; }
        data = await SovSecure.decryptJSON(importKey, parsed);
      }
      if (!data || !data.profile) throw new Error("not a Sovereign backup");
      const v = await dialog({
        title: "Replace current data?",
        html: `<p>This backup is from <strong>${new Date(parsed.exportedAt).toLocaleDateString()}</strong> and belongs to <strong>${esc(data.profile.name)}</strong>.</p>
               <p class="muted">Importing replaces everything currently on this device.</p>`,
        actions: [{ label: "Cancel", value: "no" }, { label: "Import", value: "yes", primary: true }]
      });
      if (v !== "yes") return;
      const libEntries = data.library; delete data.library;
      state = normalise(data);
      await writeLibraryEntries(libEntries || {}).catch(() => {});
      PLAIN.clear(); draftPlain = ""; DOB_PLAIN = "";
      KEY = secOn() ? importKey : null;
      if (KEY) { await decryptJournal(); await setGrace(); }
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
      if (NATIVE) {
        try { const LN = plugin("LocalNotifications"); const pend = await LN.getPending(); const ids = (pend.notifications || []).map((n) => ({ id: n.id })); if (ids.length) await LN.cancel({ notifications: ids }); } catch (_) {}
        try { await plugin("SovereignAudio")?.stop(); } catch (_) {}
      }
      try { await sndEngine.stop({ log: false, fade: false }); } catch (_) {}
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      if (EXT) await chrome.storage.local.remove([STORAGE_KEY, "sovereign.writer"]).catch(() => {});
      try { indexedDB.deleteDatabase("sovereign-library"); localStorage.removeItem("sovereign.track"); } catch (_) {}
      await clearGrace();
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
    if (NATIVE) { const LN = plugin("LocalNotifications"); LN && LN.requestPermissions().then(queueNativeSchedule).catch(() => {}); return; }
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
  }
  /** Play the Om (unless silent) and show a system notification if allowed. Website only. */
  function deliverReminder(title, body, tag) {
    const kind = reminderSound(), om = kind !== "silent";
    if (om && window.SovSound) SovSound.playReminder(kind, 0.8).catch(() => {});
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
      if (!EXT && !NATIVE) deliverReminder("Sovereign", dailyReminderBody(tk), "sovereign-reminder");
      if (currentView === "home") renderBanners();
    }

    // Focus reminder — only if the member set one and hasn't applied the focus yet.
    // (In the extension the background worker delivers it, even when the panel is closed.)
    const f = day().focus;
    if (!EXT && !NATIVE && f && f.remindAt && !f.done && !f.notified && hhmm >= f.remindAt) {
      f.notified = true; save();
      deliverReminder(state.settings.discreet === false ? "Today’s focus" : "Sovereign",
        state.settings.discreet === false ? `${f.title}. ${f.cue}` : "A gentle reminder from Sovereign.", "sovereign-focus");
      toast(`Today’s focus: ${f.title}`);
      if (currentView === "home") renderFocus();
    }
  }

  /* ========================================================================
     15. SERVICE WORKER & BOOT
     ======================================================================== */
  function registerSW() {
    if (EXT || NATIVE) return; // packaged locally — already offline
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol === "file:") { console.info("Offline mode needs the app served over http(s)."); return; }
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW registration failed", e));
  }

  function startApp() {
    appStarted = true;
    $("#lock-now").hidden = !secOn();
    $("#lock-now").addEventListener("click", () => { if (secOn()) showLock(); });
    $("#app").hidden = false;
    // Extension side panel: offer the roomier full-view tab.
    if (EXT && !IS_FULL) {
      const b = $("#open-full");
      b.hidden = false;
      b.addEventListener("click", () => chrome.tabs.create({ url: chrome.runtime.getURL("index.html?full=1") }));
    }
    if (IS_FULL) document.body.classList.add("full-view");
    if (christian()) G.tab = "scripture";
    bindHome(); bindBanners(); bindGuide(); bindFocus(); bindDaycycle(); bindTracker(); bindPacer(); bindMini(); bindSound(); bindCueSliders(); bindTimer(); bindLibrary(); bindJournal(); bindSettings();
    $$(".nav-btn").forEach((b) => b.addEventListener("click", () => go(b.dataset.view)));
    go("home");
    refreshMini();
    checkMilestones();
    checkReminder();
    setInterval(checkReminder, 30000);
    // Re-render when the date rolls over at midnight or when returning to the app.
    let lastDay = todayKey();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && todayKey() !== lastDay) { lastDay = todayKey(); render(); }
      if (document.visibilityState === "visible" && currentView === "protocols" && PTAB === "sound") refreshNowPlaying();
    });
  }

  async function boot() {
    state = await loadState();
    applyTheme();
    registerSW();
    watchOtherWindows();
    bindNative();
    $("#lock-form").addEventListener("submit", tryUnlock);
    $("#lock-forgot").addEventListener("click", forgotPasscode);
    bindAutoLock();
    if (state.profile && secOn()) {
      if (await useGrace()) await afterUnlock(); else showLock();
      return;
    }
    if (state.profile) startApp(); else startOnboarding();
  }
  boot();
})();
