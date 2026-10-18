# Chrome Web Store Submission — Sovereign v1.6.0

Copy each field below into the Chrome Web Store Developer Dashboard (chrome.google.com/webstore/devconsole). Everything here matches what the extension actually does, which is what reviewers check.

---

## 1. Package
Upload: `sovereign-extension-1.6.0.zip` (the zip itself, not unzipped)

## 2. Store listing tab

**Name** (max 75 characters)
> Sovereign — Energy Cultivation

**Summary** (max 132 characters; taken from the manifest)
> A private practice tracker and guide for energy cultivation: breathwork, mantra, binaural beats, journaling and streaks.

**Description**
> Sovereign is a calm, private companion for sexual energy cultivation and self-mastery. It lives in Chrome's side panel, so your practice sits quietly beside whatever you're doing. Open the full view whenever you want more room.
>
> DAILY PRACTICE
> • A daily checklist: grounding, breathwork, meditation and journaling
> • Track-specific check-ins: retention for men, menstrual-cycle awareness for women
> • Streaks, Sovereign Points and milestone messages at 7, 14, 30, 60, 90, 180 and 365 days
> • Optional, gentle reminders (never more than two a day) with a calming "Om" sound, for your daily practice and your chosen focus
>
> GUIDED PRACTICE
> • 11 guided protocols with timers and step-by-step prompts, from the 5-Minute Grounding Reset and Breath of Fire to the Microcosmic Orbit-based Transmutation Practice, Mirror Gaze, and advanced practices, with dedicated women's practices (Cycle Syncing, Yoni Breathing, the Womb Meditation)
> • A breath and mantra pacer: So Hum, AUM, the Bija seed sounds, the Six Healing Sounds, alternate nostril, bee breath, 4-7-8 and retention
> • A 108-bead mala counter for japa practice
>
> SOUND
> • Binaural beats and isochronic tones generated live on your device: Deep Sleep (delta), Meditation (theta), Schumann Resonance (7.83 Hz), Calm Focus (alpha), Deep Focus and Alertness (beta), and Peak State (gamma)
> • Headphone left/right check, session timer, volume and noise mix, gentle fades
> • Sessions keep playing when the side panel is closed, and log to your practice automatically
>
> THE GUIDE
> • Build: sleep, pelvic floor training, Taoist root breathing, the Microcosmic Orbit, and the Planetary Hand: a mudra for each planet, with a hand diagram and guided practice
> • Apply: redirecting urges, creative work, grounded presence, decisions, relationships
> • Deepen (for experienced practitioners): mantra and chant, inward breathwork, traditional herbal allies with safety notes, energetic protection, reducing digital overload, and creative channels
> • Books: a curated reading list on the energy body, aura, breath, sound and Hermetic philosophy
>
> LESSONS & JOURNAL
> • Ten short lessons: sexual energy, the science of retention, grounding, breathwork, transmutation, the Hermetic principles, the planetary hand, common pitfalls, and more
> • A private journal with daily prompts and a calendar view
>
> PRIVATE BY DESIGN
> • No account, no sign-in, no servers, no analytics, no ads
> • Everything is stored only on your device
> • Export and import your data as a backup file at any time
>
> Sound sessions are aids to relaxation and focus, not treatments. Use headphones at a low volume, and don't listen while driving.
>
> Sovereign draws on Taoist, yogic, Ayurvedic and Hermetic traditions and presents them as frameworks for practice. It is an educational and tracking tool, not a medical device, and does not provide medical advice. For adults 18+.

**Category**
> Lifestyle (choose "Well-being" if it is offered as a sub-category)

**Language**
> English

**Graphic assets** (all in `store-assets/`)
| Field | File |
|---|---|
| Store icon (128×128) | `store-icon-128.png` |
| Screenshots (1280×800, up to 5) | `screenshot-1-1280x800.jpg` … `screenshot-5-1280x800.jpg` |
| Small promo tile (440×280) | `promo-small-440x280.png` |
| Marquee promo tile (1400×560, optional) | `promo-marquee-1400x560.png` |

