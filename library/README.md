# Sovereign Library: drop-in module

A Library section for the Sovereign app. It opens the printables inside the app exactly as designed, with every line, box and dot fillable. Entries save on the device automatically.

## What's in the folder

```
library/
  index.html        the Library page (shelf + reader)
  library.js        reader logic, autosave, Save a copy, Start fresh
  library.css       Sovereign styling (ink, gold, Cormorant + Plus Jakarta)
  catalog.js        the list of books; add new printables here
  pdf/              the PDFs (40-Day Tracker, Men's and Women's)
  covers/           page-1 cover images for the shelf
  fonts/            bundled fonts (OFL), so it works offline
  vendor/pdfjs/     Mozilla pdf.js 4.10.38, legacy build (Apache-2.0)
```

Everything is local. Nothing loads from the internet, so it works offline inside the APK.

## Adding it to the app

1. Copy the whole `library/` folder into the app's web assets, next to the app's own `index.html`.
2. Add a button or tab that opens it, passing the user's track:
   - `library/index.html?track=men` or `library/index.html?track=women`
   - Optional `&back=../index.html` shows a back arrow on the shelf.
   - You can also set `window.SOVEREIGN_TRACK = "men"` before loading.
   The user's own edition appears under "For you" and the other edition under "Also in the library".
3. If the app has a service worker, add the files in `precache.txt` to its cache list.

It needs to be served over http(s) (for example `https://localhost` in Capacitor or a TWA, or the app's existing server). Android WebView blocks ES modules loaded from plain `file://` URLs.

## How saving works

- Every change is saved to IndexedDB on the device within about half a second. It also saves when the app goes to the background.
- Entries are stored by field name, so if a PDF is re-exported with the same field names, saved entries carry over.
- Each book also remembers the last page the user was on.
- **Save a copy** writes a filled PDF. It uses the Android share sheet when one is available, and a download otherwise. If the native shell exposes `window.SovereignBridge.savePdf(filename, base64)`, that is used instead.
- **Start fresh** clears that book's entries after a confirmation.
- The Android back button closes a book and returns to the shelf.

The app's existing Export in Settings doesn't include Library entries yet. They live in the `sovereign-library` IndexedDB database, under the `entries` store.

## Adding another printable

1. Put the PDF in `pdf/`.
2. Make a cover: `pdftoppm -r 110 -jpeg -f 1 -l 1 -singlefile book.pdf covers/book`
3. Add an entry to `catalog.js` with its id, title, edition, blurb, track (`men`, `women` or `all`), file, cover, page count and contents page.

The boxes on the 40-Day Trackers are small on a phone. The + button zooms in for easier tapping.
