/* ==========================================================================
   SOVEREIGN — Extension background worker (Manifest V3)
   1. Clicking the toolbar icon opens Sovereign in Chrome's side panel.
   2. Daily practice reminder: a chrome.alarm fires at the member's chosen
      time; if nothing has been practised today, Chrome shows a notification.
      Works even when the side panel is closed.
   3. Sound sessions: creates a hidden offscreen document that plays audio so
      sessions continue when the side panel is closed, and logs finished
      sessions to Meditation.
   No network access, no browsing data. Everything stays in chrome.storage.local.
   ========================================================================== */
const KEY = "sovereign.v1";
const ALARM = "sovereign-reminder";      // daily practice reminder
const FOCUS_ALARM = "sovereign-focus";   // optional reminder for today's focus

// 1. Toolbar icon → side panel (runs on every worker start; cheap and idempotent)
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(() => scheduleAll());
chrome.runtime.onStartup.addListener(() => scheduleAll());

/* Everything that affects reminders, as one comparable string. */
function reminderSignature(s) {
  if (!s) return "";
  const f = s.days?.[dateKey()]?.focus;
  return JSON.stringify([s.settings?.reminders !== false, s.profile?.reminder || "", f?.remindAt || "", !!f?.done]);
}
// Reschedule only when a reminder-related value actually changed.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[KEY]) return;
  if (reminderSignature(changes[KEY].oldValue) !== reminderSignature(changes[KEY].newValue)) scheduleAll();
});

function scheduleAll() { scheduleReminder(); scheduleFocus(); }

/** One-shot alarm for today's focus reminder, if the member set one and hasn't applied it yet. */
async function scheduleFocus() {
  await chrome.alarms.clear(FOCUS_ALARM);
  const s = (await chrome.storage.local.get(KEY))[KEY];
  if (!s?.profile || s.settings?.reminders === false) return;
  const f = s.days?.[dateKey()]?.focus;
  if (!f?.remindAt || f.done) return;
  const [h, m] = f.remindAt.split(":").map(Number);
  const at = new Date(); at.setHours(h, m, 0, 0);
  if (at.getTime() > Date.now()) await chrome.alarms.create(FOCUS_ALARM, { when: at.getTime() });
}

/** Set a one-shot alarm for the next occurrence of HH:MM (local time).
    Recomputed after every firing so daylight-saving changes never drift it. */
async function scheduleReminder() {
  await chrome.alarms.clear(ALARM);
  const s = (await chrome.storage.local.get(KEY))[KEY];
  if (s?.settings?.reminders === false) return;
  const r = s?.profile?.reminder;
  if (!r || !/^\d{2}:\d{2}$/.test(r)) return;
  const [h, m] = r.split(":").map(Number);
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  await chrome.alarms.create(ALARM, { when: next.getTime() });
}

const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Mirrors the app's rule: any practice, protocol, applied focus or journal entry counts. */
function practicedToday(s) {
  const k = dateKey();
  const day = s.days?.[k];
  if ((s.journal || []).some((j) => j.date === k)) return true;
  if (!day) return false;
  if ((day.protocols || []).length || day.focus?.done) return true;
  return Object.values(day.practices || {}).some((p) => p && (p.done || p.status || p.phase));
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM && alarm.name !== FOCUS_ALARM) return;
  const s = (await chrome.storage.local.get(KEY))[KEY];
  if (!s?.profile || s.settings?.reminders === false) { if (alarm.name === ALARM) scheduleReminder(); return; }
  const om = s.settings?.reminderSound !== "silent";

  if (alarm.name === ALARM) {
    if (!practicedToday(s)) {
      notify(ALARM, "Sovereign", s.settings?.discreet === false ? "Your practice time has arrived. Five minutes is enough to begin." : "A gentle reminder from Sovereign.", om);
    }
    scheduleReminder(); // tomorrow
  } else {
    const f = s.days?.[dateKey()]?.focus;
    if (f?.remindAt && !f.done) {
      // Discreet by default: nothing personal on the lock screen or in the notification centre.
      if (s.settings?.discreet === false) notify(FOCUS_ALARM, "Today’s focus", `${f.title}. ${f.cue}`, om);
      else notify(FOCUS_ALARM, "Sovereign", "A gentle reminder from Sovereign.", om);
    }
  }
});

