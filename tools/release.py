#!/usr/bin/env python3
"""
One place to set Sovereign's version and keep its file lists in step.

    python3 tools/release.py              check only (this is what CI runs)
    python3 tools/release.py 1.17.0       set the version everywhere, refresh the lists
    python3 tools/release.py --fix        refresh the file lists, keep the version

The version lives in extension/manifest.json. Everything else is written from it:
js/app.js, sw.js (the offline cache name), android-build/package.json, and the
version mentions in README.md and STORE_LISTING.md.

Two file lists are also kept current, so a new file can never be left out of the
offline copy:
  - APP_SHELL in sw.js           every file the web app needs offline
  - library/precache.txt         the Library's own list
The check also confirms build_extension.py ships every app file.
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "extension" / "manifest.json"

# (file, pattern with the version in group 2, human description)
VERSION_SPOTS = [
    ("js/app.js", r'(const APP_VERSION = ")([^"]+)(")', "APP_VERSION"),
    ("sw.js", r'(const CACHE_VERSION = "sovereign-v)([^"]+)(")', "CACHE_VERSION"),
    ("android-build/package.json", r'("version": ")([^"]+)(")', "version"),
    ("README.md", r"(^# Sovereign — Cultivation & Mastery \(v)([\d.]+)( )", "title"),
    ("README.md", r"(sovereign-extension-)(\d+\.\d+\.\d+)(\.zip)", "extension zip name"),
    ("STORE_LISTING.md", r"(^# Chrome Web Store Submission — Sovereign v)([\d.]+)($)", "title"),
    ("STORE_LISTING.md", r"(sovereign-extension-)(\d+\.\d+\.\d+)(\.zip)", "extension zip name"),
]


def tracked_files():
    """Files in the repo (tracked, or new and not ignored), as posix paths."""
    out = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard"],
                         cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return [f for f in out.splitlines() if (ROOT / f).is_file()]


def app_files(files):
    """Everything the web app serves: what must be available offline."""
    keep = []
    for f in files:
        if f in ("index.html", "manifest.json"):
            keep.append(f)
        elif f.startswith(("css/", "js/", "content/", "icons/")):
            keep.append(f)
        elif f.startswith("fonts/") and f.endswith((".woff", ".woff2")):
            keep.append(f)
        elif f.startswith("library/") and f not in ("library/README.md", "library/precache.txt"):
            keep.append(f)
    return keep


def synced(existing, wanted):
    """Keep the existing order, drop what's gone, append what's new (sorted)."""
    wanted_set = set(wanted)
    kept = [f for f in existing if f in wanted_set]
    return kept + sorted(wanted_set - set(kept))


def sub_version(text, pattern, version):
    return re.subn(pattern, lambda m: m.group(1) + version + m.group(3), text, flags=re.M)


def main():
    args = sys.argv[1:]
    new_version = next((a for a in args if re.fullmatch(r"\d+\.\d+\.\d+", a)), None)
    fix = "--fix" in args or new_version is not None
    unknown = [a for a in args if a != "--fix" and a != new_version]
    if unknown:
        sys.exit(f"Not understood: {' '.join(unknown)}\n{__doc__}")

    problems, changed = [], []
    texts = {}

    def read(rel):
        if rel not in texts:
            texts[rel] = (ROOT / rel).read_text(encoding="utf-8")
        return texts[rel]

    def want(rel, new_text, what):
        if new_text == read(rel):
            return
        if fix:
            texts[rel] = new_text
            changed.append(f"{rel}: {what}")
        else:
            problems.append(f"{rel}: {what}")

    # ---- Version ----
    manifest = json.loads(read("extension/manifest.json"))
    version = new_version or manifest["version"]
    if new_version and new_version != manifest["version"]:
        want("extension/manifest.json",
             re.sub(r'("version": ")[^"]+(")', rf"\g<1>{version}\g<2>", read("extension/manifest.json"), count=1),
             f"version {manifest['version']} -> {version}")
    for rel, pattern, name in VERSION_SPOTS:
        new_text, n = sub_version(read(rel), pattern, version)
        if n == 0:
            problems.append(f"{rel}: could not find the {name} to check")
            continue
        found = re.search(pattern, read(rel), flags=re.M).group(2)
        want(rel, new_text, f"{name} says {found}, should be {version}")

    # ---- Offline file list in sw.js ----
    files = tracked_files()
    wanted = app_files(files)
    sw = read("sw.js")
    block = re.search(r"const APP_SHELL = \[\n(.*?)\n\];", sw, flags=re.S)
    if not block:
        problems.append("sw.js: could not find the APP_SHELL list")
    else:
        listed = [e[2:] for e in re.findall(r'"(\./[^"]+)"', block.group(1))]
        for f in sorted(set(wanted) - set(listed)):
            if not fix:
                problems.append(f"sw.js: {f} is missing from APP_SHELL (it would not work offline)")
        for f in sorted(set(listed) - set(wanted)):
            if not fix:
                problems.append(f"sw.js: APP_SHELL lists {f}, which does not exist (the offline install would fail)")
        if fix and set(listed) != set(wanted):
            entries = ['  "./"'] + [f'  "./{f}"' for f in synced(listed, wanted)]
            texts["sw.js"] = sw[:block.start(1)] + ",\n".join(entries) + sw[block.end(1):]
            changed.append("sw.js: APP_SHELL refreshed")

    # ---- The Library's own list ----
    lib_wanted = [f for f in wanted if f.startswith("library/")]
    lib_listed = read("library/precache.txt").split()
    if set(lib_listed) != set(lib_wanted):
        want("library/precache.txt", "\n".join(synced(lib_listed, lib_wanted)) + "\n", "does not match the files in library/")

    # ---- The extension build must ship every app file ----
    sys.path.insert(0, str(ROOT))
    sys.dont_write_bytecode = True
    from build_extension import SHARED
    for f in wanted:
        if f.startswith(("js/", "content/", "css/")) or f == "index.html":
            if f not in SHARED:
                problems.append(f"build_extension.py: {f} is missing from SHARED (the extension would ship without it)")
    for f in SHARED:
        if not (ROOT / f).is_file():
            problems.append(f"build_extension.py: SHARED lists {f}, which does not exist")

    # ---- Every script the page loads must exist ----
    for src in re.findall(r'<script src="([^"]+)"', read("index.html")):
        if not (ROOT / src).is_file():
            problems.append(f"index.html: loads {src}, which does not exist")

    if fix:
        for rel, text in texts.items():
            if text != (ROOT / rel).read_text(encoding="utf-8"):
                (ROOT / rel).write_text(text, encoding="utf-8")
        for c in changed:
            print("updated ", c)
    if problems:
        print(f"\n{len(problems)} problem(s):")
        for p in problems:
            print("  -", p)
        if not fix:
            print("\nRun  python3 tools/release.py --fix  to repair the version and file lists.")
        sys.exit(1)
    print(f"Sovereign {version}: version and file lists are consistent"
          + (f" ({len(changed)} file change(s) written)." if changed else "."))


if __name__ == "__main__":
    main()
