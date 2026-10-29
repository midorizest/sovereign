// Copies the Sovereign web app (the repo root) into ./www for Capacitor.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const SRC = join(import.meta.dirname, ".."), OUT = join(import.meta.dirname, "www");
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT);
for (const p of ["index.html", "manifest.json", "css", "js", "content", "fonts", "icons", "library"]) cpSync(join(SRC, p), join(OUT, p), { recursive: true });
// Capacitor's runtime, loaded before the app scripts.
const core = join(import.meta.dirname, "node_modules/@capacitor/core/dist/capacitor.js");
let html = readFileSync(join(OUT, "index.html"), "utf8");
if (existsSync(core)) {
  cpSync(core, join(OUT, "js/capacitor.js"));
  html = html.replace(/<script/, '<script src="js/capacitor.js"></script>\n  <script');
}
// Capacitor injects its native bridge as an inline script, so the CSP must allow it.
html = html.replace(/script-src 'self'/, "script-src 'self' 'unsafe-inline'");
writeFileSync(join(OUT, "index.html"), html);
// The Library page gets the same allowance for Capacitor's injected bridge.
const libHtml = join(OUT, "library/index.html");
if (existsSync(libHtml)) writeFileSync(libHtml, readFileSync(libHtml, "utf8").replace(/script-src 'self'/, "script-src 'self' 'unsafe-inline'"));
console.log("www ready", existsSync(core) ? "(with capacitor.js)" : "(bridge only)");
