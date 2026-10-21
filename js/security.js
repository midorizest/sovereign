/* ==========================================================================
   SOVEREIGN — Security helpers (Web Crypto, built into the browser)
   - Key derivation: PBKDF2-SHA-256, 600,000 iterations, random 16-byte salt
   - Encryption: AES-256-GCM with a random 12-byte IV per message
   Nothing here ever leaves the device. The passcode itself is never stored;
   only a salt and a small encrypted "check" value used to verify it.
   ========================================================================== */
(function (root) {
  "use strict";
  const ITERATIONS = 600000;
  const CHECK_TEXT = "sovereign-check-v1";
  const enc = new TextEncoder(), dec = new TextDecoder();

  const b64 = (buf) => {
    const bytes = new Uint8Array(buf); let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const unb64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  const randomB64 = (n) => b64(crypto.getRandomValues(new Uint8Array(n)));

  /** Derive an AES-GCM key from a passcode and salt. extractable lets the
      extension keep the unlocked key in memory-only session storage. */
  async function deriveKey(passcode, saltB64, iterations = ITERATIONS) {
    const base = await crypto.subtle.importKey("raw", enc.encode(passcode.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt: unb64(saltB64), iterations },
      base, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  }

  async function encryptText(key, text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
    return { iv: b64(iv), ct: b64(ct) };
  }
  async function decryptText(key, box) {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, key, unb64(box.ct));
    return dec.decode(pt);
  }
  const encryptJSON = async (key, obj) => encryptText(key, JSON.stringify(obj));
  const decryptJSON = async (key, box) => JSON.parse(await decryptText(key, box));

  /** Create the stored lock record for a new passcode. Returns { record, key }. */
  async function createLock(passcode) {
    const salt = randomB64(16);
    const key = await deriveKey(passcode, salt);
    const check = await encryptText(key, CHECK_TEXT);
    return { record: { enabled: true, salt, iter: ITERATIONS, check }, key };
  }
  /** Check a passcode against a lock record. Returns the key, or null if wrong. */
  async function unlock(passcode, record) {
    try {
      const key = await deriveKey(passcode, record.salt, record.iter || ITERATIONS);
      return (await decryptText(key, record.check)) === CHECK_TEXT ? key : null;
    } catch (_) { return null; }
  }

  const exportKey = async (key) => b64(await crypto.subtle.exportKey("raw", key));
  const importKey = (raw) => crypto.subtle.importKey("raw", unb64(raw), { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);

  root.SovSecure = { deriveKey, encryptText, decryptText, encryptJSON, decryptJSON, createLock, unlock, exportKey, importKey, ITERATIONS };
})(typeof window !== "undefined" ? window : self);
