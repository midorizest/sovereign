/* The real app in a real browser: first run, points and streaks, the journal,
   backups, App lock, older saved data, and working offline. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const H = require("./helpers");

let server;
const LIMIT = { timeout: 90000 }; // a stuck test fails instead of hanging
test.before(async () => { server = await H.startServer(); });
test.after(async () => { await H.closeBrowser(); await server.close(); });

/** Run a test body against a fresh browser profile, then check the page logged no errors. */
async function withApp(opts, body) {
  const app = await H.openApp(server.url, opts);
  try {
    await body(app.page, app);
    assert.deepEqual(app.errors, [], "the page logged errors");
  } finally { await app.context.close(); }
}
const num = async (page, sel) => Number((await page.textContent(sel)).replace(/,/g, ""));
const version = JSON.parse(fs.readFileSync(path.join(H.ROOT, "extension", "manifest.json"), "utf8")).version;

test("first run: setup leads to Home and saves the profile", LIMIT, async () => {
  await withApp({}, async (page) => {
    await page.waitForSelector("#onboarding:not([hidden])");
    await page.check("#ob-agree");
    await page.click("#ob-next-1");
    await page.click('[data-track="women"]');
    await page.click("#ob-next-2");
    await page.click('[data-level="beginner"]');
    await page.click("#ob-next-3");
    await page.click('[data-faith="open"]');
    await page.click("#ob-next-4");
    await page.click("#ob-dc-skip");
    await page.fill("#ob-name", "Ada");
    await page.click("#ob-finish");
    await page.waitForSelector("#view-home:not([hidden])");
    assert.equal(await num(page, "#streak-current"), 0);
    assert.equal(await num(page, "#points-total"), 0);
    const s = await H.stored(page);
    assert.equal(s.profile.name, "Ada");
    assert.equal(s.profile.track, "women");
    // The women's track shows Cycle Awareness, not the men's Retention Check-In.
    assert.equal(await page.locator("[data-phase]").count() > 0, true);
    assert.equal(await page.locator("[data-ret]").count(), 0);
  });
});

test("every main screen and Settings open without errors, and show the current version", LIMIT, async () => {
  await withApp({ state: H.savedState() }, async (page) => {
    for (const view of ["protocols", "library", "guide", "journal", "home"]) {
      await page.click(`.nav-btn[data-view="${view}"]`);
      await page.waitForSelector(`#view-${view}:not([hidden])`);
    }
    await page.click("#open-settings");
    assert.match(await page.textContent("#settings-body .version"), new RegExp(`v${version.replace(/\./g, "\\.")}\\b`));
  });
});

test("a practice earns 10 points, starts the streak, and is still there after a reload", LIMIT, async () => {
  await withApp({ state: H.savedState() }, async (page) => {
    await page.click('[data-toggle="grounding"]');
    assert.equal(await num(page, "#points-today"), 10);
    assert.equal(await num(page, "#points-total"), 10);
    assert.equal(await num(page, "#streak-current"), 1);
    // Logged under the local date (it is already tomorrow in UTC).
    assert.deepEqual(Object.keys((await H.stored(page)).days), [H.TODAY]);
    await page.reload();
    await page.waitForSelector("#view-home:not([hidden])");
    assert.equal(await num(page, "#streak-current"), 1);
    assert.equal(await page.getAttribute('[data-toggle="grounding"]', "aria-pressed"), "true");
    // Unticking takes the points back.
    await page.click('[data-toggle="grounding"]');
    assert.equal(await num(page, "#points-total"), 0);
    assert.equal(await num(page, "#streak-current"), 0);
  });
});

test("logging minutes completes the practice; the men's retention check-in counts too", LIMIT, async () => {
  await withApp({ state: H.savedState() }, async (page) => {
    await page.fill('[data-min="breath"]', "12");
    await page.dispatchEvent('[data-min="breath"]', "change");
    assert.equal(await num(page, "#points-today"), 10);
    await page.click('[data-ret="held"]');
    assert.equal(await num(page, "#points-today"), 20);
    const today = (await H.stored(page)).days[H.TODAY].practices;
    assert.deepEqual(today.breath, { done: true, min: 12 });
    assert.equal(today.retention.status, "held");
  });
});

