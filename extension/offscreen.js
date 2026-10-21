/* ==========================================================================
   SOVEREIGN — Offscreen audio host (extension only)
   Runs the shared sound engine. Commands arrive from the app page:
     start { preset, opts }   stop { opts }   set { kind, value }   status
     om — play the "Ouuuum" reminder sound
   When a session ends (timer, or End & log), it tells the background worker,
   which logs the minutes and closes this document.
   ========================================================================== */
let session = null;

function finished(result) {
  clearInterval(progressTimer);
  chrome.runtime.sendMessage({ target: "bg", type: "sound-ended", result }).catch(() => {});
}

/* Progress heartbeat: if Chrome ever closes this page early (e.g. the volume
   is at zero, so Chrome treats it as silent), the background can still log
   the minutes already completed. */
let progressTimer = null;
function startHeartbeat() {
  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (!session || session.ended || session.ending) return;
    chrome.runtime.sendMessage({ target: "bg", type: "sound-progress", presetId: session.preset.id, elapsed: session.elapsed }).catch(() => {});
  }, 15000);
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.target !== "offscreen") return false;

  if (msg.type === "start") {
    (async () => {
      if (session && !session.ended) await session.stop({ log: true, fade: false }); // switching presets
      session = new SovSound.Session(msg.preset, msg.opts, finished).start();
      startHeartbeat();
      reply({ ok: true });
    })();
    return true; // async reply
  }
  if (msg.type === "duck") {
    if (session && !session.ended) session.duck();
    reply({ ok: true });
    return false;
  }
  if (msg.type === "om") {
    SovSound.playOm(0.8).then(() => reply({ ok: true })).catch(() => reply({ ok: false }));
    return true; // reply when the Om has finished
  }
  if (msg.type === "status") {
    reply(session && !session.ended ? session.status() : null);
    return false;
  }
  if (msg.type === "set") {
    if (session) msg.kind === "volume" ? session.setVolume(msg.value) : session.setNoise(msg.value);
    reply({ ok: true });
    return false;
  }
  if (msg.type === "stop") {
    if (!session || session.ended) { reply(null); return false; }
    session.stop(msg.opts || {}).then((r) => reply(r));
    return true;
  }
  return false;
});
