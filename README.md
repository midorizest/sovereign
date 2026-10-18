# Sovereign — Cultivation & Mastery (v1.6 · Web + Chrome Extension)

A private, offline-capable practice tracker and teaching app for sexual energy cultivation.
No account, no server, no tracking. Everything stays on the device.

## What's in this build

- **Onboarding**: disclaimer, track (Men / Women), level, name, optional reminder time
- **Daily practice tracker**: grounding, breathwork, meditation (minutes), retention check-in (men), cycle phase (women), journal. Each completed practice earns 10 Sovereign Points.
- **Streaks**: current and longest streak, 7-day strip, and milestone messages at 7 / 14 / 30 / 60 / 90 / 180 / 365 days
- **Guided protocol**: *The 5-Minute Grounding Reset*, with a full-screen timer, step prompts, soft chimes, pause / skip / back. Completing it logs grounding automatically (+15 protocol, +10 practice).
- **Lesson**: *What Is Sexual Energy?* (~700 words, loaded only when opened), with Mark as Complete (+20)
- **Journal**: daily question + 30 rotating prompts, auto-saved drafts, calendar view, entries by month or day
- **Settings**: name, track, level, reminder, dark/light theme, export / import backup (JSON), reset all data
- **Guide tab (new in v1.1)**, with two sections:
  - **Build**: ways to generate and store the energy — sleep, lowering stimulation, ojas nutrition, pelvic floor training, Testicle / Ovarian Breathing, strength training, earth contact, the Microcosmic Orbit, root mudras, and (women's track) cycle seasons and Taoist breast massage.
  - **Apply**: ways to use it in real life — the 90-Second Redirect for urges, turning anger into direction, the Creative First Hour, the Transmutation Sprint, the before-sleep subconscious technique, sealing an intention, grounded presence, pendulum defense, partner practice, movement, belly-based decisions, giving from overflow, and (women's track) planning the month by phase.
  - Each entry has why it works, numbered steps, when to use it, safety notes, and its source. Search works across both sections.
  - **Make this today's focus** pins any entry to Home. Tapping "I applied it" there earns 10 Sovereign Points and counts toward the streak.
- **Deepen (new in v1.2)**: advanced material in the Guide. It opens at Intermediate level or after a 30-day streak, and beginners can choose to open it themselves.
  - **The Inner Sound**: So Hum, AUM, Bija seed mantras, the Six Healing Sounds, Japa (108 repetitions).
  - **Breath for the Inward Journey**: Nadi Shodhana, Bhramari, 4-7-8, Kumbhaka retention, Pratyahara.
  - **Herbal Allies**: a safety primer first, then Ashwagandha, Panax Ginseng, Maca, Schisandra, Tulsi, Gotu Kola, Shilajit, Tongkat Ali (men), Shatavari and Red Raspberry Leaf (women), Damiana, and herbs to approach with great care. Each lists its evidence level, traditional use, and cautions. No doses are given; members are told to follow product labels and talk to a doctor or pharmacist.
  - **Protecting Your Field**: the sealed field, salt and water cleansing, releasing energetic cords, clearing your space.
  - **The Little Black Box**: a phone audit, morning and evening fences, an information diet, and lowering importance.
  - **Creative Channels**: a charged creation ritual, a menu of outlets, seeing your future self.
- **Books (new in v1.2)**: a 25-title reading list on Taoist cultivation, the aura and energy body, breath and mantra, Hermetic thought, herbs, and protecting attention. Titles already in the program's library are marked.
- **Breath & Mantra Pacer (new in v1.2)**: a breathing orb with mantra and nostril cues for 8 patterns, and a 108-bead mala counter. Open it from Deepen ("Practise now") or the Protocols tab. Sessions log automatically to Breathwork or Meditation.
- **New lesson**: *The Energetic Signature* (Intermediate).
- **Sound (new in v1.3)**, under Protocols › Sound. Protocols now has three sub-tabs: Guided · Breath · Sound.
  - Seven presets: Deep Sleep (3 Hz delta), Meditation (6 Hz theta), Schumann Resonance (7.83 Hz with brown noise), Calm Focus (10 Hz alpha with pink noise), Deep Focus (14 Hz beta), Alertness (20 Hz beta), and Peak State (40 Hz gamma, delivered as isochronic pulses).
  - All sound is generated live in `js/sound-engine.js` with the Web Audio API. There are no audio files.
  - Includes a headphone left/right check, a 10–60 minute timer, volume and noise sliders, an 8-second fade-in and 6-second fade-out, and pause/resume.
  - Finished sessions log to Meditation.
  - The player's visuals breathe slowly and never flash at the beat rate.
  - To add or change a preset, edit `SOV.SOUND.presets` in `js/content.js`.
  - **Recommended creator:** fill in `SOV.SOUND.credits` in `js/content.js` (name, url, note) to show a shout-out card with a link at the bottom of the Sound tab. It stays hidden while the url is empty.
- **Gentle reminders and sound fixes (v1.6):**
  - Opt-in reminders, at most two a day: the daily practice reminder (set in Settings) and an optional focus reminder ("Remind me later today" on the Home focus card).
  - Each reminder is skipped if it's already done, and a master On/Off switch sits in Settings.
  - Times follow the device's time zone.
  - The reminder sound is a synthesised "Ouuuum" (or Silent), with a Preview button. In the extension it plays even when the panel is closed, through the offscreen audio page, and never interrupts a sound session in progress.
  - **Noise fix:** pink and brown noise are now generated continuously by an AudioWorklet (`js/noise-worklet.js`) instead of a 10-second loop. The loop seam caused a volume dip every 10 seconds, heard as a "wave". A 30 Hz high-pass also removes sub-audible rumble.
- **Complete content (v1.5):**
  - **11 guided protocols**, grouped by level:
    - Beginner: Grounding Reset, Breath of Fire, Morning Retention Check-In (men), Cycle Syncing (women), Yoni Breathing (women).
    - Intermediate: 15-Minute Transmutation, Mirror Gaze, Womb Meditation (women).
    - Advanced: 2–3 AM Akashic Window, Full Ojas Build (men), Serpent Rising.
  - Intermediate protocols open at Intermediate level or with Deepen open. Advanced protocols open at Advanced level, which members can choose in Settings.
  - Cycle Syncing adapts its prompts to the cycle phase logged on Home.
  - Every protocol shows its setup, steps, benefits, safety notes and sources. Protocol content lives in `js/protocols.js`.
  - **10 lessons** (500–800 words each).
  - **The Planetary Hand** (Guide › Build): a hand diagram of the Vedic finger rulers (after Kurczak & Fish), plus a mudra for each planet (after Hirschi) with a guided practice that logs to Meditation. Content is in `content/hand.js`.
  - The Maker's Verdict and the Priestess Protocol are set aside for a future build.
- **Design pass (v1.4):**
  - Bundled Cormorant Garamond and Plus Jakarta Sans fonts (open-font licences in `fonts/`).
  - Warm-tinted surfaces and a fixed film-grain texture.
  - Nested bezel edges on key cards and a lit gold primary button with an arrow-in-circle call to action.
  - A floating glass navigation bar, spring-curve motion and staggered entry when a view opens.
  - Fewer all-caps labels and lining numerals.
  - Adapted from the taste-skill "redesign" audit (MIT), kept within Sovereign's rules: no frameworks, no network, WCAG AA contrast, and reduced motion respected.
- The remaining protocols and lessons appear as "coming in the next build" so members can see the path ahead.

## File structure

```
sovereign/
├── index.html                  App shell and all screens
├── manifest.json               PWA install settings
├── sw.js                       Service worker (offline caching)
├── css/styles.css              All styling (dark + light themes)
├── js/content.js               All written content: disclaimer, practices, protocols,
│                               lesson list, 30 journal prompts, milestone messages
├── js/app.js                   All app logic
├── content/
│   ├── lesson-what-is-sexual-energy.js   Lesson text (lazy-loaded)
│   ├── guide.js                Build / Apply guide content (lazy-loaded)
│   ├── deepen.js               Deepen content, Books list, pacer patterns
│   └── lesson-energetic-signature.js
└── icons/                      App icons (SVG + PNG + maskable)
```

To edit any wording, open `js/content.js` (or `content/guide.js` / `content/deepen.js` for the Guide). You never need to touch `app.js` for content.

## Running it on your Chromebook

The app must be served over **https** (or from `localhost`) for offline mode and the
"Install" button to work. Simply double-clicking `index.html` will open it, but it won't
work offline or install. Choose **one** of the options below.

### Option A — Netlify Drop (easiest, free, about 2 minutes)

1. Unzip `sovereign.zip` in the Files app (double-click it, then copy the `sovereign`
   folder into *My files › Downloads*).
2. In Chrome, go to **app.netlify.com/drop**.
3. Drag the `sovereign` folder onto the page. You'll get a web address like
   `https://something-random.netlify.app`.
4. Open that address. (Optional: create a free account to keep the site permanently and rename it.)
5. Install it (see below). You can share this same address with your members.

### Option B — GitHub Pages (free, permanent)

1. Create a free GitHub account and a new **public** repository called `sovereign`.
2. Click **Add file › Upload files**, drag in everything inside the `sovereign` folder, and commit.
3. Go to **Settings › Pages**, set *Source* to **Deploy from a branch**, branch **main**, folder **/ (root)**, then Save.
4. After a minute, your app is live at `https://YOUR-USERNAME.github.io/sovereign/`.

### Option C — Fully local, using the Chromebook's Linux environment

1. Turn on Linux: **Settings › About ChromeOS › Developers › Linux development environment › Set up**.
2. In the Files app, drag the `sovereign` folder into **Linux files**.
3. Open the **Terminal** app and run:
   ```
   cd ~/sovereign
   python3 -m http.server 8080
   ```
4. In Chrome, open **http://localhost:8080**. Keep the Terminal window open while you first load and install the app. After installing, it runs offline without the server.

### Installing it to your shelf

1. With the app open in Chrome, look for the **install icon** (a monitor with a down arrow) at the right end of the address bar, or open the **⋮ menu › Cast, save and share › Install page as app…** (on older versions: *⋮ › Install Sovereign*).
2. Click **Install**. Sovereign opens in its own window.
3. To pin it, right-click its icon on the shelf and choose **Pin**.
4. Open it once while online; after that it works fully offline.

## Your data

- Data is saved in the browser's local storage on that one device and browser profile.
- **Clearing browsing data (cookies and site data) erases it.** Use **Settings › Export backup** regularly; the file lands in your Downloads folder. **Import backup** restores it, including onto a new device.
- The app asks Chrome to protect its storage from automatic clean-up, and shows a backup reminder on Home every two weeks.

## Shipping updates

When you change any file, open `sw.js` and bump `CACHE_VERSION` (e.g. `sovereign-v1.0.1`).
Users get the new version the next time they open the app while online and then reopen it.
If you add new files, add them to the `APP_SHELL` list in `sw.js`.

## Known limitations

- **Reminders only fire while the app is open or minimised.** A web app with no server
  cannot wake itself at a set time. When the reminder time has passed and nothing has been
  practised, a banner also appears on Home.
- **Fonts:** to keep the app 100% offline with no CDN, it uses Cormorant Garamond / Playfair
  Display if installed, otherwise elegant system serifs (Palatino, Georgia). On a Chromebook
  this looks close to the design; to bundle Cormorant exactly, add the `.woff2` files to a
  `fonts/` folder and an `@font-face` rule, and list them in `sw.js`.
- **One device per person.** There's no sync. Members move data between devices with export/import.
- **Not a multi-member admin tool.** Each member installs their own copy; you can't see their progress. That's by design (privacy), but it means accountability is self-reported.
- **Streak rule:** any logged practice, protocol or journal entry counts the day. A streak stays alive until the end of the following day.
- **Changing the device clock** can affect streaks, since dates come from the device.
- The lesson and protocol wording draws on traditional teachings and is framed as such; review it against your own program before sharing with members.

---

# Chrome Extension (side panel)

The same app also ships as a Chrome extension. Clicking the toolbar icon opens Sovereign in Chrome's **side panel**. The ⤢ arrow at the top opens the **full view** in a tab. Both stay in sync live.

What's different from the web version:
- **Real reminders:** the daily reminder arrives as a Chrome notification even when Sovereign is closed. It's skipped if you've already practised that day. Clicking it opens the full view.
- **Storage:** data is kept in Chrome's extension storage. Clearing browsing data won't erase it, but **uninstalling the extension will**, so keep exporting backups.
- **Offline:** always works offline. All files are inside the extension.
- **Sound in the background:** sound sessions keep playing after you close the side panel. Chrome closes the hidden audio page if it stays silent for 30 seconds (for example, with the volume at zero). The minutes already completed are still logged.

## Extension files
```
extension/manifest.json        Manifest V3: side panel, permissions, icons, version
extension/background.js        Toolbar → side panel; daily reminder; sound-session logging
extension/offscreen.html/.js   Hidden audio page so sound keeps playing when the panel closes
build_extension.py             Builds dist/ from the shared source
dist/sovereign-extension/      Built extension (Load unpacked this folder)
dist/sovereign-extension-1.6.0.zip   Upload this to the Chrome Web Store
privacy.html                   Privacy policy (publish it; the store requires a URL)
STORE_LISTING.md               Every field for the store dashboard, ready to paste
store-assets/                  Icon, 5 screenshots, promo tiles (exact required sizes)
```

## Testing the extension on your Chromebook
1. Unzip `sovereign-extension-1.6.0.zip` into a folder in *My files › Downloads*.
2. In Chrome, go to `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the unzipped folder (the one containing `manifest.json`).
4. Pin Sovereign: click the puzzle-piece icon in the toolbar, then the pin next to Sovereign.
5. Click the Sovereign icon. The side panel opens.
6. To test a reminder, set it a couple of minutes ahead in Settings, close the panel, and wait.

After changing any files, click the ↻ reload button on Sovereign's card in `chrome://extensions`.

## Rebuilding after changes
Content and app files are shared, so edit them once in the source folder. Then:
```
python3 build_extension.py
```
This needs Python 3 and Pillow (`pip install pillow`). On a Chromebook, run it in the Linux terminal. Remember to bump `"version"` in `extension/manifest.json` before each store upload.

## Publishing the privacy policy
The store needs a public privacy-policy URL.
1. The support email (themidoriway@gmail.com) is already set in `privacy.html`. To change it later, edit both places in the Contact section.
2. Publish it alongside the web app. If you use GitHub Pages (Option B above), upload `privacy.html` with the other files. It will live at `https://YOUR-USERNAME.github.io/sovereign/privacy.html`.

## Submitting
Follow `STORE_LISTING.md` top to bottom: package, listing text, images, privacy answers, distribution, reviewer notes, and a final checklist.