/** Show a notification; if the Om is on, play it (and keep the notification itself silent). */
function notify(id, title, message, om) {
  chrome.notifications.create(id, { type: "basic", iconUrl: "icons/icon-128.png", title, message, priority: 1, silent: om });
  if (om) playOm();
}

/** Play the Om through the offscreen audio page — unless a sound session is playing there. */
async function playOm() {
  try {
    await ensureOffscreen();
    const st = await chrome.runtime.sendMessage({ target: "offscreen", type: "status" }).catch(() => null);
    if (st) return; // don't interrupt a meditation in progress
    await chrome.runtime.sendMessage({ target: "offscreen", type: "om" });
    const still = await chrome.runtime.sendMessage({ target: "offscreen", type: "status" }).catch(() => null);
    if (!still) await chrome.offscreen.closeDocument().catch(() => {});
  } catch (_) { /* audio unavailable — the notification still shows */ }
}

// Clicking a reminder opens the full view.
chrome.notifications.onClicked.addListener((id) => {
  if (id !== ALARM && id !== FOCUS_ALARM) return;
  chrome.notifications.clear(id);
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html?full=1") });
});


/* --------------------------------------------------------------------------
   3. SOUND — offscreen audio document
   -------------------------------------------------------------------------- */
let creating = null;
async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await flushOrphanSession();
  if (!creating) {
    creating = chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Plays the user's binaural-beat and meditation sound sessions while the side panel is closed."
    }).finally(() => { creating = null; });
  }
  await creating;
}

/** Add minutes to today's Meditation practice (same shape the app uses). */
async function logMeditation(minutes) {
  const s = (await chrome.storage.local.get(KEY))[KEY];
  if (!s?.profile) return;
  const k = dateKey();
  s.days = s.days || {};
  const day = s.days[k] || (s.days[k] = { practices: {}, protocols: [] });
  day.practices = day.practices || {};
  const p = day.practices.meditation || (day.practices.meditation = { done: false, min: 0 });
  p.min = Math.min(600, (p.min || 0) + minutes);
  p.done = true;
  await chrome.storage.local.set({ [KEY]: s, "sovereign.writer": "background" });
}

/* Progress of the session in flight (kept in session storage, cleared when it ends). */
const PROGRESS = "sovereign.soundProgress";
async function flushOrphanSession() {
  const rec = (await chrome.storage.session.get(PROGRESS))[PROGRESS];
  if (!rec) return;
  await chrome.storage.session.remove(PROGRESS);
  const minutes = Math.round(rec.elapsed / 60);
  if (minutes >= 1) await logMeditation(minutes);
}
chrome.runtime.onStartup.addListener(() => flushOrphanSession());

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.target !== "bg") return false;
  if (msg.type === "sound-progress") {
    chrome.storage.session.set({ [PROGRESS]: { presetId: msg.presetId, elapsed: msg.elapsed } });
    return false;
  }
  if (msg.type === "sound-flush") {
    // The app noticed the session vanished; log it if the audio page was closed early.
    chrome.offscreen.hasDocument().then((has) => (has ? null : flushOrphanSession())).finally(() => reply({ ok: true }));
    return true;
  }
  if (msg.type === "sound-ensure") {
    ensureOffscreen().then(() => reply({ ok: true })).catch((e) => reply({ ok: false, error: String(e) }));
    return true;
  }
  if (msg.type === "sound-ended") {
    (async () => {
      const r = msg.result || {};
      await chrome.storage.session.remove(PROGRESS);
      if (r.log && r.minutes >= 1) await logMeditation(r.minutes);
      // Close the audio document unless a new session has already started in it.
      setTimeout(async () => {
        try {
          const st = await chrome.runtime.sendMessage({ target: "offscreen", type: "status" });
          if (!st) await chrome.offscreen.closeDocument();
        } catch (_) {}
      }, 300);
    })();
    return false;
  }
  return false;
});
