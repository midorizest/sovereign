/* The encryption helpers on their own (js/security.js), run in Node. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadSecurity() {
  const sandbox = { crypto: globalThis.crypto, TextEncoder, TextDecoder, btoa, atob, Uint8Array, String, JSON };
  sandbox.self = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "js", "security.js"), "utf8"), sandbox);
  return sandbox.SovSecure;
}
const S = loadSecurity();

test("a passcode opens its own lock and nothing else does", async () => {
  const { record, key } = await S.createLock("correct horse battery");
  assert.ok(key);
  assert.ok(await S.unlock("correct horse battery", record), "right passcode");
  assert.equal(await S.unlock("correct horse batterx", record), null, "wrong passcode");
  assert.equal(await S.unlock("", record), null, "empty passcode");
});

test("the lock record never contains the passcode", async () => {
  const { record } = await S.createLock("my-secret-passcode");
  assert.ok(!JSON.stringify(record).includes("my-secret-passcode"));
  assert.equal(record.iter, 600000, "PBKDF2 work factor");
});

test("text and data survive encryption, and look nothing like the original", async () => {
  const { key } = await S.createLock("passcode");
  const text = "Day 12 — held. Émotions, 漢字, and emoji 🌙 all intact.";
  const box = await S.encryptText(key, text);
  assert.ok(!JSON.stringify(box).includes("held"));
  assert.equal(await S.decryptText(key, box), text);
  const data = { journal: [{ id: "a", text: "private" }], n: 3 };
  assert.deepEqual(await S.decryptJSON(key, await S.encryptJSON(key, data)), data);
});

test("the same text encrypts differently every time", async () => {
  const { key } = await S.createLock("passcode");
  const a = await S.encryptText(key, "same"), b = await S.encryptText(key, "same");
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ct, b.ct);
});

test("tampered or wrongly-keyed data is refused rather than misread", async () => {
  const one = await S.createLock("passcode-one"), two = await S.createLock("passcode-two");
  const box = await S.encryptText(one.key, "private entry");
  await assert.rejects(S.decryptText(two.key, box), "another passcode's key");
  const raw = Buffer.from(box.ct, "base64"); raw[0] ^= 1;
  await assert.rejects(S.decryptText(one.key, { iv: box.iv, ct: raw.toString("base64") }), "altered data");
});

test("an unlocked key can be handed to the extension's session storage and back", async () => {
  const { key } = await S.createLock("passcode");
  const box = await S.encryptText(key, "hello");
  const again = await S.importKey(await S.exportKey(key));
  assert.equal(await S.decryptText(again, box), "hello");
});