test("streaks: alive through the following day, broken after a missed day, longest remembered", LIMIT, async () => {
  const days = {};
  for (let i = -5; i <= -1; i++) days[H.dayKey(i)] = H.practisedDay();     // 5 days ending yesterday (across the clock change)
  for (let i = -40; i <= -32; i++) days[H.dayKey(i)] = H.practisedDay();   // an older 9-day run
  await withApp({ state: H.savedState({ days, lessons: { "what-is-sexual-energy": H.dayKey(-3) } }) }, async (page) => {
    assert.equal(await num(page, "#streak-current"), 5, "yesterday's streak is still alive today");
    assert.equal(await num(page, "#streak-longest"), 9);
    assert.equal(await num(page, "#points-total"), 14 * 10 + 20, "14 practised days + 1 lesson");
    await page.click('[data-toggle="grounding"]');
    assert.equal(await num(page, "#streak-current"), 6, "today extends it");
  });
  const stale = {};
  for (let i = -6; i <= -2; i++) stale[H.dayKey(i)] = H.practisedDay();    // last practised two days ago
  await withApp({ state: H.savedState({ days: stale }) }, async (page) => {
    assert.equal(await num(page, "#streak-current"), 0, "a missed day ends the streak");
    assert.equal(await num(page, "#streak-longest"), 5);
  });
});

test("a 7-day streak is celebrated once", LIMIT, async () => {
  const days = {};
  for (let i = -6; i <= 0; i++) days[H.dayKey(i)] = H.practisedDay();
  await withApp({ state: H.savedState({ days }) }, async (page) => {
    await page.waitForSelector("#dialog[open] .milestone-num");
    assert.equal(await page.textContent("#dialog .milestone-num"), "7");
    await H.dialogClick(page, "ok");
    await page.reload();
    await page.waitForSelector("#view-home:not([hidden])");
    await page.waitForTimeout(300);
    assert.equal(await page.locator("#dialog[open]").count(), 0, "not shown a second time");
  });
});

test("a journal entry is saved, earns points and counts toward the streak", LIMIT, async () => {
  await withApp({ state: H.savedState() }, async (page) => {
    await H.writeJournal(page, "First entry <b>not bold</b>");
    // Shown as typed, never as HTML.
    assert.equal(await page.locator("#entries-list b").count(), 0);
    await page.click('.nav-btn[data-view="home"]');
    assert.equal(await num(page, "#points-today"), 10);
    assert.equal(await num(page, "#streak-current"), 1);
    const s = await H.stored(page);
    assert.equal(s.journal.length, 1);
    assert.equal(s.journal[0].date, H.TODAY);
  });
});

test("backup: export, then import on another device, restores everything", LIMIT, async () => {
  const days = {};
  for (let i = -3; i <= 0; i++) days[H.dayKey(i)] = H.practisedDay();
  let backup, original;
  await withApp({ state: H.savedState({ days, lessons: { "what-is-sexual-energy": H.dayKey(-1) } }) }, async (page) => {
    await H.writeJournal(page, "Entry to carry across");
    backup = await H.exportBackup(page);
    assert.equal(backup.filename, `sovereign-backup-${H.TODAY}.json`);
    original = await H.stored(page);
    assert.ok(original.meta.lastExport, "the export is remembered");
  });
  const parsed = JSON.parse(backup.text);
  assert.equal(parsed.app, "sovereign");
  assert.equal(parsed.version, version);

  await withApp({ state: H.savedState({ profile: H.profile({ name: "Someone Else", track: "women" }) }) }, async (page) => {
    await H.chooseImport(page, backup.text);
    await page.waitForSelector("#dialog[open]");
    assert.match(await page.textContent("#dialog-body"), /Tester/);
    await H.dialogClick(page, "yes");
    await page.waitForSelector("#view-home:not([hidden])");
    await page.waitForFunction(() => document.querySelector("#streak-current").textContent === "4");
    const s = await H.stored(page);
    for (const k of ["profile", "days", "journal", "lessons"]) assert.deepEqual(s[k], original[k], k);
    assert.equal(await num(page, "#points-total"), 4 * 10 + 10 + 20, "4 practised days + journal + lesson");
    await page.click('.nav-btn[data-view="journal"]');
    assert.match(await page.textContent("#entries-list"), /Entry to carry across/);
  });
});

