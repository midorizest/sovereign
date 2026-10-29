# Sovereign for Android (beta)

GitHub Actions builds this automatically on every push to `main`
(`.github/workflows/android.yml`) and posts the APK to the **beta** release:
https://github.com/midorizest/sovereign/releases/tag/beta

- `prepare-web.mjs` copies the web app into `www/` and allows Capacitor's inline bridge in the CSP.
- `res/` holds the launcher icons, splash, notification icon and the Om notification sound.
- APKs are signed with Sovereign's private release key, supplied by two GitHub Actions secrets:
  `KEYSTORE_BASE64` (the .p12 keystore, base64) and `KEYSTORE_PASSWORD`. The key alias is `sovereign`.
  `native/sign_gradle.py` wires it into the generated Gradle build. Nothing secret lives in this repo.
  Keep a safe copy of the keystore: every future update must be signed with the same key.
