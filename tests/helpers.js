/* Shared test helpers: a tiny static server for the app, a browser, and
   ways to start the app with saved data and a fixed date. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const STORAGE_KEY = "sovereign.v1";
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".gif": "image/gif", ".woff": "font/woff", ".woff2": "font/woff2",
  ".pdf": "application/pdf", ".txt": "text/plain", ".wav": "audio/wav"
};

/** Serve the repo root, the same way GitHub Pages or `python3 -m http.server` would. */
function startServer() {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end("not found"); return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () =>
    resolve({ url: `http://localhost:${server.address().port}/`, close: () => new Promise((r) => server.close(r)) })));
}

/* The tests run at a fixed moment: 11:30 pm on 10 March 2026 in New York.
   That is already 11 March in UTC, and two days after the clocks changed,
   so any date handled in UTC or in fixed 24-hour steps shows up as a failure. */
const TODAY = "2026-03-10";
const NOW = new Date("2026-03-11T03:30:00Z");
const TIMEZONE = "America/New_York";

/** "2026-03-10" shifted by n days (plain calendar arithmetic). */
function dayKey(offset) {
  const [y, m, d] = TODAY.split("-").map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + offset));
  return x.toISOString().slice(0, 10);
}

const profile = (over = {}) => ({ name: "Tester", track: "men", level: "beginner", reminder: "", createdAt: "2026-01-01T12:00:00.000Z", ...over });
/** A saved-data object as the app stores it; anything left out is filled in by the app. */
const savedState = (over = {}) => ({ version: 1, profile: profile(), days: {}, journal: [], lessons: {}, daycycle: { introSeen: true }, ...over });
const practisedDay = () => ({ practices: { grounding: { done: true, min: 5 } }, protocols: [] });

let browser;
async function getBrowser() { return (browser = browser || await chromium.launch()); }
async function closeBrowser() { if (browser) await browser.close(); browser = null; }

/**
 * Open the app in a fresh browser profile.
 *   state: saved data to start with (omit for a first-time visitor)
 * Returns { page, context, errors } — errors collects anything the page logged as an error.
 */
async function openApp(baseUrl, { state, now = NOW } = {}) {
  const b = await getBrowser();
  const context = await b.newContext({ timezoneId: TIMEZONE, locale: "en-US", acceptDownloads: true, serviceWorkers: "allow" });
  await context.clock.setFixedTime(now);
  if (state) {
    // Seed once per profile, so a reload keeps whatever the app saved since.
    await context.addInitScript(([key, value]) => {
      if (!localStorage.getItem("test.seeded")) { localStorage.setItem("test.seeded", "1"); localStorage.setItem(key, value); }
    }, [STORAGE_KEY, JSON.stringify(state)]);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(10000); // fail quickly and clearly rather than hang
  const errors = [];
  page.on("pageerror", (e) => errors.push(`page error: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console error: ${m.text()}`); });
  await page.goto(baseUrl);
  return { page, context, errors };
}

/** What the app has saved, parsed. */
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORAGE_KEY);
const storedRaw = (page) => page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);

/** Click a button in the app's dialog by its value ("yes", "no", "ok"). */
const dialogClick = (page, value) => page.click(`#dialog[open] #dialog-actions button[value="${value}"]`);

/** Turn on App lock through Settings. */
async function enableLock(page, passcode) {
  await page.click("#open-settings");
  await page.click("#sec-on");
  await page.fill("#pass-new", passcode);
  await page.fill("#pass-confirm", passcode);
  await dialogClick(page, "yes");
  await page.waitForSelector("#sec-off");
  await page.click("#close-settings");
}

/** Write and save a journal entry. */
async function writeJournal(page, text) {
  await page.click('.nav-btn[data-view="journal"]');
  await page.fill("#journal-text", text);
  await page.click("#journal-save");
  await page.waitForFunction((t) => document.querySelector("#entries-list").textContent.includes(t), text);
}

/** Export a backup from Settings and return its text. */
async function exportBackup(page) {
  await page.click("#open-settings");
  const [download] = await Promise.all([page.waitForEvent("download"), page.click("#set-export")]);
  const text = fs.readFileSync(await download.path(), "utf8");
  await page.click("#close-settings");
  return { text, filename: download.suggestedFilename() };
}

/** Choose a backup file in Settings › Import backup. */
async function chooseImport(page, text, name = "sovereign-backup.json") {
  await page.click("#open-settings");
  await page.setInputFiles("#set-import-file", { name, mimeType: "application/json", buffer: Buffer.from(text) });
}

module.exports = { ROOT, STORAGE_KEY, TODAY, NOW, dayKey, profile, savedState, practisedDay, startServer, getBrowser, closeBrowser,
  openApp, stored, storedRaw, dialogClick, enableLock, writeJournal, exportBackup, chooseImport };