test("backup: cancelling an import, or choosing the wrong file, changes nothing", LIMIT, async () => {
  const days = { [H.TODAY]: H.practisedDay() };
  await withApp({ state: H.savedState({ days }) }, async (page) => {
    const before = await H.storedRaw(page);
    for (const bad of ["this is not json", JSON.stringify({ app: "something-else", data: {} }), JSON.stringify({ app: "sovereign", data: { days: {} } })]) {
      await H.chooseImport(page, bad);
      await page.waitForSelector("#dialog[open]");
      assert.equal(await page.textContent("#dialog-title"), "Import failed");
      await H.dialogClick(page, "ok");
      await page.click("#close-settings");
    }
    const other = JSON.stringify({ app: "sovereign", version: "1.0.0", exportedAt: "2026-01-01T00:00:00Z", data: H.savedState({ profile: H.profile({ name: "Other" }) }) });
    await H.chooseImport(page, other);
    await page.waitForSelector("#dialog[open]");
    await H.dialogClick(page, "no");
    assert.equal(await H.storedRaw(page), before);
    assert.equal(await num(page, "#streak-current"), 1);
  });
});

test("data saved by an early version still opens", LIMIT, async () => {
  // v1.0 saved only these keys: no settings beyond the theme, no Daycycle, no security.
  const old = { version: 1, profile: { name: "Early", track: "men", level: "beginner", reminder: "", createdAt: "2025-10-01T00:00:00.000Z" },
    days: { [H.dayKey(-1)]: { practices: { grounding: { done: true, min: 0 } } } },
    journal: [{ id: "a1", date: H.dayKey(-1), ts: "2026-03-09T20:00:00.000Z", prompt: "Old prompt", text: "Old entry" }],
    lessons: {}, milestonesSeen: [], settings: { theme: "light" }, meta: {}, draft: "" };
  await withApp({ state: old }, async (page) => {
    await page.waitForSelector("#view-home:not([hidden])");
    assert.equal(await num(page, "#streak-current"), 1);
    assert.equal(await num(page, "#points-total"), 20);
    for (const view of ["protocols", "library", "guide", "journal"]) await page.click(`.nav-btn[data-view="${view}"]`);
    assert.match(await page.textContent("#entries-list"), /Old entry/);
  });
});