**Official URL / Homepage** (optional)
> https://midorizest.github.io/sovereign/

**Support URL or email**
> themidoriway@gmail.com

**Publisher name** (Account page)
> Your choice, e.g. The Midori Way. Shown as "Offered by".

**Mature content**
> ✅ Yes, mark the item as containing mature content.
> The app has no nudity or explicit material, but its subject (sexual energy, retention, partner practice) isn't suitable for all ages. Marking it Mature is what the policy asks for, and it avoids a rejection.

## 3. Privacy practices tab

**Single purpose description**
> Sovereign is a private practice tracker and guide for sexual energy cultivation. It helps adults log daily practices (grounding, breathwork, meditation, journaling), follow guided breath and mantra exercises, read educational content, and track streaks. All data stays on the user's device.

**Permission justifications**
| Permission | Justification |
|---|---|
| `storage` | Saves the user's practice log, journal entries and settings locally on their device with chrome.storage.local. Nothing is transmitted. |
| `alarms` | Schedules the user's optional reminders: a daily practice reminder they set in Settings, and a one-time reminder for that day's focus if they choose one. Nothing is scheduled unless the user sets a time. |
| `notifications` | Displays those reminders, each only if the practice or focus hasn't been completed yet that day. At most two per day. |
| `sidePanel` | Sovereign's main interface opens in Chrome's side panel when the user clicks the toolbar icon. |
| `offscreen` | Plays the user's binaural-beat and meditation sound sessions (generated locally with the Web Audio API) so a session the user started keeps playing when they close the side panel. Used only for audio playback. |

**Host permissions**
> None requested.

**Are you using remote code?**
> No, I am not using remote code. All JavaScript is included in the package. The extension makes no network requests. Audio is synthesised locally with the Web Audio API; there are no audio files or streams.

**Data usage**
Leave every data-collection category **unchecked**. Sovereign stores information locally but never collects or transmits it, so none of the categories apply.

Then tick all three certifications:
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL**
> https://midorizest.github.io/sovereign/privacy.html

## 4. Distribution tab

**Visibility.** I recommend **Unlisted** for the first release:
- Only people with the link can find and install it, which suits an enrolled-member program.
- You can share the link with members and gather feedback before going Public.
- Unlisted items still go through the same review.

**Regions:** all regions, or the ones where your program operates.

**Pricing:** free. Chrome Web Store payments are no longer offered; if you charge for the program, do it outside the store.

## 5. Notes for the reviewer (optional field; paste this)
> No account or login is needed. On first open, read and accept the disclaimer, then choose a track (Men or Women), a level (choose "Advanced" to see all content, including the advanced protocols and lessons), and a name. The side panel opens from the toolbar icon. The arrow icon at the top opens the full view in a tab. Settings (gear icon) holds export, import and reset. Sound sessions are under Protocols › Sound. The extension stores data only in chrome.storage.local and makes no network requests.

---

## Before you submit: checklist
- [ ] Verify your contact email (themidoriway@gmail.com) on the dashboard's Account page
- [ ] Turn on 2-Step Verification on your Google account (required to publish)
- [x] Support email added to `privacy.html` and published at https://midorizest.github.io/sovereign/privacy.html
- [ ] Test the unpacked extension yourself (README › "Testing the extension")
- [ ] Re-read the partner-practice and breast-massage entries in the Guide. They're non-explicit, but they're the content a reviewer is most likely to look at closely.
- [ ] Upload the zip, fill in every field above, and submit for review (usually a few days; sensitive topics can take longer)

## Shipping updates later
1. Make your changes in the source folder.
2. Bump `"version"` in `extension/manifest.json` (e.g. `1.2.1`). The store rejects a repeat version number.
3. Run `python3 build_extension.py`.
4. Upload the new zip in the dashboard and submit it. Members update automatically.
