# Sovereign for Android (beta)

GitHub Actions builds this automatically on every push to `main`
(`.github/workflows/android.yml`) and posts the APK to the **beta** release:
https://github.com/midorizest/sovereign/releases/tag/beta

- `prepare-web.mjs` copies the web app into `www/` and allows Capacitor's inline bridge in the CSP.
- `res/` holds the launcher icons, splash, notification icon and the Om notification sound.
- `debug.keystore` is the standard public Android debug key (password `android`). It lets each new
  beta install over the previous one. **It is not secret.** Before sharing the app widely or using
  the Play Store, sign with a private release key instead.