test("App lock: the journal is encrypted on the device and opens only with the passcode", LIMIT, async () => {
  await withApp({ state: H.savedState() }, async (page) => {
    await H.writeJournal(page, "Written before the lock");
    await H.enableLock(page, "open sesame");
    await H.writeJournal(page, "Written after the lock");
    await page.fill("#journal-text", "An unfinished draft");
    await page.waitForFunction(() => /encrypted/.test(document.querySelector("#journal-status").textContent));

    const raw = await H.storedRaw(page);
    for (const secret of ["Written before the lock", "Written after the lock", "An unfinished draft", "open sesame"])
      assert.ok(!raw.includes(secret), `"${secret}" must not be readable in storage`);
    const s = JSON.parse(raw);
    assert.equal(s.journal.length, 2);
    assert.ok(s.journal.every((j) => j.enc && !j.text && !j.prompt));

    // Reopening the app shows only the lock screen.
    await page.reload();
    await page.waitForSelector("#lockscreen:not([hidden])");
    assert.equal(await page.isHidden("#app"), true);
    assert.ok(!(await page.content()).includes("Written after the lock"));

    await page.fill("#lock-input", "wrong passcode");
    await page.click("#lock-submit");
    await page.waitForFunction(() => /didn't match/.test(document.querySelector("#lock-msg").textContent));
    assert.equal(await page.isHidden("#app"), true);

    await page.fill("#lock-input", "open sesame");
    await page.click("#lock-submit");
    await page.waitForSelector("#view-home:not([hidden])");
    assert.equal(await num(page, "#streak-current"), 1);
    await page.click('.nav-btn[data-view="journal"]');
    const list = await page.textContent("#entries-list");
    assert.match(list, /Written before the lock/);
    assert.match(list, /Written after the lock/);
    assert.equal(await page.inputValue("#journal-text"), "An unfinished draft");

    // The lock button in the top bar hides everything again.
    await page.click("#lock-now");
    await page.waitForSelector("#lockscreen:not([hidden])");
    assert.equal(await page.textContent("#entries-list"), "");
  });
});

test("App lock: five wrong passcodes start a wait that survives a reload", LIMIT, async () => {
  await withApp({ state: H.savedState() }, async (page) => {
    await H.enableLock(page, "open sesame");
    await page.click("#lock-now");
    for (let i = 1; i <= 5; i++) {
      await page.fill("#lock-input", `wrong ${i}`);
      await page.click("#lock-submit");
      await page.waitForFunction((n) => JSON.parse(localStorage.getItem("sovereign.v1")).security.fails === n, i);
    }
    await page.waitForFunction(() => /Too many attempts/.test(document.querySelector("#lock-msg").textContent));
    assert.equal(await page.isDisabled("#lock-input"), true);
    await page.reload();
    await page.waitForSelector("#lockscreen:not([hidden])");
    assert.equal(await page.isDisabled("#lock-input"), true);
    assert.match(await page.textContent("#lock-msg"), /Try again in 30 s/);
  });
});

test("App lock: turning it off makes the journal readable again", LIMIT, async () => {
  await withApp({ state: H.savedState() }, async (page) => {
    await H.writeJournal(page, "Stays with me");
    await H.enableLock(page, "open sesame");
    await page.click("#open-settings");
    await page.click("#sec-off");
    await page.fill("#pass-cur", "open sesame");
    await H.dialogClick(page, "yes");
    await page.waitForSelector("#sec-on");
    const s = await H.stored(page);
    assert.equal(s.security, null);
    assert.equal(s.journal[0].text, "Stays with me");
    assert.equal(s.journal[0].enc, undefined);
  });
});

test("encrypted backup: unreadable as a file, and restores only with its passcode", LIMIT, async () => {
  let backup;
  await withApp({ state: H.savedState({ days: { [H.TODAY]: H.practisedDay() } }) }, async (page) => {
    await H.writeJournal(page, "Locked away");
    await H.enableLock(page, "open sesame");
    backup = await H.exportBackup(page);
  });
  const parsed = JSON.parse(backup.text);
  assert.equal(parsed.encrypted, true);
  assert.equal(parsed.data, undefined);
  for (const secret of ["Locked away", "Tester", H.TODAY + '":', "open sesame"]) assert.ok(!backup.text.replace(parsed.exportedAt, "").includes(secret), `"${secret}" must not be readable in the backup`);

  await withApp({ state: H.savedState({ profile: H.profile({ name: "New Device" }) }) }, async (page) => {
    const before = await H.storedRaw(page);
    await H.chooseImport(page, backup.text);
    await page.fill("#import-pass", "not the passcode");
    await H.dialogClick(page, "yes");
    await page.waitForFunction(() => document.querySelector("#dialog-title").textContent === "Wrong passcode");
    await H.dialogClick(page, "ok");
    assert.equal(await H.storedRaw(page), before, "a wrong passcode changes nothing");
    await page.click("#close-settings");

    await H.chooseImport(page, backup.text);
    await page.fill("#import-pass", "open sesame");
    await H.dialogClick(page, "yes");
    await page.waitForFunction(() => document.querySelector("#dialog-title").textContent === "Replace current data?");
    await H.dialogClick(page, "yes");
    await page.waitForFunction(() => document.querySelector("#streak-current").textContent === "1");
    const s = await H.stored(page);
    assert.equal(s.profile.name, "Tester");
    assert.equal(s.security.enabled, true, "the restored copy is still locked");
    await page.click('.nav-btn[data-view="journal"]');
    assert.match(await page.textContent("#entries-list"), /Locked away/);
    assert.ok(!(await H.storedRaw(page)).includes("Locked away"));
  });
});

test("offline: after one visit the app, a lesson and the Library open with no connection", LIMIT, async () => {
  await withApp({ state: H.savedState() }, async (page, { context }) => {
    // The service worker stores every file in its list; if one is missing the install fails.
    await page.evaluate(async () => {
      for (let i = 0; i < 200; i++) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.active && reg.active.state === "activated" && navigator.serviceWorker.controller) return;
        await new Promise((r) => setTimeout(r, 100));
      }
      throw new Error("The service worker did not install. A file in sw.js's APP_SHELL list is probably missing.");
    });
    const cacheName = await page.evaluate(async () => (await caches.keys())[0]);
    assert.equal(cacheName, `sovereign-v${version}`);
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector("#view-home:not([hidden])");
    await page.click('.nav-btn[data-view="library"]');
    await page.click('[data-lesson="what-is-sexual-energy"]');
    await page.waitForSelector("#lesson-reader:not([hidden]) #lesson-h");
    await page.click('.nav-btn[data-view="guide"]');
    await page.waitForFunction(() => document.querySelector("#view-guide").textContent.length > 500);
    const res = await page.evaluate(async () => (await fetch("library/pdf/tracker-men.pdf")).ok);
    assert.equal(res, true);
  });
});
